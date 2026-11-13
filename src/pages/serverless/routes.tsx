import { lazy, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router';
import { getMyQuota } from '../../entities/quota';
import { ServerlessShell } from '../../widgets/serverless-shell';
import type { ServerlessFunctionDraft } from './ServerlessCreatePage';

const CreatePage = lazy(() => import('./ServerlessCreatePage'));
const FunctionPage = lazy(async () => {
  const module = await import('./ServerlessFunctionPage');
  return { default: module.ServerlessFunctionPage };
});
const TriggersPage = lazy(async () => {
  const module = await import('./ServerlessTriggersPage');
  return { default: module.ServerlessTriggersPage };
});
const EnvironmentPage = lazy(async () => {
  const module = await import('./ServerlessEnvironmentPage');
  return { default: module.ServerlessEnvironmentPage };
});
const VersionsPage = lazy(async () => {
  const module = await import('./ServerlessVersionsPage');
  return { default: module.ServerlessVersionsPage };
});
const TestPage = lazy(async () => {
  const module = await import('./ServerlessTestPage');
  return { default: module.ServerlessTestPage };
});
const LogsPage = lazy(async () => {
  const module = await import('./ServerlessLogsPage');
  return { default: module.ServerlessLogsPage };
});

const tabSlugs: Record<string, string> = {
  '코드': '', code: '',
  '버전': 'versions', versions: 'versions',
  Trigger: 'triggers', triggers: 'triggers',
  '환경변수': 'environment', environment: 'environment',
  '테스트': 'test', test: 'test',
  Logs: 'logs', logs: 'logs',
};

const previewDailyExecutions = { used: 1284, limit: 10_000 };
const healthCheckCode = `def handler(request, env):
    return {
        "status": "ok",
        "service": "health-check"
    }`;
const previewVersions = [
  { id: '7', label: '버전 7', savedAt: '2026. 09. 29. 14:32', author: '김지민', changeSummary: '코드', current: true },
  { id: '6', label: '버전 6', savedAt: '2026. 09. 29. 11:05', author: '김지민', changeSummary: '실행 제한', current: false },
  { id: '5', label: '버전 5', savedAt: '2026. 09. 28. 17:20', author: '김지민', changeSummary: '코드 · Runtime', current: false },
];
const previewVariables = [
  { name: 'GREETING', secret: false, value: '안녕하세요' },
  { name: 'API_KEY', secret: true },
];
const previewRuns = [
  { id: 'run-1', result: 'success' as const, startedAt: '2026. 09. 29. 14:34:12', path: '수동', duration: '182ms', outputLines: ['Greeting sent 지민', 'Using API_KEY ••••••••'] },
  { id: 'run-2', result: 'success' as const, startedAt: '2026. 09. 29. 13:08:27', path: 'HTTP POST', duration: '95ms' },
  { id: 'run-3', result: 'success' as const, startedAt: '2026. 09. 29. 09:00:00', path: '예약', duration: '1.2초' },
  { id: 'run-4', result: 'timeout' as const, startedAt: '2026. 09. 28. 17:23:41', path: 'HTTP POST', duration: '30초' },
];
const previewTestResult = {
  responseJson: '{\n  "message": "안녕하세요, 지민!"\n}',
  statusLabel: '성공',
  statusMessage: '함수가 정상적으로 응답했습니다',
  pathLabel: '수동 실행',
  pathCaption: '오늘 실행 횟수에 포함됩니다',
  durationLabel: '182ms',
  durationCaption: '메모리 46MB',
  logs: 'Greeting sent 지민',
  timestampLabel: '2026. 09. 29. 14:34:12',
};

function tabPath(functionId: string | undefined, tab: string) {
  const base = `/serverless/${encodeURIComponent(functionId ?? '')}`;
  const segment = tabSlugs[tab];
  return segment ? `${base}/${segment}` : base;
}

function safeDecode(value: string | undefined) {
  try {
    return decodeURIComponent(value ?? '');
  } catch {
    return value ?? '';
  }
}

function getDraft(locationState: unknown): ServerlessFunctionDraft | undefined {
  if (!locationState || typeof locationState !== 'object') return undefined;
  const draft = (locationState as { serverlessDraft?: ServerlessFunctionDraft }).serverlessDraft;
  return draft && typeof draft.name === 'string' ? draft : undefined;
}

function hasValidFunctionId(functionId: string | undefined, draft: ServerlessFunctionDraft | undefined) {
  const id = safeDecode(functionId);
  return id === 'welcome-api' || id === 'health-check' || Boolean(draft && id === draft.name);
}

function getFunctionDescription(functionId: string | undefined) {
  return safeDecode(functionId) === 'health-check'
    ? '개발 중인 서비스의 응답 상태를 확인합니다.'
    : '서비스 첫 방문자를 위한 환영 메시지를 반환합니다.';
}

export function ServerlessCreateRoute() {
  const navigate = useNavigate();
  if (!import.meta.env.DEV) return <Navigate to="/serverless" replace />;
  return (
    <ServerlessShell>
      <CreatePage
        onCancel={() => void navigate('/serverless')}
        onCreate={draft => void navigate('/serverless', { state: { serverlessDraft: draft } })}
      />
    </ServerlessShell>
  );
}

export function ServerlessFunctionRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const { functionId } = useParams<{ functionId: string }>();
  const draft = getDraft(location.state);
  if (!import.meta.env.DEV || !hasValidFunctionId(functionId, draft)) return <Navigate to="/serverless" replace />;
  const isHealthCheck = safeDecode(functionId) === 'health-check';
  const name = draft?.name ?? safeDecode(functionId);

  return (
    <ServerlessShell>
      <FunctionPage
        name={name}
        description={draft?.description ?? getFunctionDescription(functionId)}
        runtime={draft?.runtime ?? (isHealthCheck ? 'python' : 'javascript')}
        timeoutSeconds={draft?.timeoutSeconds}
        memoryMb={draft?.memoryMb}
        code={draft?.code ?? (isHealthCheck ? healthCheckCode : undefined)}
        active={draft ? false : !isHealthCheck}
        expiresAtLabel={draft ? '저장되지 않은 초안' : isHealthCheck ? '2026. 10. 02.' : '2026. 10. 06.'}
        enabledTabs={['코드', '버전', 'Trigger', '환경변수', '테스트', 'Logs']}
        onNavigateTab={tab => void navigate(tabPath(functionId, tab), { state: location.state })}
        onManageTriggers={() => void navigate(tabPath(functionId, 'Trigger'), { state: location.state })}
      />
    </ServerlessShell>
  );
}

