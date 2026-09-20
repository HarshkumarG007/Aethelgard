# AETHELGARD — ACCEPTANCE, TESTING & RELEASE GATE v2.0

## 1. Purpose

This document defines objective gates for deciding whether Aethelgard is ready to move between implementation phases and into production.

“Looks correct” is not an acceptance criterion.

## 2. Required CI Checks

At minimum:

```bash
npm run lint
npm run typecheck
npm test -- --runInBand
npm run build
```

E2E/security/a11y commands may use the project's selected tools, but every command must be documented in `README.md`.

CI must fail on:

- TypeScript errors
- lint errors
- failed tests
- dependency policy violations
- build errors

## 3. Phase Gates

### Phase 0 — Foundation

Must prove:

- Next.js supported Active-LTS version installed
- Node 24 LTS or documented supported LTS installed
- strict TypeScript
- repository structure
- DB migration system
- security header baseline
- protected route skeleton
- CI green

### Phase 1 — Authentication

Must prove:

- correct passphrase succeeds
- wrong passphrase fails
- failure response is generic
- rate limiting activates
- session cookie has correct attributes
- session record is created
- logout revokes session
- idle timeout works
- absolute timeout works
- no token in localStorage/sessionStorage
- no passphrase in logs

### Phase 2 — 2D Core

Must prove:

- memory list loads after authentication
- archive works without WebGL
- timeline works without WebGL
- letters work without WebGL
- horizon works without WebGL
- keyboard focus is visible
- screen-reader labels are present
- browser back/forward behavior is sensible

### Phase 3 — 3D

Must prove:

- 3D scene initializes
- entry animation works
- camera controls work
- artifact hover/proximity works
- selection opens memory
- Escape returns
- WebGL context loss is handled
- reduced-motion mode disables cinematic camera movement
- resource disposal leaves no obvious GPU/resource leak after repeated scene mounts

### Phase 4 — Media

Must prove:

- R2 remains private
- unauthorized direct object access fails
- presigned PUT upload works
- wrong Content-Type is rejected
- oversized upload is rejected
- fake extension / invalid magic bytes are rejected
- completion endpoint verifies uploaded object
- images generate expected variants
- signed GET expires
- signed URL is not assumed to be single-use
- media is not publicly cached

### Phase 5 — Experience Completion

Must prove:

- Timeline
- Letters
- Archive
- Horizon
- Search
- Filters
- Favorites
- Admin CRUD
- export

all work from the same authenticated session.

### Phase 6 — Hardening

Must prove:

- security test matrix passes
- accessibility checks pass
- performance budgets pass
- no high-severity known dependency issue without documented mitigation
- backup restore succeeds
- rollback procedure is documented

## 4. Security Test Matrix

| Test | Expected |
|---|---|
| GET protected route without cookie | 401/redirect |
| API call without session | 401 |
| Memory ID changed to another valid UUID | 403/404 |
| Asset ID changed to another valid UUID | 403/404 |
| Raw R2 object URL without authorization | denied |
| Expired signed URL | denied |
| Reused valid signed URL before expiry | works only if still valid; no “single-use” assumption |
| Session token in localStorage | absent |
| Session cookie missing HttpOnly | fail |
| Session cookie missing Secure in production | fail |
| Cross-origin unsafe POST | rejected |
| SQL injection payload | rejected/no effect |
| Stored XSS payload | rendered inert |
| File extension spoofing | rejected |
| Oversized upload | rejected |
| Wrong MIME/signature | rejected |
| Public cache of private response | fail |
| Stack trace in production error | fail |
| Secret in client bundle | fail |

## 5. Authentication Tests

Test:

- correct credential
- incorrect credential
- rate-limit threshold
- post-lockout retry
- logout
- session expiry
- absolute lifetime
- concurrent requests near expiry
- session revocation
- privilege change/session rotation

## 6. Authorization Tests

Test every protected route against:

1. anonymous user
2. viewer
3. admin
4. wrong resource UUID
5. deleted resource
6. resource belonging to another user fixture

Even if production has only one viewer, use multiple test fixtures to prove the authorization logic rather than assuming single-user deployment makes authorization unnecessary.

## 7. Media Tests

### Upload

- valid JPEG
- valid PNG
- valid WebP
- invalid content
- extension mismatch
- content-type mismatch
- size limit
- empty file
- corrupt image
- malicious filename

### Delivery

- thumbnail
- small
- medium
- large
- original where allowed
- unauthorized asset
- expired URL
- CORS behavior

