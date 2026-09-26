import { NextResponse, type NextRequest } from "next/server";
import { getSecurityHeaders } from "./lib/security/headers";

/**
 * Aethelgard Proxy (Next.js 16 Request Interceptor)
 * 
 * Architectural Role:
 * - Edge Routing Gate: Performs early, coarse-grained redirection of unauthenticated
 *   browser requests before hitting React Server Component layout rendering trees.
 * - Security Boundary Distinction: This proxy is a fast UX routing optimization, NOT
 *   the ultimate authorization boundary. Per 02_SECURITY_PRIVACY_CONTRACT.md, every
 *   protected API route handler and server action independently executes cryptographic
 *   session validation (`authenticateRequest`) and strict database resource authorization.
 * - Uniform Security Headers: Applies strict baseline security headers and CSP to all responses.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const sessionCookie =
    request.cookies.get("__Host-session") ||
    request.cookies.get("aethelgard_session") ||
    request.cookies.get("session");

  // Coarse route protection: unauthenticated visits to protected sections redirect to /auth
  const isProtectedPath =
    pathname === "/" ||
    pathname.startsWith("/sanctuary") ||
    pathname.startsWith("/admin") ||
    pathname === "/timeline" ||
    pathname === "/letters" ||
    pathname === "/archive" ||
    pathname === "/horizon" ||
    pathname.startsWith("/memory/");

  if (isProtectedPath && !sessionCookie?.value) {
    const loginUrl = new URL("/auth", request.url);
    const redirectResponse = NextResponse.redirect(loginUrl);
    
    // Apply security headers to redirect response
    const headers = getSecurityHeaders();
    for (const [key, value] of Object.entries(headers)) {
      redirectResponse.headers.set(key, value);
    }
    return redirectResponse;
  }

  const response = NextResponse.next();

  // Apply baseline security headers to all responses
  const headers = getSecurityHeaders();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  return response;
}

// Next.js convention: export as middleware/proxy
export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
