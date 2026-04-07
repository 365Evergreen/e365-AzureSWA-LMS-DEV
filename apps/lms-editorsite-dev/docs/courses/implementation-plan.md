# Course System — Implementation Plan

> Derived from `design-principles.md` and analysis of the existing codebase.

---

## 1. Gap Analysis — Current vs Required

### Current state

| Area | Current model | Problem |
|---|---|---|
| Content structure | Flat `courses` table (`PK='catalogue', RK=slug`) | No path / module / unit hierarchy |
| Content storage | Monolithic block bundle per course | Impossible to version individual units |
| Progress | `PK=userId, RK=courseId` — course-level only | Cannot track unit completion or resume |
| Enrolment | `PK=userId, RK=courseId` — flat | Not aligned with PK/RK conventions |
| Browse / search | Full table scan of `courses` filtered in code | No index tables; slow at scale |
| Tags | CSV stored on course row | No `Tags` or `CatalogueItemTags` tables; no tag browsing |
| Versioning | None — save overwrites | No history, no rollback |
| Shared schemas | `CourseMetadata` is flat | Does not model hierarchy or versioning |

### Target state (per design-principles.md)

A Microsoft Learn-style hierarchy: **Learning Path → Modules → Units**, with separate versioned
content per unit, granular progress tracking, and index tables for fast browse.

---

## 2. Table Storage Design

All tables live in the `stlms365evdev` storage account.

### 2.1 `CatalogueItems` — canonical catalogue entity

| Field | Value |
|---|---|
| PartitionKey | `catalogue\|PATH`, `catalogue\|MODULE`, `catalogue\|UNIT`, `catalogue\|ASSESSMENT` |
| RowKey | `{itemId}` (GUID) |

Properties: `Slug`, `Title`, `Summary`, `Language`, `Difficulty` (Beginner/Intermediate/Advanced),
`EstimatedMinutes`, `Visibility` (Public/Enrolled), `Status` (Draft/Published/Archived),
`CurrentVersionId`, `ThumbnailUrl`, `TagsCsv`, `CreatedOn`, `UpdatedOn`, `AuthorId`, `TenantId`

> The existing `courses` table is left intact for backwards compatibility during the transition.
> New content goes exclusively into `CatalogueItems`.

---

### 2.2 `ContentVersions` — versioned unit content

| Field | Value |
|---|---|
| PartitionKey | `CONTENT\|{itemId}` |
| RowKey | `{versionNumber}` — zero-padded six digits: `000001`, `000002` |

Properties: `PublishedOn`, `PublishedByUserId`, `ContentUri` (blob URL), `ChangeLog`

Query: all versions for a unit = single-partition scan. Current version = lookup via
`CurrentVersionId` stored on the parent `CatalogueItems` row.

---

### 2.3 `PathModules` — ordered link: Learning Path → Module

| Field | Value |
|---|---|
| PartitionKey | `PATH\|{pathId}` |
| RowKey | `{sortOrderPadded}\|MODULE\|{moduleId}` — e.g. `000010\|MODULE\|abc-123` |

Properties: `IsOptional` (bool)

Sort-key increment: **10** (leaves room for reordering without full renumber).

---

### 2.4 `ModuleUnits` — ordered link: Module → Unit

| Field | Value |
|---|---|
| PartitionKey | `MODULE\|{moduleId}` |
| RowKey | `{sortOrderPadded}\|UNIT\|{unitId}` — e.g. `000010\|UNIT\|xyz-456` |

Properties: `IsOptional` (bool), `UnitType` (Lesson/Video/Assessment/Interactive)

---

### 2.5 `Enrolments` — canonical enrolment (PATH-level)

| Field | Value |
|---|---|
| PartitionKey | `ENROL\|USER\|{userId}` |
| RowKey | `ITEM\|{pathId}` |

Properties: `EnrolledOn`, `Status` (Active/Completed/Withdrawn), `DueOn`, `Source`
(Self/Assigned/AdminImport)

