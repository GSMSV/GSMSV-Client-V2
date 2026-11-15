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
  DemoServerlessFunctionLimitError,
  executeDemoServerlessTest,
  extendDemoServerlessFunction,
  findDemoServerlessCodeError,
  formatCronExecution,
  getDemoServerlessAccessibleFunction,
  getDemoServerlessFileName,
  getDemoServerlessFunctions,
  getDemoServerlessQuota,
  getDemoServerlessUrl,
  getNextCronExecution,
  loadDemoServerlessState,
  regenerateDemoServerlessUrl,
  redactDemoServerlessSecrets,
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
import { listDemoTeams } from '../../entities/team/demo';
import type { ServerlessEnvironmentVariable } from './ServerlessEnvironmentPage';
import type { ServerlessFunctionSettings, ServerlessFunctionTab } from './ServerlessFunctionPage';
import type { ServerlessFunctionDraft } from './ServerlessCreatePage';
import type { ServerlessTriggerTab } from './ServerlessTriggersPage';
import type { ServerlessExecutionError, ServerlessTestTab } from './ServerlessTestPage';
import type { ServerlessLogsTab } from './ServerlessLogsPage';
import { isDemoMode, simulateDemoRequest } from '../../shared/demo';
import { ServerlessShell } from '../../widgets/serverless-shell';
import { ServerlessFunctionLimitDialog } from './ServerlessFunctionLimitDialog';
import { ServerlessCreatePlaceholder, ServerlessFunctionPlaceholder, type ServerlessPlaceholderTab } from './ServerlessPagePlaceholder';

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
const allTabs = ['code', 'versions', 'triggers', 'environment', 'test', 'logs'] as const;
function tabPath(functionId: string | undefined, tab: string) {
  const base = `/serverless/${encodeURIComponent(functionId ?? '')}`;
  const segment = tabSlugs[tab];
  return segment ? `${base}/${segment}` : base;
}

/** 내가 속한 팀 함수까지 찾는다. 팀 함수는 일반 팀원(member)이면 읽기 전용이다. */
function getFunctionAccess(functionId: string | undefined, demoMode: boolean): { fn: DemoServerlessFunction | undefined; readOnly: boolean } {
  if (!demoMode || !functionId) return { fn: undefined, readOnly: false };
  const teams = listDemoTeams();
  const fn = getDemoServerlessAccessibleFunction(functionId, teams.map(team => team.id));
  const role = fn?.teamId ? teams.find(team => team.id === fn.teamId)?.my_role : undefined;
  return { fn, readOnly: role === 'member' };
}
function refresh(setRevision: Dispatch<SetStateAction<number>>) { setRevision(value => value + 1); }

function useServerlessStateRevision(functionId: string | undefined, demoMode: boolean) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{ id: string; error: boolean }>();
  const [retryCount, setRetryCount] = useState(0);
  useEffect(() => {
    if (!demoMode || !functionId) return;
    let active = true;
    const controller = new AbortController();
    let firstLoad = true;
    const sync = () => {
      // 첫 요청만 지연·오류 시뮬레이션(`?demoError=serverless-fn`)을 거친다.
      const request = firstLoad ? simulateDemoRequest('serverless-fn', controller.signal).then(loadDemoServerlessState) : loadDemoServerlessState();
      firstLoad = false;
      void request.then(() => {
        if (!active) return;
        setResult({ id: functionId, error: false });
        refresh(setRevision);
      }).catch(() => {
        // 이미 불러온 화면은 백그라운드 동기화 실패로 덮어쓰지 않는다.
        if (active) setResult(current => current?.id === functionId && !current.error ? current : { id: functionId, error: true });
      });
    };
    const unsubscribe = subscribeDemoServerlessState(sync);
    sync();
    return () => { active = false; controller.abort(); unsubscribe(); };
  }, [demoMode, functionId, retryCount]);
  return {
    revision,
    setRevision,
    loading: result?.id !== functionId,
    loadError: result?.id === functionId && Boolean(result?.error),
    retry: () => {
      setResult(undefined);
      setRetryCount(value => value + 1);
    },
  };
}

function ServerlessLoadState({ tab, fn, loadError, retry }: { tab: ServerlessPlaceholderTab; fn: DemoServerlessFunction | undefined; loadError: boolean; retry: () => void }) {
  return (
    <ServerlessShell>
      <ServerlessFunctionPlaceholder tab={tab} functionName={fn?.name} functionDescription={fn?.description} loadError={loadError} onRetry={retry} />
    </ServerlessShell>
  );
}

