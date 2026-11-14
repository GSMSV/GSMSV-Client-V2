import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
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
import { getSessionUser } from "../../entities/session";
import { demoAppScopeOptions } from './demoAppScopeOptions';
import { isDemoMode } from "../../shared/demo";
import { Button, SliderField } from "../../shared/ui/controls";
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
    ${({ theme }) => theme.typography.h2.weight}
      ${({ theme }) => theme.typography.h2.size}px /
      ${({ theme }) => theme.typography.h2.lineHeight}px
      ${({ theme }) => theme.typography.h2.family},
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
`;
const Tabs = styled.nav`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;
const Tab = styled.button<{ $active?: boolean }>`
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
`;
const CardTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
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
const Banner = styled.div<{ $warning?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 82px;
  padding: 20px 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme, $warning }) =>
    $warning ? theme.colors.warningSoft : theme.colors.primarySoft};
  color: ${({ theme, $warning }) =>
    $warning ? theme.colors.warning : theme.colors.primary};
`;
const BannerCopy = styled.span`
  display: flex;
  flex-direction: column;
  gap: 8px;
  small {
    color: ${({ theme }) => theme.colors.muted};
    font:
      ${({ theme }) => theme.typography.caption.weight}
        ${({ theme }) => theme.typography.caption.size}px /
        ${({ theme }) => theme.typography.caption.lineHeight}px
        ${({ theme }) => theme.typography.caption.family},
      sans-serif;
  }
`;
const Table = styled.div`
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.sm}px;
`;
const TableHeader = styled.div`
  display: grid;
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
  min-height: 66px;
  grid-template-columns: 1.1fr 1.5fr 1fr 0.9fr 1fr;
  align-items: center;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm}px;
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.primarySoft : "transparent"};
  color: ${({ theme }) => theme.colors.text};
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
const Status = styled.span<{ $status?: string }>`
  color: ${({ theme, $status }) =>
    $status === "failed"
      ? theme.colors.danger
      : $status === "skipped"
        ? theme.colors.muted
        : theme.colors.primary};
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
`;
const BigValue = styled.strong`
  color: ${({ theme }) => theme.colors.text};
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
  polyline {
    fill: none;
    stroke: ${({ theme }) => theme.colors.primary};
    stroke-width: 2;
  }
  circle {
    fill: ${({ theme }) => theme.colors.warning};
  }
`;
const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: ${({ theme }) => theme.colors.muted};
  font:
    ${({ theme }) => theme.typography.label.weight}
      ${({ theme }) => theme.typography.label.size}px /
      ${({ theme }) => theme.typography.label.lineHeight}px
      ${({ theme }) => theme.typography.label.family},
    sans-serif;
  input,
  select {
    min-height: 42px;
    width: 100%;
    padding: 0 12px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radii.sm}px;
    background: ${({ theme }) => theme.colors.field};
    color: ${({ theme }) => theme.colors.text};
    font: inherit;
  }
`;
const VariableRow = styled.div`
  display: flex;
  min-height: 60px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;
const VariableText = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
  strong {
    color: ${({ theme }) => theme.colors.text};
    font:
      ${({ theme }) => theme.typography.bodySmall.weight}
        ${({ theme }) => theme.typography.bodySmall.size}px /
        ${({ theme }) => theme.typography.bodySmall.lineHeight}px
        ${({ theme }) => theme.typography.bodySmall.family},
      sans-serif;
  }
  span {
    color: ${({ theme }) => theme.colors.muted};
    font:
      ${({ theme }) => theme.typography.caption.weight}
        ${({ theme }) => theme.typography.caption.size}px /
        ${({ theme }) => theme.typography.caption.lineHeight}px
        ${({ theme }) => theme.typography.caption.family},
      sans-serif;
  }
`;
const ToggleRow = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 40px;
  color: ${({ theme }) => theme.colors.text};
  small {
    display: block;
    margin-top: 4px;
    color: ${({ theme }) => theme.colors.faint};
  }
  input {
    width: 44px;
    height: 24px;
    accent-color: ${({ theme }) => theme.colors.primary};
  }
`;
const Code = styled.pre`
  min-height: 180px;
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
`;
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

