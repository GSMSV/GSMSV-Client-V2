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

const figmaPreviewDraft: AppSourceDraft = {
  sourceType: 'github',
  repository: 'gsm-jimin/study-log',
  branch: 'main',
  folder: '/',
  watchPaths: 'src/**, package.json',
  name: 'study-log',
};

/** Figma-only preview data; no repository or account API exists in the current app contract. */
export function getInitialAppSourceDraft(): AppSourceDraft {
  return import.meta.env.DEV ? { ...figmaPreviewDraft } : {
    sourceType: 'github',
    repository: '',
    branch: '',
    folder: '/',
    watchPaths: '',
    name: '',
  };
}

export function useAppSourceDraft() {
  const [draft, setDraft] = useState(getInitialAppSourceDraft);

  const update = <K extends keyof AppSourceDraft>(key: K, value: AppSourceDraft[K]) => {
    setDraft(current => ({ ...current, [key]: value }));
  };

  return { draft, update };
}
