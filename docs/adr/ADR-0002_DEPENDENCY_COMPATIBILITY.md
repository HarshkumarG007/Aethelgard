# ADR-0002 — Dependency Compatibility Resolution: Playwright Test Version

## Status
Accepted

## Context
During Phase 0 environment setup with pinned dependencies (`package.json`), `next@16.0.7` declared an optional peer dependency:
`peerOptional @playwright/test@"^1.51.1" from next@16.0.7`
The initial draft had specified `@playwright/test: 1.50.1`, which failed npm's strict peer-dependency resolution with `ERESOLVE`.

## Decision
Align `@playwright/test` to version `1.51.1` to satisfy the peer dependency of Next.js 16.0.7 without requiring `--legacy-peer-deps` or `--force`.

## Consequences
All peer dependencies resolve cleanly under npm strict resolution, producing a deterministic `package-lock.json`.
