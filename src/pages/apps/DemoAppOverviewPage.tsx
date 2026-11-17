import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import styled from "styled-components";
import {
  addDemoService,
  canManageDemoApp,
  demoAppMemoryLimit,
  demoPersonalAppOwner,
  formatDemoAppDate,
  getDemoApp,
  getDemoAppDeletionTime,
  getDemoAppQuota,
  isDemoAppExpired,
  isDemoAppSubdomainAvailable,
  renewDemoApp,
  getDemoApps,
  saveDemoApps,
  type DemoEnvironment,
  type DemoManagedService,
} from "../../entities/app/demo";
import { getDemoTeam } from "../../entities/team/demo";
import { reconcileDemoDatabaseRestarts } from "../../features/apps/demoServiceOperations";
import { DemoAppDialog, Modal } from "./DemoAppDialog";
import { DemoAppStateCards, useDemoAppRequest } from "./DemoAppRequestState";
import { Banner, DeleteConfirmDialog } from "../../shared/ui/feedback";
import { UsageCard } from "../../shared/ui/data-display";
import { getSessionUser } from "../../entities/session";
import { demoAppScopeOptions } from './demoAppScopeOptions';
import { isDemoMode } from "../../shared/demo";
import { Button, SegmentedControl, SelectField, Switch } from "../../shared/ui/controls";
import { Octicon } from "../../shared/ui/icons";
import {
  StudentShell,
  type StudentNavigationKey,
} from "../../widgets/student-shell";

const Page = styled.div`
  box-sizing: border-box;
  display: flex;
  width: 100%;
  max-width: 1224px;
  flex-direction: column;
  gap: 24px;
  padding: 40px;

  @media (max-width: 960px) { padding: 24px; }
  @media (max-width: 600px) { gap: 20px; padding: 20px 16px; }
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
`;
const Heading = styled.header`
  display: flex;
  min-height: 74px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  @media (max-width: 760px) {
    min-height: 0;
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }
`;
const TitleBlock = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
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
const PageTitle = styled(Title)`
  font:
    ${({ theme }) => theme.typography.h1.weight}
      ${({ theme }) => theme.typography.h1.size}px /
      ${({ theme }) => theme.typography.h1.lineHeight}px
      ${({ theme }) => theme.typography.h1.family},
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
const Tabs = styled.nav`
  display: flex;
  min-width: 0;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 8px;
  min-height: 42px;
`;
const TabActions = styled.div`
  display: flex;
  margin-left: auto;
`;
const Tab = styled.button<{ $active?: boolean }>`
  min-width: 57px;
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
  box-sizing: border-box;
  display: flex;
  width: 100%;
  min-width: 0;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 600px) { padding: 16px; }
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
const formatGb = (mb: number) => new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(mb / 1024);
const InfoRow = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;

  > svg { flex: 0 0 16px; color: ${({ theme }) => theme.colors.muted}; }
`;
const InfoText = styled.div`
  display: flex;
  min-width: 0;
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
    color: ${({ theme }) => theme.colors.text};
    font:
      ${({ theme }) => theme.typography.bodySmall.weight}
        ${({ theme }) => theme.typography.bodySmall.size}px /
        ${({ theme }) => theme.typography.bodySmall.lineHeight}px
        ${({ theme }) => theme.typography.bodySmall.family},
      sans-serif;
  }
`;
const CountText = styled.span`
  color: ${({ theme }) => theme.colors.primary};
`;
const SummaryUsage = styled(UsageCard)`
  width: auto;
  min-width: 0;
  min-height: 150px;

  @media (max-width: 600px) { min-height: 0; padding: 16px; }
`;
const Summary = styled.div`
  display: grid;
  align-items: start;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 900px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (max-width: 600px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;
const SummaryHelp = styled.span`
  color: ${({ theme }) => theme.colors.faint};
  font:
    ${({ theme }) => theme.typography.caption.weight}
      ${({ theme }) => theme.typography.caption.size}px /
      ${({ theme }) => theme.typography.caption.lineHeight}px
      ${({ theme }) => theme.typography.caption.family},
    sans-serif;
`;
const ServicesHeading = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
`;
const ServiceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  @media (max-width: 1000px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;
const ServiceCard = styled.article`
  display: flex;
  min-width: 0;
  min-height: 254px;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 600px) { min-height: 0; padding: 16px; }
`;
const ServiceHeader = styled.div`
  display: flex;
  min-width: 0;
  min-height: 42px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;
const FeatureIcon = styled.span`
  display: inline-flex;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.raised};
  color: ${({ theme }) => theme.colors.text};
`;
const ServiceName = styled.h3`
  overflow: hidden;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font:
    ${({ theme }) => theme.typography.h2.weight}
      ${({ theme }) => theme.typography.h2.size}px /
      ${({ theme }) => theme.typography.h2.lineHeight}px
      ${({ theme }) => theme.typography.h2.family},
    sans-serif;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const State = styled.span<{ $tone: "success" | "danger" | "neutral" }>`
  flex: 0 0 auto;
  color: ${({ theme, $tone }) => $tone === "success" ? theme.colors.primary : $tone === "danger" ? theme.colors.danger : theme.colors.muted};
  font:
    ${({ theme }) => theme.typography.label.weight}
      ${({ theme }) => theme.typography.label.size}px /
      ${({ theme }) => theme.typography.label.lineHeight}px
      ${({ theme }) => theme.typography.label.family},
    sans-serif;
