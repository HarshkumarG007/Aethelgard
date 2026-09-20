# PHASE 3B PREFLIGHT SPECIFICATION (v2.1) — SPATIAL RICHNESS & ARCHIPELAGO ARCHITECTURE

**Status:** PROPOSED ENGINEERING BLUEPRINT v2.1 — AWAITING HUMAN FORENSIC GATE  
**Rollback Baseline:** `4d5f879efe057e3500a4955081c7cc89261bcf58` (`4d5f879` — Phase 3A Frozen)  
**Parent Baseline:** `f32216ad577dcde7cc7a686332271b43b9da4d34` (`f32216a` — Phase 2 Canonical 2D Core)  
**Implementation Authorization:** 🔴 **NOT YET AUTHORIZED (ZERO CODE CHANGES IN THIS GATE)**

---

## 1. Prime Architectural Principle

> **"The 3D scene is a disposable, bounded projection of already-authorized sanctuary data; it is never an authoritative source of identity, navigation, authorization, persistence, or memory content."**

The canonical product of Aethelgard is the accessible 2D sanctuary. The 3D layer is an optional, replaceable presentation projection that enhances atmospheric depth without ever holding private state or owning memory navigation.

---

## 2. Invariant Boundaries Carried Forward from Phase 3A

1. **2D Canonical Sanctuary is Primary:** Initial cold load is 100% 2D Upper Archive. 3D initializes only upon explicit user interaction ("Enter 3D Sanctuary").
2. **Semantic DOM Independence:** The semantic memory navigation (`<nav aria-label="Spatial Memories Navigation">`) remains present in the accessibility/DOM tree regardless of 2D/3D mode, visibility state, AQC tier, WebGL availability, or reduced-motion preference.
3. **Security Boundary is Immutable:** The spatial layer receives only safe domain projections (`MemorySummary`, `ChapterSummary`, `SpatialMemoryData`). Zero `storageKey`, zero signed URLs, zero session tokens, zero credentials, zero raw DB rows. Ephemeral media access remains exclusively governed by server-side `POST /api/media/access`.
4. **No Parallel Memory-Detail System:** 3D activates standard Next.js route navigation to `/memory/[id]`. No duplicate narrative drawers or deep-view business logic inside the 3D layer.
5. **Single-Owner Resource Disposal:** Every GPU resource (geometries, shader materials, particle buffers) has exactly one owner and one deterministic disposal path on unmount.
6. **Keyboard Stability:** `A` remains strictly mapped to `/archive` (The Vault). Zero WASD interception. Shortcut guards ignore typing inside `input`, `textarea`, `select`, `button`, `a`, `isContentEditable`, and `dialog`.
7. **NO AUDIO:** Web Audio is strictly excluded from Phase 3B.
8. **Zero Application-Authored Raster Textures:**
   - `PNG = 0`
   - `JPG/JPEG = 0`
   - `WEBP = 0`
   - `KTX/KTX2 = 0`
   - `HDR/EXR = 0`
   - `External texture URLs = 0`

---

## 3. Subsystem Specifications

### Subsystem 1: Chapter Archipelago Layout (`ArchipelagoLayout.ts`)

A pure deterministic mathematical function with zero UI dependencies:
```ts
export interface ArchipelagoLayout {
  islands: {
    chapterId: string;
    title: string;
    center: [number, number, number];
    radius: number;
  }[];
  memories: {
    id: string;
    chapterId: string | null;
    kind: "standard" | "letter" | "milestone" | "future";
    worldPosition: [number, number, number];
    localOffset: [number, number, number];
    islandCenter: [number, number, number];
  }[];
}

export function computeArchipelagoLayout(
  chapters: ChapterSummary[],
  memories: MemorySummary[]
): ArchipelagoLayout;
```

#### Mathematical Invariants & Collision Guarantees:
1. **Minimum Center Distance:**
   $$\forall i \ne j, \quad \text{dist}(C_i, C_j) \ge 15.0\text{ units}$$
2. **Minimum Edge-to-Edge Clearance:**
   With maximum island radius $R_{\text{island}} \le 5.5\text{ units}$:
   $$\text{Clearance} = \text{dist}(C_i, C_j) - (R_i + R_j) \ge 15.0 - (5.5 + 5.5) = 4.0\text{ units}$$
