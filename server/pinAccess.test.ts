import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import {
  PORTAL_PIN_COOKIE,
  createPinSessionToken,
  validatePinSessionToken,
  verifyPortalPin,
} from "./pinAccess";

type CookieCall = {
  name: string;
  value?: string;
  options: Record<string, unknown>;
};

function createContext() {
  const setCookies: CookieCall[] = [];
  const clearedCookies: CookieCall[] = [];
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        setCookies.push({ name, value, options });
      },
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, setCookies, clearedCookies };
}

describe("PIN access", () => {
  it("accepts the configured default PIN and rejects an incorrect PIN", () => {
    expect(verifyPortalPin("2323")).toBe(true);
    expect(verifyPortalPin("1111")).toBe(false);
  });

  it("validates signed unexpired tokens and rejects expired or tampered tokens", () => {
    const now = 1_700_000_000_000;
    const token = createPinSessionToken(now);
    expect(validatePinSessionToken(token, now + 1_000)).toBe(true);
    expect(validatePinSessionToken(token, now + 13 * 60 * 60 * 1_000)).toBe(false);
    expect(validatePinSessionToken(`${token}x`, now + 1_000)).toBe(false);
  });

  it("sets and clears the secure PIN cookie through the router", async () => {
    const { ctx, setCookies, clearedCookies } = createContext();
    const caller = appRouter.createCaller(ctx);

    await caller.pin.login({ pin: "2323" });
    expect(setCookies[0]).toMatchObject({
      name: PORTAL_PIN_COOKIE,
      options: {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
      },
    });

    await caller.pin.logout();
    expect(clearedCookies[0]).toMatchObject({
      name: PORTAL_PIN_COOKIE,
      options: {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: -1,
      },
    });
  });
});
