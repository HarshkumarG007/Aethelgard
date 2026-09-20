/**
 * Origin validation for state-modifying requests (CSRF mitigation).
 * Per 02_SECURITY_PRIVACY_CONTRACT.md:
 * Unsafe HTTP methods require an Origin check against the exact site origin.
 */

export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    // If browser doesn't send Origin (e.g. same-origin GET/HEAD or non-browser), check Sec-Fetch-Site if available
    const secFetchSite = request.headers.get("sec-fetch-site");
    if (secFetchSite && secFetchSite !== "same-origin" && secFetchSite !== "none") {
      return false;
    }
    return true;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    try {
      const expectedOrigin = new URL(siteUrl).origin;
      if (origin === expectedOrigin) {
        return true;
      }
    } catch {
      // Ignore URL parse errors
    }
  }

  // Fallback to comparing request host
  const host = request.headers.get("host") || request.headers.get("x-forwarded-host");
  if (host) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host === host) {
        return true;
      }
    } catch {
      return false;
    }
  }

  // In local development, permit localhost origins
  if (process.env.NODE_ENV !== "production") {
    try {
      const originUrl = new URL(origin);
      if (originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1") {
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
}