3. **$N = 0$ Chapters:**
   Single "Origin Dais" placed at `[0, 0, 0]` with radius $5.5$. All memories cluster in concentric golden orbits ($r \in [2.5, 4.8]$).
4. **$N = 1$ Chapter:**
   Single island placed at `[0, 0, 0]` with radius $5.5$.
5. **$N \in [2, 7]$ Chapters:**
   Distributed along an elliptical perimeter of radius $R = \max(18, 7 \cdot \sqrt{N})$ with center distances verified $\ge 15.0\text{ units}$.
6. **$N \ge 8$ Chapters (Multi-Ring Deterministic Policy):**
   The implementation is authorized to select deterministic multi-ring concentric placement, provided all generated island positions strictly satisfy:
   - $\text{dist}(C_i, C_j) \ge 15.0\text{ units}$ for all island pairs
   - $|X| \le 45.0\text{ units}$ and $|Z| \le 45.0\text{ units}$ (within far fog boundary)
   - Covered by property-style Vitest tests asserting pairwise distance $\ge 15.0$ for $N \in \{8, 15, 50\}$.
7. **Memory Stacking & Concentration:**
   - **Visual Projection Rule:** The 3D scene is a bounded visual projection of already-authorized sanctuary data, not a one-to-one mesh rendering guarantee. Every memory is present in the semantic DOM, while the 3D scene instantiates only the bounded render set.
   - For an island with $M$ memories:
     - If $M \le 6$: 1 concentric ring at $r = 2.8$.
     - If $M > 6$: Concentric rings spaced by $\Delta r = 1.0$, with island radius capped at $5.5\text{ units}$. Maximum individually placed proximate anchors per island $\le 12$; remaining memories map to instanced distant batches.

---

### Subsystem 2: Spatial Visibility & Bounded Rendering Architecture

To guarantee that arbitrary archive sizes do not degrade frame rates or explode draw calls:

#### Formal Visibility & LOD Classifications:
1. **`FOCUSED` (1 artifact):**
   - Active user focal selection.
   - Rendered as an individual procedural mesh with full custom GLSL aura shader.
   - Camera targeting focal frame.
2. **`PROXIMATE` ($\le 5$ artifacts):**
   - Artifacts immediately adjacent on the active chapter island.
   - Rendered as individual procedural meshes with simplified standard material.
3. **`DISTANT` (Remainder of archive):**
   - Batched into exactly 4 `THREE.InstancedMesh` instances categorized by kind:
     1. Standard Prism InstancedMesh
     2. Letter Plaque InstancedMesh
     3. Milestone Orb InstancedMesh
     4. Future Arch InstancedMesh
   - Transformed via single 4x4 instance matrix per artifact; colored via `instanceColor`.
4. **`OUTSIDE_RENDER_VOLUME`:**
   - Beyond far fog distance ($> 50\text{ units}$) or outside frustum.
   - Not rendered in WebGL.
   - **Crucial Invariant:** Still 100% present in the independent semantic DOM directory.

#### Draw-Call Budget:
- **Application Scene Draw-Call Budget:** $\le 25$ under the defined Phase 3B renderer configuration, excluding renderer-internal passes not created by Aethelgard.
- **Scene Geometry Draw Calls:**
  - Island Dais Bases: **1 InstancedMesh**
  - Island Ring Trims: **1 InstancedMesh**
  - Distant Standard Artifacts: **1 InstancedMesh**
  - Distant Letter Artifacts: **1 InstancedMesh**
  - Distant Milestone Artifacts: **1 InstancedMesh**
  - Distant Future Artifacts: **1 InstancedMesh**
  - Focused Artifact: **1 Mesh**
  - Proximate Artifacts: **$\le 5$ Meshes**
  - Atmospheric Points: **1 Points**
  - Background clear: **0**
  - Total Application Geometry Draw Calls: **$\le 13$** (well within the $\le 25$ budget).
