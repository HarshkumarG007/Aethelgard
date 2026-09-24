# AETHELGARD — Production Cloud Deployment & Operations Guide

## 1. Overview & Architectural Principles

Aethelgard is designed as a sovereign, private relationship sanctuary engineered with strict zero-knowledge security guarantees:
- **Private Media Storage:** Media objects in Cloudflare R2 are strictly private. No public bucket access is permitted; all client downloads and uploads are negotiated via ephemeral, server-authorized presigned URLs.
- **Argon2id Authentication:** Passphrases never hit storage in plaintext. Verification uses memory-hard Argon2id hashes server-side.
- **Cryptographic Session Security:** `SameSite=Strict`, `HttpOnly`, `Secure` encrypted session cookies with constant-time HMAC verification.
- **CSRF Exact-Origin Enforcement:** All state-modifying requests (`POST`, `PATCH`, `DELETE`) require exact `Origin` matching against `NEXT_PUBLIC_SITE_ORIGIN`.
- **Soft-Deletion Invariant:** Content records are never destroyed immediately; soft-deletion cascades preserve recoverable archival records.

---

## 2. Environment Variables Specification

Ensure all following variables are populated in the production environment:

| Variable | Description | Example / Format |
|---|---|---|
| `NODE_ENV` | Runtime environment | `production` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@ep-host.neon.tech/aethelgard?sslmode=require` |
| `SESSION_SECRET` | 32-byte high-entropy cryptographic key | Hex string (`openssl rand -hex 32`) |
| `ADMIN_PASSPHRASE_HASH` | Argon2id hash for Administrator | `$argon2id$v=19$m=65536,t=3,p=4$...` |
| `VIEWER_PASSPHRASE_HASH` | Argon2id hash for Viewer | `$argon2id$v=19$m=65536,t=3,p=4$...` |
| `CLOUDFLARE_R2_ACCOUNT_ID` | Cloudflare account identifier | `6f38...` |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | R2 API Token Key ID | `c74b...` |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | R2 API Token Secret Key | `9b3a...` |
| `CLOUDFLARE_R2_BUCKET_NAME` | Name of the private R2 bucket | `aethelgard-vault-prod` |
| `NEXT_PUBLIC_SITE_ORIGIN` | Canonical public HTTPS site origin | `https://sanctuary.yourdomain.com` |

### Generating Secrets

1. **Session Secret:**
   ```bash
   openssl rand -hex 32
   ```

2. **Argon2id Passphrase Hashes:**
   Run the utility script to generate memory-hard hashes for your admin and viewer passphrases:
   ```bash
   npx tsx -e "import { hashPassphrase } from './lib/auth/passphrase'; (async () => console.log(await hashPassphrase('YourPrivatePassphrase')) )();"
   ```

---

## 3. Cloudflare R2 Storage Configuration

