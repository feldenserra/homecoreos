import { cacheAllowsAccess, parseSubscriberEntitlement } from "./entitlement";

describe("parseSubscriberEntitlement", () => {
  const now = new Date("2026-08-30T00:00:00.000Z");

  it("treats a missing entitlement as inactive", () => {
    expect(parseSubscriberEntitlement({ subscriber: { entitlements: {} } }, now)).toEqual({
      active: false,
      expiresAt: null,
      managementUrl: null,
    });
  });

  it("treats lifetime (null expires_date) as active", () => {
    expect(
      parseSubscriberEntitlement(
        {
          subscriber: {
            entitlements: {
              homecoreos_unlimited: { expires_date: null },
            },
            management_url: "https://billing.revenuecat.com/portal",
          },
        },
        now,
      ),
    ).toEqual({
      active: true,
      expiresAt: null,
      managementUrl: "https://billing.revenuecat.com/portal",
    });
  });

  it("treats a future expiry as active", () => {
    const result = parseSubscriberEntitlement(
      {
        subscriber: {
          entitlements: {
            homecoreos_unlimited: { expires_date: "2026-09-30T00:00:00.000Z" },
          },
        },
      },
      now,
    );
    expect(result.active).toBe(true);
    expect(result.expiresAt?.toISOString()).toBe("2026-09-30T00:00:00.000Z");
  });

  it("treats a past expiry as inactive", () => {
    const result = parseSubscriberEntitlement(
      {
        subscriber: {
          entitlements: {
            homecoreos_unlimited: { expires_date: "2026-08-01T00:00:00.000Z" },
          },
        },
      },
      now,
    );
    expect(result.active).toBe(false);
  });
});

describe("cacheAllowsAccess", () => {
  const now = new Date("2026-08-30T00:00:00.000Z");
  const ttlMs = 15 * 60 * 1000;

  it("allows a fresh active cache", () => {
    expect(
      cacheAllowsAccess(
        {
          entitlementActive: true,
          entitlementExpiresAt: new Date("2026-09-30T00:00:00.000Z"),
          entitlementCheckedAt: new Date("2026-08-29T23:50:00.000Z"),
        },
        now,
        ttlMs,
      ),
    ).toBe(true);
  });

  it("rejects an expired or stale cache", () => {
    expect(
      cacheAllowsAccess(
        {
          entitlementActive: true,
          entitlementExpiresAt: new Date("2026-08-01T00:00:00.000Z"),
          entitlementCheckedAt: now,
        },
        now,
        ttlMs,
      ),
    ).toBe(false);
    expect(
      cacheAllowsAccess(
        {
          entitlementActive: true,
          entitlementExpiresAt: null,
          entitlementCheckedAt: new Date("2026-08-29T00:00:00.000Z"),
        },
        now,
        ttlMs,
      ),
    ).toBe(false);
  });
});