- **Lighting Pipeline:**
  - Ambient Light + 1 Key Directional Light + 1 Fill Point Light.
  - **Real-Time Shadow Maps are STRICTLY DISABLED** in Phase 3B (`castShadow = false`, `receiveShadow = false`). This eliminates shadow-pass draw call overhead and GPU performance variables.

---

### Subsystem 3: Dual-Material Pipeline & Deterministic Shader Fallback

Custom GLSL shaders must never cause the WebGL scene to crash or retreat to 2D.

#### Pre-Validated Dual-Material Strategy:
```text
3D Initialization
       │
       ▼
Shader Capability Probe (validate compile / program link)
       │
       ├─────────────────────────────────┐
       ▼                                 ▼
[CAPABILITY PASS]                 [CAPABILITY FAIL]
       │                                 │
materialMode = "shader"           materialMode = "standard"
       │                                 │
       ▼                                 ▼
MemoryAuraShaderMaterial          MeshStandardMaterial
(GLSL Fresnel Glow)               (Static Emissive Matching)
       │                                 │
       └────────────────┬────────────────┘
                        ▼
            3D Sanctuary Continues Normally
```

1. **Failure Hierarchy:**
   - Shader unsupported / compile failure ➔ **Step down to `MeshStandardMaterial`**. The 3D scene continues running smoothly.
   - 3D fallback to 2D occurs **only** if WebGL itself is unavailable or if AQC reaches `EXHAUSTED`.
2. **GLSL Implementation (`memoryAura.ts`):**
   - **Vertex Shader:**
     ```glsl
     varying vec3 vNormal;
     varying vec3 vViewPosition;
     uniform float uTime;
     uniform float uDisplacement; // 0.0 under reduced motion

     void main() {
       vNormal = normalize(normalMatrix * normal);
       vec3 pos = position;
       if (uDisplacement > 0.0) {
         pos += normal * (sin(uTime * 2.0 + position.y * 3.0) * 0.03 * uDisplacement);
       }
       vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
       vViewPosition = -mvPosition.xyz;
       gl_Position = projectionMatrix * mvPosition;
     }
     ```
   - **Fragment Shader:**
     ```glsl
     varying vec3 vNormal;
     varying vec3 vViewPosition;
     uniform vec3 uColor;
     uniform float uEmissiveIntensity;

     void main() {
       vec3 normal = normalize(vNormal);
       vec3 viewDir = normalize(vViewPosition);
       float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.5);
       vec3 finalColor = uColor * (0.35 + fresnel * uEmissiveIntensity);
       gl_FragColor = vec4(finalColor, 0.95);
     }
     ```
3. **Independent Testability:**
   - The material factory exposes `createArtifactMaterial(mode: "shader" | "standard")`.
   - The standard fallback path is tested directly and independently in unit tests without requiring GPU hardware failure.

---

### Subsystem 4: Monotonic Adaptive Quality Controller (AQC)

#### State Isolation:
Quality is managed by an independent `QualityMachine`:
- `ArtifactMachine`: `DORMANT`, `PROXIMATE`, `FOCUSED`, `ACTIVE`
- `SpatialViewMachine`: `2D`, `3D_LOADING`, `3D_READY`, `3D_DEGRADED`, `3D_FALLBACK`
- `QualityMachine`: `TIER_3`, `TIER_2`, `TIER_1`, `EXHAUSTED`

#### Monotonic Progression & Reset Rules:
$$\text{Tier 3 (High)} \longrightarrow \text{Tier 2 (Balanced)} \longrightarrow \text{Tier 1 (Eco)} \longrightarrow \text{EXHAUSTED}$$
1. **Monotonicity:** Quality only steps down during an active 3D session. Upward promotion is strictly prohibited during the same session, preventing quality hunting/oscillation.
2. **Hysteresis & Dwell Timer:**
   - Rolling sample window: Accumulates frame deltas covering the most recent $1,000\text{ ms}$ using a fixed pre-allocated ring buffer.
   - Frame-time thresholds:
     - Tier 3 ➔ Tier 2: Average frame time $\overline{\Delta t} > 33.33\text{ ms}$ (below 30 FPS)
     - Tier 2 ➔ Tier 1: Average frame time $\overline{\Delta t} > 33.33\text{ ms}$ (below 30 FPS)
     - Tier 1 ➔ Exhausted: Average frame time $\overline{\Delta t} > 50.00\text{ ms}$ (below 20 FPS)
   - **Dwell Duration:** $3,000\text{ ms}$ of continuous elapsed wall-clock time.
   - **Cancellation & Reset Rule:** If the threshold condition ceases before the $3,000\text{ ms}$ dwell duration expires (e.g. frame times recover at $1.8\text{ s}$), the degradation timer resets to $0\text{ ms}$.
   - **Demotion Reset:** Upon a completed tier step-down, the dwell timer resets to $0\text{ ms}$ and begins monitoring the new tier independently.
