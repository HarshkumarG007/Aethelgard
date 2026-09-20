export interface SecurityHeaderOptions {
  r2Domain?: string;
  isProduction?: boolean;
}

export function buildContentSecurityPolicy(options: SecurityHeaderOptions = {}): string {
  const { r2Domain, isProduction = process.env.NODE_ENV === "production" } = options;

  const scriptSrc = isProduction
    ? "'self'"
    : "'self' 'unsafe-inline' 'unsafe-eval'"; // Fast Refresh and dev tooling support in development

  const styleSrc = "'self' 'unsafe-inline'"; // Required for CSS-in-JS and Tailwind runtime injections

  const imgSources = ["'self'", "blob:", "data:"];
  const mediaSources = ["'self'", "blob:"];

  if (r2Domain) {
    imgSources.push(`https://${r2Domain}`);
    mediaSources.push(`https://${r2Domain}`);
  }

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [scriptSrc],
    "style-src": [styleSrc],
    "img-src": imgSources,
    "media-src": mediaSources,
    "connect-src": ["'self'"],
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
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), browsing-topics=()",
    "X-Frame-Options": "DENY",
  };

  if (isProduction) {
    headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload";
  }

  return headers;
}