export function ServerlessCreateRoute() {
  const navigate = useNavigate();
  const demoMode = isDemoMode();
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [retryCount, setRetryCount] = useState(0);
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);
  useEffect(() => {
    if (!demoMode) return;
    const controller = new AbortController();
    void simulateDemoRequest('serverless-new', controller.signal)
      .then(loadDemoServerlessState)
      .then(() => {
        if (controller.signal.aborted) return;
        const quota = getDemoServerlessQuota();
        setLimitDialogOpen(quota.count.used >= quota.count.limit);
        setStatus('ready');
      })
      .catch(() => { if (!controller.signal.aborted) setStatus('error'); });
    return () => controller.abort();
  }, [demoMode, retryCount]);
  if (!demoMode) return <Navigate to="/serverless" replace />;
  const backToList = () => void navigate('/serverless');
  if (status !== 'ready') {
    return (
      <ServerlessShell>
        <ServerlessCreatePlaceholder
          loadError={status === 'error'}
          onRetry={() => { setStatus('loading'); setRetryCount(value => value + 1); }}
          onCancel={backToList}
        />
      </ServerlessShell>
    );
  }
  const quota = getDemoServerlessQuota();
  return (
    <ServerlessShell>
      <CreatePage
        existingNames={getDemoServerlessFunctions().map(fn => fn.name)}
        findCodeError={findDemoServerlessCodeError}
        onCancel={backToList}
        onCreate={async (draft: ServerlessFunctionDraft) => {
          try {
            const id = await createDemoServerlessFunction(draft);
            await navigate(`/serverless/${encodeURIComponent(id)}`);
          } catch (error) {
            if (error instanceof DemoServerlessFunctionLimitError) {
              setLimitDialogOpen(true);
              return;
            }
            throw error;
          }
        }}
      />
      {limitDialogOpen && <ServerlessFunctionLimitDialog used={quota.count.used} limit={quota.count.limit} onClose={backToList} />}
    </ServerlessShell>
  );
}

export function ServerlessFunctionRoute() {
  const navigate = useNavigate();
  const { functionId } = useParams<{ functionId: string }>();
  const demoMode = isDemoMode();
  const { revision, setRevision, loading, loadError, retry } = useServerlessStateRevision(functionId, demoMode);
  const { fn, readOnly } = getFunctionAccess(functionId, demoMode);
  if (!demoMode) return <Navigate to="/serverless" replace />;
  if (loading || loadError) return <ServerlessLoadState tab="code" fn={fn} loadError={loadError} retry={retry} />;
  if (!fn) return <Navigate to="/serverless" replace />;
  const enabledTabs: ServerlessFunctionTab[] = ['코드', '버전', 'Trigger', '환경변수', '테스트', 'Logs'];
  const changed = () => refresh(setRevision);
  const currentVersion = fn.versions.find(version => version.current) ?? fn.versions[0];
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
        suspended={fn.suspended}
        readOnly={readOnly}
        savedVersionLabel={fn.versions[0] ? `${fn.versions[0].label} · ${fn.versions[0].savedAt} 저장` : '저장된 버전 없음'}
        triggerSummary={fn.triggers.filter(trigger => trigger.enabled).map(trigger => trigger.type === 'HTTP'
          ? `${trigger.type} ${trigger.schedule === 'ALL' ? '전체' : trigger.schedule}`
          : `${describeCronExpression(trigger.schedule)} 예약 실행`).join(' · ') || '연결된 Trigger 없음'}
        deleteSummary={`· 버전 ${fn.versions.length}개 · HTTP Trigger ${fn.triggers.filter(trigger => trigger.type === 'HTTP').length}개 · 예약 Trigger ${fn.triggers.filter(trigger => trigger.type === 'Cron').length}개 · 환경변수 ${fn.variables.length}개`}
        enabledTabs={enabledTabs}
        onNavigateTab={tab => void navigate(tabPath(fn.id, tab))}
        onManageTriggers={() => void navigate(tabPath(fn.id, 'Trigger'))}
        onDelete={readOnly ? undefined : () => { deleteDemoServerlessFunction(fn.id); void navigate('/serverless'); }}
        onSaveSettings={readOnly ? undefined : (settings: ServerlessFunctionSettings) => { saveDemoServerlessSettings(fn.id, settings); changed(); }}
        onSaveCode={readOnly ? undefined : (code, runtime) => {
          const codeError = findDemoServerlessCodeError(code, runtime);
          if (codeError) {
            const versionCopy = currentVersion ? ` 지금 ${currentVersion.label}은 그대로입니다.` : '';
            return {
              title: runtime === 'python' ? 'Python 오류로 저장하지 않았습니다' : 'TypeScript 오류로 저장하지 않았습니다',
              description: `${getDemoServerlessFileName(runtime)} ${codeError.line}번째 줄의 형식 오류를 고쳐 주세요.${versionCopy}`,
            };
          }
          saveDemoServerlessCode(fn.id, code);
          changed();
          return undefined;
        }}
        onTest={() => void navigate(tabPath(fn.id, 'test'))}
        onExtend={() => { extendDemoServerlessFunction(fn.id); changed(); }}
        onToggleActive={readOnly ? undefined : active => { setDemoServerlessActive(fn.id, active); changed(); }}
      />
    </ServerlessShell>
  );
}

