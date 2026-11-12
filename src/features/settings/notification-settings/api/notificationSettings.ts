import { requestJson } from '../../../../shared/api';

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

export function getNotificationSettings(signal?: AbortSignal) {
  return requestJson<NotificationSettings>('/api/v2/users/me/notification-settings', { signal });
}

export function updateNotificationSettings(items: Array<Pick<NotificationSettingItem, 'group' | 'email' | 'discord'>>) {
  return requestJson<{ items: NotificationSettingItem[] }>('/api/v2/users/me/notification-settings', {
    method: 'PUT',
    body: JSON.stringify({ items }),
  });
}
