import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import styled from "styled-components";
import {
  canManageDemoApp,
  getDemoApp,
  getDemoAppQuota,
  demoPersonalAppOwner,
  isDemoAppExpired,
  isDemoAppSubdomainAvailable,
  formatDemoAppDate,
  updateDemoService,
  type DemoManagedService,
  type DemoAppVariable,
  type DemoDeployment,
} from "../../entities/app/demo";
import { listDemoDatabases } from "../../entities/database/demo";
import {
  activateDemoDeployment,
  databasePasswordVersion,
  deploymentFailureCopy,
  deploymentLog,
  reconcileDemoDatabaseRestarts,
  restartService,
  shellDuration,
} from "../../features/apps/demoServiceOperations";
import { DemoAppDialog } from "./DemoAppDialog";
import { DemoAppStateCards, useDemoAppRequest } from "./DemoAppRequestState";
import { getSessionUser } from "../../entities/session";
import { demoAppScopeOptions } from './demoAppScopeOptions';
import { isDemoMode } from "../../shared/demo";
import { Button, SelectField, SliderField, Switch, TextField } from "../../shared/ui/controls";
import { Banner, StatusBadge } from "../../shared/ui/feedback";
import { Octicon } from "../../shared/ui/icons";
import {
  StudentShell,
  type StudentNavigationKey,
} from "../../widgets/student-shell";

const Page = styled.div`
  display: flex;
  width: 100%;
  max-width: 1224px;
  flex-direction: column;
  gap: 24px;
  padding: 40px;

  @media (max-width: 960px) { padding: 24px; }
  @media (max-width: 600px) { padding: 20px 16px; }
  @media (max-width: 380px) { padding: 16px 12px; }
`;
const Breadcrumb = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font:
    ${({ theme }) => theme.typography.caption.weight}
      ${({ theme }) => theme.typography.caption.size}px /
      ${({ theme }) => theme.typography.caption.lineHeight}px
      ${({ theme }) => theme.typography.caption.family},
    sans-serif;

  a {
    color: inherit;
    text-decoration: none;

    &:hover, &:focus-visible { text-decoration: underline; }
  }
`;
const Heading = styled.section`
  display: flex;
  min-height: 74px;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
`;
const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font:
    ${({ theme }) => theme.typography.h1.weight}
      ${({ theme }) => theme.typography.h1.size}px /
      ${({ theme }) => theme.typography.h1.lineHeight}px
      ${({ theme }) => theme.typography.h1.family},
    sans-serif;
`;
const Subtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font:
    ${({ theme }) => theme.typography.bodySmall.weight}
      ${({ theme }) => theme.typography.bodySmall.size}px /
      ${({ theme }) => theme.typography.bodySmall.lineHeight}px
      ${({ theme }) => theme.typography.bodySmall.family},
    sans-serif;
`;
const NavRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  min-height: 42px;

  @media (max-width: 760px) {
    flex-wrap: wrap;
    justify-content: flex-start;

    > div:last-child { margin-left: auto; }
  }
`;
const NavActions = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
`;
const Tabs = styled.nav`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  @media (max-width: 760px) {
    width: 100%;
    flex: 1 1 100%;
    flex-wrap: nowrap;
    overflow-x: auto;
    overscroll-behavior-inline: contain;
    scrollbar-width: thin;
  }
`;
const Tab = styled.button<{ $active?: boolean }>`
  flex: 0 0 auto;
  min-width: 45px;
  min-height: 42px;
  padding: 0 12px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme, $active }) =>
    $active ? theme.colors.primarySoft : "transparent"};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.primary : theme.colors.muted};
  font:
    ${({ theme }) => theme.typography.label.weight}
      ${({ theme }) => theme.typography.label.size}px /
      ${({ theme }) => theme.typography.label.lineHeight}px
      ${({ theme }) => theme.typography.label.family},
    sans-serif;
  cursor: pointer;
`;
const Card = styled.section`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 600px) { padding: 16px; }
`;
const CardTitle = styled.h2`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};

  > svg { flex: 0 0 auto; color: ${({ theme }) => theme.colors.primary}; }
  font:
    ${({ theme }) => theme.typography.title.weight}
      ${({ theme }) => theme.typography.title.size}px /
      ${({ theme }) => theme.typography.title.lineHeight}px
      ${({ theme }) => theme.typography.title.family},
    sans-serif;
`;
const Help = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font:
    ${({ theme }) => theme.typography.caption.weight}
      ${({ theme }) => theme.typography.caption.size}px /
      ${({ theme }) => theme.typography.caption.lineHeight}px
      ${({ theme }) => theme.typography.caption.family},
    sans-serif;
`;
const StateBanner = styled(Banner)`
  @media (max-width: 600px) {
    flex-wrap: wrap;
    align-items: flex-start;

    > div:last-child { width: 100%; }
    > div:last-child > button { flex: 1 1 auto; }
  }
`;
const CardHeader = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 16px;
`;
const InfoRow = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;

  @media (max-width: 600px) { flex-wrap: wrap; }
`;
const InfoIcon = styled.span`
  display: inline-flex;
  width: 16px;
  flex: 0 0 16px;
  color: ${({ theme }) => theme.colors.muted};
`;
const InfoText = styled.div`
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 2px;

  > span, > small {
    color: ${({ theme }) => theme.colors.muted};
    font:
      ${({ theme }) => theme.typography.caption.weight}
        ${({ theme }) => theme.typography.caption.size}px /
        ${({ theme }) => theme.typography.caption.lineHeight}px
        ${({ theme }) => theme.typography.caption.family},
      sans-serif;
  }
  > small { color: ${({ theme }) => theme.colors.faint}; }
  > strong {
    overflow-wrap: anywhere;
    color: ${({ theme }) => theme.colors.text};
    font:
      ${({ theme }) => theme.typography.bodySmall.weight}
        ${({ theme }) => theme.typography.bodySmall.size}px /
        ${({ theme }) => theme.typography.bodySmall.lineHeight}px
        ${({ theme }) => theme.typography.bodySmall.family},
      sans-serif;
  }
`;
const InfoActions = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;

  @media (max-width: 600px) { width: 100%; padding-left: 28px; }
`;
const Table = styled.div`
  width: 100%;
  min-width: 0;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scrollbar-width: thin;
  border-radius: ${({ theme }) => theme.radii.sm}px;
