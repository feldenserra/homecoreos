import { isLocal } from "./is-local";

describe("isLocal", () => {
  const original = process.env.EXPO_PUBLIC_IS_LOCAL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.EXPO_PUBLIC_IS_LOCAL;
    } else {
      process.env.EXPO_PUBLIC_IS_LOCAL = original;
    }
  });

  it("is false when unset", () => {
    delete process.env.EXPO_PUBLIC_IS_LOCAL;
    expect(isLocal()).toBe(false);
  });

  it("is true for truthy values", () => {
    process.env.EXPO_PUBLIC_IS_LOCAL = "true";
    expect(isLocal()).toBe(true);
    process.env.EXPO_PUBLIC_IS_LOCAL = "1";
    expect(isLocal()).toBe(true);
    process.env.EXPO_PUBLIC_IS_LOCAL = "ON";
    expect(isLocal()).toBe(true);
  });

  it("is false for other values", () => {
    process.env.EXPO_PUBLIC_IS_LOCAL = "false";
    expect(isLocal()).toBe(false);
    process.env.EXPO_PUBLIC_IS_LOCAL = "0";
    expect(isLocal()).toBe(false);
  });
});
