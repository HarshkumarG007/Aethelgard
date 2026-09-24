# AETHELGARD

## Phase 3C — Interactive Sanctuary Experience

### Authoritative Preflight & Implementation Specification v1.0

**Status:** AUTHORITATIVE — PREIMPLEMENTATION SPECIFICATION
**Phase:** 3C
**Previous Hardened Checkpoint:** `2aeccf0`
**Immutable Phase 3B Rollback:** `58c6018`
**Phase 3A Checkpoint:** `4d5f879`
**Phase 2 Checkpoint:** `f32216a`

---

# 1. Executive Directive

Phase 3C is the next authorized evolution of Aethelgard's 3D sanctuary.

Phase 3C MUST NOT reinterpret the product architecture.

The governing principle remains:

> **The 3D scene is a disposable, bounded projection of already-authorized sanctuary data; it is never an authoritative source of identity, navigation, authorization, persistence, accessibility, or memory content.**

Phase 3C therefore exists to make the existing 3D projection feel **interactive, spatially coherent, emotionally expressive, and polished** without allowing the visual layer to become a second application.

The canonical functional product remains the existing 2D sanctuary.

If WebGL fails, the complete application MUST remain usable.

If JavaScript 3D code fails, the complete application MUST remain usable.

If an animation fails, the underlying content MUST remain usable.

If the 3D renderer is unavailable, users MUST still be able to access every memory through semantic HTML navigation.

No Phase 3C feature may weaken security, authorization, accessibility, persistence, or the existing Phase 2 API/data contracts.

---

# 2. Starting Boundary

Implementation MUST begin from:

```text
2aeccf0
```

The agent MUST verify before modifying anything:

```bash
git status
git rev-parse HEAD
git log -5 --oneline
```

Expected starting commit:

```text
2aeccf0
```

If the repository is not at this checkpoint, STOP and report the discrepancy.

Do NOT:

* rewrite history;
* amend `2aeccf0`;
* delete `58c6018`;
* reset Phase 3B;
* modify frozen Phase 2 behavior without explicit authorization;
* silently repair unrelated technical debt.

---

# 3. Phase 3C Objective

Phase 3C should transform the existing functional 3D foundation into a coherent interactive sanctuary experience.

The target experience consists of:

1. spatial hover/proximity feedback;
2. meaningful memory-artifact focus;
3. smooth camera transitions;
4. chapter/island interaction;
5. visual state transitions;
6. keyboard/mouse/touch parity;
7. semantic DOM ↔ 3D synchronization;
8. reduced-motion behavior;
9. graceful WebGL degradation;
10. deterministic interaction state;
11. polished visual feedback;
12. robust disposal and lifecycle handling.

Phase 3C is **not** a new data layer.

It is **not** a new navigation system.

It is **not** a new authentication system.

It is **not** a persistence layer.

It is **not** an audio implementation.

It is **not** an opportunity to redesign the existing database/API contracts.

---

# 4. Architectural Laws

## LAW 1 — 2D Is Canonical

The existing 2D sanctuary remains the source of truth.

The 3D scene may visualize:

* chapters;
* memories;
* memory categories;
* focus state;
* proximity;
* navigation intent.

The 3D scene may NOT own:

* authentication;
* authorization;
* session identity;
* database state;
* memory persistence;
* canonical memory content;
* ownership;
* accessibility semantics;
* URL truth.

---

## LAW 2 — One Memory, One Identity

A memory displayed in 3D MUST correspond to an existing authorized memory.

Do not create a second "3D memory" entity.

Do not duplicate memory records.

Do not introduce a 3D-only identifier.

Do not persist camera position as memory state.

---

## LAW 3 — Navigation Remains URL-Based

The canonical destination remains:

```text
/memory/[id]
```

A 3D interaction may initiate navigation to the existing route.

It must not replace that route.

---

## LAW 4 — Authorization Remains Server-Side

No client-side 3D state may be treated as evidence of authorization.

The 3D layer receives only already-authorized data.

Never expose:

* `storageKey`;
* session token;
* password material;
* authorization metadata;
* private infrastructure information.