export function ServerlessTriggersRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const { functionId } = useParams<{ functionId: string }>();
  const [dailyExecutions, setDailyExecutions] = useState<{ used: number; limit: number } | undefined>();
  const draft = getDraft(location.state);
  const isHealthCheck = safeDecode(functionId) === 'health-check';

  useEffect(() => {
    const controller = new AbortController();
    void getMyQuota(controller.signal).then(value => {
      if (!controller.signal.aborted) setDailyExecutions(value.fn.daily_executions);
    }).catch(() => {
      if (!controller.signal.aborted && import.meta.env.DEV) setDailyExecutions(previewDailyExecutions);
    });
    return () => controller.abort();
  }, []);

  if (!import.meta.env.DEV || !hasValidFunctionId(functionId, draft)) return <Navigate to="/serverless" replace />;
  return (
    <ServerlessShell>
      <TriggersPage
        functionName={draft?.name ?? safeDecode(functionId)}
        publicUrl={draft || isHealthCheck ? undefined : 'https://q8w2n5r7t1vz.example.com'}
        httpMethod={draft ? undefined : isHealthCheck ? 'GET' : 'POST'}
        concurrentLimit={draft ? undefined : isHealthCheck ? undefined : 2}
        dailyExecutions={dailyExecutions}
        triggers={draft ? [] : isHealthCheck ? [
          { id: 'health-http', type: 'HTTP', schedule: 'GET 요청 시', enabled: false },
        ] : [
          { id: 'http', type: 'HTTP', schedule: 'POST 요청 시', enabled: true },
          { id: 'cron', type: 'Cron', schedule: '매일 오전 9:00', enabled: true },
        ]}
        enabledTabs={['code', 'versions', 'triggers', 'environment', 'test', 'logs']}
        onSelectTab={tab => void navigate(tabPath(functionId, tab), { state: location.state })}
      />
    </ServerlessShell>
  );
}

export function ServerlessTabRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const { functionId, tab = '' } = useParams<{ functionId: string; tab: string }>();
  const draft = getDraft(location.state);
  if (!import.meta.env.DEV || !hasValidFunctionId(functionId, draft)) return <Navigate to="/serverless" replace />;
  if (!Object.hasOwn(tabSlugs, tab) || tab === 'triggers') return <Navigate to={tabPath(functionId, '코드')} replace />;

  const name = draft?.name ?? safeDecode(functionId);
  const isHealthCheck = safeDecode(functionId) === 'health-check';
  const description = draft?.description ?? getFunctionDescription(functionId);
  const onSelectTab = (nextTab: string) => void navigate(tabPath(functionId, nextTab), { state: location.state });
  let content = null;

  if (tab === 'versions') {
    content = <VersionsPage functionName={name} description={description} versions={draft || isHealthCheck ? [] : previewVersions} onSelectTab={onSelectTab} />;
  } else if (tab === 'environment') {
    content = <EnvironmentPage functionName={name} variables={draft || isHealthCheck ? [] : previewVariables} storageBytesUsed={draft || isHealthCheck ? undefined : 205} storageBytesLimit={draft || isHealthCheck ? undefined : 8192} onSelectTab={onSelectTab} />;
  } else if (tab === 'test') {
    content = <TestPage functionName={name} result={draft || isHealthCheck ? null : previewTestResult} enabledTabs={['code', 'versions', 'triggers', 'environment', 'test', 'logs']} onSelectTab={onSelectTab} />;
  } else if (tab === 'logs') {
    content = <LogsPage functionName={name} runs={draft || isHealthCheck ? [] : previewRuns} totalCount={draft || isHealthCheck ? 0 : 248} page={1} pageSize={100} selectedRunId={draft || isHealthCheck ? undefined : 'run-1'} enabledTabs={['code', 'versions', 'triggers', 'environment', 'test', 'logs']} onSelectTab={onSelectTab} />;
  } else {
    return <Navigate to={tabPath(functionId, '코드')} replace />;
  }

  return <ServerlessShell>{content}</ServerlessShell>;
}