`;
const ServiceCardMeta = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
`;
const ServiceLine = styled.span`
  overflow: hidden;
  min-width: 0;
  color: ${({ theme }) => theme.colors.muted};
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
  font:
    ${({ theme }) => theme.typography.bodySmall.weight}
      ${({ theme }) => theme.typography.bodySmall.size}px /
      ${({ theme }) => theme.typography.bodySmall.lineHeight}px
      ${({ theme }) => theme.typography.bodySmall.family},
    sans-serif;
`;
const CronScheduleButton = styled(ServiceLine).attrs({ as: "button" })`
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  text-align: left;

  &:hover, &:focus-visible { color: ${({ theme }) => theme.colors.text}; text-decoration: underline; }
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
  min-width: 1096px;
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
const TableRow = styled.div`
  display: grid;
  min-width: 1096px;
  min-height: 66px;
  grid-template-columns: 1.1fr 1.5fr 1fr 0.9fr 1fr;
  align-items: center;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.muted};
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
const Notice = styled.div`
  box-sizing: border-box;
  min-width: 0;
  margin: 0;
  padding: 20px 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.primarySoft};
  color: ${({ theme }) => theme.colors.primary};
`;
const Field = styled.label`
  display: flex;
  min-width: 0;
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
    box-sizing: border-box;
    max-width: 100%;
    min-height: 42px;
    padding: 0 12px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radii.sm}px;
    background: ${({ theme }) => theme.colors.field};
    color: ${({ theme }) => theme.colors.text};
    font: inherit;
  }
`;
const EnvSettingsRow = styled(TableRow)`
  grid-template-columns: 1.1fr 1.5fr 1fr 0.9fr 1fr;
`;
const Toggle = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  > span {
    min-width: 0;
    color: ${({ theme }) => theme.colors.text};
    font:
      ${({ theme }) => theme.typography.label.weight}
        ${({ theme }) => theme.typography.label.size}px /
        ${({ theme }) => theme.typography.label.lineHeight}px
        ${({ theme }) => theme.typography.label.family},
      sans-serif;
  }
  small {
    display: block;
    margin-top: 2px;
    color: ${({ theme }) => theme.colors.faint};
    font:
      ${({ theme }) => theme.typography.caption.weight}
        ${({ theme }) => theme.typography.caption.size}px /
        ${({ theme }) => theme.typography.caption.lineHeight}px
        ${({ theme }) => theme.typography.caption.family},
      sans-serif;
  }
`;

const ServiceActions = styled.div`
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;

  @media (max-width: 480px) {
    > button { flex: 1 1 120px; }
  }
`;

const DeletePanel = styled(DeleteConfirmDialog)`
  width: 100%;
  height: auto;
  padding: 0;
