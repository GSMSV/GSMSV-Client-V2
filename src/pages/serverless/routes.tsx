import { lazy, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { Navigate, useNavigate, useParams, type RouteObject } from 'react-router';
import {
  addDemoServerlessTrigger,
  addDemoServerlessVariable,
  createDemoServerlessFunction,
  deleteDemoServerlessFunction,
  deleteDemoServerlessRuns,
  deleteDemoServerlessTrigger,
  deleteDemoServerlessVariable,
  describeCronExpression,
  executeDemoServerlessTest,
  extendDemoServerlessFunction,
  formatCronExecution,
  getDemoServerlessFunction,
  getDemoServerlessQuota,
  getDemoServerlessUrl,
  getNextCronExecution,
  loadDemoServerlessState,
  regenerateDemoServerlessUrl,
  rollbackDemoServerlessVersion,
  saveDemoServerlessCode,
  saveDemoServerlessSettings,
  setDemoServerlessActive,
  setDemoServerlessDatabase,
  setDemoServerlessDomain,
  updateDemoServerlessTrigger,
  updateDemoServerlessVariable,
  subscribeDemoServerlessState,
  type DemoServerlessFunction,
} from '../../entities/serverless';
import type { ServerlessEnvironmentVariable } from './ServerlessEnvironmentPage';
import type { ServerlessFunctionSettings, ServerlessFunctionTab } from './ServerlessFunctionPage';
import type { ServerlessFunctionDraft } from './ServerlessCreatePage';
import type { ServerlessTriggerTab } from './ServerlessTriggersPage';
import type { ServerlessTestTab } from './ServerlessTestPage';
import type { ServerlessLogsTab } from './ServerlessLogsPage';
import { isDemoMode } from '../../shared/demo';
import { ServerlessShell } from '../../widgets/serverless-shell';

const CreatePage = lazy(() => import('./ServerlessCreatePage'));
const FunctionPage = lazy(async () => ({ default: (await import('./ServerlessFunctionPage')).ServerlessFunctionPage }));
const TriggersPage = lazy(async () => ({ default: (await import('./ServerlessTriggersPage')).ServerlessTriggersPage }));
const EnvironmentPage = lazy(async () => ({ default: (await import('./ServerlessEnvironmentPage')).ServerlessEnvironmentPage }));
const VersionsPage = lazy(async () => ({ default: (await import('./ServerlessVersionsPage')).ServerlessVersionsPage }));
const TestPage = lazy(async () => ({ default: (await import('./ServerlessTestPage')).ServerlessTestPage }));
const LogsPage = lazy(async () => ({ default: (await import('./ServerlessLogsPage')).ServerlessLogsPage }));
export const serverlessDemoRoutes: RouteObject[] = [
  { path: '/serverless/new', element: <ServerlessCreateRoute /> },
  { path: '/serverless/:functionId/triggers', element: <ServerlessTriggersRoute /> },
  { path: '/serverless/:functionId/:tab', element: <ServerlessTabRoute /> },
  { path: '/serverless/:functionId', element: <ServerlessFunctionRoute /> },
];

const tabSlugs: Record<string, string> = {
  '코드': '', code: '', '버전': 'versions', versions: 'versions', Trigger: 'triggers', triggers: 'triggers',
  '환경변수': 'environment', environment: 'environment', '테스트': 'test', test: 'test', Logs: 'logs', logs: 'logs',
};
function tabPath(functionId: string | undefined, tab: string) {
  const base = `/serverless/${encodeURIComponent(functionId ?? '')}`;
  const segment = tabSlugs[tab];
  return segment ? `${base}/${segment}` : base;
}
function getFunction(functionId: string | undefined, demoMode: boolean): DemoServerlessFunction | undefined {
  return demoMode && functionId ? getDemoServerlessFunction(functionId) : undefined;
}
function refresh(setRevision: Dispatch<SetStateAction<number>>) { setRevision(value => value + 1); }

function useServerlessStateRevision(functionId: string | undefined, demoMode: boolean) {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!demoMode || !functionId) return;
    let active = true;
    const sync = () => {
      void loadDemoServerlessState().then(() => {
        if (active) refresh(setRevision);
      }).catch(() => {
        if (active) refresh(setRevision);
      });
    };
    const unsubscribe = subscribeDemoServerlessState(sync);
    sync();
    return () => { active = false; unsubscribe(); };
  }, [demoMode, functionId]);
  return [revision, setRevision] as const;
}

export function ServerlessCreateRoute() {
  const navigate = useNavigate();
  if (!isDemoMode()) return <Navigate to="/serverless" replace />;
  return (
    <ServerlessShell>
      <CreatePage
        onCancel={() => void navigate('/serverless')}
        onCreate={(draft: ServerlessFunctionDraft) => {
          void createDemoServerlessFunction(draft).then(id => navigate(`/serverless/${encodeURIComponent(id)}`));
        }}
      />
    </ServerlessShell>
  );
}