function MiniPlot({ restart = false }: { restart?: boolean }) {
  return (
    <Plot
      viewBox="0 0 512 140"
      role="img"
      aria-label="최근 24시간 사용량 그래프"
    >
      {[0, 46, 92, 139].map((y) => (
        <line key={y} x1="0" x2="512" y1={y} y2={y} />
      ))}
      {restart && <line x1="348" x2="348" y1="0" y2="140" stroke="#ffd08a" />}
      <polyline
        points={
          restart
            ? "0,92 32,88 64,96 96,78 128,83 160,61 192,70 224,42 256,48 288,65 320,55 348,130 380,94 412,81 444,63 476,57 512,43"
            : "0,105 32,99 64,101 96,84 128,91 160,72 192,78 224,70 256,54 288,62 320,48 352,52 384,42 416,46 448,30 480,38 512,24"
        }
      />
      {restart && <circle cx="348" cy="130" r="4" />}
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
  | { kind: "variables" | "port" | "read-only" | "domain" };

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
  };
  const shell = (children: React.ReactNode) => (
    <StudentShell
      activeItem="apps"
      scopeLabel={teamPath ? app?.owner?.name ?? "팀 Resources" : "내 Resources"}
      scopeOptions={scopeOptions}
      userName={user?.name ?? "김민수"}
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
  const requestVariables = () => {
    if (!canManage) { setDialog({ kind: "read-only" }); return; }
    if (variableKey.trim() === "PORT") { setDialog({ kind: "port" }); return; }
    if (variableSize > 32 * 1024) { setNotice("변수는 32 KB까지 저장할 수 있습니다."); return; }
    if (Object.keys(variableChanges).length) setDialog({ kind: "variables" });
  };
  const addVariable = (event: FormEvent) => {
    event.preventDefault();
    if (!canManage || expired) return;
    const key = variableKey.trim();
    if (key === "PORT") { setDialog({ kind: "port" }); return; }
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return;
    setVariableChanges(current => ({
      ...current,
      variables: [...variables.filter(item => item.key !== key), { key, value: variableValue, secret: variableSecret }],
    }));
    setVariableKey("");
    setVariableValue("");
    setVariableSecret(false);
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
    if (update(settingsDraft)) { setSettingsDraft({}); setNotice(""); }
  };
  const actionButton =
    tab === "deployments" ? (
      <Button variant="secondary" disabled={!canManage || expired} onClick={() => {
        const current = service.deployments.find(item => item.status === "running");
        const deployment: DemoDeployment = current ?? {
          id: crypto.randomUUID().slice(0, 7), status: "previous", commit: "재배포",
          author: user?.name ?? "김민수", at: formatDemoAppDate(Date.now()), message: "빌드 로그 보기",
        };
        setDialog({ kind: "deploy", deployment });
      }}>재배포</Button>
    ) : tab === "logs" ? (
      <Button variant="secondary" onClick={() => setLogsPaused(value => !value)}>
        {logsPaused ? "다시 시작" : "일시 정지"}
      </Button>
    ) : tab === "variables" ? (
      <>
        <Button variant="secondary" disabled={expired} onClick={() => canManage
          ? document.getElementById("demo-new-variable-key")?.focus()
          : setDialog({ kind: "read-only" })}>변수 추가</Button>
        <Button disabled={expired} onClick={requestVariables}>변경사항 저장</Button>
      </>
    ) : tab === "shell" ? (
      <Button variant="secondary" disabled={!canManage || expired || service.status === "정지"} onClick={openShell}>
        {shellExpired ? "다시 열기" : shellActive ? "세션 끝내기" : "셸 열기"}
      </Button>
    ) : tab === "settings" ? (
      <Button disabled={expired} onClick={() => canManage ? saveSettings() : setDialog({ kind: "read-only" })}>설정 저장</Button>
    ) : tab === "domains" ? (
      <Button disabled={!canManage || expired || service.type !== "웹"} onClick={() => {
        const subdomain = (domainDraft ?? service.subdomain).trim();
        if (!isDemoAppSubdomainAvailable(subdomain, service.id)) { setDialog({ kind: "domain" }); return; }
        if (update({ subdomain })) setDomainDraft(undefined);
      }}>저장</Button>
    ) : null;

  let content: React.ReactNode;
  if (tab === "deployments") {
    content = (
      <>
        {(failure || skipped) && <Banner $warning role="status">
          <Octicon name={failure ? "alert" : "shield"} size={18} />
          <BannerCopy>
            {failure?.[0] ?? (canManage ? "push를 건너뛰었습니다" : "팀장·DevOps가 배포해야 나갑니다")}
            <small>{failure?.[1] ?? (canManage
              ? `${skipped?.author} · ${skipped?.id}은 배포 권한이 없는 사람의 push라 배포하지 않았습니다.`
              : "내가 push한 커밋은 배포 권한이 있는 팀원이 「이 커밋 배포」를 눌러야 나갑니다.")}</small>
          </BannerCopy>
          {failure && <Button variant="secondary" onClick={() => document.getElementById("demo-build-log")?.focus()}>빌드 로그</Button>}
        </Banner>}
        <Card>
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
                  <Status $status={item.status}>
                    {item.status === "running"
                      ? "실행 중"
                      : item.status === "skipped"
                        ? "건너뜀"
                        : item.status === "failed"
                          ? "실패"
                          : "지난 배포"}
                  </Status>
                </span>
                <span>
                  <code>{item.commitId ?? item.id}</code> {item.commit}
                </span>
                <span>{item.author}</span>
                <span>{item.at}</span>
                <span>
                  <Button
                    variant="ghost"
                    disabled={(item.status === "skipped" || item.status === "previous") && (!canManage || expired)}
                    onClick={() => {
                      if (item.status === "skipped" || item.status === "previous") {
                        setDialog({ kind: item.status === "skipped" ? "deploy" : "rollback", deployment: item });
                      } else {
                        setSelectedDeployment(item.id);
                      }
                    }}
                  >
                    {item.status === "previous" ? "되돌리기" : item.message}
                  </Button>
                </span>
              </TableRow>
            ))}
          </Table>
        </Card>
        <Help>되돌리기는 다시 빌드하지 않고 그 배포를 그대로 씁니다. 변수는 지금 값을 씁니다.</Help>
        {selected && (
          <Card id="demo-build-log" tabIndex={-1}>
            <CardTitle>
              <Octicon name="terminal" size={16} />
              　선택한 배포 · {selected.commitId ?? selected.id} 빌드 로그
            </CardTitle>
            <Code>{deploymentLog(app, service, selected)}</Code>
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
        <Banner>
          <Octicon name="history" size={18} />
          <BannerCopy>
            최근 3일 또는 50 MB까지 보관해요
            <small>
              비밀 변수 값은 가려서 보여 줍니다. 요청마다 남는 HTTP 접근 기록은
              따로 없습니다.
            </small>
          </BannerCopy>
        </Banner>
        <Card>
          <CardTitle>
            <Octicon name="terminal" size={16} />
            　{service.environment} · {service.name} ·{" "}
            {logsPaused ? "일시 정지됨" : "실시간"}
          </CardTitle>
          <Code>
            {[
              "11:02:14  Server listening on port 3000",
              "11:02:15  Connected to welcome-db",
              "11:05:41  Using MAIL_API_KEY •••••••••",
              "11:05:42  Contact mail sent",
              "11:12:03  warn  Slow query 1.2s",
              "11:22:03  GSMSV 요청이 없어 잠들었어요",
              "11:31:40  GSMSV 요청이 와서 깨어났어요",
              "11:31:41  Server listening on port 3000",
              ...(service.restartReason === "limit" ? [`GSMSV ${service.name}이 10번 넘게 다시 시작해서 멈췄습니다`] : []),
              ...(service.restartReason === "variables" ? [`GSMSV 변수를 저장해 ${service.name}이 다시 시작했습니다`] : []),
              ...(service.restartReason === "database" ? [`GSMSV ${service.databaseId} 비밀번호가 바뀌어 다시 시작했습니다`] : []),
            ]
              .map((line, index) => `${index + 1}  ${line}`)
              .join("\n")}
          </Code>
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
        {quota?.freeMemory === 0 && <Banner $warning role="status">
          <Octicon name="alert" size={18} />
          <BannerCopy>
            메모리 할당량을 모두 썼습니다
            <small>PR 미리보기 환경도 할당량에 들어갑니다. 쓰지 않는 환경을 정리하거나 메모리를 줄여 주세요.</small>
          </BannerCopy>
          <Button variant="secondary" onClick={() => navigate(`/apps/${encodeURIComponent(appId)}/demo-settings`)}>앱 설정</Button>
        </Banner>}
        <Grid>
          <Metric>
            <CardTitle>메모리</CardTitle>
            <BigValue>
              418 <small>MB</small>
            </BigValue>
            <MiniPlot restart />
            <Help>
              최근 24시간 · 최대 512 MB · 할당 512 MB · 빨간 선은 09:40 다시
              시작
            </Help>
          </Metric>
          <Metric>
            <CardTitle>CPU</CardTitle>
            <BigValue>
              12 <small>%</small>
            </BigValue>
            <MiniPlot />
            <Help>최근 24시간 · 최대 64% · 할당 0.5 vCPU</Help>
          </Metric>
        </Grid>
      </>
    );
  } else if (tab === "variables") {
    content = (
      <>
        <Banner>
          <Octicon name="lock" size={18} />
          <BannerCopy>
            비밀 변수는 저장한 뒤 다시 볼 수 없습니다
            <small>
              일반 변수는 이 앱을 볼 수 있는 사람 모두가 볼 수 있습니다. API
              키처럼 숨길 값은 비밀로 저장하세요.
            </small>
          </BannerCopy>
        </Banner>
        <Card>
          <NavRow>
            <CardTitle>
              등록된 변수 · {variables.length}개 · {(variableSize / 1024).toFixed(1)} / 32 KB
            </CardTitle>
            <Button
              variant="ghost"
              onClick={() => canManage && !expired ? setVariablesEditing(value => !value) : setDialog({ kind: "read-only" })}
            >
              {variablesEditing ? "편집 완료" : "변수 편집"}
            </Button>
          </NavRow>
          {variables.map((variable) => (
            <VariableRow key={variable.key}>
              <VariableText>
                <strong>{variable.key}</strong>
                <span>
                  {variable.secret
                    ? "비밀 · 저장한 뒤 다시 볼 수 없습니다"
                    : variable.value}
                </span>
              </VariableText>
              {canManage && !expired && (variablesEditing || variable.secret) && (
                <div>
                  {editingVariableKey === variable.key ? (
                    <>
                      <Field>
                        {variable.key} 값
                        <input
                          autoFocus
                          aria-label={`${variable.key} 값`}
                          type={variable.secret ? "password" : "text"}
                          value={editingVariableValue}
                          onChange={event => setEditingVariableValue(event.currentTarget.value)}
                        />
                      </Field>
                      <Button
                        variant="ghost"
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
                    onClick={() => {
                      setEditingVariableKey(variable.key);
                      setEditingVariableValue(variable.secret ? "" : variable.value);
                    }}
                  >값 바꾸기</Button>}
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setVariableChanges(current => ({ ...current, variables: variables.filter(item => item.key !== variable.key) }))
                    }
                  >
                    지우기
                  </Button>
                </div>
              )}
            </VariableRow>
          ))}
        </Card>
        <Card as="form" onSubmit={addVariable}>
          <NavRow>
            <CardTitle>새 변수</CardTitle>
            <Button
              variant="ghost"
              disabled={!canManage || expired}
              onClick={() => {
                setVariableKey("");
                setVariableValue("");
                setVariableSecret(false);
              }}
            >
              이 행 삭제
            </Button>
          </NavRow>
          <Field>
            키
            <input
              id="demo-new-variable-key"
              disabled={!canManage || expired}
              value={variableKey}
              onChange={(event) => setVariableKey(event.currentTarget.value)}
            />
          </Field>
          <Field>
            값
            <input
              value={variableValue}
              disabled={!canManage || expired}
              type={variableSecret ? "password" : "text"}
              onChange={(event) => setVariableValue(event.currentTarget.value)}
            />
          </Field>
          <ToggleRow>
            <span>
              비밀로 저장
              <small>
                켜면 저장한 뒤 값을 다시 볼 수 없습니다. 바꾸기와 지우기만 할 수
                있습니다.
              </small>
            </span>
            <input
              type="checkbox"
              checked={variableSecret}
              disabled={!canManage || expired}
              onChange={(event) =>
                setVariableSecret(event.currentTarget.checked)
              }
            />
          </ToggleRow>
          <Button type="submit" disabled={!canManage || expired || !variableKey.trim()}>
            변수 추가
          </Button>
        </Card>
        <Card>
          <CardTitle>Database 연결</CardTitle>
          <Field>
            연결할 Database
            <select
              value={databases.find(database => database.grn === databaseId || database.grn.endsWith(`:${databaseId}`))?.grn ?? ""}
              disabled={!canManage || expired}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setVariableChanges(current => ({ ...current, databaseId: value }));
              }}
            >
              <option value="">연결하지 않음</option>
              {databases.map(database => <option key={database.grn} value={database.grn}>{database.name} · {database.engine === "mysql" ? "MySQL" : "PostgreSQL"}</option>)}
            </select>
          </Field>
          <Help>
            환경마다 자기 Database를 연결합니다. 연결하면 접속 정보가 변수로
            들어가고, staging은 따로 연결합니다.
          </Help>
        </Card>
        <Card>
          <CardTitle>코드에서 쓰기 · Node.js</CardTitle>
          <Code>
            const apiKey = process.env.MAIL_API_KEY;{"\n"}const port =
            process.env.PORT; // GSMSV가 넣어요
          </Code>
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
        {service.configFile && <Banner $warning role="status">
          <Octicon name="alert" size={18} />
          <BannerCopy>
            설정 파일에서 무시한 칸이 있습니다
            <small>메모리·변수는 설정 파일로 바꿀 수 없어서 무시했습니다. 이 화면에서 바꿔 주세요.</small>
          </BannerCopy>
        </Banner>}
        <Card>
          <CardTitle>실행</CardTitle>
          <Field>
            시작 명령
            <input
              disabled={!canManage || expired || service.configFile}
              value={settingsDraft.startCommand ?? service.startCommand}
              onChange={event => {
                const startCommand = event.currentTarget.value;
                setSettingsDraft(current => ({ ...current, startCommand }));
              }}
            />
          </Field>
          {service.configFile && <Help>
            설정 파일이 덮어씀 · 바꾸려면 저장소의 {"{설정 파일}"}을 고쳐 주세요.
          </Help>}
          <Field>
            상태 확인 경로
            <input
              disabled={!canManage || expired}
              value={settingsDraft.path ?? service.path}
              onChange={event => {
                const path = event.currentTarget.value;
                setSettingsDraft(current => ({ ...current, path }));
              }}
            />
          </Field>
          <Help>
            새 배포가 이 경로에서 200을 돌려줘야 바꿉니다. 300초 안에 응답하지
            않으면 실패로 남습니다.
          </Help>
          <Field>
            배포 전 명령
            <input
              disabled={!canManage || expired}
              value={settingsDraft.preDeployCommand ?? service.preDeployCommand}
              onChange={event => {
                const preDeployCommand = event.currentTarget.value;
                setSettingsDraft(current => ({ ...current, preDeployCommand }));
              }}
            />
          </Field>
          <Help>
            새 배포로 바꾸기 전에 한 번 실행합니다. 기본 10분, 최대 30분까지
            기다립니다.
          </Help>
          <Field>
            감시 경로
            <input
              disabled={!canManage || expired}
              value={settingsDraft.watchPaths ?? service.watchPaths}
              onChange={event => {
                const watchPaths = event.currentTarget.value;
                setSettingsDraft(current => ({ ...current, watchPaths }));
              }}
            />
          </Field>
          <Help>
            이 경로의 파일이 바뀐 push만 배포합니다. 비워 두면 모든 push를
            배포합니다.
          </Help>
        </Card>
        <Card>
          <CardTitle>자원</CardTitle>
          <Help>메모리 할당량 {quota?.usedMemory} MB / 2 GB 사용 중 · 남은 할당량 {quota?.freeMemory} MB</Help>
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
            <span>
              요청이 없어도 깨어 있기
              <small>
                켜면 잠들지 않고 계속 실행됩니다. 상시 실행은 1개까지 켤 수 있고
                지금 {quota?.alwaysOn}개 씁니다.
              </small>
            </span>
            <input
              type="checkbox"
              disabled={!canManage || expired}
              checked={settingsDraft.alwaysOn ?? service.alwaysOn}
              onChange={event => {
                const alwaysOn = event.currentTarget.checked;
                setSettingsDraft(current => ({ ...current, alwaysOn }));
              }}
            />
          </ToggleRow>
        </Card>
        {service.type === "크론" && <Card>
          <CardTitle>{service.name} 크론 설정</CardTitle>
          <Code>{service.cronSchedule}</Code>
          <Help>· 매일 03:00에 실행합니다. 서울 시간으로 계산합니다.<br />· 5분보다 자주 실행할 수 없고, 30분이 넘으면 강제로 끝냅니다.<br />· staging·PR 환경에서는 따로 켜야 실행됩니다.</Help>
          <ToggleRow>
            <span>{service.environment}</span>
            <input aria-label="크론 실행" type="checkbox" disabled={!canManage || expired}
              checked={settingsDraft.cronEnabled ?? service.cronEnabled ?? false}
              onChange={event => {
                const cronEnabled = event.currentTarget.checked;
                setSettingsDraft(current => ({ ...current, cronEnabled }));
              }} />
          </ToggleRow>
        </Card>}
      </>
    );
  } else if (tab === "domains") {
    content = (
      <>
        <Card>
          <CardTitle>production 주소</CardTitle>
          <Field>
            서브도메인
            <input
              id="demo-service-domain"
              value={domainDraft ?? service.subdomain}
              disabled={!canManage || expired || service.type !== "웹"}
              onChange={(event) => setDomainDraft(event.currentTarget.value)}
            />
          </Field>
          <Help>
            주소는 https://{domainDraft ?? service.subdomain}.{"{앱 도메인}"}입니다.
            production만 직접 정할 수 있습니다.
          </Help>
        </Card>
        <Card>
          <CardTitle>다른 환경</CardTitle>
          <VariableRow>
            <VariableText>
              <strong>staging</strong>
              <span>{app.name}-staging.{"{앱 도메인}"}</span>
              <small>자동으로 붙는 이름이라 바꿀 수 없습니다.</small>
            </VariableText>
            <Octicon name="globe" size={16} />
          </VariableRow>
          <VariableRow>
            <VariableText>
              <strong>PR 미리보기</strong>
              <span>{app.name}-pr-&#123;번호&#125;.{"{앱 도메인}"}</span>
              <small>
                PR 미리보기를 켜면 PR마다 생기고, 7일 뒤 정리됩니다.
              </small>
            </VariableText>
          </VariableRow>
        </Card>
      </>
    );
  } else {
    content = (
      <>
        <Banner $warning>
          <Octicon name="eye" size={18} />
          <BannerCopy>
            {shellExpired ? "셸 세션이 끝났습니다" : "셸 안에서는 비밀 변수 값이 보입니다"}
            <small>{shellExpired
              ? "1시간이 지나 연결을 닫았습니다. 셸에서 바꾼 파일은 다시 시작하면 사라집니다."
              : "화면을 공유할 때 조심하세요. 세션은 1시간 뒤 끝납니다."}</small>
          </BannerCopy>
        </Banner>
        <Card>
          <CardTitle>
            <Octicon name="terminal" size={16} />
            　{service.environment} · {service.name} ·{" "}
            {shellActive ? `남은 시간 ${Math.ceil(((expiresAt ?? clock) - Math.max(clock, Date.now())) / 60_000)}분` : "셸이 닫혀 있습니다"}
          </CardTitle>
          <Code>
            {shellActive && service.shellLines.join("\n")}
            {shellActive && shellInput}
          </Code>
          {shellActive && canManage && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!shellInput.trim()) return;
                const lines = [
                  ...service.shellLines.slice(0, -1),
                  `$ ${shellInput}`,
                  shellInput === "node -v"
                    ? "v20.11.1"
                    : shellInput === "ls"
                      ? "dist  node_modules  package.json  src"
                      : shellInput === "echo $NODE_ENV"
                        ? "production"
                        : shellInput
                          ? `명령을 실행했습니다: ${shellInput}`
                          : "",
                  "$",
                ];
                update({ shellLines: lines });
                setShellInput("");
              }}
            >
              <Field>
                명령
                <input
                  value={shellInput}
                  onChange={(event) => setShellInput(event.currentTarget.value)}
                  placeholder="터미널에 명령 입력"
                />
              </Field>
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
      <Breadcrumb>Apps / {app.name}</Breadcrumb>
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
        {actionButton}
      </NavRow>
      {content}
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
          if (update({ ...variableChanges, ...restartService(service, "variables"), databasePasswordVersion: databasePasswordVersion(databaseId) })) setVariableChanges({});
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
        {"· 이미 다른 앱이 쓰는 이름은 쓸 수 없습니다.\n· GSMSV가 쓰려고 남겨 둔 이름도 쓸 수 없습니다."}
      </DemoAppDialog>}
      {notice && <Alert role="status">{notice}</Alert>}
    </Page>,
  );
}

