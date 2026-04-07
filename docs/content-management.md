# Public Site — Content Management Guide

**App:** `apps/lms-publicsite-dev` (Azure Static Web App)

> **PoC note:** The current app is a React + Vite SPA, which is adequate for validating the content management architecture. The recommended production framework is **Next.js with Incremental Static Regeneration (ISR)** — see [Framework](#framework) below. The data architecture (Table Storage + Blob Storage + backend API) is forward-compatible with both.

---

## Framework

### Current: React + Vite (SPA)

The public site is currently a client-side SPA. For a content-heavy site with growing post volume, this has an inherent performance ceiling:

- Every page load delivers a blank HTML shell, then fetches JS, then fetches content — three serial steps before anything renders
- Every visitor hits the backend API — no shared caching between users
- Poor Core Web Vitals (FCP/LCP) out of the box
- Search engine crawlers receive JS-rendered content, not static HTML

### Production: Next.js with ISR

Next.js is already in this monorepo (`apps/lms-learnersite-dev`). It addresses all three performance goals directly:

| Goal | React SPA | Next.js + ISR |
|---|---|---|
| Fast initial load | ❌ JS-first, blank shell until fetch completes | ✅ Pre-rendered HTML, no JS required for first paint |
| Content serving | ❌ Per-user API call on every page load | ✅ Static HTML served from CDN edge, zero API call per user |
| Avoiding costly API calls | ❌ Every visitor hits the backend | ✅ Backend called once per ISR cycle, not per visitor |

**How ISR works with the table/blob architecture:**

```
Editor publishes post
  → POST /api/content/publish
      writes table row + blob
      calls Next.js on-demand revalidation: POST /api/revalidate?slug=my-post&type=post
  → Next.js re-renders /blog/<slug> to static HTML at the CDN edge
  → All subsequent visitors receive pre-rendered HTML — zero API calls
```

Pages and the blog listing are also statically generated at build time from the table. ISR means new posts become static HTML within seconds of publishing, not minutes.

**Content is fully independent of the app deployment.** The public site app bundle (JS, CSS, HTML shell) is deployed when the pipeline runs. Content lives in Table Storage and Blob Storage — publishing a post via the LMS Editor never triggers a redeployment. ISR revalidation is a lightweight background Next.js process, not a full rebuild.

### Migration path

The React + Vite PoC validates the content architecture. When migrating to Next.js:

1. The backend API endpoints (`/api/content`, `/api/content/:app/:type/:slug`) are identical — no backend changes
2. React component logic ports directly; only data-fetching moves from `useEffect` to `generateStaticParams` + `fetch` in Server Components
3. The `lms-publicsite-dev` app is replaced by a Next.js app; the pipeline YAML is updated to use the Next.js build adapter (same pattern as `lms-learnersite-dev`)

---

## Overview

The public site serves two distinct types of content with very different publishing cadences:

| Type | Examples | Change frequency | Who publishes |
|------|----------|-----------------|---------------|
| **Pages** | Homepage (hero, features), KB teaser, About | Occasionally — major campaigns or product updates | Developer or content editor |
| **Posts** | Blog articles | At least daily | Content editor (no developer involvement required) |

These different cadences call for different management strategies. The sections below cover the current state, available options, and a recommended approach for each.

---

## Pages

### Current State

Page content is hardcoded directly in React components:

- `Hero.tsx` — headline, subheadline, and CTA copy are JSX string literals
- `FeatureGrid.tsx` — feature list is a hardcoded array
- `KBTeaser.tsx` — teaser copy is hardcoded

Any copy change requires a code edit, a commit, and a CI pipeline run (~3–5 minutes to deploy).

### Options

#### Option A — Keep as React components *(current)*

Content lives in `.tsx` files alongside layout code. Suitable when:
- Changes are rare (less than once per month)
- A developer is always involved anyway (e.g. layout changes accompany copy changes)
- No non-technical editors need access

**Trade-offs:**
- ✅ Zero infrastructure overhead
- ✅ Type-safe, version-controlled content
- ❌ Every copy change requires a code change + deployment
- ❌ Excludes non-developer content editors

#### Option B — JSON content files in Blob Storage *(recommended for pages)*

Each page's variable content (copy, links, feature list) is extracted into a JSON document stored in Azure Blob Storage (`stlms365evdev`, a new `page-content` container). The React component fetches the JSON at runtime and renders it.

```
stlms365evdev
└── page-content/          (public read, no container listing)
    ├── home.json
    ├── about.json
    └── features.json
```

Example `home.json`:
```json
{
  "hero": {
    "headline": "Build better learning experiences",
    "subheadline": "The LMS Platform gives your team the tools...",
    "primaryCta": { "label": "Explore Knowledge Base", "href": "/kb" },
    "secondaryCta": { "label": "Read the Blog", "href": "/blog" }
  },
  "features": [
    { "icon": "block", "title": "Block-based authoring", "body": "..." }
  ]
}
```

The public site fetches `home.json` on load (or at build time via SSG if migrated to Next.js). Updating the page requires only uploading a new JSON file — no code change, no deployment.

Editing the JSON can be done via:
- Azure Portal Storage Explorer (simple, ad hoc)
- A future "Pages" section in the LMS Editor (see Option D)
- Azure CLI (`az storage blob upload`)

**Trade-offs:**
- ✅ Copy changes without redeployment
- ✅ Uses existing infrastructure (same storage account)
- ✅ JSON is version-historied if desired (blob versioning in Azure Storage)
- ✅ With Next.js SSG, content is fetched at build time — no loading state, no runtime latency
- ⚠️ React SPA requires a loading state (resolved when migrating to Next.js)
- ⚠️ No authoring UI out of the box — raw JSON editing until the LMS Editor Pages section is built
- ❌ No schema enforcement at upload time (mitigated with Zod validation in the component/server)

#### Option C — Headless CMS

Use a purpose-built CMS such as [Contentful](https://www.contentful.com/), [Sanity](https://www.sanity.io/), or [Decap CMS](https://decapcms.org/) (formerly Netlify CMS).

**Trade-offs:**
- ✅ Rich WYSIWYG editing UI for non-technical editors
- ✅ Preview, scheduling, and approval workflows built in
- ❌ Adds an external service dependency and monthly cost
- ❌ Inconsistent with the rest of the platform's content architecture
- ❌ Requires Webhook → pipeline trigger or runtime API calls for live updates

#### Option D — Extend the LMS Editor with a "Page" content type

Add a Pages section to `lms-editorsite-dev` that lets authenticated editors update page content using the same block-based editor used for course authoring. Publish writes to Blob Storage (same pattern as course bundles).

**Trade-offs:**
- ✅ Unified editing experience across all content
- ✅ Full integration with existing auth and role model
- ❌ Significant development investment (new content type, routing, publish flow)
- ❌ Overkill for content that changes infrequently

### Recommendation for Pages

**Option B — JSON content files in Blob Storage.**

The pages change infrequently but should not require a developer when copy needs updating. Storing structured JSON in the existing `stlms365evdev` storage account is consistent with the platform's architecture, adds no new dependencies, and enables non-developer editing via the Azure Portal. When the LMS Editor matures (Option D), the same JSON blobs can be written by the editor instead of manually.

**Implementation steps (when ready):**
1. Create `page-content` blob container in `stlms365evdev` (public blob read, no listing)
2. Extract hardcoded copy from `Hero.tsx`, `FeatureGrid.tsx`, `KBTeaser.tsx` into typed JSON files
3. Add a `usePageContent(page: string)` hook to the public site that fetches and caches the JSON
4. Add Zod schema validation so bad JSON produces a clear error rather than a blank page
5. Deploy initial JSON files to match current hardcoded content

---

## Posts

### Current State

Blog posts are hardcoded in `apps/lms-publicsite-dev/src/data/blog.ts` as a TypeScript array:

```ts
export const blogArticles: BlogArticle[] = [
  { title: '...', slug: '...', body: '<p>...</p>', ... },
];
```

Adding a post requires:
1. Editing `blog.ts` in a code editor
2. Committing to Git
3. Waiting for the CI pipeline to build and deploy (~3–5 minutes)

This is not viable for daily publishing without developer involvement.

### Requirements

- At least one new post per day
- Content editor publishes independently (no developer, no deployment)
- Posts are immediately visible after publishing (no rebuild cycle)
- Support for: title, slug, excerpt, publication date, tags, body (rich text)

### Options

#### Option A — Markdown files in Git *(current pattern extended)*

Authors commit `.md` files to a `content/posts/` directory. A CI pipeline rebuilds the site on push.

**Trade-offs:**
- ✅ Full version history in Git
- ✅ No runtime API needed
- ❌ Requires Git access and a commit workflow for every post
- ❌ Every post triggers a full rebuild + deployment (minutes of latency)
- ❌ Not viable for non-technical editors

#### Option B — Extend the LMS Editor with a Post content type *(recommended)*

Add a **Posts** section to `lms-editorsite-dev`. A `ContentEditor` role user creates and publishes posts using the existing block-based canvas. On publish, a new function (`POST /api/posts/publish`) writes two blobs to `stlms365evdev`:

```
stlms365evdev
└── posts/
    ├── index.json          ← list of all published posts (title, slug, excerpt, date, tags)
    └── <slug>.json         ← full post content (blocks array, same schema as courses)
```

The public site:
- Fetches `posts/index.json` on the blog listing page
- Fetches `posts/<slug>.json` on individual post pages

Posts are live immediately after publish — no rebuild, no redeployment.

**Architecture alignment:**
- Same storage account, same auth, same role model as course publishing
- Same block types reused (Text, Image, Video, Quote blocks work in posts)
- Same `validateToken` middleware — `ContentEditor` role required to publish
- Posts index is a single JSON blob updated on each publish (suitable for hundreds of posts; at daily cadence, years of posts remain small)

**Trade-offs:**
- ✅ No external dependencies — reuses `stlms365evdev` and `lms-editorsite-dev`
- ✅ Immediate publish (no rebuild)
- ✅ Consistent editorial experience with course authoring
- ✅ Authenticated — only `ContentEditor` role can publish
- ⚠️ Requires development work to add the Post content type to the editor
- ⚠️ Posts index blob becomes a write bottleneck at very high volume (not a concern at daily cadence)

#### Option C — Headless CMS (Contentful, Sanity, DatoCMS)

A purpose-built CMS with editorial UI, scheduling, preview, and webhooks. The public site either fetches content at runtime via the CMS API or triggers a rebuild on publish via webhook.

**Trade-offs:**
- ✅ Best-in-class editorial experience (rich text, drag images, preview, scheduling)
- ✅ No development work for the editor UI
- ✅ Webhook to Azure Static Web Apps can trigger a rebuild automatically
- ❌ External service dependency with monthly cost (Contentful free tier: 2 users, 25k API calls/month — likely sufficient initially)
- ❌ Inconsistent with rest of platform's architecture
- ❌ Webhook-triggered rebuild still adds ~3–5 minute latency; runtime fetch avoids this but requires API key management

#### Option D — Azure Table Storage + simple CRUD API

Posts stored as rows in a new `posts` Azure Table Storage table, with body stored as a blob in a `posts` container. A lightweight REST API (new Azure Function) handles list/get/create/update/publish. An authoring UI is built separately.

**Trade-offs:**
- ✅ Queryable (filter by date, tag, status)
- ✅ Uses existing infrastructure
- ❌ Requires building both the API and the authoring UI from scratch
- ❌ More complex than the blob-only approach for the volume involved (daily posts)

### Recommendation for Posts

**Option B — Extend the LMS Editor with a Post content type stored in Blob Storage.**

This is the most architecturally consistent choice. The LMS Editor already has authentication, a block canvas, a publish pipeline, and Azure Storage integration. Adding a Post content type reuses all of this with minimal new infrastructure:

- New backend function: `POST /api/posts/publish` (analogous to the existing `/api/publish`)
- New editor route: `/posts` — list, create, and edit posts
- New blob container: `posts/` in `stlms365evdev`
- Public site: replace hardcoded `data/blog.ts` with runtime fetches from `posts/index.json` and `posts/<slug>.json`

**If a faster path is needed** (posts required before the editor extension is built), **Option C (headless CMS)** is a viable interim. Contentful's free tier supports the required volume, and the public site can consume their delivery API with a simple `fetch`. Migration back to the platform-native approach later is straightforward — just swap the data source.

---

## Storage Architecture

### The established pattern

The project already uses this split across course content:

| Layer | Technology | Role |
|---|---|---|
| **Metadata + index** | Azure Table Storage | Queryable, filterable records — title, slug, status, date, tags, author |
| **Content body** | Azure Blob Storage | The actual content payload (JSON blocks, rich text) |
| **Backend API** | Azure Functions | Mediates access — queries table, optionally fetches blob, returns combined response |

The `courses` table stores course metadata with a `bundleUrl` column pointing to the blob in `content-bundles`. The `getCatalogue` function queries the table and returns results; the learner app fetches the blob for full content. **Posts and pages should follow the same model.**

### Table design

A single `site-content` table (in `stlms365evdev`) covers all public site content types. The PartitionKey combines app and content type, keeping all records for a given type in one partition for efficient queries:

| Field | Type | Notes |
|---|---|---|
| **PartitionKey** | `string` | `{app}#{contentType}` — e.g. `publicsite#post`, `publicsite#page` |
| **RowKey** | `string` | URL-safe slug — e.g. `intro-to-azure`, `home` |
| `contentId` | `string (UUID)` | Stable identifier (RowKey/slug may change) |
| `title` | `string` | Display title |
| `excerpt` | `string` | Short description (posts) or meta description (pages) |
| `status` | `"draft" \| "published" \| "archived"` | Public API returns `published` only |
| `contentUrl` | `string (URL)` | Points to blob at `content/{app}/{contentType}/{slug}.json` |
| `authorId` | `string` | Entra object ID |
| `publishedAt` | `string (ISO 8601)` | |
| `updatedAt` | `string (ISO 8601)` | |
| `tags` | `string` | Comma-separated (Table Storage has no array type) |
| `featuredImageUrl` | `string (URL)` | Optional — points to `media/` blob |

**Access patterns:**
- List published posts: `PartitionKey eq 'publicsite#post' and status eq 'published'`
- Get page by slug: `getEntity('publicsite#page', 'home')`
- Filter by tag: fetch partition, filter in-memory (same approach as courses)

This is consistent with `courses` (PartitionKey = `"catalogue"`, query by status).

### Blob container — content body only

The `content/` container stores content payloads only. The table is the index — no `index.json` blob needed:

```
stlms365evdev
├── content/                                    ← content payloads (public blob read)
│   ├── publicsite/post/<slug>.json             ← full post body (blocks array)
│   ├── publicsite/page/home.json               ← homepage copy (structured JSON)
│   └── (future: learnersite/, editorsite/)
├── content-bundles/                            ← course bundles (existing)
├── media/                                      ← editor uploads (existing)
└── thumbnails/                                 ← course thumbnails (existing)
```

Blob index tags remain useful for storage-level management (lifecycle policies, audit queries) but are no longer the primary query mechanism — that's the table's job.

### Request flow

#### React SPA (PoC)

**Blog listing page:**
```
Browser → GET /api/content?app=publicsite&type=post&status=published
        → Backend queries site-content table (PartitionKey = 'publicsite#post')
        → Returns metadata array (title, slug, excerpt, date, tags)
        ← No blob fetch needed for listing
```

**Individual post page:**
```
Browser → GET /api/content/publicsite/post/<slug>
        → Backend: getEntity('publicsite#post', slug) → get contentUrl
        → Backend: fetch blob at contentUrl
        → Returns { ...tableRow, blocks: [...] }
```

#### Next.js + ISR (production)

**At build time** (and on ISR revalidation after each publish):
```
Next.js build → GET /api/content?app=publicsite&type=post
              → Pre-renders /blog listing as static HTML

Next.js build → GET /api/content/publicsite/post/<slug> (for each slug)
              → Pre-renders each /blog/<slug> as static HTML
```

**Visitor request (after first build):**
```
Browser → /blog/my-post
        → CDN serves pre-rendered static HTML instantly
        ← Zero API calls, zero backend load
```

**On publish (ISR revalidation):**
```
LMS Editor → POST /api/content/publish
           → Writes table row + blob
           → Calls Next.js: POST /api/revalidate?slug=my-post
           → Next.js regenerates /blog/my-post in background
           → Next visitor gets fresh static HTML
```

This mirrors how `getCatalogue` works today for the learner app — the function is the data access layer, and neither the public site nor the learner app touches Table Storage directly.

---

## Summary

| Content type | Metadata | Content body | Access pattern |
|---|---|---|---|
| Pages | `site-content` table (`publicsite#page`) | `content/publicsite/page/<id>.json` blob | `GET /api/content/publicsite/page/<slug>` |
| Posts | `site-content` table (`publicsite#post`) | `content/publicsite/post/<slug>.json` blob | `GET /api/content?app=publicsite&type=post` |
| Courses *(existing)* | `courses` table | `content-bundles/<id>.json` blob | `GET /api/catalogue` |

No redeployment needed to publish new pages or posts. All content is managed through the LMS Editor and served via the backend API.

---

## Implementation Backlog

### PoC phase (React + Vite)

| Task | Priority | Depends on |
|---|---|---|
| Create `site-content` Azure Table | High | — |
| Create `content` blob container (public blob read) | High | — |
| Add `GET /api/content` list endpoint to backend | High | Table exists |
| Add `GET /api/content/:app/:type/:slug` endpoint to backend | High | Table + container exist |
| Add `POST /api/content/publish` endpoint to backend (ContentEditor role) | High | Table + container exist |
| Add Posts section to LMS Editor (list, create, edit, publish) | High | Backend endpoints |
| Replace `data/blog.ts` with `GET /api/content?app=publicsite&type=post` | High | Backend endpoints |
| Add Pages section to LMS Editor | Medium | Backend endpoints |
| Replace hardcoded copy in `Hero.tsx`, `FeatureGrid.tsx`, `KBTeaser.tsx` | Medium | Backend endpoints |
| Add Zod schemas for `SiteContentRecord` and `PostBody`/`PageBody` to `@lms/shared-schemas` | Medium | — |

### Production migration (React → Next.js)

| Task | Priority | Depends on |
|---|---|---|
| Replace `apps/lms-publicsite-dev` with a Next.js app | High | PoC backend endpoints validated |
| Move data fetching from `useEffect` hooks to Next.js Server Components / `generateStaticParams` | High | Next.js app scaffolded |
| Add `/api/revalidate` route to Next.js app (on-demand ISR trigger) | High | Next.js app scaffolded |
| Update `POST /api/content/publish` backend function to call the revalidate endpoint after writing | High | Revalidate route exists |
| Update `public-site.yml` pipeline to use Next.js build adapter (same as `lms-learnersite-dev`) | High | Next.js app builds successfully |
