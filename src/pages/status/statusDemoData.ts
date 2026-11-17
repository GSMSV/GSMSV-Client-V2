export const componentHistory = [
  { name: '로그인', status: 'normal', uptime: '100%', exceptions: {} },
  { name: 'VM 생성', status: 'normal', uptime: '99.98%', exceptions: { 79: 'slow' } },
  { name: 'VM Network·접속', status: 'normal', uptime: '100%', exceptions: { 72: 'maintenance' } },
  { name: 'Serverless', status: 'slow', uptime: '99.96%', exceptions: { 63: 'incident', 88: 'slow' } },
] as const;

export const incidents = [
  { title: 'Serverless 응답 지연 · 진행 중', description: '14:25 · 원인을 확인하고 있습니다. 함수 실행이 평소보다 2초 이상 걸릴 수 있습니다.', date: '2026.09.30 14:10 시작 · Serverless', icon: 'alert', ongoing: true },
  { title: 'VM 생성 지연 · 해결됨', description: '생성 대기열 처리가 늦어져 새 VM 생성이 최대 32분 지연됐습니다.', date: '2026.09.21 10:05–10:37 · VM 생성', icon: 'check-circle' },
  { title: '계획 점검 · Network 장비 교체 · 완료', description: '외부 접속 포트와 HTTPS Domain이 잠시 끊겼습니다. 가용률 계산에서 뺐습니다.', date: '2026.09.13 02:00–04:00 · VM Network·접속', icon: 'calendar' },
  { title: 'Serverless 장애 · 해결됨', description: '함수 실행 Node가 응답하지 않아 호출이 실패했습니다. Node를 교체했습니다.', date: '2026.09.05 21:40–22:15 · Serverless', icon: 'check-circle' },
] as const;

export const notices = [
  { title: 'Serverless 응답이 느립니다 · 성능 저하', description: '14:10부터 함수 실행 응답이 평소보다 느립니다. 원인을 확인하고 있습니다. 로그인, VM 생성, VM 접속은 정상입니다.', icon: 'alert', tone: 'warning' },
  { title: '예정된 점검 · 10월 4일(일) 02:00–04:00 · VM 생성', description: '점검 중에는 새 VM을 만들 수 없습니다. 실행 중인 VM과 접속에는 영향이 없습니다. 점검 시간은 가용률에서 뺍니다.', icon: 'calendar', tone: 'surface' },
] as const;

export const historyDescription = '외부 감시 서버가 1분마다 확인합니다. 3회 연속 실패하면 장애, 응답 시간 95번째 백분위가 2초를 넘는 상태가 5분 이어지면 성능 저하로 표시합니다. 가용률은 정상인 분 ÷ 전체 분이며, 계획 점검 시간은 뺍니다.';

export const statusScenarios = {
  'network-outage': {
    title: 'VM Network·접속 장애',
    description: '14:20부터 외부에서 VM에 접속할 수 없습니다. 원인을 확인하고 있습니다.',
    details: ['· 다음 업데이트 · 14:50까지', '· GSM SV Discord 공지 채널에도 알렸습니다'],
    tone: 'danger',
    icon: 'alert',
  },
  maintenance: {
    title: 'VM 생성 점검 중',
    description: '10월 4일(일) 02:00–04:00에는 새 VM을 만들 수 없습니다. 실행 중인 VM과 접속에는 영향이 없습니다.',
    details: ['· 점검 시간은 가용률 계산에서 빠집니다.'],
    tone: 'neutral',
    icon: 'calendar',
  },
  normal: {
    title: '모든 서비스가 정상입니다',
    description: '진행 중인 장애와 예정된 점검이 없습니다.',
    details: ['· 마지막 확인 · 1분 전'],
    tone: 'primary',
    icon: 'check-circle',
  },
} as const;
