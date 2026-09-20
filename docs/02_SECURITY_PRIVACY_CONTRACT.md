# AETHELGARD — SECURITY & PRIVACY CONTRACT v2.0

**Status:** Mandatory production contract  
**Threat-model scope:** Public Internet attacker, automated scanner, credential attacker, authenticated-user misuse, storage/database compromise, compromised dependency, compromised client device.

## 1. Security Objective

Aethelgard uses defense in depth to reduce the probability and impact of unauthorized access to private memories.

Do not use absolute claims such as “impossible,” “military-grade,” or “under any circumstance.” The application must state measurable guarantees and document residual risks.

## 2. Assets

| Asset | Sensitivity | Primary location |
|---|---|---|
| Passphrase verifier | Critical | PostgreSQL |
| Session records | Critical | PostgreSQL + secure cookie |
| Photographs | Critical | Private R2 |
| Videos | Critical | Private R2 |
| Audio | Critical | Private R2 |
| Letters | Critical | PostgreSQL |
| Memory metadata | High | PostgreSQL |
| Admin credentials | Critical | Server-side secret store |
| Backup data | Critical | Isolated backup storage |
| Application code | Medium | Git/host |

## 3. Trust Boundaries

```text
Untrusted browser
      │
      │ HTTPS
      ▼
Edge / WAF
      │
      ▼
Next.js server
      │       │
      │       └──────────────► R2 private bucket
      ▼
PostgreSQL
      │
      ▼
Isolated backup
```

Never treat the browser as a trusted authority.

## 4. Authentication

### 4.1 Passphrase flow

```text
User types passphrase
        │
        │ HTTPS/TLS
        ▼
POST /api/auth/verify
        │
        ▼
Validate JSON body
        │
        ▼
Rate limit
        │
        ▼
Load single active credential verifier
        │
        ▼
Argon2id verification on server
        │
     ┌──┴───┐
     │      │
  failure  success
     │      │
 generic   create session
 error        │
              ▼
       Set __Host-session cookie
```

Do not client-hash the passphrase and use the client-derived hash as the password-equivalent credential.

The original passphrase never enters logs.

### 4.2 Argon2id

Use Argon2id with a cost tuned for production. Start from the current OWASP baseline and benchmark on the actual production class runtime before finalizing parameters.

Document:

- memory cost
- time cost
- parallelism
- library version
- verification latency target

A password-verifier change must include a migration/re-authentication plan.

## 5. Session Contract

Use an opaque, random server-side session token.

### Cookie

```text
Name: __Host-session
Secure: true
HttpOnly: true
SameSite: Strict
Path: /
Domain: omitted
```

### Server record

Store only a cryptographic hash of the token, never the raw token.

Required fields:

- session id
- user id
- token hash
- created_at
- last_seen_at
- expires_at
- revoked_at
- optional device label only if explicitly approved

### Lifetime

- Idle timeout: 30 minutes
- Absolute lifetime: 24 hours
- Server-side revocation supported
- Rotate the session token after successful authentication
- Invalidate old token on privilege elevation
- Logout deletes/revokes the session server-side and clears the cookie

The absolute lifetime is independent of rolling renewal.

## 6. CSRF / Request Origin

All unsafe methods (`POST`, `PUT`, `PATCH`, `DELETE`) must validate:

- authenticated session
- `Origin` matches the exact configured site origin
- correct `Content-Type` for JSON endpoints
- schema validation

Never use GET requests for state-changing operations.

SameSite=Strict is defense in depth, not a substitute for explicit origin validation.

## 7. Authorization

Every protected request must perform authorization server-side.

### Rule

```text
authenticate(request)
        ↓
authorize(user, resource, action)
        ↓
execute(operation)
```

Never trust:

- user id supplied by client
- role supplied by client
- resource ownership supplied by client
- hidden form fields
- disabled UI controls
- 3D artifact state

UUIDs are used for opaque identifiers and enumeration resistance. UUIDs are not an authorization mechanism.

## 8. Roles

Minimum roles:

- `viewer`
- `admin`

The production instance may have exactly one viewer and one admin identity.

Admin routes use a separate elevated session scope. Destructive actions should require recent admin authentication.

## 9. Database RLS

Enable RLS on user-owned data.

Do not rely solely on RLS. Server-side authorization remains mandatory.

