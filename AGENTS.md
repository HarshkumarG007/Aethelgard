# AETHELGARD — AGENTS.md

## Role

You are the implementation agent for Aethelgard.

Build the repository according to the documents in `/docs/` and this file. Do not invent private-content behavior, security behavior, data contracts, or authentication behavior that contradicts those documents.

## Mandatory Reading

Read, in order:

- `00_HANDOFF.md`
- `01_AETHELGARD_MASTER_BUILD_SPEC.md`
- `02_SECURITY_PRIVACY_CONTRACT.md`
- `03_DATA_API_MEDIA_CONTRACT.md`
- `04_ACCEPTANCE_RELEASE_GATE.md`

## Rules

### Security

- Never put credentials, API keys, storage keys, session tokens, or passphrases into client bundles.
- Never use localStorage/sessionStorage for authentication.
- Never trust client authorization.
- Every protected server request authenticates the session and authorizes the resource.
- Never make the R2 bucket public.
- Never expose a raw R2 object path as a public endpoint.
- Presigned URLs are bearer tokens. Treat them as reusable until expiration; never claim they are single-use.
- Never use presigned POST. Browser uploads use presigned PUT.
- Passphrases are submitted over TLS and verified server-side using Argon2id. Do not invent a client-hash authentication scheme.
- Never log plaintext passphrases, session tokens, signed URLs, memory contents, letter bodies, or encryption secrets.
- Unsafe HTTP methods require an Origin check against the exact site origin.
- Protected content responses must not be cached by browser/CDN.
- Do not add analytics/tracking unless explicitly authorized.

### Data

- All DB access is server-side.
- Use parameterized queries/ORM APIs.
- Use transactions for multi-step writes.
- Use server timestamps.
- Soft delete first; purge only through an explicit maintenance workflow.
- Never return more fields than a client screen needs.
- Use opaque UUIDs for resource identifiers, but rely on authorization—not UUID secrecy—for access control.

### Next.js

- Use the pinned current Active-LTS Next.js version.
- In Next.js 16, use `proxy.ts` where request interception is required; do not assume old `middleware.ts` conventions.
- Keep privileged logic in server-only modules.
- Use `server-only` boundaries where appropriate.
- Keep private routes explicitly protected.

### 3D

- Keep WebGL/Three.js code isolated from server components.
- Dynamically load the 3D experience.
- Dispose geometries, materials, textures, render targets and controls.
- Use instancing/culling/LOD for repeated objects.
- Handle WebGL context loss.
- Never make the 3D canvas the only way to use the site.
- Respect `prefers-reduced-motion`.
- Maintain keyboard, screen-reader and 2D alternatives.

### UX

- The main interaction model is “attention as the interface”: gaze/proximity/hover creates affordance, click/tap confirms intent.
- Motion is cinematic, never constant.
- The interface should feel quiet, deliberate and personal.
- No generic romantic stock motifs.
- Do not make content discovery feel like a dashboard unless the user is in the Vault.

### Engineering

- TypeScript strict mode.
- No `any` except a justified third-party boundary, documented in code.
- Validate external data with Zod or equivalent.
- No silent catch blocks.
- No TODOs for security-critical behavior.
- No disabled lint/type checks to get a build green.
- Every phase must leave the repo buildable.
- Record meaningful architecture decisions in `docs/adr/`.

## Autonomous Decision Rule

If ambiguity is:

- **Security-critical:** stop, document the risk, and do not guess.
- **Data-integrity-critical:** stop, document the risk, and do not guess.
- **Accessibility-critical:** implement the safest standards-based behavior.
- **Low-risk implementation detail:** choose the simplest maintainable option, document the choice, and continue.

Do not repeatedly ask the human for trivial choices.

## Required First Actions

1. Inspect repository.
2. Read all required docs.
3. Identify existing state versus target state.
4. Create/update architecture notes.
5. Validate toolchain versions.
6. Run a baseline build/typecheck/test.
7. Implement Phase 0 before feature work.
8. Keep every checkpoint reversible.
