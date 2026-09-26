# AETHELGARD — Security Architecture & Threat Model

## 1. Scope & System Overview

Aethelgard is a self-sovereign relationship archive engineered to preserve personal memories, written correspondence, and audio letters. The architecture is designed with defense-in-depth principles: zero public storage buckets, strict server-side authorization boundaries, memory-hard authentication, and end-to-end cryptographic integrity.

### 1.1 Architecture & Trust Boundaries

```
                              PUBLIC INTERNET
                                     │
                     [ HTTPS / TLS 1.3 Termination ]
                       (Caddy / Cloudflare / Vercel)
                                     │
                      ┌──────────────▼──────────────┐
                      │    Next.js App Server       │
                      │  • proxy.ts (Routing Gate)  │
                      │  • Route Handler (AuthZ)    │
                      │  • Sharp Image Pipeline     │
                      └──────┬───────────────┬──────┘
                             │               │
                 Internal SQL│               │S3/R2 API (Presigned PUT/GET)
                             ▼               ▼
                   ┌──────────────────┐    ┌──────────────────────────┐
                   │  PostgreSQL 16   │    │  Cloudflare R2 Bucket    │
                   │  (Private DB)    │    │  (Zero Public Access)    │
                   └──────────────────┘    └──────────────────────────┘
```

### 1.2 System Actors

| Actor | Description | Privilege Level |
|---|---|---|
| **Anonymous** | Unauthenticated browser client | Zero access. Redirected to `/auth`. All protected API routes return 401. |
| **Viewer** | Authenticated recipient | Read-only contemplative access to assigned memories, chapters, and correspondence. |
| **Admin** | Authenticated archive curator | Full read, create, edit, media upload, and soft-delete capabilities. |

---

## 2. Threat Analysis & Mitigations

### 2.1 Cross-Site Request Forgery (CSRF)
- **Threat:** A malicious third-party website tricks an authenticated user's browser into submitting state-changing requests (`POST`, `PATCH`, `DELETE`).
- **Mitigation:**
  - **Exact Origin Validation:** All state-modifying requests execute `validateOrigin(request)`. The `Origin` header must strictly match the canonical `NEXT_PUBLIC_SITE_ORIGIN`. Missing, mismatched, or untrusted forwarded headers are rejected with HTTP 403.
  - **Strict Session Cookies:** Session cookies use `SameSite=Strict; Secure; HttpOnly`. Browsers will not attach the session cookie on cross-site requests.

### 2.2 Cross-Site Scripting (XSS) & Content Injection
- **Threat:** Malicious script injection into memory notes, letters, or metadata executed within another user's session.
- **Mitigation:**
  - **Strict Content Security Policy (CSP):** `default-src 'self'`; `script-src 'self'`; `object-src 'none'`; `frame-src 'none'`; `base-uri 'self'`. No external CDN scripts or inline evaluations are allowed.
  - **Self-Hosted Assets:** Fonts, icons, and procedural sound engines run entirely offline from local bundles; zero third-party script tags.
  - **React DOM Escaping:** Dynamic text content is sanitized and escaped by React's rendering pipeline.

### 2.3 Media Upload Attacks & File Signature Confusion
- **Threat:** Attacker uploads a malicious script, PHP/executable payload, or HTML file disguised as a JPEG/PNG/MP4 to execute on the server or in client browsers.
- **Mitigation:**
  - **Two-Stage Direct Upload Model:** The browser receives a narrowly scoped presigned `PUT` URL pointing directly to Cloudflare R2. The media remains unusable (`status = PENDING`) until explicit server completion.
  - **Server-Side File Verification:** The completion endpoint (`POST /api/admin/media/[assetId]/complete`) verifies the object's presence, reads its header bytes, and validates magic signatures (`validateMagicBytes`) against the declared MIME type.
  - **Opaque Storage Keys:** Files are never stored under client-provided filenames. Storage keys follow `media/${assetId}/original`.
  - **Image Re-Encoding:** Images are processed through `sharp`, re-encoding raw pixel buffers and stripping untrusted EXIF metadata before generating WebP/AVIF variants.
  - **Size Limits:** Per-MIME byte limits are verified at both authorization and completion stages.

### 2.4 Insecure Direct Object References (IDOR) & ID Enumeration
- **Threat:** An attacker queries sequential or discovered IDs to read private memories or assets belonging to another account.
- **Mitigation:**
  - **Opaque UUIDv4 Identifiers:** All entity IDs use 128-bit random UUIDs, preventing sequential enumeration.
  - **Database Query-Level Authorization:** Data queries enforce tenant scoping (`where(eq(memories.userId, user.id))`). Viewers cannot query other users' memories even with a known UUID.
  - **Uniform 404 Responses:** Access attempts to unauthorized or deleted resources return HTTP 404 instead of 403, preventing attackers from confirming whether an ID exists.

### 2.5 Credential Attacks & Timing Side-Channels
- **Threat:** Brute-force guessing of passphrases or timing attacks to infer valid usernames or passphrases.
- **Mitigation:**
  - **Memory-Hard Password Hashing:** Passphrases are hashed with Argon2id (`v=19, m=65536, t=3, p=4`), offering strong resistance to GPU/ASIC cracking.
  - **Dummy Timing Defense:** When a non-existent user is queried during authentication, the verifier computes a dummy Argon2id hash against a constant baseline to neutralize timing discrepancy side-channels.
  - **Rate Limiting:** IP-level and account-level sliding-window rate limiters throttle excessive authentication attempts.

### 2.6 Path Traversal
- **Threat:** Attacker passes directory traversal sequences (`../../etc/passwd`) in media keys or storage identifiers.
- **Mitigation:**
  - `LocalMediaStorage` uses `path.resolve(this.baseDir, storageKey)` and verifies that the candidate path strictly starts with `this.baseDir + path.sep`. Traversal attempts trigger a fatal `Path traversal violation`.

### 2.7 Data-at-Rest & Backup Security
- **Threat:** Physical access or leak of database backups exposing intimate letters and memories.
- **Mitigation:**
  - **Encrypted Snapshots:** Backup extractions (`scripts/backup-restore.ts`) produce an authenticated `AES-256-GCM` envelope with a 16-byte random IV and 128-bit authentication tag. Tampered ciphertext or tags fail decryption immediately.
  - **Production PostgreSQL Runbook:** Operational backups utilize `pg_dump` piped directly to GPG encryption (`gpg --encrypt`).

---

## 3. Residual Risks & Operational Assumptions

1. **Host-Level Compromise:** If an attacker gains root shell access to the underlying server or container runtime, they can inspect memory or extract environment variables (`SESSION_SECRET`, database credentials). Production deployments must secure host access with SSH keys and disabled password auth.
2. **Reverse Proxy TLS Enforcement:** Aethelgard assumes TLS 1.3 is terminated by the ingress layer (Caddy, Cloudflare, or Vercel) and that traffic is never transmitted over unencrypted HTTP on the public internet.
3. **Database Connection Security:** Container stacks running across a single Docker network communicate via internal bridge (`sslmode=disable`). Any connection to an external or managed database (Neon, Supabase) **must** mandate `sslmode=require`.
