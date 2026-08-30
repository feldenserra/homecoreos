"use server";

import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";
import { signIn } from "../../auth";
import { hashPassword } from "../../lib/password";
import { DUPLICATE_EMAIL_ERROR, validateSignup } from "../../lib/signup";
import { db } from "../../src/db";
import { users } from "../../src/db/schema";

function readSignup(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  return { name, email, password, confirmPassword };
}

function pgErrorCode(err: unknown): string | undefined {
  if (err && typeof err === "object" && "code" in err) {
    return String((err as { code: unknown }).code);
  }
  return undefined;
}

function pgConstraint(err: unknown): string {
  if (!err || typeof err !== "object") {
    return "";
  }
  const e = err as { constraint_name?: unknown; constraint?: unknown };
  return String(e.constraint_name ?? e.constraint ?? "");
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return String(err ?? "");
}

function isDuplicateEmailError(err: unknown): boolean {
  const constraint = pgConstraint(err);
  const message = errorMessage(err);
  if (pgErrorCode(err) === "23505" && constraint.includes("user_email_unique")) {
    return true;
  }
  return message.includes("user_email_unique");
}

export async function registerWithCredentials(formData: FormData) {
  const { name, email, password, confirmPassword } = readSignup(formData);
  const validationError = validateSignup({
    name,
    email,
    password,
    confirmPassword,
  });
  if (validationError) {
    return { error: validationError };
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return { error: DUPLICATE_EMAIL_ERROR };
  }

  try {
    await db.insert(users).values({
      email,
      name,
      passwordHash: await hashPassword(password),
    });
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      return { error: DUPLICATE_EMAIL_ERROR };
    }
    throw error;
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/app",
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