export function ServerlessTriggersRoute() {
  const navigate = useNavigate();
  const { functionId } = useParams<{ functionId: string }>();
  const demoMode = isDemoMode();
  const { setRevision, loading, loadError, retry } = useServerlessStateRevision(functionId, demoMode);
  const { fn, readOnly } = getFunctionAccess(functionId, demoMode);
  if (!demoMode) return <Navigate to="/serverless" replace />;
  if (loading || loadError) return <ServerlessLoadState tab="triggers" fn={fn} loadError={loadError} retry={retry} />;
  if (!fn) return <Navigate to="/serverless" replace />;
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
        rejectedRequestsToday={fn.rejectedRequestsToday}
        dailyExecutions={quota.daily_executions}
        triggers={fn.triggers}
        nextCronExecution={nextCronExecution ? formatCronExecution(nextCronExecution) : undefined}
        domain={fn.domain}
        enabledTabs={allTabs as readonly ServerlessTriggerTab[]}
        onSelectTab={tab => void navigate(tabPath(fn.id, tab))}
        onAddTrigger={readOnly ? undefined : async trigger => {
          const added = await addDemoServerlessTrigger(fn.id, trigger);
          changed();
          if (added === true) return true;
          if (typeof added === 'string') return added;
          const latestFunction = getFunctionAccess(fn.id, demoMode).fn;
          if (trigger.type === 'HTTP' && latestFunction?.triggers.some(item => item.type === 'HTTP')) {
            return '이 함수에는 HTTP Trigger가 이미 있습니다. 기존 HTTP Trigger를 삭제한 뒤 다시 추가해 주세요.';
          }
          if (trigger.type === 'Cron' && (latestFunction?.triggers.filter(item => item.type === 'Cron').length ?? 0) >= 3) {
            return 'Cron Trigger는 함수마다 3개까지 추가할 수 있습니다. 기존 Trigger를 삭제한 뒤 다시 시도해 주세요.';
          }
          return '최신 Trigger 상태와 달라 추가하지 못했습니다. 취소한 뒤 목록을 확인하고 다시 시도해 주세요.';
        }}
        onRegenerateUrl={readOnly ? undefined : () => { regenerateDemoServerlessUrl(fn.id); changed(); }}
        onTest={() => void navigate(tabPath(fn.id, 'test'))}
        onCopyAddress={() => { void navigator.clipboard.writeText(fn.publicUrl ?? getDemoServerlessUrl(fn.id)); }}
        onOpenDocsExample={() => void navigate('/help')}
        onToggleTrigger={readOnly ? undefined : (id, enabled) => { updateDemoServerlessTrigger(fn.id, id, enabled); changed(); }}
        onDeleteTrigger={readOnly ? undefined : id => { deleteDemoServerlessTrigger(fn.id, id); changed(); }}
        onConnectDomain={readOnly ? undefined : domain => { setDemoServerlessDomain(fn.id, domain); changed(); }}
      />
    </ServerlessShell>
  );
}