**Index table `EnrolmentsByItem`** — "who is enrolled in this path?":

| Field | Value |
|---|---|
| PartitionKey | `ENROL\|ITEM\|{pathId}` |
| RowKey | `USER\|{userId}` |

Properties: `Status`, `EnrolledOn`

---

### 2.6 `Progress` — granular, per-unit state

| Field | Value |
|---|---|
| PartitionKey | `PROG\|USER\|{userId}` |
| RowKey | `{itemType}\|{itemId}` — e.g. `UNIT\|abc`, `MODULE\|def`, `PATH\|ghi` |

Properties: `State` (NotStarted/InProgress/Completed), `PercentComplete`, `FirstStartedOn`,
`LastActivityOn`, `CompletedOn`

Module and path aggregate rows are written as denormalised rollups when a unit is completed —
avoids expensive multi-entity scans when rendering the learner dashboard.

**`ProgressEvents`** — append-only audit trail:

| Field | Value |
|---|---|
| PartitionKey | `PROGEVT\|USER\|{userId}` |
| RowKey | `{occurredOnTicks}\|{eventType}\|{unitId}` |

Properties: `ModuleId`, `PathId` (denormalised), `Device`, `EvidenceUri`

---

### 2.7 `CatalogueBrowse` — read model for browse/filter

| Field | Value |
|---|---|
| PartitionKey | `BROWSE\|{itemType}\|{status}` — e.g. `BROWSE\|PATH\|PUBLISHED` |
| RowKey | `{titleSort}\|{itemId}` |

Properties: `Title`, `Summary`, `Difficulty`, `EstimatedMinutes`, `ThumbnailUrl`, `Language`

Written on publish; deleted on archive. Replaces full-table scan in `listPublishedCourses`.

---

### 2.8 `Tags` and `CatalogueItemTags` — tag browsing

**`Tags`**

| Field | Value |
|---|---|
| PartitionKey | `TAG\|{tagType}` (Topic / Product / Role / Level) |
| RowKey | `{tagNameNormalised}` |

Properties: `DisplayName`

**`CatalogueItemTags`** — browse by tag:

| Field | Value |
|---|---|
| PartitionKey | `TAGMAP\|{tagNameNormalised}` |
| RowKey | `{itemType}\|{titleSort}\|{itemId}` |

Properties: `Title`, `Difficulty`, `Duration`, `Status`, `Language`

---

## 3. Shared Schema Changes (`shared/schemas/src/index.ts`)

Keep existing `Block`, `ContentBundle`, `CourseEnrolment`, `ProgressRecord` schemas untouched
(they are used by existing site content features). Add:

```ts
// Enums
ItemTypeSchema      = z.enum(['PATH', 'MODULE', 'UNIT', 'ASSESSMENT'])
ItemStatusSchema    = z.enum(['Draft', 'Published', 'Archived'])
DifficultySchema    = z.enum(['Beginner', 'Intermediate', 'Advanced'])
UnitTypeSchema      = z.enum(['Lesson', 'Video', 'Assessment', 'Interactive'])
VisibilitySchema    = z.enum(['Public', 'Enrolled'])

// Entities
CatalogueItemSchema         — maps to CatalogueItems table row
ContentVersionSchema        — maps to ContentVersions table row
PathModuleLinkSchema        — maps to PathModules table row
ModuleUnitLinkSchema        — maps to ModuleUnits table row
EnrolmentRecordSchema       — new (replaces CourseEnrolment for new model)
ProgressStateSchema         — new (replaces ProgressRecord for new model)
ProgressEventSchema         — new

// Composite read models (API response shapes, not table rows)
PathDetailSchema            — CatalogueItem + ordered modules list
ModuleDetailSchema          — CatalogueItem + ordered units list
UnitDetailSchema            — CatalogueItem + current ContentVersion
LearnerPathSchema           — PathDetail + per-item progress for a user
```

---

## 4. Backend API Endpoints

