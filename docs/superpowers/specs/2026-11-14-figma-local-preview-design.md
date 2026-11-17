# Figma Local Preview Design

## Intent

Finish the product screens in the existing Figma file as a local, frontend-only preview. Use mock records and local state wherever the backend contract is absent, so the screens and click paths can be reviewed before APIs exist.

## Goals

- Preserve the Figma layout, copy, component states, and navigation intent without editing the Figma file.
- Populate missing screen data from clearly defined demo fixtures based on the Figma examples.
- Make buttons, tabs, forms, filters, tables, and dialogs perform the corresponding local preview behavior.
- Keep mock responses and seeded records out of production builds and real API traffic.
- Keep the existing React, TypeScript, React Router, FSD, styled-components, and `shared/theme` design token conventions.
- Continue using isolated branches and small, reviewable PRs. Check Sandrone comments before merging each PR.

## Non-goals

- No backend, database, or API contract changes.
- No edits to Figma.
- No visual redesign or new styling language.
- No new package dependency unless an existing project limitation makes it necessary.

## Existing context

The product page in Figma has 62 top-level screens. Existing routes cover the core auth, home, teams, Database, Apps, Serverless, public Docs/status, network, and admin infrastructure paths. The remaining missing or incomplete local paths include personal and team VM flows; Database query and dedicated Database requests; inquiry and approval flows; admin VM/account review; Apps service deploy/log/metrics/environment/settings/domain/shell/public stopped state; and user profile details not present in the current API.

`requestJson` is the existing network boundary, but supported production API functions must continue to behave as they do. Demo mode must be explicit and local only. The mock implementation should live in `shared/demo` and domain repositories under `entities`/`features`, with page components consuming domain APIs rather than embedding sample arrays.

## Approaches considered

1. **Put sample arrays directly in every page.** Fast, but duplicates data and makes mutations/navigation inconsistent.
2. **Intercept every API request globally.** Central, but risks changing real API behavior and requires emulating unrelated endpoints.
3. **Use an explicit local demo mode with domain repositories.** Selected: one `?demo=1` entry point and versioned browser storage for local demo state; domain APIs select the demo repository only in demo mode. Production continues to use the existing API path.

## Chosen behavior

- `?demo=1` enables a local demo session and persists the mode for in-app navigation.
- Demo fixtures are seeded from the Figma examples. Any mutating action updates only the demo store; a refresh retains demo changes until the user resets the demo.
- New demo-only routes redirect or show the existing unavailable behavior outside local development/demo mode.
- A reset action may be available from the local preview entry point, outside the product page layout. Product screens themselves keep the Figma design.
- Existing API-backed behavior remains the default when demo mode is off.

## FSD boundaries

- `shared/demo`: demo-mode detection, safe browser storage, and reset/seed helpers.
- `entities/*/model` or `entities/*/api`: domain fixture repository and demo-aware reads/mutations for each resource.
- `features/*`: user actions and state transitions for creation, approval, query, deployment, and account flows.
- `pages/*`: screen composition and route parameters only.
- `app/router.tsx`: route registration and lazy loading after each page module is ready.
- `shared/ui`, `widgets/*`, and `shared/theme`: reuse existing Figma-aligned components and tokens; do not add page-local CSS frameworks.

## Acceptance

- Every remaining Figma product screen has a reachable route or an explicit Figma-linked state in the preview flow.
- Every visible primary action in the new screens routes to its designed next screen or performs a local state transition.
- Every demo mutation remains in versioned browser storage and never calls a live write endpoint.
- The ordinary non-demo path has no mock fallback.
- `npm run typecheck`, `npm run build`, and `git diff --check` pass for each implementation PR.
- Sandrone comments are read and judged before each merge.
