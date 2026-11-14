import { useState } from 'react';
import { isDemoMode } from '../../../../shared/demo';

export type AppSourceType = 'github' | 'container' | 'archive';

export interface AppSourceDraft {
  sourceType: AppSourceType;
  repository: string;
  branch: string;
  folder: string;
  watchPaths: string;
  name: string;
}

export function getInitialAppSourceDraft(): AppSourceDraft {
  if (import.meta.env.DEV && isDemoMode()) {
    return {
      sourceType: 'github',
      repository: 'gsm-jimin/portfolio-web',
      branch: 'main',
      folder: '/',
      watchPaths: '',
      name: 'portfolio-web',
    };
  }
  return {
    sourceType: 'github',
    repository: '',
    branch: '',
    folder: '/',
    watchPaths: '',
    name: '',
  };
}

export function useAppSourceDraft() {
  const [initialDraft] = useState(getInitialAppSourceDraft);
  const [draft, setDraft] = useState(initialDraft);

  const update = <K extends keyof AppSourceDraft>(key: K, value: AppSourceDraft[K]) => {
    setDraft(current => ({ ...current, [key]: value }));
  };

  const hasUnsavedInput = (Object.keys(initialDraft) as Array<keyof AppSourceDraft>)
    .some(key => draft[key] !== initialDraft[key]);

  return { draft, update, hasUnsavedInput };
}
