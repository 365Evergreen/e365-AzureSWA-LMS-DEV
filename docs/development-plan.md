# LMS Platform – Development Plan

## Problem Statement

The monorepo scaffold exists with 4 Azure Static Web App stubs and shared package stubs, but nothing is wired together. The goal is to establish a proper npm workspace monorepo, build out shared packages, implement each app to spec, and wire up independent Azure Pipeline deployments — one per app, path-filtered.

---

## Current State

| Item | Status |
|------|--------|
| `apps/lms-publicsite-dev` | React + Vite boilerplate only |
| `apps/lms-knowledge-site` | React + Vite boilerplate only |
| `apps/lms-editorsite-dev` | React + Vite boilerplate only |
| `apps/lms-learnersite-dev` | Next.js 16 boilerplate only |
| `shared/auth` | README stub only |
| `shared/block-schema` | README stub only |
| `shared/schemas` | README stub only |
| `shared/ui` | README stub only |
| `services/backend-functions` | README stub only |
| `backend-api/` | README stub only (duplicates services — needs resolution) |
| Root `package.json` | **Does not exist** |
| Azure Pipelines YAML | **Does not exist** |

### Structural Notes
- App folder names (`lms-*`) match Azure SWA resource names — keep as-is
- `shared/block-schema` should be renamed to `shared/block-registry` (aligns with spec)
- `backend-api/` at root and `services/backend-functions` are duplicated — consolidate to `services/backend-functions` only
- `shared/` subdirs need `package.json` to become proper workspace packages

---

## Decisions Made

- **Workspace manager**: npm workspaces (root `package.json`)
- **Pipeline structure**: One YAML per app — cleanest, full isolation
- **Shared packages**: Proper workspace packages with their own `package.json`

---

## Phase 1 — Monorepo Foundation

Sets the baseline all other work depends on.

### 1.1 Root npm workspace (`p1-root-workspace`)
- Create `package.json` at repo root with `"workspaces": ["apps/*", "shared/*", "services/*"]`
- Add root scripts: `build:all`, `lint:all`, `dev:public`, `dev:editor`, `dev:learner`, `dev:knowledge`
- Consolidate `backend-api/` into `services/backend-functions` (remove the root-level `backend-api/`)

### 1.2 TypeScript project references (`p1-ts-references`)
- Add root `tsconfig.json` with project references to each app and shared package
- Enables cross-package type checking and incremental builds

### 1.3 Directory structure audit (`p1-structure-audit`)
- Rename `shared/block-schema` → `shared/block-registry`
- Remove or redirect `backend-api/` to `services/backend-functions`
- Ensure all `shared/` stubs are ready for package.json creation

---

## Phase 2 — Shared Workspace Packages

These become `@lms/*` packages importable by all apps.

### 2.1 `@lms/shared-auth` (`p2-shared-auth`)
- Location: `shared/auth`
- MSAL browser helpers: `acquireToken`, `login`, `logout`, `useAuth` hook
- TypeScript types for app roles: `Author`, `Publisher`, `Admin`, `Learner`
- Peer deps: `@azure/msal-browser`, `react`

### 2.2 `@lms/shared-schemas` (`p2-shared-schemas`)
- Location: `shared/schemas`
- Zod schemas + TypeScript types for:
  - `Block` (versioned, typed payload)
  - `ContentBundle` (immutable published bundle)
  - `CourseEnrolment`
  - `ProgressRecord`
- No runtime dependencies beyond `zod`

### 2.3 `@lms/shared-ui` (`p2-shared-ui`)
- Location: `shared/ui`
- Minimal React component library: `Button`, `Card`, `Nav`, `LoadingSpinner`, `ErrorBoundary`
- Vite library mode build
- Consumed by all four apps

### 2.4 `@lms/block-registry` (`p2-block-registry`)
- Location: `shared/block-registry`
- Block type enum, schema per block type, renderer interface
- Core shared contract between Editor (authoring) and Learner (rendering)

---

## Phase 3 — App Development

### 3.1 Public Site — `apps/lms-publicsite-dev` (`p3-public-site`)
- **Tech**: React + Vite
- **Auth**: Anonymous
- **Features**:
  - Marketing page layout with navigation
  - Blog listing + article pages
  - Knowledge Base shell (static article pages, audience labels, version badge)
  - Build-time client-side search index (Pagefind or FlexSearch)
- **Consumes**: `@lms/shared-ui`, `@lms/shared-schemas`

### 3.2 Knowledge Site — `apps/lms-knowledge-site` (`p3-knowledge-site`)
- **Tech**: React + Vite
- **Auth**: Anonymous
- **Features**:
  - Article browser with audience filter (Editor / Learner / Both)
  - Version selector (current + previous only; expired versions removed)
  - Article renderer (markdown + code blocks)
  - Build-time client-side search index
  - No runtime APIs, no CMS
