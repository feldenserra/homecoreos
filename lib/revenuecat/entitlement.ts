import { ENTITLEMENT_ID } from "./constants";

export type EntitlementSnapshot = {
  active: boolean;
  expiresAt: Date | null;
  managementUrl: string | null;
};

type SubscriberEntitlement = {
  expires_date?: string | null;
};

type SubscriberResponse = {
  subscriber?: {
    entitlements?: Record<string, SubscriberEntitlement | undefined>;
    management_url?: string | null;
  };
};

function parseDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseSubscriberEntitlement(
  payload: unknown,
  now = new Date(),
  entitlementId = ENTITLEMENT_ID,
): EntitlementSnapshot {
  if (!payload || typeof payload !== "object") {
    return { active: false, expiresAt: null, managementUrl: null };
  }

  const body = payload as SubscriberResponse;
  const subscriber = body.subscriber;
  const entitlement = subscriber?.entitlements?.[entitlementId];
  const expiresAt = parseDate(entitlement?.expires_date ?? null);
  const managementUrl =
    typeof subscriber?.management_url === "string" && subscriber.management_url
      ? subscriber.management_url
      : null;

  if (!entitlement) {
    return { active: false, expiresAt: null, managementUrl };
  }

  const active = expiresAt === null || expiresAt.getTime() > now.getTime();
  return { active, expiresAt, managementUrl };
}

export function cacheAllowsAccess(
  row: {
    entitlementActive: boolean;
    entitlementExpiresAt: Date | null;
    entitlementCheckedAt: Date | null;
  },
  now = new Date(),
  ttlMs: number,
): boolean {
  if (!row.entitlementActive) {
    return false;
  }
  if (
    row.entitlementExpiresAt &&
    row.entitlementExpiresAt.getTime() <= now.getTime()
  ) {
    return false;
  }
  if (!row.entitlementCheckedAt) {
    return false;
  }
  return now.getTime() - row.entitlementCheckedAt.getTime() <= ttlMs;
}
