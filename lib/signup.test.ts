import { DUPLICATE_EMAIL_ERROR, validateSignup } from "./signup";

const valid = {
  name: "Alex Serra",
  email: "alex@example.com",
  password: "password1",
  confirmPassword: "password1",
};

describe("validateSignup", () => {
  it("accepts a complete signup", () => {
    expect(validateSignup(valid)).toBeNull();
  });

  it("rejects a name shorter than 2 characters", () => {
    expect(validateSignup({ ...valid, name: "A" })).toBe(
      "Enter your name (at least 2 characters).",
    );
    expect(validateSignup({ ...valid, name: "" })).toBe(
      "Enter your name (at least 2 characters).",
    );
  });

  it("rejects a name longer than 64 characters", () => {
    expect(validateSignup({ ...valid, name: "A".repeat(65) })).toBe(
      "Name must be 64 characters or fewer.",
    );
  });

  it("rejects a missing or invalid email", () => {
    expect(validateSignup({ ...valid, email: "" })).toBe(
      "Enter a valid email address.",
    );
    expect(validateSignup({ ...valid, email: "not-an-email" })).toBe(
      "Enter a valid email address.",
    );
  });

  it("rejects a password shorter than 8 characters", () => {
    expect(
      validateSignup({
        ...valid,
        password: "short",
        confirmPassword: "short",
      }),
    ).toBe("Password must be at least 8 characters.");
  });

  it("rejects mismatched passwords", () => {
    expect(
      validateSignup({ ...valid, confirmPassword: "password2" }),
    ).toBe("Passwords do not match.");
  });
});

describe("DUPLICATE_EMAIL_ERROR", () => {
  it("tells the user the account was not created", () => {
    expect(DUPLICATE_EMAIL_ERROR).toBe(
      "An account with this email already exists.",
    );
  });
});
