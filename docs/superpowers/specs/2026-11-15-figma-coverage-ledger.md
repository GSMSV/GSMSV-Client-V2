# Figma Coverage Ledger

Date: 2026-11-15 · Figma file `d3n2l7KHBLxonJS5d7djL7` ("SV"), read-only via `get_metadata` (one low-res screenshot to confirm hover-frame structure) · Code: `origin/develop` @ `cc72e2e` (includes merged PR #142 Apps), plus open PR #143 (`codex/mock-vm-cli-flows`, VM/CLI) and PR #144 (`codex/mock-cross-cutting-flows`, account/docs/status/serverless/teams/shell).

Companion to `2026-11-15-production-mock-flows-design.md`. Judgements come from reading code (route tables, `navigate()`/`Link` targets, `onClick` handlers, dialog open state, demo store seeds). The app was not run.

## Scope and inventory

| Figma page | Node | Top-level nodes | Mapped here |
|---|---|---|---|
| 01 · Product screens | `38:68` | 62 frames (numbered 01–64; no 22 and no 61) | 62 rows |
| 02 · States & dialogs | `38:69` | 28 frames, containing 197 distinct panels (one panel = one dialog or state, inside "Dialog row" groups) | 28 frames / 197 panels (`690:4292` appears under both Account and Admin) |
| 03 · Flows | `171:684` | 436 nodes = 434 frames + 2 orphan text nodes (`203:25150`, `203:25151`) | 436 rows |

A script cross-checked every node id above against this document. None are missing.

### How the Flows page is organized

There are no prototype connectors or arrows; the transition is implied by each frame's label and overlay content. Each product screen `NN` has one horizontal row:
- `NN · name`: the base screen (a copy of the Product frame). Its ledger row judges how the user gets there.
- `NN-MM · name · <title>`: a state reachable from that screen. The frame nests the base screen plus a `Scrim` and `Surface` (dialog), an inline banner or empty state, or an open dropdown (`… 펼침`).
- `NN-MM · … · 로딩` / `· 오류`: the page's loading skeleton and load-error state.
- `NN-MM · … · 호버 · <X>`: the screen with a `Flow / cursor` instance over control X, marking X as the screen's primary action. These rows judge where clicking X goes.

The States & dialogs page holds the same dialogs as component sheets. Most panels have a matching Flows frame.

## Status legend

- **OK**: implemented and reachable in mock mode (`?demo=1`) through the specified action.
- **PARTIAL**: implemented, but differs in form (inline instead of dialog, wrong copy or limit) or is only partly reachable.
- **WRONG-DESTINATION**: the control exists but goes somewhere else; the row says where.
- **DEAD-END**: the control renders but does nothing, or is disabled.
- **MISSING**: no code renders the state or control.
- **UNREACHABLE**: code exists, but nothing in mock mode triggers it (only a real-API failure, an unseeded data condition, or a direct URL).
- **PENDING-PR #143 / #144**: missing or wrong on develop, but clearly fixed by that open PR.
- `OK†` (Teams): OK on the DEV server only; a production `?demo=1` build needs PR #143/#144.

## Cross-cutting findings

1. **The DEV gate breaks production mock mode on develop.** 68 `import.meta.env.DEV` checks remain in `src/`. Home, shell, search, account settings, team pages, the Serverless list, status and network still fall back to real-API paths in a production `?demo=1` build. PR #143 and PR #144 remove most of these checks. Rows written while those PRs are open were judged in mock mode as the DEV server runs it, and are flagged.
2. **Loading and error frames.** 108 Flows frames are `로딩` or `오류` states (and 62 are `호버` frames). Mock mode has no demo delay and no failure toggle. So loading states only flash during lazy-chunk Suspense (or are missing), and most error states are UNREACHABLE (Database, Apps, Admin 26/28) or MISSING (VM, Snapshot/Settings, Inquiry, Teams 24, Admin 27/29/30/31, Apps service tabs).
3. **No catch-all route.** `src/app/router.tsx` has no `*` route and no `errorElement`, so the shared "찾을 수 없어요" state (S03) is MISSING.
4. **The admin workflow sidebar has wrong targets.** `src/pages/demo-workflows/ui/WorkflowLayout.tsx:383-385` sends 승인 to `/admin/database-approvals` (screen 49) instead of `/admin/team-approvals` (27), and 전체 VM to `/admin/vms/demo-vm-1` (31) instead of `/admin/vms` (28). This affects screens 27/29/30/31.
5. **Hidden triggers.** Several states can only be opened through URL parameters or secret inputs (`/login?error=…`, `/settings?github=…|discord=…`, `?status=` (PR #144), SQL comments `-- demo:timeout` / `-- demo:row-cap`). They are counted OK or PARTIAL as noted, but no visible UI control opens them.

## Totals

Counts cover Product frames, States panels and Flows nodes together. "Gap" means any non-OK status, including PENDING-PR.

| Domain | Product (OK/total) | States panels (OK/total) | Flows (OK/total) | OK | Gaps (of which PENDING-PR) |
|---|---|---|---|---|---|
| Auth/Home | 4/4 | 4/4 | 28/28 (+2 orphan text, N/A) | 36 | 0 |
| VM (A+B) | 10/12 | 19/49 | 39/97 | 68 | 90 (38) |
| Serverless | 8/8 | 12/26 | 28/57 | 48 | 43 (6) |
| Database (incl. 49) | 7/8 | 10/21 | 32/53 | 49 | 33 (0) |
| Apps | 13/13 | 27/27 | 63/75 | 103 | 12 (0) |
| Teams | 4/5 | 8/13 | 22/32 | 34 | 16 (OK† DEV only) |
| Admin | 6/6 | 7/9 | 27/40 | 40 | 15 (0) |
| Docs/Support/Status/CLI | 5/5 | 15/15 | 27/27 | 47 | 0 |
| Account/Settings | 1/1 | 23/23 | 23/25 | 47 | 2 |
| Shell/navigation | — | 11/11 | — (flows filed under Auth/Home 03-xx) | 11 | 0 |
| **Total** | **56/62** | **119/198** | **261/434** | **436** | **258** |

## Ledger

### Auth/Home

Mock mode is judged under the dev server (`import.meta.env.DEV`) with `?demo=1`. On develop, the home demo branch (`PersonalResourcesPage.tsx:501`), the shell demo flags (`StudentShell.tsx:100`, `StudentProfile.tsx:156,239`) and the demo account page (`AccountSettingsPage.tsx:14,312`) also need `import.meta.env.DEV`. That means a production build with `?demo=1` shows the non-demo pages. PR #143 removes the DEV check from home and PR #144 removes it from shell and settings.

#### Product screens
| # | Figma frame | Node | Size | Route(s) | Component | Status | Notes |
|---|---|---|---|---|---|---|---|
| 01 | DataGSM 로그인 | 407:36883 | 1440x1080 | `/login` | `src/pages/auth/LoginPage.tsx` | OK | Intro panel, benefits card, 서비스 상태 + DataGSM으로 계속하기 match |
| 02 | 역할 선택 | 407:36910 | 1440x1080 | `/__demo/role-selection` | `src/pages/auth/RoleSelectionDemoPage.tsx` | OK | Demo-only route; the real login never shows role selection |
| 03 | 홈 · 내 Resources | 48:16 | 1440x1658 | `/` | `src/pages/home/PersonalResourcesPage.tsx` | OK | Demo branch is DEV-only on develop (PR #143 removes the gate) |
| 04 | 홈 · 첫 방문 | 52:174 | 1440x1080 | `/` (firstVisit branch) | `src/pages/home/PersonalResourcesPage.tsx` | OK | firstVisit is derived from having no personal VMs or functions (#143) |

#### States & dialogs
| States frame (node) | Panel | Panel node | Component / state | Mock trigger | Status | Notes |
|---|---|---|---|---|---|---|
| 인증·생성 한도 · 예외 (52:2492) | 로그인을 완료하지 못했어요 | 52:2496 | `LoginErrorDialog` kind `failed` | `/login?error=OAUTH_EXCHANGE_FAILED` or `/login/callback` with no code | OK | Only reachable by URL; demo login never fails |
| 52:2492 | 재학생만 이용할 수 있어요 | 52:2517 | `LoginErrorDialog` `not-enrolled` | `/login?error=NOT_ENROLLED` | OK | URL trigger only |
| 52:2492 | 현재 사용할 수 없는 계정이에요 | 52:2531 | `LoginErrorDialog` `inactive` | `/login?error=ACCOUNT_INACTIVE` | OK | URL trigger only |
| 52:2492 | DataGSM이 응답하지 않아요 | 52:2546 | `LoginErrorDialog` `unavailable` (+서비스 상태 보기) | `/login?error=UPSTREAM_UNAVAILABLE` | OK | URL trigger only |

#### Flows
| Flow frame | Node | Transition specified | Code behavior | Status |
|---|---|---|---|---|
| 01 · DataGSM 로그인 | 203:25127 | entry: signed out / logout → 01 | `DemoSessionGate` redirects a signed-out profile to `/login?returnTo=`. Profile → 로그아웃 navigates to `/login` | OK |
| 01-01 · 로그인을 완료하지 못했어요 | 405:31198 | 01 + failed dialog | `?error=OAUTH_EXCHANGE_FAILED` → `LoginErrorDialog` failed (닫기/다시 시도) | OK |
| 01-02 · 재학생만 이용할 수 있어요 | 405:31240 | 01 + not-enrolled dialog | `?error=NOT_ENROLLED` | OK |
| 01-03 · 현재 사용할 수 없는 계정이에요 | 405:31282 | 01 + inactive dialog | `?error=ACCOUNT_INACTIVE` | OK |
| 01-04 · DataGSM이 응답하지 않아요 | 405:31324 | 01 + unavailable dialog | `?error=UPSTREAM_UNAVAILABLE` | OK |
| 01-05 · 인증 시간이 지났어요 | 405:31366 | 01 + expired dialog | `?error=GONE` / `OAUTH_STATE_INVALID` → kind `expired` | OK |
| 01-06 · 호버 · DataGSM으로 계속하기 | 405:31408 | click → 02 역할 선택 | In demo, `resumeDemoProfile()` then navigate to `/__demo/role-selection`, or to a whitelisted `returnTo` (`LoginPage.tsx:252`) | OK |
| 02 · 역할 선택 | 405:31450 | entry: 01 primary → 02 | As above | OK |
| 02-01 · 호버 · 관리자로 선택 | 407:31508 | select 관리자 → admin console | Card selects the role; 계속 calls `selectDemoRole('admin')` → `/admin/infra` | OK |
| 03 · 홈 · 내 Resources | 203:25815 | entry: 02 일반 사용자 → 03; sidebar 홈 | `selectDemoRole('user')` → `/`. Sidebar 홈 → `/` | OK |
| 03-01 · 범위 선택 펼침 | 204:23337 | scope trigger → dropdown | `StudentTopbar` listbox lists 내 Resources + demo teams (`PersonalResourcesPage.tsx:633`). A team option goes to `/teams/:id` | OK |
| 03-02 · VM 검색 | 203:26044 | 검색 → search panel | `loadResourceSearch` has a demo source for VM·DB·함수·앱 (#144). Title "검색" matches the S01 panel | OK |
| 03-03 · 검색 결과가 없어요 | 203:26301 | query with no match → empty state | Empty state shows in mock mode (#144) | OK |
| 03-04 · 알림 | 203:26563 | 알림 → panel with 2 unread | `NotificationPanel` uses demo seed (2 unread): "읽지 않은 알림이 2개 있습니다…" | OK |
| 03-05 · 알림 | 203:26858 | all read state | 모두 읽음 → "모든 알림을 읽었습니다." | OK |
| 03-06 · 김지민 | 203:27162 | profile → role/profile panel | `StudentProfile` panel shows role, teams, 로그아웃/팀 설정/관리자로 전환/계정 설정 | OK |
| 03-07 · VM을 만들지 못했어요 | 203:27452 | home shows failed-VM-create banner | `?demoError=vm-create` records a failed request (library-api · 2 vCPU · 4 GB · 20 GB) in the home demo store (`recordDemoVmCreateFailure`, also callable from VM create). Banner with 닫기 / 설정 수정 (draft saved → `/vms/new`) / 같은 설정으로 재시도 (re-queues if quota allows) in `src/pages/home/PersonalResourcesPage.tsx` | OK |
| 03-08 · 생성을 취소할까요? | 203:27705 | queued row → cancel confirm | Clicking the portfolio-worker 대기 중 row opens the `ModalSurface` confirm (`PersonalResourcesPage.tsx:787,890`) | OK |
| 03-09 · 생성이 이미 시작됐어요 | 203:27953 | cancel after start → info dialog | Time-based initializing phase (#143) makes the `started` phase reachable | OK |
| 03-10 · 연결이 끊겼어요 | 203:28197 | offline → dialog | `src/widgets/student-shell/ui/GlobalStateDialogs.tsx` opens on the browser `offline` event on every route (root layout), or `?demoError=offline` in mock mode. 다시 확인 reloads once online | OK |
| 03-11 · 졸업 전에 자료를 옮겨주세요 | 203:28437 | graduating student → notice dialog | Home dialog when the admin graduation date (`getDemoGraduationDate`, set in 관리자 · 계정) is within 30 days (D-30/D-7 rule), or `?demoError=graduation`. Shows date, personal VM/function counts, Docs 보기 → `/help`; dismissal stored per date (`src/pages/home/PersonalResourcesPage.tsx`) | OK |
| 03-12 · 로딩 | 739:52604 | home loading skeleton | Demo load awaits `simulateDemoRequest('home')`; full-page LoadingCard skeleton per Figma (`src/pages/home/PersonalResourcesPage.tsx`) | OK |
| 03-13 · 오류 | 745:61330 | home load error | `?demoError=home` → ErrorCard layout per Figma; 다시 시도 succeeds (`src/pages/home/PersonalResourcesPage.tsx`) | OK |
| 03-14 · 호버 · Serverless | 225:25343 | sidebar Serverless → Serverless list | `StudentShell.navigateToItem('serverless')` → `/serverless` | OK |
| 04 · 홈 · 첫 방문 | 203:25642 | entry: first login with no resources → 04 | firstVisit derived from empty personal VMs/functions (#143) | OK |
| 04-01 · 로딩 | 741:52834 | first-visit loading | First-visit title + 2 cards + Docs panel skeleton while `simulateDemoRequest('home')` waits (`src/pages/home/PersonalResourcesPage.tsx`) | OK |
| 04-02 · 오류 | 747:59268 | first-visit load error | `?demoError=home` with no personal resources → first-visit ErrorCard layout (`src/pages/home/PersonalResourcesPage.tsx`) | OK |
| 04-03 · 호버 · 첫 VM 만들기 | 226:25659 | 첫 VM 만들기 → VM 생성 | `navigate('/vms/new')` (`PersonalResourcesPage.tsx:760`) | OK |
| (orphan text) 아이디어를 서버로. | 203:25150 | Stray TEXT node on the Flows canvas, not a screen | N/A | N/A |
| (orphan text) GSM SV에서 나만의 개발 환경을 시작하세요. | 203:25151 | Stray TEXT node on the Flows canvas, not a screen | N/A | N/A |


#### Counts
Product: 4 total (OK 4); States panels: 4 (OK 4); Flows: 28 + 2 orphan text (OK 28 / N/A 2). Updated by `codex/figma-auth-shell-docs`.

### VM (part A: create, overview, monitoring, team VM)

Basis: re-verified on `codex/figma-vm` (develop 781dc44 + this PR) in a production `?demo=1` build. PR #143 removed the DEV guards (home VM list, team home, `useDemoVmExtension`, `networkApi`), so every former "PENDING-PR #143" row was re-checked against current code. Every VM page now awaits a demo request through `useVmPageLoad` (`src/pages/vm/VmPageLoad.tsx`, built on `simulateDemoRequest`), so the Figma `로딩` frames show for ~600 ms and the `오류` frames appear with `?demoError=<scope>` (first request fails, 다시 시도 succeeds). Scopes: `vm-create-page` (create steps), `vm` (overview), `vm-monitoring`, `vm-create` (create request failure, shared with the home banner from #147).

#### Product screens
| # | Figma frame | Node | Size | Route(s) | Component | Status | Notes |
|---|---|---|---|---|---|---|---|
| 05 | VM 생성 · 사양 | 52:372 | 1440x1187 | /vms/new | src/pages/vm/VmCreatePage.tsx (step=spec) | OK | Entry via sidebar "VM 생성" and the home "VM 만들기" button |
| 06 | VM 생성 · 이름·목적 | 52:615 | 1440x1111 | /vms/new/details | VmCreatePage (details) | OK | |
| 07 | VM 생성 · 확인 | 52:810 | 1440x1095 | /vms/new/review | VmCreatePage (review) | OK | |
| 08 | VM 개요 | 52:1034 | 1440x1447 | /vms/:vmId (portfolio-api) | src/pages/vm/VmOverviewPage.tsx | OK | |
| 09 | VM Monitoring | 52:1416 | 1440x1241 | /vms/:vmId/monitoring | src/pages/vm/VmMonitoringPage.tsx | OK | CPU-92% banner only while running |
| 34 | 팀 VM · 일반 팀원 | 102:4924 | 1440x1493 | /teams/demo-team/vms/connect-api | VmOverviewPage (role=member → read-only) | OK | |
| 36 | 팀 VM 생성 · 사양 | 116:4990 | 1440x1351 | /teams/:teamId/vms/new | VmCreatePage owner=team | OK | |
| 37 | 팀 VM 생성 · 이름·목적 | 116:5227 | 1440x1080 | /teams/:teamId/vms/new/details | VmCreatePage owner=team | OK | |
| 38 | 팀 VM 생성 · 확인 | 116:5405 | 1440x1269 | /teams/:teamId/vms/new/review | VmCreatePage owner=team | OK | |

#### States & dialogs
| States frame (node) | Panel | Panel node | Component / state | Mock trigger | Status | Notes |
|---|---|---|---|---|---|---|
| VM 생성 · 입력 확인 (52:2583) | 입력 내용을 확인해 주세요 | 52:2638 | VmCreatePage `validation` dialog with VM 이름 / 사용 목적 fields and per-field errors | /vms/new/details: clear 사용 목적 (or type "-bad") → "다음: 확인" | OK | |
| VM 생성 · 입력 확인 (52:2583) | 인증 시간이 지났어요 | 52:2689 | LoginErrorDialog kind=expired (src/pages/auth/LoginPage.tsx) | /login?error=OAUTH_STATE_INVALID | UNREACHABLE | Auth domain file; only the real OAuth state-expiry redirect produces it. Left to the Auth/Home owner |
| 전원·VM 삭제 (52:4019) | VM을 강제로 정지할까요? | 52:4023 | VmOverviewPage powerDialog='force-confirm' | /vms/portfolio-api → "강제 정지" | OK | |
| 전원·VM 삭제 (52:4019) | 종료 요청 후 응답을 기다리고 있어요 | 52:4049 | powerDialog='graceful-progress' (2.2 s) | "정상 종료" | OK | |
| 전원·VM 삭제 (52:4019) | 영구 삭제 typed confirm | 52:4084 | VmSettingsPage → DeleteConfirmDialog | /vms/:id/settings → "VM 삭제" | OK | |
| 전원·VM 삭제 (52:4019) | VM 삭제에 실패했어요 | 52:4119 | VmSettingsPage deleteError modal (Figma copy) | `?demoError=vm-delete` → "VM 삭제" (retry succeeds) | OK | |
| 접속 · 예외·정지 (52:4148) | SSH 기본 포트가 없어요 | 52:4202 | VmOverviewPage warning banner + "기본 포트 복원" | Delete the SSH port on Network, return to 개요 | OK | |
| 접속 · 예외·정지 (52:4148) | 지금은 정지 상태예요 | 52:4250 | VmMonitoringPage stopped banner with Figma bullets + "기록 다시 불러오기" / "VM 시작" | Stop portfolio-api → Monitoring | OK | |
| S02 (53:2988) | VM을 만들지 못했어요 | 53:3014 | VmCreatePage `createFailed` dialog (닫기 / 설정 수정 / 같은 설정으로 재시도) | `?demoError=vm-create` on /vms/new/review → "VM 생성 요청" | OK | Home banner variant is in #147 (PersonalResourcesPage) |
| S02 (53:2988) | 초기 설정을 진행하고 있어요 | 53:3045 | `isDemoVmInitializing` (15 s after request) → overview banner | Create a VM and wait ~15 s | OK | |
| S02 (53:2988) | 만료되어 정지됐어요 | 53:3114 | VmOverviewPage expired warning banner + "연장하고 보관" | /teams/demo-team/vms/connect-db (seed now expired 1 day ago, inside the 3-day grace) | OK | Seed in src/entities/vm/model/demoVmStore.ts (`expiredTeamVmTimes`, schema 5) |
| D01 (103:1686) | 생성을 취소하시겠습니까? | 103:1690 | VmOverviewPage cancelDialog='confirm' | /vms/portfolio-worker → "생성 취소" | OK | |
| D01 (103:1686) | 생성이 이미 시작됐습니다 | 103:1711 | cancelDialog='started' | Create a VM, wait 15 s, then "생성 취소" | OK | |
| D01 (103:1686) | 아직 이 목적으로 사용 중입니까? | 103:1759 | DemoVmExtensionDialog (features/vm-extension) | Personal VM: "14일 연장" × 4 | OK | |
| D01 (103:1686) | 비밀번호를 재설정하시겠습니까? | 103:1784 | VmSettingsPage password reset dialog (Figma copy; requires running VM) | Settings → "비밀번호 재설정" | OK | |
| D01 (103:1686) | 디스크 늘리기 | 103:1811 | VmSettingsPage resize dialog with SliderField | Settings → "디스크 늘리기" | OK | |
| 41 할당량·권한 (104:1772) | 개인 할당량을 모두 사용하고 있어요 | 104:1776 | VmCreatePage personal-quota dialog (내 Resources / 팀 만들기) | /vms/new with the seed (vCPU 4/4) | OK | |
| 41 할당량·권한 (104:1772) | 지금은 학생 전체 자원이 부족해요 | 104:1803 | VmCreatePage sharedQuotaBlocked dialog | Cancel portfolio-worker, then create a personal VM → "VM 생성 요청" | OK | Other students' simulated usage drops 20 s after the first shortage, so "잠시 후 다시 시도" is now true |
| 41 할당량·권한 (104:1772) | 팀 할당량이 부족해요 | 104:1824 | VmCreatePage team-quota review dialog with exact shortfall (사양 줄이기 / 할당량 늘리기 요청 → TeamQuotaRequestDialog) | Approve the team, create team VMs until the quota is used, then request another | OK | |
| 41 할당량·권한 (104:1772) | 팀장 또는 DevOps만 할 수 있어요 | 104:1883 | VmOverviewPage `permissionAction` dialog | Member view of connect-api → 재시작 (or any power button) | OK | |
| 44 팀 생성·연장 (116:6959) | 일반 팀원은 팀 VM을 만들 수 없어요 | 116:6963 | VmCreatePage `TeamMemberCreateBlocked` | Hand over team leadership → sidebar "VM 생성" in team scope | OK | |
| 44 팀 생성·연장 (116:6959) | 아직 연장 기간이 아니에요 | 116:6991 | VmOverviewPage inline "아직 연장 기간이 아닙니다" card | Member extends connect-api once (expiry moves to 11.13), card replaces the expiry banner | OK | |
| 44 팀 생성·연장 (116:6959) | 연장했어요 · VM은 정지 상태예요 | 116:7012 | VmOverviewPage `extendedStopped` dialog | Member extends connect-db (stopped, expired) → "연장하고 보관" | OK | |
| 38 조회·빈 상태 (103:1983) | 이미 삭제된 Instance입니다 | 103:2070 | VmUnavailablePage (deleted) | Delete a VM, then open its URL (team VMs also via /vms/<id>) | OK | `findDeletedDemoVm` in src/pages/vm/vmDemoHelpers.ts no longer requires a matching team route |

#### Flows
| Flow frame | Node | Transition specified | Code behavior | Status |
|---|---|---|---|---|
| 05 · VM 생성 · 사양 | 203:28672 | Entry: sidebar VM 생성 / home "VM 만들기" → /vms/new | Both work in prod `?demo=1` | OK |
| 05-01 · 개인 할당량을 모두 사용 | 203:28883 | Spec with exhausted quota → dialog | Personal-quota dialog | OK |
| 05-02 · 다시 로그인해 주세요 | 203:29353 | Expired session on spec → re-login dialog | Shown only when there is no session (any demo user — student or admin — counts as signed in) | OK |
| 05-03 · 로딩 | 741:53001 | Spec loading skeleton | `useVmPageLoad('vm-create-page')` placeholders | OK |
| 05-04 · 오류 | 747:59456 | Spec load error | `?demoError=vm-create-page` | OK |
| 05-05 · 호버 · Ubuntu Server | 226:25838 | Click OS "Ubuntu Server" → selected | OsSelector sets `draft.os` | OK |
| 06 · VM 생성 · 이름·목적 | 203:29566 | Entry: 05 "다음: 이름·목적" | navigate(/vms/new/details) | OK |
| 06-01 · 입력 내용을 확인해 주세요 | 203:29743 | Invalid input → validation dialog | Validation dialog with field errors | OK |
| 06-02 · 작성 중인 내용이 사라져요 | 203:29948 | Leave details with input → unsaved dialog | StudentShell UnsavedChangesDialog | OK |
| 06-03 · 로딩 | 741:53150 | Loading | placeholders | OK |
| 06-04 · 오류 | 747:59626 | Error | `?demoError=vm-create-page` | OK |
| 06-05 · 호버 · 다음: 확인 | 226:26041 | "다음: 확인" → 07 | validDraft → /vms/new/review | OK |
| 07 · VM 생성 · 확인 | 203:30139 | Entry: from 06 | OK | OK |
| 07-01 · 학생 전체 자원이 부족 | 203:30357 | "VM 생성 요청" → pool-shortage dialog | sharedQuotaBlocked dialog (Figma copy) | OK |
| 07-02 · 로딩 | 741:53311 | Loading | placeholders | OK |
| 07-03 · 오류 | 747:59801 | Error | `?demoError=vm-create-page` | OK |
| 07-04 · 호버 · VM 생성 요청 | 226:26217 | "VM 생성 요청" → home with queued work | Saves the queued VM, navigates to / | OK |
| 08 · VM 개요 | 203:30585 | Entry: home VM row / "VM 관리" → /vms/:id | Home demo rows link here | OK |
| 08-01 · 초기 설정을 진행 | 203:30937 | Initializing VM overview | initializing banner | OK |
| 08-02 · SSH 기본 포트가 없어요 | 203:31319 | SSH port deleted → warning + restore | Banner + "기본 포트 복원" | OK |
| 08-03 · 만료되어 정지됐어요 | 203:31691 | Expired VM → banner + extend | Expired banner; reachable on the expired connect-db seed | OK |
| 08-04 · 아직 이 목적으로 사용 중 | 203:32063 | 4th extension → purpose dialog | DemoVmExtensionDialog | OK |
| 08-05 · VM을 강제로 정지할까요? | 203:32431 | "강제 정지" → confirm | force-confirm dialog | OK |
| 08-06 · 종료 요청 후 응답을 기다리고 | 203:32808 | "정상 종료" → waiting dialog | graceful-progress | OK |
| 08-07 · 이전 작업이 진행 중 | 203:33194 | During restart → in-progress dialog | restart-progress | OK |
| 08-08 · 요청이 너무 많아요 | 203:33571 | Rapid power requests → rate-limit dialog | 3 requests per 30 s → countdown dialog | OK |
| 08-09 · 찾을 수 없어요 | 203:33928 | Unknown VM id → not-found page | VmUnavailablePage | OK |
| 08-10 · 이미 삭제된 Instance | 203:34283 | Deleted VM URL → deleted page | VmUnavailablePage(deleted), personal and team | OK |
| 08-11 · 로딩 | 741:53489 | Loading | `useVmPageLoad('vm')` placeholders | OK |
| 08-12 · 오류 | 747:59993 | Error | `?demoError=vm` | OK |
| 08-13 · 호버 · Monitoring | 226:26431 | Monitoring tab → 09 | DetailTabs → /vms/:id/monitoring | OK |
| 09 · VM Monitoring | 203:40659 | Entry: Monitoring tab | OK | OK |
| 09-01 · 지금은 정지 상태예요 | 203:40854 | Stopped VM monitoring banner | Stopped banner with actions | OK |
| 09-02 · 로딩 | 741:53733 | Loading | `useVmPageLoad('vm-monitoring')` | OK |
| 09-03 · 오류 | 747:60286 | Error | `?demoError=vm-monitoring` | OK |
| 09-04 · 호버 · 24시간 | 226:26765 | "24시간" → range switch | setRange('24시간') | OK |
| 34 · 팀 VM · 일반 팀원 | 203:63647 | Entry: team home VM row → /teams/demo-team/vms/connect-api | Team home demo rows link here | OK |
| 34-01 · 아직 연장 기간이 아니에요 | 203:63923 | Too early to extend → inline notice | Inline card after the first extension | OK |
| 34-02 · 연장했어요 · VM은 정지 상태 | 203:64219 | Member extends stopped VM → dialog | extendedStopped dialog | OK |
| 34-03 · 팀장 또는 DevOps만 | 203:64527 | Member clicks 재시작 → permission dialog | permissionAction dialog | OK |
| 34-04 · 로딩 | 741:58900 | Loading | placeholders (team layout) | OK |
| 34-05 · 오류 | 747:66160 | Error | `?demoError=vm` | OK |
| 34-06 · 호버 · Network | 241:31247 | Network tab → team VM Network | DetailTabs → /teams/demo-team/vms/team-vm-connect-api/network | OK |
| 36 · 팀 VM 생성 · 사양 | 203:65010 | Entry: team home "팀 VM 만들기" → /teams/:id/vms/new | Team home button (approved team, leader/DevOps) | OK |
| 36-01 · 로딩 | 741:59127 | Loading | placeholders | OK |
| 36-02 · 오류 | 747:66429 | Error | `?demoError=vm-create-page` | OK |
| 36-03 · 호버 · Ubuntu Server | 241:31620 | Select OS | OsSelector | OK |
| 37 · 팀 VM 생성 · 이름·목적 | 203:65221 | Entry: 36 "다음" | navigate(details) | OK |
| 37-01 · 로딩 | 741:59286 | Loading | placeholders | OK |
| 37-02 · 오류 | 747:66609 | Error | `?demoError=vm-create-page` | OK |
| 37-03 · 호버 · 이전: 사양 | 241:31837 | "이전: 사양" → 36 | back() → /teams/:id/vms/new | OK |
| 38 · 팀 VM 생성 · 확인 | 203:65396 | Entry: 37 "다음: 확인" | OK | OK |
| 38-01 · 팀 할당량이 부족해요 | 203:65612 | Request over team quota → review dialog | Team-quota review dialog with shortfall | OK |
| 38-02 · 로딩 | 741:59443 | Loading | placeholders | OK |
| 38-03 · 오류 | 747:66780 | Error | `?demoError=vm-create-page` | OK |
| 38-04 · 호버 · 팀 VM 생성 요청 | 241:32018 | "팀 VM 생성 요청" → team VM list with queued VM | Saves the request, navigates to /teams/:id/vms | OK |

#### Counts
Product: 9 total (OK 9). States panels: 24 total (OK 23 / UNREACHABLE 1 — 52:2689, Auth domain; 104:1851 is filed under Teams and is now also opened from the team-quota dialog). Flows: 56 total (OK 56).

### VM (part B: Network, Snapshot, Settings)

Basis: re-verified on `codex/figma-vm`. PR #143 removed the DEV guard from `networkApi` and `VMNetworkPage`, so Network works in a production `?demo=1` build. Scopes added here: `vm-network` (page load), `vm-firewall` (firewall enable/disable result), `vm-snapshots`, `vm-settings`, `vm-rename`, `vm-delete`.

#### Product screens
| # | Figma frame | Node | Size | Route(s) | Component | Status | Notes |
|---|---|---|---|---|---|---|---|
| 10 | 10 · VM Network | 52:1640 | 1440x1417 | `/vms/:vmGrn/network`, `/teams/:teamId/vms/:vmGrn/network` | `src/pages/network/VMNetworkPage.tsx` | OK | Heading shows the VM name and status; port count reads "3/30" |
| 11 | 11 · VM Snapshot | 52:1994 | 1440x1131 | `/vms/:vmId/snapshots`, `/teams/:teamId/vms/:vmId/snapshots` | `src/pages/vm/VmSnapshotsPage.tsx` | OK | |
| 12 | 12 · VM 설정 | 52:2260 | 1440x1627 | `/vms/:vmId/settings`, `/teams/:teamId/vms/:vmId/settings` | `src/pages/vm/VmSettingsPage.tsx` | OK | Includes the "SSH 초기 비밀번호" section |

#### States & dialogs
| States frame (node) | Panel | Panel node | Component / state | Mock trigger | Status | Notes |
|---|---|---|---|---|---|---|
| Network · 포트·방화벽·Domain (52:2757) | 외부 접속 포트 추가 | 52:2761 | VMNetworkPage `action==='port'` | /vms/vm-portfolio-api/network → "포트 추가" | OK | Figma copy, "· 현재 3/30개 사용 중", protocol segmented |
| 52:2757 | SSH 기본 포트를 삭제할까요? | 52:2812 | `confirmTarget` kind port/ssh | SSH row trash icon | OK | Figma title, port detail and bullets, "SSH 포트 삭제" |
| 52:2757 | 방화벽 규칙 추가 | 52:2836 | `action==='rule'` | Firewall section → "규칙 추가" | OK | Destination hint "목적지 10.20.0.104" |
| 52:2757 | 방화벽 규칙을 삭제할까요? | 52:2896 | `confirmTarget` kind rule | Rule row trash icon | OK | Rule summary, source → destination, firewall-state bullet, "규칙 삭제" |
| 52:2757 | HTTPS Domain 추가 | 52:2919 | `action==='domain'` | "Domain 추가" | OK | Figma copy and hints |
| 52:2757 | 동기화에 실패한 Domain을 삭제할까요? | 52:2960 | `confirmTarget` kind domain + failed | Add a Domain whose internal port has no TCP port (e.g. 3000) → wait 2 s → trash | OK | |
| Snapshot · 생성·복원·삭제 (52:3898) | 수동 Snapshot 만들기 | 52:3902 | VmSnapshotsPage dialog `create` | "Snapshot 만들기" | OK | |
| 52:3898 | 이 Snapshot으로 복원할까요? | 52:3935 | dialog `restore` | restore icon | OK | |
| 52:3898 | 자동 Snapshot을 삭제할까요? | 52:3964 | dialog `delete` (automatic) | "auto-20260929" trash | OK | |
| 52:3898 | 복원을 완료했어요 | 52:3988 | dialog `restore-complete` | Confirm restore | OK | |
| 42 · Network·Serverless 보완 (104:1927) | 방화벽을 켜고 규칙을 추가할까요? | 104:1931 | `action==='firewall-confirm'` (only while the firewall is off) with 동작, 포트 and "지금 열린 포트 자동 허용" switch | Turn the firewall off → "규칙 추가" → submit | OK | The switch adds allow rules for the open ports (demo only) |
| 104:1927 | 모든 수신 접속이 막혀 있습니다 | 104:1975 | Blocked banner | Delete all allow rules while the firewall is on | OK | |
| 104:1927 | 방화벽을 끄시겠습니까? | 104:1994 | `action==='firewall-disable-confirm'` | Firewall switch while on | OK | |
| 104:1927 | HTTPS 다시 연결 중 · 2/3 | 104:2016 | `domainDetails` (pending) | Add a Domain → info icon while 동기화 중 | OK | |
| 104:1927 | HTTPS 연결에 실패했습니다 | 104:2031 | `domainDetails` (failed) with "Domain 삭제" / "다시 연결" | Failed Domain → info icon | OK | |
| 45 · 이름 변경·방화벽 적용 상태 (128:2058) | 이름 변경 | 128:2062 | VmSettingsPage inline `nameEditing` | "변경" | OK | |
| 128:2058 | 이름 형식이 맞지 않습니다 | 128:2089 | `validateVmName` | Type "-bad name" | OK | |
| 128:2058 | 같은 이름의 VM이 있습니다 | 128:2118 | `validateVmName` duplicate | Type "portfolio-worker" | OK | |
| 128:2058 | 이름을 저장하는 중입니다 | 128:2146 | `nameSaving` | Save a valid name | OK | |
| 128:2058 | 이름을 바꿨습니다 | 128:2167 | `renamed` dialog (new name, SSH port, Domain) | Save succeeds | OK | |
| 128:2058 | 이름을 바꾸지 못했습니다 | 128:2186 | NameError "서버에 연결하지 못했습니다…" + "다시 시도" | `?demoError=vm-rename` → save | OK | |
| 128:2058 | 방화벽을 켜는 중입니다 | 128:2213 | Inline "방화벽을 켜는 중입니다" surface at the top of Network (rule add/delete disabled) | Firewall switch while off | OK | |
| 128:2058 | 방화벽을 켜지 못했습니다 | 128:2233 | `firewall-enable-error` / `firewall-error` | `?demoError=vm-firewall` → turn the firewall on | OK | |
| 128:2058 | 방화벽을 끄지 못했습니다 | 128:2252 | `firewall-disable-error` | `?demoError=vm-firewall` → turn the firewall off | OK | |
| 128:2058 | 방화벽이 꺼져 있습니다 | 128:2272 | Firewall-off empty-state surface (switch + "규칙 추가") | Delete all rules, then turn the firewall off | OK | |

#### Flows
| Flow frame | Node | Transition specified | Code behavior | Status |
|---|---|---|---|---|
| 10 · VM Network | 203:41077 | Entry: Network tab from 07/08/11/12 | `DetailTabs` → `/vms/vm-portfolio-api/network` | OK |
| 10-01 · 방화벽이 꺼져 있어요 | 203:41400 | Firewall off with no rules → empty state | Empty-state surface | OK |
| 10-02 · 방화벽 규칙 추가 | 203:41743 | "규칙 추가" → rule dialog | `openAction('rule')` | OK |
| 10-03 · 방화벽을 켜고 규칙을 추가할까요? | 203:42125 | Rule submit while firewall off → confirm with auto-allow switch | firewall-confirm with switch | OK |
| 10-04 · 방화벽을 켜는 중이에요 | 203:42490 | Confirm → inline "켜는 중" state | Inline surface | OK |
| 10-05 · 방화벽을 켜지 못했어요 | 203:42834 | Enable failure dialog | `?demoError=vm-firewall` | OK |
| 10-06 · 모든 수신 접속이 막혀 있어요 | 203:43175 | Firewall on with 0 allow rules → blocked banner | Banner | OK |
| 10-07 · 방화벽 규칙을 삭제할까요? | 203:43518 | Rule trash → delete confirm | Figma copy | OK |
| 10-08 · 방화벽을 끌까요? | 203:43863 | Switch on→off → confirm | `firewall-disable-confirm` | OK |
| 10-09 · 방화벽을 끄지 못했어요 | 203:44206 | Disable failure dialog | `?demoError=vm-firewall` | OK |
| 10-10 · 외부 접속 포트 추가 | 203:44547 | "포트 추가" → port dialog | `openAction('port')` | OK |
| 10-11 · SSH 기본 포트를 삭제할까요? | 203:44914 | SSH row trash → SSH confirm | SSH-specific dialog | OK |
| 10-12 · HTTPS Domain 추가 | 203:45260 | "Domain 추가" → domain dialog | `openAction('domain')` | OK |
| 10-13 · HTTPS 다시 연결 중 · 2/3 | 203:45619 | Pending domain → retry-progress dialog | `domainDetails` pending (opens automatically after adding) | OK |
| 10-14 · HTTPS 연결에 실패했어요 | 203:45958 | Failed domain → failure dialog | `domainDetails` failed | OK |
| 10-15 · 동기화에 실패한 Domain을 삭제할까요? | 203:46302 | Failed domain trash → failed-domain confirm | Failed-domain confirm | OK |
| 10-16 · VM Network · 로딩 | 741:53928 | Page loading skeleton | `simulateDemoRequest('vm-network')` keeps the section LoadingCards up ~600 ms | OK |
| 10-17 · VM Network · 오류 | 747:60509 | Page load error | `?demoError=vm-network` → three ErrorPanels | OK |
| 10-18 · 호버 · 포트 추가 | 226:26964 | Click "포트 추가" → 10-10 | Opens the port dialog | OK |
| 11 · VM Snapshot | 203:46647 | Entry: Snapshot tab | `DetailTabs` | OK |
| 11-01 · 수동 Snapshot 만들기 | 203:46881 | "Snapshot 만들기" → create dialog | `openCreateSnapshot` | OK |
| 11-02 · 이 Snapshot으로 복원할까요? | 203:47146 | Row restore → confirm | `openRestoreSnapshot` | OK |
| 11-03 · 복원을 완료했어요 | 203:47408 | Confirm restore → done dialog | `restore-complete` | OK |
| 11-04 · 자동 Snapshot을 삭제할까요? | 203:47672 | Auto snapshot trash → confirm | Automatic title and bullet | OK |
| 11-05 · VM Snapshot · 로딩 | 741:54198 | Page loading skeleton | `useVmPageLoad('vm-snapshots')` | OK |
| 11-06 · VM Snapshot · 오류 | 747:60800 | Page load error | `?demoError=vm-snapshots` | OK |
| 11-07 · 호버 · 복원 | 225:25571 | Click restore → 11-02 | Opens the restore confirm | OK |
| 12 · VM 설정 | 203:47928 | Entry: 설정 tab | `DetailTabs` | OK |
| 12-01 · 이름 변경 | 203:48150 | "변경" → inline edit | `startNameEdit` | OK |
| 12-02 · 이름 형식이 맞지 않아요 | 203:48393 | Invalid input → format error | Inline validation | OK |
| 12-03 · 같은 이름의 VM이 있어요 | 203:48636 | Duplicate name → error | Inline duplicate error | OK |
| 12-04 · 이름을 저장하는 중이에요 | 203:48879 | Enter/저장 → saving state | 350 ms, "저장 중" | OK |
| 12-05 · 이름을 바꿨어요 | 203:49118 | Save success → dialog | `renamed` dialog | OK |
| 12-06 · 이름을 바꾸지 못했어요 | 203:49360 | Save failure → inline error | `?demoError=vm-rename` | OK |
| 12-07 · 디스크 늘리기 | 203:49602 | "디스크 늘리기" → resize dialog | Seed portfolio-worker now counts 10 GB, so personal SSD is 20/30 and the button is enabled (vCPU/RAM stay full, so 05-01 still shows) | OK |
| 12-08 · 비밀번호를 재설정할까요? | 203:49858 | Reset password → confirm | Settings section + dialog | OK |
| 12-09 · portfolio-api를 영구 삭제할까요? | 203:50106 | "VM 삭제" → typed-name confirm | `DeleteConfirmDialog` | OK |
| 12-10 · VM 삭제에 실패했어요 | 203:50358 | Delete failure dialog | `?demoError=vm-delete` | OK |
| 12-11 · VM 설정 · 로딩 | 741:54409 | Page loading skeleton | `useVmPageLoad('vm-settings')` | OK |
| 12-12 · VM 설정 · 오류 | 747:61046 | Page load error | `?demoError=vm-settings` | OK |
| 12-13 · 호버 · VM 삭제 | 226:27293 | Click "VM 삭제" → 12-09 | Opens the delete dialog | OK |

#### Counts
Product: 3 total (OK 3). States panels: 25 total (OK 25). Flows: 41 total (OK 41).

### Serverless

Context notes (apply to all rows):
- `/serverless` is in main routes (router.tsx:124). `/serverless/new`, `/serverless/:functionId`, `/:functionId/triggers`, `/:functionId/:tab` come from `src/pages/serverless/routes.tsx`. Those are registered only when `DEV || isDemoMode()`, and each route redirects to `/serverless` when demo mode is off.
- ServerlessListPage loads demo data only when `import.meta.env.DEV && demoMode` (ServerlessListPage.tsx:265). In a production build with `?demo=1` the list calls the real `getMyQuota` and shows no function cards. ServerlessShell teams scope has the same DEV gate. PR #144 removes the `DEV` gate in both files → PENDING-PR #144 for non-DEV demo builds.
- The demo routes render lazy pages (CreatePage/FunctionPage/…) with no `<Suspense>` boundary (routes.tsx), so no skeleton shows during chunk load. Functions are read synchronously from demo state, and there is no loading or error branch on develop. PR #144 adds `ServerlessLoadState` (LoadingCard while `loadDemoServerlessState` runs on IndexedDB, ErrorCard+retry on failure) to the function, triggers and tab routes. The create route is not covered.
- Seed (entities/serverless/model/demoServerless.ts): personal welcome-api (active, HTTP POST + Cron 0 9 * * *, 3 versions, 248 runs) and health-check (inactive, Python). connect-api is a team function and is filtered out of the personal list. Count limit is **3** (design panel 53:4529 says 5). Daily executions are 1,284 / 10,000.

#### Product screens
| # | Figma frame | Node | Size | Route(s) | Component | Status | Notes |
|---|---|---|---|---|---|---|---|
| 13 | Serverless 목록 | 52:2983 | 1440x1080 | `/serverless` | `src/pages/serverless/ServerlessListPage.tsx` in ServerlessShell | OK | 3 usage cards + function cards + guide. Non-DEV demo build shows no cards (PENDING-PR #144) |
| 14 | 함수 만들기 | 52:3211 | 1440x1353 | `/serverless/new` | `ServerlessCreatePage.tsx` via `ServerlessCreateRoute` | OK | Form fields, runtime segmented control, starter code |
| 15 | 함수 코드 | 52:3378 | 1440x1625 | `/serverless/:functionId` | `ServerlessFunctionPage.tsx` via `ServerlessFunctionRoute` | OK | Tabs, expiry banner, status panel, editor, execution settings |
| 16 | 함수 Trigger | 52:3611 | 1440x1335 | `/serverless/:functionId/triggers` | `ServerlessTriggersPage.tsx` via `ServerlessTriggersRoute` | OK | Address, limits, trigger table, custom domain |
| 17 | 함수 환경변수 | 53:1670 | 1440x1479 | `/serverless/:functionId/environment` | `ServerlessEnvironmentPage.tsx` via `ServerlessTabRoute` | OK | Variables, new variable form, DB connection |
| 18 | 함수 테스트 | 53:1927 | 1440x1080 | `/serverless/:functionId/test` | `ServerlessTestPage.tsx` via `ServerlessTabRoute` | OK | Payload/response, summary cards, output log |
| 19 | 함수 실행 Log | 53:2174 | 1440x1101 | `/serverless/:functionId/logs` | `ServerlessLogsPage.tsx` via `ServerlessTabRoute` | OK | Run table (100/page), output pane, delete all |
| 50 | 함수 버전 | 593:6260 | 1440x1080 | `/serverless/:functionId/versions` | `ServerlessVersionsPage.tsx` via `ServerlessTabRoute` | OK | Version table + rollback |

#### States & dialogs
| States frame (node) | Panel | Panel node | Component / state | Mock trigger | Status | Notes |
|---|---|---|---|---|---|---|
| 35 · Serverless 작업 모달 (53:4251) | Cron Trigger 추가 | 53:4293 | `features/serverless/manage-triggers/ui/TriggerDialog.tsx` type=Cron | On `/serverless/welcome-api/triggers` click "Trigger 추가" (next type = Cron because HTTP exists) | OK | Default `*/5 * * * *`. Shows next run time, notes and timezone |
| 35 (53:4251) | welcome-api를 삭제할까요? | 698:3479 | `DeleteConfirmDialog` in ServerlessFunctionPage.tsx:507 | On `/serverless/welcome-api` click "함수 삭제" | OK | Name must be typed. Confirm deletes and navigates to `/serverless` |
| 35 (53:4251) | 실행 Log를 모두 삭제할까요? | 53:4359 | ServerlessLogsPage.tsx:462 ModalSurface | On `/serverless/welcome-api/logs` click "전체 삭제" | OK | Copy matches |
| 35 (53:4251) | 함수 실행 중 오류가 발생했어요 | 53:4382 | — | — | MISSING | `executeDemoServerlessTest` always succeeds. No failure result or dialog |
| 36 · 실행·프로필 입력 상태 (53:4422) | 실행 시간이 초과됐어요 | 53:4426 | — | — | MISSING | No timeout execution path or dialog (timeout exists only as a seeded log row) |
| 36 (53:4422) | 함수를 5개 모두 사용하고 있어요 | 53:4529 | — | — | MISSING | No quota guard on "새 함수" or on create. Limit in code is 3, not 5 |
| 36 (53:4422) | 함수 정보를 확인해주세요 | 53:4551 | ServerlessCreatePage inline `FormError` + TextField error | `/serverless/new` (default name `welcome-api` already collides) | PARTIAL | Duplicate-name error is inline only. No compile-error check and no dialog |
| 39 · 함수 실행·검증 상태 (60:1033) | 비활성 함수는 실행할 수 없어요 | 60:1037 | ServerlessTestPage.tsx:459 executionError='inactive' | On `/serverless/health-check/test` click "실행" | OK | Has a "함수 활성화" action |
| 39 (60:1033) | JSON 형식을 확인해주세요 | 60:1085 | ServerlessTestPage.tsx:484 jsonErrorOpen | On the test tab, type invalid JSON (e.g. trailing comma) → "실행" | OK | Line hint shows for trailing commas |
| 39 (60:1033) | Cron 표현식을 확인해주세요 | 60:1116 | TriggerDialog hasCronError (reason≠frequency) | In the Cron dialog, type `*/x * * * *` | OK | Add button disabled, "돌아가기" |
| 39 (60:1033) | 5분보다 짧은 간격은 쓸 수 없어요 | 698:3506 | TriggerDialog isTooFrequent | In the Cron dialog, type `*/2 * * * *` | OK | "2분마다 실행 · 5분 이상으로 입력해 주세요." |
| 39 (60:1033) | 실행 Log가 없어요 | 60:1155 | ServerlessLogsPage EmptyRow (`emptyMessage` default) | Delete all logs, or open a function with no runs | PARTIAL | Shows default "실행 기록을 불러올 수 없습니다." (reads as an error). routes.tsx passes no `emptyMessage`. No empty-state guidance copy |
| 42 · Network·Serverless 보완 (104:1927) | HTTP Trigger 추가 | 104:2053 | TriggerDialog type=HTTP | Only when the function has no HTTP trigger: delete welcome-api HTTP row (trash icon) or open a new function → "Trigger 추가" | OK | Not directly reachable on seeded welcome-api (button opens Cron) |
| 46 · 계정 연결·함수 호출 상태 (128:2316) | 호출 주소를 재발급할까요? | 698:3562 | ServerlessTriggersPage.tsx:573 confirm | Triggers tab → "호출 주소 재발급" | OK | Confirm regenerates the URL |
| 46 (128:2316) | 동시 실행 한도를 넘은 요청이 있어요 | 698:3599 | — | — | MISSING | Only static helper text "429로 거절". No 429 event banner |
| 46 (128:2316) | Domain을 확인하지 못했어요 | 698:3621 | ServerlessTriggersPage.tsx:560 verification-error | "도메인 연결" → enter a domain → "TXT 확인" (always fails first) | OK | "다시 확인" connects |
| 46 (128:2316) | 오늘 실행을 80% 넘게 썼어요 | 698:3685 | — | — | MISSING | List shows only a usage meter, no warning banner. 1,284/10,000 with no way to raise it |
| 46 (128:2316) | 오늘 실행 한도에 닿았어요 | 698:3703 | — | — | MISSING | No limit banner on the list |
| 46 (128:2316) | 한도에 닿아서 실행하지 않았어요 | 698:3725 | ServerlessTestPage.tsx:468 executionError='quota' | Needs executionsToday ≥ 10,000 (≈8,716 manual runs) | UNREACHABLE | No demo toggle. Design shows it inline, code uses a modal |
| 46 (128:2316) | API_KEY 값을 바꿀까요? | 698:3770 | ServerlessEnvironmentPage.tsx:543 UpdateDialog | Environment tab → "값 바꾸기" on API_KEY | OK | |
| 46 (128:2316) | 버전 5로 되돌릴까요? | 698:3815 | ServerlessVersionsPage.tsx:272 | Versions tab → "되돌리기" on 버전 5 | OK | "새 버전 8" is computed |
| 46 (128:2316) | 함수를 더 만들 수 없어요 | 698:3860 | — | — | MISSING | At 3/3 "새 함수" stays enabled and creation succeeds (4/3) |
| 46 (128:2316) | 정지됐어요 · 3일 뒤 삭제돼요 | 698:3917 | — | — | MISSING | Only a hardcoded "만료까지 7일 남았습니다" banner. No suspended state |
| 46 (128:2316) | 일반 팀원으로 보고 있어요 | 698:3939 | — | — | MISSING | Team functions (connect-api) are excluded by `getDemoServerlessFunction`. No read-only member view |
| 46 (128:2316) | TypeScript 오류로 저장하지 않았어요 | 698:3961 | — | — | MISSING | `onSaveCode` saves without type checking |
| 38 · 조회·빈 상태·삭제 안내 (103:1983) | 첫 번째 함수를 만들어보세요 | 103:2049 | ServerlessListPage.tsx:386 EmptyNotice | Delete welcome-api and health-check | PARTIAL | Copy is "아직 함수가 없습니다. 새 함수를 만들어 보세요.". No 0/5 or 30초/128MB details, no CTA in the card |

#### Flows
| Flow frame | Node | Transition specified | Code behavior | Status |
|---|---|---|---|---|
| 13 · Serverless 목록 | 203:50606 | entry: sidebar "Serverless" → 13 | StudentShell paths.serverless='/serverless' → ServerlessListPage | OK |
| 13-01 · 첫 번째 함수를 만들어보세요 | 203:50819 | 13 with 0 functions → empty state | EmptyNotice with different copy and no details | PARTIAL |
| 13-02 · 함수를 더 만들 수 없어요 | 203:51053 | 13 at 3/3, "새 함수" → limit dialog | Navigates to /serverless/new. Creation is allowed past the limit | MISSING |
| 13-03 · 오늘 실행을 80% 넘게 썼어요 | 699:53778 | 13 with ≥80% daily usage → warning banner | No banner, no way to raise usage | MISSING |
| 13-04 · 오늘 실행 한도에 닿았어요 | 699:53946 | 13 at daily limit → limit banner | No banner | MISSING |
| 13-05 · 로딩 | 741:54575 | 13 loading skeleton | 3 SummaryLoading cards while IndexedDB loads. Cards area shows the empty notice meanwhile | PARTIAL |
| 13-06 · 오류 | 747:61233 | 13 load error | Inline "사용량을 불러오지 못했습니다 · 다시 시도" only if demo storage throws. No demo toggle | UNREACHABLE |
| 13-07 · 호버 · 함수 열기 | 226:27521 | "함수 열기" → 15 | navigate(`/serverless/:id`) → FunctionPage (DEV demo). Non-DEV demo: no cards (PENDING-PR #144) | OK |
| 14 · 함수 만들기 | 203:51289 | entry: 13 "새 함수" → 14 | navigate('/serverless/new') (disabled outside demo) | OK |
| 14-01 · 함수 정보를 확인해주세요 | 203:51439 | 14 submit with duplicate name + compile error → dialog | Inline duplicate error, submit disabled. No compile check or dialog | PARTIAL |
| 14-02 · 로딩 | 741:54780 | 14 loading skeleton | Lazy CreatePage with no Suspense fallback. Nothing rendered | MISSING |
| 14-03 · 오류 | 747:61473 | 14 load error | No error rendering on the create route (not covered by PR #144) | MISSING |
| 14-04 · 호버 · TypeScript | 241:26949 | Runtime "TypeScript" → selects TS + TS starter code | handleRuntimeChange sets runtime and starterCode.typescript | OK |
| 15 · 함수 코드 | 203:51620 | entry: 14 "함수 생성" or 13 "함수 열기" → 15 | Create → navigate(`/serverless/<uuid>`). Open → `/serverless/:id` | OK |
| 15-01 · welcome-api를 삭제할까요? | 203:52074 | "함수 삭제" → delete confirm | DeleteConfirmDialog. Confirm → delete → /serverless | OK |
| 15-02 · TypeScript 오류로 저장하지 않았어요 | 699:54597 | "코드 저장" with TS error → inline error | Saves unconditionally | MISSING |
| 15-03 · 정지됐어요 · 3일 뒤 삭제돼요 | 699:54821 | Suspended function → banner/locked editor | No suspended state. Static 7-day expiry banner | MISSING |
| 15-04 · 일반 팀원으로 보고 있어요 | 699:55025 | Team function viewed as member → read-only notice | Team functions are not routable (redirect to /serverless) | MISSING |
| 15-05 · 로딩 | 741:54937 | 15 loading skeleton | develop: no Suspense or loading branch. PR #144 adds a LoadingCard while state loads | PENDING-PR #144 |
| 15-06 · 오류 | 747:61644 | 15 load error | develop: none. PR #144 ErrorCard appears only on demo storage failure (no toggle) | UNREACHABLE |
| 15-07 · 호버 · 코드 저장 | 241:27102 | "코드 저장" → saved, new version | saveDemoServerlessCode → new version, label updates (no toast) | OK |
| 16 · 함수 Trigger | 203:52316 | entry: 15 tab "Trigger" / "Trigger 관리" → 16 | tabPath → `/serverless/:id/triggers` | OK |
| 16-01 · HTTP Trigger 추가 | 203:52552 | "Trigger 추가" → HTTP dialog | Opens HTTP only if no HTTP trigger exists. Seeded welcome-api opens Cron | OK |
| 16-02 · Cron Trigger 추가 | 203:53615 | "Trigger 추가" → Cron dialog | TriggerDialog type=Cron on welcome-api | OK |
| 16-03 · Cron 표현식을 확인해주세요 | 203:53887 | invalid expression → error state | TriggerDialog error title/help, add disabled | OK |
| 16-04 · 5분보다 짧은 간격은 쓸 수 없어요 | 699:55815 | `*/2` → frequency error | TriggerDialog isTooFrequent | OK |
| 16-05 · 호출 주소를 재발급할까요? | 699:56074 | "호출 주소 재발급" → confirm | Confirm dialog → regenerate | OK |
| 16-06 · 동시 실행 한도를 넘은 요청이 있어요 | 699:56339 | 429 events → inline banner on 16 | No such banner | MISSING |
| 16-07 · Domain을 확인하지 못했어요 | 699:56553 | "도메인 연결" → TXT check fails → dialog | input → "TXT 확인" → verification-error dialog | OK |
| 16-08 · 로딩 | 741:55135 | 16 loading skeleton | develop: none. PR #144 LoadingCard | PENDING-PR #144 |
| 16-09 · 오류 | 747:61863 | 16 load error | PR #144 ErrorCard on storage failure only | UNREACHABLE |
| 16-10 · 호버 · 주소 복사 | 241:27327 | "주소 복사" → copy URL | navigator.clipboard.writeText (no feedback toast) | OK |
| 17 · 함수 환경변수 | 203:54154 | entry: tab "환경변수" → 17 | `/serverless/:id/environment` | OK |
| 17-01 · API_KEY 값을 바꿀까요? | 700:52414 | "값 바꾸기" on secret → dialog | UpdateDialog → updateDemoServerlessVariable | OK |
| 17-02 · 로딩 | 741:55349 | 17 loading skeleton | develop: none. PR #144 LoadingCard | PENDING-PR #144 |
| 17-03 · 오류 | 747:62098 | 17 load error | PR #144 ErrorCard on storage failure only | UNREACHABLE |
| 17-04 · 호버 · 변수 추가 | 241:27570 | "변수 추가" → new variable row | Focuses the "새 환경변수" form name field | OK |
| 18 · 함수 테스트 | 203:54353 | entry: tab "테스트" / "테스트하기" → 18 | `/serverless/:id/test` | OK |
| 18-01 · 비활성 함수는 실행할 수 없어요 | 203:54551 | "실행" on inactive function → dialog | health-check → inactive dialog + "함수 활성화" | OK |
| 18-02 · JSON 형식을 확인해주세요 | 203:54791 | invalid payload "실행" → dialog | jsonErrorOpen dialog with line hint | OK |
| 18-03 · 함수 실행 중 오류가 발생했어요 | 203:55019 | Runtime error → error dialog | Execution always succeeds | MISSING |
| 18-04 · 실행 시간이 초과됐어요 | 203:55250 | Timeout → dialog | No timeout path | MISSING |
| 18-05 · 한도에 닿아서 실행하지 않았어요 | 700:53198 | "실행" at daily limit → inline notice | Modal exists (executionError='quota') but the limit can't be reached in demo | UNREACHABLE |
| 18-06 · 로딩 | 741:55534 | 18 loading skeleton | develop: none. PR #144 LoadingCard | PENDING-PR #144 |
| 18-07 · 오류 | 747:62311 | 18 load error | PR #144 ErrorCard on storage failure only | UNREACHABLE |
| 18-08 · 호버 · 실행 | 241:27775 | "실행" → run, show result | executeDemoServerlessTest → result, summary, log update | OK |
| 19 · 함수 실행 Log | 203:55478 | entry: tab "Logs" / "실행 Log 보기" → 19 | `/serverless/:id/logs` | OK |
| 19-01 · 실행 Log가 없어요 | 203:55926 | no runs → empty state | EmptyRow "실행 기록을 불러올 수 없습니다." (wrong, error-like copy) | PARTIAL |
| 19-02 · 실행 Log를 모두 삭제할까요? | 203:56177 | "전체 삭제" → confirm | ModalSurface confirm → deleteDemoServerlessRuns | OK |
| 19-03 · 로딩 | 741:55720 | 19 loading skeleton | develop: none. PR #144 LoadingCard | PENDING-PR #144 |
| 19-04 · 오류 | 747:62539 | 19 load error | PR #144 ErrorCard on storage failure only | UNREACHABLE |
| 19-05 · 호버 · 성공 | 241:27983 | Click success row → output log | selectRun shows outputLines (most seeded rows have none) | OK |
| 50 · 함수 버전 | 700:53844 | entry: tab "버전" → 50 | `/serverless/:id/versions` | OK |
| 50-01 · 버전 5로 되돌릴까요? | 700:53918 | "되돌리기" → confirm | Rollback dialog → new version → navigates to code tab | OK |
| 50-02 · 로딩 | 741:61067 | 50 loading skeleton | develop: none. PR #144 LoadingCard | PENDING-PR #144 |
| 50-03 · 오류 | 747:68572 | 50 load error | PR #144 ErrorCard on storage failure only | UNREACHABLE |
| 50-04 · 호버 · 되돌리기 | 700:54138 | "되돌리기" → 50-01 | Opens rollback dialog | OK |

#### Counts
Product: 8 total (OK 8 / non-OK 0); States panels: 26 total (OK 12 / non-OK 14: MISSING 10, PARTIAL 3, UNREACHABLE 1); Flows: 57 total (OK 28 / non-OK 29: MISSING 11, PARTIAL 4, UNREACHABLE 8, PENDING-PR #144 6)

### Database

Mock data: `src/entities/database/model/demoDatabase.ts`. The seed has welcome-db, quota-locked-db (write_locked), suspended-welcome-db (suspended) and connect-db (demo-team). `listDemoDatabases`/`getDemoDatabaseQuota` (L244-273) **exclude** quota-locked-db and suspended-welcome-db, so no UI path links to them. They open only by direct URL (`/databases/quota-locked-db`, `/databases/suspended-welcome-db`). There is no demo loading delay or failure toggle: loading renders only during the dynamic-import tick, and error renders only on an unknown id.

#### Product screens
| # | Figma frame | Node | Size | Route(s) | Component | Status | Notes |
|---|---|---|---|---|---|---|---|
| 42 | Database 목록 | 604:6934 | 1440x1080 | /databases (?owner=teamId) | pages/database/DatabaseListPage.tsx | OK | Three usage cards, card grid, SSH guide |
| 43 | Database 발급 | 606:7015 | 1440x1080 | /databases/new (?owner=) | pages/database/DatabaseCreatePage.tsx | OK | Engine toggle + name; dialogs in one `Dialog` switch (L233,450) |
| 44 | Database 상세 · 접속 정보 | 606:7312 | 1440x1573 | /databases/:databaseGrn | pages/database/DatabaseDetailPage.tsx | OK | Tabs, usage summary, connection info, SQL/SSH cards |
| 45 | Database 쿼리 콘솔 | 607:7369 | 1440x1080 | /databases/:databaseId/query (demo-only) | pages/database/DatabaseQueryDemoPage.tsx | OK | Uses WorkflowLayout shell; redirects dedicated DBs to detail (L309) |
| 46 | Database 백업 | 607:7757 | 1440x1080 | /databases/:databaseGrn/backups | pages/database/DatabaseBackupsPage.tsx | OK | Backup table with 내려받기/복원 |
| 47 | Database 설정 | 607:8218 | 1440x1080 | /databases/:databaseGrn/settings | pages/database/DatabaseSettingsPage.tsx | OK | Rename, password rotation, delete |
| 48 | 전용형 Database 신청 | 608:7781 | 1440x1338 | /teams/:teamId/databases/dedicated/new, /databases/dedicated/new (demo-only) | pages/database/DedicatedDatabaseRequestPage.tsx | PARTIAL | Seeded request db-request-1 (GSM Connect, 검토 중) means first visit shows the 48-01 state with 신청 disabled, not the base form |
| 49 | 관리자 승인 · 전용형 Database | 608:8111 | 1440x1586 | /admin/database-approvals (demo-only, admin role) | pages/admin/AdminDatabaseApprovalsDemoPage.tsx | OK | Table, approve card, reject card, stats |

#### States & dialogs
| States frame (node) | Panel | Panel node | Component / state | Mock trigger | Status | Notes |
|---|---|---|---|---|---|---|
| 49 · Database 상태 (610:2677) | Database를 더 발급할 수 없어요 | 610:2771 | DatabaseCreatePage dialog `count` (L365,451) | Create one personal DB (quota 1/2 → 2/2), then return to /databases/new and click 발급 | OK | Copy is one paragraph; no "팀을 만들어 팀 Database" bullet |
| 610:2677 | 용량을 먼저 줄여 주세요 | 610:2810 | dialog `storage` (L366,453) | none: writeLocked comes from listDemoDatabases (excludes quota-locked-db); storage 0.3/1 GB | UNREACHABLE | Fix the demo list/quota to include the locked fixture |
| 610:2677 | 팀이 승인되면 발급할 수 있어요 | 610:2851 | dialog `notApproved` (L367,456) + inline Notice (L498) | /databases/new?owner=demo-team (team pending): 발급 is disabled, so the dialog opens only by pressing Enter in the name field | OK | Title "팀 승인이 필요합니다" differs from design |
| 610:2677 | 발급하지 못했어요 | 610:2893 | dialog `failure` (L389,457) | only if createDemoDatabase throws (localStorage write fails) | UNREACHABLE | No demo failure toggle |
| 610:2677 | PostgreSQL은 준비 중이에요 | 610:2934 | dialog `postgres` (L454,534) | in demo mode the PostgreSQL button just selects PG and creation proceeds | UNREACHABLE | Dialog only appears outside demo mode |
| 610:2677 | Database를 찾을 수 없어요 | 610:3121 | DatabaseDetailPage not-found Card (L327-333) | visit /databases/unknown-id | OK | Card also embeds a generic ErrorCard |
| 610:2677 | 용량을 80% 넘게 쓰고 있어요 | 610:3136 | — | — | MISSING | No ≥80% banner in Detail; only notification text (notifications.ts:33) |
| 610:2677 | 용량을 넘어 쓰기가 막혔어요 | 610:3154 | Detail Banner when write_locked (L346) | direct URL /databases/quota-locked-db only | UNREACHABLE | Fixture is never listed or linked |
| 610:2677 | 다시 쓸 수 있어요 | 610:3174 | — | — | MISSING | No "unlocked" banner or transition |
| 610:2677 | 정지됐어요 · 3일 뒤 삭제돼요 | 610:3197 | Detail suspended Banner + 사용 기간 연장 (L347) | direct URL /databases/suspended-welcome-db only | UNREACHABLE | Fixture excluded from list |
| 610:2677 | 일반 팀원으로 보고 있어요 | 610:3219 | — | — | MISSING | Exists for VM/Apps, not Database; connect-db gives full permissions |
| 610:2677 | 비밀번호 교체를 권해요 | 610:3237 | — | — | MISSING | No rotation-recommended banner |
| 610:2677 | 비밀번호를 교체할까요? | 610:3261 | Settings rotation Dialog (L296-302) | /databases/:grn/settings → 비밀번호 교체 | OK | welcome-db shows "welcome-api 함수" line |
| 610:2677 | 새 비밀번호를 만들었어요 | 610:3306 | Settings rotationResult Dialog (L303-310) | confirm 교체 in the dialog above | OK | |
| 610:2677 | welcome-db를 삭제할까요? | 610:3372 | DeleteConfirmDialog (L311-329) | settings → Database 삭제 | OK | Requires typing the name; redirects to list after a delay |
| 610:2677 | 9월 28일 04:00 백업으로 되돌릴까요? | 610:3397 | Backups DeleteConfirmDialog (L337-356) | /backups → 복원 on a row | OK | |
| 610:2677 | 쿼리가 45초를 넘어 멈췄어요 | 610:3428 | Query Banner outcome `timeout` (L237-248,323) | type the hidden comment `-- demo:timeout` and 실행, then wait 45 s | OK | Trigger is undiscoverable |
| 610:2677 | 결과를 1,000행까지만 보여 줘요 | 610:3446 | Query Banner `row-cap` (L250,324) | hidden comment `-- demo:row-cap` + 실행 | OK | Trigger is undiscoverable |
| 610:2677 | 쓰기 금지 중이라 실행하지 않았어요 | 610:3468 | Query Banner (L229-235,322) | needs /databases/quota-locked-db/query (direct URL) + INSERT/UPDATE | UNREACHABLE | Banner shows statically for locked DBs, not only after running |
| 610:2677 | 전용형 신청을 보냈어요 | 610:3486 | DedicatedDatabaseRequestPage pending Banner (L96) | first visit (seeded pending), or after 신청 | OK | |
| 610:2677 | 전용형 신청이 거절됐어요 | 610:3508 | 신청 결과 card: 거절 badge + "거절 사유" Alert (L120-123) | admin rejects at /admin/database-approvals, then reopen 48 | PARTIAL | No banner titled "전용형 신청이 거절됐어요"; button changes to "고쳐서 다시 신청" |

#### Flows
| Flow frame | Node | Transition specified | Code behavior | Status |
|---|---|---|---|---|
| 42 · Database 목록 | 693:45532 | entry: sidebar Database → 42 | StudentShell.tsx:115 → /databases (or ?owner=team) | OK |
| 42-01 · 로딩 | 741:59806 | 42 loading skeleton | LoadingCards (L455,487) during dynamic-import tick only | OK |
| 42-02 · 오류 | 747:67157 | 42 load error | DatabaseListError (L489) only if import throws; demo list never fails | UNREACHABLE |
| 42-03 · 호버 · 새 Database | 693:45564 | click 새 Database → 43 | navigate('/databases/new') (L449; team L445) | OK |
| 43 · Database 발급 | 693:45754 | entry: 42 새 Database / home "Database 발급" | /databases/new renders | OK |
| 43-01 · 더 발급할 수 없어요 | 693:45791 | 발급 at quota → count dialog | after 1 creation, 2/2 → dialog `count` | OK |
| 43-02 · 용량을 먼저 줄여 주세요 | 693:45983 | 발급 while write-locked → storage dialog | writeLocked never true in demo (locked fixture excluded) | UNREACHABLE |
| 43-03 · 팀이 승인되면 | 693:46173 | 발급 on pending team → dialog | demo-team pending: button disabled + inline notice; dialog via Enter only | OK |
| 43-04 · 발급하지 못했어요 | 693:46364 | failed create → failure dialog | only on localStorage failure | UNREACHABLE |
| 43-05 · PostgreSQL은 준비 중 | 693:46554 | click PostgreSQL → dialog | demo selects PG and creates a PG DB (L533-534) | UNREACHABLE |
| 43-06 · 로딩 | 741:59992 | 43 loading | usage LoadingCards (L501) during import tick | OK |
| 43-07 · 오류 | 747:67371 | 43 load error | ErrorCard (L521) only if import fails | UNREACHABLE |
| 43-08 · 호버 · 발급 | 693:46736 | click 발급 → 44 detail | createDemoDatabase → navigate /databases/:grn (L385-394); status creating→active after 2 s | OK |
| 44 · 상세 · 접속 정보 | 693:46912 | entry: 42 card 열기 / home "Database 관리" | navigate /databases/:grn (List L269) | OK |
| 44-01 · 80% 넘게 | 693:46997 | detail with ≥80% warning banner | not implemented | MISSING |
| 44-02 · 쓰기가 막혔어요 | 693:47210 | detail write-locked banner | Banner L346; quota-locked-db only by direct URL | UNREACHABLE |
| 44-03 · 다시 쓸 수 있어요 | 693:47421 | unlocked banner | not implemented | MISSING |
| 44-04 · 정지됐어요 · 3일 뒤 삭제 | 693:47642 | suspended banner + 연장 | Banner L347; suspended-welcome-db only by direct URL | UNREACHABLE |
| 44-05 · 일반 팀원으로 | 693:47843 | member read-only banner | not implemented for Database | MISSING |
| 44-06 · 비밀번호 교체를 권해요 | 693:48064 | rotation-recommended banner | not implemented | MISSING |
| 44-07 · 찾을 수 없어요 | 693:48257 | unknown id → not-found | not-found card L327-333 via /databases/unknown | OK |
| 44-08 · 로딩 | 739:52871 | 44 loading | LoadingCard height 300 (L327) during import tick; single card, not full skeleton | OK |
| 44-09 · 오류 | 745:61653 | 44 load error | demo error path is the same as not-found (44-07); no separate error view | UNREACHABLE |
| 44-10 · 호버 · 쿼리 콘솔 | 693:48443 | click 쿼리 콘솔 tab → 45 | navigate /databases/:grn/query (L342; shared only) | OK |
| 45 · 쿼리 콘솔 | 693:48731 | entry: 44/46/47 쿼리 콘솔 tab | demo route renders DatabaseQueryDemoPage | OK |
| 45-01 · 45초를 넘어 | 693:48819 | 실행 → timeout banner | `-- demo:timeout` comment, then 45 s | OK |
| 45-02 · 1,000행까지만 | 693:49014 | 실행 → row-cap banner | `-- demo:row-cap` comment | OK |
| 45-03 · 쓰기 금지 중 | 693:49201 | INSERT on locked DB → banner | needs quota-locked-db direct URL | UNREACHABLE |
| 45-04 · 로딩 | 741:60156 | 45 loading skeleton | only subtitle "Database 확인 중" (L313); no skeleton; Suspense fallback null | MISSING |
| 45-05 · 오류 | 747:67556 | 45 load error | loadError Banner (L320) only if import rejects | UNREACHABLE |
| 45-06 · 호버 · 실행 | 693:49373 | click 실행 → results | runQuery parses SELECT and updates the table (L219-305) | OK |
| 46 · 백업 | 693:51614 | entry: 백업 tab | navigate /backups (Detail L343) | OK |
| 46-01 · 백업으로 되돌릴까요? | 693:51749 | 복원 → confirm dialog | openRestore → DeleteConfirmDialog | OK |
| 46-02 · 로딩 | 741:60334 | 46 loading | LoadingCard (L298/317) during import tick | OK |
| 46-03 · 오류 | 747:67748 | 46 load error | BackupError ErrorCard via unknown id (L298-299) | OK |
| 46-04 · 호버 · 내려받기 | 693:51982 | click 내려받기 → file download | demo gzip blob download (L224-246) | OK |
| 47 · 설정 | 693:52237 | entry: 설정 tab | navigate /settings | OK |
| 47-01 · 비밀번호를 교체할까요? | 693:52297 | 비밀번호 교체 → confirm | setShowRotationDialog (L284) | OK |
| 47-02 · 새 비밀번호를 만들었어요 | 693:52510 | confirm 교체 → result dialog | rotationResult dialog (L303) | OK |
| 47-03 · welcome-db를 삭제할까요? | 693:52764 | Database 삭제 → confirm | DeleteConfirmDialog (L311) | OK |
| 47-04 · 로딩 | 741:60525 | 47 loading | LoadingCard (L260) during import tick | OK |
| 47-05 · 오류 | 747:67946 | 47 load error | ErrorCard via unknown id (L260) | OK |
| 47-06 · 호버 · 비밀번호 교체 | 693:52969 | click 비밀번호 교체 → 47-01 | opens rotation dialog | OK |
| 48 · 전용형 신청 | 693:53150 | entry: 42 team scope → 전용형 신청 | List L436 (leader/devops) → /teams/demo-team/databases/dedicated/new | OK |
| 48-01 · 신청을 보냈어요 | 693:53245 | after 신청 → pending banner | Banner L96 (shown immediately from seed) | OK |
| 48-02 · 신청이 거절됐어요 | 693:53450 | rejected state | badge + "거절 사유" Alert after admin reject; no dedicated banner | PARTIAL |
| 48-03 · 로딩 | 741:60683 | 48 loading | synchronous localStorage; Suspense fallback null | MISSING |
| 48-04 · 오류 | 747:68125 | 48 load error | no error rendering | MISSING |
| 48-05 · 호버 · 신청 | 693:53628 | click 신청 → 48-01 | submitRequest works (L58-86), but the seeded pending request disables the button until admin rejects (then "고쳐서 다시 신청") | PARTIAL |
| 49 · 관리자 승인 | 693:53847 | entry: admin nav 승인 / team-approvals tab | WorkflowLayout L384; AdminTeamApprovals L161 → /admin/database-approvals | OK |
| 49-01 · 로딩 | 741:60870 | 49 loading | synchronous; no loading render | MISSING |
| 49-02 · 오류 | 747:68333 | 49 load error | no error rendering | MISSING |
| 49-03 · 호버 · 승인 | 693:53944 | click 승인 → approved, DB created | approve() creates dedicated DB, notification, success notice, filter=done | OK |

#### Counts
Product: 8 total (OK 7 / non-OK 1 PARTIAL); States panels: 21 total (OK 10 / non-OK 11: PARTIAL 1, UNREACHABLE 6, MISSING 4); Flows: 53 total (OK 32 / non-OK 21: PARTIAL 2, UNREACHABLE 10, MISSING 9). No PENDING-PR items (#143/#144 don't touch Database states).

### Apps

Paths are relative to `dev/` (develop cc72e2e, includes PR #142). In mock mode the list/cards send users to the demo routes in `src/pages/apps/demoRoutes.tsx`. The real `/apps/:appGrn` and `/apps/:appGrn/settings` pages redirect to `/apps/:id/demo` and `/apps/:id/demo-settings` (`AppOverviewPage.tsx:317`, `AppSettingsPage.tsx:316`). Seed data is in `src/entities/app/model/demoAppState.ts`:
- personal app: `demo-portfolio-web` (web and nightly-report services)
- team `demo-team` apps: `demo-team-portal` (web stopped after 11 restarts; the cron service has an expired shell), `demo-expired-app` and `demo-read-only-app`
- `demo-team` starts as **pending**

#### Product screens
| # | Figma frame | Node | Size | Route(s) | Component | Status | Notes |
|---|---|---|---|---|---|---|---|
| 51 | Apps 목록 | 613:8038 | 1440x1080 | `/apps` (team: `/teams/:teamId/apps`) | `src/pages/apps/AppsListPage.tsx` (team: `TeamAppsListPage.tsx`) | OK | Demo data from `getDemoAppSummaries`; 3 usage cards + cards + guide |
| 52 | 앱 만들기 · 소스 | 642:8652 | 1440x1357 | `/apps/new`, `/teams/:teamId/apps/new` | `src/pages/apps/AppCreateSourcePage.tsx` | OK | Demo GitHub/container/archive branches |
| 53 | 앱 만들기 · 서비스 | 644:8504 | 1440x1197 | `/apps/new/service`, `/teams/:teamId/apps/new/service` | `src/pages/apps/AppCreateServicePage.tsx` | OK | |
| 54 | 앱 개요 | 646:8651 | 1440x1183 | `/apps/:appId/demo` | `DemoAppOverviewPage` in `src/pages/apps/DemoAppOverviewPage.tsx` | OK | |
| 55 | 서비스 · 배포 | 649:8843 | 1440x1223 | `/apps/:appId/services/:serviceId/deployments` (default tab) | `src/pages/apps/DemoServicePage.tsx` (tab=deployments) | OK | |
| 56 | 서비스 · 로그 | 656:9381 | 1440x1080 | `/apps/:appId/services/:serviceId/logs` | `DemoServicePage.tsx` (tab=logs) | OK | |
| 57 | 서비스 · 지표 | 657:9446 | 1440x1080 | `.../metrics` | `DemoServicePage.tsx` (tab=metrics) | OK | |
| 58 | 서비스 · 변수 | 650:9012 | 1440x1539 | `.../variables` | `DemoServicePage.tsx` (tab=variables) | OK | |
| 59 | 서비스 · 설정 | 651:9162 | 1440x1413 | `.../settings` | `DemoServicePage.tsx` (tab=settings) | OK | |
| 60 | 서비스 · 도메인 | 658:9576 | 1440x1080 | `.../domains` | `DemoServicePage.tsx` (tab=domains, web services only) | OK | |
| 62 | 앱 설정 | 659:9836 | 1440x1413 | `/apps/:appId/demo-settings` | `DemoAppSettingsPage` in `DemoAppOverviewPage.tsx:654` | OK | |
| 63 | 서비스 · 셸 | 658:9846 | 1440x1080 | `.../shell` | `DemoServicePage.tsx` (tab=shell) | OK | In the code's tab order 셸 comes 4th (after 지표), not last |
| 64 | 공개 · 정지된 앱 | 659:10314 | 1440x1080 | `/public/:appId/stopped?service=` | `DemoStoppedAppLayout.tsx` + `DemoStoppedAppContent` (`DemoServicePage.tsx:1319`) | OK | |

#### States & dialogs
| States frame (node) | Panel | Panel node | Component / state | Mock trigger | Status | Notes |
|---|---|---|---|---|---|---|
| 50 Apps 만들기·배포 (664:2956) | 앱을 더 만들 수 없어요 | 664:3461 | `AppsListPage` quotaOpen dialog (:379); also the `quota` dialog in `AppCreateSourcePage` and `AppCreateServicePage` | Create 1 personal app (seed has 1 of 2), then click 새 앱 on /apps | OK | Copy matches ("내 앱 2개를 모두 쓰고 있습니다") |
| 664:2956 | 메모리 할당량이 모자라요 | 664:3487 | `AppCreateServicePage` dialog='memory' (:414) | Team scope only: admin approves demo-team, then /teams/demo-team/apps → 새 앱 → 512 MB → 앱 만들기 (free memory is 256 MB) | OK | Can't happen in personal scope: the quota check fires first, and the slider max (1 GB) is below the 1280 MB free |
| 664:2956 | 팀이 승인되면 앱을 만들 수 있어요 | 664:3516 | `AppCreateServicePage` dialog='team-pending' (:288) | /teams/demo-team/apps (pending) → 새 앱 → 다음: 서비스 | OK | |
| 664:2956 | GitHub 계정을 먼저 연결해 주세요 | 664:3569 | `AppCreateSourcePage` dialog='github-disconnected' (:332) | Unlink GitHub in /settings (demo account page), then /apps/new → 다음 | OK | The demo account page is loaded only when `import.meta.env.DEV` (`AccountSettingsPage.tsx:14`) |
| 664:2956 | 저장소에 접근할 수 없어요 | 664:3595 | `AppCreateSourcePage` dialog='repository-inaccessible' (:333) | /apps/new → pick repo gsm-jimin/study-log (not installed) → 다음 | OK | |
| 664:2956 | 앱을 찾을 수 없어요 | 664:3621 | not-found card in `DemoAppOverviewPage` (:450), `DemoServicePage` (:550) | Open /apps/unknown/demo or a deleted app | OK | |
| 664:2956 | 빌드에 실패했어요 | 664:3679 | Deployments banner via `deploymentFailureCopy` (`features/apps/demoServiceOperations.ts:57`) | portfolio-web › web › 배포 → click row 7c6b5a4 (실패) | OK | Can also be produced with a start command of `exit 1` + 재배포 |
| 664:2956 | 빌드가 25분을 넘어 멈췄어요 | 664:3705 | same, failure='timeout' | Click row 8b5f3a2 (seeded `failureDeployments`) | OK | |
| 664:2956 | 배포 전 명령이 실패했어요 | 664:3735 | same, failure='pre-deploy' | Click row 6e4d2c1 | OK | |
| 664:2956 | 상태 확인에 응답이 없어요 | 664:3790 | same, failure='health' | Click row 5c3b2a1 | OK | |
| 664:2956 | push를 건너뛰었어요 | 664:3816 | Deployments banner, skipped + canManage (`DemoServicePage.tsx:675`) | Default on portfolio-web › web › 배포 | OK | |
| 664:2956 | 팀장·DevOps가 배포해야 나가요 | 664:3846 | same banner, !canManage | /apps/demo-read-only-app/demo → web → 배포 | OK | |
| 664:2956 | 이 커밋을 배포할까요? | 664:3899 | `DemoAppDialog` kind='deploy' (:1273) | Click 「이 커밋 배포」 on row 9f8e7d6 (or 재배포) | OK | Copy matches |
| 664:2956 | 3d2e1f0으로 되돌릴까요? | 664:3933 | `DemoAppDialog` kind='rollback' | Click 되돌리기 on row 3d2e1f0 | OK | |
| 664:2956 | 서브도메인을 쓸 수 없어요 | 664:3967 | `AppCreateServicePage` dialog='domain-unavailable' (:416); `DemoServicePage` kind='domain' (:1310) | Create flow with subdomain `portfolio-web` → 앱 만들기; or Domains tab → enter a used name → 저장 | OK | Both dialogs say "{name}은 이미 다른 앱이 쓰고 있습니다" |
| 51 Apps 운영 (665:3142) | 10번 넘게 다시 시작해서 멈췄어요 | 665:3647 | Overview banner restartReason='limit' (`DemoAppOverviewPage.tsx:540`) | /apps/demo-team-portal/demo | OK | Seeded on the team app, not portfolio-web |
| 665:3142 | 메모리 할당량을 모두 썼어요 | 665:3673 | Metrics banner when `quota.freeMemory === 0` (`DemoServicePage.tsx:806`) | Use up exactly 2048 MB (e.g. 2nd app at 1 GB + raise web to 768 MB), then open 지표 | OK | Seed never shows it; takes several steps |
| 665:3142 | Database 비밀번호가 바뀌어 다시 시작했어요 | 665:3707 | Overview banner restartReason='database' via `reconcileDemoDatabaseRestarts` | Change the welcome-db password in Database settings → open portfolio-web overview | OK | |
| 665:3142 | 정지됐어요 · 3일 뒤 삭제돼요 | 665:3760 | Overview RenewalNotice, expired (:527) | /teams/demo-team/apps → demo-expired-app | OK | Seeded on a team app |
| 665:3142 | 일반 팀원으로 보고 있어요 | 665:3788 | Overview notice when `!canManage` (:536) | /apps/demo-read-only-app/demo (or any demo-team app) | OK | Shown only to members / read-only apps (not to the pending-team leader) |
| 665:3142 | 설정 파일에서 무시한 칸이 있어요 | 665:3812 | Settings banner when `service.configFile` (:1004) | portfolio-web › web › 설정 | OK | |
| 665:3142 | 변수를 저장할까요? | 665:3865 | `DemoAppDialog` kind='variables' (:1293) | 변수 tab → 변경사항 저장 | OK | |
| 665:3142 | PORT는 쓸 수 없는 이름이에요 | 665:3891 | kind='port' (:1304) | 변수 tab → key `PORT` → 변수 추가/변경사항 저장 | OK | |
| 665:3142 | 팀장·DevOps만 바꿀 수 있어요 | 665:3915 | kind='read-only' (:1307) | demo-read-only-app › web › 변수 → 변경사항 저장 (or 설정 저장) | OK | |
| 665:3142 | portfolio-web을 삭제할까요? | 665:3968 | `DeleteConfirmDialog` in `DemoAppSettingsPage` (:1028) | /apps/demo-portfolio-web/demo-settings → 앱 삭제 | OK | |
| 665:3142 | nightly-report 크론 설정 | 665:3993 | Overview `DemoAppDialog` for cronService (:634) | portfolio-web overview → click "매일 03:00 (서울)" on the nightly-report card | OK | Copy matches; confirm button goes to the service settings tab |
| 665:3142 | 셸 세션이 끝났어요 | 665:4026 | Shell banner when shellExpired (:1197) | /apps/demo-team-portal/services/demo-team-service-2/shell (expired seed), or wait out the 52 min seed on portfolio-web | OK | |

#### Flows
| Flow frame | Node | Transition specified | Code behavior | Status |
|---|---|---|---|---|
| 51 · Apps 목록 | 667:33582 | entry: sidebar Apps → /apps | `navigateFromShell('apps')` → /apps | OK |
| 51-01 · 앱을 더 만들 수 없어요 | 667:33646 | 51 새 앱 at quota → quota dialog | `openCreateApp` → quotaOpen when used ≥ limit | OK |
| 51-02 · 로딩 | 741:61234 | 51 loading skeleton | `simulateDemoRequest('apps')` latency → LoadingCards | OK |
| 51-03 · 오류 | 747:68746 | 51 load error card | `?demoError=apps` → 3 usage-slot ErrorCards + card-sized ErrorCard (`AppsListPage.tsx`, also `TeamAppsListPage.tsx`); 다시 시도 succeeds | OK |
| 51-04 · 호버 · 새 앱 | 667:33884 | 새 앱 → 52 | navigate('/apps/new') | OK |
| 52 · 앱 만들기 · 소스 | 667:34085 | entry: 51 새 앱 | /apps/new | OK |
| 52-01 · GitHub 계정을 먼저 연결해 주세요 | 667:34191 | 다음 without GitHub → dialog | dialog='github-disconnected'; CTA → /settings with returnTo | OK |
| 52-02 · 저장소에 접근할 수 없어요 | 667:34255 | 다음 with uninstalled repo → dialog | dialog='repository-inaccessible' (study-log) | OK |
| 52-03 · 로딩 | 741:61425 | 52 loading | `DemoCreateFormState step=source` during demo latency | OK |
| 52-04 · 오류 | 747:68965 | 52 load error | `?demoError=apps-create` → `DemoCreateFormState` error cards (`AppCreateSourcePage.tsx`) | OK |
| 52-05 · 호버 · 다음: 서비스 | 667:34266 | 다음: 서비스 → 53 | handleContinue → /apps/new/service | OK |
| 53 · 앱 만들기 · 서비스 | 667:34465 | entry: 52 다음 | /apps/new/service (sends back to the source page if there is no draft) | OK |
| 53-01 · 메모리 할당량이 모자라요 | 667:34541 | 앱 만들기 over memory → dialog | dialog='memory'; only reachable in team scope after admin approval | OK |
| 53-02 · 팀이 승인되면 앱을 만들 수 있어요 | 667:34590 | pending team → dialog | dialog='team-pending' on load for pending demo-team | OK |
| 53-03 · 서브도메인을 쓸 수 없어요 | 667:34638 | taken subdomain → dialog | dialog='domain-unavailable' on 앱 만들기 (blur shows only an inline error) | OK |
| 53-04 · 로딩 | 741:61586 | 53 loading | `DemoCreateFormState step=service` during demo latency | OK |
| 53-05 · 오류 | 747:69147 | 53 load error | `?demoError=apps-create` on /apps/new/service → error cards (`AppCreateServicePage.tsx`) | OK |
| 53-06 · 호버 · 앱 만들기 | 667:34648 | 앱 만들기 → 54 | `addDemoApp` → /apps/:id/demo | OK |
| 54 · 앱 개요 | 668:35409 | entry: 51 card / 53 create | `openApp` → /apps/:id/demo | OK |
| 54-01 · 정지됐어요 · 3일 뒤 삭제돼요 | 668:35460 | expired app banner | RenewalNotice on demo-expired-app; 사용 기간 연장 renews it | OK |
| 54-02 · 10번 넘게 다시 시작해서 멈췄어요 | 668:35934 | restart-limit banner | demo-team-portal banner + 로그 보기 → logs tab | OK |
| 54-03 · Database 비밀번호가 바뀌어 다시 시작했어요 | 668:36205 | DB-rotation banner | Shows after a welcome-db password change (reconcile on load/event) | OK |
| 54-04 · 일반 팀원으로 보고 있어요 | 668:36474 | read-only banner | !canManage notice (read-only app; also the pending-team leader) | OK |
| 54-05 · 앱을 찾을 수 없어요 | 668:36743 | not-found state | Unknown appId → not-found card + Apps 목록 | OK |
| 54-06 · 로딩 | 741:61732 | 54 loading | Suspense fallback `DemoAppRouteLoading page=overview` (first chunk load only) | OK |
| 54-07 · 오류 | 747:69314 | 54 load error | `?demoError=apps-overview` → real header/tabs + `DemoAppStateCards page=overview` (`DemoAppRequestState.tsx`) | OK |
| 54-08 · 호버 · 열기 | 668:37213 | service card 열기 → 55 | navigate(`/services/:id/deployments`) | OK |
| 55 · 서비스 · 배포 | 668:37465 | entry: 54 열기 | default tab deployments | OK |
| 55-01 · 이 커밋을 배포할까요? | 668:37655 | 이 커밋 배포 → confirm | kind='deploy' dialog; confirm runs `activateDemoDeployment` | OK |
| 55-02 · 3d2e1f0으로 되돌릴까요? | 668:37761 | 되돌리기 → confirm | kind='rollback' dialog | OK |
| 55-03 · 빌드에 실패했어요 | 668:37772 | failed build banner | Select row 7c6b5a4 → banner + 빌드 로그 | OK |
| 55-04 · 빌드가 25분을 넘어 멈췄어요 | 668:38066 | timeout banner | Select row 8b5f3a2 | OK |
| 55-05 · 배포 전 명령이 실패했어요 | 668:38364 | pre-deploy banner | Select row 6e4d2c1 | OK |
| 55-06 · 상태 확인에 응답이 없어요 | 668:38658 | health banner | Select row 5c3b2a1 | OK |
| 55-07 · 팀장·DevOps가 배포해야 나가요 | 668:38952 | read-only skipped banner | demo-read-only-app deployments | OK |
| 55-08 · 로딩 | 741:61950 | 55 loading | Suspense fallback `page=service` heights [450,282] (first chunk load) | OK |
| 55-09 · 오류 | 747:69574 | 55 load error | `?demoError=apps-deploy` → header/tabs + error cards [450,282] (`DemoServicePage.tsx` + `DemoAppRequestState.tsx`) | OK |
| 55-10 · 호버 · 이 커밋 배포 | 668:39227 | 이 커밋 배포 → 55-01 | Row button opens the deploy dialog | OK |
| 56 · 서비스 · 로그 | 669:38045 | entry: 로그 tab | move('logs') | OK |
| 56-01 · 로딩 | 741:62157 | 56 loading | Suspense fallback logs [348] | OK |
| 56-02 · 오류 | 747:69795 | 56 load error | `?demoError=apps-logs` → error card [348] | OK |
| 56-03 · 호버 · 일시 정지 | 669:38076 | 일시 정지 → paused stream | Toggles logsPaused ("일시 정지됨", button "다시 시작") | OK |
| 57 · 서비스 · 지표 | 669:38279 | entry: 지표 tab | move('metrics') | OK |
| 57-01 · 메모리 할당량을 모두 썼어요 | 669:38326 | quota-exhausted banner | Banner when freeMemory===0 (needs extra setup) | OK |
| 57-02 · 로딩 | 741:62301 | 57 loading | Suspense fallback metrics [338,338] | OK |
| 57-03 · 오류 | 747:69946 | 57 load error | `?demoError=apps-metrics` → two side-by-side error cards | OK |
| 57-04 · 호버 · 설정 열기 | 669:38724 | 설정 열기 → 59 | Memory-restart banner button → move('settings') | OK |
| 58 · 서비스 · 변수 | 669:38929 | entry: 변수 tab | move('variables') | OK |
| 58-01 · 변수를 저장할까요? | 669:39075 | 변경사항 저장 → confirm | kind='variables' dialog → save + restart | OK |
| 58-02 · PORT는 쓸 수 없는 이름이에요 | 669:39159 | key PORT → dialog | kind='port' | OK |
| 58-03 · 팀장·DevOps만 바꿀 수 있어요 | 669:39242 | non-manager save → dialog | kind='read-only' | OK |
| 58-04 · 로딩 | 741:62470 | 58 loading | Suspense fallback variables [270,314,200,216] | OK |
| 58-05 · 오류 | 747:70129 | 58 load error | `?demoError=apps-variables` → error cards | OK |
| 58-06 · 호버 · 변경사항 저장 | 669:39252 | 변경사항 저장 → 58-01 | `requestVariables(true)` → dialog | OK |
| 59 · 서비스 · 설정 | 669:39533 | entry: 설정 tab | move('settings') | OK |
| 59-01 · 설정 파일에서 무시한 칸이 있어요 | 669:39590 | config-file banner | Banner for demo-web (configFile) | OK |
| 59-02 · 로딩 | 741:62661 | 59 loading | Suspense fallback settings [530,328,146] | OK |
| 59-03 · 오류 | 747:70348 | 59 load error | `?demoError=apps-service-settings` → error cards | OK |
| 59-04 · 호버 · 설정 저장 | 669:39825 | 설정 저장 → saved | saveSettings → "설정을 저장했습니다." (quota checks; read-only → dialog) | OK |
| 60 · 서비스 · 도메인 | 669:41192 | entry: 도메인 tab | move('domains') (web only) | OK |
| 60-01 · 로딩 | 741:62826 | 60 loading | Suspense fallback domains [200,254] | OK |
| 60-02 · 오류 | 747:70534 | 60 load error | `?demoError=apps-domains` → error cards | OK |
| 60-03 · 호버 · 저장 | 669:41235 | 저장 → saved / unavailable dialog | Saves the subdomain or opens kind='domain' | OK |
| 62 · 앱 설정 | 669:41428 | entry: 54 설정 tab | navigate('/apps/:id/demo-settings') | OK |
| 62-01 · portfolio-web을 삭제할까요? | 669:41634 | 앱 삭제 → confirm | `DeleteConfirmDialog` typed-name confirm → deletes → list | OK |
| 62-02 · 로딩 | 741:62974 | 62 loading | Suspense fallback `page=app-settings` | OK |
| 62-03 · 오류 | 747:70696 | 62 load error | `?demoError=apps-app-settings` → header/tabs + 4 error cards (`DemoAppSettingsPage`) | OK |
| 62-04 · 호버 · 앱 삭제 | 669:41661 | 앱 삭제 → 62-01 | setDeleteName('') opens the dialog | OK |
| 63 · 서비스 · 셸 | 669:41911 | entry: 셸 tab | move('shell') | OK |
| 63-01 · 셸 세션이 끝났어요 | 669:41942 | expired session banner | shellExpired banner + 다시 열기 | OK |
| 63-02 · 로딩 | 741:63188 | 63 loading | Suspense fallback shell [326] | OK |
| 63-03 · 오류 | 747:70938 | 63 load error | `?demoError=apps-shell` → error card [326] | OK |
| 63-04 · 호버 · 세션 끝내기 | 669:42148 | 세션 끝내기 → closed | openShell toggles shellOpen=false ("셸이 닫혀 있습니다") | OK |
| 64 · 공개 · 정지된 앱 | 669:42343 | entry: stopped app URL | Expired overview web-service link → /public/:appId/stopped | OK |
| 64-01 · 호버 · GSM SV 열기 | 669:42358 | GSM SV 열기 → GSM SV home | navigate('/') | OK |

#### Counts
Product: 13 total (OK 13 / non-OK 0); States panels: 27 total (OK 27 / non-OK 0); Flows: 75 total (OK 75 / non-OK 0), updated by `codex/figma-apps-account`

### Teams

Legend: `OK†` = works in a DEV build with `?demo=1` on develop. Every team page gates its mock branch on `import.meta.env.DEV && isDemoMode()`, so in a **production** build with `?demo=1` these pages call the real API instead. PR #143 removes that gate for TeamsHomePage (32/25). PR #144 removes it for TeamCreatePage (24), TeamSettingsPage (33), TeamInvitationAcceptPage (35) and StudentShell. Treat prod-mock as PENDING-PR #143/#144 for every OK† row. `PARTIAL` = the state exists but in a different form (for example an inline banner where Figma has a modal).
Seed (`entities/team/demo.ts:36-55`): team `demo-team` "GSM Connect" is **pending** with members 김지민 (leader, me), 한도윤 (DevOps) and 윤채원 (member). Approved states need admin approval: pick admin at `/__demo/role-selection`, open `/admin/team-approvals`, approve, then switch back to student.

#### Product screens
| # | Figma frame | Node | Size | Route(s) | Component | Status | Notes |
|---|---|---|---|---|---|---|---|
| 24 | 팀 만들기 | 101:4639 | 1440x1170 | /teams/new | pages/teams/TeamCreatePage.tsx | OK† | Form (이름/사용 목적) + info cards + banner. Submit → createDemoTeamRequest → /teams/:newId |
| 25 | 팀 승인 대기 | 101:4828 | 1440x1080 | /teams/:teamId (pending team), /teams | pages/teams/TeamsHomePage.tsx (status=pending branch) | OK† | Not a separate page: TeamsHome shows the "팀 승인 대기 중입니다" banner (:543) and a 팀원 초대 button (:781) |
| 32 | 팀 홈 | 101:5285 | 1440x1556 | /teams, /teams/:teamId | pages/teams/TeamsHomePage.tsx | OK† | Quota panel, team VM table, service cards, members. Approved view needs admin approval first |
| 33 | 팀 설정 | 102:4635 | 1440x1662 | /teams/:teamId/settings | pages/teams/TeamSettingsPage.tsx | OK† | Members table with DevOps/제외/팀장 넘기기, inline invite form, pending invites, quota, roles, danger zone |
| 35 | 팀 초대 수락 | 102:5230 | 1440x1080 | /teams/invitations/accept?token= | pages/teams/TeamInvitationAcceptPage.tsx | PARTIAL | Even in demo, 팀 and 초대한 사람 show "초대 내용을 미리 보여 주는 API가 없어 확인할 수 없습니다" (:456,:463) and 만료 is generic. Title is "팀 초대가 도착했습니다", not "GSM Connect 팀에 초대됐습니다". No in-app entry; reached only by URL `?token=demo-invite-token` |

#### States & dialogs
| States frame (node) | Panel | Panel node | Component / state | Mock trigger | Status | Notes |
|---|---|---|---|---|---|---|
| 37 · 팀 승인·문의 확인 상태 (103:1841) | GSM Connect 팀이 승인됐어요 | 103:1845 | — | — | MISSING | Approving only flips status. No dialog or banner on the team page, only a static demo notification "GSM Connect 팀이 승인됐습니다" (entities/notification/api/notifications.ts:35) |
| 37 (103:1841) | 팀 승인 거절 | 103:1863 | TeamsHomePage getStatusMessage banner (:545); TeamSettingsPage banner (:445) | Admin /admin/team-approvals → enter reason → 거절, then student /teams/demo-team | PARTIAL | Danger banner with the reason, not a modal. Missing the "팀원과 보낸 초대가 해제됐고, 팀은 7일 뒤 삭제됩니다" line |
| 37 (103:1841) | 해체 요청 취소 | 103:1878 | DemoTeamDisbandRequest pending branch (features/settings/demo-account/ui/DemoTeamWithdrawalActions.tsx:40-43) | /teams/demo-team/settings → 해체 요청 (type name) → button becomes 요청 취소 → click | OK† | Copy matches |
| 38 · 조회·빈 상태·삭제 안내 (103:1983) | 아직 속한 팀이 없어요 | 103:1987 | TeamsHomePage `empty` branch (:709-725) | Seed always has a team. Reach it via settings → 팀장 넘기기 → 팀 탈퇴 → /teams, or after an admin approves disband | OK† | Copy and both CTAs (팀 사용법, 팀 만들기) match. Only reachable after several steps |
| 38 (103:1983) | 초대 링크를 사용할 수 없어요 | 103:2010 | TeamInvitationAcceptPage inline ErrorMessage (:496) | /teams/invitations/accept?token=bogus → 초대 수락 (or reuse a consumed token) | PARTIAL | Inline alert "이 초대는 만료되었거나 이미 사용 또는 취소되었습니다." instead of a modal; copy differs |
| 40 · 팀 관리 확인 (103:2091) | 팀원 초대 | 103:2095 | — (inline form TeamSettingsPage:477-484) | — | MISSING | No invite dialog and no account lookup (오세린 · 1학년 2반 5번). Clicking 초대 보내기 sends at once |
| 40 (103:2091) | 계정 못 찾음 | 103:2122 | — | — | MISSING | inviteDemoTeamMember accepts any valid email. Only the format error "학교 이메일을 입력해 주세요." exists |
| 40 (103:2091) | 팀장 넘기기 | 103:2142 | TransferDemoTeamLeader (DemoTeamWithdrawalActions.tsx:8-28) | settings → 한도윤 row → 팀장 넘기기 (:467) | OK† | Copy matches |
| 40 (103:2091) | 팀원 제외 | 103:2166 | DemoTeamMemberAction action=remove (:110) | settings → 윤채원 row → 팀에서 제외 (:462) | OK† | Says "이 팀원이 만든 VM", where Figma has "윤채원이 만든 VM" (minor) |
| 40 (103:2091) | 마지막 팀원 탈퇴 불가 | 103:2187 | LeaveDemoTeam onlyMember branch (:74-83) | settings → remove both members → 팀 탈퇴 (enabled only for a sole leader, :539) | OK† | Includes the 해체 요청 shortcut |
| 40 (103:2091) | 팀 해체 요청 (typed confirm) | 103:2220 | DemoTeamDisbandRequest (:30-64) | settings → 해체 요청 (:540) | OK† | Lists VMs + DB/함수/앱 counts. Confirm is enabled only after typing the team name |
| 40 (103:2091) | DevOps 역할 부여 | 103:2252 | DemoTeamMemberAction action=grant (:107) | settings → 윤채원 row → DevOps 부여 | OK† | Copy matches |
| 41 · 할당량·권한 상태 (104:1772) | 할당량 늘리기 요청 | 104:1851 | features/team/request-quota/ui/TeamQuotaRequestDialog.tsx | Approved team → /teams/demo-team/settings → 할당량 늘리기 요청 (:519) | OK† | 요청 등급 SelectField + 사유. Only on settings, never over team home (see 32-03) |

#### Flows
| Flow frame | Node | Transition specified | Code behavior | Status |
|---|---|---|---|---|
| 24 · 팀 만들기 | 203:59392 | entry: sidebar 팀 만들기 / empty-state 팀 만들기 → 24 | StudentSidebar 팀 만들기 → onCreateTeam → /teams/new. The empty-state CTA and Apps pages also link there | OK† |
| 24-01 · 팀 만들기 · 로딩 | 741:56631 | page loading skeleton | TeamCreatePage has no loading render. Suspense fallback={null} (router.tsx:141) | MISSING |
| 24-02 · 팀 만들기 · 오류 | 747:63527 | page load error state | No page-level error state. A failed team-list load is swallowed into [] (:241). The demo create never fails | MISSING |
| 24-03 · 팀 만들기 · 호버 · 팀 만들기 | 241:28865 | click 팀 만들기 → 25 승인 대기 | submit → createDemoTeamRequest → navigate /teams/demo-team-N (pending banner) (:274) | OK† |
| 25 · 팀 승인 대기 | 203:59572 | entry: after creating (24-03) or 팀 → pending team | /teams/:id renders the pending state (seed demo-team is pending) | OK† |
| 25-01 · 팀 승인 대기 · GSM Connect 팀이 승인됐어요 | 203:59780 | approved dialog over 25 | Nothing is shown on approval | MISSING |
| 25-02 · 팀 승인 대기 · 팀 승인이 거절됐어요 | 203:60009 | rejection dialog over 25 | Admin reject → danger banner with reason on home/settings; no modal | PARTIAL |
| 25-03 · 팀 승인 대기 · 로딩 | 741:56812 | loading skeleton | TeamsHome SkeletonStack (:729-743). Shows only briefly while the demo dynamic import resolves; no demo delay | OK† |
| 25-04 · 팀 승인 대기 · 오류 | 747:63729 | load error | /teams/<unknown-id> → getDemoTeam undefined → ErrorCard + 팀 목록 (:744-752) | OK† |
| 25-05 · 팀 승인 대기 · 호버 · 팀원 초대 | 241:29051 | click 팀원 초대 → invite (33 / 33-01) | navigate /teams/:id/settings (:782), which has the inline invite form; no dialog | OK† |
| 32 · 팀 홈 | 203:60233 | entry: sidebar 팀 / scope menu → 32 | StudentShell team → teamPath ?? /teams. Scope options navigate /teams/:id. TeamsHome passes activeItem="home", so 팀 is not highlighted | OK† |
| 32-01 · 팀 홈 · 범위 선택 펼침 | 204:23599 | scope selector open | StudentTopbar ScopeMenu listbox (widgets/student-shell/ui/StudentTopbar.tsx:428-449) | OK† |
| 32-02 · 팀 홈 · 아직 속한 팀이 없어요 | 203:60467 | empty state | `empty` branch. Reachable only after transferring leadership and leaving (or a disband approval) | OK† |
| 32-03 · 팀 홈 · 할당량 늘리기 요청 | 203:60746 | quota-request dialog over 32 | Home button navigates to /teams/:id/settings?tab=quota (:800). `tab` is ignored and no dialog opens; user must click again on 33 | WRONG-DESTINATION |
| 32-04 · 팀 홈 · 요청 등급 선택 펼침 | 204:25695 | 요청 등급 dropdown open in quota dialog | SelectField listbox inside TeamQuotaRequestDialog works, but the dialog lives on 33, not over 32 | OK† |
| 32-05 · 팀 홈 · 로딩 | 741:58380 | loading skeleton | SkeletonStack (:729-743), brief only | OK† |
| 32-06 · 팀 홈 · 오류 | 747:65563 | load error | /teams/<unknown-id> → ErrorCard | OK† |
| 32-07 · 팀 홈 · 호버 · 할당량 늘리기 요청 | 241:30729 | click 할당량 늘리기 요청 → 32-03 dialog | navigates to settings?tab=quota, no dialog. Button shown only for approved + leader (settings also allows DevOps) | WRONG-DESTINATION |
| 33 · 팀 설정 | 203:61011 | entry: 팀 홈 팀 설정 / sidebar 설정 | TeamsHome 팀 설정 → /teams/:id/settings (:780). StudentShell settings → teamPath/settings | OK† |
| 33-01 · 팀 설정 · 팀원 초대 | 203:61283 | invite dialog with student lookup | Inline form only; sends immediately | MISSING |
| 33-02 · 팀 설정 · 초대할 계정을 찾지 못했어요 | 203:61580 | account-not-found dialog/error | No not-found case in demo | MISSING |
| 33-03 · 팀 설정 · DevOps 역할을 줄까요? | 203:61872 | DevOps 부여 → confirm dialog | DemoTeamMemberAction grant | OK† |
| 33-04 · 팀 설정 · 한도윤에게 팀장을 넘길까요? | 203:62164 | 팀장 넘기기 → confirm | TransferDemoTeamLeader | OK† |
| 33-05 · 팀 설정 · 윤채원을 팀에서 제외할까요? | 203:62458 | 팀에서 제외 → confirm | DemoTeamMemberAction remove | OK† |
| 33-06 · 팀 설정 · 마지막 팀원은 탈퇴할 수 없어요 | 203:62750 | sole member 팀 탈퇴 → blocked dialog | LeaveDemoTeam onlyMember (after removing the others) | OK† |
| 33-07 · 팀 설정 · 팀 해체를 요청할까요? | 203:63052 | 해체 요청 → typed-confirm dialog | DemoTeamDisbandRequest | OK† |
| 33-08 · 팀 설정 · 해체 요청을 취소할까요? | 203:63351 | 요청 취소 → confirm | DemoTeamDisbandRequest pending branch | OK† |
| 33-09 · 팀 설정 · 로딩 | 741:58650 | loading skeleton | LoadingCard ×3 (:426-427), brief only | OK† |
| 33-10 · 팀 설정 · 오류 | 747:65875 | load error | /teams/<unknown-id>/settings → ErrorCard + 팀 목록 (:429) | OK† |
| 33-11 · 팀 설정 · 호버 · 초대 보내기 | 241:30969 | click 초대 보내기 → 33-01 invite dialog (or 33-02) | Submits inline and appends to 대기 중인 초대 without a dialog (:477, handleInvite) | WRONG-DESTINATION |
| 35 · 팀 초대 수락 | 407:31557 | entry: invitation email link → 35 | No in-app or mock entry; only a manual URL `/teams/invitations/accept?token=demo-invite-token` works | OK† |
| 35-01 · 팀 초대 수락 · 호버 · 초대 수락 | 407:31587 | click 초대 수락 → "초대 링크를 사용할 수 없어요" dialog | Valid token: accepts and goes to /teams/demo-team. Invalid/used token: inline alert (:496), not a modal | PARTIAL |

#### Counts
Product: 5 total (OK 4 / non-OK 1: PARTIAL 1). States panels: 13 total (OK 8 / non-OK 5: MISSING 3, PARTIAL 2). Flows: 32 total (OK 22 / non-OK 10: MISSING 5, WRONG-DESTINATION 3, PARTIAL 2). All OK rows are OK† (DEV build only on develop; prod mock needs PR #143/#144).

### Admin

Entry: `/__demo/role-selection?demo=1` → "관리자" → `selectDemoRole('admin')` returns `/admin/infra` (src/features/auth/select-demo-role/model/selectDemoRole.ts). Student shell profile menu also offers 관리자 전환 → `/admin/infra` (src/widgets/student-shell/ui/StudentProfile.tsx:220) when role=admin.
There are TWO admin shells: 26/28 use AdminInfrastructurePage's own sidebar (승인→/admin/team-approvals, 전체 VM→/admin/vms); 27/29/30/31 use `WorkflowLayout admin` (src/pages/demo-workflows/ui/WorkflowLayout.tsx:383-389) whose 승인→`/admin/database-approvals` (screen 49) and 전체 VM→`/admin/vms/demo-vm-1` (screen 31 detail, not the 28 list).

#### Product screens
| # | Figma frame | Node | Size | Route(s) | Component | Status | Notes |
|---|---|---|---|---|---|---|---|
| 26 | 관리자 인프라 현황 | 53:4985 | 1440x1361 | /admin/infra (also /admin → redirect) | src/pages/admin/AdminInfrastructurePage.tsx | OK | demo snapshot from entities/infra-node/demo.ts; node-01 has 14 VMs, node-03 offline banner |
| 27 | 관리자 승인 · 팀 | 101:5034 | 1440x1790 | /admin/team-approvals (demo-only) | src/pages/admin/AdminTeamApprovalsDemoPage.tsx | OK | 해체 요청 card only appears when a team has demoDisbandPending |
| 28 | 관리자 전체 VM | 54:2772 | 1440x1531 | /admin/vms | AdminInfrastructurePage.tsx (isAllVmsView) + AdminAllVmsContent.tsx | OK | tabs 전체/만료 임박/Node별, filters, detail card, 종료/재시작 |
| 29 | 관리자 문의 답변 | 54:3082 | 1440x1535 | /admin/inquiries (demo-only) | src/pages/admin/AdminInquiriesDemoPage.tsx | OK | default selection inquiry-1 (답변 완료) |
| 30 | 관리자 계정 점검 | 54:3328 | 1440x1482 | /admin/accounts (demo-only) | src/pages/admin/DemoAdminAccountsPage.tsx | OK | 졸업일 등록 rendered as inline card (see S panel) |
| 31 | 관리자 · VM 상세 | 54:3543 | 1440x1381 | /admin/vms/:vmId (demo-only; name, GRN or demo-vm-1) | src/pages/admin/DemoAdminVmDetailPage.tsx | OK | |

#### States & dialogs
| States frame (node) | Panel | Panel node | Component / state | Mock trigger | Status | Notes |
|---|---|---|---|---|---|---|
| S04 관리자 목적 위반 삭제 확인 (53:5670) | portfolio-api를 영구 삭제할까요? | 53:5674 | DemoAdminVmDetailPage `showDelete` → AdminDeleteDialog (reason Textarea + typed name) | /admin/vms/portfolio-api → "관리자 삭제" | OK | 영구 삭제 disabled until reason + exact name; on confirm adds owner notification, navigates /admin/vms |
| 103:1841 | GSM Connect 팀 해체를 승인할까요? | 103:1904 | AdminTeamApprovalsDemoPage `confirmDisband` AccountDialog | precondition: as student leader /teams/demo-team/settings → 해체 요청; then admin /admin/team-approvals → 해체 요청 card → "해체 승인" | OK | no seeded pending disband request, so card is hidden on a fresh demo session |
| 103:1841 | 기존 답변을 덮어쓸까요? | 103:1950 | AdminInquiriesDemoPage `showOverwrite` ModalSurface | /admin/inquiries (inquiry-1 answered, selected by default) → "새 답변으로 등록" | OK | |
| 104:2098 | 관리자로 지정 | 104:2201 | DemoAdminAccountsPage `grantOpen` AccountDialog (SelectField 사용자 + 사유) | /admin/accounts → "관리자 지정" | OK | only candidate 문가은 (교사) |
| 104:2098 | 관리자 권한 회수 | 104:2233 | DemoAdminAccountsPage `revokeTarget` AccountDialog | select an admin row → "권한 회수" (or 보호 규칙 card "권한 회수") | OK | seed has only self-admin 정서연 → revoke errors 'self'; a successful revoke needs granting 문가은 first. Design names 이도윤 (not in data) |
| 104:2098 | 비상 접근 설정 | 104:2258 | DemoAdminAccountsPage `emergencyDialog==='setup'` | /admin/accounts → "비상 접근 설정"; OTP 482 913 | OK | no QR image; extra demo OTP hint |
| 104:2098 | 졸업일 등록 | 104:2286 | inline Card + DateField in DemoAdminAccountsPage (graduationCardRef) | /admin/accounts → scroll to 졸업일 등록 card | PARTIAL | design is a modal dialog over scrim; code is an always-visible inline card, no dialog |
| 104:2098 | 졸업 전에 자료를 옮겨주세요 | 104:2308 | — | — | MISSING | `getDemoGraduationDate` is only read by DemoAdminAccountsPage; no student-facing D-30/D-7 notice, banner, dialog or notification anywhere (develop, PR #143, PR #144) |
| 690:3299 | 김지민의 GitHub 연결을 해제할까요? | 690:4292 | DemoAdminAccountsPage `confirm` AccountDialog (provider github) | /admin/accounts (김지민 selected by default) → GitHub "연결 강제 해제" | OK | |

#### Flows
| Flow frame | Node | Transition specified | Code behavior | Status |
|---|---|---|---|---|
| 26 · 관리자 인프라 현황 | 203:65853 | entry: role selection (admin) / sidebar 인프라 현황 → 26 | selectDemoRole → /admin/infra; both shells link 인프라 현황 → /admin/infra | OK |
| 26-01 · 로딩 | 741:57025 | 26 initial loading skeleton | LoadingCard renders only while the demo module is lazily imported (one frame); no demo delay or toggle (AdminInfrastructurePage.tsx:596-613,701) | UNREACHABLE |
| 26-02 · 오류 | 747:63970 | 26 page load error | ErrorCard only when the real API throws; demo branch never fails (:637-643,711) | UNREACHABLE |
| 26-03 · 호버 · VM 14개 보기 | 241:29265 | click node-01 "VM 14개 보기" → node VM list | toggleNodeVms expands the node's VM list inline (14 rows) (:910,924-931); doesn't open 28 with a Node filter | OK |
| 27 · 관리자 승인 · 팀 | 203:66099 | entry: sidebar 승인 → 27 | infra shell 승인 → /admin/team-approvals OK; WorkflowLayout 승인 → /admin/database-approvals (49), so you need the "팀" tab to reach 27 | OK |
| 27-01 · 할당량 등급 선택 펼침 | 204:25243 | open 할당량 등급 select menu | native `<select>` (WorkflowLayout Select) with 소형/중형/대형; opens the OS menu, not the design-system select menu | OK |
| 27-02 · GSM Connect 팀 해체를 승인할까요? | 203:66335 | 해체 승인 → confirm dialog | AccountDialog with team counts, 해체 승인 runs approveDemoTeamDisband; needs a disband request from the student side first | OK |
| 27-03 · 로딩 | 741:57253 | 27 loading state | page reads localStorage synchronously; Suspense fallback=null; no loading UI | MISSING |
| 27-04 · 오류 | 747:64261 | 27 load error | no load-error rendering (only save-failure notices) | MISSING |
| 27-05 · 호버 · 급식한입 | 241:29517 | click row 급식한입 → select it, approval form shows 급식한입 | row onClick sets selectedId; "급식한입 승인" card + 거절 card update | OK |
| 28 · 관리자 전체 VM | 203:66593 | entry: sidebar 전체 VM / 26 "전체 VM 보기" → 28 | infra shell → /admin/vms OK; 26 recent-failures "전체 VM 보기" → /admin/vms OK; WorkflowLayout 전체 VM → /admin/vms/demo-vm-1 (31), not 28 | OK |
| 28-01 · Node 필터 펼침 | 204:24617 | open Node SelectField menu | SelectField listbox: 모든 Node/node-01..03 (AdminAllVmsContent.tsx:431) | OK |
| 28-02 · 상태 필터 펼침 | 204:24929 | open 상태 SelectField menu | SelectField listbox built from row statuses (:434) | OK |
| 28-03 · 로딩 | 741:57483 | 28 loading | same lazy-import flash as 26-01; refresh banner only shows when a snapshot already exists | UNREACHABLE |
| 28-04 · 오류 | 747:64533 | 28 load error | error banner/ErrorCard only on real-API failure | UNREACHABLE |
| 28-05 · 호버 · meal-web | 241:29756 | click meal-web row → selected/details (next: 31) | RowSelect click only selects the row (detail card updates); "상세 열기"/"상세 관리" navigates to /admin/vms/<grn> → 31 | OK |
| 29 · 관리자 문의 답변 | 203:66861 | entry: sidebar 문의 답변 → 29 | both shells → /admin/inquiries | OK |
| 29-01 · 첫 답변 · 대기 중 문의 선택 | 364:37379 | click a pending inquiry → detail + empty 답변 작성 | row onClick select(); card title "답변 작성" for 대기 중 | OK |
| 29-02 · 첫 답변 · 답변 작성 중 | 365:30884 | type in the reply textarea | Textarea bound to `reply` | OK |
| 29-03 · 첫 답변 · 답변을 등록했어요 | 365:31097 | "답변 등록" → success state | saves, status → 답변 완료, success Alert "답변을 등록했습니다…"; notifies if isMine | OK |
| 29-04 · 기존 답변을 덮어쓸까요? | 203:67074 | answered inquiry → "새 답변으로 등록" → overwrite dialog | showOverwrite ModalSurface; "답변 덮어쓰기" keeps the old answer in replyHistory | OK |
| 29-05 · 로딩 | 741:57717 | 29 loading | synchronous localStorage read; no loading UI | MISSING |
| 29-06 · 오류 | 747:64795 | 29 load error | no load-error rendering | MISSING |
| 29-07 · 호버 · Domain 등록 후 HTTPS | 241:30027 | click inquiry "Domain 등록 후 HTTPS 접속이 안 됩니다" → 29-01 | row onClick selects inquiry-3 (대기 중) → 답변 작성 | OK |
| 30 · 관리자 계정 점검 | 688:50319 | entry: sidebar 관리자 점검 → 30 | both shells → /admin/accounts | OK |
| 30-01 · 관리자로 지정 | 203:67505 | "관리자 지정" → grant dialog | grantOpen AccountDialog | OK |
| 30-02 · 사용자 검색 펼침 | 204:26092 | open the 사용자 select in the grant dialog | SelectField listbox (one candidate); a plain select, no search | OK |
| 30-03 · 관리자 권한을 회수할까요? | 203:67728 | "권한 회수" → revoke dialog | revokeTarget AccountDialog; a successful revoke needs a second admin (grant first) | OK |
| 30-04 · 비상 접근 설정 | 203:67941 | "비상 접근 설정" → OTP dialog | emergencyDialog 'setup' | OK |
| 30-05 · 졸업일 등록 | 203:68155 | open 졸업일 등록 dialog | no dialog; inline card always visible ("회수 절차 검토" only scrolls to it) | MISSING |
| 30-06 · 졸업일 달력 펼침 | 204:25868 | date picker open inside the 졸업일 dialog | DateField calendar popover opens in the inline card (not in a dialog) | OK |
| 30-07 · 김지민의 GitHub 연결을 해제할까요? | 692:43852 | "연결 강제 해제" (GitHub) → confirm dialog | confirm AccountDialog; on confirm marks 연결 안 됨 + adds notification | OK |
| 30-08 · 로딩 | 741:57927 | 30 loading | no loading UI | MISSING |
| 30-09 · 오류 | 747:65026 | 30 load error | no load-error rendering | MISSING |
| 30-10 · 호버 · 연결 강제 해제 | 692:44009 | click GitHub "연결 강제 해제" → 30-07 | showDisconnect('github') opens dialog | OK |
| 31 · 관리자 · VM 상세 | 203:68367 | entry: 28 row "상세 열기" → 31 | navigate(`/admin/vms/${grn}`) (AdminInfrastructurePage.tsx:828); detail resolves by GRN | OK |
| 31-01 · portfolio-api를 영구 삭제할까요? | 203:68654 | "관리자 삭제" → reason + typed-name dialog | AdminDeleteDialog; copy, both fields and the disabled hint match | OK |
| 31-02 · 로딩 | 741:58162 | 31 loading | synchronous; no loading UI | MISSING |
| 31-03 · 오류 | 747:65296 | 31 load error | only a "삭제되었거나 찾을 수 없습니다" not-found card (shown after a delete or for a bad id); no load-error state | MISSING |
| 31-04 · 호버 · 명령어 복사 | 241:30435 | "명령어 복사" → copy + feedback | clipboard write + success Alert "SSH 명령어을 복사했습니다." (Korean particle bug: 을 vs 를) | OK |

#### Counts
Product: 6 total (OK 6 / non-OK 0); States panels: 9 total (OK 7 / non-OK 2: 1 PARTIAL, 1 MISSING); Flows: 40 total (OK 27 / non-OK 13: MISSING 9, UNREACHABLE 4)

### Docs/Support/Status/CLI

#### Product screens
| # | Figma frame | Node | Size | Route(s) | Component | Status | Notes |
|---|---|---|---|---|---|---|---|
| 20 | Docs와 FAQ | 53:3283 | 1440x1318 | /help | src/pages/docs/AuthenticatedDocsPage.tsx | OK | StudentShell activeItem=docs; develop calls real listMyTeams (PR #144 switches to demo teams) |
| 21 | 문의 | 53:3544 | 1440x1149 | /support/inquiries | src/pages/support/InquiryDemoPage.tsx (demo-workflows/routes.tsx:27) | OK | DemoOnlyGate + WorkflowLayout activeStudentItem=support |
| 39 | 공개 Docs · 비로그인 | 131:5473 | 1440x1462 | /docs | src/pages/docs/PublicDocsPage.tsx | OK | Signed-out allowed by DemoSessionGate; code adds a "로그인하면 내 VM의 만료일…" notice card not in the design |
| 40 | 서비스 상태 · 공개 | 131:5725 | 1440x1765 | /status | src/pages/status/PublicStatusPage.tsx | OK | Demo data is mock-mode-only and the login badge is 'up' (#144). The two notices (Serverless 지연 + 예정 점검) are in the base frame too |
| 41 | CLI 로그인 승인 | 131:6232 | 1440x1080 | /cli/approve?code=WDJB-MJHT (from /cli) | src/pages/auth/CliLoginApprovalDemoPage.tsx | OK | Signed-in + matching code. PR #143 moves layout to CliLoginFrame.tsx |

#### States & dialogs
| States frame (node) | Panel | Panel node | Component / state | Mock trigger | Status | Notes |
|---|---|---|---|---|---|---|
| 131:7906 | 로그인하면 승인 화면으로 돌아옵니다 | 131:7910 | `src/pages/auth/CliLoginApprovalDemoPage.tsx` `!student` state | Signed out → /cli/approve?code=WDJB-MJHT | OK | (#143) |
| 131:7906 | 코드를 입력하세요 | 131:7925 | `CliCodeForm` | Open /cli | OK | (#143) |
| 131:7906 | 코드를 찾을 수 없습니다 | 131:7947 | `CliCodeForm` error state | /cli → wrong code → 다음 | OK | (#143) |
| 131:7906 | 승인했습니다 | 131:7971 | `src/pages/auth/CliLoginApprovalDemoPage.tsx` outcome state | /cli/approve signed in → 승인 | OK | Verified after #143: no longer shows 이미 처리된 코드. Copy aligned (터미널로 돌아가세요… / 계정 설정 › 연결된 CLI 기기) |
| 131:7906 | 요청을 거부했습니다 | 131:7996 | `src/pages/auth/CliLoginApprovalDemoPage.tsx` outcome state | … → 거부 | OK | Verified after #143; 문의하기/모든 기기에서 로그아웃 icons added |
| 131:7906 | 코드가 만료됐습니다 | 131:8017 | `src/pages/auth/CliLoginApprovalDemoPage.tsx` expired state | `/cli/approve?code=WDJB-MJHT&demoError=cli-expired` (or `/cli?demoError=cli-expired` → enter code), or wait ~9 min | OK | |
| 131:7906 | 이미 처리된 코드입니다 | 131:8034 | Title "이미 처리된 코드입니다" when status is 승인 완료/거부됨 | Approve or reject, then reload /cli/approve?code=… | OK | PR #143 aligns the body copy and adds 닫기 |
| 131:7906 | 내 VM 사용 기간 | 131:8046 | PublicDocsPage signed-in LoginNotice | Signed-in demo student → /docs | OK | (#144) |
| 131:7906 | 문서가 도움이 되지 않았습니까? | 131:8069 | PublicDocsPage FeedbackDialog | /docs → 아니요 | OK | (#144) |
| 131:7906 | VM Network·접속 장애 | 131:8100 | statusScenarios['network-outage'] | /status?status=network-outage | OK | URL trigger (server-driven state in production) |
| 131:7906 | VM 생성 점검 중 | 131:8108 | statusScenarios.maintenance | /status?status=maintenance | OK | URL trigger |
| 131:7906 | 모든 서비스가 정상입니다 | 131:8115 | statusScenarios.normal | /status?status=normal | OK | URL trigger |
| 37 팀 승인·문의 확인 상태 (103:1841) | 이 질문을 삭제하시겠습니까? | 103:1927 | InquiryDemoPage `pendingDelete` ModalSurface (:193-206) | /support/inquiries → row "질문 삭제" | OK | Shows 답변 완료 · 관리자 답변 N건 |
| 38 조회·빈 상태·삭제 안내 (103:1983) | 아직 등록한 질문이 없습니다 | 103:2025 | InquiryDemoPage EmptyInquiryState (:183-186) | Delete both seeded questions (inquiry-2, inquiry-5) | OK | Copy matches |
| 43 계정·관리자 설정 (104:2098) | CLI 로그인 승인 | 104:2164 | CliLoginApprovalDemoPage pending state (코드/기기/로그인 계정) | /cli → WDJB-MJHT → /cli/approve (signed in) | OK | |

#### Flows
| Flow frame | Node | Transition specified | Code behavior | Status |
|---|---|---|---|---|
| 20 · Docs와 FAQ | 203:56415 | entry: sidebar Docs → /help | StudentShell docs:'/help' (StudentShell.tsx:118); also Docs links on home/serverless | OK |
| 20-01 · 호버 · Instance | 241:28202 | click topic "Instance" → Instance doc | All topic tabs are buttons that switch the article (banner + 순서 card) in `src/pages/docs/AuthenticatedDocsPage.tsx`; hash kept for deep links | OK |
| 21 · 문의 | 203:56638 | entry: sidebar 문의 / Docs 문의하기 → /support/inquiries | `isDemoMode()` gating (#144) | OK |
| 21-01 · 관련 VM 선택 펼침 | 204:24381 | open 관련 VM select | Native `<select>` (WorkflowLayout Select) opens the OS list | OK |
| 21-02 · 아직 등록한 질문이 없어요 | 203:56812 | empty list state | Reachable after deleting all of my questions | OK |
| 21-03 · 이 질문을 삭제할까요? | 203:57007 | 질문 삭제 → confirm dialog | pendingDelete modal; the overlay's stray "삭제 사유와 정확한 VM 이름을 입력해 주세요." input is not implemented (likely leftover in the design) | OK |
| 21-04 · 로딩 | 741:56200 | page loading skeleton | `simulateDemoRequest('inquiries')` → two LoadingCards (`src/pages/support/InquiryDemoPage.tsx`) | OK |
| 21-05 · 오류 | 747:63033 | page load error | `?demoError=inquiries` → two ErrorCards; 다시 시도 loads the list | OK |
| 21-06 · 호버 · 질문 등록 | 241:28429 | 질문 등록 → question added | submit() validates 1~500 chars, prepends row, success Alert | OK |
| 39 · 공개 Docs · 비로그인 | 203:68976 | entry: /status header Docs, direct /docs | Status page Docs button `location.assign('/docs')`; signed-out allowed | OK |
| 39-01 · 내 VM 사용 기간 | 203:69202 | signed-in /docs shows VM expiry block | (#144) | OK |
| 39-02 · 문서가 도움이 되지 않았나요? | 203:69448 | 아니요 → feedback dialog | (#144) | OK |
| 39-03 · 호버 · SSH로 접속하기 | 241:32240 | click nav "SSH로 접속하기" → SSH doc | Nav item opens the SSH article (`#ssh-steps`) in `src/pages/docs/PublicDocsPage.tsx` | OK |
| 40 · 서비스 상태 · 공개 | 203:69700 | entry: sidebar 서비스 상태 / Docs header link | onOpenStatus → navigate('/status'); HeaderLink href=/status | OK |
| 40-01 · VM Network·접속 장애 | 203:70207 | outage banner state | ?status=network-outage | OK |
| 40-02 · VM 생성 점검 중 | 203:70723 | maintenance banner state | ?status=maintenance | OK |
| 40-03 · 모든 서비스가 정상이에요 | 203:71238 | all-normal banner state | ?status=normal | OK |
| 40-04 · 호버 · GSM SV 열기 | 241:32472 | GSM SV 열기 → app home | `window.location.assign('/')` (signed out → /login via gate) | OK |
| 41 · CLI 로그인 승인 | 203:71758 | entry: /cli enter code → /cli/approve?code= | Entry submit navigates to approve (develop sends signed-out users to /login?returnTo first) | OK |
| 41-01 · 로그인하면 승인 화면으로 돌아와요 | 203:71834 | signed-out approve → login prompt | (#143) | OK |
| 41-02 · 코드를 입력하세요 | 203:71924 | /cli code form | (#143) | OK |
| 41-03 · 코드를 찾을 수 없어요 | 203:72018 | wrong code → not-found | (#143) | OK |
| 41-04 · 승인했어요 | 203:72111 | 승인 → success state | Outcome state, copy aligned | OK |
| 41-05 · 요청을 거부했어요 | 203:72211 | 거부 → rejected state | Outcome state | OK |
| 41-06 · 코드가 만료됐어요 | 203:72305 | expired code state | `?demoError=cli-expired` (carried from /cli to approve) | OK |
| 41-07 · 이미 처리된 코드예요 | 203:72397 | reused code state | Reload approve after a decision → title "이미 처리된 코드입니다" | OK |
| 41-08 · 호버 · 승인 | 241:32985 | 승인 → 41-04 승인했어요 | Verified | OK |

#### Counts
Product: 5 total (OK 5); States panels: 15 total (OK 15); Flows: 27 total (OK 27). Updated by `codex/figma-auth-shell-docs`.

### Account/Settings

#### Product screens
| # | Figma frame | Node | Size | Route(s) | Component | Status | Notes |
|---|---|---|---|---|---|---|---|
| 23 | 계정 설정 | 53:3934 | 1440x2069 | `/settings` | `src/pages/settings/DemoAccountSettingsPage.tsx` (via `AccountSettingsPage.tsx`) | OK | Loaded via `isDemoMode()` (DEV gate removed in #144) |

#### States & dialogs
| States frame (node) | Panel | Panel node | Component / state | Mock trigger | Status | Notes |
|---|---|---|---|---|---|---|
| 48 · 계정 정보·연결·탈퇴 상태 (690:3299) | JPG, PNG, WebP만 올릴 수 있어요 | 690:3623 | `ProfilePhotoErrorDialog` kind format | 사진 변경 → pick .heic (switch picker to all files) | OK | — |
| 690:3299 | 이미지 파일이 아니에요 | 690:3661 | `ProfilePhotoErrorDialog` | pick a non-image file renamed .png | OK | — |
| 690:3299 | 2 MB보다 큰 사진이에요 | 690:3699 | `ProfilePhotoErrorDialog` | pick a >2MB JPG | OK | — |
| 690:3299 | 프로필 사진을 지울까요? | 690:3766 | `DemoAccountPhoto` delete dialog | save a photo, then 사진 삭제 | OK | — |
| 690:3299 | GitHub로 이동하고 있어요 | 690:3802 | `DemoAccountConnections` `github-progress` | GitHub 해제 (seed is connected), then 연결 | OK | Auto-advances after 900ms |
| 690:3299 | GitHub를 연결했어요 | 690:3831 | `github-success` | after progress | OK | — |
| 690:3299 | GitHub를 연결하지 못했어요 | 690:3895 | `github-error` | `/settings?github=expired` → 연결 | OK | URL toggle |
| 690:3299 | 이미 다른 계정에 연결된 GitHub 계정이에요 | 690:3931 | `github-conflict` | `/settings?github=conflict` → 연결 | OK | URL toggle |
| 690:3299 | GitHub 연결을 해제할까요? | 690:3967 | `github-unlink` | GitHub row 해제 | OK | — |
| 690:3299 | Discord 연결을 해제할까요? | 690:4032 | `discord-unlink` | connect Discord, then 해제 | OK | — |
| 690:3299 | 팀 해체를 먼저 요청해 주세요 | 690:4068 | `DemoAccountWithdrawal` `only-member` | create a team (`/teams/new`, member_count 1) → 계정 탈퇴 | OK | — |
| 690:3299 | 마지막 관리자는 탈퇴할 수 없어요 | 690:4109 | `DemoAccountWithdrawal` `last-admin` | role-select 관리자 → `/settings` (URL) → 계정 탈퇴 | OK | Seed has one 관리자 account |
| 690:3299 | 팀장 역할을 넘겨 주세요 | 690:4167 | `team-lead` | student (GSM Connect 팀장) → 계정 탈퇴 | OK | — |
| 690:3299 | 계정을 탈퇴할까요? | 690:4204 | `DeleteConfirmDialog` (confirm step) | 팀장 dialog → 넘기지 않고 계속 | OK | — |
| 690:3299 | 탈퇴했어요 | 690:4229 | `DemoAccountWithdrawal` done | confirm 탈퇴 | OK | — |
| 690:3299 | 김지민의 GitHub 연결을 해제할까요? | 690:4292 | `DemoAdminAccountsPage` confirm (`:233`) | admin → 계정 → select 김지민 → GitHub 연결 강제 해제 | OK | Admin-side |
| 46 · 계정 연결·함수 호출 상태 (128:2316) | Discord 연결 | 128:2320 | `discord-connect` | Discord row 연결 | OK | — |
| 128:2316 | Discord를 연결했어요 | 128:2341 | `discord-success` | Discord로 이동 | OK | — |
| 128:2316 | Discord를 연결하지 못했어요 | 128:2365 | `discord-error` | `/settings?discord=expired` → 연결 → Discord로 이동 | OK | URL toggle |
| 128:2316 | 모든 기기에서 로그아웃 | 128:2386 | `cli-logout` | 모든 기기에서 로그아웃 button (or from CLI 기기 dialog) | OK | Confirm signs out → `/login` |
| 36 · 실행·프로필 입력 상태 (53:4422) | 프로필 사진 자르기 | 53:4457 | `ProfilePhotoCropDialog` | 사진 변경 → valid JPG/PNG/WebP ≤2MB | OK | — |
| 53:4422 | 이 사진은 업로드할 수 없어요 | 53:4494 | `ProfilePhotoErrorDialog` `format-and-size` | pick a GIF >2MB | OK | — |
| 43 · 계정·관리자 설정 (104:2098) | 연결된 CLI 기기 | 104:2148 | `cli-devices` | CLI 기기 row 관리 | OK | PR #144 also opens it via `?tab=cli` |

#### Flows
| Flow frame | Node | Transition specified | Code behavior | Status |
|---|---|---|---|---|
| 23 · 계정 설정 | 203:57203 | entry: sidebar 설정 / profile 계정 설정 → 23 | Sidebar `settings` → `/settings`; profile panel 계정 설정 → `/settings` | OK |
| 23-01 · 프로필 사진 자르기 | 203:57453 | 사진 변경 + valid file → crop dialog | `ProfilePhotoCropDialog` | OK |
| 23-02 · 이 사진은 업로드할 수 없어요 | 203:57765 | invalid format+size → error dialog | `format-and-size` dialog | OK |
| 23-03 · 이미지 파일이 아니에요 | 692:41528 | fake .png → error | Error dialog | OK |
| 23-04 · 2 MB보다 큰 사진이에요 | 692:41692 | >2MB → error | Error dialog | OK |
| 23-05 · 프로필 사진을 지울까요? | 692:41856 | 사진 삭제 → confirm | Confirm (needs a photo saved first) | OK |
| 23-06 · GitHub로 이동하고 있어요 | 692:42019 | 연결 → progress | `github-progress` (seed connected; 해제 first) | OK |
| 23-07 · GitHub를 연결했어요 | 692:42181 | progress → success | Auto after 900ms | OK |
| 23-08 · GitHub를 연결하지 못했어요 | 692:42344 | progress → error | Only with `?github=expired` | OK |
| 23-09 · 이미 다른 계정에 연결된 GitHub 계정이에요 | 692:42507 | progress → conflict | Only with `?github=conflict`; 다른 계정으로 retries | OK |
| 23-10 · GitHub 연결을 해제할까요? | 692:42670 | 해제 → confirm | `github-unlink` | OK |
| 23-11 · Discord 연결 | 203:58043 | 연결 → Discord dialog | `discord-connect` | OK |
| 23-12 · Discord를 연결했어요 | 203:58313 | Discord로 이동 → success | `discord-success` | OK |
| 23-13 · Discord를 연결하지 못했어요 | 203:58586 | → error | Only with `?discord=expired` | OK |
| 23-14 · Discord 연결을 해제할까요? | 692:42833 | 해제 → confirm | `discord-unlink` | OK |
| 23-15 · 연결된 CLI 기기 | 203:58855 | 관리 → devices dialog | `cli-devices` lists MacBook-Air / lab-pc-12 | OK |
| 23-16 · 모든 기기에서 로그아웃할까요? | 203:59122 | button → confirm | `cli-logout`; confirm → `/login` | OK |
| 23-17 · 팀 해체를 먼저 요청해 주세요 | 692:42996 | 계정 탈퇴 (sole-member team) → blocker | `only-member` (create a team first) | OK |
| 23-18 · 마지막 관리자는 탈퇴할 수 없어요 | 692:43160 | admin 계정 탈퇴 → blocker | `last-admin` (admin session at `/settings`) | OK |
| 23-19 · 팀장 역할을 넘겨 주세요 | 692:43322 | 팀장 계정 탈퇴 → handoff prompt | `team-lead`; 팀장 넘기기 → team settings | OK |
| 23-20 · 계정을 탈퇴할까요? | 692:43486 | → final confirm | `DeleteConfirmDialog` with email confirmation | OK |
| 23-21 · 탈퇴했어요 | 692:43690 | confirm → done | Done dialog → 로그인 화면으로 | OK |
| 23-22 · 로딩 | 741:56357 | settings loading skeleton | `simulateDemoRequest('settings')` latency → loading cards 150 / 330×2 / 200 / 384 / 328 with the upload guide (`DemoAccountSettingsPage.tsx`) | OK |
| 23-23 · 오류 | 747:63204 | settings load error | `?demoError=settings` → same layout with ErrorCards (first one compact); 다시 시도 succeeds (`DemoAccountSettingsPage.tsx`) | OK |
| 23-24 · 호버 · 연결 | 241:28609 | 연결 → Discord 연결 (23-11) | Discord row 연결 → `discord-connect` (GitHub row shows 해제 because the seed is connected) | OK |

#### Counts
Product: 1 total (OK 1 / non-OK 0); States panels: 23 (OK 23 / non-OK 0); Flows: 25 (OK 25 / non-OK 0), updated by `codex/figma-apps-account`

### Shell/navigation

#### Product screens
| # | Figma frame | Node | Size | Route(s) | Component | Status | Notes |
|---|---|---|---|---|---|---|---|
| — | (no Product frame assigned; the shell is in 03/23 frames) | — | — | all student routes | `src/widgets/student-shell/ui/StudentShell.tsx` | — | — |

#### States & dialogs
| States frame (node) | Panel | Panel node | Component / state | Mock trigger | Status | Notes |
|---|---|---|---|---|---|---|
| S01 · 검색·알림·프로필 패널 (53:2828) | 검색 | 53:2832 | `ResourceSearchPanel` | topbar search | OK | Demo source (#144) |
| 53:2828 | 검색 결과가 없어요 | 53:2855 | `ResourceSearchPanel` isEmpty | non-matching query | OK | (#144) |
| 53:2828 | 알림 (2 unread) | 53:2877 | `NotificationPanel` | topbar 알림 | OK | Copy "알림을 누르면 관련 화면으로 이동합니다"; demo items navigate by kind (`getDemoNotificationPath`) |
| 53:2828 | 알림 (all read) | 53:2910 | `NotificationPanel` unreadCount 0 | 모두 읽음 | OK | 50개·15일 footnote and "읽지 않은 알림이 없습니다." added |
| 53:2828 | 김지민 · 일반 사용자 | 53:2941 | `StudentProfile` panel | topbar profile | OK | 관리자로 전환 now switches the demo role before opening `/admin/infra` |
| S03 · 공통 예외·이탈 확인 (53:3152) | 다시 로그인해 주세요 | 53:3156 | `src/widgets/student-shell/ui/GlobalStateDialogs.tsx` | `?demoError=session` | OK | DataGSM으로 로그인 → `/login?returnTo=<current>`; login returns there |
| 53:3152 | 요청이 너무 많아요 | 53:3171 | `src/widgets/student-shell/ui/GlobalStateDialogs.tsx` | `?demoError=rate-limit` | OK | 24s countdown button |
| 53:3152 | 찾을 수 없어요 | 53:3191 | `src/pages/not-found/NotFoundPage.tsx` | any unknown path (normal + mock) | OK | `*` route + root `errorElement` for 404 |
| 53:3152 | 연결이 끊겼어요 | 53:3206 | `src/widgets/student-shell/ui/GlobalStateDialogs.tsx` | browser offline / `?demoError=offline` | OK | |
| 53:3152 | 이전 작업이 진행 중이에요 | 53:3221 | `VmOverviewPage` powerDialog `restart-progress` | `/vms/:id` restart while an operation is running | OK | VM-specific, not a shared component |
| 53:3152 | 작성 중인 내용이 사라져요 | 53:3261 | `shared/ui/feedback/UnsavedChangesDialog` | leave `/settings` with an unsaved photo draft or notification change; shell nav with `hasUnsavedInput` | OK | — |

#### Flows
| Flow frame | Node | Transition specified | Code behavior | Status |
|---|---|---|---|---|
| (shell flows are the 03-01…03-06 rows under Auth/Home) | — | — | — | — |

#### Counts
Product: 0; States panels: 11 (OK 11); Flows: 0 (covered under Auth/Home). Updated by `codex/figma-auth-shell-docs`.

## Gaps

Every non-OK item, grouped by domain, with the file(s) that would need to change. `PENDING-PR #143/#144` items are listed for completeness; they need no new work if those PRs merge as-is.

### Auth/Home

All gaps fixed in `codex/figma-auth-shell-docs` (re-verified after #143/#144):
- 04 / 03-02 / 03-03 / 03-09: already fixed by #143/#144.
- 03-07 VM을 만들지 못했어요: `?demoError=vm-create` (or `recordDemoVmCreateFailure` from `src/entities/home`) → banner in `src/pages/home/PersonalResourcesPage.tsx`.
- 03-10 연결이 끊겼어요: global dialog (`src/widgets/student-shell/ui/GlobalStateDialogs.tsx`), browser offline or `?demoError=offline`.
- 03-11 졸업 안내: admin graduation date within 30 days, or `?demoError=graduation`.
- 03-12/04-01 로딩, 03-13/04-02 오류: `simulateDemoRequest('home')`, `?demoError=home`.

### VM (part A: create, overview, monitoring, team VM)

- `52:2689` 인증 시간이 지났어요 — UNREACHABLE (left): rendered by `src/pages/auth/LoginPage.tsx` only after the real OAuth state-expiry redirect (`/login?error=OAUTH_STATE_INVALID`). Auth domain file, not changed here.
- All other part A gaps are fixed in `codex/figma-vm` (create-failure, validation dialog, quota/pool/permission dialogs, team extension states, deleted team VM lookup, loading/error frames). See the section above.

### VM (part B: Network, Snapshot, Settings)

- None. All part B gaps are fixed in `codex/figma-vm`.

### Serverless

- `698:3860` / `203:51053` 함수를 더 만들 수 없어요 — MISSING: no count-limit guard. At 3/3 "새 함수" is enabled and creating a 4th succeeds. Files: `src/pages/serverless/ServerlessListPage.tsx`, `src/pages/serverless/routes.tsx` (ServerlessCreateRoute), `src/entities/serverless/model/demoServerless.ts` (createDemoServerlessFunction)
- `53:4529` 함수를 5개 모두 사용하고 있어요 — MISSING: same missing guard. The design's limit (5) also conflicts with code (3) and with 698:3860 (3/3). Files: `src/entities/serverless/model/demoServerless.ts:136`
- `53:4382` / `203:55019` 함수 실행 중 오류 — MISSING: demo execution never fails. Files: `src/entities/serverless/model/demoServerless.ts` (executeDemoServerlessTest), `src/pages/serverless/ServerlessTestPage.tsx`
- `53:4426` / `203:55250` 실행 시간이 초과됐어요 — MISSING: no timeout path. Same files
- `698:3599` / `699:56339` 동시 실행 한도를 넘은 요청 — MISSING: no 429 banner. Files: `src/pages/serverless/ServerlessTriggersPage.tsx`
- `698:3685` / `699:53778`, `698:3703` / `699:53946` 오늘 실행 80%·한도 — MISSING: no list banners, and demo usage can't be raised. Files: `src/pages/serverless/ServerlessListPage.tsx`
- `698:3725` / `700:53198` 한도에 닿아서 실행하지 않았어요 — UNREACHABLE: modal exists, but executionsToday 1,284/10,000 has no demo toggle. Design is inline, code is a modal. Files: `src/pages/serverless/ServerlessTestPage.tsx:468`
- `698:3917` / `699:54821` 정지됐어요 · 3일 뒤 삭제돼요 — MISSING: no suspended state. Expiry banner is hardcoded "만료까지 7일". Files: `src/pages/serverless/ServerlessFunctionPage.tsx:413`
- `698:3939` / `699:55025` 일반 팀원으로 보고 있어요 — MISSING: team functions aren't routable (`getDemoServerlessFunction` filters teamId). Files: `src/entities/serverless/model/demoServerless.ts:133-135`, `routes.tsx`
- `698:3961` / `699:54597` TypeScript 오류로 저장하지 않았어요 — MISSING: code save has no validation. Files: `src/pages/serverless/ServerlessFunctionPage.tsx:484`, `routes.tsx` onSaveCode
- `53:4551` / `203:51439` 함수 정보를 확인해주세요 — PARTIAL: duplicate name is inline only, with no compile-error check or dialog. Files: `src/pages/serverless/ServerlessCreatePage.tsx`
- `103:2049` / `203:50819` 첫 번째 함수를 만들어보세요 — PARTIAL: generic empty notice copy, missing quota and runtime details. Files: `src/pages/serverless/ServerlessListPage.tsx:386`
- `60:1155` / `203:55926` 실행 Log가 없어요 — PARTIAL: routes.tsx passes no `emptyMessage`, so the default "실행 기록을 불러올 수 없습니다." (error-like) shows. Files: `src/pages/serverless/ServerlessLogsPage.tsx:343`, `routes.tsx` logs branch
- `741:54575` 13-05 로딩 — PARTIAL: summary skeletons exist, but the cards area shows the "아직 함수가 없습니다" empty notice while loading. Files: `ServerlessListPage.tsx:386`
- `747:61233` 13-06 오류 — UNREACHABLE: error caption appears only on a demo storage exception. Files: `ServerlessListPage.tsx:281`
- `741:54780` 14-02 로딩, `747:61473` 14-03 오류 — MISSING: lazy CreatePage has no Suspense or error UI. PR #144 doesn't cover the create route. Files: `routes.tsx`
- `741:54937`/`741:55135`/`741:55349`/`741:55534`/`741:55720`/`741:61067` 15–19·50 로딩 — PENDING-PR #144: develop has no Suspense or loading branch (lazy pages render with no boundary). PR #144 adds a LoadingCard via `ServerlessLoadState`. Files: `routes.tsx`
- `747:61644`/`747:61863`/`747:62098`/`747:62311`/`747:62539`/`747:68572` 15–19·50 오류 — UNREACHABLE: none on develop. PR #144's ErrorCard shows only when IndexedDB demo storage fails, with no demo failure toggle. Files: `routes.tsx`
- General — PENDING-PR #144: in a non-DEV build with `?demo=1`, the list page and the ServerlessShell team scope skip demo data (`import.meta.env.DEV &&` gate). PR #144 removes the gate. Files: `ServerlessListPage.tsx:265`, `widgets/serverless-shell/ui/ServerlessShell.tsx:14`

### Database

- `608:7781` 48 전用형 신청 — PARTIAL: seeded pending request means the base form (신청 enabled) never shows on first visit. Files: `src/entities/demo-workflows/model/demoData.ts:109-113`
- `610:2810` / `693:45983` 용량을 먼저 줄여 주세요 — UNREACHABLE: Create page uses listDemoDatabases/getDemoDatabaseQuota, which exclude quota-locked-db, so writeLocked/storage never trip. Files: `src/pages/database/DatabaseCreatePage.tsx:340,366`, `src/entities/database/model/demoDatabase.ts:244-273`
- `610:2893` / `693:46364` 발급하지 못했어요 — UNREACHABLE: no demo failure trigger. Files: `src/pages/database/DatabaseCreatePage.tsx:376-391`
- `610:2934` / `693:46554` PostgreSQL은 준비 중 — UNREACHABLE: demo mode lets PostgreSQL be selected and created. Files: `src/pages/database/DatabaseCreatePage.tsx:529-535`
- `610:3136` / `693:46997` 80% 넘게 — MISSING: no ≥80% banner on detail. Files: `src/pages/database/DatabaseDetailPage.tsx`
- `610:3154` / `693:47210` 쓰기가 막혔어요 — UNREACHABLE: banner exists (L346) but quota-locked-db is not listed or linked. Files: `src/entities/database/model/demoDatabase.ts:246`
- `610:3174` / `693:47421` 다시 쓸 수 있어요 — MISSING. Files: `src/pages/database/DatabaseDetailPage.tsx`
- `610:3197` / `693:47642` 정지됐어요 · 3일 뒤 삭제 — UNREACHABLE: banner exists (L347); suspended-welcome-db only by direct URL. Files: `src/entities/database/model/demoDatabase.ts:246`
- `610:3219` / `693:47843` 일반 팀원으로 보고 있어요 — MISSING on Database (connect-db grants all permissions). Files: `src/pages/database/DatabaseDetailPage.tsx`, `demoDatabase.ts:61`
- `610:3237` / `693:48064` 비밀번호 교체를 권해요 — MISSING. Files: `src/pages/database/DatabaseDetailPage.tsx`
- `610:3468` / `693:49201` 쓰기 금지 중이라 실행하지 않았어요 — UNREACHABLE: needs locked DB (direct URL only). Files: `src/pages/database/DatabaseQueryDemoPage.tsx:229-235,322`
- `610:3508` / `693:53450` 전용형 신청이 거절됐어요 — PARTIAL: shown as badge + Alert, no banner. Files: `src/pages/database/DedicatedDatabaseRequestPage.tsx:120-123`
- `693:53628` 48-05 호버 · 신청 — PARTIAL: button disabled by seeded pending request until admin rejects. Files: `DedicatedDatabaseRequestPage.tsx:98`
- `745:61653` 44-09 오류 — UNREACHABLE: demo error collapses into the not-found card. Files: `DatabaseDetailPage.tsx:142-152,327`
- `747:67157` 42-02, `747:67371` 43-07, `747:67556` 45-05 오류 — UNREACHABLE: only on a dynamic-import failure; no demo failure toggle. Files: `DatabaseListPage.tsx:271-285`, `DatabaseCreatePage.tsx:291-310`, `DatabaseQueryDemoPage.tsx:183-204`
- `741:60156` 45-04 로딩 — MISSING: no skeleton, only subtitle text. Files: `DatabaseQueryDemoPage.tsx:313`
- `741:60683` 48-03, `747:68125` 48-04, `741:60870` 49-01, `747:68333` 49-02 — MISSING: synchronous localStorage pages with no loading or error rendering. Files: `DedicatedDatabaseRequestPage.tsx`, `AdminDatabaseApprovalsDemoPage.tsx`
- Note (OK but weak): 45-01/45-02 trigger only by the undiscoverable SQL comments `-- demo:timeout` / `-- demo:row-cap`. The loading frames counted OK render only for the dynamic-import tick (no demo delay).

### Apps

All 12 gaps fixed in `codex/figma-apps-account` (status OK above). Loading frames now show for the demo latency (`useDemoAppRequest` in `src/pages/apps/DemoAppRequestState.tsx`, `simulateDemoRequest` in the list/create pages). Load errors are reachable with `?demoError=apps|apps-create|apps-overview|apps-app-settings|apps-deploy|apps-logs|apps-metrics|apps-variables|apps-service-settings|apps-domains|apps-shell`.
- Also fixed: the 665:3788 "일반 팀원" banner no longer shows to the leader of a pending team; 664:3461 and 664:3967 copy now matches Figma.
- Remaining notes (by design, OK): 664:3487 memory dialog only in team scope after approval; 665:3673 quota-exhausted banner needs manual memory exhaustion.

### Teams

- ALL team rows — PENDING-PR #143/#144 for production mock: develop gates every team mock branch on `import.meta.env.DEV`, so prod `?demo=1` hits the real API. Files: `src/pages/teams/*.tsx`, `src/widgets/student-shell/ui/StudentShell.tsx`
- `102:5230` 35 팀 초대 수락 — PARTIAL: placeholder "API가 없어 확인할 수 없습니다" for team/inviter even in demo; title copy differs; no mock entry point. Files: `src/pages/teams/TeamInvitationAcceptPage.tsx`
- `103:1845` / `203:59780` 팀 승인됐어요 — MISSING: no approved dialog/banner. Files: `src/pages/teams/TeamsHomePage.tsx`
- `103:1863` / `203:60009` 팀 승인 거절 — PARTIAL: banner, not a modal; missing the 7일 삭제 line. Files: `src/pages/teams/TeamsHomePage.tsx:545`
- `103:2010` / `407:31587` 초대 링크를 사용할 수 없어요 — PARTIAL: inline alert, not a modal; copy differs. Files: `src/pages/teams/TeamInvitationAcceptPage.tsx:496`
- `103:2095` / `203:61283` 팀원 초대 dialog — MISSING: inline form with no lookup or confirm. Files: `src/pages/teams/TeamSettingsPage.tsx:477`
- `103:2122` / `203:61580` 계정 못 찾음 — MISSING: demo invite never fails lookup. Files: `src/entities/team/demo.ts:192`
- `203:60746` 32-03, `241:30729` 32-07 할당량 늘리기 요청 — WRONG-DESTINATION: home button goes to `/settings?tab=quota` (tab ignored) instead of opening TeamQuotaRequestDialog over home. Files: `src/pages/teams/TeamsHomePage.tsx:800`
- `241:30969` 33-11 초대 보내기 — WRONG-DESTINATION: sends immediately, no 33-01 dialog. Files: `src/pages/teams/TeamSettingsPage.tsx`
- `741:56631` 24-01 로딩, `747:63527` 24-02 오류 — MISSING: TeamCreatePage has no loading or load-error render. Files: `src/pages/teams/TeamCreatePage.tsx`

### Admin

- `104:2308` 졸업 전에 자료를 옮겨주세요: MISSING. The admin-set graduation date (`admin.graduationDate`) is never shown to students; no notice, banner or notification. Files: `src/entities/demo-workflows/model/demoData.ts:204`, `src/pages/admin/DemoAdminAccountsPage.tsx`
- `104:2286` / `203:68155` 졸업일 등록: PARTIAL / MISSING. Design is a modal dialog; code is an inline card with no dialog trigger. Files: `src/pages/admin/DemoAdminAccountsPage.tsx`
- `741:57025`, `741:57483` 26/28 로딩: UNREACHABLE. The demo branch finishes right after the lazy import; no demo delay or toggle. Files: `src/pages/admin/AdminInfrastructurePage.tsx:596-613`
- `747:63970`, `747:64533` 26/28 오류: UNREACHABLE. ErrorCard/banner only on real-API error. Files: `src/pages/admin/AdminInfrastructurePage.tsx:637-711`
- `741:57253`, `741:57717`, `741:57927`, `741:58162` 27/29/30/31 로딩: MISSING. Demo pages read localStorage synchronously; Suspense fallback=null. Files: `src/pages/admin/*DemoPage.tsx`, `src/pages/admin/DemoAdminVmDetailPage.tsx`, `src/pages/demo-workflows/routes.tsx:15`
- `747:64261`, `747:64795`, `747:65026`, `747:65296` 27/29/30/31 오류: MISSING. No load-error rendering (31 has only a not-found card). Same files.
- (cross-cutting, affects entry to 27/28 from 29/30/31) WorkflowLayout admin sidebar: 승인 → `/admin/database-approvals` (49) instead of 27, and 전체 VM → `/admin/vms/demo-vm-1` (31 detail) instead of the 28 list. These pages also use a different shell (header, no notifications) from 26/28. Files: `src/pages/demo-workflows/ui/WorkflowLayout.tsx:383-389`
- (data, not blocking) 27-02 needs a student-side disband request first, because no seeded `demoDisbandPending`. 30-03 seed has only the self admin, so revoke shows the 'self' error unless you grant 문가은 first. Files: `src/entities/team/demo.ts:299`, `src/entities/demo-workflows/model/demoData.ts:122-131`

### Docs/Support/Status/CLI

All gaps fixed in `codex/figma-auth-shell-docs` (re-verified after #143/#144):
- 40: base frame includes both notices; gating/badge fixed by #144.
- 20-01 Instance: topic tabs switch articles (`AuthenticatedDocsPage.tsx`). 39-03 SSH: SSH article in `PublicDocsPage.tsx`.
- 21-04/21-05: `simulateDemoRequest('inquiries')`, `?demoError=inquiries` (`InquiryDemoPage.tsx`).
- CLI approve/reject verified (no 이미 처리된 코드); expired state via `?demoError=cli-expired`.
- Status scenarios stay URL-driven (`?status=`): in production they come from the status server, there is no student control that changes service health.

### Account/Settings

Both gaps fixed in `codex/figma-apps-account`: 23-22 loading (demo latency) and 23-23 error (`?demoError=settings`) in `src/pages/settings/DemoAccountSettingsPage.tsx`.

### Shell/navigation

All gaps fixed in `codex/figma-auth-shell-docs`:
- 찾을 수 없어요: `*` route + root `errorElement` (`src/pages/not-found/NotFoundPage.tsx`), normal and mock mode.
- 다시 로그인해 주세요 / 요청이 너무 많아요 / 연결이 끊겼어요: `GlobalStateDialogs` in the router root layout; `?demoError=session|rate-limit|offline` (offline also on the real browser event).
- Notification clicks now navigate in mock mode; 관리자로 전환 switches the demo role first.
