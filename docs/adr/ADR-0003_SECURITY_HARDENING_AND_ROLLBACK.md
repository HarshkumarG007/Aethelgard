# ADR-0003 — Security Hardening, Audit Mitigations, and Operational Rollback

## Status
Accepted

## Context
During Phase 6 Hardening, Acceptance & Release Gate v2.0 requires:
1. Complete verification of the Security Test Matrix (§4).
2. Documented mitigations for all high/critical vulnerabilities identified during `npm audit`.
3. An operational rollback protocol covering container versions, schema migrations, and secret rotations.
4. Automated verification of database backup, referential integrity restoration, and Disaster Recovery RTO/RPO (§14).

## Decision & Mitigations

### 1. Security Test Matrix Compliance
All 18 rows of the Security Test Matrix were codified into `tests/unit/hardening-security-matrix.test.ts` and passed without exceptions:
- **Unauthenticated Access:** 401 across all API endpoints and redirect on protected page routes.
- **Horizontal Isolation:** Valid UUIDs belonging to other users return 404 (anti-enumeration).
- **Bearer Token Semantics:** Presigned download tokens are verified as valid until expiration timestamp; no incorrect single-use assumption.
- **Client Storage Invariants:** Zero tokens in `localStorage` or `sessionStorage`. Static codebase scan confirms zero usage.
- **CSRF Defense:** State-modifying requests (`POST`, `PATCH`, `DELETE`) enforce exact-origin validation.
- **Injection Defenses:** SQL injection queries rendered harmless via Drizzle ORM parameterized queries; Stored XSS rendered inert via JSX text escaping.
- **Private Caching:** `Cache-Control: no-store, private` enforced across all authenticated endpoints and error responses.

### 2. Dependency Audit Mitigations
`npm audit` reported advisory notices regarding Next.js, Sharp, and Playwright:
- **Next.js 16.0.7 Advisories (Server Actions, PPR, Image Optimizer):**
  - *Mitigation:* Aethelgard completely eschews Next.js Server Actions; all mutations are implemented via standard Route Handlers with explicit `authenticateRequest` and CSRF origin verification.
  - *Mitigation:* Partial Prerendering (PPR) and Cache Components are disabled (`cache-control: no-store, private`).
  - *Mitigation:* Next.js `next/image` optimizer is not used for untrusted user uploads. Instead, uploads are strictly processed server-side via our dedicated Sharp pipeline following rigorous magic-byte sniffing.
- **Sharp & libvips (GHSA-f88m-g3jw-g9cj, GHSA-rgj7-g3m4-5g8c):**
  - *Mitigation:* All incoming files undergo deep file signature validation (`lib/security/magicBytes.ts`) before being handed to Sharp. Disguised executables (MZ, ELF, Mach-O) and script vectors are rejected immediately. Dimensions and buffer sizes are bounded by Zod schema limits (max 25MB).
- **Playwright Test:**
  - *Mitigation:* Dev-only dependency; never packaged or deployed in the production runtime container.

### 3. Operational Rollback Protocol
- **Application Rollback:** Container deployments are tagged by immutable Git commit hashes. If a regression occurs, deployment tooling rolls back the container image to the previous accepted Git tag (e.g. `c1a6a23` for Phase 5 or `b86ee9e` for Phase 4) without rebuilding.
- **Database Migration Invariant (Expand-Contract):**
  - Schema migrations are forward-compatible. New columns are nullable or have defaults.
  - Rollbacks never execute destructive `DROP COLUMN` in production; code is rolled back first, and obsolete columns are pruned in subsequent maintenance windows.
- **Secret Rotation Protocol:**
  - Passphrase hashes are verified using Argon2id. Passphrase rotation is executed by inserting the new hash in `users` and invalidating active rows in `sessions`.
  - Storage credentials (R2 Access Keys) are rotated using dual-key overlap in Cloudflare R2 before updating production environment variables.

### 4. Disaster Recovery & Backup Integrity (§14)
- Logical database snapshot extraction implemented in `scripts/backup-restore.ts`.
- Encrypted using authenticated `AES-256-GCM` with a 16-byte random IV and 128-bit authentication tag to prevent sensitive chronicle leakage at rest.
- Referential integrity tree and data shapes verified across users, chapters, memories, and assets.
- Operational database disaster recovery (RTO < 15 min, RPO < 1 hour) is defined and executed via the documented PostgreSQL `pg_dump` and `pg_restore` runbook (`docs/DEPLOYMENT_GUIDE.md` §6).
