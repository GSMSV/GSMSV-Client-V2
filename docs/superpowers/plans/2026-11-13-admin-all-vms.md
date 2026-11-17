# 관리자 전체 VM 화면 Implementation Plan

> **For agentic workers:** Use this plan task-by-task in the existing isolated worktree.

**Goal:** Figma 화면 28의 관리자 전체 VM 목록과 선택 요약을 계약된 데이터만으로 연결한다.

**Architecture:** 기존 `AdminInfrastructurePage`의 셸과 VM/노드 조회 결과를 재사용하고 `/admin/vms` 라우트에서 화면 콘텐츠만 바꾼다. 검색·필터·페이지 상태는 클라이언트 전용이며, 지원하지 않는 만료 정보와 VM 조작은 실행 가능한 것처럼 보이지 않게 한다.

**Tech Stack:** React, TypeScript, React Router, styled-components, existing shared controls.

**Spec:** `docs/superpowers/specs/2026-11-13-admin-all-vms-design.md`

## Global Constraints

- Frontend only; do not edit Figma, Server, Infra, API, DB, or deployment configuration.
- Follow Figma screen 28 (`54:2772`) and existing design tokens/components.
- Do not fabricate VM records, expiry dates, purposes, resource specs, or write-action success.
- Use the existing `listAdminResources`, `listInfraNodes`, and `listNodeVms` interfaces.

## Review Focus

- Missing date/purpose/resource data stays visibly unavailable; never infer it from status or name.
- Empty, loading, 401, 403, and retryable failure states remain distinct.
- Filtering resets pagination and keeps selected detail synchronized with visible rows.
- Unsupported admin actions remain disabled and cannot fire handlers.
- Unknown status strings remain readable and do not receive an incorrect semantic color.

### Task 1: Route and shell state

**Files:** Modify `src/app/router.tsx`, `src/pages/admin/AdminInfrastructurePage.tsx`.

- [ ] Add `/admin/vms` using the existing admin page shell.
- [ ] Switch the active sidebar item and page heading based on the route.
- [ ] Keep infrastructure route behavior unchanged.

### Task 2: VM list and detail content

**Files:** Create `src/pages/admin/AdminAllVmsContent.tsx`; modify `src/pages/admin/AdminInfrastructurePage.tsx`.

- [ ] Render the Figma search/filter header, VM table, pagination, selected-VM summary, and Node classification panel.
- [ ] Use only `AdminResource` and `NodeVm` fields; show missing Figma fields as unavailable.
- [ ] Implement search, node/status filters, page navigation, and row selection locally.
- [ ] Disable unsupported expiry filter and VM mutation controls with explanatory accessible text.

### Task 3: Review and verify

- [ ] Review exact Figma node, route behavior, API data limits, accessibility names, and empty/error states.
- [ ] Run `npm run typecheck`, `npm run build`, and `git diff --check`.
- [ ] Commit with `feat(frontend): 관리자 전체 VM 목록 연결`.
