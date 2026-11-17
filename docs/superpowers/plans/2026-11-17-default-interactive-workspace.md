# Default Interactive Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the production main URL directly usable as the client-local workspace.

**Architecture:** Default the browser workspace mode to interactive, preserving explicit fixture mode. Prepare a student session before protected workspace routes render, while respecting signed-out profiles and explicit login or role selection pages.

**Tech Stack:** React, React Router, TypeScript, Vitest, Vite.

**Spec:** `docs/superpowers/specs/2026-11-17-default-interactive-workspace.md`

## Global Constraints

- Preserve existing UI text, design, and personal VM quota behavior.
- Preserve `?demo=fixture` for design fixtures.
- Keep resource data in browser storage.

## Review Focus

- Fresh main URL: VM create route and workspace storage available.
- Existing workspace data: remains readable without query parameters.
- Signed-out profile: login flow remains visible.
- Explicit role selection: admin choice remains available.
- Fixture URL: fixture data stays separate from workspace data.

---

### Task 1: Default browser workspace mode

**Files:** `src/shared/demo/model/demoMode.ts`, `src/shared/demo/model/demoMode.test.ts`

- [x] Add a failing test for the main URL without a demo query.
- [x] Run the focused test and confirm the failure.
- [x] Default browser mode to interactive while retaining fixture mode.
- [x] Run the focused test and confirm it passes.

### Task 2: Prepare the first-visit session

**Files:** `src/shared/demo/model/ensureWorkspaceSession.ts`, its test, `src/app/router.tsx`

- [x] Add failing tests for fresh visit, signed-out profile, and role selection.
- [x] Run focused tests and confirm the failures.
- [x] Add a root route loader that prepares a student session when needed.
- [x] Run focused tests and confirm they pass.

### Task 3: Verify and integrate

- [x] Run all tests and build.
- [x] Verify fresh main URL in browser through the VM specification page. A full VM creation was verified on the existing production workspace in the preceding test.
- [ ] Merge through `develop` then `main`, and verify production deployment.
