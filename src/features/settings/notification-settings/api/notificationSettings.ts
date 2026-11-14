import { requestJson } from '../../../../shared/api';
import { isDemoMode, readDemoState, writeDemoState } from '../../../../shared/demo';

export interface NotificationSettingItem {
  group: string;
  email: boolean;
  discord: boolean;
  locked: boolean;
}

export interface NotificationSettings {
  channels: {
    email: string;
    discord: { connected: boolean };
  };
  items: NotificationSettingItem[];
}

async function readDemoNotificationSettings(): Promise<NotificationSettings> {
  const { getDemoProfile } = await import('../../../../entities/profile');
  const profile = getDemoProfile();
  const stored = readDemoState<NotificationSettings | NotificationSettingItem[] | null>('notifications', null);
  const items = Array.isArray(stored) ? stored : stored?.items ?? demoNotificationSettings.items;
  return {
    items,
    channels: {
      email: profile?.email ?? demoNotificationSettings.channels.email,
      discord: { connected: profile?.discordConnected ?? false },
    },
  };
}

const demoNotificationSettings: NotificationSettings = {
  channels: { email: 'jimin@example.com', discord: { connected: false } },
  items: [
    { group: 'VM 생성 실패', email: true, discord: false, locked: false },
    { group: '문의 답변', email: true, discord: false, locked: false },
    { group: 'Database 용량·쓰기 금지 해제·전용형 신청 결과', email: true, discord: false, locked: false },
    { group: 'Serverless 하루 실행 한도', email: true, discord: false, locked: false },
    { group: 'Apps 배포 실패·건너뛴 push·재시작 한도·메모리 한도', email: true, discord: false, locked: false },
    { group: '만료 정지·삭제 예고·자동 삭제', email: true, discord: false, locked: true },
  ],
};

export function getNotificationSettings(signal?: AbortSignal): Promise<NotificationSettings> {
  if (import.meta.env.DEV && isDemoMode()) {
    if (signal?.aborted) return Promise.reject(new DOMException('Aborted', 'AbortError'));
    return readDemoNotificationSettings();
  }
  return requestJson<NotificationSettings>('/api/v2/users/me/notification-settings', { signal });
}

export function updateNotificationSettings(items: Array<Pick<NotificationSettingItem, 'group' | 'email' | 'discord'>>): Promise<{ items: NotificationSettingItem[] }> {
  if (import.meta.env.DEV && isDemoMode()) {
    return readDemoNotificationSettings().then(current => {
      const next = current.items.map(item => {
        const draft = items.find(candidate => candidate.group === item.group);
        return draft && !item.locked ? { ...item, email: draft.email, discord: draft.discord } : item;
      });
      if (!writeDemoState('notifications', next)) throw new Error('Notification settings could not be saved');
      return { items: next };
    });
  }
  return requestJson<{ items: NotificationSettingItem[] }>('/api/v2/users/me/notification-settings', {
    method: 'PUT',
    body: JSON.stringify({ items }),
  });
}
