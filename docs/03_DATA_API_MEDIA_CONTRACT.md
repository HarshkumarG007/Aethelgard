# AETHELGARD — DATA, API & MEDIA CONTRACT v2.0

## 1. Data Model

The production instance is intentionally small.

```text
User 1 ────< Chapter
User 1 ────< Memory 1 ────< MemoryAsset
User 1 ────< Session
User 1 ────< AuditLog
```

## 2. PostgreSQL Schema

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL DEFAULT 'viewer'
        CHECK (role IN ('viewer', 'admin')),
    passphrase_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
    kind TEXT NOT NULL DEFAULT 'standard'
        CHECK (kind IN ('standard', 'letter', 'milestone', 'future')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    body_text TEXT,
    memory_date DATE,
    location JSONB,
    emotion TEXT
        CHECK (emotion IS NULL OR emotion IN
            ('joy','nostalgia','longing','peace','excitement','gratitude','wonder')),
    thread_key VARCHAR(255),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    is_draft BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ,
    purge_after TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE memory_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    type TEXT NOT NULL
        CHECK (type IN ('image','video','audio','document')),
    status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING','UPLOADING','PROCESSING','READY','FAILED','DELETED')),
    storage_key TEXT NOT NULL UNIQUE,
    filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    checksum_sha256 CHAR(64),
    width INTEGER,
    height INTEGER,
    duration_seconds INTEGER,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    variants JSONB,
    error_code TEXT,
    deleted_at TIMESTAMPTZ,
    purge_after TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash CHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(80) NOT NULL,
    resource_type VARCHAR(80),
    resource_id UUID,
    outcome VARCHAR(20) NOT NULL DEFAULT 'success'
        CHECK (outcome IN ('success','failure')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chapters_user_sort
    ON chapters(user_id, sort_order);

CREATE INDEX idx_memories_user_date
    ON memories(user_id, memory_date);

CREATE INDEX idx_memories_user_chapter
    ON memories(user_id, chapter_id);

CREATE INDEX idx_memories_user_favorite
    ON memories(user_id, is_favorite);

CREATE INDEX idx_memories_deleted
    ON memories(deleted_at);

CREATE INDEX idx_assets_memory
    ON memory_assets(memory_id);

CREATE INDEX idx_assets_status
    ON memory_assets(status);

CREATE INDEX idx_sessions_user
    ON sessions(user_id);

CREATE INDEX idx_sessions_expiry
    ON sessions(expires_at);

CREATE INDEX idx_audit_user_time
    ON audit_logs(user_id, created_at);

CREATE INDEX idx_audit_time
    ON audit_logs(created_at);
```

## 3. Location Object

If provided:

```json
{
  "name": "Paris",
  "lat": 48.8566,
  "lng": 2.3522
}
```

Location is optional and must never be silently inferred from browser geolocation.

## 4. Memory JSON Contract

```json
{
  "id": "uuid",
  "kind": "standard",
  "title": "Memory Title",
  "description": "Description",
  "bodyText": null,
  "memoryDate": "2024-01-15",
  "location": {
    "name": "Paris",
    "lat": 48.8566,
    "lng": 2.3522
  },
  "emotion": "joy",
  "isFavorite": true,
  "chapter": {
    "id": "uuid",
    "title": "Chapter Name"
  },
  "assets": [],
  "createdAt": "2024-01-20T10:00:00Z",
  "updatedAt": "2024-01-20T10:00:00Z"
}
```

The API may return fewer fields based on the screen.

## 5. Asset Contract

```json
{
  "id": "uuid",
  "type": "image",
  "status": "READY",
  "filename": "photo.jpg",
  "mimeType": "image/jpeg",
  "sizeBytes": 2048000,
  "width": 1920,
  "height": 1080,
  "isPrimary": true,
  "variants": {
    "thumbnail": {
      "storageKey": "...",
      "width": 200,
      "height": 113
    },
    "small": {
      "storageKey": "...",
      "width": 400,
      "height": 225
    },
    "medium": {
      "storageKey": "...",
      "width": 800,
      "height": 450
    },
    "large": {
      "storageKey": "...",
      "width": 1920,
      "height": 1080
    }
  }
}
```

The client does not receive storage credentials.

## 6. RLS

Enable RLS for:

- chapters
- memories
- memory_assets

Example:

```sql
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_assets ENABLE ROW LEVEL SECURITY;
```

Application identity must be set transaction-locally.

The application server still performs its own authorization before the DB query.

## 7. Authentication API

### POST `/api/auth/verify`

Request:

```json
{
  "passphrase": "..."
}
```

Success:

```json
{
  "success": true,
  "data": {
    "redirect": "/"
  }
}
```

Response also sets `__Host-session`.

Failure:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid credentials"
  }
}
```

Do not reveal internal auth details.

### POST `/api/auth/logout`

Response:

```json
{
  "success": true
}
```

Revokes the server session and clears the cookie.

## 8. Session Check

### GET `/api/auth/session`

This endpoint is optional.

Preferred approach: server-side session checks in protected route/server loaders.

If exposed, return only:

```json
{
  "authenticated": true,
  "role": "viewer"
}
```

Never return the token.

## 9. Memory API

### GET `/api/memories`

Query:

- `chapterId`
- `favorite`
- `kind`
- `q`
- `limit` (default 50, max 100)
- `cursor`

Use cursor pagination for production rather than offset pagination where feasible.

Response:

```json
{
  "success": true,
  "data": {
    "memories": [],
    "nextCursor": null
  }
}
```

### GET `/api/memories/:id`

Returns the memory after authorization.

It may return asset metadata, but should not automatically issue signed URLs for every asset.

### POST `/api/admin/memories`

Admin only.

Request:

```json
{
  "kind": "standard",
  "title": "Memory Title",
  "description": "Description",
  "bodyText": null,
  "memoryDate": "2024-01-15",
  "location": null,
  "emotion": "joy",
  "chapterId": "uuid",
  "isFavorite": false,
  "isDraft": false
}
```

Response:

```json
{
  "success": true,
  "data": {
    "memoryId": "uuid"
  }
}
```

### PATCH `/api/admin/memories/:id`

Updates allowed mutable fields after admin authorization.

### DELETE `/api/admin/memories/:id`

Soft-deletes the memory and associated assets.

Purge is a separate maintenance operation.

## 10. Media Access API

### POST `/api/media/access`

Request:

```json
{
  "assetId": "uuid",
  "variant": "medium"
}
```

Server:

1. authenticates
2. loads asset
3. authorizes ownership
4. validates status `READY`
5. selects allowed variant
6. generates presigned GET
7. returns URL + expiry

Response:

```json
{
  "success": true,
  "data": {
    "url": "https://....",
    "expiresAt": "2026-09-20T10:05:00Z"
  }
}
```

Default URL lifetime: 5 minutes.

## 11. Admin Upload API

### POST `/api/admin/media/upload-url`

Request:

```json
{
  "filename": "photo.jpg",
  "contentType": "image/jpeg",
  "sizeBytes": 2048000
}
```

Server:

- authenticate admin
- validate filename
- validate content type allowlist
- validate size
- create asset in `PENDING`
- generate opaque storage key
- issue presigned PUT with signed Content-Type
- return URL

Response:

```json
{
  "success": true,
  "data": {
    "assetId": "uuid",
    "uploadUrl": "https://....",
    "expiresAt": "2026-09-20T10:05:00Z",
    "method": "PUT"
  }
}
```

### PUT to R2

Browser sends file directly to the presigned R2 URL.

No application credentials are sent.

### POST `/api/admin/media/:assetId/complete`

Server:

1. authenticate admin
2. authorize asset ownership/admin scope
3. perform HEAD against R2 object
4. compare expected size/type
5. optionally verify checksum
6. transition `UPLOADING` → `PROCESSING`
7. process image variants or validate pass-through media
8. write variant manifest
9. transition to `READY`

Failure:

```text
PROCESSING → FAILED
```

Store only a safe machine-readable failure code.

## 12. Media Processing

### Images

Use Sharp.

Expected pipeline:

```text
original
  ├── inspect
  ├── strip unnecessary metadata where policy permits
  ├── normalize orientation
  ├── generate thumbnail
  ├── generate small
  ├── generate medium
  └── generate large
```

Preserve original when explicitly required.

### Video

v1 may store validated original video without transcoding.

Optional later pipeline:

- poster frame
- web-compatible derivative
- bitrate normalization

Do not introduce FFmpeg into a serverless runtime unless its execution and resource limits are proven.

### Audio

v1 may store validated audio and use native browser playback.

Optional waveform generation can be added later.

## 13. Allowed Media

Baseline:

### Images

- image/jpeg
- image/png
- image/webp
- image/avif

### Video

- video/mp4
- video/webm

### Audio

- audio/mpeg
- audio/mp4
- audio/wav

Documents are optional for a later phase.

Server limits must be enforced independently of client-side limits.

## 14. Storage Layout

```text
aethelgard-private/
├── media/
│   └── {assetUuid}/
│       ├── original
│       ├── thumbnail
│       ├── small
│       ├── medium
│       └── large
├── staging/
└── system/
```

Never expose human-readable memory names in keys.

## 15. R2 CORS

Allow only the exact production origin(s) needed for browser PUT requests.

Do not use wildcard origins for authenticated media uploads unless there is an explicit, reviewed reason.

## 16. Search

Archive search uses PostgreSQL.

Preferred implementation:

- generated/search vector for `title`, `description`, `body_text`
- GIN index for full-text search
- optional `pg_trgm` for title similarity/autocomplete

Search must apply authorization before returning rows.

Search terms are never placed into dynamic SQL.

## 17. Timeline Ordering

Primary:

1. `memory_date ASC`
2. `sort_order ASC`
3. `created_at ASC`
4. `id ASC`

Null-date memories use an explicit policy rather than database-default ordering.

## 18. Archive Filters

Supported:

- date range
- chapter
- kind
- emotion
- favorite
- text query
- asset type

## 19. Error Contract

All APIs use:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request could not be processed.",
    "requestId": "safe-correlation-id"
  }
}
```

Allowed codes:

- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `RATE_LIMITED`
- `VALIDATION_ERROR`
- `CONFLICT`
- `MEDIA_NOT_READY`
- `UPLOAD_INVALID`
- `SERVER_ERROR`

Do not expose stack traces or DB errors.

## 20. Export

Admin may export:

- memory metadata as JSON
- letter text
- asset manifest
- optional media archive

The export must be generated server-side and protected.

Do not include session tokens or internal secrets.

## 21. Import

Import is optional.

If implemented:

- validate schema
- validate every referenced object
- reject unknown fields unless versioned
- execute multi-object import in a transaction where feasible
- stage media before committing metadata
- produce an import report

## 22. Data Versioning

Include:

```json
{
  "schemaVersion": 1
}
```

in exported content.

Database migrations are append-only and version controlled.

## 23. Required Environment Variables

```bash
NEXT_PUBLIC_SITE_URL=https://aethelgard.example

DATABASE_URL=...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=aethelgard-private

AUTH_SECRET=...
ADMIN_PASSPHRASE_HASH=...

RATE_LIMIT_URL=...
RATE_LIMIT_TOKEN=...

SENTRY_DSN=...
```

Only variables explicitly prefixed `NEXT_PUBLIC_` may be considered browser-visible.

## 24. Time Handling

- Persist timestamps in UTC.
- Display according to configured user experience.
- `memory_date` is a calendar date and should not be converted through local timezone arithmetic.
- Server is authoritative for created/updated timestamps.

## 25. API Caching

Private endpoints:

```text
Cache-Control: no-store
```

Do not use public incremental caching for private memory content.

Client-side TanStack Query cache must be session-scoped and cleared on logout/session expiration.

## 26. Logout / Session Expiration Behavior

When the server returns unauthorized:

```text
client cache cleared
↓
local transient memory state cleared
↓
3D private objects unloaded
↓
navigate to /auth
```

Do not leave a previous user's memory content mounted in memory after session termination.
