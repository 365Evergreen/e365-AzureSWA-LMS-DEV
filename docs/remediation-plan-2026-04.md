# Remediation Plan - 2026-04

## Objective

Reduce the highest-risk architectural inconsistencies first while keeping the current product direction intact.

## Phase 1 - Consistency and safety

Status: In progress

### Goals

- make auth behavior consistent across frontend and backend
- align backend runtime config with documented env names
- reduce direct HTML injection risk
- leave an in-repo audit trail of findings and follow-up work

### Tasks

- Add backend config helpers that support both current and documented env variable names.
- Centralize backend role checks for editor and publish actions.
- Expand shared frontend role parsing so the apps can recognize `Author`, `Publisher`, and `Admin` in addition to the legacy `ContentEditor` role.
- Add a shared HTML sanitization utility and use it where authored HTML is rendered.
- Update top-level docs to reflect the current runtime contract.

## Phase 2 - Shared rendering model

Status: In progress

### Goals

- stop block behavior from drifting between apps

### Tasks

- Choose one shared rendering contract for learner, editor preview, and public site.
- Move the public site off its switch-based block renderer onto the shared registry pattern.
- Move public rendering off its bespoke switch-based renderer or derive it from the same shared definitions.
- Remove or clearly mark incomplete block support paths.

## Phase 3 - Data-model convergence

Status: Planned

### Goals

- reduce complexity from supporting both the legacy flat course model and the path/module/unit model

### Tasks

- Define the canonical read/write model for catalogue and learner delivery.
- Add explicit migration notes for the endpoints that still depend on the old course tables.
- Remove duplicated storage and schema paths once dependent UIs are migrated.

## Phase 4 - Delivery model clarification

Status: Planned

### Goals

- align implementation with the documented static-first architecture

### Tasks

- Decide whether public and KB content should be:
  - generated statically at build/publish time, or
  - intentionally served via runtime APIs
- Update routing, hosting, and cache strategy to match that decision.
- Document the tradeoffs and the intended operating model.

## Phase 5 - Verification and reliability

Status: Planned

### Goals

- improve confidence in cross-app changes

### Tasks

- Add schema contract tests.
- Add backend auth/endpoint tests for protected routes.
- Add one publish-to-render integration path.
- Add CI checks for docs/runtime env consistency where practical.