---

## LAW 5 — Semantic DOM Remains Complete

Every interactive memory represented in the 3D world must remain represented in semantic HTML.

The semantic navigation MUST remain usable independently of WebGL.

Never implement:

```text
canvas-only navigation
```

Never hide the semantic equivalent merely because WebGL is active.

---

# 5. Scope

## IN SCOPE

### 5.1 Interaction

Implement deterministic:

* pointer hover;
* pointer focus;
* pointer activation;
* keyboard focus synchronization;
* proximity state;
* artifact focus;
* chapter focus;
* click/tap navigation;
* Escape behavior;
* focus restoration.

---

### 5.2 Camera

Implement bounded camera transitions between:

```text
ARCHIPELAGO
    ↓
CHAPTER
    ↓
MEMORY
```

Camera movement must be:

* deterministic;
* bounded;
* interruptible;
* reduced-motion aware;
* independent of authorization;
* independent of URL correctness.

---

### 5.3 Visual Feedback

Implement restrained visual responses for:

* hover;
* focus;
* proximity;
* active artifact;
* selected chapter;
* transition state;
* unavailable/degraded 3D state.

Visual feedback must not rely on color alone.

---

### 5.4 Chapter Interaction

A chapter island may expose:

* chapter title;
* memory count;
* visual emphasis;
* proximity behavior;
* semantic association.

Chapter selection must synchronize with the existing chapter/memory navigation model.

Do not create a new chapter routing model unless already defined by Phase 2.

---

### 5.5 Memory Interaction

A memory artifact may transition through:

```text
DORMANT
PROXIMATE
FOCUSED
ACTIVE
```

These states remain governed by the existing ArtifactMachine contract.

Illegal transitions MUST remain impossible.

---

### 5.6 Touch Interaction

Touch interaction must be explicitly handled.

Do not assume:

```text
hover === touch
```

Touch must provide a deterministic interaction path without requiring hover.

Avoid gesture complexity unless demonstrably necessary.

---

### 5.7 Accessibility

Keyboard users must be able to:

* enter 3D;
* move between semantic memories;
* focus the corresponding visual artifact;
* activate a memory;
* escape the focused state;
* return to the semantic navigation.

Screen-reader users must not depend on WebGL.

Reduced-motion users must receive equivalent information without continuous animation.

---

# 6. Explicitly OUT OF SCOPE

The following are prohibited in Phase 3C:

### Audio

No:

* ambient music;
* sound effects;
* positional audio;
* Web Audio;
* autoplay;
* audio assets.

Audio remains deferred.

---

### Persistence

No new:

* camera persistence;
* viewed-state persistence;
* 3D preferences in database;
* interaction history;
* user-specific spatial state.

Local UI preferences are permitted only if explicitly justified and non-sensitive.

---

### Database

No schema changes.

---

### Authentication

No auth changes.

---

### API

No new API endpoints unless a concrete existing contract gap is demonstrated.

A new API endpoint is a Phase 3C STOP condition requiring explicit review.

---

### Media Architecture

Do not alter:

* R2;
* media authorization;
* signed URL generation;
* asset metadata contracts.

---

### New State Libraries

Do not introduce another global state library.

Use the existing state architecture unless a measured architectural deficiency is demonstrated.

---

### New Rendering Framework

Do not replace:

* Three.js;
* React Three Fiber;
* drei.

---

# 7. State Architecture

Phase 3C MUST preserve the three-machine architecture.

## ArtifactMachine

Responsible for:

```text
DORMANT
PROXIMATE
FOCUSED
ACTIVE
```

It owns artifact lifecycle state only.

---

## SpatialViewMachine

Responsible for:

```text
2D
3D_LOADING
3D_READY
3D_DEGRADED
3D_FALLBACK
```

It owns the renderer/view lifecycle.

---

## QualityMachine

Responsible for:

```text
T3
T2
T1
Exhausted
```

It remains monotonic during degradation.

It MUST NOT promote itself based on temporary good frames.

---

# 8. Interaction State Must Be Explicit

Do not infer interaction from scattered booleans such as:

