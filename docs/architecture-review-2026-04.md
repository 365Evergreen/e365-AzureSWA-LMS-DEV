# Architecture Review - 2026-04

## Summary

This review focused on the current LMS platform architecture across the public site, knowledge site, editor app, learner app, shared packages, and Azure Functions backend.

The codebase already has a strong product shape:

- a clear monorepo split by app and shared package
- shared schemas for content and progress
- a block-based authoring model
- a static-first publishing intent
- relatively small backend endpoints

The largest weaknesses are not about overall direction. They are about internal consistency and operational hardening:

- auth and environment-variable contracts do not line up between docs and runtime
- block rendering is not truly shared across all consuming apps
- authored HTML is rendered too directly
- the platform is carrying both legacy and new catalogue models at the same time
- the public experience still depends on client-side runtime API fetches more than the architecture suggests
- storage patterns are workable for an MVP but fragile for richer content operations
- automated verification coverage is still very light

## Findings

### 1. Auth and config drift

The project documentation, shared auth docs, and runtime implementation disagree on some important details:

- backend env names differ between docs and code
- docs describe editor roles as `Author`, `Publisher`, and `Admin`
- several runtime checks only expect `ContentEditor`
- some backend handlers allow `Admin` while others do not

Impact:

- deployment misconfiguration risk
- confusing permission model for future contributors
- inconsistent access behavior across endpoints

### 2. Rendering logic is duplicated

The learner app uses the shared block registry, but the public site ships its own separate block renderer. The editor also contains a partially separate preview implementation and several block stubs.

Impact:

- behavior drift between editor preview, learner rendering, and public rendering
- block additions become cross-app change sets
- harder QA and slower feature rollout

### 3. Raw HTML handling needs tightening

Paragraph-like content is modeled as HTML strings and injected into the DOM in multiple places.

Impact:

- XSS exposure if author input is not sanitized before rendering
- harder long-term portability of content
- inconsistent behavior depending on where the content is rendered

### 4. Two data models are active at once

The repo still carries the older flat course/enrolment/progress model while also building toward the newer path/module/unit hierarchy.

Impact:

- extra cognitive load
- duplicated backend logic
- unclear source of truth during future feature work

### 5. Static-first intent vs runtime reality

The documented direction emphasizes static-first delivery, but the public app is still a client-routed SPA with runtime fetches for nav and page content.

Impact:

- SEO and first-load tradeoffs
- backend availability affects content delivery more than expected
- architecture docs and runtime behavior diverge

### 6. Storage patterns will age poorly

Azure Table Storage is being used successfully as a simple persistence layer, but the current patterns rely on scans, denormalized records, and delete-and-recreate reorder flows.

Impact:

- weak transactional guarantees
- awkward reorder and migration flows
- scaling friction for richer admin/search/reporting scenarios

### 7. Test and contract verification are still thin

The workspace is optimized for local iteration, but visible automation currently leans heavily on build and lint. There is not yet a clear cross-app verification layer for auth, schemas, or publish/render flows.

Impact:

- regressions can survive longer
- migration work is riskier
- shared package changes are harder to trust

## Recommended priorities

### Now

- unify backend env handling and document aliases
- normalize role handling across frontend and backend
- add a shared browser-side HTML sanitization layer
- document the current architectural debt and next steps

### Next

- choose a canonical shared rendering path for all block consumers
- decide whether the public/knowledge surfaces are truly static or intentionally API-backed SPAs
- add contract tests for content schemas and API auth guards

### Later

- retire the legacy flat course model
- revisit storage choices for hierarchical content and admin operations
- improve observability, performance budgets, and deployment verification
