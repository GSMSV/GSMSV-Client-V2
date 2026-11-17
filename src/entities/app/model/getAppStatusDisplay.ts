const statusLabels: Record<string, string> = {
  active: '실행 중',
  running: '실행 중',
  stopped: '정지',
  suspended: '정지',
  creating: '생성 중',
  deploying: '배포 중',
  failed: '오류',
  expired: '만료',
  deleting: '삭제 중',
};

export function getAppStatusDisplay(status: string) {
  const normalizedStatus = status.trim().toLowerCase();
  return {
    label: statusLabels[normalizedStatus] ?? (status.trim() || '상태 정보 없음'),
    tone: ['failed', 'expired', 'deleting'].includes(normalizedStatus) ? 'warning' as const : 'neutral' as const,
  };
}