```text
isHovered
isSelected
isFocused
isActive
isTransitioning
```

when those values can represent contradictory states.

Use deterministic state transitions.

Example conceptual model:

```text
IDLE
 ↓
PROXIMATE
 ↓
FOCUSED
 ↓
ACTIVE
```

with explicit exits.

Illegal states must be impossible or rejected.

---

# 9. Pointer Interaction

Pointer interactions MUST:

* identify only currently rendered/authorized artifacts;
* never query arbitrary IDs from the client;
* never expose private metadata;
* synchronize with the semantic representation;
* avoid generating unnecessary React state updates every frame.

Pointer movement MUST NOT trigger:

```text
database requests
API requests
navigation
```

by itself.

Hover is visual state.

Activation is navigation intent.

These are separate concepts.

---

# 10. Hover / Proximity Rules

### DORMANT

Artifact:

* minimal visual treatment;
* no continuous expensive animation;
* no React state churn.

### PROXIMATE

Artifact:

* subtle scale/emissive/fresnel response;
* bounded transition;
* no excessive glow;
* no additional geometry explosion.

### FOCUSED

Artifact:

* visually identifiable;
* camera may transition;
* corresponding semantic element receives synchronized focus where appropriate.

### ACTIVE

Activation results in the existing canonical navigation flow.

---

# 11. Camera Contract

Camera motion MUST be:

* bounded;
* interruptible;
* deterministic;
* reduced-motion compatible.

Do not implement unrestricted cinematic camera behavior.

Do not allow camera movement to:

* leave the intended sanctuary bounds;
* clip continuously through geometry;
* produce extreme near/far-plane artifacts;
* trap keyboard users.

Camera transitions must have a finite duration.

No perpetual camera animation.

---

# 12. Reduced Motion

When:

```text
prefers-reduced-motion: reduce
```

the system MUST:

* disable camera interpolation;
* use immediate/bounded placement;
* disable decorative floating motion;
* disable unnecessary particle motion;
* disable continuous artifact oscillation;
* preserve focus indication;
* preserve all information;
* preserve all interaction.

Reduced motion MUST NOT:

* remove memory content;
* disable navigation;
* downgrade the user to an inaccessible experience.

---

# 13. Performance Contract

The Phase 3B performance contract remains authoritative.

Do NOT introduce a triangle budget that does not exist in the specification.

The canonical empirical rendering target remains:

```text
gl.info.render.calls <= 25
```

Structural application geometry submissions should remain within the established architecture.

Real-time shadows remain disabled.

Instancing remains mandatory for repeated distant geometry.

Do not solve performance problems by:

* deleting semantic DOM;
* removing accessibility;
* hiding content;
* reducing authorization checks;
* weakening data contracts.

---

# 14. Animation Budget

Continuous animation must be justified.

Every animation should answer:

> What information or interaction does this animation communicate?

Decorative animation should be minimized.

Avoid:

```text
setState()
```

inside render loops.

Avoid:

```text
new Array()
new Object()
new Vector3()
new Color()
```

inside hot per-frame paths where reusable objects can be used.

Avoid unnecessary allocations in:

* `useFrame`;
* pointer movement;
* camera updates;
* quality monitoring.

---

# 15. Render-Loop Rules

Per-frame code MUST:

* avoid React state updates;
* avoid uncontrolled allocation;
* avoid unnecessary scene traversal;
* avoid repeated material creation;
* avoid repeated geometry creation;
* avoid redundant camera calculations.

Use stable references and preallocated objects where appropriate.

---

# 16. Resource Lifecycle

Every Phase 3C-created GPU resource MUST have a clear owner.

Resources include:

* geometries;
* materials;
* textures if any are introduced;
* render targets;
* controls;
* event listeners;
* animation handles;
* timers.

No resource may be disposed twice.

No resource may survive the owning scene after unmount.

No shared resource may be disposed by a component that does not own it.

---

# 17. Textures

The Phase 3B prohibition on application-authored raster textures remains active.

Do not introduce:

```text
PNG
JPG
JPEG
WEBP
KTX
HDR
```

assets into the scene without explicit architectural review.