export function ServerlessFunctionRoute() {
  const navigate = useNavigate();
  const { functionId } = useParams<{ functionId: string }>();
  const demoMode = isDemoMode();
  const [revision, setRevision] = useServerlessStateRevision(functionId, demoMode);
  const fn = getFunction(functionId, demoMode);
  void revision;
  if (!demoMode || !fn) return <Navigate to="/serverless" replace />;
  const enabledTabs: ServerlessFunctionTab[] = ['코드', '버전', 'Trigger', '환경변수', '테스트', 'Logs'];
  const changed = () => refresh(setRevision);
  return (
    <ServerlessShell>
      <FunctionPage
        key={`${fn.id}-${revision}`}
        name={fn.name}
        description={fn.description}
        runtime={fn.runtime}
        timeoutSeconds={fn.timeoutSeconds}
        memoryMb={fn.memoryMb}
        code={fn.code}
        active={fn.active}
        expiresAtLabel={fn.expiresAt}
        savedVersionLabel={fn.versions[0] ? `${fn.versions[0].label} · ${fn.versions[0].savedAt} 저장` : '저장된 버전 없음'}
        triggerSummary={fn.triggers.filter(trigger => trigger.enabled).map(trigger => trigger.type === 'HTTP'
          ? `${trigger.type} ${trigger.schedule === 'ALL' ? '전체' : trigger.schedule}`
          : `${describeCronExpression(trigger.schedule)} 예약 실행`).join(' · ') || '연결된 Trigger 없음'}
        enabledTabs={enabledTabs}
        onNavigateTab={tab => void navigate(tabPath(fn.id, tab))}
        onManageTriggers={() => void navigate(tabPath(fn.id, 'Trigger'))}
        onDelete={() => { deleteDemoServerlessFunction(fn.id); void navigate('/serverless'); }}
        onSaveSettings={(settings: ServerlessFunctionSettings) => { saveDemoServerlessSettings(fn.id, settings); changed(); }}
        onSaveCode={code => { saveDemoServerlessCode(fn.id, code); changed(); }}
        onTest={() => void navigate(tabPath(fn.id, 'test'))}
        onExtend={() => { extendDemoServerlessFunction(fn.id); changed(); }}
        onToggleActive={active => { setDemoServerlessActive(fn.id, active); changed(); }}
      />
    </ServerlessShell>
  );
}

export function ServerlessTriggersRoute() {
  const navigate = useNavigate();
  const { functionId } = useParams<{ functionId: string }>();
  const demoMode = isDemoMode();
  const [revision, setRevision] = useServerlessStateRevision(functionId, demoMode);
  const fn = getFunction(functionId, demoMode);
  void revision;
  if (!demoMode || !fn) return <Navigate to="/serverless" replace />;
  const changed = () => refresh(setRevision);
  const quota = getDemoServerlessQuota();
  const enabledCronTriggers = fn.triggers.filter(trigger => trigger.type === 'Cron' && trigger.enabled);
  const isSeededFigmaPreview = fn.id === 'welcome-api'
    && fn.triggers.length === 2
    && enabledCronTriggers.length === 1
    && enabledCronTriggers[0].id === 'cron'
    && enabledCronTriggers[0].schedule === '0 9 * * *';
  const seedPreviewClock = isSeededFigmaPreview ? new Date('2026-09-30T08:59:00+09:00') : undefined;
  const nextCronExecution = enabledCronTriggers
    .map(trigger => getNextCronExecution(trigger.schedule, seedPreviewClock))
    .filter((nextExecution): nextExecution is Date => Boolean(nextExecution))
    .sort((left, right) => left.getTime() - right.getTime())[0];
  return (
    <ServerlessShell>
      <TriggersPage
        key={fn.id}
        functionName={fn.name}
        publicUrl={fn.publicUrl ?? getDemoServerlessUrl(fn.id)}
        httpMethod={fn.triggers.find(trigger => trigger.type === 'HTTP')?.schedule === 'ALL' ? '전체' : fn.triggers.find(trigger => trigger.type === 'HTTP')?.schedule}
        concurrentLimit={2}
        dailyExecutions={quota.daily_executions}
        triggers={fn.triggers}
        nextCronExecution={nextCronExecution ? formatCronExecution(nextCronExecution) : undefined}
        domain={fn.domain}
        enabledTabs={['code', 'versions', 'triggers', 'environment', 'test', 'logs'] as ServerlessTriggerTab[]}
        onSelectTab={tab => void navigate(tabPath(fn.id, tab))}
        onAddTrigger={async trigger => {
          const added = await addDemoServerlessTrigger(fn.id, trigger);
          changed();
          if (added === true) return true;
          if (typeof added === 'string') return added;
          const latestFunction = getDemoServerlessFunction(fn.id);
          if (trigger.type === 'HTTP' && latestFunction?.triggers.some(item => item.type === 'HTTP')) {
            return '이 함수에는 HTTP Trigger가 이미 있습니다. 기존 HTTP Trigger를 삭제한 뒤 다시 추가해 주세요.';
          }
          if (trigger.type === 'Cron' && (latestFunction?.triggers.filter(item => item.type === 'Cron').length ?? 0) >= 3) {
            return 'Cron Trigger는 함수마다 3개까지 추가할 수 있습니다. 기존 Trigger를 삭제한 뒤 다시 시도해 주세요.';
          }
          return '최신 Trigger 상태와 달라 추가하지 못했습니다. 취소한 뒤 목록을 확인하고 다시 시도해 주세요.';
        }}
        onRegenerateUrl={() => { regenerateDemoServerlessUrl(fn.id); changed(); }}
        onTest={() => void navigate(tabPath(fn.id, 'test'))}
        onCopyAddress={() => { void navigator.clipboard.writeText(fn.publicUrl ?? getDemoServerlessUrl(fn.id)); }}
        onOpenDocsExample={() => void navigate('/help')}
        onToggleTrigger={(id, enabled) => { updateDemoServerlessTrigger(fn.id, id, enabled); changed(); }}
        onDeleteTrigger={id => { deleteDemoServerlessTrigger(fn.id, id); changed(); }}
        onConnectDomain={domain => { setDemoServerlessDomain(fn.id, domain); changed(); }}
      />
    </ServerlessShell>
  );
}

