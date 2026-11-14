import { useState } from 'react';

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
