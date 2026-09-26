export interface SecurityHeaderOptions {
  r2Domain?: string;
  isProduction?: boolean;
}

export function buildContentSecurityPolicy(options: SecurityHeaderOptions = {}): string {
  const isProduction = options.isProduction ?? process.env.NODE_ENV === "production";

  // Resolve R2 domain from options or environment variables
  const resolvedR2Domain =
    options.r2Domain ||
    (process.env.R2_ACCOUNT_ID
      ? `${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : process.env.CLOUDFLARE_R2_ACCOUNT_ID
      ? `${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : undefined);

  const scriptSrc = isProduction
    ? "'self'"
    : "'self' 'unsafe-inline' 'unsafe-eval'"; // Fast Refresh and dev tooling support in development

  const styleSrc = "'self' 'unsafe-inline'"; // Required for CSS-in-JS and Tailwind runtime injections

  const imgSources = ["'self'", "blob:", "data:"];
  const mediaSources = ["'self'", "blob:"];
  const connectSources = ["'self'"];

  if (resolvedR2Domain) {
    imgSources.push(`https://${resolvedR2Domain}`);
    mediaSources.push(`https://${resolvedR2Domain}`);
    connectSources.push(`https://${resolvedR2Domain}`);
  } else if (isProduction) {
    // If specific R2 domain is not resolved, allow wildcard R2 storage domain in production
    imgSources.push("https://*.r2.cloudflarestorage.com");
    mediaSources.push("https://*.r2.cloudflarestorage.com");
    connectSources.push("https://*.r2.cloudflarestorage.com");
  }

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [scriptSrc],
    "style-src": [styleSrc],
    "img-src": imgSources,
    "media-src": mediaSources,
    "connect-src": connectSources,
    "font-src": ["'self'"], // Self-hosted fonts exclusively, zero external CDN requests
    "frame-src": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "worker-src": ["'self'", "blob:"], // Required for Web Workers in Three.js/KTX2
  };

  return Object.entries(directives)
    .map(([directive, sources]) => `${directive} ${sources.join(" ")}`)
    .join("; ");
}

export function getSecurityHeaders(options: SecurityHeaderOptions = {}): Record<string, string> {
  const isProduction = options.isProduction ?? process.env.NODE_ENV === "production";

  const headers: Record<string, string> = {
    "Content-Security-Policy": buildContentSecurityPolicy(options),
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(self), geolocation=(), browsing-topics=()",
    "X-Frame-Options": "DENY",
  };

  if (isProduction) {
    headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload";
  }

  return headers;
}
