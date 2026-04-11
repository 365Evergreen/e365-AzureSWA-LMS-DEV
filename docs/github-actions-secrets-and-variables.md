# GitHub Actions Secrets and Variables

This document lists the **repository secrets** and **repository variables** needed for the recommended GitHub Actions setup:

- `ci.yml`
- `deploy-static.yml`
- `deploy-learner.yml`
- `deploy-backend.yml`

Use **Settings -> Secrets and variables -> Actions** in GitHub.

---

## Secrets

Secrets are for tokens, credentials, and publish profiles. Do **not** store these as plain variables.

| Name | Used by | Required value | Where to get it |
|------|---------|----------------|-----------------|
| `SWA_TOKEN_PUBLIC_SITE` | `deploy-static.yml` | `<public SWA deployment token>` | Azure Portal -> target Static Web App -> **Manage deployment token** |
| `SWA_TOKEN_KNOWLEDGE_SITE` | `deploy-static.yml` | `<knowledge SWA deployment token>` | Azure Portal -> target Static Web App -> **Manage deployment token** |
| `SWA_TOKEN_EDITOR_APP` | `deploy-static.yml` | `<editor SWA deployment token>` | Azure Portal -> target Static Web App -> **Manage deployment token** |
| `SWA_TOKEN_LEARNER_APP` | `deploy-learner.yml` | `<learner SWA deployment token>` | Azure Portal -> target Static Web App -> **Manage deployment token** |
| `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` | `deploy-backend.yml` | `<full Function App publish profile XML>` | Azure Portal -> Function App -> **Get publish profile** |

### Notes

- Each SWA token is tied to **one specific Static Web App**.
- The backend publish profile should be pasted exactly as downloaded, including the full XML.
- If the backend deployment later moves to OIDC/Azure Login, this publish profile secret can be replaced with Azure federated credentials.

---

## Variables

Variables are for non-secret configuration values used at build time.

| Name | Used by | Required value | Where it comes from |
|------|---------|----------------|---------------------|
| `API_BASE_URL` | public, editor, learner builds | `<backend API base URL>` | Azure Function App base URL or API gateway URL |
| `CDN_BASE_URL` | learner build | `<public CDN or blob base URL>` | Azure CDN endpoint or blob/CDN public origin URL |
| `ENTRA_TENANT_ID` | editor and learner builds | `<tenant GUID>` | Microsoft Entra ID -> Overview -> **Tenant ID** |
| `ENTRA_CLIENT_ID_EDITOR` | editor build | `<editor app registration client ID>` | Microsoft Entra ID -> App registrations -> editor app |
| `ENTRA_CLIENT_ID_LEARNER` | learner build | `<learner app registration client ID>` | Microsoft Entra ID -> App registrations -> learner app |
| `ENTRA_CLIENT_ID_KNOWLEDGE` | optional knowledge build | `<knowledge app registration client ID>` | Microsoft Entra ID -> App registrations -> knowledge app |
| `API_SCOPE` | editor build | `<backend API scope>` | Microsoft Entra ID -> backend API app registration -> **Expose an API** |
| `AZURE_FUNCTIONS_APP_NAME` | backend deploy | `<function app resource name>` | Azure Portal -> Function App -> Overview -> **Name** |

### Notes

- `API_BASE_URL` should **not** end with a trailing slash unless the workflows or app config explicitly expect one.
- `AZURE_FUNCTIONS_APP_NAME` is the **resource name**, not `https://...azurewebsites.net`.
- `API_SCOPE` must match the scope exposed by the backend API registration and granted to the editor app registration.

---

## Recommended mapping by workflow

### `ci.yml`

No deployment secrets required.

Optional variables may be needed if the workflow runs full production-like builds:

- `API_BASE_URL`
- `CDN_BASE_URL`
- `ENTRA_TENANT_ID`
- `ENTRA_CLIENT_ID_EDITOR`
- `ENTRA_CLIENT_ID_LEARNER`
- `API_SCOPE`

### `deploy-static.yml`

Needs:

- `SWA_TOKEN_PUBLIC_SITE`
- `SWA_TOKEN_KNOWLEDGE_SITE`
- `SWA_TOKEN_EDITOR_APP`
- `API_BASE_URL`
- `ENTRA_TENANT_ID`
- `ENTRA_CLIENT_ID_EDITOR`
- `API_SCOPE`

### `deploy-learner.yml`

Needs:

- `SWA_TOKEN_LEARNER_APP`
- `API_BASE_URL`
- `CDN_BASE_URL`
- `ENTRA_TENANT_ID`
- `ENTRA_CLIENT_ID_LEARNER`

### `deploy-backend.yml`

Needs:

- `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`
- `AZURE_FUNCTIONS_APP_NAME`

If the backend build uses environment-specific app settings during packaging, add those separately as needed.

---

## Setup checklist

1. Add all five secrets in **GitHub -> Settings -> Secrets and variables -> Actions**.
2. Add the required variables in the same Actions settings area.
3. Double-check that each SWA token matches the correct target app.
4. Paste the full Function App publish profile XML into `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`.
5. Confirm the Entra client IDs map to the correct app registrations.
6. Confirm `API_SCOPE` exactly matches the scope exposed by the backend API registration.

---

## Minimal required set

For the recommended workflow split, the repository needs:

- **5 secrets**
- **7 required variables**
- **1 optional knowledge client ID variable**
- **4 workflow files**
