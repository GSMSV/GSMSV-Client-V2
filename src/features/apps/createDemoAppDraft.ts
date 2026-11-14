import { readDemoState, writeDemoState } from '../../shared/demo';

export interface DemoAppSourceDraft {
  name: string;
  repository: string;
  branch: string;
  sourceType: 'github' | 'container' | 'archive';
  folder: string;
  watchPaths: string;
}

export const defaultDemoAppSourceDraft: DemoAppSourceDraft = {
  name: 'study-log',
  repository: 'gsm-jimin/portfolio-web',
  branch: 'main',
  sourceType: 'github',
  folder: '/',
  watchPaths: '',
};

const key = (teamId?: string) => `apps.create-draft.${teamId ?? 'personal'}`;

export function readDemoAppDraft(teamId?: string) {
  const draft = readDemoState<DemoAppSourceDraft | null>(key(teamId), null);
  if (!draft || !['github', 'container', 'archive'].includes(draft.sourceType) ||
    ['name', 'repository', 'branch', 'folder', 'watchPaths'].some(field => typeof draft[field as keyof DemoAppSourceDraft] !== 'string')) return null;
  return draft;
}

export function saveDemoAppDraft(teamId: string | undefined, draft: DemoAppSourceDraft | null) {
  return writeDemoState(key(teamId), draft);
}

export function isDemoRepositoryAccessible(repo: string, installedRepository: string) {
  return repo === 'gsm-jimin/portfolio-web' || (repo === 'gsm-jimin/study-log' && repo === installedRepository);
}
