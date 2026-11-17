# Interactive Client Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Make the deployed demo start empty and let users create and manage their own resources across all product areas.

**Architecture:** Keep the real API path untouched. Add a versioned client workspace seed and explicit Figma fixture mode. Persist each domain through existing demo stores, with shared VM slot configuration for real SSH targets when supplied.

**Tech Stack:** React, TypeScript, Vite, browser storage, Vercel.

**Spec:** `docs/superpowers/specs/2026-11-17-interactive-client-workspace-design.md`

## Global Constraints

- Target `develop` first, then merge `develop` into `main`.
- Do not expose fabricated SSH commands or credentials.
- Stop when the user's five-hour token usage exceeds 70%.

## Review Focus

- First visit in a fresh browser has no seeded resources.
- Existing browser state migrates or resets predictably.
- Cross-page creation, quota, search, and admin lists reflect the same resource state.
- A deleted VM slot is released only after its resource is removed.
- The precreated VM pool is separate from existing account quotas; pool exhaustion receives a clear message.

---

### Task 1: Workspace and fixture separation

- [ ] Define empty versioned state for student and admin domains and explicit fixture opt-in.
- [ ] Verify first visit and reset show zero resources without breaking real API mode.
- [ ] Commit the independent state foundation.

### Task 2: User-created resources

- [ ] Wire VM, Serverless, Database, Apps, team, notifications and admin workflows to user-created records.
- [ ] Remove Figma-only fixed dates, names and metrics from the default interactive path.
- [ ] Verify create → list → detail → edit → delete for each domain.

### Task 3: SSH assignment

- [ ] Accept the V1 SSH host/port/user tuples through non-secret configuration.
- [ ] Keep existing account quotas; assign a free pool slot in order, show its exact command, and release slots on deletion.
- [ ] Test the commands against the actual V1 VMs once provided.

### Task 4: Deployed journey QA

- [ ] Compare all 62 product screens and relevant dialogs with Figma in browser.
- [ ] Run student and admin journeys, desktop and narrow layout, including refresh and error recovery.
- [ ] Fix observed failures, build and typecheck, then PR to `develop`.
- [ ] After `develop` verification, merge `develop` into `main` and retest the production URL.