export function ServerlessTabRoute() {
  const navigate = useNavigate();
  const { functionId, tab = '' } = useParams<{ functionId: string; tab: string }>();
  const demoMode = isDemoMode();
  const { setRevision, loading, loadError, retry } = useServerlessStateRevision(functionId, demoMode);
  const [page, setPage] = useState(1);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [executionError, setExecutionError] = useState<ServerlessExecutionError | null>(null);
  useEffect(() => { setPage(1); setSelectedRunId(null); setExecutionError(null); }, [functionId, tab]);
  const { fn, readOnly } = getFunctionAccess(functionId, demoMode);
  if (!demoMode) return <Navigate to="/serverless" replace />;
  const placeholderTab = (allTabs as readonly string[]).includes(tab) ? tab as ServerlessPlaceholderTab : 'code';
  if (loading || loadError) return <ServerlessLoadState tab={placeholderTab} fn={fn} loadError={loadError} retry={retry} />;
  if (!fn) return <Navigate to="/serverless" replace />;
  if (!Object.hasOwn(tabSlugs, tab) || tab === 'triggers') return <Navigate to={tabPath(fn.id, '코드')} replace />;
  const changed = () => refresh(setRevision);
  const selectTab = (nextTab: string) => void navigate(tabPath(fn.id, nextTab));
  let content = null;

  if (tab === 'versions') {
    content = <VersionsPage functionName={fn.name} description={fn.description} versions={fn.versions} onSelectTab={tab => selectTab(tab)} onRollback={readOnly ? undefined : id => { rollbackDemoServerlessVersion(fn.id, id); changed(); void navigate(tabPath(fn.id, '코드')); }} />;
  } else if (tab === 'environment') {
    const variables: ServerlessEnvironmentVariable[] = fn.variables.map(variable => ({ name: variable.name, secret: variable.secret, ...(variable.secret ? {} : { value: variable.value }) }));
    content = <EnvironmentPage
      functionName={fn.name}
      variables={variables}
      storageBytesUsed={JSON.stringify(fn.variables).length}
      storageBytesLimit={8192}
      databases={[{ id: 'welcome-db', label: 'welcome-db · MySQL' }]}
      selectedDatabaseId={fn.databaseId}
      onSelectTab={tab => selectTab(tab)}
      onAddVariable={readOnly ? undefined : variable => { addDemoServerlessVariable(fn.id, variable); changed(); }}
      onUpdateVariable={readOnly ? undefined : (name, value) => {
        const current = fn.variables.find(variable => variable.name === name);
        if (!current) return;
        updateDemoServerlessVariable(fn.id, name, { ...current, value, secret: current.secret });
        changed();
      }}
      onDeleteVariable={readOnly ? undefined : name => { deleteDemoServerlessVariable(fn.id, name); changed(); }}
      onSaveChanges={readOnly ? undefined : changed}
      onEditVariables={readOnly ? undefined : changed}
      onSelectDatabase={readOnly ? undefined : id => { setDemoServerlessDatabase(fn.id, id); changed(); }}
    />;
  } else if (tab === 'test') {
    const quota = getDemoServerlessQuota();
    content = <TestPage
      functionName={fn.name}
      result={fn.testResult ? {
        ...fn.testResult,
        responseJson: redactDemoServerlessSecrets(fn.testResult.responseJson, fn.variables),
        statusMessage: redactDemoServerlessSecrets(fn.testResult.statusMessage, fn.variables),
        logs: redactDemoServerlessSecrets(fn.testResult.logs, fn.variables),
      } : null}
      active={fn.active}
      dailyExecutions={quota.daily_executions}
      executionError={executionError}
      onDismissExecutionError={() => setExecutionError(null)}
      onActivate={() => { setDemoServerlessActive(fn.id, true); setExecutionError(null); changed(); }}
      enabledTabs={allTabs as readonly ServerlessTestTab[]}
      onExecute={readOnly ? undefined : async payload => {
        try {
          const execution = await executeDemoServerlessTest(fn.id, payload);
          if (execution.kind === 'executed') {
            setExecutionError(null);
          } else if (execution.kind === 'runtime-error') {
            setExecutionError({ kind: 'runtime-error', message: execution.error.message, location: execution.error.location });
          } else if (execution.kind === 'timeout') {
            setExecutionError({ kind: 'timeout', timeoutSeconds: execution.timeoutSeconds, memoryMb: execution.memoryMb });
          } else {
            setExecutionError({ kind: execution.kind });
          }
          changed();
        } catch {
          setExecutionError({ kind: 'storage' });
        }
      }}
      onEditCode={() => void navigate(tabPath(fn.id, '코드'))}
      onCopyResponse={response => { void navigator.clipboard.writeText(response); }}
      onViewLogs={() => void navigate(tabPath(fn.id, 'logs'))}
      onSelectTab={tab => selectTab(tab)}
    />;
  } else if (tab === 'logs') {
    const pageSize = 100;
    const runs = fn.runs.slice((page - 1) * pageSize, page * pageSize);
    content = <LogsPage
      functionName={fn.name}
      runs={runs.map(run => ({
        ...run,
        outputLines: run.outputLines?.map(line => redactDemoServerlessSecrets(line, fn.variables)),
      }))}
      totalCount={fn.runs.length}
      page={page}
      pageSize={pageSize}
      selectedRunId={selectedRunId}
      enabledTabs={allTabs as readonly ServerlessLogsTab[]}
      onSelectTab={tab => selectTab(tab)}
      onSelectRun={setSelectedRunId}
      onPageChange={setPage}
      onRefresh={changed}
      onTest={readOnly ? undefined : () => selectTab('test')}
      onDeleteAll={readOnly ? undefined : () => { deleteDemoServerlessRuns(fn.id); setSelectedRunId(null); setPage(1); changed(); }}
    />;
  } else {
    return <Navigate to={tabPath(fn.id, '코드')} replace />;
  }

  return <ServerlessShell>{content}</ServerlessShell>;
}