`;
const TableHeader = styled.div`
  display: grid;
  min-width: 760px;
  grid-template-columns: 1.1fr 1.5fr 1fr 0.9fr 1fr;
  background: ${({ theme }) => theme.colors.raised};
  color: ${({ theme }) => theme.colors.muted};
  & > span {
    padding: 12px;
    font:
      ${({ theme }) => theme.typography.label.weight}
        ${({ theme }) => theme.typography.label.size}px /
        ${({ theme }) => theme.typography.label.lineHeight}px
        ${({ theme }) => theme.typography.label.family},
      sans-serif;
  }
`;
const TableRow = styled.div<{ $selected?: boolean }>`
  display: grid;
  min-width: 760px;
  min-height: 66px;
  grid-template-columns: 1.1fr 1.5fr 1fr 0.9fr 1fr;
  align-items: center;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm}px;
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.primarySoft : "transparent"};
  color: ${({ theme }) => theme.colors.muted};
  cursor: pointer;
  & > span {
    min-width: 0;
    padding: 10px 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font:
      ${({ theme }) => theme.typography.bodySmall.weight}
        ${({ theme }) => theme.typography.bodySmall.size}px /
        ${({ theme }) => theme.typography.bodySmall.lineHeight}px
        ${({ theme }) => theme.typography.bodySmall.family},
      sans-serif;
  }
  &:last-child {
    border-bottom: 0;
  }
`;
const RunningStatus = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  font:
    ${({ theme }) => theme.typography.label.weight}
      ${({ theme }) => theme.typography.label.size}px /
      ${({ theme }) => theme.typography.label.lineHeight}px
      ${({ theme }) => theme.typography.label.family},
    sans-serif;
`;
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;
const Metric = styled.div`
  display: flex;
  min-height: 338px;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 600px) {
    min-height: 280px;
    padding: 16px;
  }
`;
const BigValue = styled.strong`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: ${({ theme }) => theme.colors.text};

  sup {
    color: ${({ theme }) => theme.colors.muted};
    font:
      ${({ theme }) => theme.typography.caption.weight}
        ${({ theme }) => theme.typography.caption.size}px /
        ${({ theme }) => theme.typography.caption.lineHeight}px
        ${({ theme }) => theme.typography.caption.family},
      sans-serif;
  }
  font:
    ${({ theme }) => theme.typography.h1.weight}
      ${({ theme }) => theme.typography.h1.size}px /
      ${({ theme }) => theme.typography.h1.lineHeight}px
      ${({ theme }) => theme.typography.h1.family},
    sans-serif;
`;
const Plot = styled.svg`
  width: 100%;
  height: 140px;
  overflow: visible;
  line {
    stroke: ${({ theme }) => theme.colors.border};
    stroke-width: 1;
  }
  line.restart {
    stroke: ${({ theme }) => theme.colors.danger};
    stroke-width: 2;
  }
  polyline {
    fill: none;
    stroke: ${({ theme }) => theme.colors.primary};
    stroke-width: 2;
  }
`;
const ToggleRow = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  > label { flex: 0 0 auto; }
`;
const ToggleText = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;

  strong {
    color: ${({ theme }) => theme.colors.text};
    font:
      ${({ theme }) => theme.typography.label.weight}
        ${({ theme }) => theme.typography.label.size}px /
        ${({ theme }) => theme.typography.label.lineHeight}px
        ${({ theme }) => theme.typography.label.family},
      sans-serif;
  }
  span {
    color: ${({ theme }) => theme.colors.faint};
    font:
      ${({ theme }) => theme.typography.caption.weight}
        ${({ theme }) => theme.typography.caption.size}px /
        ${({ theme }) => theme.typography.caption.lineHeight}px
        ${({ theme }) => theme.typography.caption.family},
      sans-serif;
  }
`;
const formatGb = (mb: number) => new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(mb / 1024);
const Code = styled.pre`
  min-height: 64px;
  margin: 0;
  padding: 16px;
  overflow: auto;
  border-radius: ${({ theme }) => theme.radii.sm}px;
  background: ${({ theme }) => theme.colors.canvas};
  color: ${({ theme }) => theme.colors.text};
  font:
    ${({ theme }) => theme.typography.code.weight}
      ${({ theme }) => theme.typography.code.size}px /
      ${({ theme }) => theme.typography.code.lineHeight}px
      ${({ theme }) => theme.typography.code.family},
    monospace;

  > span { display: block; min-height: ${({ theme }) => theme.typography.code.lineHeight}px; }
  i {
    display: inline-block;
    width: 40px;
    color: ${({ theme }) => theme.colors.faint};
    font-style: normal;
    user-select: none;
  }

  @media (max-width: 600px) { padding: 12px; }
`;
function CodeLines({ lines, numbered = false }: { lines: string[]; numbered?: boolean }) {
  return (
    <Code>
      {lines.map((line, index) => (
        <span key={index}>{numbered && <i>{index + 1}</i>}{line}</span>
      ))}
    </Code>
  );
}
const Alert = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.primary};
  font:
    ${({ theme }) => theme.typography.bodySmall.weight}
      ${({ theme }) => theme.typography.bodySmall.size}px /
      ${({ theme }) => theme.typography.bodySmall.lineHeight}px
      ${({ theme }) => theme.typography.bodySmall.family},
    sans-serif;