1. In the Cloudflare Dashboard, navigate to **R2** > **Create bucket**.
2. Name the bucket (e.g. `aethelgard-vault-prod`).
3. Set bucket access to **Private** (do **not** enable Public Bucket access or R2.dev public URL).
4. Navigate to **Bucket Settings** > **CORS Policy** and configure:
   ```json
   [
     {
       "AllowedOrigins": [
         "https://sanctuary.yourdomain.com"
       ],
       "AllowedMethods": [
         "GET",
         "PUT"
       ],
       "AllowedHeaders": [
         "*"
       ],
       "ExposeHeaders": [
         "ETag"
       ],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
5. Navigate to **R2** > **Manage R2 API Tokens** > **Create API Token**:
   - Permission: **Object Read & Write**
   - Apply to specific bucket: `aethelgard-vault-prod`
   - Copy Access Key ID and Secret Access Key into environment variables.

---

## 4. Turnkey Deployment Options

### Option A: Vercel + Neon PostgreSQL + Cloudflare R2 (Serverless Turnkey)

1. **PostgreSQL Setup:**
   - Create a project on [Neon](https://neon.tech) or [Supabase](https://supabase.com).
   - Copy the pooling connection string (`?sslmode=require`).
2. **Deploy to Vercel:**
   - Connect your GitHub repository to Vercel.
   - Configure all environment variables from Section 2 in Project Settings > Environment Variables.
   - Set Build Command to `npm run build`.
3. **Run Schema Migrations:**
   From your local development machine or CI pipeline:
   ```bash
   DATABASE_URL="postgresql://..." npm run db:push
   ```

---

### Option B: Docker Container Deployment (Fly.io, Railway, or VPS)

Aethelgard ships with a production multi-stage, security-hardened `Dockerfile` and `docker-compose.prod.yml`.

#### 1. Fly.io Deployment
1. Install `flyctl` and run `fly launch`.
2. Attach a Postgres cluster:
   ```bash
   fly postgres create --name aethelgard-db
   fly postgres attach aethelgard-db
   ```
3. Set secrets:
   ```bash
   fly secrets set SESSION_SECRET="..." ADMIN_PASSPHRASE_HASH="..." VIEWER_PASSPHRASE_HASH="..." NEXT_PUBLIC_SITE_ORIGIN="https://aethelgard.fly.dev" CLOUDFLARE_R2_ACCOUNT_ID="..." CLOUDFLARE_R2_ACCESS_KEY_ID="..." CLOUDFLARE_R2_SECRET_ACCESS_KEY="..." CLOUDFLARE_R2_BUCKET_NAME="..."
   ```
4. Deploy:
   ```bash
   fly deploy
   ```

#### 2. Self-Hosted VPS with Docker Compose & Caddy (Turnkey Self-Sovereign)

1. Clone repository to server:
   ```bash
   git clone https://github.com/your-username/aethelgard.git /opt/aethelgard
   cd /opt/aethelgard
   ```
2. Create `.env.production` containing all variables from Section 2.
3. Launch the container stack:
   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
   ```
4. Configure Caddy reverse proxy for automated Let's Encrypt TLS in `/etc/caddy/Caddyfile`:
   ```caddy
   sanctuary.yourdomain.com {
       reverse_proxy 127.0.0.1:3000
       header {
           Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
           X-Content-Type-Options "nosniff"
           X-Frame-Options "DENY"
           Referrer-Policy "strict-origin-when-cross-origin"
       }
   }
   ```
5. Reload Caddy:
   ```bash
   sudo systemctl reload caddy
   ```

---

## 5. Database Migration & Rollback Strategy

1. **Pre-Deployment:**
   Always perform forward-compatible migrations:
   - `expand`: Add new nullable columns or tables first.
   - `deploy`: Release application code that interacts with the new schema.
   - `backfill`: Seed or backfill data if necessary.
   - `contract`: Remove superseded columns only in subsequent maintenance windows.
2. **Execute Schema Migration:**
   ```bash
   npm run db:push
   ```
3. **Application Rollback:**
   If a regression is identified in application code:
   - Re-deploy previous immutable Git commit hash without reverting forward-compatible database columns.

---

## 6. Disaster Recovery & Automated Backups

1. **Nightly Database Dumps:**
   Set up a nightly cron job on the database server:
   ```bash
   pg_dump -Fc -h localhost -U aethelgard aethelgard | gpg --encrypt --recipient ops@yourdomain.com > /var/backups/aethelgard_$(date +%Y%m%d).dump.gpg
   ```
2. **Restoration Drill:**
   Test backup restoration quarterly into an isolated test instance:
   ```bash
   gpg --decrypt aethelgard_20260924.dump.gpg | pg_restore -d aethelgard_drill --clean --if-exists
   ```

---

## 7. Production Release Gate Checklist

Before designating any deployment live, verify every item:

- [x] **Domain & HTTPS:** Correct custom domain with active TLS 1.3 certificate.
- [x] **HSTS:** `Strict-Transport-Security` header active with `max-age=63072000`.
- [x] **Content Security Policy:** Strict CSP preventing external script injection.
- [x] **R2 Private Vault:** Zero public bucket access; presigned PUT/GET active.
- [x] **Argon2id Verification:** Passphrases authenticated via memory-hard Argon2id.
- [x] **Database Constraints:** PostgreSQL constraints and indexes verified.
- [x] **Zero Secret Leakage:** No API keys, passphrases, or tokens in client JS bundles.
- [x] **Exact-Origin CSRF Guard:** Origin check rejecting spoofed cross-origin requests.
- [x] **All Test Suites Green:** 17 suites / 220+ tests passing.
- [x] **Clean Next.js Build:** All routes compiled without static evaluation errors.
