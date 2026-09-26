import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { validateOrigin } from "@/lib/security/origin";

describe("CSRF Exact Origin Validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("rejects request with missing or empty Origin header", () => {
    const noOriginReq = new Request("https://sanctuary.example.com/api/memories", {
      method: "POST",
    });
    expect(validateOrigin(noOriginReq)).toBe(false);

    const emptyOriginReq = new Request("https://sanctuary.example.com/api/memories", {
      method: "POST",
      headers: { origin: "   " },
    });
    expect(validateOrigin(emptyOriginReq)).toBe(false);
  });

  it("rejects request with malformed or non-http/https Origin", () => {
    const malformedReq = new Request("https://sanctuary.example.com/api/memories", {
      method: "POST",
      headers: { origin: "not-a-valid-url" },
    });
    expect(validateOrigin(malformedReq)).toBe(false);

    const javascriptReq = new Request("https://sanctuary.example.com/api/memories", {
      method: "POST",
      headers: { origin: "javascript:alert(1)" },
    });
    expect(validateOrigin(javascriptReq)).toBe(false);
  });

  it("accepts request matching NEXT_PUBLIC_SITE_ORIGIN in production", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.NEXT_PUBLIC_SITE_ORIGIN = "https://sanctuary.example.com";

    const validReq = new Request("https://sanctuary.example.com/api/memories", {
      method: "POST",
      headers: { origin: "https://sanctuary.example.com" },
    });
    expect(validateOrigin(validReq)).toBe(true);
  });

  it("rejects request with mismatched Origin in production, even with spoofed X-Forwarded-Host", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.NEXT_PUBLIC_SITE_ORIGIN = "https://sanctuary.example.com";

    const attackerReq = new Request("https://sanctuary.example.com/api/memories", {
      method: "POST",
      headers: {
        origin: "https://attacker.evil.com",
        host: "attacker.evil.com",
        "x-forwarded-host": "attacker.evil.com",
      },
    });
    expect(validateOrigin(attackerReq)).toBe(false);
  });

  it("permits localhost in non-production environments", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    delete process.env.NEXT_PUBLIC_SITE_ORIGIN;
    delete process.env.NEXT_PUBLIC_SITE_URL;

    const devReq = new Request("http://localhost:3000/api/memories", {
      method: "POST",
      headers: { origin: "http://localhost:3000" },
    });
    expect(validateOrigin(devReq)).toBe(true);

    const devIpReq = new Request("http://127.0.0.1:3000/api/memories", {
      method: "POST",
      headers: { origin: "http://127.0.0.1:3000" },
    });
    expect(validateOrigin(devIpReq)).toBe(true);
  });

  it("rejects localhost in production if not explicitly configured as canonical origin", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.NEXT_PUBLIC_SITE_ORIGIN = "https://sanctuary.example.com";

    const localhostProdReq = new Request("https://sanctuary.example.com/api/memories", {
      method: "POST",
      headers: { origin: "http://localhost:3000" },
    });
    expect(validateOrigin(localhostProdReq)).toBe(false);
  });
});