3. **Tier 0 Ownership & Decoupling:**
   - AQC runs inside the 3D scene and does **not** directly unmount `<Canvas>`.
   - When reaching `EXHAUSTED`, AQC dispatches pure event `QUALITY_EXHAUSTED` to `SpatialViewMachine`.
   - `SpatialViewMachine` transitions to `3D_FALLBACK` (`errorMessage: "Spatial rendering paused to preserve device performance"`).
   - `SanctuaryViewSwitch` (DOM level) observes `3D_FALLBACK`, unmounts `SanctuaryCanvas`, and restores authoritative 2D sanctuary.

#### Allocation Rules inside `useFrame`:
- Zero `Date.now()` calls; uses `performance.now()`.
- Zero per-frame memory allocations (no array copies, no object instantiations).
- Zero per-frame React state updates (updates occur only when a tier demotion triggers).

#### Tier Profile Table:
| Tier | Target DPR | Instanced Distant Mesh | Atmospheric Motes | Shader Profile |
|---|:---:|:---:|:---:|---|
| **Tier 3 (High)** | `1.5` | Standard procedural geometry | 300 motes | Full Fresnel + vertex wave |
| **Tier 2 (Balanced)** | `1.0` | Simplified geometry | 120 motes | Static Fresnel (no vertex wave) |
| **Tier 1 (Eco)** | `0.75` | Minimal bounding box | 0 motes | Standard `MeshStandardMaterial` |
| **Exhausted** | N/A | None | 0 | Canvas unmounts ➔ Bounded 2D fallback |

---

### Subsystem 5: Reduced-Motion Semantics (Visual Fidelity Preserved)

Selecting `prefers-reduced-motion: reduce` minimizes motion sickness triggers without degrading visual fidelity:
1. **Camera:** Teleports immediately to focal coordinates (damping factor bypassed, zero interpolation).
2. **Artifacts:** Static orientation ($0\text{ continuous rotation}$), static elevation ($0\text{ floating/bobbing}$).
3. **GLSL Shader:** Vertex wave displacement uniform $u_{\text{Displacement}} = 0.0$ (static Fresnel chromatic glow remains active).
4. **Atmospheric Motes:** Particles remain rendered at fixed, frozen positions with zero drift velocity ($v = 0$).
5. **Non-Degradation Guarantee:** Reduced motion does **NOT** downgrade the quality tier. A user on high-end hardware with reduced motion enabled receives Tier 3 visual fidelity with zero motion triggers.

---

### Subsystem 6: Performance Budgets & Benchmark Datasets

#### 1. Canonical Visual Benchmark Scene:
- 8 Chapters
- 40 Memories (25 standard, 5 letters, 5 milestones, 5 future)
- 1 Central Well (Origin Dais)
- Tier 3 atmospheric motes (300 particles)
- **Empirical Target:** `gl.info.render.calls <= 25` in supported browser environment.

#### 2. Structural Stress Fixtures (Bounded Scaling Proofs):
- Fixture A: 0 chapters, 200 memories
- Fixture B: 1 chapter, 500 memories
- Fixture C: 50 chapters, 500 memories
- **Structural Proof:** In all stress fixtures, instanced batching bounds total application geometry draw calls to $\le 20$.

#### 3. Measurable GPU Memory Allocation Target:
- **Application-Owned Geometry/Material Allocation Budget:** $\le 12\text{ MB}$ estimated from CPU-side typed-array and index-buffer byte sizes:
  $$\text{Memory}_{\text{CPU}} = \sum (\text{attribute buffers} + \text{index buffers})$$
  (Excluding driver/runtime overhead outside application control). Tested via automated unit test.