export function DemoStoppedPublicAppPage() {
  const navigate = useNavigate();
  const { appId = "demo-portfolio-web" } = useParams<{ appId: string }>();
  const app = getDemoApp(appId);
  if (!isDemoMode() || !app || !isDemoAppExpired(app))
    return (
      <PublicPage>
        <PublicHeader>
          <button onClick={() => navigate("/")}>GSMSV</button>
        </PublicHeader>
        <StoppedCard>
          <StoppedTitle>앱을 찾을 수 없습니다</StoppedTitle>
        </StoppedCard>
      </PublicPage>
    );
  return (
    <PublicPage>
      <PublicHeader>
        <button onClick={() => navigate("/")}>GSMSV</button>
      </PublicHeader>
      <StoppedCard>
        <StoppedTitle>
          <Octicon name="stop" size={24} />이 앱은 지금 정지돼 있습니다
        </StoppedTitle>
        <Subtitle>
          사용 기간이 끝나 잠시 멈췄습니다. 만든 사람이 연장하면 다시 열립니다.
        </Subtitle>
        <VariableRow>
          <VariableText>
            <strong>주소</strong>
            <span>{app.services.find(service => service.type === "웹")?.subdomain ?? app.name}.{"{앱 도메인}"}</span>
          </VariableText>
          <Octicon name="globe" size={16} />
        </VariableRow>
        <Button variant="secondary" onClick={() => navigate("/")}>GSM SV 열기</Button>
      </StoppedCard>
    </PublicPage>
  );
}
const PublicPage = styled.main`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.canvas};
  color: ${({ theme }) => theme.colors.text};
`;
const PublicHeader = styled.header`
  height: 74px;
  padding: 16px 32px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  button {
    border: 0;
    background: none;
    color: ${({ theme }) => theme.colors.text};
    font: inherit;
    font-size: 20px;
    cursor: pointer;
  }
`;
const StoppedCard = styled.section`
  display: flex;
  width: min(560px, calc(100% - 32px));
  margin: 80px auto;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;
const StoppedTitle = styled.h1`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font:
    ${({ theme }) => theme.typography.h2.weight}
      ${({ theme }) => theme.typography.h2.size}px /
      ${({ theme }) => theme.typography.h2.lineHeight}px
      ${({ theme }) => theme.typography.h2.family},
    sans-serif;
`;
