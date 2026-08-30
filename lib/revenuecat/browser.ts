"use client";

import {
  ErrorCode,
  Purchases,
  PurchasesError,
  type Offering,
  type Package,
} from "@revenuecat/purchases-js";
import type { SubscriptionPlan } from "./constants";

export function getRevenueCatPublicKey() {
  return process.env.NEXT_PUBLIC_REVENUECAT_WEB_API_KEY?.trim() ?? "";
}

export async function ensurePurchasesConfigured(appUserId: string) {
  const apiKey = getRevenueCatPublicKey();
  if (!apiKey) {
    throw new Error(
      "RevenueCat is not configured. Set NEXT_PUBLIC_REVENUECAT_WEB_API_KEY to your Web Billing public API key.",
    );
  }

  if (!Purchases.isConfigured()) {
    return Purchases.configure({ apiKey, appUserId });
  }

  const purchases = Purchases.getSharedInstance();
  if (purchases.getAppUserId() !== appUserId) {
    await purchases.changeUser(appUserId);
  }
  return purchases;
}

export function packageForPlan(
  offering: Offering,
  plan: SubscriptionPlan,
): Package | null {
  if (plan === "monthly") {
    return offering.monthly;
  }
  if (plan === "yearly") {
    return offering.annual;
  }
  return offering.lifetime;
}

export function isUserCancelled(error: unknown) {
  return (
    error instanceof PurchasesError &&
    error.errorCode === ErrorCode.UserCancelledError
  );
}

export function purchaseErrorMessage(error: unknown) {
  if (isUserCancelled(error)) {
    return null;
  }
  if (error instanceof PurchasesError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Purchase failed. Try again.";
}
