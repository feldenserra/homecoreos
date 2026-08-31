import { loginsAllowed } from "./allow-logins";

describe("loginsAllowed", () => {
  const original = process.env.EXPO_PUBLIC_ALLOW_LOGINS;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.EXPO_PUBLIC_ALLOW_LOGINS;
    } else {
      process.env.EXPO_PUBLIC_ALLOW_LOGINS = original;
    }
  });

  it("allows logins when unset", () => {
    delete process.env.EXPO_PUBLIC_ALLOW_LOGINS;
    expect(loginsAllowed()).toBe(true);
  });

  it("disables logins for falsey values", () => {
    process.env.EXPO_PUBLIC_ALLOW_LOGINS = "false";
    expect(loginsAllowed()).toBe(false);
    process.env.EXPO_PUBLIC_ALLOW_LOGINS = "0";
    expect(loginsAllowed()).toBe(false);
    process.env.EXPO_PUBLIC_ALLOW_LOGINS = "OFF";
    expect(loginsAllowed()).toBe(false);
  });

  it("allows logins for other values", () => {
    process.env.EXPO_PUBLIC_ALLOW_LOGINS = "true";
    expect(loginsAllowed()).toBe(true);
  });
});