Prefer:

* procedural materials;
* shader parameters;
* geometry;
* CSS/DOM for textual information.

---

# 18. WebGL Failure Model

Any of the following must leave the application usable:

* WebGL unavailable;
* renderer initialization failure;
* context loss;
* shader fallback;
* GPU degradation;
* quality exhaustion;
* runtime rendering exception.

The correct failure path is:

```text
3D failure
   ↓
SpatialViewMachine
   ↓
3D_DEGRADED / 3D_FALLBACK
   ↓
semantic 2D experience
```

Never:

```text
3D failure
   ↓
blank application
```

---

# 19. Accessibility Failure Model

Accessibility must not depend on:

* canvas hit testing;
* WebGL availability;
* GPU performance;
* pointer input;
* animation completion.

The semantic navigation must remain complete.

---

# 20. Focus Synchronization

When a semantic memory receives focus:

```text
DOM focus
   ↓
identify memory
   ↓
3D artifact focus
   ↓
camera may move
```

When a 3D artifact is activated:

```text
3D interaction
   ↓
existing semantic destination
   ↓
canonical URL navigation
```

Do not create a second hidden focus model.

---

# 21. Keyboard Contract

Existing shortcut rules remain authoritative.

In particular:

```text
A = Archive
```

MUST remain unchanged.

Do not assign:

```text
W
A
S
D
```

as movement controls.

Existing shortcuts must continue to work outside editable controls.

Do not globally intercept:

* inputs;
* textareas;
* selects;
* buttons;
* links;
* dialogs.

---

# 22. Touch Contract

Touch activation should require an intentional action.

Avoid accidental navigation from:

* scrolling;
* pointer cancellation;
* incidental contact.

Do not create complex multi-touch navigation unless required by actual UX evidence.

---

# 23. Visual Language

The visual system should remain coherent with Aethelgard.

Prefer:

* restrained luminosity;
* subtle emissive cues;
* depth;
* atmospheric separation;
* chapter identity;
* memory-type differentiation.

Avoid:

* excessive bloom;
* noisy particles;
* flashy game-like UI;
* visual clutter;
* unnecessary HUD elements.

The sanctuary should feel like an archive/sanctuary, not an arcade.

---

# 24. Memory-Type Visual Semantics

The existing memory categories may be visually distinguished without changing their data model.

Possible visual vocabulary:

```text
STANDARD
LETTER
MILESTONE
FUTURE
```

The distinction must remain understandable without relying solely on hue.

Do not introduce new categories.

---

# 25. Chapter Semantics

Each chapter island must remain visually associated with its authorized memories.

A chapter must not display a memory that does not belong to it.

No client-side fabricated relationship is permitted.

---

# 26. Data Boundary

The 3D projection should receive the smallest data representation required for rendering.

Preferred conceptual shape:

```ts
{
  id,
  chapterId,
  title,
  type,
  position
}
```

Never pass:

```text
storageKey
session
passwordHash
signed URLs
private infrastructure metadata
```

unless explicitly required by an already-authorized media contract.

---

# 27. Navigation Boundary

The 3D system may request:

```text
navigate("/memory/<id>")
```

only for an ID already present in authorized sanctuary data.

Never construct arbitrary routes from untrusted pointer metadata.

---

# 28. Testing Requirements

Phase 3C MUST add tests for:

## State

* legal transitions;
* illegal transitions;
* reset behavior;
* focus/active synchronization.

## Accessibility

* semantic navigation exists without WebGL;
* keyboard activation;
* focus synchronization;
* reduced-motion behavior.

## Interaction

* hover;
* focus;
* activation;
* Escape;
* touch path.

## Camera

* bounded destination;
* transition completion;
* interruption;
* reduced-motion immediate placement.

## Failure

* WebGL initialization failure;
* context-loss fallback;
* quality exhaustion;
* shader/material fallback;
* unmount cleanup.

## Performance

* no per-frame React state update;
* render submission structure remains within contract;
* no unexpected geometry duplication;
* no unexpected allocation growth.

## Regression

All previous tests MUST remain green.

---