### 4.1 Editor/admin endpoints (ContentEditor role required)

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/editor/catalogue` | List all items any status (pageable, filter by type) |
| `GET` | `/api/editor/catalogue/{type}/{itemId}` | Get item with full structure |
| `POST` | `/api/catalogue/paths` | Create learning path |
| `PATCH` | `/api/catalogue/items/{itemId}` | Update metadata (merge) |
| `DELETE` | `/api/catalogue/items/{itemId}` | Soft-delete (→ Archived) |
| `POST` | `/api/catalogue/paths/{pathId}/modules` | Add new module to path |
| `PUT` | `/api/catalogue/paths/{pathId}/modules/order` | Reorder modules (accept ordered array of moduleIds) |
| `DELETE` | `/api/catalogue/paths/{pathId}/modules/{moduleId}` | Remove module link from path |
| `POST` | `/api/catalogue/modules/{moduleId}/units` | Add new unit to module |
| `PUT` | `/api/catalogue/modules/{moduleId}/units/order` | Reorder units |
| `DELETE` | `/api/catalogue/modules/{moduleId}/units/{unitId}` | Remove unit link from module |
| `POST` | `/api/catalogue/units/{unitId}/content` | Save unit block content (creates ContentVersion) |
| `POST` | `/api/catalogue/items/{itemId}/publish` | Publish item (sets Published, writes CatalogueBrowse + TagMap) |

### 4.2 Public/learner endpoints (anonymous or Learner role)

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/catalogue` | List published paths (from `CatalogueBrowse`) |
| `GET` | `/api/catalogue/{pathId}` | Get path with module list |
| `GET` | `/api/catalogue/{pathId}/modules/{moduleId}` | Get module with unit list |
| `GET` | `/api/catalogue/units/{unitId}` | Get unit with current content version |
| `POST` | `/api/enrolment` | Self-enrol in a path |
| `GET` | `/api/enrolment/{userId}` | Get enrolments (own only, or Admin any) — **update existing** |
| `POST` | `/api/progress` | Post unit-level progress + write aggregate rollup — **update existing** |
| `GET` | `/api/progress/{userId}` | Get all progress records for user — **update existing** |

---

## 5. Editor App — UI Components

### 5.1 `CoursesPage` (update stub → full listing)

Pattern identical to `WebsitePage`/`BlogPostsPage` (already implemented):

- Grid/list toggle
- `PathCard` component (thumbnail, title, summary, difficulty badge, unit count, status chip)
- Status filter (All / Draft / Published / Archived)
- Quick-edit drawer: edit path metadata without leaving the list
- **Edit** button → `/courses/edit/:pathId` (structure builder for existing path)
- **+ New Course** button → `/courses/new` (already wired to `AddNewCoursePage`)

### 5.2 `AddNewCoursePage` — new path + structure builder

Two-panel layout:

```
┌─────────────────────────────┬───────────────────────────────────────┐
│  METADATA PANEL (left)      │  STRUCTURE PANEL (right)              │
│                             │                                       │
│  Title *                    │  + Add Module                         │
│  Slug (auto, editable)      │                                       │
│  Summary *                  │  Module 1: Introduction      ⋮ ✕     │
│  Description (textarea)     │  ├── Unit 1.1: Welcome       ⋮ ✕     │
│  Thumbnail (media picker)   │  ├── Unit 1.2: Overview      ⋮ ✕     │
│  Difficulty                 │  └── + Add Unit                       │
│  Estimated duration         │                                       │
│  Tags (multi-select)        │  Module 2: Core Concepts     ⋮ ✕     │
│  Language                   │  └── + Add Unit                       │
│  Visibility                 │                                       │
│                             │  (drag handles, inline rename)        │
│  [Save as Draft]            │                                       │
└─────────────────────────────┴───────────────────────────────────────┘
```

- Saving creates: one `CatalogueItems` PATH row + N MODULE rows + M UNIT rows (stubs)
  + `PathModules` link rows + `ModuleUnits` link rows
