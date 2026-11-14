import { useState } from 'react';
import { isDemoMode } from '../../../../../shared/demo';

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
  const sourceName = getSourceName(sourceDraftKey);
  if (isDemoMode()) {
    return { appName: sourceName || 'portfolio-web', serviceType: 'web', serviceName: 'web', subdomain: 'portfolio-web', memoryMb: 512, cpu: 0.5 };
  }
  return {
    appName: sourceName,
    serviceType: 'web',
    serviceName: '',
    subdomain: '',
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
