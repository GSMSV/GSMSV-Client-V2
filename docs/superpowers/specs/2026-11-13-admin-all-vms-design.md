# 관리자 전체 VM 화면 디자인 명세

## 의도

Figma 화면 28 (`54:2772`)의 관리자 전체 VM 목록을 기존 관리자 콘솔 안에 연결한다. 관리자는 VM 목록을 검색하고 Node·상태로 좁혀 보며, 한 행을 선택해 API가 제공하는 요약을 확인한다.

## 범위

- 기존 관리자 셸과 `listAdminResources`, `listInfraNodes`, `listNodeVms` 계약을 사용한다.
- 목록에 실제 계약 값만 표시한다: 이름, 소유자 이메일, Node, 상태, VMID/GRN, Node API의 분류.
- 계약에 없는 만료일, 사용 목적, CPU/RAM/SSD 상세는 `—` 또는 명시적인 미제공 상태로 표시한다.
- 화면 검색, Node/상태 필터, 페이지 이동, 선택 VM 요약은 클라이언트에서 동작한다.
- VM 상세 관리, 종료, 재시작은 UI에 남겨 두되 API가 없으므로 비활성화한다.
- 만료 임박 집계는 만료일 API가 없어 계산하거나 예시 수치로 대체하지 않는다.

## 제외

- Server/API/DB/배포 설정 변경
- Figma 변경
- API에 없는 VM 조작 또는 성공 상태 연출
- 임의 VM 샘플 데이터

## 접근

`/admin/vms`를 기존 `AdminInfrastructurePage` 셸과 조회 상태에 연결하고, 목록/선택 패널 UI를 페이지 내 하위 컴포넌트로 분리한다. 기존 shared UI controls, pagination, status badge, Octicons, styled-components theme을 재사용한다.

## 확인 기준

- 화면 배치와 카피는 Figma 노드 `54:2772`의 캡처 및 design context를 따른다.
- 로딩/권한 오류/일반 오류/빈 목록 상태를 표현한다.
- `npm run typecheck`, `npm run build`, `git diff --check`가 통과한다.
