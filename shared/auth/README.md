# `@lms/shared-auth` — Entra App Registration Setup

This package provides MSAL browser helpers and Entra role types used by the Editor and Learner apps. Four separate app registrations are required in Microsoft Entra ID (Azure AD).

---

## App Registrations

### 1. Public Site (optional auth)

| Field | Value |
|---|---|
| Name | `lms-public-site` |
| Supported account types | Single tenant |
| Redirect URIs | `https://<public-site-domain>/.auth/login/aad/callback` |
| Auth required | No — anonymous access |

### 2. Editor App

| Field | Value |
|---|---|
| Name | `lms-editor-app` |
| Supported account types | Single tenant |
| Redirect URIs | `http://localhost:5173` (dev), `https://<editor-domain>` (prod) |
| Auth required | Yes — app roles required |

**App Roles** (defined on this registration):

| Role display name | Value | Assigned to |
|---|---|---|
| Author | `Author` | Content authors |
| Publisher | `Publisher` | Content publishers |
| Admin | `Admin` | Platform admins |

### 3. Learner App

| Field | Value |
|---|---|
| Name | `lms-learner-app` |
| Supported account types | Single tenant |
| Redirect URIs | `http://localhost:3000` (dev), `https://<learner-domain>` (prod) |
| Auth required | Yes — app roles required |

**App Roles** (defined on this registration):

| Role display name | Value | Assigned to |
|---|---|---|
| Learner | `Learner` | Enrolled learners |

### 4. Backend API

| Field | Value |
|---|---|
| Name | `lms-backend-api` |
| Supported account types | Single tenant |
| Redirect URIs | None (daemon/service) |
| Auth required | N/A — validates incoming tokens |

**Exposed scopes** (defined on this registration):

| Scope | Description |
|---|---|
| `Content.Publish` | Allows publishing content bundles (Editor → Backend) |
| `Progress.ReadWrite` | Allows reading/writing learner progress (Learner → Backend) |
| `Enrolment.Read` | Allows reading enrolment records (Learner → Backend) |

---

## Token Configuration

For the Editor and Learner app registrations, configure the **optional claims** to include `roles` in the ID token:

1. Navigate to **Token configuration** in the app registration
2. Add optional claim → ID token → `roles`

---

## Environment Variables

After creating the registrations, populate the following in each app's `.env.local`:

**Editor App** (`apps/lms-editorsite-dev/.env.local`):
```
VITE_ENTRA_CLIENT_ID=<editor-app-client-id>
VITE_ENTRA_TENANT_ID=<tenant-id>
VITE_API_BASE_URL=https://<backend-functions-url>
```

**Learner App** (`apps/lms-learnersite-dev/.env.local`):
```
NEXT_PUBLIC_ENTRA_CLIENT_ID=<learner-app-client-id>
NEXT_PUBLIC_ENTRA_TENANT_ID=<tenant-id>
NEXT_PUBLIC_API_BASE_URL=https://<backend-functions-url>
NEXT_PUBLIC_CDN_BASE_URL=https://<cdn-url>
```

**`staticwebapp.config.json`**: Replace `__TENANT_ID__` in the editor and learner SWA configs with the actual Entra tenant ID before deploying.

---

## Multi-Tenant Future

The platform is single-tenant today. The `tenantId` field in `CourseEnrolment` and `ProgressRecord` schemas is a **data partition key only** — there is no tenant-specific behaviour or UI. When multi-tenant support is introduced, the app registrations will be updated to `AnyOrganizationalDirectory` without requiring code changes.