## 8. Accessibility Gate

Target WCAG 2.2 AA for the 2D/accessibility path.

Must verify:

- keyboard-only operation
- visible focus
- logical tab order
- Escape closes transient states
- heading hierarchy
- labels for controls
- accessible names
- no color-only meaning
- text zoom/reflow
- sufficient contrast
- reduced motion
- screen-reader navigation
- media controls
- form error announcement

A 3D canvas alone is never considered an accessibility implementation.

## 9. Performance Gate

### Web Core

Measure:

- LCP
- INP
- CLS
- TTFB

Do not use FID as the principal responsiveness metric.

### 3D

Measure:

- average FPS during normal exploration
- worst-case frame time
- memory/GPU behavior during repeated navigation
- first 3D render time
- artifact loading time

### Budget targets

Desktop:

- target 60 FPS
- adapt quality rather than forcing 60 FPS at extreme thermal cost

Mobile:

- target 30 FPS
- degrade to 2D if stable interaction cannot be maintained

The final thresholds must be recorded after testing on representative devices.

## 10. Network Conditions

Test at minimum:

- fast desktop broadband
- simulated 4G
- slow 4G
- offline after initial load
- intermittent media failure

The app must fail gracefully.

## 11. Browser Matrix

At minimum test current stable:

- Chromium-based browser
- Firefox
- Safari desktop
- Safari iOS
- Chromium Android

WebGL and reduced-motion behavior must be explicitly tested.

## 12. Visual Acceptance

The environment should feel:

- intimate
- mysterious
- peaceful
- deliberate
- restrained
- personal

Reject builds where:

- particle effects dominate
- glow is excessive
- UI looks like an admin dashboard in the sanctuary
- transitions are slow without purpose
- the 3D world obstructs memory reading
- mobile feels like a broken desktop

## 13. UX Acceptance

### Authentication

Minimal threshold.

### Entry

3–5 second cinematic reveal, adjustable for accessibility.

### Exploration

No forced route.

### Focus

Memory becomes the visual center.

### Chronicle

Time feels spatial/continuous.

### Correspondence

Reading is slower and warmer.

### Vault

Search is efficient.

### Horizon

Ending looks forward rather than merely ending.

## 14. Backup & Disaster Recovery Gate

Before production:

1. create database backup
2. verify backup encryption/access policy
3. create representative media backup or replication
4. restore into isolated environment
5. run schema/data consistency checks
6. verify a sample memory and media asset
7. document RTO/RPO achieved in the tested procedure

## 15. Production Deployment Gate

Check:

```text
[ ] Correct domain
[ ] HTTPS active
[ ] HSTS active
[ ] CSP active
[ ] R2 private
[ ] Database credentials valid
[ ] Rate-limit backend available
[ ] Monitoring active
[ ] Error scrubbing verified
[ ] Production migrations applied
[ ] Backup verified
[ ] Restore procedure documented
[ ] All tests green
[ ] E2E critical paths green
[ ] No secret in repository
[ ] No secret in browser bundle
```

## 16. Rollback

Deployment must define:

- application rollback
- database migration rollback/forward-fix strategy
- secret rotation
- storage incident procedure

Do not automatically roll back a database schema migration unless the migration has been explicitly designed to support rollback.

Prefer forward-compatible migrations:

```text
expand
 ↓
deploy compatible code
 ↓
migrate/backfill
 ↓
contract/remove old schema later
```

## 17. Release Evidence

Every production release should record:

- Git commit
- dependency lockfile state
- migration version
- test report
- security checks
- accessibility checks
- performance snapshot
- deployment timestamp
- rollback reference

## 18. Long-Term Maintenance Gate

At least quarterly:

- dependency review
- Next.js security update check
- Node LTS update review
- secret rotation review
- backup restore test
- access review
- log-retention review
- CSP review
- browser compatibility review

## 19. Final Human Acceptance

After all technical gates pass, perform a complete experience run from:

```text
Threshold
 → Authentication
 → Arrival
 → Upper Archive
 → Discover memory
 → Deep Memory
 → Chronicle
 → Correspondence
 → Vault
 → Horizon
 → Return
 → Logout
```

The final human review should answer:

- Does the environment feel quiet?
- Does discovery feel natural?
- Does the content remain the emotional center?
- Does the 3D world help rather than distract?
- Does the site still feel personal on a phone?
- Does the experience remain usable without WebGL?

Only after both technical and experiential gates pass is the release complete.
