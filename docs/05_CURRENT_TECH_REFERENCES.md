# AETHELGARD — CURRENT VERIFIED TECHNICAL REFERENCES

Verified 20 September 2026.

## Next.js

Next.js support policy lists 16.x as Active LTS and 14.x as unsupported. The August 2026 security release lists 16.3.3 as a patched release.

- https://nextjs.org/support-policy
- https://nextjs.org/blog

## Node.js

Node.js 24.x is LTS in September 2026. Production systems should use Active or Maintenance LTS releases.

- https://nodejs.org/en/about/previous-releases
- https://nodejs.org/en/blog/release

## Cloudflare R2

R2 presigned URLs currently support GET, HEAD, PUT and DELETE. HTML-form POST uploads are not supported. Presigned URLs are bearer tokens and can be reused until expiry. Browser uploads can use presigned PUT and can sign Content-Type.

- https://developers.cloudflare.com/r2/api/s3/presigned-urls/
- https://developers.cloudflare.com/r2/objects/upload-objects/
- https://developers.cloudflare.com/r2/objects/download-objects/

## Password hashing

OWASP recommends Argon2id for password storage and provides baseline parameters to tune to the actual production environment.

- https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html

## Performance

INP replaced FID as the responsiveness Core Web Vital in March 2024.

- https://web.dev/blog/inp-cwv-march-12
- https://web.dev/articles/fid
