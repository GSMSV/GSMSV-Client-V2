# Production Mock Flows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose the full Figma-defined frontend in a production build through `?demo=1`, using local mock data for screens and actions that have no backend API.

**Architecture:** Keep live API behavior as the default. Treat `?demo=1` as an explicit, browser-persisted mock-mode switch; bundle the existing FSD demo modules lazily in production, and route mock actions through the current local demo stores. Build a screen/state/flow coverage matrix from the four Figma pages, then close route and interaction gaps by independent product domain.

**Tech Stack:** Vite, React 19, TypeScript, React Router 8, styled-components, existing FSD entities/features/pages/shared modules.

**Spec:** `docs/superpowers/specs/2026-11-15-production-mock-flows-design.md`

## Global Constraints

- Frontend-only; do not change backend/API contracts or call real mutation APIs while `?demo=1` is active.
- Do not edit Figma; use all four Figma pages read-only.
- Preserve the design system and all Figma layouts/copy; do not add a preview landing page.
- Normal production mode without `?demo=1` keeps existing API behavior.
- Follow FSD boundaries and current styled-components/theme/UI patterns.
- Keep each PR focused and use titles like `fix(frontend): 한국어 설명` or `feat(frontend): 한국어 설명`.
- No tests unless explicitly requested; run typecheck, production build, and diff checks for implementation PRs.
- Before merging each PR, inspect every current Sandrone comment, judge it against the code and Figma, fix valid findings, and merge only after the latest actionable feedback is addressed.

## Review Focus

- **Query-flag loss during navigation:** capture mock mode before route changes, then confirm a deep link/reload continues to use the same local demo profile.
- **Live API contamination:** verify mock mutations use only demo stores and real mode still calls existing API paths.
- **Role and route guard mismatch:** verify student/admin roles can visit their intended Figma screens and cannot cross into the other role's screens.
- **Flow dead ends:** map all 436 flow nodes to a screen, dialog, state transition, or explicitly unreachable state; verify each visible primary action is wired.
- **Responsive document overflow:** check dense tables, long labels, dialogs, and fixed shells at narrow widths; retain intentional horizontal scrolling only for data surfaces.

---

### Task 1: Production mock-mode foundation

**Files:**
- Modify: `src/shared/demo/model/demoMode.ts`
- Modify: `src/app/router.tsx`
- Modify: `src/pages/demo/DemoSessionGate.tsx`
- Modify: `src/pages/auth/LoginPage.tsx`
- Modify: `src/pages/auth/RoleSelectionDemoPage.tsx`

**Interfaces:**
- Preserve `isDemoMode(): boolean`, `startDemoSession(role): boolean`, and current read/write/reset helpers.
- When `demo=1` is present, mock mode must persist in browser storage and survive in-app navigation; without it, mock-only routes must not affect normal API behavior.

- [ ] Remove development-build-only guards from mock-mode activation/session helpers while retaining the explicit `demo=1` requirement.
- [ ] Register existing mock route modules in the production router as lazy routes; keep normal routes and the `/admin` redirect unchanged.
- [ ] Make the demo session gate a no-op outside mock mode and preserve current role/signed-out checks inside mock mode.
- [ ] Make login enter demo role selection/profile only when `isDemoMode()` is true, with direct `?demo=1` login working in production.
- [ ] Verify normal and mock production builds with typecheck/build; manually inspect the generated route chunks for included mock route modules and no accidental preview landing page.
- [ ] Commit and open a focused PR.

### Task 2: VM and CLI production mock flows

**Files:**
- Modify as needed: `src/pages/vm/demoRoutes.tsx`, `src/pages/vm/*`, `src/pages/auth/CliLoginEntryDemoPage.tsx`, `src/pages/auth/CliLoginApprovalDemoPage.tsx`, `src/features/auth/*`, `src/entities/demo-workflows/*`.
- Modify: `src/pages/home/PersonalResourcesPage.tsx`, `src/pages/teams/TeamsHomePage.tsx` for mock VM entry actions.
- Do not modify `src/app/router.tsx` or `src/shared/demo/model/demoMode.ts` owned by Task 1.

**Interfaces:**
- Consume the production mock-mode contract from Task 1 and existing VM/CLI demo stores.
- Keep UI structure aligned with Figma nodes `203:28672`–`203:50358`, `203:65010`–`203:65612`, and `203:71758`–`203:72397` plus related flow states.

