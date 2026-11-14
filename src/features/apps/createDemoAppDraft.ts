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
const installedRepositoriesKey = 'apps.installed-repositories';
const legacyInstalledRepositoryKey = 'apps.installed-repository';
const supportedDemoRepositories = [defaultDemoAppSourceDraft.repository, 'gsm-jimin/study-log'] as const;
type SupportedDemoRepository = (typeof supportedDemoRepositories)[number];

function isSupportedDemoRepository(repository: unknown): repository is SupportedDemoRepository {
  return typeof repository === 'string' && supportedDemoRepositories.includes(repository as SupportedDemoRepository);
}

export function getDemoInstalledRepositories() {
  const saved = readDemoState<unknown>(installedRepositoriesKey, undefined);
  const legacy = readDemoState<unknown>(legacyInstalledRepositoryKey, undefined);
  const installed = new Set<SupportedDemoRepository>([defaultDemoAppSourceDraft.repository]);

  if (Array.isArray(saved)) {
    for (const repository of saved) {
      if (isSupportedDemoRepository(repository)) installed.add(repository);
    }
  }
  if (isSupportedDemoRepository(legacy)) installed.add(legacy);

  const repositories = [...installed];
  const savedSet = new Set(Array.isArray(saved) ? saved.filter(isSupportedDemoRepository) : []);
  if (!Array.isArray(saved) || savedSet.size !== saved.length || repositories.some(repository => !savedSet.has(repository))) {
    writeDemoState(installedRepositoriesKey, repositories);
  }
  return repositories;
}

export function installDemoRepository(repository: string) {
  if (!isSupportedDemoRepository(repository)) return false;

  const installed = new Set(getDemoInstalledRepositories());
  installed.add(repository);
  const repositories = [...installed];
  if (!writeDemoState(installedRepositoriesKey, repositories)) return false;
  writeDemoState(legacyInstalledRepositoryKey, repository);
  return true;
}

export function readDemoAppDraft(teamId?: string) {
  const draft = readDemoState<DemoAppSourceDraft | null>(key(teamId), null);
  if (!draft || !['github', 'container', 'archive'].includes(draft.sourceType) ||
    ['name', 'repository', 'branch', 'folder', 'watchPaths'].some(field => typeof draft[field as keyof DemoAppSourceDraft] !== 'string')) return null;
  return draft;
}

export function saveDemoAppDraft(teamId: string | undefined, draft: DemoAppSourceDraft | null) {
  return writeDemoState(key(teamId), draft);
}

export function isDemoRepositoryAccessible(repo: string, installedRepositories: readonly string[]) {
  return installedRepositories.includes(repo);
}