`;

function getPath(appId: string, serviceId: string, tab = "deployments") {
  return `/apps/${encodeURIComponent(appId)}/services/${encodeURIComponent(serviceId)}/${tab}`;
}

export function DemoAppOverviewPage() {
  const navigate = useNavigate();
  const { appId = "demo-portfolio-web" } = useParams<{ appId: string }>();
  const app = getDemoApp(appId);
  const user = getSessionUser();
  const [environment, setEnvironment] = useState("production");
  const [cronService, setCronService] = useState<DemoManagedService>();
  const [notice, setNotice] = useState("");
  const [, refresh] = useState(0);
  const request = useDemoAppRequest("apps-overview", appId);
  useEffect(() => {
    const reconcile = () => {
      const current = getDemoApp(appId);
      if (current && reconcileDemoDatabaseRestarts(current)) refresh(value => value + 1);
    };
    reconcile();
    window.addEventListener("gsmsv:demo-database-state-change", reconcile);
    return () => window.removeEventListener("gsmsv:demo-database-state-change", reconcile);
  }, [appId]);
  const teamPath = app?.owner?.type === "team" ? `/teams/${encodeURIComponent(app.owner.id)}` : "";
  const listPath = `${teamPath}/apps`;
  const scopeOptions = demoAppScopeOptions(app?.owner, navigate);
  const go = (item: Exclude<StudentNavigationKey, "none">) => {
    if (item === "home") navigate(teamPath || "/");
    if (item === "apps") navigate(listPath);
    if (item === "team") navigate(teamPath || "/teams");
    if (item === "database") navigate(teamPath ? `/databases?owner=${encodeURIComponent(app?.owner?.id ?? "")}` : "/databases");

    return ['home', 'apps', 'team', 'database'].includes(item);
  };
  if (!isDemoMode() || !app)
    return (
      <StudentShell
        activeItem="apps"
        scopeLabel={teamPath ? app?.owner?.name ?? "팀 Resources" : "내 Resources"}
        scopeOptions={scopeOptions}
        userName={user?.name ?? "김지민"}
        onNavigate={go}
        onCreateTeam={() => navigate("/teams/new")}
        onOpenStatus={() => navigate("/status")}
        onSelectScope={() => undefined}
        onSearch={() => undefined}
        onOpenNotifications={() => undefined}
      >
        <Page>
          <Breadcrumb>Apps</Breadcrumb>
          <Card>
            <CardTitle>앱을 찾을 수 없습니다</CardTitle>
            <Subtitle>· 주소가 바뀌었거나 지워진 앱입니다.<br />· 볼 수 있는 권한이 없는 앱도 이렇게 보입니다.</Subtitle>
            <Button onClick={() => navigate(listPath)}>Apps 목록</Button>
          </Card>
        </Page>
      </StudentShell>
    );
  const visibleServices = app.services.filter(
    (service) => service.environment === environment,
  );
  const quota = getDemoAppQuota(app.owner ?? demoPersonalAppOwner);
  const canManage = canManageDemoApp(app);
  // 승인 대기 중인 팀의 팀장은 관리 권한이 없어도 "일반 팀원" 안내 대상이 아니다.
  const viewingAsMember = Boolean(app.readOnly) || (app.owner?.type === "team" && getDemoTeam(app.owner.id)?.my_role === "member");
  const expired = isDemoAppExpired(app);
  const extendUsage = () => {
    if (renewDemoApp(appId)) setNotice("사용 기간을 연장했습니다.");
    else setNotice("사용 기간을 연장하지 못했습니다.");
    refresh(value => value + 1);
  };
  const latestDeployment = visibleServices.flatMap(service => service.deployments
    .filter(deployment => deployment.status === "running")
    .map(deployment => ({ service: service.name, ...deployment })))[0];
  return (
    <StudentShell
      activeItem="apps"
      scopeLabel={teamPath ? app?.owner?.name ?? "팀 Resources" : "내 Resources"}
      scopeOptions={scopeOptions}
      userName={user?.name ?? "김지민"}
      onNavigate={go}
      onCreateTeam={() => navigate("/teams/new")}
      onOpenStatus={() => navigate("/status")}
      onSelectScope={() => undefined}
      onSearch={() => undefined}
      onOpenNotifications={() => undefined}
    >
      <Page>
        <Breadcrumb>Apps</Breadcrumb>
        <Heading>
          <TitleBlock>
            <PageTitle>{app.name}</PageTitle>
            <Subtitle>
              {app.repository} · {app.branch}
            </Subtitle>
          </TitleBlock>
        </Heading>
        <Tabs>
          <Tab $active>개요</Tab>
          <Tab
            onClick={() =>
              navigate(`/apps/${encodeURIComponent(appId)}/demo-settings`)
            }
          >
            설정
          </Tab>
          {canManage && !expired && <TabActions><Button
            variant="secondary"
            icon={<Octicon name="plus" size={16} />}
            onClick={() => navigate(`/apps/${encodeURIComponent(appId)}/services/new`)}
          >
            서비스 추가
          </Button></TabActions>}
        </Tabs>
        {request.status !== "ready" ? (
          <DemoAppStateCards page="overview" status={request.status} onRetry={request.retry} environment={environment} />
        ) : <>
        {(expired || (app.expiresAtMs ?? Infinity) - Date.now() <= 7 * 86_400_000) && <StateBanner
          tone={expired ? "danger" : "primary"}
          icon={<Octicon name="clock" size={20} />}
          title={expired ? "정지됐습니다 · 3일 뒤 삭제됩니다" : `만료까지 ${Math.max(1, Math.ceil(((app.expiresAtMs ?? Date.now()) - Date.now()) / 86_400_000))}일 남았습니다`}
          description={expired
            ? `${app.expiresAt}에 사용 기간이 끝났습니다. ${app.stoppedFixture ? "10월 9일 14:00" : formatDemoAppDate(getDemoAppDeletionTime(app))} 전에 연장하면 다시 시작합니다.`
            : `${app.expiresAt}에 정지됩니다. 연장하면 연결한 Database도 앱보다 먼저 끝나지 않게 함께 연장됩니다.`}
          action={<Button variant="secondary" icon={<Octicon name="calendar" size={16} />} onClick={extendUsage}>사용 기간 연장</Button>}
        />}
        {viewingAsMember && <StateBanner
          tone="neutral"
          icon={<Octicon name="shield" size={20} />}
          title="일반 팀원으로 보고 있습니다"
          description="상태와 로그를 보고 사용 기간을 연장할 수 있습니다. 배포·변수·설정은 팀장·DevOps가 바꿉니다."
        />}
        {!expired && visibleServices.map(service => service.restartReason === "limit" ? (
          <StateBanner
            key={service.id}
            tone="danger"
            icon={<Octicon name="sync" size={20} />}
            title="10번 넘게 다시 시작해서 멈췄습니다"
            description={`짧은 시간에 계속 종료돼 ${service.name}을 멈췄습니다. 로그를 확인하고 다시 배포해 주세요.`}
            action={<Button variant="secondary" icon={<Octicon name="terminal" size={16} />} onClick={() => navigate(getPath(appId, service.id, "logs"))}>로그 보기</Button>}
          />
        ) : service.restartReason === "database" ? (
          <StateBanner
            key={service.id}
            tone="neutral"
            icon={<Octicon name="database" size={20} />}
            title="Database 비밀번호가 바뀌어 다시 시작했습니다"
            description={`${service.databaseId?.split(":").at(-1)} 비밀번호를 교체해서 새 값으로 ${service.name}을 다시 시작했습니다.`}
          />
        ) : null)}
        <Card>
          <CardTitle>환경</CardTitle>
          <SegmentedControl
            label="환경"
            options={app.environments.map(item => ({ value: item.name, label: item.name }))}
            value={environment}
            onChange={setEnvironment}
          />
          <SummaryHelp>
            production은 main, staging은 develop 브랜치에 push하면 배포됩니다.
          </SummaryHelp>
        </Card>
        <Summary>
          <SummaryUsage
            label="서비스"
            icon={<Octicon name="server" size={16} />}
            value={`${visibleServices.length}개`}
            caption={visibleServices.length ? (["웹", "워커", "크론"] as const).flatMap(type => {
              const count = visibleServices.filter(service => service.type === type).length;
              return count ? [<span key={type}>{type} <CountText>{count}</CountText></span>] : [];
            }).flatMap((item, index) => index ? [" · ", item] : [item]) : "서비스가 없습니다"}
          />
          <SummaryUsage
            label="메모리 할당량"
            icon={<Octicon name="cpu" size={16} />}
            value={`${formatGb(quota.usedMemory)} / ${formatGb(demoAppMemoryLimit)} GB`}
            meter={{ value: Math.min(100, Math.round((quota.usedMemory / demoAppMemoryLimit) * 100)), tone: "primary", label: "메모리 사용량" }}
            caption={app.environments.map(item =>
              `${item.name} ${app.services.filter(service => service.environment === item.name).reduce((total, service) => total + service.memoryMb, 0)} MB`,
            ).join(" · ")}
          />
          <SummaryUsage
            label="최근 배포"
            icon={<Octicon name="history" size={16} />}
            value={latestDeployment?.at ?? "—"}
            caption={latestDeployment ? `${latestDeployment.service} · ${latestDeployment.commitId ?? latestDeployment.id} · ${latestDeployment.author}` : "—"}
          />
        </Summary>
        <section>
          <ServicesHeading>
            <CardTitle>서비스 · {environment}</CardTitle>
          </ServicesHeading>
          <ServiceGrid>
            {visibleServices.map((service) => {
              const deployed = service.deployments.find(item => item.status === "running");
              const status = expired ? "정지" : service.status;
              return <ServiceCard key={service.id}>
                <ServiceHeader>
                  <FeatureIcon aria-hidden="true">
                    <Octicon name={service.type === "웹" ? "globe" : "clock"} size={20} />
                  </FeatureIcon>
                  <Button
                    variant="secondary"
                    icon={<Octicon name="arrow-right" size={16} />}
                    aria-label={`${service.name} 열기`}
                    onClick={() => navigate(getPath(appId, service.id))}
                  >
                    열기
                  </Button>
                </ServiceHeader>
                <ServiceName>{service.name}</ServiceName>
                {service.type === "웹" && expired ? (
                  <ServiceLine as={Link} to={`/public/${encodeURIComponent(appId)}/stopped?service=${encodeURIComponent(service.id)}`}>https://{service.subdomain}.{"{앱 도메인}"}</ServiceLine>
                ) : service.type === "크론" ? (
                  <CronScheduleButton type="button" onClick={() => setCronService(service)}>매일 03:00 (서울)</CronScheduleButton>
                ) : <ServiceLine>{service.type === "웹" ? `https://${service.subdomain}.{앱 도메인}` : "주소 없음"}</ServiceLine>}
                <ServiceLine>
                  {service.type} · {service.memoryMb} MB · {service.cpu} vCPU
                </ServiceLine>
                <ServiceCardMeta>
                  <ServiceLine>
                    {service.type === "크론" && service.lastCronRunAt
                      ? `지난 실행 ${service.lastCronRunAt} · 성공`
                      : deployed ? `${deployed.commitId ?? deployed.id} · ${deployed.at} 배포` : "—"}
                  </ServiceLine>
                  <State $tone={status === "실행 중" ? "success" : status === "정지" ? "danger" : "neutral"}>{status}</State>
                </ServiceCardMeta>
              </ServiceCard>;
            })}
          </ServiceGrid>
        </section>
        </>}
        {cronService && <DemoAppDialog
          title={`${cronService.name} 크론 설정`}
          icon="clock"
          confirmLabel="설정 열기"
          onClose={() => setCronService(undefined)}
          onConfirm={() => navigate(getPath(appId, cronService.id, "settings"))}
          showCancel={false}
        >
          {`${cronService.cronSchedule}

· 매일 03:00에 실행합니다. 서울 시간으로 계산합니다.
· 5분보다 자주 실행할 수 없고, 30분이 넘으면 강제로 끝냅니다.
· staging·PR 환경에서는 따로 켜야 실행됩니다.`}
        </DemoAppDialog>}
        {notice && <Notice role="status">{notice}</Notice>}
      </Page>
    </StudentShell>
  );
}

