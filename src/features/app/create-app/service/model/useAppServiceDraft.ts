import { useState } from 'react';

export type AppServiceType = 'web' | 'worker' | 'cron';

export interface AppServiceDraft {
  appName: string;
  serviceType: AppServiceType;
  serviceName: string;
  subdomain: string;
  memoryMb: number;
  cpu: number;
}

function getSourceName() {
  if (typeof window === 'undefined') return '';
  try {
    const source = window.sessionStorage.getItem('gsmsv.app-create-source-draft');
    const parsed = source ? JSON.parse(source) as { name?: unknown } : null;
    return typeof parsed?.name === 'string' ? parsed.name : '';
  } catch {
    return '';
  }
}

export function getInitialAppServiceDraft(): AppServiceDraft {
  const preview = import.meta.env.DEV;
  const sourceName = getSourceName();
  return {
    appName: sourceName,
    serviceType: 'web',
    serviceName: preview ? 'web' : '',
    subdomain: preview ? sourceName || 'study-log' : '',
    memoryMb: 512,
    cpu: 0.5,
  };
}

export function useAppServiceDraft() {
  const [draft, setDraft] = useState(getInitialAppServiceDraft);

  const update = <K extends keyof AppServiceDraft>(key: K, value: AppServiceDraft[K]) => {
    setDraft(current => ({ ...current, [key]: value }));
  };

  return { draft, update };
}
