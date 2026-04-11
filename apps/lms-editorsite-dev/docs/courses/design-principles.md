# 1) Design principles (Table Storage reality)

### Key constraints you must design around

*   Queries are fast when you filter by **PartitionKey** and/or **RowKey**.
*   There are **no joins**, so many-to-many relationships require either:
    *   **link entities** (join rows) and/or
    *   **denormalised projections** (read models) and/or
    *   **index tables** for alternative query paths.
*   **Transactional batches** (if used) typically require entities in the **same PartitionKey** (implementation dependent), so keep “write-together” things co-partitioned where it matters (e.g. progress events).

### Recommended approach for this LMS

Use:

1.  **Entity tables** (canonical records)
2.  **Link tables** (path→module, module→unit, tags, cohort membership)
3.  **Index tables** (catalogue search, tag browsing, “by user” lookups)
4.  Optional **event tables** (audit/analytics for completion and attempts)

***

## 2) PartitionKey/RowKey conventions (consistent patterns)

Use these conventions across tables:

*   **PartitionKey (PK)** = the “primary query grouping”
*   **RowKey (RK)** = unique within partition; often composite: `{Type}|{Id}` or `{Sort}|{Id}`
*   Use **zero-padded sort keys** for ordered collections: `000010|{ModuleId}` etc.
*   Store IDs as **GUIDs** (or ULIDs if you want time-sortable IDs).

***

## 3) Canonical entity tables (core “ERD”)

### A) Identity & access (single tenant now, multi-tenant ready)

#### `Users`

Stores learner/admin profiles.

*   **PK:** `USER`
*   **RK:** `{UserId}`
*   Properties: `Email` (also index), `DisplayName`, `Role` (Admin/Manager/Learner), `Status`, `CreatedOn`, `LastSeenOn`

**Index table (recommended):** `UserByEmail`

*   **PK:** `EMAIL`
*   **RK:** `{NormalisedEmail}`
*   Properties: `UserId`

> Even single-tenant, this avoids scanning Users to resolve logins.

#### Optional (future-proof): `Organisation`

Even if you’re single-tenant, adding an Organisation entity now prevents redesign later.

*   **PK:** `ORG`
*   **RK:** `{OrganisationId}` (or fixed `DEFAULT` while single tenant)
*   Properties: `Name`, `Status`, `SettingsJson`

***

### B) catalogue (Microsoft Learn-style content)

#### `catalogueItems`

A unified table for learning paths, modules, units, assessments, and (optional) courses/programmes.

*   **PK:** `catalogue|{ItemType}` (e.g. `catalogue|PATH`, `catalogue|MODULE`, `catalogue|UNIT`)
*   **RK:** `{ItemId}`
*   Properties (common):  
    `Title`, `Summary`, `Language`, `Difficulty`, `EstimatedMinutes`, `Visibility`, `Status` (Draft/Published/Archived), `CurrentVersionId`, `ThumbnailUrl`, `TagsCsv` (optional lightweight)

**ItemType values**

*   `PATH`, `MODULE`, `UNIT`, `ASSESSMENT`, optional `COURSE`

#### `ContentVersions`

Versioned content references (store large bodies in Blob Storage; table holds metadata and pointers).

*   **PK:** `CONTENT|{catalogueItemId}`
*   **RK:** `{VersionNumber}` (e.g. `000001`, `000002`)
*   Properties: `PublishedOn`, `PublishedByUserId`, `ContentUri` (Blob/SharePoint), `ChangeLog`

> Query pattern: get all versions for an item (single partition), or fetch current version by `CurrentVersionId` stored on catalogueItems.

***

### C) Structure / sequencing (Path → Modules → Units)

#### `PathModules` (ordered link: Learning Path → Module)

*   **PK:** `PATH|{PathId}`
*   **RK:** `{SortOrderPadded}|MODULE|{ModuleId}`
*   Properties: `IsOptional` (bool)

#### `ModuleUnits` (ordered link: Module → Unit)

*   **PK:** `MODULE|{ModuleId}`
*   **RK:** `{SortOrderPadded}|UNIT|{UnitId}`
*   Properties: `IsOptional` (bool), `UnitType` (duplicated for convenience)

> These tables are your replacement for join queries. Listing modules for a path or units for a module is a single-partition range scan.

#### `Prerequisites` (cross-item prereqs)

