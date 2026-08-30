"use server";

import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";
import { signIn } from "../../auth";
import { hashPassword } from "../../lib/password";
import {
  isSubscriptionPlan,
  type SubscriptionPlan,
} from "../../lib/revenuecat/constants";
import { db } from "../../src/db";
import { users } from "../../src/db/schema";

function readSignup(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const plan = String(formData.get("plan") ?? "");
  return { email, password, confirmPassword, plan };
}

function validateSignup(
  email: string,
  password: string,
  confirmPassword: string,
  plan: string,
): string | null {
  if (!email || !email.includes("@")) {
    return "Enter a valid email address.";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }
  if (!isSubscriptionPlan(plan)) {
    return "Choose a subscription plan.";
  }
  return null;
}

export async function registerWithPlan(formData: FormData) {
  const { email, password, confirmPassword, plan } = readSignup(formData);
  const validationError = validateSignup(
    email,
    password,
    confirmPassword,
    plan,
  );
  if (validationError) {
    return { error: validationError };
  }

  const selectedPlan = plan as SubscriptionPlan;

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return { error: "An account with this email already exists." };
  }

  await db.insert(users).values({
    email,
    name: email.split("@")[0],
    passwordHash: await hashPassword(password),
  });

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: `/subscribe?plan=${selectedPlan}`,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: "Account created, but sign-in failed. Try signing in.",
      };
    }
    throw error;
  }
}