# 29. Required Test Matrix

At minimum:

```text
0 memories
1 memory
40 memories
200 memories
500 memories

0 chapters
1 chapter
8 chapters
50 chapters
```

Interaction must remain deterministic in all supported fixtures.

---

# 30. Security Regression

Phase 3C MUST preserve all Phase 1/2 security guarantees.

Run the existing suite.

Specifically verify:

* unauthenticated access remains rejected;
* viewer cannot access another user's memory;
* unauthorized memory remains 404 where required;
* media authorization remains server-side;
* storage keys remain private;
* Origin checks remain intact;
* session behavior remains unchanged;
* audit logging remains unchanged.

A 3D interaction MUST NOT create an authorization bypass.

---

# 31. Dependency Policy

Before adding any dependency:

1. explain why the existing stack cannot solve the problem;
2. identify bundle/runtime cost;
3. identify security implications;
4. identify maintenance implications;
5. verify compatibility with Next.js 16 / React 19;
6. update the implementation plan;
7. stop for review if the dependency is architecturally significant.

Do not add a package merely for convenience.

---

# 32. Browser Evidence

The previously documented Playwright environment limitation remains recognized.

Do not falsify browser evidence.

If browser automation is unavailable:

* clearly mark runtime evidence as UNVERIFIED;
* rely on unit/static/SSR/live-HTTP evidence where applicable;
* do not claim GPU/browser behavior was empirically proven.

Do not endlessly modify the architecture merely to compensate for unavailable infrastructure.

---

# 33. Implementation-Plan Requirement

Before writing implementation code, the agent MUST create:

```text
implementation_plan.md
```

or the repository's established implementation-plan location.

The plan MUST contain:

### A. Current-state audit

* exact starting commit;
* relevant files;
* current state machines;
* existing tests;
* existing performance architecture.

### B. Proposed changes

For every file:

```text
FILE
PURPOSE
CHANGE
DEPENDENCIES
RISK
TEST COVERAGE
```

### C. State transition matrix

Explicit legal/illegal transitions.

### D. Interaction architecture

Pointer → artifact → semantic DOM → navigation.

### E. Camera architecture

State, interpolation, bounds, interruption, reduced motion.

### F. Failure architecture

WebGL failure → fallback.

### G. Performance analysis

Expected:

* render submissions;
* allocations;
* animation cost;
* event frequency;
* geometry/material impact.

### H. Accessibility analysis

Keyboard, screen reader, reduced motion, semantic DOM.

### I. Security analysis

Data exposure, navigation, authorization boundary.

### J. Testing plan

Unit + integration + live HTTP/SSR + browser evidence where available.

### K. Rollback plan

Explicit rollback to:

```text
2aeccf0
```

without rewriting history.

---

# 34. Preflight Autopsy

Before implementation, the agent MUST attempt to falsify the design.

Ask:

### Security

> Can a malicious client use a 3D artifact ID to access unauthorized data?

### Authorization

> Can a viewer cause a route or media request outside their authorized scope?

### Accessibility

> Does the application remain fully usable if WebGL is absent?

### State

> Can ArtifactMachine and SpatialViewMachine enter contradictory states?

### Performance

> Can pointer movement or animation cause per-frame React updates?

### Memory

> Can repeated mount/unmount leak GPU resources?

### Navigation

> Can a malformed artifact produce an invalid route?

### Failure

> What happens if WebGL fails halfway through a transition?

### Reduced Motion

> Does reduced motion preserve equivalent information?

### Touch

> Can scrolling accidentally activate a memory?

### Concurrency

> What happens if a user activates one artifact while the camera is transitioning to another?

### Data integrity

> Can the visual layer ever invent a memory?

Any unresolved security-critical ambiguity is a STOP condition.

---

# 35. Premortem

Assume Phase 3C failed in production.

Investigate these failure scenarios:

