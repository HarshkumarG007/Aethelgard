/**
 * Origin validation for state-modifying requests (CSRF mitigation).
 * Per 02_SECURITY_PRIVACY_CONTRACT.md §6:
 * All unsafe methods (POST, PUT, PATCH, DELETE) must validate that Origin matches
 * the exact configured site origin.
 * 
 * Missing Origin, wrong Origin, or malformed Origin MUST be strictly rejected.
 */

export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");

  // 1. Missing Origin on state-changing requests is strictly rejected
  if (!origin || typeof origin !== "string" || origin.trim() === "") {
    return false;
  }

  // 2. Validate Origin format (reject malformed URLs)
  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    return false;
  }

  // Origin must have a protocol of http or https
  if (originUrl.protocol !== "http:" && originUrl.protocol !== "https:") {
    return false;
  }

  // 3. Match against configured canonical site origin (NEXT_PUBLIC_SITE_ORIGIN or NEXT_PUBLIC_SITE_URL)
  const configuredOrigin =
    process.env.NEXT_PUBLIC_SITE_ORIGIN || process.env.NEXT_PUBLIC_SITE_URL;

  if (configuredOrigin) {
    try {
      const expectedOrigin = new URL(configuredOrigin).origin;
      if (originUrl.origin === expectedOrigin) {
        return true;
      }
    } catch {
      // URL parsing failed on configuredOrigin; fall through
    }
  }

  // 4. In local development / test environments, permit localhost and 127.0.0.1
  if (process.env.NODE_ENV !== "production") {
    if (
      originUrl.hostname === "localhost" ||
      originUrl.hostname === "127.0.0.1"
    ) {
      return true;
    }
  }

  // Strict rejection: untrusted host header or cross-origin request rejected
  return false;
}