export function DemoAppSettingsPage() {
  const navigate = useNavigate();
  const { appId = "demo-portfolio-web" } = useParams<{ appId: string }>();
  const app = getDemoApp(appId);
  const user = getSessionUser();
  const [draft, setDraft] = useState(() => app ? structuredClone(app) : undefined);
  const [notice, setNotice] = useState("");
  const [deleteName, setDeleteName] = useState<string>();
  const [addingEnvironment, setAddingEnvironment] = useState(false);
  const [environmentName, setEnvironmentName] = useState("preview");
  const [environmentError, setEnvironmentError] = useState("");
  const [editingEnvironment, setEditingEnvironment] = useState<string>();
  const [editingEnvironmentSnapshot, setEditingEnvironmentSnapshot] = useState<DemoEnvironment>();
  const [branchDraft, setBranchDraft] = useState("");
  const request = useDemoAppRequest("apps-app-settings", appId);
  useEffect(() => {
    const current = getDemoApp(appId);
    setDraft(current ? structuredClone(current) : undefined);
    setEditingEnvironment(undefined);
    setEditingEnvironmentSnapshot(undefined);
    setNotice("");
  }, [appId]);
  const teamPath = app?.owner?.type === "team" ? `/teams/${encodeURIComponent(app.owner.id)}` : "";
  const listPath = `${teamPath}/apps`;
  const scopeOptions = demoAppScopeOptions(app?.owner, navigate);
  const go = (item: Exclude<StudentNavigationKey, "none">) => {
    if (item === "home") navigate(teamPath || "/");
    if (item === "apps") navigate(listPath);
    if (item === "team") navigate(teamPath || "/teams");
    if (item === "database") navigate(teamPath ? `/databases?owner=${encodeURIComponent(app?.owner?.id ?? "")}` : "/databases");

    return ['home', 'apps', 'team', 'database'].includes(item);
  };
  if (!isDemoMode() || !app)
    return (
      <StudentShell
        activeItem="apps"
        scopeLabel={teamPath ? app?.owner?.name ?? "팀 Resources" : "내 Resources"}
        scopeOptions={scopeOptions}
        userName={user?.name ?? "김지민"}
        onNavigate={go}
        onCreateTeam={() => navigate("/teams/new")}
        onOpenStatus={() => navigate("/status")}
        onSelectScope={() => undefined}
        onSearch={() => undefined}
        onOpenNotifications={() => undefined}
      >
        <Page>
          <Breadcrumb>Apps</Breadcrumb>
          <Card>
            <CardTitle>앱을 찾을 수 없습니다</CardTitle>
          </Card>
        </Page>
      </StudentShell>
    );
  const canManage = canManageDemoApp(app);
  const updateDraftEnvironment = (name: string, patch: Partial<DemoEnvironment>) => {
    if (!canManage) return;
    setDraft(current => current ? {
      ...current,
      environments: current.environments.map(environment => environment.name === name
        ? { ...environment, ...patch }
        : environment),
    } : current);
    setNotice("");
  };
  const saveSettings = () => {
    if (!canManage || !draft) return;
    const apps = getDemoApps();
    const current = apps.find((item) => item.id === appId);
    if (!current) {
      setNotice("앱 설정을 찾을 수 없습니다.");
      return;
    }
    let settingsDraft = draft;
    if (editingEnvironment) {
      const branch = branchDraft.trim();
      if (!branch) {
        setNotice("배포 브랜치를 입력해 주세요.");
        return;
      }
      settingsDraft = {
        ...draft,
        environments: draft.environments.map(environment => environment.name === editingEnvironment
          ? { ...environment, branch }
          : environment),
      };
      setDraft(settingsDraft);
      setEditingEnvironment(undefined);
      setEditingEnvironmentSnapshot(undefined);
    }
    current.environments = structuredClone(settingsDraft.environments);
    const draftService = settingsDraft.services[0];
    if (draftService) {
      current.services = current.services.map(service => ({
        ...service,
        prPreviews: draftService.prPreviews,
        previewEnvironment: draftService.previewEnvironment,
        previewBots: draftService.previewBots,
      }));
    }
    if (!saveDemoApps(apps)) {
      setNotice("설정 변경사항을 저장하지 못했습니다. 다시 시도해 주세요.");
      return;
    }
    setDraft(structuredClone(current));
    setNotice("설정 변경사항을 로컬 미리보기에 저장했습니다.");
  };
  const addEnvironment = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft || !canManage || draft.environments.length >= 3) return;
    const name = environmentName.trim();
    if (!name || draft.environments.some(environment => environment.name.toLowerCase() === name.toLowerCase())) {
      setEnvironmentError("환경 이름을 입력해 주세요. 이미 있는 이름은 쓸 수 없습니다.");
      return;
    }
    setDraft(current => current ? {
      ...current,
      environments: [...current.environments, { name, branch: "develop", autoDeploy: true, waitForCi: false }],
    } : current);
    setNotice("환경을 추가했습니다. 변경사항을 적용하려면 설정 저장을 눌러 주세요.");
    setAddingEnvironment(false);
    setEnvironmentName("preview");
    setEnvironmentError("");
  };
  const extendUsage = () => {
    setNotice(renewDemoApp(appId) ? "사용 기간을 연장했습니다." : "사용 기간을 연장하지 못했습니다.");
  };
  const deleteApp = () => {
    if (!canManage || deleteName !== app.name) return;
    if (saveDemoApps(getDemoApps().filter(item => item.id !== appId))) navigate(listPath);
    else setNotice("앱을 삭제하지 못했습니다.");
  };
  return (
    <StudentShell
      activeItem="apps"
      scopeLabel={teamPath ? app?.owner?.name ?? "팀 Resources" : "내 Resources"}
      scopeOptions={scopeOptions}
      userName={user?.name ?? "김지민"}
      onNavigate={go}
      onCreateTeam={() => navigate("/teams/new")}
      onOpenStatus={() => navigate("/status")}
      onSelectScope={() => undefined}
      onSearch={() => undefined}
      onOpenNotifications={() => undefined}
    >
      <Page>
        <Breadcrumb>Apps</Breadcrumb>
        <Heading>
          <TitleBlock>
            <PageTitle>{app.name}</PageTitle>
            <Subtitle>
              {app.repository} · {app.branch}
            </Subtitle>
          </TitleBlock>
        </Heading>
        <Tabs>
          <Tab
            onClick={() => navigate(`/apps/${encodeURIComponent(appId)}/demo`)}
          >
            개요
          </Tab>
          <Tab $active>설정</Tab>
          <TabActions><Button icon={<Octicon name="check" size={16} />} onClick={saveSettings} disabled={!canManage || request.status !== "ready"}>
            설정 저장
          </Button></TabActions>
        </Tabs>
        {request.status !== "ready" ? (
          <DemoAppStateCards page="app-settings" status={request.status} onRetry={request.retry} />
        ) : <>
        <Card>
          <ServicesHeading>
            <CardTitle>환경 · {draft?.environments.length ?? 0} / 3</CardTitle>
            <Button
              variant="secondary"
              icon={<Octicon name="plus" size={16} />}
              onClick={() => {
                setNotice("");
                setEnvironmentName("preview");
                setEnvironmentError("");
                setAddingEnvironment(true);
              }}
              disabled={!canManage || (draft?.environments.length ?? 0) >= 3}
            >
              환경 추가
            </Button>
          </ServicesHeading>
          <Table>
            <TableHeader>
              <span>환경</span>
              <span>브랜치</span>
              <span>자동 재배포</span>
              <span>CI 기다리기</span>
              <span>작업</span>
            </TableHeader>
            {(draft?.environments ?? []).map((env) => (
              <EnvSettingsRow key={env.name}>
                <span>{env.name}</span>
                <span>
                  {editingEnvironment === env.name ? (
                    <Field>
                      브랜치
                      <input
                        aria-label={`${env.name} 브랜치`}
                        value={branchDraft}
                        onChange={event => setBranchDraft(event.currentTarget.value)}
                      />
                    </Field>
                  ) : env.branch}
                </span>
                <span>{editingEnvironment === env.name
                  ? <Switch label="" ariaLabel={`${env.name} 자동 재배포`} checked={env.autoDeploy} disabled={!canManage} onChange={autoDeploy => updateDraftEnvironment(env.name, { autoDeploy })} />
                  : env.autoDeploy ? "켜짐" : "꺼짐"}</span>
                <span>{editingEnvironment === env.name
                  ? <Switch label="" ariaLabel={`${env.name} CI 기다리기`} checked={env.waitForCi} disabled={!canManage} onChange={waitForCi => updateDraftEnvironment(env.name, { waitForCi })} />
                  : env.waitForCi ? "켜짐" : "꺼짐"}</span>
                <span>
                  <Button
                    variant="ghost"
                    icon={<Octicon name={editingEnvironment === env.name ? "check" : "pencil"} size={16} />}
                    disabled={!canManage}
                    onClick={() => {
                      if (editingEnvironment === env.name) {
                        const branch = branchDraft.trim();
                        if (!branch) {
                          setNotice("배포 브랜치를 입력해 주세요.");
                          return;
                        }
                        updateDraftEnvironment(env.name, { branch });
                        setEditingEnvironment(undefined);
                        setEditingEnvironmentSnapshot(undefined);
                      } else {
                        setNotice("");
                        setEditingEnvironment(env.name);
                        setEditingEnvironmentSnapshot(structuredClone(env));
                        setBranchDraft(env.branch);
                      }
                    }}
                  >
                    {editingEnvironment === env.name ? "저장" : "편집"}
                  </Button>
                  {editingEnvironment === env.name && <Button
                    variant="ghost"
                    onClick={() => {
                      const snapshot = editingEnvironmentSnapshot;
                      if (snapshot) setDraft(current => current ? {
                        ...current,
                        environments: current.environments.map(environment => environment.name === snapshot.name ? snapshot : environment),
                      } : current);
                      setEditingEnvironment(undefined);
                      setEditingEnvironmentSnapshot(undefined);
                    }}
                  >취소</Button>}
                </span>
              </EnvSettingsRow>
            ))}
          </Table>
          <SummaryHelp>
            환경은 3개까지 만들 수 있습니다. CI 기다리기를 켜면 GitHub 검사를
            통과한 커밋만 배포합니다.
          </SummaryHelp>
        </Card>
        <Card>
          <CardTitle>PR 미리보기</CardTitle>
          <Toggle>
            <span>
              PR마다 미리보기 환경 만들기
              <small>
                저장소에 PR이 열리면 기준 환경 설정으로 미리보기를 만듭니다.
              </small>
            </span>
            <Switch
              label=""
              ariaLabel="PR마다 미리보기 환경 만들기"
              disabled={!canManage}
              checked={draft?.services[0]?.prPreviews ?? false}
              onChange={(checked) => {
                setDraft(current => current ? {
                  ...current,
                  services: current.services.map(service => ({ ...service, prPreviews: checked })),
                } : current);
                setNotice("");
              }}
            />
          </Toggle>
          <SelectField
            label="기준 환경"
            disabled={!canManage}
            value={draft?.services[0]?.previewEnvironment ?? "production"}
            options={(draft?.environments ?? []).map(env => ({ value: env.name, label: env.name }))}
            onChange={(value) => {
              setDraft(current => current ? {
                ...current,
                services: current.services.map(service => ({ ...service, previewEnvironment: value })),
              } : current);
              setNotice("");
            }}
          />
          <Toggle>
            <span>
              봇이 연 PR도 미리보기
              <small>봇이 연 PR은 기본으로 미리보기를 만들지 않습니다.</small>
            </span>
            <Switch
              label=""
              ariaLabel="봇이 연 PR 미리보기"
              disabled={!canManage}
              checked={draft?.services[0]?.previewBots ?? false}
              onChange={(checked) => {
                setDraft(current => current ? {
                  ...current,
                  services: current.services.map(service => ({ ...service, previewBots: checked })),
                } : current);
                setNotice("");
              }}
            />
          </Toggle>
          <SummaryHelp>
            미리보기는 동시에 2개까지 열리고 7일 뒤 정리됩니다. 배포 권한이 없는
            사람의 PR은 미리보기를 열지 않습니다.
          </SummaryHelp>
        </Card>
        <Card>
          <ServicesHeading>
            <CardTitle>사용 기간</CardTitle>
            <Button variant="secondary" icon={<Octicon name="calendar" size={16} />} onClick={extendUsage}>
              사용 기간 연장
            </Button>
          </ServicesHeading>
          <InfoRow>
            <Octicon name="calendar" size={16} />
            <InfoText>
              <span>만료</span>
              <strong>{app.expiresAt}</strong>
              <small>연장하면 {app.expiresAt === "10월 6일 14:00" ? "10월 20일 14:00" : formatDemoAppDate(Math.max(Date.now(), app.expiresAtMs ?? Date.now()) + 14 * 86_400_000)}까지 쓸 수 있습니다. 연결한 Database도 앱보다 먼저 끝나지 않게 함께 연장됩니다.</small>
            </InfoText>
          </InfoRow>
        </Card>
        <Card>
          <ServicesHeading>
            <CardTitle>앱 삭제</CardTitle>
            <Button variant="danger" icon={<Octicon name="trashcan" size={16} />} disabled={!canManage} onClick={() => setDeleteName("")}>
              앱 삭제
            </Button>
          </ServicesHeading>
          <InfoRow>
            <Octicon name="alert" size={16} />
            <InfoText>
              <span>삭제하면</span>
              <strong>서비스 {app.services.length}개 · 환경 {app.environments.length}개 · 배포 기록과 변수가 지워집니다</strong>
              <small>연결한 Database는 남습니다. 삭제할 때 앱 이름을 입력해 확인합니다.</small>
            </InfoText>
          </InfoRow>
        </Card>
        </>}
        {addingEnvironment && <Modal onClose={() => setAddingEnvironment(false)}>
          <CardTitle id="demo-app-dialog-title">환경 추가</CardTitle>
          <form onSubmit={addEnvironment}>
            <Field>
              환경 이름
              <input
                autoFocus
                maxLength={40}
                value={environmentName}
                onChange={event => {
                  setEnvironmentName(event.currentTarget.value);
                  setEnvironmentError("");
                }}
              />
            </Field>
            <Subtitle>환경은 3개까지 만들 수 있습니다.</Subtitle>
            {environmentError && <Subtitle role="alert">{environmentError}</Subtitle>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <Button type="button" variant="secondary" onClick={() => setAddingEnvironment(false)}>취소</Button>
              <Button type="submit">환경 추가</Button>
            </div>
          </form>
        </Modal>}
        {deleteName !== undefined && <Modal onClose={() => setDeleteName(undefined)} titleId="delete-confirm-title">
          <DeletePanel open title={`${app.name}을 삭제하시겠습니까?`}
            description="아래 항목이 모두 지워집니다. 지운 앱은 되살릴 수 없습니다."
            items={`· 서비스 ${app.services.length}개 (${app.services.map(service => service.name).join(", ")})
· 환경 ${app.environments.length}개 (${app.environments.map(environment => environment.name).join(", ")})
· 배포 기록과 변수`}
            fieldLabel="확인하려면 앱 이름을 입력하세요" confirmationName={app.name}
            value={deleteName} onValueChange={setDeleteName} onCancel={() => setDeleteName(undefined)} onConfirm={deleteApp}
            caption="연결한 Database는 지워지지 않습니다." confirmLabel="앱 삭제" hint={`${app.name}을 정확하게 입력하세요`} />
        </Modal>}
        {notice && <Notice role="status">{notice}</Notice>}
      </Page>
    </StudentShell>
  );
}

