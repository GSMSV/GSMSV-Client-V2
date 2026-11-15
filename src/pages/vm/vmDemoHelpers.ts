import type { DeletedDemoVm, DemoVm, DemoVmState } from '../../entities/vm';
import { getDemoTeam } from '../../entities/team/demo';

/**
 * 삭제된 VM 기록을 찾는다. 팀 경로가 아니면(`/vms/<id>`) 팀 VM 기록도 찾아
 * "찾을 수 없습니다" 대신 "이미 삭제된 Instance입니다"를 보여준다.
 */
export function findDeletedDemoVm(state: DemoVmState, identifier: string | undefined, routeTeamId?: string): DeletedDemoVm | undefined {
  if (!identifier) return undefined;
  return state.deletedVms?.find(item => (item.id === identifier || item.grn === identifier)
    && (!routeTeamId || item.teamId === routeTeamId));
}

/** `10월 30일 14:00` 형식(KST). */
export function formatKoreanDemoDate(timestamp: number | undefined): string {
  if (timestamp === undefined) return '확인할 수 없는 날짜';
  const local = new Date(timestamp + 9 * 60 * 60 * 1000);
  const hours = String(local.getUTCHours()).padStart(2, '0');
  const minutes = String(local.getUTCMinutes()).padStart(2, '0');
  return `${local.getUTCMonth() + 1}월 ${local.getUTCDate()}일 ${hours}:${minutes}`;
}

/** 팀 VM의 팀장·DevOps 이름. 팀 정보가 없으면 Figma 기준 이름을 쓴다. */
export function describeDemoVmTeamRoles(vm: DemoVm): { summary: string; contact: string } {
  const members = vm.teamId ? getDemoTeam(vm.teamId)?.members ?? [] : [];
  const leader = members.find(member => member.role === 'leader')?.name ?? '김지민';
  const devops = members.filter(member => member.role === 'devops').map(member => member.name);
  const devopsNames = devops.length ? devops : members.length ? [] : ['한도윤'];
  return {
    summary: `팀장 · ${leader}${devopsNames.length ? ` · DevOps · ${devopsNames.join(', ')}` : ''}`,
    contact: `팀장 ${leader}${devopsNames.length ? ` 또는 DevOps ${devopsNames.join(', ')}` : ''}`,
  };
}