---

## 4. File Structure & Component Seam

```text
components/sanctuary/3d/
├── state/
│   ├── sanctuary3d.types.ts         # [MODIFY] Add QualityState, QualityEvent, ArchipelagoLayout types
│   ├── sanctuary3d.machine.ts       # [MODIFY] Add pure QualityMachine + QUALITY_EXHAUSTED handling
│   └── sanctuary3d.store.ts         # [MODIFY] Bind quality machine transitions (presentation only)
├── islands/
│   ├── ArchipelagoLayout.ts         # [NEW] Pure deterministic spatial coordinate generator
│   └── ChapterIslandMesh.tsx        # [NEW] Instanced dais bases for chapter islands
├── shaders/
│   ├── memoryAura.ts                # [NEW] Dual-path GLSL shader + standard material fallback
│   └── atmosphericMotes.ts          # [NEW] Instanced atmospheric points geometry
├── quality/
│   └── AdaptiveQualityController.ts   # [NEW] Monotonic rolling frame-time monitor (Tier 3 -> 0)
├── CameraRig.tsx                    # [MODIFY] Archipelago-aware camera framing (island focal centers)
├── MemoryArtifact.tsx               # [MODIFY] Connect dual-material aura with instant reduced-motion
├── SanctuaryScene.tsx               # [MODIFY] Assemble archipelagos, instanced LOD, and motes
└── SanctuaryCanvas.tsx              # [MODIFY] Binds dynamic DPR [1.5, 1.0, 0.75] from QualityMachine
```

---

## 5. Acceptance Release Gate for Phase 3B

Prior to declaring Gate 3B closed:

1. **Regression Gate:** All 100 existing tests (Phase 0, 1, 2, 3A) remain 100% green.
2. **Quality Machine Tests (`tests/unit/quality-machine.test.ts`):**
   - 100% transition coverage: `Tier 3 ➔ Tier 2 ➔ Tier 1 ➔ Exhausted`.
   - Monotonicity verified (rejection of upward promotion during active session).
   - Cancellation & reset of dwell timer verified when frame times recover before $3,000\text{ ms}$.
   - Cross-machine emission of `QUALITY_EXHAUSTED` ➔ `SpatialViewMachine` (`3D_FALLBACK`).
3. **Archipelago Layout Tests (`tests/unit/archipelago-layout.test.ts`):**
   - Verified pairwise distance $\text{dist}(C_i, C_j) \ge 15.0\text{ units}$ for $N \in \{2, 3, 7, 15, 50\}$.
   - Edge cases verified: $N=0$ (central well), $N=1$, $M=0$, $M=500$.
   - Bound $|Z| \le 45.0$ verified across all configurations.
4. **Shader Fallback Tests (`tests/unit/shader-fallback.test.ts`):**
   - Dual-material instantiation verified; standard material fallback verified when shader mode is disabled.
5. **Memory Allocation Calculation Test (`tests/unit/gpu-budget.test.ts`):**
   - Application-owned typed-array buffer memory verified $\le 12\text{ MB}$ on canonical benchmark dataset.
6. **Zero Asset Boundary Verified:**
   - 0 raster textures (`PNG`, `JPG`, `WEBP`, `KTX`, `HDR`) authored or requested over network.
7. **Typecheck, Lint & Build:**
   - `tsc --noEmit`: 0 errors.
   - `eslint .`: 0 errors, 0 warnings.
   - `next build`: Production build succeeds cleanly.
8. **Accessibility Parity:**
   - Independent semantic DOM navigation remains 100% present and interactive.
   - Tab, Enter, Escape, and `A` shortcut navigation remain verified.
9. **Negative Confirmations:**
   - Zero audio / Web Audio code.
   - Zero modifications to auth, database schema, media pipeline, or Phase 2 APIs.

---

## 6. Preflight Authorization Request

Phase 3B implementation remains **STRICTLY HALTED**.

Awaiting human review of **Phase 3B Preflight Specification (v2.1)**.
