export const DUPLICATE_EMAIL_ERROR =
  "An account with this email already exists.";

export function validateSignup(input: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}): string | null {
  if (input.name.length < 2) {
    return "Enter your name (at least 2 characters).";
  }
  if (input.name.length > 64) {
    return "Name must be 64 characters or fewer.";
  }
  if (!input.email || !input.email.includes("@")) {
    return "Enter a valid email address.";
  }
  if (input.password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (input.password !== input.confirmPassword) {
    return "Passwords do not match.";
  }
  return null;
}