When using transaction/session-local application identity:

```sql
BEGIN;
SET LOCAL app.current_user_id = 'uuid';
-- protected queries
COMMIT;
```

Never set a connection-level identity in a way that can leak across pooled requests.

## 10. Password / Authentication Enumeration

Failed authentication responses must not reveal:

- whether the user account exists
- whether the passphrase format was correct
- whether the verifier was present
- which internal stage failed

Return a generic authentication failure and a controlled retry signal.

## 11. Rate Limiting

Production rate limiting must be distributed and durable.

Minimum policies:

| Endpoint class | Baseline |
|---|---|
| Authentication | 5 attempts / 15 min / source key |
| General API | 100 requests / min / authenticated actor |
| Media access | 30 requests / min / authenticated actor |
| Admin upload URL | 10 requests / min / admin actor |

For authentication, combine source-based throttling with a global failure backoff so a single distributed attacker cannot rotate addresses indefinitely.

Never rely on process-local memory for production rate limiting.

Development may use an in-memory adapter.

## 12. Security Headers

Required baseline:

```text
Content-Security-Policy
Strict-Transport-Security
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy
frame-ancestors 'none'
base-uri 'self'
form-action 'self'
```

Do not use `X-XSS-Protection`; modern browsers do not depend on it.

Do not rely on `X-Frame-Options` as the only clickjacking control; use CSP `frame-ancestors 'none'`.

## 13. Content Security Policy

Target a nonce-based CSP.

Baseline principles:

```text
default-src 'self'
script-src 'self' <nonce>
style-src 'self' <nonce>
img-src 'self' blob: data: https://<r2-s3-domain>
media-src 'self' https://<r2-s3-domain>
connect-src 'self'
font-src 'self'
frame-src 'none'
object-src 'none'
base-uri 'self'
form-action 'self'
frame-ancestors 'none'
worker-src 'self' blob:
```

No `unsafe-eval` or `unsafe-inline` merely to make Three.js/Next.js work.

If a framework-generated exception is unavoidable, document exactly why, scope it narrowly and test that no broader source is added.

## 14. XSS

- React escaping is the default.
- Do not use `dangerouslySetInnerHTML` for normal memory text.
- If rich text is introduced, sanitize using a maintained allowlist-based HTML sanitizer.
- Treat imported content and admin-entered content as untrusted input until validated.
- Never interpolate memory content into executable JavaScript.

## 15. SQL Injection

Use parameterized queries/ORM APIs.

Never build SQL using string concatenation from request data.

## 16. File Upload Security

Server validates all upload requests.

Validation sequence:

```text
filename
 ↓
declared MIME
 ↓
size
 ↓
magic-byte inspection
 ↓
media decoder/processor validation
 ↓
optional checksum
 ↓
write to opaque storage key
 ↓
process
 ↓
mark READY
```

Reject mismatches.

Never use user-provided filename as the storage key.

## 17. Object Storage

R2 bucket must remain private.

No public bucket.

No public custom-domain media route.

Storage credentials are server-only.

Object keys must be opaque, for example:

```text
media/{assetUuid}/original
media/{assetUuid}/thumbnail
media/{assetUuid}/small
media/{assetUuid}/medium
media/{assetUuid}/large
```

Do not use human names or memory titles in storage keys.

## 18. Presigned URL Contract

Read access:

- generated only after authentication + authorization
- default lifetime: 5 minutes
- one object / one operation
- never exposed before authorization

Important:

> A presigned URL is a bearer token and is reusable until expiration.

Do not claim single-use semantics.

If a true one-time media token is ever required, build an application-controlled media gateway instead of pretending a normal presigned R2 URL is one-time.

## 19. Browser Cache Policy

Private HTML/API/media authorization responses should use:

```text
Cache-Control: no-store
```

Do not put authenticated API responses into a public CDN cache.

Do not implement a generic service worker that caches private memory data or signed media URLs.

If a service worker is introduced later, every cache rule must be threat-modeled and documented.

## 20. Media Privacy Boundary

The application protects against unauthorized application-level access.

It cannot prevent an authorized user from:

- taking screenshots
- screen-recording
- photographing the screen
- copying media received by their browser

This is an accepted residual risk.

## 21. Encryption

### Baseline v1

