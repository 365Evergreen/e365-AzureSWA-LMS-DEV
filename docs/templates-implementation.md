# Templates & Page Layouts — Implementation Plan

## Overview

Page templates define the structural layout that wraps block content in both the editor (preview) and all delivery apps. The goal is consistent rendering regardless of which editor created the content or which app delivers it.

Templates are defined in `templates.md` as:

| Template ID | Category | Layout | Notes |
|---|---|---|---|
| `landing-page` | Page | Full-width single column (FSE) | Width 100vw by default, configurable in properties pane |
| `content-page-fse` | Page | Content-width single column | Max-width constrained (~860px) |
| `content-page-left-sidebar` | Page | Left sidebar + main content area | Sidebar is a separate block zone |
| `content-page-right-sidebar` | Page | Main content area + right sidebar | Sidebar is a separate block zone |
| `search-results` | Page | Full-width, hardcoded components | Not freely editable; reserved for search |
| `post` | Post | Content-width, prose | Single template for PoC; metadata header auto-populated |

---

## Applies to all apps

| App | Role | Template usage |
|---|---|---|
| `lms-editorsite-dev` | Authoring | Template selection, canvas preview, properties pane |
| `lms-publicsite-dev` | Delivery — public | Renders pages and posts with their stored template |
| `lms-learnersite-dev` | Delivery — learner | Courses use `content-page-fse` (fixed); future: sidebar for module nav |
| `lms-knowledge-site` | Delivery — knowledge | Articles use `content-page-fse` or `content-page-right-sidebar` (TOC) |

---

## Architecture

### Shared layout components — `@lms/shared-ui`

Layout components wrap rendered block content. They are used by both the editor (canvas preview) and every delivery app, ensuring the layout seen during authoring matches what is published.

```
shared/ui/src/layouts/
├── LandingLayout/
│   ├── index.tsx          ← full-width single column, configurable max-width
│   └── LandingLayout.module.css
├── ContentLayout/
│   ├── index.tsx          ← variant prop: 'fse' | 'left-sidebar' | 'right-sidebar'
│   └── ContentLayout.module.css
├── PostLayout/
│   ├── index.tsx          ← prose-width, metadata header (title, date, tags)
│   └── PostLayout.module.css
└── index.ts               ← re-exports all layouts
```

Each layout accepts:
- `children` — the main block content (rendered blocks or editor canvas)
- `sidebar?` — ReactNode for sidebar variants (editor shows an empty sidebar slot; delivery app renders sidebar blocks)
- `contentWidth?` — override for LandingLayout (e.g. `'100vw'`, `'1200px'`, `'800px'`)
- `metadata?` — title, date, tags etc. for PostLayout header

### Template registry — `@lms/shared-ui` (or `@lms/block-registry`)

A static registry mapping template IDs to their display metadata and layout component:

```ts
// shared/ui/src/templates/registry.ts
export interface TemplateDefinition {
  id: string;
  label: string;
  description: string;
  category: 'page' | 'post';
  layout: 'landing' | 'content-fse' | 'content-left-sidebar' | 'content-right-sidebar' | 'search-results' | 'post';
  hasSidebar: boolean;
  thumbnail?: string;   // future: small preview image for gallery
}

export const templates: TemplateDefinition[] = [ ... ]
export function getTemplate(id: string): TemplateDefinition | undefined
```

The template ID is stored in the content bundle metadata and in the `site-content` table record.

### Template ID in content bundles

Add `templateId` to `ContentBundleSchema.metadata` in `@lms/shared-schemas`:

```ts
metadata: {
  title: string
  description?: string
  audienceRoles: string[]
  templateId: string        // ← new
  contentWidth?: string     // ← new (LandingLayout override)
}
```

And to `CourseProperties` in the editor:

```ts
interface CourseProperties {
  title: string
  slug: string
  featuredImage?: string
  description?: string
  status: 'draft' | 'published'
  templateId: string        // ← new
  contentWidth?: string     // ← new
}
```

---

## Editor changes — `apps/lms-editorsite-dev`

### 1. New content creation flow

Currently `EditorPage` opens directly with an empty canvas. The new two-step creation flow:

**Step 1 — Content type picker** (modal shown before editor opens):

```
┌──────────────────────────────────────┐
│   What would you like to create?     │
│                                      │
│   ┌──────────┐    ┌──────────┐      │
│   │ 📄 Page  │    │ 📝 Post  │      │
│   │          │    │          │      │
│   │ Static,  │    │ Regularly│      │
│   │ public   │    │ updated  │      │
│   └──────────┘    └──────────┘      │
└──────────────────────────────────────┘
```

