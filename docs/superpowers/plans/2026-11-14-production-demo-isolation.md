# Production Demo Isolation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Keep local demo flows in development and remove their routes, fixture records, and mock repositories from production bundles.

**Architecture:** Use Vite's compile-time `import.meta.env.DEV` boundary in production-reachable pages and widgets. Load demo repositories only from development-only branches; retain existing API calls unchanged for production.

**Tech Stack:** React 19, TypeScript 7, Vite 8, React Router 8, styled-components 6.

**Spec:** `docs/superpowers/specs/2026-11-14-production-demo-isolation-design.md`

## Global Constraints

- Frontend only; no backend or API contract changes.
- Do not edit Figma, alter visual design, or add dependencies.
- Preserve local demo interactions in development.
- Do not add or run a test suite; run typecheck, production build, and asset scans.

## Review Focus

- Production pages continue to call existing APIs when `import.meta.env.DEV` is false.
- Shared shells do not expose seeded team or profile data in production.
- Dev-only chunks are not emitted or referenced by production entry chunks.
- Demo local-storage writes and mock API responses remain development-only.
- Development routes and demo flows still build and work with seeded state.

---

### Task 1: Remove static demo stores from shared and live routes

**Files:**

- Modify `src/widgets/student-shell/ui/StudentShell.tsx` and `StudentProfile.tsx`.
- Modify `src/widgets/serverless-shell/ui/ServerlessShell.tsx`.
- Modify `src/pages/network/VMNetworkPage.tsx` and `src/entities/network/api/networkApi.ts`.
- Modify `src/pages/home/PersonalResourcesPage.tsx`.

- [x] Make demo-mode values used by production-reachable UI compile-time guarded with `import.meta.env.DEV`.
- [x] Replace static imports of demo profile, team, VM, and network stores with development-only dynamic imports; keep production navigation and API behavior unchanged.
- [x] Run typecheck and production build; confirm the shell, home, and VM/network fixture markers no longer appear in generated production chunks.

### Task 2: Isolate demo repositories in Apps and Database product routes

**Files:**

- Modify `src/pages/apps/AppCreateSourcePage.tsx`, `AppCreateServicePage.tsx`, `AppsListPage.tsx`, and `TeamAppsListPage.tsx`.
- Modify `src/features/app/create-app/model/useAppSourceDraft.ts` and `src/features/app/create-app/service/model/useAppServiceDraft.ts`.
- Modify `src/features/apps/createDemoAppDraft.ts` and any production-reachable caller of `src/features/apps/demoServiceOperations.ts` found in the bundle trace.
- Modify `src/pages/database/DatabaseDetailPage.tsx`, `DatabaseSettingsPage.tsx`, `DatabaseListPage.tsx`, and `DatabaseCreatePage.tsx`.

- [x] Move demo repository imports behind compile-time development boundaries while retaining current production API calls.
- [x] Verify the Apps seed chunk and demo Database fixtures are absent from production output.
- [x] Run typecheck and production build; verify the local demo create and details routes remain registered in development.

### Task 3: Enforce the production asset boundary

**Files:**

- Modify remaining production-reachable modules found by the source-to-chunk audit, including `src/pages/admin/AdminInfrastructurePage.tsx` and any shared feature that still pulls in demo records.
- Do not modify `src/pages/demo/**`, demo-only route page visuals, or unrelated screens.

- [x] Scan every generated JavaScript asset for unambiguous fixture canaries: `vm-portfolio-api`, `gsvm-demo-initial-password`, `gsvm-demo-team-password`, `demo-team-portal`, `demo-student`, `welcome_db`, `demo-local-pass-welcome`, `Gsmv-demo-2026`, and `demo-vm-1`. The generic string `portfolio-api` is also used as Figma placeholder copy in the VM network page, so it is not a fixture-only canary.
- [x] Confirm the development router and demo route chunks are not referenced or emitted in production.
- [x] Run `npm run typecheck`, `npm run build`, and `git diff --check`.
- [ ] Review the complete diff, commit, push, create a PR using the repository format, assess the automatic reviewer findings, and merge after checks and review are clean.
