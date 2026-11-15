# Production Mock Flows Design

## Intent

Make every existing Figma product screen and interaction flow reachable in the deployed frontend before backend APIs exist. The site must remain a frontend-only implementation and reuse the current Figma-matched screens, components, local demo data, and interaction patterns.

## Goals

- Enable the existing mock experience in a production build through `?demo=1`.
- Make the existing VM, Serverless, Database, Apps, support, CLI, account, team, and administrator mock flows reachable from their intended navigation and actions.
- Keep mock state isolated in browser storage and clearly separate from real API state.
- Preserve Figma appearance, content hierarchy, dimensions, interaction behavior, and responsive layouts. Do not edit the Figma file or introduce new visual design.
- Preserve the existing real-API behavior when mock mode is not enabled.
- Keep direct links and reloads working after the query flag is captured.

## Non-goals

- Backend/API implementation or contract changes.
- Claiming mock actions actually provision infrastructure, deploy code, execute SQL, send inquiries, or persist server-side.
- Adding a new preview landing page or changing the default route.
- Changing Figma designs or the established design system.

## Constraints

- Stack: Vite, React 19, TypeScript, React Router 8, styled-components.
- Follow the current FSD structure and existing theme/components.
- Keep the existing `?demo=1` interaction and per-slice localStorage model; do not use production API cache/state for mock data.
- All existing Figma product screens and relevant States & dialogs / Flows nodes remain the source of truth.
- Test commands are not part of this work unless separately requested; typecheck/build/diff checks are allowed for verification.
- Changes are frontend-only and should be split into focused PRs using `fix(frontend): 한국어 설명` or `feat(frontend): 한국어 설명`.

## Approaches

1. **Production-accessible mock mode (selected):** Keep normal routes on real API behavior; allow `?demo=1` to enable the existing local mock state and register the existing mock route modules in production builds. This gives reviewers a complete working frontend without changing the default site flow or inventing a second visual mode.
2. **Mock every production route by default:** This would make real API screens show fake data to all visitors and hide integration gaps. It does not preserve the current real-API behavior, so it is not selected.
3. **Add a new preview application/landing page:** This adds an extra entry screen and a second navigation surface despite the user asking to remove the initial preview screen. It is not selected.

## Architecture

- Extend the existing demo-mode boundary so the explicit `demo=1` flag works in production and persists through existing localStorage state.
- Register current mock route modules in the production router as lazy-loaded routes. The routes must remain inert outside mock mode and must not mutate API-backed state.
- Make the mock login/role selection and session gate work in production only when mock mode is enabled.
- Audit every Figma action in mock mode: it must navigate to the intended screen, open the intended dialog, update local demo state, or show a truthful unavailable state when even the frontend flow is not specified.
- Use existing page implementations and design-system primitives; change visuals only to correct measurable mismatches with Figma.
- Split implementation by independent route domains: shared mock-mode/router foundation; VM/auth/CLI; Database/support/admin; Apps; and a final integration audit for Serverless/team/account/public flows.

## Figma inventory

The file has four pages: Foundations (17 top-level children), Product screens (62 frames), States & dialogs (28 frames), and Flows (436 frames). These counts are separate inventories: the 62 product frames are the base screens; the 28 state/dialog frames and 436 flow frames specify states and interactions to implement on those screens, not 464 extra routes. All 62 product frames, all 28 state/dialog frames, and all 436 flow nodes are in scope for mapping to a screen, route, dialog, or state transition. Foundations are the existing design-system source of truth and are not edited.

Product screen inventory:

- Auth and home: 01 DataGSM login, 02 role selection, 03 home resources, 04 first visit.
- VM and Serverless: 05–12 personal VM create/detail/monitoring/network/snapshot/settings; 13–19 Serverless list/create/code/triggers/environment/test/logs; 34–38 team VM and team VM creation; 50 function versions.
- Docs, support, account, status, CLI: 20 Docs and FAQ, 21 inquiry, 23 account settings, 39 public Docs, 40 public status, 41 CLI approval.
- Teams: 24 team create, 25 pending approval, 32 team home, 33 team settings, 35 invitation acceptance.
- Admin: 26 infrastructure overview, 27 team approvals, 28 all VMs, 29 inquiry replies, 30 account audit, 31 VM detail, 49 dedicated Database approvals.
- Database: 42 list, 43 issue, 44 detail/connection, 45 query console, 46 backups, 47 settings, 48 dedicated Database request.
- Apps: 51 list, 52 create/source, 53 create/service, 54 app overview, 55 deploy, 56 logs, 57 metrics, 58 variables, 59 service settings, 60 domain, 62 app settings, 63 shell, 64 public stopped app.

## Mock behavior

- The URL query flag enables mock mode and is captured once so in-app navigation does not drop it.
- Demo state is local to the browser and reset/exit behavior remains available through existing demo controls.
- Mock-only operations must never call real mutation APIs.
- Production real mode remains unchanged when the mock flag is absent.

## Acceptance criteria

- A production build opened with `?demo=1` can enter a demo role and navigate through the complete 62-frame Product screen inventory above, plus all 28 States & dialogs frames and all 436 Flows nodes through their relevant routes, dialogs, and state transitions.
- Each mock route can be opened directly and survives refresh while mock mode is active.
- All visible primary actions have a functioning destination or state transition; none silently dead-end.
- The same mock data is isolated from real API-backed data and does not present frontend-only outcomes as server-side success.
- Layouts preserve Figma composition at reference dimensions and reflow at narrow viewports without horizontal page overflow, except intentional scrollable data surfaces.
- Production build and typecheck pass; PRs use the repository's title format, are reviewed, and merged only after findings are addressed.