Posts skip Step 2 — the `post` template is applied automatically.

**Step 2 (pages only) — Template gallery modal:**

```
┌───────────────────────────────────────────────────────────────┐
│  Choose a layout                                              │
│                                                               │
│  ┌───────────┐   ┌───────────┐   ┌───────────┐             │
│  │  Landing  │   │  Content  │   │  Search   │             │
│  │   page    │   │   page    │   │  results  │             │
│  │           │   │           │   │           │             │
│  │ Full      │   │ FSE / L   │   │ Hardcoded │             │
│  │ width,    │   │ sidebar / │   │ template  │             │
│  │ configure │   │ R sidebar │   │ only      │             │
│  └───────────┘   └───────────┘   └───────────┘             │
│                                                               │
│  (Choosing 'Content page' shows a sub-picker for variant)   │
└───────────────────────────────────────────────────────────────┘
```

`TemplateGallery` component:
- Shows cards for each template in the registry (filtered by category: page/post/course)
- Each card has label, description, and a simple layout diagram thumbnail
- Selecting a template closes the modal and initialises the editor with that template

**New components:**
- `ContentTypePickerModal` — Step 1 dialog (page vs post)
- `TemplateGalleryModal` — Step 2 grid of template cards (pages only)

### 2. Canvas layout preview

The editor canvas currently renders blocks in a plain vertical list. After this change, it wraps the block list in the appropriate layout component, giving a WYSIWYG preview:

```
┌─ EditorPage ──────────────────────────────────────────────────────┐
│ [Palette] │  [ Canvas — wrapped in LandingLayout / etc. ]  │ [Props] │
└───────────────────────────────────────────────────────────────────┘
```

For sidebar layouts, the canvas shows two zones: main (block list) and sidebar (secondary block list). The sidebar zone uses the same block palette/canvas mechanism.

**New component:** `CanvasTemplateShell` — wraps `BlockCanvas`, applies template-specific preview CSS, renders sidebar zone placeholder for sidebar layouts.

### 3. Properties pane — Layout tab and content-type-aware fields

Add a **Layout** tab to the right properties pane alongside "Content" and "Block".

Rename the current **"Course" tab → "Content"** to reflect that the editor now handles pages and posts, not just courses. The `CoursePropertiesPane` becomes `ContentPropertiesPane` with fields driven by `contentType`:

| Field | Page | Post | Course |
|---|---|---|---|
| Title | ✅ | ✅ | ✅ |
| Slug | ✅ | ✅ | ✅ |
| Description / excerpt | ✅ | ✅ | ✅ |
| Featured image | ✅ | ✅ | ✅ |
| Status | ✅ | ✅ | ✅ |
| Tags | ❌ | ✅ | ❌ |
| Target site | ✅ | ✅ | ❌ |
| Audience | ❌ | ❌ | ✅ |
| Level | ❌ | ❌ | ✅ |
| Duration | ❌ | ❌ | ✅ |

**Layout tab contents:**
- Current template name + description
- **Landing page only**: content width control (slider + text input; range 320px–100vw; default `100vw`)
- **Content page only**: sub-variant picker (FSE / Left sidebar / Right sidebar)
- **"Change template"** button → opens `TemplateGalleryModal` with rework warning

### 4. Template change warning

When changing template on existing content, a confirmation dialog warns:
> "Changing the template may affect how your blocks are laid out. Sidebar blocks will be moved to the main zone. Review your content after changing."


---

## Delivery app changes

### `apps/lms-publicsite-dev`

Pages and posts read `templateId` from the backend response and apply the matching layout:

```tsx
import { LandingLayout, ContentLayout, PostLayout } from '@lms/shared-ui'

function resolveLayout(templateId: string, children: ReactNode, sidebar?: ReactNode) {
  switch (templateId) {
    case 'landing-page':         return <LandingLayout>{children}</LandingLayout>
    case 'content-page-fse':     return <ContentLayout variant="fse">{children}</ContentLayout>
    case 'content-page-left-sidebar':  return <ContentLayout variant="left-sidebar" sidebar={sidebar}>{children}</ContentLayout>
    case 'content-page-right-sidebar': return <ContentLayout variant="right-sidebar" sidebar={sidebar}>{children}</ContentLayout>
    case 'post':                 return <PostLayout>{children}</PostLayout>
    default:                     return <ContentLayout variant="fse">{children}</ContentLayout>
  }
}
```

### `apps/lms-knowledge-site`

