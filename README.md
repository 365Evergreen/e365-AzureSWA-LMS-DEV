# LMS Platform

A single evergreen LMS platform with four clearly separated sites, static-first delivery, block-based content, vendor-controlled evolution, and a Learn-style knowledge base. See [`about-this-project`](./about-this-project) for the full architectural reference and [`docs/development-plan.md`](./docs/development-plan.md) for the implementation plan.

---

## Monorepo Structure

```
lms-platform/
├── apps/
│   ├── lms-publicsite-dev      React + Vite  — Marketing site & Knowledge Base shell
│   ├── lms-knowledge-site      React + Vite  — Standalone Learn-style KB
│   ├── lms-editorsite-dev      React + Vite  — Block-based content authoring (Entra ID)
│   └── lms-learnersite-dev     Next.js 16    — Course player & progress tracking (Entra ID)
├── shared/
│   ├── auth                    @lms/shared-auth       MSAL helpers & Entra role types
│   ├── schemas                 @lms/shared-schemas    Zod schemas: Block, Bundle, Progress
│   ├── ui                      @lms/shared-ui         Shared React component library
│   └── block-registry          @lms/block-registry    Block type definitions (editor ↔ learner)
├── services/
│   └── backend-functions                              Azure Functions: publish, progress, enrolment
├── .azure/
│   └── pipelines/              One YAML per app — path-filtered Azure Pipeline triggers
└── docs/
    └── development-plan.md     Phased implementation plan
```

**Workspace manager**: npm workspaces (root `package.json`)

---

## Prerequisites

- Node.js ≥ 22
- npm ≥ 10

---

## Getting Started

Install all workspace dependencies from the repo root:

```bash
npm install
```

### Run an app locally

```bash
npm run dev:public       # Public site        → http://localhost:5173
npm run dev:knowledge    # Knowledge site     → http://localhost:5173
npm run dev:editor       # Editor app         → http://localhost:5173
npm run dev:learner      # Learner app        → http://localhost:3000
```

### Build a single app

```bash
npm run build:public
npm run build:knowledge
npm run build:editor
npm run build:learner
```

### Build all apps

```bash
npm run build:all
```

### Lint all workspaces

```bash
npm run lint:all
```

---

## Azure Pipelines

Each app has its own pipeline in `.azure/pipelines/`, triggered by path-filtered pushes to `main`:

| Pipeline file | Trigger paths | Deploy target |
|---|---|---|
| `public-site.yml` | `apps/lms-publicsite-dev/**`, `shared/**` | `lms-publicsite-dev` SWA |
| `knowledge-site.yml` | `apps/lms-knowledge-site/**`, `shared/**` | `lms-knowledge-site` SWA |
| `editor-app.yml` | `apps/lms-editorsite-dev/**`, `shared/**` | `lms-editorsite-dev` SWA |
| `learner-app.yml` | `apps/lms-learnersite-dev/**`, `shared/**` | `lms-learnersite-dev` SWA |
| `backend-functions.yml` | `services/backend-functions/**` | Azure Functions |

> Changes to `shared/**` trigger all four frontend pipelines — any shared package change may affect every app.

Pipelines read SWA deployment tokens from the **`lms-swa-tokens`** variable group in Azure DevOps:

| Variable | Used by |
|---|---|
| `SWA_TOKEN_PUBLIC_SITE` | `public-site.yml` |
| `SWA_TOKEN_KNOWLEDGE_SITE` | `knowledge-site.yml` |
| `SWA_TOKEN_EDITOR_APP` | `editor-app.yml` |
| `SWA_TOKEN_LEARNER_APP` | `learner-app.yml` |

The backend pipeline uses the **`lms-azure-functions`** variable group and an Azure service connection named `lms-azure-service-connection`.

---

## Required Environment Variables

### Editor App (`apps/lms-editorsite-dev`)

| Variable | Description |
|---|---|
| `VITE_ENTRA_CLIENT_ID` | Entra app registration client ID |
| `VITE_ENTRA_TENANT_ID` | Entra tenant ID |
| `VITE_API_BASE_URL` | Backend Functions base URL |

### Learner App (`apps/lms-learnersite-dev`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_ENTRA_CLIENT_ID` | Entra app registration client ID |
| `NEXT_PUBLIC_ENTRA_TENANT_ID` | Entra tenant ID |
| `NEXT_PUBLIC_API_BASE_URL` | Backend Functions base URL |
| `NEXT_PUBLIC_CDN_BASE_URL` | CDN base URL for content bundles |

### Backend Functions (`services/backend-functions`)

| Variable | Description |
|---|---|
| `ENTRA_TENANT_ID` | Entra tenant ID used for backend token validation |
| `ENTRA_CLIENT_ID` | Backend API app registration client ID used as the API audience |
| `STORAGE_CONNECTION_STRING` | Azure Storage connection string for tables/blobs |
| `ACS_CONNECTION_STRING` | Azure Communication Services connection string for sign-up confirmation emails |
| `SIGNUP_EMAIL_SENDER` | ACS sender address for sign-up confirmation emails |
| `LEARNER_RESOURCE_SP_OBJECT_ID` | Service principal object ID of the backend API app role resource |
| `LEARNER_APP_ROLE_ID` | App role ID for the backend API `Learner` role |
| `LEARNER_INVITE_REDIRECT_URL` | Post-invitation redirect URL, currently the learner app home |

The Function App also uses a **system-assigned managed identity** for Microsoft Graph application permissions. Grant it:

- `User.Invite.All`
- `User.Read.All`
- `GroupMember.Read.All`
- `AppRoleAssignment.ReadWrite.All`

See `shared/auth/README.md` for Entra app registration setup.

---

## Auth

- **Public site & Knowledge site**: Anonymous — no login required
- **Editor app**: Entra ID, requires app role (`Author`, `Publisher`, or `Admin`)
- **Learner app**: Entra ID, requires app role (`Learner`)

Each app ships a `staticwebapp.config.json` (in `public/`) that configures SWA route rules and Entra auth. Replace `__TENANT_ID__` placeholders with your actual Entra tenant ID before deploying the editor and learner apps.