1. **3D works but keyboard navigation breaks.**
2. **A GPU context loss leaves a blank page.**
3. **Rapid pointer movement causes frame drops.**
4. **Rapid artifact activation causes navigation races.**
5. **Unmount/remount leaks GPU resources.**
6. **Reduced-motion users receive a degraded/incomplete experience.**
7. **A 3D artifact exposes information not present in the authorized 2D dataset.**
8. **Touch users accidentally activate memories while scrolling.**
9. **Camera transitions trap the user in an unreachable spatial state.**
10. **A future optimization accidentally removes semantic DOM.**

Each failure must have:

```text
PREVENTION
DETECTION
RECOVERY
TEST
```

---

# 36. Kill-Critic Review

Before implementation, the agent MUST challenge:

* whether each proposed feature is necessary;
* whether it can be implemented without new dependencies;
* whether it increases render cost;
* whether it duplicates existing state;
* whether it introduces accessibility risk;
* whether it introduces security risk;
* whether it belongs in Phase 3C at all.

If a feature is ornamental but materially increases complexity, it should be removed from the implementation plan.

---

# 37. Definition of Done

Phase 3C is complete only when:

### Architecture

* [ ] 2D remains canonical.
* [ ] 3D remains disposable.
* [ ] no duplicate memory system exists.
* [ ] no duplicate authorization system exists.
* [ ] three-machine architecture remains coherent.

### Interaction

* [ ] pointer interaction works.
* [ ] keyboard interaction works.
* [ ] touch interaction works.
* [ ] focus synchronization works.
* [ ] activation navigates canonically.
* [ ] Escape behavior remains correct.

### Camera

* [ ] bounded.
* [ ] interruptible.
* [ ] deterministic.
* [ ] reduced-motion compliant.

### Accessibility

* [ ] semantic DOM remains complete.
* [ ] screen-reader path remains independent of WebGL.
* [ ] reduced-motion path preserves functionality.
* [ ] no interaction relies exclusively on color.

### Performance

* [ ] no per-frame React state churn.
* [ ] no uncontrolled allocation in hot paths.
* [ ] existing draw-call contract preserved.
* [ ] real-time shadows remain disabled.
* [ ] instancing preserved.

### Security

* [ ] no storage keys exposed.
* [ ] no auth boundary changes.
* [ ] no IDOR introduced.
* [ ] no unauthorized navigation/data access.
* [ ] Origin/session/media contracts unchanged.

### Lifecycle

* [ ] GPU resources disposed correctly.
* [ ] event listeners cleaned up.
* [ ] timers/animation handles cleaned up.
* [ ] repeated mount/unmount tested.

### Validation

* [ ] all existing tests pass.
* [ ] new tests pass.
* [ ] typecheck passes.
* [ ] lint passes.
* [ ] production build passes.
* [ ] live HTTP/SSR validation passes.
* [ ] browser/GPU evidence is explicitly classified as VERIFIED or UNVERIFIED.

---

# 38. Mandatory Stop Conditions

The agent MUST STOP and request review if it discovers:

1. a need for database schema changes;
2. a need to modify authentication;
3. a need to modify authorization;
4. a need to expose private storage metadata;
5. a need for a new API endpoint;
6. a need for a new global state system;
7. a need to remove semantic DOM;
8. a need to make 3D mandatory;
9. a need for audio;
10. a need to rewrite Phase 3B;
11. a performance requirement conflicting with the frozen contract;
12. a security ambiguity;
13. an accessibility regression;
14. a dependency that materially changes architecture.

Do not "solve around" these conditions silently.

---

# 39. Git Discipline

Before implementation:

```bash
git status
git rev-parse HEAD
```

After implementation:

```bash
git diff --check
npm test
npm run typecheck
npm run lint
npm run build
git status
git diff --stat
```

Create a focused commit.

Do not amend:

```text
2aeccf0
```

Do not rewrite history.

---

# 40. Final Phase 3C Principle

The goal is not:

> "Make the website more 3D."

The goal is:

> **Make Aethelgard feel like a coherent spatial sanctuary while preserving the reliability, accessibility, security, and deterministic behavior of the underlying archive.**

The 3D world is the atmosphere.

The archive is the product.

The user's memories are the content.

The server is the authority.

The semantic interface is the accessibility guarantee.

The 3D projection must never reverse those relationships.
