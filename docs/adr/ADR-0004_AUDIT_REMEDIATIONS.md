# ADR-0004 — Architecture Remediations from Technical Audit

## Status
Accepted

## Context
A rigorous technical audit was performed against the codebase, container stack, security helpers, and deployment specifications. The audit identified concrete engineering defects and overstated documentation guarantees:
1. **CSP Direct Upload Block:** `connect-src 'self'` blocked direct browser uploads via presigned `PUT` to Cloudflare R2.
2. **Permissions-Policy Conflict:** `microphone=()` explicitly disabled browser microphone access, preventing voice letter recording.
3. **CSRF Origin Inconsistency & Header Trust:** `validateOrigin` used an insecure `x-forwarded-host` fallback and environment variable naming was inconsistent (`NEXT_PUBLIC_SITE_URL` vs `NEXT_PUBLIC_SITE_ORIGIN`).
4. **Path Traversal in Storage Drivers:** Regex `.replace(/\.\./g, "")` is insufficient to guarantee filesystem boundary containment.
5. **Container Engine Contradiction:** `Dockerfile` ran on `node:20-alpine` while `package.json` enforced `node >=22.0.0`.
6. **TLS Stack Gap:** `docker-compose.prod.yml` bound port 3000 directly over plain HTTP without automated TLS.
7. **Plaintext Backup Snapshots:** The database snapshot script wrote raw JSON records to disk and claimed simulated RTO/RPO metrics.
8. **Licensing & Data Sovereignty Phrasing:** The README claimed the project was "strictly private, proprietary software" while the repo contained an Apache-2.0 license.

## Decision

### 1. CSP Dynamic R2 Domain Resolution
In `lib/security/headers.ts`, dynamically resolve `${accountId}.r2.cloudflarestorage.com` from environment variables and append to `connect-src` alongside `img-src` and `media-src`. Wildcard fallback `https://*.r2.cloudflarestorage.com` is supplied in production if specific account ID is omitted.

### 2. Permissions-Policy Permissions
Update `Permissions-Policy` to `microphone=(self)` in `lib/security/headers.ts`. Retain strict zero-privilege (`camera=()`, `geolocation=()`, `browsing-topics=()`).

### 3. Canonical CSRF Site Origin
Unify site origin matching in `lib/security/origin.ts` to `NEXT_PUBLIC_SITE_ORIGIN`. Remove `x-forwarded-host` host fallback completely. Requests must match canonical origin exactly or localhost in non-production.

### 4. Strict Path Boundary Containment
Replace regex sanitization in `LocalMediaStorage` and dev media routes with `path.resolve(baseDir, storageKey)`. Require `candidate.startsWith(baseDir + path.sep)` and forbid `candidate === baseDir`. Throw fatal traversal violation on violation.

### 5. Node 22 LTS Alpine Containerization
Update `Dockerfile` base and runner stages to `node:22-alpine` matching project engine specifications.

### 6. Caddy Reverse Proxy & Let's Encrypt Integration
Add `caddy:2-alpine` reverse proxy container to `docker-compose.prod.yml` binding ports 80/443 with automated Let's Encrypt certificates. Application port 3000 is exposed only within the internal Docker bridge network.

### 7. Authenticated AES-256-GCM Backup Envelope
Refactor `scripts/backup-restore.ts` to encrypt database snapshots using AES-256-GCM with a 16-byte random IV and 128-bit authentication tag. Clarify that the script provides logical snapshot extraction and referential integrity testing, whereas operational RTO/RPO disaster recovery is tested via the documented PostgreSQL `pg_dump`/`pg_restore` runbook.

### 8. License & Privacy Clarification
Clarify in `README.md` and docs that the source code is licensed under Apache-2.0, while hosted relationship memories and media belong sovereignly to the user with zero public bucket access and zero telemetry.

## Consequences
- Presigned browser uploads to R2 succeed without CSP violations.
- Voice letters record seamlessly via browser MediaRecorder APIs.
- CSRF defense cannot be bypassed by spoofed forwarded headers.
- Media storage rejects directory escape and root directory manipulation.
- Container environments align strictly with Node 22 runtime dependencies.
- Production self-hosted Docker deployments automatically obtain Let's Encrypt TLS certificates.
- Backup snapshots are protected against at-rest data leakage.
- All documentation claims are defensible and technically accurate.