The existing `Layout` component (`components/Layout`) is already a content-width wrapper. Align it with `ContentLayout` from `@lms/shared-ui` — either replace it directly or have it delegate to the shared component.

Articles are always `content-page-fse` or `content-page-right-sidebar` (TOC). The `templateId` can be added to article data.

### `apps/lms-learnersite-dev`

The course player has its own layout. For now, courses use a fixed `content-page-fse` layout. The `templateId` in the bundle metadata is read but the player always renders in its course-player chrome (progress bar, module nav). No immediate change needed — the layout components apply inside the content area.

### `apps/lms-editorsite-dev`

The editor canvas wraps its block list in the selected layout component (WYSIWYG preview). See Editor changes above.

---

## Implementation phases

### Phase 1 — Shared layout components

1. Create `shared/ui/src/layouts/LandingLayout` — full-width, configurable max-width
2. Create `shared/ui/src/layouts/ContentLayout` — variant: `fse | left-sidebar | right-sidebar`
3. Create `shared/ui/src/layouts/PostLayout` — prose-width, metadata header slot
4. Create `shared/ui/src/templates/registry.ts` — template definitions + `getTemplate()`
5. Export all from `shared/ui/src/index.ts`

### Phase 2 — Editor canvas

6. Add `templateId` and `contentWidth` to `CourseProperties` + defaults
7. Add `TemplateGallery` component (modal with template cards)
8. Wrap `BlockCanvas` in the resolved layout component based on `state.templateId`
9. Add "Layout" tab to the properties pane
10. Update `DashboardPage` to open `TemplateGallery` before routing to `/editor`

### Phase 3 — Delivery apps

11. Apply layout components in `lms-publicsite-dev` page/post renderers
12. Align `lms-knowledge-site` `Layout` component with `ContentLayout`
13. Add `templateId` to `ContentBundleSchema.metadata` in `@lms/shared-schemas`

### Phase 4 — Template change flow (editor)

14. "Change template" button in Layout tab
15. Confirmation dialog for rework warning
16. Sidebar block zone handling on template change

---

## Phased delivery — what ships first

For the PoC, Phase 1 + Phase 2 steps 6–9 are the highest value: the editor canvas shows a WYSIWYG layout preview and templates are selectable. Phase 3 follows once the data model is updated. Phase 4 (change flow) can be deferred.

---

## Dependency order

```
Phase 1 — Shared layout components (@lms/shared-ui)
  └── Phase 2 — Editor canvas + template selection (lms-editorsite-dev)
        └── Phase 3 — Delivery app rendering (publicsite, learnersite, knowledge-site)
              └── Phase 4 — Template change flow (editor only)
```

Phases 2 and 3 can progress in parallel once Phase 1 is complete.

---

## File change summary

| File | Change |
|---|---|
| `shared/schemas/src/index.ts` | Add `TemplateType` enum; update `ContentBundleSchema.metadata` with `templateId` + `contentWidth` |
| `shared/ui/src/layouts/LandingLayout/` | New — full-width, configurable max-width |
| `shared/ui/src/layouts/ContentLayout/` | New — variant prop: `fse \| left-sidebar \| right-sidebar` |
| `shared/ui/src/layouts/PostLayout/` | New — prose-width, metadata header slot |
| `shared/ui/src/templates/registry.ts` | New — template definitions + `getTemplate()` |
| `shared/ui/src/index.ts` | Export all layout components and template registry |
| `apps/lms-editorsite-dev/src/pages/EditorPage/index.tsx` | Add `contentType` + `templateId` to state; integrate creation flow |
| `apps/lms-editorsite-dev/src/components/ContentTypePickerModal/` | New — page vs post picker (Step 1) |
| `apps/lms-editorsite-dev/src/components/TemplateGalleryModal/` | New — template gallery (Step 2, pages only) |
| `apps/lms-editorsite-dev/src/components/CanvasTemplateShell/` | New — wraps `BlockCanvas` with template preview CSS |
| `apps/lms-editorsite-dev/src/components/ContentPropertiesPane/` | New — replaces `CoursePropertiesPane`; content-type-aware fields + layout tab |
| `apps/lms-editorsite-dev/src/components/CoursePropertiesPane/` | Deprecated — replaced by `ContentPropertiesPane` |
| `apps/lms-publicsite-dev/src/pages/` (page + post routes) | Wrap rendered content in resolved layout component |
| `apps/lms-learnersite-dev/` (course player) | Wrap content area in `<ContentLayout variant="fse">` |
| `apps/lms-knowledge-site/src/components/Layout/` | Align with `ContentLayout` from `@lms/shared-ui` |