- TLS in transit
- managed database encryption at rest
- R2/provider-managed encryption at rest
- strong secret management
- private bucket
- short-lived signed access

### Explicit limitation

Provider-managed encryption at rest does not, by itself, guarantee confidentiality if storage authorization is compromised.

Therefore the v1 threat model must list storage compromise as a residual risk.

### Optional v2 hardening

If the requirement becomes “storage compromise must not reveal plaintext media,” introduce application-level envelope encryption with a separately managed key hierarchy. This is a distinct architecture and must not be half-implemented.

## 22. Secrets

Never commit:

- `DATABASE_URL`
- R2 access keys
- admin credentials
- auth secrets
- session secrets
- backup credentials

Use environment/secret management.

Separate staging and production credentials.

Never expose server environment variables through `NEXT_PUBLIC_*`.

## 23. Logging

Application logs must never contain:

- passphrases
- session tokens
- signed URLs
- raw letter text
- memory descriptions
- uploaded filenames when they reveal private information
- encryption keys
- secret values

Application audit log should contain:

- action
- actor id
- resource type/id when necessary
- outcome
- timestamp

Persistent IP address and user-agent storage is not part of the default privacy model.

Infrastructure/CDN/WAF providers may independently collect operational request metadata according to their own products. Do not claim the application has erased provider-side telemetry.

## 24. Audit Events

Minimum events:

- login_success
- login_failure
- logout
- session_revoked
- admin_login
- memory_view
- memory_create
- memory_update
- memory_delete_requested
- media_access_requested
- media_upload_started
- media_upload_completed
- media_processing_failed
- admin_export
- security_config_change

Do not audit every animation/hover event.

## 25. Privacy

Default collection:

- authentication verifier
- session state
- memories
- required metadata
- audit events
- operational errors with scrubbing

Default non-collection:

- behavioral analytics
- ad tracking
- third-party advertising identifiers
- persistent IP/user-agent in application audit records

## 26. Retention

Baseline:

| Data | Retention |
|---|---|
| Active sessions | Until expiry/revocation |
| Audit logs | 90 days |
| Memories | Until deleted |
| Soft-deleted memories | 30 days |
| Routine backups | 1 year, subject to provider/plan capability |

Retention may be changed only as an explicit configuration decision.

## 27. Soft Delete / Purge

Delete request:

```text
DELETE requested
      ↓
mark deleted_at
      ↓
remove from normal reads
      ↓
grace period
      ↓
purge DB row
      ↓
purge associated objects/variants
      ↓
record purge event
```

Backup copies may persist until their normal retention window expires.

## 28. Third-Party Processor Transparency

The deployment should identify actual providers used:

- application host
- DNS/WAF/CDN
- PostgreSQL provider
- R2 storage
- error monitoring

Do not claim “no third parties” if a managed provider processes the application or data.

## 29. Backup Security

Backups must:

- be encrypted
- use separate credentials
- be isolated from primary credentials
- be inaccessible to the public
- have documented retention
- be tested for restore

A backup that has never been restored is not a verified backup strategy.

## 30. Incident Response

Document:

1. credential compromise
2. storage credential compromise
3. database compromise
4. malicious media upload
5. XSS/security-header regression
6. dependency vulnerability
7. backup corruption

Minimum response actions:

```text
detect
 ↓
contain
 ↓
revoke/rotate
 ↓
preserve evidence
 ↓
patch
 ↓
restore if necessary
 ↓
verify
 ↓
document
```

## 31. Security Release Gate

A production release is blocked if any of these are true:

- public R2 bucket
- unauthorized memory API access
- unauthorized media access
- auth brute force unthrottled
- session token in localStorage
- secrets in client bundle
- high/critical exploitable dependency with no approved mitigation
- CSP disabled
- production error responses contain stack traces
- private data cached publicly
- backup restore untested

## 32. Residual Risks

| Risk | Status |
|---|---|
| Authorized screenshot/screen recording | Accepted |
| Compromised user device/browser | Accepted |
| Browser/OS zero-day | Mitigate through updates |
| Provider-side operational telemetry | Documented |
| Storage credential compromise | Residual in v1; optional envelope encryption for stronger protection |
| Cloud provider compromise | Residual |
| Quantum cryptography concerns | Out of v1 scope |