export function ServerlessTabRoute() {
  const navigate = useNavigate();
  const { functionId, tab = '' } = useParams<{ functionId: string; tab: string }>();
  const demoMode = isDemoMode();
  const [revision, setRevision] = useServerlessStateRevision(functionId, demoMode);
  const [page, setPage] = useState(1);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  useEffect(() => { setPage(1); setSelectedRunId(null); }, [functionId, tab]);
  const fn = getFunction(functionId, demoMode);
  void revision;
  if (!demoMode || !fn) return <Navigate to="/serverless" replace />;
  if (!Object.hasOwn(tabSlugs, tab) || tab === 'triggers') return <Navigate to={tabPath(fn.id, '코드')} replace />;
  const changed = () => refresh(setRevision);
  const selectTab = (nextTab: string) => void navigate(tabPath(fn.id, nextTab));
  let content = null;

  if (tab === 'versions') {
    content = <VersionsPage functionName={fn.name} description={fn.description} versions={fn.versions} onSelectTab={tab => selectTab(tab)} onRollback={id => { rollbackDemoServerlessVersion(fn.id, id); changed(); void navigate(tabPath(fn.id, '코드')); }} />;
  } else if (tab === 'environment') {
    const variables: ServerlessEnvironmentVariable[] = fn.variables.map(variable => ({ name: variable.name, secret: variable.secret, ...(variable.secret ? {} : { value: variable.value }) }));
    content = <EnvironmentPage
      functionName={fn.name}
      variables={variables}
      storageBytesUsed={JSON.stringify(fn.variables).length}
      storageBytesLimit={8192}
      databases={[{ id: 'student-db', label: 'student-db · PostgreSQL' }]}
      selectedDatabaseId={fn.databaseId}
      onSelectTab={tab => selectTab(tab)}
      onAddVariable={variable => { addDemoServerlessVariable(fn.id, variable); changed(); }}
      onUpdateVariable={(name, value) => {
        updateDemoServerlessVariable(fn.id, name, { name, secret: true, value });
        changed();
      }}
      onDeleteVariable={name => { deleteDemoServerlessVariable(fn.id, name); changed(); }}
      onSaveChanges={changed}
      onEditVariables={changed}
      onSelectDatabase={id => { setDemoServerlessDatabase(fn.id, id); changed(); }}
    />;
  } else if (tab === 'test') {
    content = <TestPage
      functionName={fn.name}
      result={fn.testResult}
      enabledTabs={['code', 'versions', 'triggers', 'environment', 'test', 'logs'] as ServerlessTestTab[]}
      onExecute={payload => { executeDemoServerlessTest(fn.id, payload); changed(); }}
      onCopyResponse={response => { void navigator.clipboard.writeText(response); }}
      onViewLogs={() => void navigate(tabPath(fn.id, 'logs'))}
      onSelectTab={tab => selectTab(tab)}
    />;
  } else if (tab === 'logs') {
    const pageSize = 100;
    const runs = fn.runs.slice((page - 1) * pageSize, page * pageSize);
    content = <LogsPage
      functionName={fn.name}
      runs={runs}
      totalCount={fn.runs.length}
      page={page}
      pageSize={pageSize}
      selectedRunId={selectedRunId}
      enabledTabs={['code', 'versions', 'triggers', 'environment', 'test', 'logs'] as ServerlessLogsTab[]}
      onSelectTab={tab => selectTab(tab)}
      onSelectRun={setSelectedRunId}
      onPageChange={setPage}
      onRefresh={changed}
      onDeleteAll={() => { deleteDemoServerlessRuns(fn.id); setSelectedRunId(null); setPage(1); changed(); }}
    />;
  } else {
    return <Navigate to={tabPath(fn.id, '코드')} replace />;
  }

  return <ServerlessShell>{content}</ServerlessShell>;
}
