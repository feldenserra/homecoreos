"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Stack, Text, Title } from "@mantine/core";
import { Purchases } from "@revenuecat/purchases-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ENTITLEMENT_ID, PLAN_LABELS, type SubscriptionPlan } from "../../lib/revenuecat/constants";
import {
  isUserCancelled,
  packageForPlan,
  purchaseErrorMessage,
} from "../../lib/revenuecat/browser";
import {
  openSubscriptionPortal,
  syncEntitlementAfterPurchase,
} from "../../app/subscribe/actions";

async function unlockAfterPurchase() {
  const result = await syncEntitlementAfterPurchase();
  if ("error" in result) {
    throw new Error(result.error);
  }
  if (!result.active) {
    throw new Error(
      "Payment finished, but access is not active yet. Refresh this page in a moment.",
    );
  }
}

export function SubscribeCheckout({
  email,
  plan,
}: {
  email: string | null;
  plan: SubscriptionPlan | null;
}) {
  const router = useRouter();
  const [paywallEl, setPaywallEl] = useState<HTMLDivElement | null>(null);
  const paywallStartedFor = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [planLabel, setPlanLabel] = useState<string | null>(
    plan ? PLAN_LABELS[plan] : null,
  );
  const [planPrice, setPlanPrice] = useState<string | null>(null);

  useEffect(() => {
    if (!plan) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const offerings = await Purchases.getSharedInstance().getOfferings();
        const current = offerings.current;
        const rcPackage = current ? packageForPlan(current, plan) : null;
        if (cancelled) {
          return;
        }
        if (!rcPackage) {
          setError(
            `The ${PLAN_LABELS[plan]} plan is not in the current RevenueCat offering.`,
          );
          return;
        }
        setPlanLabel(rcPackage.webBillingProduct.title || PLAN_LABELS[plan]);
        setPlanPrice(rcPackage.webBillingProduct.price.formattedPrice);
      } catch (err) {
        if (!cancelled) {
          setError(purchaseErrorMessage(err) ?? "Could not load plans.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [plan]);

  useEffect(() => {
    if (plan) {
      return;
    }

    const target = paywallEl;
    if (!target || paywallStartedFor.current === target) {
      return;
    }
    paywallStartedFor.current = target;

    let cancelled = false;
    void (async () => {
      try {
        const purchases = Purchases.getSharedInstance();
        const result = await purchases.presentPaywall({
          htmlTarget: target,
          customerEmail: email ?? undefined,
          hideBackButtons: true,
          onVisitCustomerCenter: () => {
            void openSubscriptionPortal().then((portal) => {
              if ("url" in portal) {
                window.open(portal.url, "_blank", "noopener,noreferrer");
              }
            });
          },
        });
        if (cancelled) {
          return;
        }
        const entitled =
          ENTITLEMENT_ID in result.customerInfo.entitlements.active ||
          (await purchases.isEntitledTo(ENTITLEMENT_ID));
        if (!entitled) {
          setError("Checkout finished without unlocking access. Try another plan.");
          return;
        }
        await unlockAfterPurchase();
        router.push("/app");
        router.refresh();
      } catch (err) {
        if (cancelled || isUserCancelled(err)) {
          return;
        }
        setError(purchaseErrorMessage(err) ?? "Could not open the paywall.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [email, plan, paywallEl, router]);

  async function buySelectedPlan() {
    if (!plan) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const purchases = Purchases.getSharedInstance();
      const offerings = await purchases.getOfferings();
      const current = offerings.current;
      const rcPackage = current ? packageForPlan(current, plan) : null;
      if (!rcPackage) {
        throw new Error(
          `The ${PLAN_LABELS[plan]} plan is not in the current RevenueCat offering.`,
        );
      }
      const result = await purchases.purchase({
        rcPackage,
        customerEmail: email ?? undefined,
        skipSuccessPage: true,
      });
      const entitled =
        ENTITLEMENT_ID in result.customerInfo.entitlements.active ||
        (await purchases.isEntitledTo(ENTITLEMENT_ID));
      if (!entitled) {
        throw new Error("Payment finished without unlocking access.");
      }
      await unlockAfterPurchase();
      router.push("/app");
      router.refresh();
    } catch (err) {
      const message = purchaseErrorMessage(err);
      if (message) {
        setError(message);
      }
    } finally {
      setBusy(false);
    }
  }

  if (!plan) {
    return (
      <Stack gap="md">
        <div>
          <Title order={2} className="display-title" fw={550}>
            Choose a plan
          </Title>
          <Text c="dimmed" size="sm" mt={4}>
            Monthly, yearly, or lifetime access to HomeCore.
          </Text>
        </div>
        {error ? (
          <Text c="red" size="sm">
            {error}
          </Text>
        ) : null}
        <div ref={setPaywallEl} className="subscribe-paywall" />
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <div>
        <Title order={2} className="display-title" fw={550}>
          Complete your subscription
        </Title>
        <Text c="dimmed" size="sm" mt={4}>
          {planLabel}
          {planPrice ? ` · ${planPrice}` : null}
        </Text>
      </div>
      {error ? (
        <Text c="red" size="sm">
          {error}
        </Text>
      ) : null}
      <Button onClick={() => void buySelectedPlan()} loading={busy}>
        Continue to payment
      </Button>
      <Button
        component={Link}
        href="/subscribe"
        variant="subtle"
        color="gray"
        size="sm"
      >
        See all plans
      </Button>
    </Stack>
  );
}
