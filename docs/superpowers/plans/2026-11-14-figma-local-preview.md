# Figma Local Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Complete the remaining Figma product screens as a navigable local frontend preview with demo-only mock data.

**Architecture:** Add an explicit demo-mode runtime and versioned browser-backed domain repositories. Pages and features consume those repositories only while demo mode is active; production continues through the existing API contracts. Each page reuses the current FSD slices, styled-components, and shared theme.

**Tech Stack:** React 19, TypeScript 7, React Router 8, styled-components 6, existing GSMSV theme tokens.

**Spec:** `docs/superpowers/specs/2026-11-14-figma-local-preview-design.md`

## Global Constraints

- Frontend only; do not change backend services or API contracts.
- Do not edit the Figma file.
- Keep Figma layout, spacing, copy, and component states unchanged.
- Only explicit local demo mode may read/write mock records.
- No mock fallback when demo mode is off.
- Use FSD and existing styled-components/theme patterns.
- Do not add or run tests unless requested; run typecheck, production build, and `git diff --check`.
- Use a separate branch/PR for each reviewable domain slice and inspect the Sandrone review before merge.
- Keep unrelated local files such as `AGENTS.md` and `docs/` untouched.

## Review Focus

- Demo mode survives in-app route changes but never leaks into production or live writes.
- Browser storage can be unavailable or contain invalid/old data; seed and reset safely.
- User/team scope and route parameters remain correct while demo records are mutated.
- Disabled controls in existing screens become local interactions only in demo mode.
- All design-screen buttons either reach the right screen or complete the expected local action.

---

### Task 1: Demo mode foundation

**Files:** create `src/shared/demo/*`; modify `src/app/App.tsx` and `src/app/router.tsx` only for the explicit preview entry. Avoid touching domain APIs in this task.

- [ ] Add a `?demo=1` entry that establishes a demo session and a synthetic student/admin identity for preview only.
- [ ] Add versioned storage helpers with validation, seeding, and reset. Keep ordinary API calls unchanged while demo mode is off.
- [ ] Provide a local-only demo landing/role entry outside product screens so the user can open student/admin flows quickly.
- [ ] Run `npm run typecheck`, `npm run build`, and `git diff --check`.
- [ ] Commit, push, create PR, inspect Sandrone feedback, and merge when clean.

### Task 2: Personal VM screens

**Figma:** 05 `52:372`, 06 `52:615`, 07 `52:810`, 08 `52:1034`, 09 `52:1416`, 11 `52:1994`, 12 `52:2260`.

**Files:** create `src/entities/vm/*`, `src/features/vm/*`, and `src/pages/vm/*`; add only these route entries to `src/app/router.tsx`.

- [ ] Define Figma-based personal VM fixtures and local create/detail/monitoring/snapshot/settings state transitions.
- [ ] Build the three-step creation flow, overview, monitoring, snapshots, and settings from the exact Figma frames.
- [ ] Make existing VM creation/detail links open those pages in demo mode; preserve API-aware production behavior.
- [ ] Run typecheck/build/diff-check; commit/push/PR; inspect bot review; merge when clean.

### Task 3: Team VM screens

**Figma:** 34 `102:4924`, 36 `116:4990`, 37 `116:5227`, 38 `116:5405`.

**Files:** create team-scoped VM routes/pages in `src/pages/teams/vms/*`; reuse the VM entity repository from Task 2 without modifying its files.

- [ ] Add team VM list/detail and team-scoped creation flow, preserving team role/status behavior.
- [ ] Keep team route identifiers and selected scope stable through create/cancel/complete transitions.
- [ ] Connect the team-home action that was disabled in PR #55 to the new local demo route only in demo mode.
- [ ] Run typecheck/build/diff-check; commit/push/PR; inspect bot review; merge when clean.

### Task 4: Apps service management

**Figma:** 52 `642:8652`, 53 `644:8504`, 54 `646:8651`, 55 `649:8843`, 56 `656:9381`, 57 `657:9446`, 58 `650:9012`, 59 `651:9162`, 60 `658:9576`, 62 `659:9836`, 63 `658:9846`, 64 `659:10314`.

**Files:** create demo service repository and pages under `src/entities/app` and `src/pages/apps/service/*`; restrict route/UI mock branches to demo mode.

- [ ] Restore the full local creation flow for source/service fields without sample submission to the real API.
- [ ] Add service deploy/logs/metrics/environment/settings/domain/shell flows and the public stopped-app state from Figma.
- [ ] Add local deployments, domains, variables, and preview settings with Figma example records; keep edits local.
- [ ] Populate app overview/settings from fixtures in demo mode while retaining current API-backed behavior elsewhere.
- [ ] Run typecheck/build/diff-check; commit/push/PR; inspect bot review; merge when clean.

### Task 5: Database console and dedicated Database approvals

**Figma:** 45 `607:7369`, 48 `608:7781`, 49 `608:8111`.

**Files:** add demo-only query console, request, and admin approval pages under `src/pages/database/*` and `src/pages/admin/*`; add routes after page modules are ready.

- [ ] Add sample schemas/rows and local SQL editor results that match the Figma examples.
- [ ] Add dedicated Database application form, pending state, admin review/detail, approve/reject transitions.
- [ ] Keep these demo records separate from real Database API data and preserve the existing list/detail flow.
- [ ] Run typecheck/build/diff-check; commit/push/PR; inspect bot review; merge when clean.

### Task 6: Support and administrator workflows

**Figma:** 21 `53:3544`, 27 `101:5034`, 29 `54:3082`, 30 `54:3328`, 31 `54:3543`, 41 `131:6232`.

**Files:** create page/feature slices under `src/pages/support/*` and `src/pages/admin/*`; do not overlap Task 5's Database approval files.

- [ ] Add inquiry create/list/detail/reply and team approval local workflows.
- [ ] Add admin account review and VM detail screens with local records and supported navigation/action states.
- [ ] Add the CLI login approval screen and complete its approve/deny/expiry states.
- [ ] Run typecheck/build/diff-check; commit/push/PR; inspect bot review; merge when clean.

### Task 7: Account profile details and first-visit path

**Figma:** 04 `52:174`, 23 `53:3934`.

**Files:** update `src/pages/home/PersonalResourcesPage.tsx`, `src/pages/settings/AccountSettingsPage.tsx`, and add user demo profile fixtures only after domain-specific PRs land.

- [ ] Show first-visit home state from the explicit demo user's state; keep returning users on the populated home.
- [ ] Add Figma sample student fields, photo controls, connected-account/device management as local state.
- [ ] Verify settings navigation and unsaved-change behavior across these new fields.
- [ ] Run typecheck/build/diff-check; commit/push/PR; inspect bot review; merge when clean.

### Task 8: Whole-preview route audit

- [ ] Compare the 62 Figma product frames against the route registry and click every primary action in demo mode.
- [ ] Verify non-demo mode still uses current APIs and no demo values appear in a production build.
- [ ] Run typecheck/build/diff-check and inspect all outstanding PR comments.
- [ ] Update the local preview to the final merged `origin/develop` and confirm its URL returns HTTP 200.