*   **PK:** `PREREQ|{catalogueItemId}`
*   **RK:** `{RuleType}|{RequiredcatalogueItemId}`
*   Properties: `MinScore` (optional), `Notes` (optional)

***

### D) Enrolment, assignment, cohorts, progress

Even single-tenant, you likely need cohorts/classes (especially for organisational delivery later). If not needed on day one, you can omit Cohorts and still keep the same enrolment/progress model.

#### Optional: `Cohorts`

*   **PK:** `COHORT`
*   **RK:** `{CohortId}`
*   Properties: `Name`, `Type` (Team/Class/Intake), `StartDate`, `EndDate`

#### Optional: `CohortMembers`

*   **PK:** `COHORT|{CohortId}`
*   **RK:** `USER|{UserId}`
*   Properties: `RoleInCohort` (Learner/Facilitator)

#### `Assignments`

Who assigned what to whom (user or cohort).

*   **PK:** `ASSIGN|TARGET|{TargetType}|{TargetId}`  
    Examples: `ASSIGN|TARGET|USER|{UserId}` or `ASSIGN|TARGET|COHORT|{CohortId}`
*   **RK:** `{AssignedOnTicks}|ITEM|{catalogueItemId}`
*   Properties: `AssignedByUserId`, `DueOn`, `Priority`, `Notes`

> This allows quick “show me everything assigned to this learner/cohort” queries.

#### `Enrolments`

Canonical enrolment record (for self-enrol and assigned enrolments).

*   **PK:** `ENROL|USER|{UserId}`
*   **RK:** `ITEM|{catalogueItemId}`
*   Properties: `EnrolledOn`, `Status` (Active/Completed/Withdrawn), `DueOn`, `Source` (Self/Assigned/AdminImport)

**Optional index:** `EnrolmentsByItem`  
If you need “who is enrolled in this course/path?” for admin views:

*   **PK:** `ENROL|ITEM|{catalogueItemId}`
*   **RK:** `USER|{UserId}`
*   Properties: `Status`, `EnrolledOn`

#### `Progress`

Store progress for Units *and* optionally aggregate to Module/Path to avoid expensive rollups.

*   **PK:** `PROG|USER|{UserId}`
*   **RK:** `{ItemType}|{catalogueItemId}` (e.g. `UNIT|{UnitId}`, `MODULE|{ModuleId}`)
*   Properties:  
    `State` (NotStarted/InProgress/Completed),  
    `PercentComplete`, `FirstStartedOn`, `LastActivityOn`, `CompletedOn`

**Progress event table (recommended for audit/analytics):** `ProgressEvents`

*   **PK:** `PROGEVT|USER|{UserId}`
*   **RK:** `{OccurredOnTicks}|{EventType}|{UnitId}`
*   Properties: `ModuleId`, `PathId` (denormalised), `Device`, `EvidenceUri` (optional)

> With events, you can rebuild progress if needed and support rich analytics later.

***

### E) Assessments & attempts

#### `AssessmentItems` (questions)

*   **PK:** `ASMT|{AssessmentId}`
*   **RK:** `{SortOrderPadded}|Q|{QuestionId}`
*   Properties: `ItemType` (MCQ/TrueFalse/Scenario), `Weight`, `PromptUri`/`PromptTextRef`

#### `AssessmentAttempts`

*   **PK:** `ATTEMPT|USER|{UserId}|ASMT|{AssessmentId}`
*   **RK:** `{AttemptNumberPadded}`
*   Properties: `StartedOn`, `SubmittedOn`, `Score`, `Passed`, `Status`

#### Optional (only if you need per-question detail): `AttemptResponses`

*   **PK:** `RESP|ATTEMPT|{AttemptId}`
*   **RK:** `{SortOrderPadded}|Q|{QuestionId}`
*   Properties: `IsCorrect`, `ScoreAwarded`, `ResponseRef`

***

### F) Credentials (badges/certificates)

#### `Credentials`

*   **PK:** `CRED`
*   **RK:** `{CredentialId}`
*   Properties: `Type` (Badge/Certificate), `Title`, `Description`, `ValidityDays`, `ImageUri`

#### `CredentialRules`

*   **PK:** `CREDRULE|{CredentialId}`
*   **RK:** `{RuleType}|{TargetId}` (e.g. `Complete|{catalogueItemId}`, `Pass|{AssessmentId}`)
*   Properties: `MinScore` (optional)

#### `CredentialAwards`