- [ ] Read Figma context/screenshots for each assigned base screen and relevant state/dialog frame; map route destinations and action outcomes.
- [ ] Ensure home resources, first-visit, team home, every Figma VM create/detail/monitoring/network/snapshot/settings action, and CLI approval flows are reachable and change only local mock state.
- [ ] Ensure CLI entry, code errors, login return, approve/reject, expired and consumed states are reachable and reload-safe.
- [ ] Preserve viewport-responsive layouts and intended scroll surfaces.
- [ ] Verify typecheck/build/diff checks; commit and open a focused PR.

### Task 3: Database, support, and administrator mock flows

**Files:**
- Modify as needed: `src/pages/demo-workflows/routes.tsx`, `src/pages/database/DatabaseQueryDemoPage.tsx`, `src/pages/database/DedicatedDatabaseRequestPage.tsx`, `src/pages/support/InquiryDemoPage.tsx`, `src/pages/admin/*DemoPage.tsx`.

**Interfaces:**
- Consume `isDemoMode()` and current database/support/admin local demo stores.
- Keep Figma nodes `693:45532`–`693:53245`, `101:5034`, `54:3082`, `54:3328`, and related flow/state nodes as visual/behavior targets.

- [ ] Read Figma screenshots/context for the assigned Database, support, and admin screens and their states.
- [ ] Expose database query, dedicated request/approval, inquiry submit/reply, account audit, VM detail, and team approval screens in production mock mode through the shared lazy route registration in Task 1.
- [ ] Wire each primary action to local mock state with clear result/error/confirmation states; preserve existing real API routes outside mock mode.
- [ ] Verify typecheck/build/diff checks and narrow layouts; commit and open a focused PR.

### Task 4: Apps mock flows

**Files:**
- Modify as needed: `src/pages/apps/demoRoutes.tsx`, `src/pages/apps/*DemoPage.tsx`, `src/pages/apps/AppCreateSourcePage.tsx`, `src/pages/apps/AppCreateServicePage.tsx`, `src/entities/apps/demo/*`.
- Do not modify the router or shared mock-mode foundation.

**Interfaces:**
- Consume the production mock-mode contract from Task 1 and current app/service stores.
- Keep Figma nodes `613:8038`, `642:8652`, `644:8504`, `646:8651`, `649:8843`, `656:9381`, `657:9446`, `650:9012`, `651:9162`, `658:9576`, `658:9846`, `659:9836`, and `659:10314` as targets.

- [ ] Read Figma design contexts/screenshots for all assigned Apps screens, states, and actions.
- [ ] Make source selection, service configuration, service creation, deploy/logs/metrics/variables/settings/domain/shell, stopped state, and deletion reachable in production mock mode.
- [ ] Persist form and lifecycle changes in local mock stores only; connect list/overview/detail navigation.
- [ ] Verify typecheck/build/diff checks and narrow layouts; commit and open a focused PR.

### Task 5: Serverless, account, shared navigation, Docs, and public-flow integration audit

**Files:**
- Modify only gaps found after Tasks 1–4; likely `src/pages/serverless/routes.tsx`, `src/pages/settings/*`, `src/pages/docs/*`, `src/pages/status/*`, `src/widgets/student-shell/*`, and shared entry points not owned by Tasks 2–4.

**Interfaces:**
- Consume the same mock-mode contract and existing mock stores; do not rework already merged flows without a Figma-backed gap.

- [ ] Map remaining Product, States & dialogs, and Flows nodes to current code routes and actions, including support links in `StudentShell.tsx` and Docs CTAs in `AuthenticatedDocsPage.tsx` / `PublicDocsPage.tsx`.
- [ ] Remove production-mode DEV guards from account settings only when mock mode is active; preserve live behavior when mock mode is off.
- [ ] Fix only confirmed missing routes/transitions or visual mismatches; keep current Figma copy/geometry.
- [ ] Verify typecheck/build/diff checks and production mock-only bundle behavior; commit any focused PR.

### Task 6: Integration and coverage closure

**Files:**
- Modify only for integration fixes; update this plan/spec with completed coverage evidence.

- [ ] Open the deployed production build at `?demo=1` and walk entry, role selection, navigation, create/edit/delete/confirm/error flows across all product domains.
- [ ] Check direct deep links and refreshes, storage-denied behavior, state reset/exit, role authorization, and normal-mode isolation.
- [ ] Compare each of the 62 Product frames, 28 States & dialogs frames, and 436 Flows nodes against a route/dialog/state-coverage ledger; resolve each uncovered node or record why it is not a user-facing route.
- [ ] Check reference viewport sizing and narrow-width scrolling for each unique layout family.
- [ ] Confirm all PR reviews/findings are resolved or judged false-positive with evidence; merge and remove merged feature branches.
- [ ] Report any Figma-to-code mismatch or unfinished coverage explicitly; do not call it complete until the ledger and production mock flow pass.
