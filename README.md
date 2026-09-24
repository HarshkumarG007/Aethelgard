# Aethelgard — Private Sanctuary & Memory Archive

Aethelgard is a private memory sanctuary designed as an intimate relationship archive. Built upon Next.js 16 (App Router & Turbopack), PostgreSQL (Drizzle ORM), Three.js (React Three Fiber), Sharp image processing, and Cloudflare R2 object storage.

---

## 🏛️ Architecture & Core Principles

1. **2D Canonical Authority:** The 2D sanctuary interface is the primary canonical surface. The 3D archipelago canvas is a disposable, client-only visualization layer that never owns navigation, data fetching, or authentication.
2. **Zero-Trust Media Privacy:** All media is private. Object storage buckets are never public. Uploads strictly require presigned `PUT` authorization with server-side magic-byte sniffing and Sharp image variant generation (`thumbnail`, `small`, `medium`, `large`). Media delivery uses ephemeral (5-minute) signed bearer URLs.
3. **Argon2id Passphrase Authentication:** Single-credential passphrase authentication verified server-side with Argon2id. Sessions are managed via opaque tokens in `__Host-session` cookies (`HttpOnly`, `SameSite=Lax`, `Secure`). No authentication state is ever stored in `localStorage` or `sessionStorage`.
4. **Bounded 3D Performance Budget:** Strict frame-rate and allocation contracts:
   - Total render calls: $\le 25$
   - Application geometry calls: $\le 20$
   - Texture memory: Zero raster texture uploads in baseline 3D
   - CPU geometry/material allocation: $\le 12$ MB
   - Monotonic Adaptive Quality Control (AQC) with 1,000 ms sliding temporal window and 3,000 ms degradation dwell.

---

## 🚀 Quick Start & Development Setup

### Prerequisites
- **Node.js:** $\ge 22.0.0$ (Active LTS)
- **Docker Desktop:** Running Linux containers for PostgreSQL 16

### 1. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### 2. Start PostgreSQL Container
Start PostgreSQL using Docker Compose:
```bash
docker compose up -d
```
*Port mapping: `5434:5432`*

### 3. Database Schema Push & Seed
Push the Drizzle schema to PostgreSQL and provision seed fixtures:
```bash
# Push schema tables
npm run db:push

# Provision default admin and viewer credentials
npm run db:seed

# Populate sanctuary chapters, memories, and media assets
npm run db:seed:sanctuary
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification Commands

All quality gates, security invariants, and accessibility contracts are validated through automated suites:

| Command | Description | Contract Reference |
|---|---|---|
| `npm run lint` | Runs ESLint across all TypeScript and React files | Gate §2 |
| `npm run typecheck` | Strict TypeScript compiler check (`tsc --noEmit`) | Gate §2 |
| `npm run test` | Executes all 16 Vitest unit and integration test suites | Gate §2 |
| `npm run build` | Compiles optimized Next.js production bundle | Gate §2 |
| `npm run start` | Boots production Next.js server locally | Gate §2 |

### Specialized Verification Scripts

- **Disaster Recovery & Backup Gate (§14):**
  ```bash
  npx tsx scripts/backup-restore.ts
  ```
  *Generates SHA-256 cryptographic snapshots, verifies foreign-key referential integrity, and validates RTO ($< 15$ min) and RPO ($< 1$ hr).*

- **Live End-to-End Journey Verification (§19):**
  ```bash
  npx tsx scripts/verify-e2e.ts
  ```
  *Tests unauthenticated redirects, passphrase login, 5 sanctuary surfaces (Archive, Chronicle, Correspondence, Vault, Horizon), deep view with anti-enumeration, ephemeral media access, and session revocation.*

---

## 📁 Repository Structure

```text
├── app/                      # Next.js 16 App Router
│   ├── (sanctuary)/          # Protected sanctuary routes (Timeline, Letters, Vault, Horizon)
│   ├── api/                  # Route handlers (Auth, Memories, Media, Admin)
│   └── auth/                 # Passphrase authentication threshold
├── components/
│   ├── 3d/                   # Three.js / R3F Canvas, Archipelago, Shaders, Quality Machine
│   ├── admin/                # In-Browser Memory Composer & Upload Modal
│   ├── media/                # Accessible MediaViewer, VoiceRecorder, Audio/Video Players
│   └── sanctuary/            # 2D Sanctuary UI (Chronicle, LettersChamber, VaultArchive)
├── docs/                     # Specifications, Contracts, ADRs, and Release Evidence
│   ├── 01_AETHELGARD_MASTER_BUILD_SPEC.md
│   ├── 02_SECURITY_PRIVACY_CONTRACT.md
│   ├── 03_DATA_API_MEDIA_CONTRACT.md
│   ├── 04_ACCEPTANCE_RELEASE_GATE.md
│   ├── PHASE-6-HARDENING.md
│   ├── RELEASE_EVIDENCE.md
│   └── adr/                  # Architectural Decision Records
├── lib/
│   ├── auth/                 # Argon2id, Session Token Jar, Guards, Rate Limiting
│   ├── data/                 # Server-side Drizzle memory and chapter queries
│   ├── db/                   # Drizzle client and PostgreSQL schema definition
│   ├── security/             # CSRF origin validation, magic bytes file sniffing
│   ├── storage/              # Local & Cloudflare R2 storage drivers, Sharp pipeline
│   └── validation/           # Zod schemas for API requests and media
├── scripts/                  # Seed, Disaster Recovery, and E2E verifiers
└── tests/                    # 16 Vitest suites covering 206 automated test cases
```

---

## 🔒 Security Hardening

- **CSRF Protection:** State-modifying endpoints (`POST`, `PATCH`, `DELETE`) require exact Origin verification.
- **SQL Injection Prevention:** 100% parameterized queries via Drizzle ORM.
- **XSS Sanitization:** All memory titles and bodies are rendered safely via React virtual DOM escaping.
- **Private Response Headers:** Authenticated routes enforce `Cache-Control: no-store, private`.
- **Error Sanitization:** Stack traces and internal database errors are scrubbed in production responses.
- **Disaster Recovery:** Cryptographically verified snapshot recovery achieves RTO $< 0.01$s and RPO $< 0.01$h.

---

## 📜 License & Privacy

Aethelgard is private, proprietary software created strictly for personal relationship preservation.