*   **PK:** `AWARD|USER|{UserId}`
*   **RK:** `{AwardedOnTicks}|CRED|{CredentialId}`
*   Properties: `ExpiresOn`, `EvidenceUri`, `RevokedOn` (optional)

**Optional index:** `AwardsByCredential`

*   **PK:** `AWARD|CRED|{CredentialId}`
*   **RK:** `USER|{UserId}|{AwardedOnTicks}`

***

### G) Tags & discoverability (Learn-like browsing)

#### `Tags`

*   **PK:** `TAG|{TagType}` (Topic/Product/Role/Level)
*   **RK:** `{TagNameNormalised}`
*   Properties: `DisplayName`

#### `catalogueItemTags` (browse by tag)

*   **PK:** `TAGMAP|{TagNameNormalised}`
*   **RK:** `{ItemType}|{TitleSort}|{catalogueItemId}`
*   Properties: `Title`, `Difficulty`, `Duration`, `Status`, `Language`

> This is a deliberate “read model” for quick tag browsing without joining.

#### `catalogueBrowse` (browse/search by type)

*   **PK:** `BROWSE|{ItemType}|{Status}` (e.g. `BROWSE|MODULE|PUBLISHED`)
*   **RK:** `{TitleSort}|{catalogueItemId}`
*   Properties: `Title`, `Summary`, `Difficulty`, `EstimatedMinutes`, `ThumbnailUrl`, `Language`

> Not a full-text search, but a very effective browse and filter surface.

***

## 4) Relationship map (ERD view, expressed in Table Storage terms)

### Content

*   `catalogueItems (PATH)` **1 → many** `PathModules` → links to `catalogueItems (MODULE)`
*   `catalogueItems (MODULE)` **1 → many** `ModuleUnits` → links to `catalogueItems (UNIT)`
*   `catalogueItems` **1 → many** `ContentVersions`
*   `catalogueItems` **1 → many** `Prerequisites`

### Learning participation

*   `Users` **1 → many** `Enrolments`
*   `Users` **1 → many** `Progress` (+ `ProgressEvents`)
*   `Users` **1 → many** `AssessmentAttempts` (+ optional `AttemptResponses`)
*   `Users` **1 → many** `CredentialAwards`

### Admin delivery

*   `Assignments` targets: `Users` or `Cohorts`
*   Optional: `Cohorts` **1 → many** `CohortMembers`

***

## 5) Single-tenant optimisations (and how to stay future-ready)

Since you’re single tenant to begin with:

*   You can omit `OrganisationId` from most entities, *but* consider including a simple `TenantId` property anyway for a painless future transition.
*   You can use fixed PK prefixes (as above) without `ORG|{OrgId}` nesting.
*   Keep your **index tables** from day one — they’re the difference between fast UX and painful scans.

***

## 6) Practical query patterns (what this model supports well)

### Learner “My Learning” dashboard

*   Enrolments: `PK = ENROL|USER|{UserId}`
*   Progress: `PK = PROG|USER|{UserId}`
*   Awards: `PK = AWARD|USER|{UserId}`
*   Assigned items: `PK = ASSIGN|TARGET|USER|{UserId}` plus cohort assignments if applicable

### Course/Path page

*   Path metadata: `catalogueItems` (PATH)
*   Modules list: `PK = PATH|{PathId}` from `PathModules`
*   Module → units: `PK = MODULE|{ModuleId}` from `ModuleUnits`

### Browse catalogueue

*   Type browse: `catalogueBrowse` by PK
*   Tag browse: `catalogueItemTags` by PK

***

## 7) Notes for SWA + API layer (data-access implications)

With Azure SWA you’ll typically have an API layer (Azure Functions) that:

*   Resolves **user identity** (Entra ID / SWA auth)
*   Performs **multi-entity writes** (e.g. mark unit complete → write ProgressEvents + update Progress aggregates)
*   Maintains **index tables** (e.g. on publish, update `catalogueBrowse` and `TagMap` records)

This is the right place to enforce integrity you’d normally get from relational constraints.

***

## 8)  “MVP tables” (small but strong)

1.  `Users`, `UserByEmail`
2.  `catalogueItems`, `ContentVersions`
3.  `PathModules`, `ModuleUnits`
4.  `Enrolments`, `Progress`, `ProgressEvents`
5.  `catalogueBrowse`, `catalogueItemTags`, `Tags`

Assessments and credentials can be added later without changing the existing keys.

***

