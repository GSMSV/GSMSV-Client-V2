import { requestJson } from '../../../shared/api';
import type { TeamDetail, TeamQuotaUsage } from '../model/types';

/**
 * 서버 `main`의 팀 상세 응답은 VM 할당량을 `ram_gib`·`ssd_gib`로 준다.
 * 화면과 목데이터는 개인 할당량(`/users/me/quota`)과 같은 `ram_gb`·`ssd_gb` 이름을 쓰므로 여기서 맞춘다.
 * 두 값 모두 1024 단위(GiB)라 숫자는 그대로 둔다.
 */
interface TeamDetailResponse extends Omit<TeamDetail, 'quota'> {
  quota: {
    vm: {
      vcpu: TeamQuotaUsage;
      ram_gib?: TeamQuotaUsage;
      ssd_gib?: TeamQuotaUsage;
      ram_gb?: TeamQuotaUsage;
      ssd_gb?: TeamQuotaUsage;
    };
  } | null;
}

const missingUsage: TeamQuotaUsage = { used: 0, limit: 0 };

export async function getTeam(teamId: string, signal?: AbortSignal): Promise<TeamDetail> {
  const team = await requestJson<TeamDetailResponse>(`/api/v2/teams/${encodeURIComponent(teamId)}`, { signal });
  const vm = team.quota?.vm;
  return {
    ...team,
    quota: vm
      ? {
          vm: {
            vcpu: vm.vcpu,
            ram_gb: vm.ram_gib ?? vm.ram_gb ?? missingUsage,
            ssd_gb: vm.ssd_gib ?? vm.ssd_gb ?? missingUsage,
          },
        }
      : null,
  };
}
