# LMS Platform — Storage Data Model & Provisioning

## Overview

All application data lives in a single Azure Storage account: **`stlms365evdev`** (resource group `rg-lms-dev`).

- **Azure Table Storage** — lightweight relational-style data (catalogue metadata, enrolments, progress)
- **Azure Blob Storage** — binary / JSON payloads (content bundles, thumbnails)

Tables and the `content-bundles` container are created lazily by the backend on first write. The remaining containers (thumbnails) must be provisioned manually or via the setup script below.

---

## Current Provisioning State

| Resource | Type | Status |
|---|---|---|
| `stlms365evdev` | Storage Account V2, Standard_LRS | ✅ Exists |
| `courses` table | Table Storage | ❌ Not provisioned |
| `enrolments` table | Table Storage | ❌ Not provisioned |
| `progress` table | Table Storage | ❌ Not provisioned |
| `content-bundles` container | Blob (public read) | ❌ Not provisioned |
| `thumbnails` container | Blob (public read) | ❌ Not provisioned |

> Tables are created automatically by the backend (`createTable().catch(() => {})`) on first write.
> Blob containers are **not** auto-created by `uploadBundle` until a course is published.
> Run the provisioning script below to pre-create everything.

---

## Data Model

### Table: `courses`

Course catalogue metadata. One row per published course.

| Field | Type | Notes |
|---|---|---|
| **PartitionKey** | `string` | Always `"catalogue"` — all courses in one partition |
| **RowKey** | `string` | URL-safe slug, e.g. `intro-to-azure` |
| `courseId` | `string (UUID)` | Stable identifier (RowKey may change, this doesn't) |
| `title` | `string` | Display title |
| `description` | `string` | Short description for catalogue card |
| `status` | `"draft" \| "published" \| "archived"` | Filtering: public site shows `published` only |
| `audience` | `"developer" \| "manager" \| "designer" \| "all"` | Filter dimension |
| `level` | `"beginner" \| "intermediate" \| "advanced"` | Filter dimension |
| `tags` | `string` | Comma-separated list (Table Storage has no array type) |
| `thumbnailUrl` | `string (URL)` | Points to `thumbnails` blob container |
| `bundleUrl` | `string (URL)` | Points to `content-bundles/<courseId>.json` |
| `authorId` | `string` | Entra object ID of the author |
| `publishedAt` | `string (ISO 8601)` | First publish timestamp |
| `updatedAt` | `string (ISO 8601)` | Last update timestamp |
| `moduleCount` | `number` | Shown on catalogue card |
| `durationMinutes` | `number` | Shown on catalogue card |

**Access patterns:**
- List all published: `PartitionKey eq 'catalogue' and status eq 'published'`
- Get by slug: `getEntity('catalogue', slug)`
- Filter by audience/level: fetched in-memory after Table query (OData filtering on multiple string fields is verbose)

---

### Table: `enrolments`

Which users are enrolled in which courses.

| Field | Type | Notes |
|---|---|---|
| **PartitionKey** | `string` | `userId` (Entra object ID) |
| **RowKey** | `string` | `courseId` (UUID) |
| `enrolmentId` | `string (UUID)` | Surrogate ID for the enrolment record |
| `tenantId` | `string` | Entra tenant ID |
| `enrolledAt` | `string (ISO 8601)` | |
| `expiresAt` | `string (ISO 8601)` | Optional — for time-limited access |

**Access patterns:**
- Get all enrolments for a user: `PartitionKey eq '<userId>'`
- Check single enrolment: `getEntity(userId, courseId)`

---

### Table: `progress`

Block-level completion tracking per user per course.

| Field | Type | Notes |
|---|---|---|
| **PartitionKey** | `string` | `userId` (Entra object ID) |
| **RowKey** | `string` | `courseId` (UUID) |
| `bundleId` | `string (UUID)` | Which bundle version was active |
| `completedBlockIds` | `string (JSON array)` | `["uuid1","uuid2",…]` — JSON-serialised (Table Storage has no array type) |
| `lastAccessedAt` | `string (ISO 8601)` | |
| `completedAt` | `string (ISO 8601)` | Null until all blocks done |

**Access patterns:**
- Get progress: `getEntity(userId, courseId)`
- Upsert on block complete: `upsertEntity(…, 'Merge')`

---

## Blob Containers

### `content-bundles`

Full course content as JSON. Publicly readable (learner app fetches directly from the browser).

| Blob name | Content-Type | Notes |
|---|---|---|
| `<courseId>.json` | `application/json` | Full `ContentBundle` schema (see below) |

**Access:** `blob` (anonymous read on individual blobs, no container listing)

#### ContentBundle schema (stored as JSON)

```
{
  bundleId:        UUID          -- unique per publish
  courseId:        UUID          -- stable course identifier
  platformVersion: string        -- semver of editor at publish time
  publishedAt:     ISO 8601
  publishedBy:     string        -- Entra object ID
  blocks: [
    {
      id:      UUID
      type:    string            -- block type key, e.g. "text", "quiz", "video"
      version: number
      payload: object            -- block-type-specific content
    }
  ]
  metadata: {
    title:        string
    description:  string?
    audienceRoles: string[]
  }
}
```

---

### `thumbnails`

Course thumbnail images uploaded from the editor. Publicly readable.

| Blob name | Content-Type | Notes |
|---|---|---|
| `<courseId>/<filename>` | `image/*` | Arbitrary image uploaded by author |

**Access:** `blob` (anonymous read)

> `thumbnails` container and upload endpoint are **not yet implemented** in the backend. The `thumbnailUrl` field in the courses table currently must be set manually or left empty.

---

## Provisioning Script

Run once against the dev storage account to pre-create all resources.

```bash
# Set connection string
CS=$(az storage account show-connection-string \
  --name stlms365evdev \
  --resource-group rg-lms-dev \
  --query connectionString -o tsv)

# Tables (idempotent)
az storage table create --name courses     --connection-string "$CS"
az storage table create --name enrolments  --connection-string "$CS"
az storage table create --name progress    --connection-string "$CS"

# Blob containers (public read on blobs, not container listing)
az storage container create --name content-bundles --public-access blob --connection-string "$CS"
az storage container create --name thumbnails      --public-access blob --connection-string "$CS"
```

---

## Remaining Work

| Task | Priority | Notes |
|---|---|---|
| Run provisioning script | High | Nothing works until containers exist |
| Thumbnail upload endpoint | Medium | `POST /api/courses/:courseId/thumbnail` — store in `thumbnails` container, update `thumbnailUrl` in courses table |
| Enrolment write endpoint | Medium | `POST /api/enrolments` — currently only read is implemented |
| Seed data script | Low | Insert sample courses into `courses` table for dev/test |
| `ContentBundleSchema.metadata.audienceRoles` | Low | Still references old role values (`Author`, `Publisher`, `Admin`, `Learner`) — should align with `CourseAudienceSchema` |
| CORS on storage account | Medium | Learner app fetches bundles directly from blob — storage account CORS must allow the learner SWA origin |

---

## CORS Configuration

The learner app (`https://salmon-mud-0b6291000.6.azurestaticapps.net`) fetches content bundles directly from blob storage. CORS must be enabled on the storage account:

```bash
az storage cors add \
  --services b \
  --methods GET \
  --origins "https://salmon-mud-0b6291000.6.azurestaticapps.net" \
             "http://localhost:5173" \
  --allowed-headers "*" \
  --exposed-headers "*" \
  --max-age 3600 \
  --account-name stlms365evdev
```