`;

const tabs = [
  ["deployments", "배포"],
  ["logs", "로그"],
  ["metrics", "지표"],
  ["shell", "셸"],
  ["variables", "변수"],
  ["settings", "설정"],
  ["domains", "도메인"],
] as const;
type TabKey = (typeof tabs)[number][0];
const tabLabel = (value: string): TabKey =>
  tabs.some(([key]) => key === value) ? (value as TabKey) : "deployments";
/** `?demoError=<scope>`로 각 서비스 탭의 불러오기 오류를 볼 수 있다. */
const serviceRequestScope: Record<TabKey, string> = {
  deployments: "apps-deploy",
  logs: "apps-logs",
  metrics: "apps-metrics",
  shell: "apps-shell",
  variables: "apps-variables",
  settings: "apps-service-settings",
  domains: "apps-domains",
};

const plotPoints = {
  memory: "0,101 52,98 94,99 140,92 186,90 232,88 281,80 328,74 376,80 420,83 466,86 512,85",
  cpu: "0,114 46,118 92,109 140,102 186,106 232,98 279,74 326,18 372,52 419,87 465,106 512,102",
};
function MiniPlot({ kind, restart = false }: { kind: keyof typeof plotPoints; restart?: boolean }) {
  return (
    <Plot
      viewBox="0 0 512 140"
      preserveAspectRatio="none"
      role="img"
      aria-label="최근 24시간 사용량 그래프"
    >
      {[0, 47, 93, 139].map((y) => (
        <line key={y} x1="0" x2="512" y1={y} y2={y} />
      ))}
      <polyline points={plotPoints[kind]} />
      {restart && <line className="restart" x1="349" x2="349" y1="0" y2="140" />}
    </Plot>
  );
}

export default function DemoServicePage() {
  const { appId = "", serviceId = "" } = useParams<{ appId: string; serviceId: string }>();
  return <ServiceDetail key={`${appId}/${serviceId}`} appId={appId} serviceId={serviceId} />;
}

type VariableChanges = { variables?: DemoAppVariable[]; databaseId?: string };
type ServiceDialog =
  | { kind: "deploy" | "rollback"; deployment: DemoDeployment }
  | { kind: "variables"; changes: VariableChanges }
  | { kind: "port" | "read-only" | "domain" };

function ServiceDetail({ appId, serviceId }: { appId: string; serviceId: string }) {
  const navigate = useNavigate();
  const [, setRevision] = useState(0);
  const app = getDemoApp(appId);
  const service = app?.services.find(item => item.id === serviceId);
  const { tab: rawTab = "deployments" } = useParams<{ tab: string }>();
  const tab = tabLabel(rawTab);
  const user = getSessionUser();
  const [notice, setNotice] = useState("");
  const [variableKey, setVariableKey] = useState("CONTACT_EMAIL");
  const [variableValue, setVariableValue] = useState("jimin@example.com");
  const [variableSecret, setVariableSecret] = useState(false);
  const [editingVariableKey, setEditingVariableKey] = useState<string>();
  const [editingVariableValue, setEditingVariableValue] = useState("");
  const [variablesEditing, setVariablesEditing] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState<string>();
  const [dialog, setDialog] = useState<ServiceDialog>();
  const [variableChanges, setVariableChanges] = useState<VariableChanges>({});
  const [logsPaused, setLogsPaused] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState<
    Partial<DemoManagedService>
  >({});
  const [domainDraft, setDomainDraft] = useState<string>();
  const [shellInput, setShellInput] = useState("");
  const request = useDemoAppRequest(serviceRequestScope[tab], `${appId}/${serviceId}/${tab}`);

  const expiresAt = service?.shellExpiresAt;
  const [clock, setClock] = useState(Date.now);
  useEffect(() => {
    if (!expiresAt || !service?.shellOpen || expiresAt <= Date.now()) return;
    const tick = window.setInterval(() => setClock(Date.now()), 60_000);
    const expiry = window.setTimeout(() => setClock(Date.now()), expiresAt - Date.now());
    return () => { window.clearInterval(tick); window.clearTimeout(expiry); };
  }, [expiresAt, service?.shellOpen]);
  useEffect(() => {
    const refresh = () => {
      const current = getDemoApp(appId);
      if (current && reconcileDemoDatabaseRestarts(current)) setRevision(value => value + 1);
    };
    refresh();
    window.addEventListener("gsmsv:demo-database-state-change", refresh);
    return () => window.removeEventListener("gsmsv:demo-database-state-change", refresh);
  }, [appId]);

  const teamPath = app?.owner?.type === "team" ? `/teams/${encodeURIComponent(app.owner.id)}` : "";
  const listPath = `${teamPath}/apps`;
  const scopeOptions = demoAppScopeOptions(app?.owner, navigate);
  const move = (next: string) =>
    navigate(
      `/apps/${encodeURIComponent(appId)}/services/${encodeURIComponent(serviceId)}/${next}`,
    );
  const navigateFromShell = (item: Exclude<StudentNavigationKey, "none">) => {
    if (item === "home") navigate(teamPath || "/");
    if (item === "apps") navigate(listPath);
    if (item === "team") navigate(teamPath || "/teams");
    if (item === "database") navigate(teamPath ? `/databases?owner=${encodeURIComponent(app?.owner?.id ?? "")}` : "/databases");

    return ['home', 'apps', 'team', 'database'].includes(item);
  };
  const shell = (children: React.ReactNode) => (
    <StudentShell
      activeItem="apps"
      scopeLabel={teamPath ? app?.owner?.name ?? "팀 Resources" : "내 Resources"}
      scopeOptions={scopeOptions}
      userName={user?.name ?? "김지민"}
      onNavigate={navigateFromShell}
      onCreateTeam={() => navigate("/teams/new")}
      onOpenStatus={() => navigate("/status")}
      onSelectScope={() => undefined}
      onSearch={() => undefined}
      onOpenNotifications={() => undefined}
    >
      {children}
    </StudentShell>
  );

  if (!isDemoMode() || !app || !service)
    return shell(
      <Page>
        <Breadcrumb>Apps</Breadcrumb>
        <Card>
          <CardTitle>앱을 찾을 수 없습니다</CardTitle>
          <Help>주소가 바뀌었거나 지워진 앱입니다. 볼 수 있는 권한이 없는 앱도 이렇게 보입니다.</Help>
          <Button onClick={() => navigate(listPath)}>Apps 목록</Button>
        </Card>
      </Page>,
    );

  const canManage = canManageDemoApp(app);
  const expired = isDemoAppExpired(app);
  const memoryRestart = service.restartReason === "memory" || service.id === "demo-web";
  const shellExpired = Boolean(service.shellOpen && (!expiresAt || Math.max(clock, Date.now()) >= expiresAt));
  const shellActive = service.shellOpen && !shellExpired && !expired && service.status !== "정지";
  const quota = tab === "metrics" || tab === "settings" ? getDemoAppQuota(app.owner ?? demoPersonalAppOwner) : null;
  const variables = variableChanges.variables ?? service.variables;
  const variableSize = new TextEncoder().encode(JSON.stringify(variables)).length;
  const databases = tab === "variables" ? listDemoDatabases(app.owner?.type === "team" ? app.owner.id : "me") : [];
  const databaseId = variableChanges.databaseId ?? service.databaseId ?? "";
  const selected = service.deployments.find(item => item.id === selectedDeployment) ??
    service.deployments.find(item => item.status === "running") ?? service.deployments[0];
  const failure = selected && deploymentFailureCopy(selected);
  const skipped = service.deployments.find(item => item.status === "skipped");
  const update = (patch: Partial<DemoManagedService>) => {
    const updated = updateDemoService(appId, serviceId, patch);
    if (updated) setRevision(value => value + 1);
    setNotice(updated ? "" : "변경사항을 저장하지 못했습니다. 다시 시도해 주세요.");
    return updated;
  };
  const clearVariableInput = () => {
    setVariableKey("");
    setVariableValue("");
    setVariableSecret(false);
  };
  const requestVariables = (save: boolean) => {
    if (!canManage) { setDialog({ kind: "read-only" }); return; }
    const key = variableKey.trim();
    const input = document.getElementById("demo-new-variable-key");
    if (!key && !save) { input?.focus(); return; }
    if (key === "PORT") { setDialog({ kind: "port" }); return; }
    if (key && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      setNotice("변수 이름은 영문 또는 밑줄로 시작하고 영문, 숫자, 밑줄만 쓸 수 있습니다.");
      input?.focus();
      return;
    }
    const changes = key ? {
      ...variableChanges,
      variables: [...variables.filter(item => item.key !== key), { key, value: variableValue, secret: variableSecret }],
    } : variableChanges;
    if (new TextEncoder().encode(JSON.stringify(changes.variables ?? variables)).length > 32 * 1024) {
      setNotice("변수는 32 KB까지 저장할 수 있습니다.");
      return;
    }
    setNotice("");
    if (save) {
      if (Object.keys(changes).length) setDialog({ kind: "variables", changes });
    } else {
      setVariableChanges(changes);
      clearVariableInput();
      input?.focus();
    }
  };
  const openShell = () => {
    if (!canManage || expired) return;
    if (!shellActive && service.status === "정지") return;
    const time = Date.now();
    setClock(time);
    setShellInput("");
    update(shellActive ? { shellOpen: false, shellExpiresAt: undefined } : {
      shellOpen: true,
      shellExpiresAt: time + shellDuration,
      shellLines: ["$"],
      status: "실행 중",
    });
  };
  const saveSettings = () => {
    const required = (settingsDraft.memoryMb ?? service.memoryMb) - service.memoryMb;
    if (!quota) return;
    if (required > quota.freeMemory || (settingsDraft.alwaysOn && !service.alwaysOn && quota.alwaysOn >= 1)) {
      setNotice("메모리 또는 상시 실행 할당량을 확인해 주세요.");
      return;
    }
    if (update(settingsDraft)) { setSettingsDraft({}); setNotice("설정을 저장했습니다."); }
  };
  const actionButton =
    tab === "deployments" ? (
      <Button variant="secondary" icon={<Octicon name="sync" size={16} />} disabled={!canManage || expired} onClick={() => {
        const current = service.deployments.find(item => item.status === "running");
        const deployment: DemoDeployment = current ?? {
          id: crypto.randomUUID().slice(0, 7), status: "previous", commit: "재배포",
          author: user?.name ?? "김지민", at: formatDemoAppDate(Date.now()), message: "빌드 로그 보기",
        };
        setDialog({ kind: "deploy", deployment });
      }}>재배포</Button>
    ) : tab === "logs" ? (
      <Button variant="secondary" icon={<Octicon name={logsPaused ? "play" : "stop"} size={16} />} onClick={() => setLogsPaused(value => !value)}>
        {logsPaused ? "다시 시작" : "일시 정지"}
      </Button>
    ) : tab === "variables" ? (
      <>
        <Button variant="secondary" icon={<Octicon name="plus" size={16} />} disabled={expired} onClick={() => requestVariables(false)}>변수 추가</Button>
        <Button icon={<Octicon name="check" size={16} />} disabled={expired} onClick={() => requestVariables(true)}>변경사항 저장</Button>
      </>
    ) : tab === "shell" ? (
      <Button variant="secondary" icon={<Octicon name={shellActive ? "stop" : "terminal"} size={16} />} disabled={!canManage || expired || service.status === "정지"} onClick={openShell}>
        {shellExpired ? "다시 열기" : shellActive ? "세션 끝내기" : "셸 열기"}
      </Button>
    ) : tab === "settings" ? (
      <Button icon={<Octicon name="check" size={16} />} disabled={expired} onClick={() => canManage ? saveSettings() : setDialog({ kind: "read-only" })}>설정 저장</Button>
    ) : tab === "domains" ? (
      <Button icon={<Octicon name="check" size={16} />} disabled={!canManage || expired || service.type !== "웹"} onClick={() => {
        const subdomain = (domainDraft ?? service.subdomain).trim();
        if (subdomain === service.subdomain) { setDomainDraft(undefined); return; }
        if (!isDemoAppSubdomainAvailable(subdomain, service.id)) { setDialog({ kind: "domain" }); return; }
        if (update({ subdomain })) { setDomainDraft(undefined); setNotice("주소를 저장했습니다."); }
      }}>저장</Button>
    ) : null;

  let content: React.ReactNode;
  if (tab === "deployments") {
    const failureTone = selected?.failure === "pre-deploy" || selected?.failure === "health" ? "warning" : "danger";
    const failureIcon = selected?.failure === "timeout" ? "clock" : selected?.failure === "health" ? "pulse" : "alert";
    content = (
      <>
        {failure ? (
          <StateBanner
            tone={failureTone}
            icon={<Octicon name={failureIcon} size={20} />}
            title={failure[0]}
            description={failure[1]}
            action={<Button variant="secondary" icon={<Octicon name="terminal" size={16} />} onClick={() => document.getElementById("demo-build-log")?.focus()}>빌드 로그</Button>}
          />
        ) : skipped && !canManage ? (
          <StateBanner
            tone="neutral"
            icon={<Octicon name="people" size={20} />}
            title="팀장·DevOps가 배포해야 나갑니다"
            description="내가 push한 커밋은 배포 권한이 있는 팀원이 「이 커밋 배포」를 눌러야 나갑니다."
          />
        ) : skipped && selected?.status === "skipped" ? (
          <StateBanner
            tone="neutral"
            icon={<Octicon name="shield" size={20} />}
            title="push를 건너뛰었습니다"
            description={`${skipped.author} · ${skipped.id}은 배포 권한이 없는 사람의 push라 배포하지 않았습니다.`}
            action={<Button variant="secondary" icon={<Octicon name="history" size={16} />} onClick={() => document.getElementById("demo-deployment-history")?.focus()}>배포 기록</Button>}
          />
        ) : skipped ? (
          <StateBanner
            tone="neutral"
            icon={<Octicon name="shield" size={20} />}
            title="건너뛴 push가 있습니다"
            description="배포 권한이 없는 사람의 push라 배포하지 않았습니다. 기록에서 확인한 뒤 「이 커밋 배포」로 내보낼 수 있습니다."
          />
        ) : null}
        <Card id="demo-deployment-history" tabIndex={-1}>
          <CardTitle>배포 기록 · 최근 10개</CardTitle>
          <Table>
            <TableHeader>
              <span>상태</span>
              <span>커밋</span>
              <span>누가</span>
              <span>시각</span>
              <span>작업</span>
            </TableHeader>
            {service.deployments.slice(0, 10).map((item) => (
              <TableRow
                key={item.id}
                $selected={item.id === selected?.id}
                onClick={() => setSelectedDeployment(item.id)}
              >
                <span>
                  {item.status === "running" ? <RunningStatus>실행 중</RunningStatus> : (
                    <StatusBadge tone={item.status === "skipped" ? "warning" : item.status === "failed" ? "danger" : "neutral"}>
                      {item.status === "skipped" ? "건너뜀" : item.status === "failed" ? "실패" : "지난 배포"}
                    </StatusBadge>
                  )}
                </span>
                <span>
                  {item.commitId ?? item.id} {item.commit}
                </span>
                <span>{item.author}</span>
                <span>{item.at}</span>
                <span>
                  <Button
                    variant="ghost"
                    icon={<Octicon name={item.status === "skipped" ? "play" : item.status === "previous" ? "history" : "terminal"} size={16} />}
                    disabled={(item.status === "skipped" || item.status === "previous") && (!canManage || expired)}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (item.status === "skipped" || item.status === "previous") {
                        setDialog({ kind: item.status === "skipped" ? "deploy" : "rollback", deployment: item });
                      } else {
                        setSelectedDeployment(item.id);
                      }
                    }}
                  >
                    {item.status === "skipped" ? "이 커밋 배포" : item.status === "previous" ? "되돌리기" : "빌드 로그"}
                  </Button>
                </span>
              </TableRow>
            ))}
          </Table>
          <Help>되돌리기는 다시 빌드하지 않고 그 배포를 그대로 씁니다. 변수는 지금 값을 씁니다.</Help>
        </Card>
        {selected && (
          <Card id="demo-build-log" tabIndex={-1}>
            <CardTitle>
              <Octicon name="terminal" size={16} />
              선택한 배포 · {selected.commitId ?? selected.id} 빌드 로그
            </CardTitle>
            <CodeLines lines={deploymentLog(app, service, selected).split("\n")} numbered />
            <Help>
              상태 확인에 실패하면 새 배포로 바꾸지 않고 지금 배포를 계속
              씁니다.
            </Help>
          </Card>
        )}
      </>
    );
  } else if (tab === "logs") {
    content = (
      <>
        <StateBanner
          tone="neutral"
          icon={<Octicon name="history" size={20} />}
          title="최근 3일 또는 50 MB까지 보관합니다"
          description="비밀 변수 값은 가려서 보여 줍니다. 요청마다 남는 HTTP 접근 기록은 따로 없습니다."
        />
        <Card>
          <CardTitle>
            <Octicon name="terminal" size={16} />
            {service.environment} · {service.name} · {logsPaused ? "일시 정지됨" : "실시간"}
          </CardTitle>
          <CodeLines
            numbered
            lines={[
              "11:02:14  Server listening on port 3000",
              "11:02:15  Connected to welcome-db",
              "11:05:41  Using MAIL_API_KEY ••••••••",
              "11:05:42  Contact mail sent",
              "11:12:03  warn  Slow query 1.2s",
              "11:22:03  GSMSV  요청이 없어 잠들었어요",
              "11:31:40  GSMSV  요청이 와서 깨어났어요",
              "11:31:41  Server listening on port 3000",
              ...(service.restartReason === "limit" ? [`GSMSV  ${service.name}이 10번 넘게 다시 시작해서 멈췄습니다`] : []),
              ...(service.restartReason === "variables" ? [`GSMSV  변수를 저장해 ${service.name}이 다시 시작했습니다`] : []),
              ...(service.restartReason === "database" ? [`GSMSV  ${service.databaseId} 비밀번호가 바뀌어 다시 시작했습니다`] : []),
            ]}
          />
          <Help>
            서비스가 출력한 내용만 남습니다. 3일이 지나거나 50 MB를 넘으면
            오래된 로그부터 지워집니다.
          </Help>
        </Card>
      </>
    );
  } else if (tab === "metrics") {
    content = (
      <>
        {memoryRestart && <StateBanner
          tone="warning"
          icon={<Octicon name="alert" size={20} />}
          title="메모리 상한에 닿아 다시 시작했습니다"
          description="11월 2일 09:40에 512 MB를 넘어 강제로 종료한 뒤 다시 시작했습니다. 메모리를 늘리거나 코드를 확인해 주세요."
          action={<Button variant="secondary" icon={<Octicon name="gear" size={16} />} onClick={() => move("settings")}>설정 열기</Button>}
        />}
        {quota?.freeMemory === 0 && <StateBanner
          tone="warning"
          icon={<Octicon name="cpu" size={20} />}
          title="메모리 할당량을 모두 썼습니다"
          description="PR 미리보기 환경도 할당량에 들어갑니다. 쓰지 않는 환경을 정리하거나 메모리를 줄여 주세요."
          action={<Button variant="secondary" icon={<Octicon name="gear" size={16} />} onClick={() => navigate(`/apps/${encodeURIComponent(appId)}/demo-settings`)}>앱 설정</Button>}
        />}
        <Grid>
          <Metric>
            <CardTitle>메모리</CardTitle>
            <BigValue>
              {Math.min(service.memoryMb, 418)}<sup>MB</sup>
            </BigValue>
            <MiniPlot kind="memory" restart={memoryRestart} />
            <Help>
              최근 24시간 · 최대 {Math.min(service.memoryMb, 512)} MB · 할당 {service.memoryMb} MB
              {memoryRestart && " · 빨간 선은 09:40 다시 시작"}
            </Help>
          </Metric>
          <Metric>
            <CardTitle>CPU</CardTitle>
            <BigValue>
              12<sup>%</sup>
            </BigValue>
            <MiniPlot kind="cpu" />
            <Help>최근 24시간 · 최대 64% · 할당 {service.cpu} vCPU</Help>
          </Metric>
        </Grid>
      </>
    );
  } else if (tab === "variables") {
    content = (
      <>
        <StateBanner
          tone="neutral"
          icon={<Octicon name="lock" size={20} />}
          title="비밀 변수는 저장한 뒤 다시 볼 수 없습니다"
          description="일반 변수는 이 앱을 볼 수 있는 사람 모두가 볼 수 있습니다. API 키처럼 숨길 값은 비밀로 저장하세요."
        />
        <Card>
          <CardHeader>
            <CardTitle>
              등록된 변수 · {variables.length}개 · {(variableSize / 1024).toFixed(1)} / 32 KB
            </CardTitle>
            <Button
              variant="secondary"
              icon={<Octicon name="pencil" size={16} />}
              onClick={() => canManage && !expired ? setVariablesEditing(value => !value) : setDialog({ kind: "read-only" })}
            >
              {variablesEditing ? "편집 완료" : "변수 편집"}
            </Button>
          </CardHeader>
          {variables.map((variable) => (
            <InfoRow key={variable.key}>
              <InfoIcon aria-hidden="true"><Octicon name="key" size={16} /></InfoIcon>
              <InfoText>
                <span>{variable.key}</span>
                <strong>
                  {variable.secret
                    ? "비밀 · 저장한 뒤 다시 볼 수 없습니다"
                    : variable.value}
                </strong>
              </InfoText>
              {canManage && !expired && (variablesEditing || variable.secret) && (
                <InfoActions>
                  {editingVariableKey === variable.key ? (
                    <>
                      <TextField
                        autoFocus
                        aria-label={`${variable.key} 값`}
                        type={variable.secret ? "password" : "text"}
                        value={editingVariableValue}
                        onChange={event => setEditingVariableValue(event.currentTarget.value)}
                      />
                      <Button
                        variant="ghost"
                        icon={<Octicon name="check" size={16} />}
                        onClick={() => {
                          setVariableChanges(current => ({
                            ...current,
                            variables: variables.map(item => item.key === variable.key
                              ? { ...item, value: editingVariableValue }
                              : item),
                          }));
                          setEditingVariableKey(undefined);
                        }}
                      >저장</Button>
                      <Button variant="ghost" onClick={() => setEditingVariableKey(undefined)}>취소</Button>
                    </>
                  ) : <Button
                    variant="ghost"
                    icon={<Octicon name="pencil" size={16} />}
                    onClick={() => {
                      setEditingVariableKey(variable.key);
                      setEditingVariableValue(variable.secret ? "" : variable.value);
                    }}
                  >값 바꾸기</Button>}
                  <Button
                    variant="ghost"
                    icon={<Octicon name="trashcan" size={16} />}
                    onClick={() =>
                      setVariableChanges(current => ({ ...current, variables: variables.filter(item => item.key !== variable.key) }))
                    }
                  >
                    지우기
                  </Button>
                </InfoActions>
              )}
            </InfoRow>
          ))}
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>새 변수</CardTitle>
            <Button
              variant="ghost"
              icon={<Octicon name="trashcan" size={16} />}
              disabled={!canManage || expired}
              onClick={clearVariableInput}
            >
              이 행 삭제
            </Button>
          </CardHeader>
          <TextField
            id="demo-new-variable-key"
            label="키"
            disabled={!canManage || expired}
            value={variableKey}
            onChange={(event) => setVariableKey(event.currentTarget.value)}
          />
          <TextField
            label="값"
            value={variableValue}
            disabled={!canManage || expired}
            type={variableSecret ? "password" : "text"}
            onChange={(event) => setVariableValue(event.currentTarget.value)}
          />
          <ToggleRow>
            <ToggleText>
              <strong>비밀로 저장</strong>
              <span>켜면 저장한 뒤 값을 다시 볼 수 없습니다. 바꾸기와 지우기만 할 수 있습니다.</span>
            </ToggleText>
            <Switch
              label=""
              ariaLabel="비밀로 저장"
              checked={variableSecret}
              disabled={!canManage || expired}
              onChange={setVariableSecret}
            />
          </ToggleRow>
        </Card>
        <Card>
          <CardTitle>Database 연결</CardTitle>
          <SelectField
            label="연결할 Database"
            value={databases.find(database => database.grn === databaseId || database.grn.endsWith(`:${databaseId}`))?.grn ?? ""}
            disabled={!canManage || expired}
            options={[
              { value: "", label: "연결하지 않음" },
              ...databases.map(database => ({ value: database.grn, label: `${database.name} · ${database.engine === "mysql" ? "MySQL" : "PostgreSQL"}` })),
            ]}
            onChange={(value) => setVariableChanges(current => ({ ...current, databaseId: value }))}
          />
          <Help>
            환경마다 자기 Database를 연결합니다. 연결하면 접속 정보가 변수로
            들어가고, staging은 따로 연결합니다.
          </Help>
        </Card>
        <Card>
          <CardTitle>
            <Octicon name="code" size={16} />
            코드에서 쓰기 · Node.js
          </CardTitle>
          <CodeLines
            numbered
            lines={[
              "const apiKey = process.env.MAIL_API_KEY;",
              "const port = process.env.PORT; // GSMSV가 넣어요",
            ]}
          />
          <Help>
            저장하면 빌드 없이 서비스가 다시 시작됩니다. PORT처럼 GSMSV가 쓰는
            이름은 만들 수 없습니다.
          </Help>
        </Card>
      </>
    );
  } else if (tab === "settings") {
    content = (
      <>
        {service.configFile && <StateBanner
          tone="warning"
          icon={<Octicon name="file-code" size={20} />}
          title="설정 파일에서 무시한 칸이 있습니다"
          description="메모리·변수는 설정 파일로 바꿀 수 없어서 무시했습니다. 이 화면에서 바꿔 주세요."
        />}
        <Card>
          <CardTitle>실행</CardTitle>
          <TextField
            label="시작 명령"
            disabled={!canManage || expired || service.configFile}
            value={settingsDraft.startCommand ?? service.startCommand}
            hint={service.configFile ? "설정 파일이 덮어씀 · 바꾸려면 저장소의 {설정 파일}을 고쳐 주세요." : undefined}
            onChange={event => {
              const startCommand = event.currentTarget.value;
              setSettingsDraft(current => ({ ...current, startCommand }));
            }}
          />
          <TextField
            label="상태 확인 경로"
            disabled={!canManage || expired}
            value={settingsDraft.path ?? service.path}
            hint="새 배포가 이 경로에서 200을 돌려줘야 바꿉니다. 300초 안에 응답하지 않으면 실패로 남습니다."
            onChange={event => {
              const path = event.currentTarget.value;
              setSettingsDraft(current => ({ ...current, path }));
            }}
          />
          <TextField
            label="배포 전 명령"
            disabled={!canManage || expired}
            value={settingsDraft.preDeployCommand ?? service.preDeployCommand}
            hint="새 배포로 바꾸기 전에 한 번 실행합니다. 기본 10분, 최대 30분까지 기다립니다."
            onChange={event => {
              const preDeployCommand = event.currentTarget.value;
              setSettingsDraft(current => ({ ...current, preDeployCommand }));
            }}
          />
          <TextField
            label="감시 경로"
            disabled={!canManage || expired}
            value={settingsDraft.watchPaths ?? service.watchPaths}
            hint="이 경로의 파일이 바뀐 push만 배포합니다. 비워 두면 모든 push를 배포합니다."
            onChange={event => {
              const watchPaths = event.currentTarget.value;
              setSettingsDraft(current => ({ ...current, watchPaths }));
            }}
          />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>자원</CardTitle>
            <Help>메모리 할당량 {formatGb(quota?.usedMemory ?? 0)}/2 GB 사용 중 · 남은 할당량 {formatGb(quota?.freeMemory ?? 0)} GB</Help>
          </CardHeader>
          <SliderField
            label="메모리"
            disabled={!canManage || expired}
            value={settingsDraft.memoryMb ?? service.memoryMb}
            min={256}
            max={1024}
            step={128}
            minLabel="최소 256 MB"
            maxLabel="최대 1 GB"
            valueLabel={
              (settingsDraft.memoryMb ?? service.memoryMb) >= 1024
                ? "1 GB"
                : `${settingsDraft.memoryMb ?? service.memoryMb} MB`
            }
            onChange={(value) =>
              setSettingsDraft((current) => ({ ...current, memoryMb: value }))
            }
          />
          <SliderField
            label="CPU"
            disabled={!canManage || expired}
            value={settingsDraft.cpu ?? service.cpu}
            min={0.25}
            max={1}
            step={0.25}
            minLabel="최소 0.25 vCPU"
            maxLabel="최대 1 vCPU"
            valueLabel={`${settingsDraft.cpu ?? service.cpu} vCPU`}
            onChange={(value) =>
              setSettingsDraft((current) => ({ ...current, cpu: value }))
            }
          />
          <Help>
            컨테이너 안 파일은 재시작하면 사라집니다. 남길 데이터는 Database에
            저장하세요.
          </Help>
        </Card>
        <Card>
          <CardTitle>상시 실행</CardTitle>
          <ToggleRow>
            <ToggleText>
              <strong>요청이 없어도 깨어 있기</strong>
              <span>켜면 잠들지 않고 계속 실행됩니다. 상시 실행은 1개까지 켤 수 있고 지금 {quota?.alwaysOn}개 씁니다.</span>
            </ToggleText>
            <Switch
              label=""
              ariaLabel="요청이 없어도 깨어 있기"
              disabled={!canManage || expired}
              checked={settingsDraft.alwaysOn ?? service.alwaysOn}
              onChange={alwaysOn => setSettingsDraft(current => ({ ...current, alwaysOn }))}
            />
          </ToggleRow>
        </Card>
        {service.type === "크론" && <Card>
          <CardTitle>{service.name} 크론 설정</CardTitle>
          <CodeLines lines={[service.cronSchedule ?? ""]} />
          <Help>· 매일 03:00에 실행합니다. 서울 시간으로 계산합니다.<br />· 5분보다 자주 실행할 수 없고, 30분이 넘으면 강제로 끝냅니다.<br />· staging·PR 환경에서는 따로 켜야 실행됩니다.</Help>
          <ToggleRow>
            <ToggleText><strong>{service.environment}</strong></ToggleText>
            <Switch
              label=""
              ariaLabel="크론 실행"
              disabled={!canManage || expired}
              checked={settingsDraft.cronEnabled ?? service.cronEnabled ?? false}
              onChange={cronEnabled => setSettingsDraft(current => ({ ...current, cronEnabled }))}
            />
          </ToggleRow>
        </Card>}
      </>
    );
  } else if (tab === "domains") {
    content = (
      <>
        <Card>
          <CardTitle>production 주소</CardTitle>
          <TextField
            id="demo-service-domain"
            label="서브도메인"
            value={domainDraft ?? service.subdomain}
            disabled={!canManage || expired || service.type !== "웹"}
            hint={`주소는 https://${domainDraft ?? service.subdomain}.{앱 도메인}입니다. production만 직접 정할 수 있습니다.`}
            onChange={(event) => setDomainDraft(event.currentTarget.value)}
          />
        </Card>
        <Card>
          <CardTitle>다른 환경</CardTitle>
          <InfoRow>
            <InfoIcon aria-hidden="true"><Octicon name="globe" size={16} /></InfoIcon>
            <InfoText>
              <span>staging</span>
              <strong>{app.name}-staging.{"{앱 도메인}"}</strong>
              <small>자동으로 붙는 이름이라 바꿀 수 없습니다.</small>
            </InfoText>
          </InfoRow>
          <InfoRow>
            <InfoIcon aria-hidden="true"><Octicon name="globe" size={16} /></InfoIcon>
            <InfoText>
              <span>PR 미리보기</span>
              <strong>{app.name}-pr-&#123;번호&#125;.{"{앱 도메인}"}</strong>
              <small>PR 미리보기를 켜면 PR마다 생기고, 7일 뒤 정리됩니다.</small>
            </InfoText>
          </InfoRow>
        </Card>
      </>
    );
  } else {
    content = (
      <>
        <StateBanner
          tone={shellExpired ? "neutral" : "warning"}
          icon={<Octicon name={shellExpired ? "terminal" : "eye"} size={20} />}
          title={shellExpired ? "셸 세션이 끝났습니다" : "셸 안에서는 비밀 변수 값이 보입니다"}
          description={shellExpired
            ? "1시간이 지나 연결을 닫았습니다. 셸에서 바꾼 파일은 다시 시작하면 사라집니다."
            : "화면을 공유할 때 조심하세요. 세션은 1시간 뒤 끝납니다."}
          action={shellExpired && canManage && !expired && service.status !== "정지"
            ? <Button variant="secondary" icon={<Octicon name="terminal" size={16} />} onClick={openShell}>다시 열기</Button>
            : undefined}
        />
        <Card>
          <CardTitle>
            <Octicon name="terminal" size={16} />
            {service.environment} · {service.name} ·{" "}
            {shellActive ? `남은 시간 ${Math.ceil(((expiresAt ?? clock) - Math.max(clock, Date.now())) / 60_000)}분` : "셸이 닫혀 있습니다"}
          </CardTitle>
          <CodeLines lines={shellActive ? [...service.shellLines.slice(0, -1), `${service.shellLines.at(-1) ?? "$"} ${shellInput}`.trimEnd()] : []} />
          {shellActive && canManage && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const command = shellInput.trim();
                if (!command) return;
                const echo = /^echo \$([A-Za-z_][A-Za-z0-9_]*)$/.exec(command);
                const output = command === "node -v" ? "v20.11.1"
                  : command === "ls" ? "dist  node_modules  package.json  src"
                  : echo ? (service.variables.find(variable => variable.key === echo[1])?.value ?? "")
                  : "미리보기에서는 이 명령을 실행할 수 없습니다.";
                const shellLines = [...service.shellLines.slice(0, -1), `$ ${command}`, output, "$"];
                if (update({ shellLines })) setShellInput("");
              }}
            >
              <TextField
                label="명령"
                value={shellInput}
                onChange={(event) => setShellInput(event.currentTarget.value)}
                placeholder="터미널에 명령 입력"
              />
            </form>
          )}
          <Help>
            잠든 서비스는 셸을 열면 깨어납니다. 다시 시작하면 셸에서 바꾼 파일은
            사라집니다.
          </Help>
        </Card>
      </>
    );
  }

  return shell(
    <Page>
      <Breadcrumb><Link to={listPath}>Apps</Link> / <Link to={`/apps/${encodeURIComponent(appId)}/demo`}>{app.name}</Link></Breadcrumb>
      <Heading>
        <Title>{service.name}</Title>
        <Subtitle>
          {app.name} · {service.environment} ·{" "}
          {service.type === "웹" ? "웹 서비스" : service.type}
        </Subtitle>
      </Heading>
      <NavRow>
        <Tabs aria-label="서비스 메뉴">
          {tabs.filter(([key]) => key !== "domains" || service.type === "웹").map(([key, label]) => (
            <Tab
              key={key}
              $active={tab === key}
              aria-current={tab === key ? "page" : undefined}
              onClick={() => move(key)}
            >
              {label}
            </Tab>
          ))}
        </Tabs>
        {actionButton && <NavActions>{actionButton}</NavActions>}
      </NavRow>
      {request.status !== "ready"
        ? <DemoAppStateCards page="service" tab={tab} status={request.status} onRetry={request.retry} />
        : content}
      {dialog && (dialog.kind === "deploy" || dialog.kind === "rollback") && <DemoAppDialog
        title={dialog.kind === "rollback" ? `${dialog.deployment.commitId ?? dialog.deployment.id}으로 되돌리시겠습니까?` : "이 커밋을 배포하시겠습니까?"}
        confirmLabel={dialog.kind === "rollback" ? "되돌리기" : "배포"}
        onClose={() => setDialog(undefined)}
        onConfirm={() => {
          const updated = activateDemoDeployment(appId, serviceId, dialog.deployment, dialog.kind === "rollback");
          if (updated) {
            setRevision(value => value + 1);
            setSelectedDeployment(updated.deployments[0]?.id);
            setNotice("");
          } else {
            setNotice("배포 기록을 저장하지 못했습니다. 다시 시도해 주세요.");
          }
          setDialog(undefined);
        }}>
        {dialog.kind === "rollback"
          ? "· 다시 빌드하지 않고 그 배포를 그대로 씁니다.\n· 변수는 지금 값을 씁니다."
          : `· ${dialog.deployment.commitId ?? dialog.deployment.id} ${dialog.deployment.commit} · ${dialog.deployment.author}
· 빌드한 뒤 상태 확인을 통과하면 새 배포로 바꿉니다.`}
      </DemoAppDialog>}
      {dialog?.kind === "variables" && <DemoAppDialog title="변수를 저장하시겠습니까?"
        confirmLabel="저장하고 다시 시작" onClose={() => setDialog(undefined)} onConfirm={() => {
          if (update({ ...dialog.changes, ...restartService(service, "variables"), databasePasswordVersion: databasePasswordVersion(databaseId) })) {
            setVariableChanges({});
            clearVariableInput();
          }
          setDialog(undefined);
        }}>
        {`· 저장하면 빌드 없이 ${service.name}이 다시 시작됩니다.
· 다시 시작하는 동안 잠깐 응답하지 않을 수 있습니다.`}
      </DemoAppDialog>}
      {dialog?.kind === "port" && <DemoAppDialog title="PORT는 쓸 수 없는 이름입니다" onClose={() => setDialog(undefined)}>
        {"· PORT는 GSMSV가 넣어 주는 변수입니다.\n· 다른 이름으로 저장해 주세요."}
      </DemoAppDialog>}
      {dialog?.kind === "read-only" && <DemoAppDialog title="팀장·DevOps만 바꿀 수 있습니다" onClose={() => setDialog(undefined)}>
        {"· 일반 팀원은 변수와 설정을 볼 수만 있습니다.\n· 바꿔야 하면 팀장(김지민)이나 DevOps(한도윤)에게 알려 주세요."}
      </DemoAppDialog>}
      {dialog?.kind === "domain" && <DemoAppDialog title="서브도메인을 쓸 수 없습니다" onClose={() => setDialog(undefined)}
        confirmLabel="다른 이름 쓰기" onConfirm={() => { setDialog(undefined); document.getElementById("demo-service-domain")?.focus(); }}>
        {`· ${(domainDraft ?? service.subdomain).trim()}은 이미 다른 앱이 쓰고 있습니다.\n· GSMSV가 쓰려고 남겨 둔 이름도 쓸 수 없습니다.`}
      </DemoAppDialog>}
      {notice && <Alert role="status">{notice}</Alert>}
    </Page>,
  );
}