- Units are created with `Status=Draft`, no content yet
- Click a unit title → navigates to `EditUnitPage` (canvas editor)

### 5.3 `EditPathPage` (new)

Route: `/courses/edit/:pathId`

Same two-panel layout as `AddNewCoursePage`, pre-populated from API. Adds:
- Module/unit status indicators (Draft / Content saved / Published)
- Click unit → `/courses/units/:unitId/edit`

### 5.4 `EditUnitPage` (new)

Route: `/courses/units/:unitId/edit`

Reuses the existing `ContentEditor` canvas (same component as `EditWebPage`, `EditBlogPostPage`).

- Loads unit metadata + current `ContentVersion` content
- Saves via `POST /api/catalogue/units/{unitId}/content`
- Properties pane: unit title, type, estimated minutes, optional toggle, change-log note
- **Publish** button: publishes the unit version; if all units in a path are published the path
  can also be published

---

## 6. Learner App — Required Changes

| Component | Change |
|---|---|
| Course catalogue page | Update to call new `/api/catalogue` (PATH-level items from `CatalogueBrowse`) |
| Course player | Decompose into Path → Module → Unit navigation |
| Unit renderer | Fetch unit content from `ContentVersions`; render blocks via block registry |
| Progress tracking | Post unit-level completion events; show module/path aggregate progress |
| Resume | Read `PROG\|USER\|{userId}` to find last accessed unit; deep-link into player |

---

## 7. Migration Strategy

1. Existing `courses` table **is not dropped** — legacy content remains accessible.
2. `getCatalogue.ts` is updated to check `CatalogueItems` first; falls back to old `courses`
   table if no result found.
3. New Editor UI writes exclusively to `CatalogueItems`.
4. Once all legacy courses are re-entered (or migrated via a script), the fallback can be removed.

---

## 8. Implementation Order (MVP)

### Phase A — Foundation (unblocks everything else)
1. `p10-schemas` — Update `@lms/shared-schemas` with new catalogue types
2. `p10-storage` — Add storage operations in `storage.ts` for all new tables

### Phase B — Editor CRUD
3. `p10-catalogue-api` — Backend endpoints: create path, add modules/units, save unit content, publish
4. `p10-courses-page` — `CoursesPage` listing (grid/list, filter, quick-edit)
5. `p10-add-course` — `AddNewCoursePage` two-panel structure builder
6. `p10-edit-path` — `EditPathPage` (edit existing structure)
7. `p10-edit-unit` — `EditUnitPage` (unit canvas)

### Phase C — Learner Consumption
8. `p10-learner-catalogue` — Update learner app catalogue page
9. `p10-course-player` — PATH/MODULE/UNIT player with progress tracking
10. `p10-progress-api` — Update progress/enrolment endpoints to new model

### Phase D — Browse & Discovery
11. `p10-browse-index` — `CatalogueBrowse` + `CatalogueItemTags` maintenance on publish
12. `p10-tag-ui` — Tag browsing in learner app

### Not in MVP (future phases)
- Assessments and graded attempts
- Credentials / badges / certificates
- Cohorts and assigned learning
- Prerequisites
- Analytics dashboard

---

## 9. Key Design Decisions

| Decision | Rationale |
|---|---|
| Enrolment at PATH level only | Learners enrol in a full learning path; modules/units are accessed as part of that path |
| Progress tracked at UNIT level with MODULE/PATH aggregates | Enables resume; avoids expensive rollups on read |
| `CatalogueBrowse` as a write-time index | Eliminates full table scans in public catalogue |
| Sort keys increment by 10 | Allows reordering by inserting between existing records without full renumber |
| `TenantId` property on all entities | Single-tenant now, multi-tenant ready — no schema migration needed later |
| Content blob per unit, not per course | Independent versioning of units; learner can be on different versions per unit |
| `ContentEditor` canvas reused for units | No new canvas to build; unit content is just blocks, same as pages/posts |