export function DemoAddServicePage() {
  const navigate = useNavigate();
  const { appId = "demo-portfolio-web" } = useParams<{ appId: string }>();
  const app = getDemoApp(appId);
  const user = getSessionUser();
  const [name, setName] = useState("");
  const [type, setType] = useState<"웹" | "워커" | "크론">("웹");
  const [subdomain, setSubdomain] = useState("");
  const [memoryMb, setMemoryMb] = useState(512);
  const [cpu, setCpu] = useState(0.5);
  const [notice, setNotice] = useState("");
  const teamPath = app?.owner?.type === "team" ? `/teams/${encodeURIComponent(app.owner.id)}` : "";
  const listPath = `${teamPath}/apps`;
  const scopeOptions = demoAppScopeOptions(app?.owner, navigate);
  const go = (item: Exclude<StudentNavigationKey, "none">) => {
    if (item === "home") navigate(teamPath || "/");
    if (item === "apps") navigate(listPath);
    if (item === "team") navigate(teamPath || "/teams");
    if (item === "database") navigate(teamPath ? `/databases?owner=${encodeURIComponent(app?.owner?.id ?? "")}` : "/databases");

    return ['home', 'apps', 'team', 'database'].includes(item);
  };
  if (!isDemoMode() || !app || !canManageDemoApp(app) || isDemoAppExpired(app))
    return (
      <StudentShell
        activeItem="apps"
        scopeLabel={teamPath ? app?.owner?.name ?? "팀 Resources" : "내 Resources"}
        scopeOptions={scopeOptions}
        userName={user?.name ?? "김지민"}
        onNavigate={go}
        onCreateTeam={() => navigate("/teams/new")}
        onOpenStatus={() => navigate("/status")}
        onSelectScope={() => undefined}
        onSearch={() => undefined}
        onOpenNotifications={() => undefined}
      >
        <Page>
          <Card>
            <CardTitle>앱을 찾을 수 없습니다</CardTitle>
          </Card>
        </Page>
      </StudentShell>
    );
  const quota = getDemoAppQuota(app.owner ?? demoPersonalAppOwner);
  return (
    <StudentShell
      activeItem="apps"
      scopeLabel={teamPath ? app?.owner?.name ?? "팀 Resources" : "내 Resources"}
      scopeOptions={scopeOptions}
      userName={user?.name ?? "김지민"}
      onNavigate={go}
      onCreateTeam={() => navigate("/teams/new")}
      onOpenStatus={() => navigate("/status")}
      onSelectScope={() => undefined}
      onSearch={() => undefined}
      onOpenNotifications={() => undefined}
    >
      <Page>
        <Breadcrumb>Apps / {app.name}</Breadcrumb>
        <Heading>
          <TitleBlock>
            <Title>서비스 추가</Title>
            <Subtitle>
              {app.repository} · {app.branch}
            </Subtitle>
          </TitleBlock>
        </Heading>
        <ServiceActions>
          <Button
            variant="ghost"
            onClick={() => navigate(`/apps/${encodeURIComponent(appId)}/demo`)}
          >
            취소
          </Button>
          <Button
            onClick={() => {
              if (!name.trim()) {
                setNotice("서비스 이름을 입력해 주세요.");
                return;
              }
              if (app.services.some(service => service.name === name.trim())) {
                setNotice("앱 안에서 이미 쓰는 서비스 이름입니다.");
                return;
              }
              if (memoryMb > getDemoAppQuota(app.owner ?? demoPersonalAppOwner).freeMemory) {
                setNotice("메모리 할당량이 모자랍니다");
                return;
              }
              const domain = type === "웹" ? subdomain.trim() || name.toLowerCase().replace(/[^a-z0-9-]/g, "-") : "";
              if (type === "웹" && !isDemoAppSubdomainAvailable(domain)) {
                setNotice("서브도메인을 쓸 수 없습니다");
                return;
              }
              const id = addDemoService(appId, { name: name.trim(), type, subdomain: domain, memoryMb, cpu });
              if (!id) { setNotice("서비스를 저장하지 못했습니다."); return; }
              navigate(getPath(appId, id));
            }}
          >
            서비스 추가
          </Button>
        </ServiceActions>
        <Card>
          <CardTitle>서비스</CardTitle>
          <Field>
            서비스 유형
            <select
              value={type}
              onChange={(event) =>
                setType(event.currentTarget.value as "웹" | "워커" | "크론")
              }
            >
              <option>웹</option>
              <option>워커</option>
              <option>크론</option>
            </select>
          </Field>
          <Field>
            서비스 이름
            <input
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
              placeholder="예: api"
            />
          </Field>
          <Subtitle>앱 안에서 서비스를 구분하는 이름입니다.</Subtitle>
        </Card>
        {type === "웹" && (
          <Card>
            <CardTitle>주소</CardTitle>
            <Field>
              서브도메인
              <input
                value={subdomain}
                onChange={(event) => setSubdomain(event.currentTarget.value)}
                placeholder={app.name}
              />
            </Field>
            <Subtitle>
              production 주소는 https://{subdomain || app.name}.gsmsv.app입니다.
            </Subtitle>
          </Card>
        )}
        <Card>
          <CardTitle>자원</CardTitle>
          <Subtitle>메모리 할당량 {quota.usedMemory} MB / 2 GB 사용 중 · 남은 할당량 {quota.freeMemory} MB</Subtitle>
          <Field>
            메모리
            <select value={memoryMb} onChange={event => setMemoryMb(Number(event.currentTarget.value))}>
              <option value={512}>512 MB</option>
              <option value={256}>256 MB</option>
              <option value={1024}>1 GB</option>
            </select>
          </Field>
          <Field>
            CPU
            <select value={cpu} onChange={event => setCpu(Number(event.currentTarget.value))}>
              <option value={0.5}>0.5 vCPU</option>
              <option value={0.25}>0.25 vCPU</option>
              <option value={1}>1 vCPU</option>
            </select>
          </Field>
          <Subtitle>
            컨테이너 안 파일은 재시작하면 사라집니다. 남길 데이터는 Database에
            저장하세요.
          </Subtitle>
        </Card>
        {notice && <Notice>{notice}</Notice>}
      </Page>
    </StudentShell>
  );
}
