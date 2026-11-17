import type { AppServiceDraft } from '../app/create-app/service';
import { isDemoFixtureMode, readDemoState, writeDemoState } from '../../shared/demo';

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

export function getDefaultDemoAppSourceDraft(): DemoAppSourceDraft {
  return isDemoFixtureMode()
    ? { ...defaultDemoAppSourceDraft }
    : { name: '', repository: '', branch: 'main', sourceType: 'github', folder: '/', watchPaths: '' };
}

const key = (teamId?: string) => `apps.create-draft.${teamId ?? 'personal'}`;
const serviceKey = (teamId?: string) => `apps.create-service-draft.${teamId ?? 'personal'}`;

type DemoAppServiceDraft = Omit<AppServiceDraft, 'appName'>;

export function readDemoAppServiceDraft(teamId?: string): DemoAppServiceDraft | null {
  const draft = readDemoState<DemoAppServiceDraft | null>(serviceKey(teamId), null);
  if (!draft || !['web', 'worker', 'cron'].includes(draft.serviceType) ||
    typeof draft.serviceName !== 'string' || typeof draft.subdomain !== 'string' ||
    ![256, 384, 512, 640, 768, 896, 1024].includes(draft.memoryMb) ||
    ![0.25, 0.5, 0.75, 1].includes(draft.cpu)) return null;
  return draft;
}

export function saveDemoAppServiceDraft(teamId: string | undefined, draft: DemoAppServiceDraft | null) {
  return writeDemoState(serviceKey(teamId), draft);
}
const installedRepositoriesKey = 'apps.installed-repositories';
const legacyInstalledRepositoryKey = 'apps.installed-repository';
const supportedDemoRepositories = [defaultDemoAppSourceDraft.repository, 'gsm-jimin/study-log'] as const;
function isSupportedDemoRepository(repository: unknown): repository is string {
  return typeof repository === 'string' && (isDemoFixtureMode()
    ? supportedDemoRepositories.includes(repository as (typeof supportedDemoRepositories)[number])
    : /^[a-z0-9][a-z0-9-]*\/[a-z0-9._-]+$/i.test(repository));
}

export function getDemoInstalledRepositories() {
  const saved = readDemoState<unknown>(installedRepositoriesKey, undefined);
  const legacy = readDemoState<unknown>(legacyInstalledRepositoryKey, undefined);
  const installed = new Set<string>(isDemoFixtureMode() ? [defaultDemoAppSourceDraft.repository] : []);

  if (Array.isArray(saved)) {
    for (const repository of saved) {
      if (isSupportedDemoRepository(repository)) installed.add(repository);
    }
  }
  if (isSupportedDemoRepository(legacy)) installed.add(legacy);
  return [...installed];
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
