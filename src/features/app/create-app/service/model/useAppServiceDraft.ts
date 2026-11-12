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

function getSourceName(sourceDraftKey: string) {
  if (typeof window === 'undefined') return '';
  try {
    const source = window.sessionStorage.getItem(sourceDraftKey);
    const parsed = source ? JSON.parse(source) as { name?: unknown } : null;
    return typeof parsed?.name === 'string' ? parsed.name : '';
  } catch {
    return '';
  }
}

export function getInitialAppServiceDraft(sourceDraftKey = 'gsmsv.app-create-source-draft'): AppServiceDraft {
  const preview = import.meta.env.DEV;
  const sourceName = getSourceName(sourceDraftKey);
  return {
    appName: sourceName,
    serviceType: 'web',
    serviceName: preview ? 'web' : '',
    subdomain: preview ? sourceName || 'study-log' : '',
    memoryMb: 512,
    cpu: 0.5,
  };
}

export function useAppServiceDraft(sourceDraftKey = 'gsmsv.app-create-source-draft') {
  const [initialDraft] = useState(() => getInitialAppServiceDraft(sourceDraftKey));
  const [draft, setDraft] = useState(initialDraft);

  const update = <K extends keyof AppServiceDraft>(key: K, value: AppServiceDraft[K]) => {
    setDraft(current => ({ ...current, [key]: value }));
  };

  const hasUnsavedInput = (Object.keys(initialDraft) as Array<keyof AppServiceDraft>)
    .some(key => draft[key] !== initialDraft[key]);

  return { draft, update, hasUnsavedInput };
}
