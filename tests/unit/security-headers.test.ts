import { describe, it, expect } from "vitest";
import { getSecurityHeaders, buildContentSecurityPolicy } from "@/lib/security/headers";

describe("Phase 0: Baseline Security Headers & CSP", () => {
  it("generates required baseline security headers", () => {
    const headers = getSecurityHeaders({ isProduction: true });

    expect(headers["Content-Security-Policy"]).toBeDefined();
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Permissions-Policy"]).toContain("camera=()");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Strict-Transport-Security"]).toBe(
      "max-age=63072000; includeSubDomains; preload"
    );

    // Contract requirement: Do not emit X-XSS-Protection
    expect(headers["X-XSS-Protection"]).toBeUndefined();
  });

  it("enforces self-hosted fonts with zero external Google font requests in CSP", () => {
    const csp = buildContentSecurityPolicy();

    expect(csp).toContain("font-src 'self'");
    expect(csp).not.toContain("fonts.googleapis.com");
    expect(csp).not.toContain("fonts.gstatic.com");
  });

  it("enforces strict frame-ancestors and object-src", () => {
    const csp = buildContentSecurityPolicy();

    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
  });
});