export function DemoStoppedAppContent() {
  const { appId = "" } = useParams<{ appId: string }>();
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get("service");
  const app = getDemoApp(appId);
  const service = app?.services.find(item => item.type === "웹" && (!serviceId || item.id === serviceId));
  const stopped = app && service && isDemoAppExpired(app);

  return (
    <StoppedCard>
      {stopped ? <>
        <StoppedTitle><Octicon name="stop" size={20} />이 앱은 지금 정지돼 있습니다</StoppedTitle>
        <Subtitle>사용 기간이 끝나 잠시 멈췄습니다. 만든 사람이 연장하면 다시 열립니다.</Subtitle>
        <InfoRow>
          <InfoIcon aria-hidden="true"><Octicon name="globe" size={16} /></InfoIcon>
          <InfoText>
            <span>주소</span>
            <strong>{service.subdomain}.{"{앱 도메인}"}</strong>
          </InfoText>
        </InfoRow>
      </> : <StoppedTitle>앱을 찾을 수 없습니다</StoppedTitle>}
    </StoppedCard>
  );
}

const StoppedCard = styled.section`
  display: flex;
  width: min(560px, calc(100% - 32px));
  margin: 80px auto;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 600px) {
    margin: 40px auto;
    padding: 16px;
  }
`;
const StoppedTitle = styled.h1`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font:
    ${({ theme }) => theme.typography.h2.weight}
      ${({ theme }) => theme.typography.h2.size}px /
      ${({ theme }) => theme.typography.h2.lineHeight}px
      ${({ theme }) => theme.typography.h2.family},
    sans-serif;

  svg { flex: 0 0 20px; }

  @media (max-width: 420px) {
    align-items: flex-start;
    font-size: ${({ theme }) => theme.typography.title.size}px;
    line-height: ${({ theme }) => theme.typography.title.lineHeight}px;
  }
`;
