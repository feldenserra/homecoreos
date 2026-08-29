"use server";

import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";
import { signIn } from "../../auth";
import { hashPassword } from "../../lib/password";
import { db } from "../../src/db";
import { users } from "../../src/db/schema";

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  return { email, password };
}

function validateCredentials(email: string, password: string) {
  if (!email || !email.includes("@")) {
    return "Enter a valid email address.";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  return null;
}

export async function signInWithCredentials(formData: FormData) {
  const { email, password } = readCredentials(formData);
  const validationError = validateCredentials(email, password);
  if (validationError) {
    return { error: validationError };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/app",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }
}

export async function registerWithCredentials(formData: FormData) {
  const { email, password } = readCredentials(formData);
  const validationError = validateCredentials(email, password);
  if (validationError) {
    return { error: validationError };
  }

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
      redirectTo: "/app",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created, but sign-in failed. Try signing in." };
    }
    throw error;
  }
}

export async function signInWithGitHub() {
  await signIn("github", { redirectTo: "/app" });
}
