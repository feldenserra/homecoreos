"use server";

import { redirect } from "next/navigation";
import { auth } from "../../auth";
import {
  getSubscriptionManagementUrl,
  refreshEntitlementCache,
} from "../../lib/revenuecat/server";

export async function syncEntitlementAfterPurchase() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/login");
  }

  try {
    const snapshot = await refreshEntitlementCache(userId);
    return { ok: true as const, active: snapshot.active };
  } catch {
    return {
      error: "Payment may have succeeded, but we could not confirm access yet. Refresh in a moment.",
    };
  }
}

export async function openSubscriptionPortal() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/login");
  }

  const url = await getSubscriptionManagementUrl(userId);
  if (!url) {
    return { error: "No subscription to manage yet." };
  }
  return { ok: true as const, url };
}
