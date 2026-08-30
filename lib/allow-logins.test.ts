import { loginsAllowed } from "./allow-logins";

describe("loginsAllowed", () => {
  const original = process.env.ALLOW_LOGINS;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.ALLOW_LOGINS;
    } else {
      process.env.ALLOW_LOGINS = original;
    }
  });

  it("allows logins when unset", () => {
    delete process.env.ALLOW_LOGINS;
    expect(loginsAllowed()).toBe(true);
  });

  it("disables logins for falsey values", () => {
    process.env.ALLOW_LOGINS = "false";
    expect(loginsAllowed()).toBe(false);
    process.env.ALLOW_LOGINS = "0";
    expect(loginsAllowed()).toBe(false);
    process.env.ALLOW_LOGINS = "OFF";
    expect(loginsAllowed()).toBe(false);
  });

  it("allows logins for other values", () => {
    process.env.ALLOW_LOGINS = "true";
    expect(loginsAllowed()).toBe(true);
  });
});
