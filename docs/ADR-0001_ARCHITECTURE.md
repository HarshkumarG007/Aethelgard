# ADR-0001 — Architecture Baseline

## Decision

Use a Next.js 16.x Active-LTS App Router application with TypeScript, React 19.x-compatible dependencies, React Three Fiber/Three.js for the immersive layer, PostgreSQL for relational data, Cloudflare R2 for private media, server-side opaque sessions, and a distributed production rate-limit store.

## Why

This keeps the system maintainable while separating:

- web application logic
- relational metadata
- private media
- authentication state
- accessible 2D presentation
- optional 3D enhancement

## Consequences

The browser never receives backend/storage credentials.

The system has a clear 2D functional core and a 3D enhancement layer.

Media access uses short-lived bearer-style R2 URLs and therefore documents their reuse-until-expiry semantics.

Application-level media encryption is not included in v1; adding it later requires a distinct architecture.
