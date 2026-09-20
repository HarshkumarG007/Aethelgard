# AETHELGARD — ANTIGRAVITY BUILD HANDOFF

## Purpose

This package is the authoritative build contract for **Aethelgard — The Archive of Unwritten Things**.

Aethelgard is a private, authenticated digital sanctuary where relationship memories are represented as discoverable artifacts inside a cinematic 3D world, with accessible 2D equivalents.

The implementation goal is not to demonstrate technology. The technology must disappear behind the experience:

> **It should feel like a place that was made only for the person entering it.**

## Read Order — Mandatory

Antigravity must read these files before changing production code:

1. `AGENTS.md`
2. `01_AETHELGARD_MASTER_BUILD_SPEC.md`
3. `02_SECURITY_PRIVACY_CONTRACT.md`
4. `03_DATA_API_MEDIA_CONTRACT.md`
5. `04_ACCEPTANCE_RELEASE_GATE.md`

The original uploaded specification is the **creative/source reference**. Where the old specification conflicts with this package, this package wins.

## Non-Negotiable Precedence

When requirements conflict, use this order:

1. Security/privacy
2. Data integrity and authorization
3. Accessibility
4. Functional correctness
5. Performance/reliability
6. Creative fidelity
7. Convenience of implementation

Never weaken a higher-priority requirement to satisfy a lower-priority one.

## Build Objective

Deliver a production-quality web application with:

- secure passphrase authentication
- server-side sessions
- private media storage
- server-side authorization on every protected request
- responsive 3D sanctuary with 2D fallback
- memories, letters, timeline, archive, horizon
- admin content management
- robust media processing
- automated tests and release gates
- no tracking or advertising by default
- documentation sufficient for long-term maintenance

## Current Technology Baseline

Use the current **Active LTS** Next.js major at build time. As of September 2026, Next.js 16.x is Active LTS; the August 2026 security release lists 16.3.3 as a patched 16.3 release. Do not use unsupported Next.js 14.x.

Use Node.js 24 LTS for the production/runtime baseline unless the exact selected Next.js patch requires a newer supported LTS.

Use current compatible React 19.x required by the pinned Next.js release.

Use Cloudflare R2 private object storage. For browser uploads use **presigned PUT**, not presigned POST. R2 currently supports presigned GET, HEAD, PUT and DELETE; presigned URLs are bearer tokens and can be reused until expiry.

## Source-of-Truth Rule

Do not copy contradictory legacy details from the original specification into code.

These legacy details are explicitly superseded:

- client-side Argon2id password hashing before sending to server
- presigned POST upload flow
- “single-use” presigned URLs
- persistent IP/user-agent fields in the application audit log
- `middleware.ts` as the assumed Next.js 16 request interception file
- FID as the principal responsiveness metric
- generic service-worker caching of authenticated content
- “military-grade” or absolute privacy guarantees

## Definition of Done

Aethelgard is not “done” because pages render.

A release is done only when:

- build succeeds
- type-check succeeds
- lint succeeds
- unit/integration/E2E tests pass
- security contract passes
- accessibility checks pass
- no unauthorized memory/media access is possible in tests
- storage is private
- authenticated private responses are not browser/CDN cached
- backup restoration has been demonstrated
- 3D and 2D experiences both work
- reduced-motion mode works
- production observability works without collecting unnecessary personal data
- deployment is documented and reproducible