- **Content source**: Static markdown files in repo (ADO private repo for prod)
- **Consumes**: `@lms/shared-ui`

### 3.3 Editor App — `apps/lms-editorsite-dev` (`p3-editor-app`)
- **Tech**: React + Vite
- **Auth**: Entra ID (MSAL), app roles: Author / Publisher / Admin
- **Features**:
  - Block-based authoring canvas (drag-and-drop)
  - Block palette sidebar
  - Block property editor
  - Draft → Review → Publish state machine
  - Publish: writes versioned JSON bundle to Blob Storage via Backend API
  - Preview renders using same block registry as Learner
- **Consumes**: `@lms/shared-auth`, `@lms/shared-ui`, `@lms/block-registry`, `@lms/shared-schemas`

### 3.4 Learner App — `apps/lms-learnersite-dev` (`p3-learner-app`)
- **Tech**: Next.js 16 (App Router)
- **Auth**: Entra ID (MSAL + Next.js middleware)
- **Features**:
  - Course catalogue page
  - Course player — fetches versioned JSON bundle from CDN
  - Block renderer powered by `@lms/block-registry`
  - Progress tracking (POST to Backend API)
  - Enrolment check before content access
- **Consumes**: `@lms/shared-auth`, `@lms/block-registry`, `@lms/shared-schemas`

---

## Phase 4 — Backend Services

### 4.1 Backend Azure Functions — `services/backend-functions` (`p4-backend-functions`)
- HTTP-triggered functions:
  - `POST /publish` — validates bundle schema, writes to Blob, triggers CDN purge
  - `GET /progress/:userId/:courseId`
  - `POST /progress`
  - `GET /enrolment/:userId`
- Auth: validate Entra bearer token, enforce app roles per endpoint
- Behaviour evolves in lockstep with Editor + Learner (per spec §4)
- **Consumes**: `@lms/shared-schemas`

---

## Phase 5 — Azure Pipelines CI/CD

One YAML file per app, each with a path-filtered trigger. All stored under `.azure/pipelines/`.

### Pipeline files

| File | Trigger paths | Deploy target |
|------|--------------|---------------|
| `public-site.yml` | `apps/lms-publicsite-dev/**`, `shared/**` | `lms-publicsite-dev` SWA |
| `knowledge-site.yml` | `apps/lms-knowledge-site/**`, `shared/**` | `lms-knowledge-site` SWA |
| `editor-app.yml` | `apps/lms-editorsite-dev/**`, `shared/**` | `lms-editorsite-dev` SWA |
| `learner-app.yml` | `apps/lms-learnersite-dev/**`, `shared/**` | `lms-learnersite-dev` SWA |
| `backend-functions.yml` | `services/backend-functions/**` | Azure Functions |

### Common pipeline steps (per app)
1. `npm ci` at workspace root (installs all packages)
2. `npm run build -w apps/<app-name>` (workspace-scoped build)
3. `AzureStaticWebApp@0` task with `deployment_token` from variable group

### Notes
- Shared package changes (`shared/**`) trigger all four app pipelines — intentional since a shared contract change may affect any app
- Backend pipeline is fully independent — no shared trigger with frontends
- SWA deployment tokens stored as pipeline secrets / variable group

---

## Phase 6 — Infrastructure & Documentation

### 6.1 `staticwebapp.config.json` per app (`p5-swa-configs`)
- Route rules:
  - React apps (public, knowledge, editor): SPA fallback (`"navigationFallback"`)
  - Learner (Next.js): Next.js standalone output, no SPA fallback needed
- Auth config:
  - Public + KB: anonymous
  - Editor + Learner: require Entra ID (`"auth": { "identityProviders": { "azureActiveDirectory": {...} } }`)
- Response headers: CSP, cache-control

### 6.2 Entra app registrations documentation (`p6-entra-app-regs`)
- Document in `shared/auth/README.md`:
  - 4 app registrations: Public (optional), Editor, Learner, Backend API
  - Redirect URIs per environment (dev/prod)
  - Exposed scopes on Backend API registration
  - App role definitions (Author, Publisher, Admin, Learner)

### 6.3 Root README update (`p6-readme`)
- Project overview + architecture summary
- Monorepo structure map
- How to run each app locally
- How pipelines are triggered
- Required env vars + where secrets live

---

## Dependency Graph (summary)

```
p1-root-workspace
  └── p1-ts-references
  └── p1-structure-audit
  └── p2-shared-* (all 4 shared packages, in parallel)
        └── p3-* (apps, can progress in parallel once shared deps done)
              └── p5-pipeline-* (pipelines, once apps are buildable)
p4-backend-functions (depends on p2-shared-schemas only)
p6-* (documentation, can run alongside implementation)
```

---

## Out of Scope (per spec §9)

- Per-client configuration
- White-labelling / client forks
- Runtime CMS APIs
- Dynamic KB services
- Public contribution workflows
- Multi-tenant UX (data partition key only, no behaviour changes)
