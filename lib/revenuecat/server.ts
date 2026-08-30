import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "../../src/db";
import { users } from "../../src/db/schema";
import { ENTITLEMENT_CACHE_TTL_MS } from "./constants";
import {
  cacheAllowsAccess,
  parseSubscriberEntitlement,
  type EntitlementSnapshot,
} from "./entitlement";

function secretApiKey() {
  return process.env.REVENUECAT_SECRET_API_KEY?.trim() ?? "";
}

async function getCachedEntitlement(userId: string) {
  const [row] = await db
    .select({
      entitlementActive: users.entitlementActive,
      entitlementExpiresAt: users.entitlementExpiresAt,
      entitlementCheckedAt: users.entitlementCheckedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row ?? null;
}

async function writeEntitlementCache(
  userId: string,
  snapshot: EntitlementSnapshot,
) {
  const now = new Date();
  await db
    .update(users)
    .set({
      entitlementActive: snapshot.active,
      entitlementExpiresAt: snapshot.expiresAt,
      entitlementCheckedAt: now,
    })
    .where(eq(users.id, userId));
}

async function fetchSubscriberEntitlement(
  userId: string,
): Promise<EntitlementSnapshot> {
  const apiKey = secretApiKey();
  if (!apiKey) {
    throw new Error("REVENUECAT_SECRET_API_KEY is not set.");
  }

  const response = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        "X-Platform": "web",
      },
      cache: "no-store",
    },
  );

  if (response.status === 404) {
    return { active: false, expiresAt: null, managementUrl: null };
  }

  if (!response.ok) {
    throw new Error(`RevenueCat subscriber lookup failed (${response.status}).`);
  }

  const payload: unknown = await response.json();
  return parseSubscriberEntitlement(payload);
}

export async function refreshEntitlementCache(
  userId: string,
): Promise<EntitlementSnapshot> {
  const snapshot = await fetchSubscriberEntitlement(userId);
  await writeEntitlementCache(userId, snapshot);
  return snapshot;
}

export async function hasUnlimitedAccess(userId: string): Promise<boolean> {
  const cached = await getCachedEntitlement(userId);
  if (cached && cacheAllowsAccess(cached, new Date(), ENTITLEMENT_CACHE_TTL_MS)) {
    return true;
  }

  try {
    const snapshot = await refreshEntitlementCache(userId);
    return snapshot.active;
  } catch {
    if (
      cached?.entitlementActive &&
      (!cached.entitlementExpiresAt ||
        cached.entitlementExpiresAt.getTime() > Date.now())
    ) {
      return true;
    }
    return false;
  }
}

export async function requireUnlimitedAccess(userId: string): Promise<void> {
  if (!(await hasUnlimitedAccess(userId))) {
    redirect("/subscribe");
  }
}

export async function getSubscriptionManagementUrl(
  userId: string,
): Promise<string | null> {
  try {
    const snapshot = await fetchSubscriberEntitlement(userId);
    return snapshot.managementUrl;
  } catch {
    return null;
  }
}
