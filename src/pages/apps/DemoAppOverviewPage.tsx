import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import styled from "styled-components";
import {
  getDemoApp,
  getDemoApps,
  saveDemoApps,
  type DemoEnvironment,
} from "../../entities/app/demo";
import { getSessionUser } from "../../entities/session";
import { isDemoMode } from "../../shared/demo";
import { Button, SegmentedControl } from "../../shared/ui/controls";
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
const Heading = styled.header`
  display: flex;
  min-height: 74px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
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
  align-items: center;
  gap: 8px;
  min-height: 42px;
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
const Summary = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;
const SummaryCard = styled(Card)`
  min-height: 150px;
  justify-content: space-between;
`;
const SummaryLabel = styled.span`
  color: ${({ theme }) => theme.colors.muted};
  font:
    ${({ theme }) => theme.typography.label.weight}
      ${({ theme }) => theme.typography.label.size}px /
      ${({ theme }) => theme.typography.label.lineHeight}px
      ${({ theme }) => theme.typography.label.family},
    sans-serif;
`;
const SummaryValue = styled.strong`
  color: ${({ theme }) => theme.colors.text};
  font:
    ${({ theme }) => theme.typography.h2.weight}
      ${({ theme }) => theme.typography.h2.size}px /
      ${({ theme }) => theme.typography.h2.lineHeight}px
      ${({ theme }) => theme.typography.h2.family},
    sans-serif;
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
  align-items: center;
  justify-content: space-between;
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
  min-height: 254px;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;
const ServiceHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;
const ServiceName = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font:
    ${({ theme }) => theme.typography.title.weight}
      ${({ theme }) => theme.typography.title.size}px /
      ${({ theme }) => theme.typography.title.lineHeight}px
      ${({ theme }) => theme.typography.title.family},
    sans-serif;
`;
const State = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  font:
    ${({ theme }) => theme.typography.caption.weight}
      ${({ theme }) => theme.typography.caption.size}px /
      ${({ theme }) => theme.typography.caption.lineHeight}px
      ${({ theme }) => theme.typography.caption.family},
    sans-serif;
`;
const ServiceCardMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: ${({ theme }) => theme.colors.muted};
  font:
    ${({ theme }) => theme.typography.caption.weight}
      ${({ theme }) => theme.typography.caption.size}px /
      ${({ theme }) => theme.typography.caption.lineHeight}px
      ${({ theme }) => theme.typography.caption.family},
    sans-serif;
`;
const LinkText = styled.a`
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  font:
    ${({ theme }) => theme.typography.bodySmall.weight}
      ${({ theme }) => theme.typography.bodySmall.size}px /
      ${({ theme }) => theme.typography.bodySmall.lineHeight}px
      ${({ theme }) => theme.typography.bodySmall.family},
    sans-serif;
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
const TableRow = styled.div`
  display: grid;
  min-height: 66px;
  grid-template-columns: 1.1fr 1.5fr 1fr 0.9fr 1fr;
  align-items: center;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
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
const Notice = styled.div`
  margin: 0;
  padding: 20px 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.primarySoft};
  color: ${({ theme }) => theme.colors.primary};
`;
const RenewalNotice = styled(Notice)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
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
const Toggle = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: ${({ theme }) => theme.colors.text};
  input {
    width: 44px;
    height: 24px;
    accent-color: ${({ theme }) => theme.colors.primary};
  }
  small {
    display: block;
    margin-top: 4px;
    color: ${({ theme }) => theme.colors.faint};
  }
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
  const [notice, setNotice] = useState("");
  const go = (item: Exclude<StudentNavigationKey, "none">) => {
    if (item === "home") navigate("/");
    if (item === "apps") navigate("/apps");
    if (item === "team") navigate("/teams");
    if (item === "database") navigate("/databases");
  };
  if (!isDemoMode() || !app)
    return (
      <StudentShell
        activeItem="apps"
        scopeLabel="내 Resources"
        userName={user?.name ?? "김민수"}
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
            <Button onClick={() => navigate("/apps")}>Apps로 이동</Button>
          </Card>
        </Page>
      </StudentShell>
    );
  const visibleServices = app.services.filter(
    (service) => service.environment === environment,
  );
  const memory = visibleServices.reduce((sum, item) => sum + item.memoryMb, 0);
  const extendUsage = () => {
    const apps = getDemoApps();
    const current = apps.find((item) => item.id === appId);
    if (!current) return;
    current.expiresAt = "10월 20일 14:00";
    saveDemoApps(apps);
    setNotice("사용 기간을 로컬 미리보기에서 연장했습니다.");
  };
  return (
    <StudentShell
      activeItem="apps"
      scopeLabel="내 Resources"
      userName={user?.name ?? "김민수"}
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
            <Title>{app.name}</Title>
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
          <Button
            variant="secondary"
            onClick={() =>
              navigate(`/apps/${encodeURIComponent(appId)}/services/new`)
            }
          >
            서비스 추가
          </Button>
        </Tabs>
        <RenewalNotice>
          <div>
            <SummaryLabel>만료까지 7일 남았어요</SummaryLabel>
            <SummaryHelp>
              {app.expiresAt}에 정지됩니다. 연장하면 연결한 Database도 앱보다
              먼저 끝나지 않게 함께 연장됩니다.
            </SummaryHelp>
          </div>
          <Button variant="secondary" onClick={extendUsage}>
            사용 기간 연장
          </Button>
        </RenewalNotice>
        <Card>
          <CardTitle>환경</CardTitle>
          <SegmentedControl
            label="환경"
            options={[
              { value: "production", label: "production" },
              { value: "staging", label: "staging" },
            ]}
            value={environment}
            onChange={setEnvironment}
          />
          <Subtitle>
            production은 main, staging은 develop 브랜치에 push하면 배포됩니다.
          </Subtitle>
        </Card>
        <Summary>
          <SummaryCard>
            <SummaryLabel>서비스</SummaryLabel>
            <SummaryValue>{visibleServices.length}개</SummaryValue>
            <SummaryHelp>
              {environment === "production"
                ? "웹 1 · 크론 1"
                : "서비스가 없습니다"}
            </SummaryHelp>
          </SummaryCard>
          <SummaryCard>
            <SummaryLabel>메모리 할당량</SummaryLabel>
            <SummaryValue>{memory > 0 ? "1 / 2 GB" : "0 / 2 GB"}</SummaryValue>
            <SummaryHelp>production 768 MB · staging 256 MB</SummaryHelp>
          </SummaryCard>
          <SummaryCard>
            <SummaryLabel>최근 배포</SummaryLabel>
            <SummaryValue>
              {visibleServices[0]?.deployments[0]?.at ?? "—"}
            </SummaryValue>
            <SummaryHelp>
              {visibleServices[0]?.name} ·{" "}
              {visibleServices[0]?.deployments[0]?.id} ·{" "}
              {visibleServices[0]?.deployments[0]?.author}
            </SummaryHelp>
          </SummaryCard>
        </Summary>
        <section>
          <ServicesHeading>
            <CardTitle>서비스 · {environment}</CardTitle>
          </ServicesHeading>
          <ServiceGrid>
            {visibleServices.map((service) => (
              <ServiceCard key={service.id}>
                <ServiceHeader>
                  <Octicon
                    name={service.type === "웹" ? "globe" : "clock"}
                    size={20}
                  />
                  <Button
                    variant="ghost"
                    onClick={() => navigate(getPath(appId, service.id))}
                  >
                    열기
                  </Button>
                </ServiceHeader>
                <div>
                  <ServiceName>{service.name}</ServiceName>
                  <LinkText
                    href={`https://${service.subdomain}.gsmsv.app`}
                    onClick={(event) => {
                      event.preventDefault();
                      navigate(`/public/${encodeURIComponent(appId)}/stopped`);
                    }}
                  >
                    {service.type === "웹"
                      ? `https://${service.subdomain}.{앱 도메인}`
                      : service.type === "크론"
                        ? "매일 03:00 (서울)"
                        : "주소 없음"}
                  </LinkText>
                  <Subtitle>
                    {service.type} · {service.memoryMb} MB · {service.cpu} vCPU
                  </Subtitle>
                </div>
                <ServiceCardMeta>
                  <span>
                    {service.type === "웹"
                      ? `${service.deployments[0]?.id} · ${service.deployments[0]?.at} 배포`
                      : `지난 실행 ${service.deployments[0]?.at} · 성공`}
                  </span>
                  <State>{service.status}</State>
                </ServiceCardMeta>
              </ServiceCard>
            ))}
          </ServiceGrid>
        </section>
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
  const [notice, setNotice] = useState("");
  const go = (item: Exclude<StudentNavigationKey, "none">) => {
    if (item === "home") navigate("/");
    if (item === "apps") navigate("/apps");
    if (item === "team") navigate("/teams");
    if (item === "database") navigate("/databases");
  };
  if (!isDemoMode() || !app)
    return (
      <StudentShell
        activeItem="apps"
        scopeLabel="내 Resources"
        userName={user?.name ?? "김민수"}
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
  const update = (name: string, patch: Partial<DemoEnvironment>) => {
    const apps = getDemoApps();
    const target = apps
      .find((item) => item.id === appId)
      ?.environments.find((env) => env.name === name);
    if (target) {
      Object.assign(target, patch);
      saveDemoApps(apps);
      setNotice("변경사항을 로컬 미리보기에 저장했습니다.");
    }
  };
  const addEnvironment = () => {
    const apps = getDemoApps();
    const current = apps.find((item) => item.id === appId);
    if (!current || current.environments.length >= 3) return;
    const name = window.prompt("환경 이름", "preview");
    if (!name?.trim()) return;
    current.environments.push({
      name: name.trim(),
      branch: "develop",
      autoDeploy: true,
      waitForCi: false,
    });
    saveDemoApps(apps);
    setNotice("환경을 로컬 미리보기에 추가했습니다.");
  };
  const extendUsage = () => {
    const apps = getDemoApps();
    const current = apps.find((item) => item.id === appId);
    if (current) {
      current.expiresAt = "10월 20일 14:00";
      saveDemoApps(apps);
      setNotice("사용 기간을 로컬 미리보기에서 연장했습니다.");
    }
  };
  const deleteApp = () => {
    const confirmation = window.prompt(
      `앱 이름 ${app.name}을 입력하면 로컬 미리보기에서 삭제합니다.`,
    );
    if (confirmation !== app.name) return;
    saveDemoApps(getDemoApps().filter((item) => item.id !== appId));
    navigate("/apps");
  };
  return (
    <StudentShell
      activeItem="apps"
      scopeLabel="내 Resources"
      userName={user?.name ?? "김민수"}
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
            <Title>{app.name}</Title>
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
          <Button
            onClick={() =>
              setNotice("설정 변경사항을 로컬 미리보기에 저장했습니다.")
            }
          >
            설정 저장
          </Button>
        </Tabs>
        <Card>
          <ServicesHeading>
            <CardTitle>환경 · {app.environments.length} / 3</CardTitle>
            <Button
              variant="secondary"
              onClick={addEnvironment}
              disabled={app.environments.length >= 3}
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
            {app.environments.map((env) => (
              <EnvSettingsRow key={env.name}>
                <span>{env.name}</span>
                <span>{env.branch}</span>
                <span>{env.autoDeploy ? "켜짐" : "꺼짐"}</span>
                <span>{env.waitForCi ? "켜짐" : "꺼짐"}</span>
                <span>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      const branch = window.prompt("배포 브랜치", env.branch);
                      if (branch) update(env.name, { branch });
                    }}
                  >
                    편집
                  </Button>
                </span>
              </EnvSettingsRow>
            ))}
          </Table>
          <Subtitle>
            환경은 3개까지 만들 수 있습니다. CI 기다리기를 켜면 GitHub 검사를
            통과한 커밋만 배포합니다.
          </Subtitle>
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
            <input
              type="checkbox"
              checked={app.services[0]?.prPreviews ?? false}
              onChange={(event) => {
                const apps = getDemoApps();
                const current = apps.find((item) => item.id === appId);
                if (current?.services[0])
                  current.services[0].prPreviews = event.currentTarget.checked;
                saveDemoApps(apps);
                setNotice("PR 미리보기 설정을 저장했습니다.");
              }}
            />
          </Toggle>
          <Field>
            기준 환경
            <select
              aria-label="기준 환경"
              value={app.services[0]?.previewEnvironment ?? "production"}
              onChange={(event) => {
                const apps = getDemoApps();
                const current = apps.find((item) => item.id === appId);
                if (current?.services[0])
                  current.services[0].previewEnvironment =
                    event.currentTarget.value;
                saveDemoApps(apps);
                setNotice("기준 환경을 저장했습니다.");
              }}
            >
              {app.environments.map((env) => (
                <option key={env.name}>{env.name}</option>
              ))}
            </select>
          </Field>
          <Toggle>
            <span>
              봇이 연 PR도 미리보기
              <small>봇이 연 PR은 기본으로 미리보기를 만들지 않습니다.</small>
            </span>
            <input
              type="checkbox"
              checked={app.services[0]?.previewBots ?? false}
              onChange={(event) => {
                const apps = getDemoApps();
                const current = apps.find((item) => item.id === appId);
                if (current?.services[0])
                  current.services[0].previewBots = event.currentTarget.checked;
                saveDemoApps(apps);
                setNotice("봇 PR 미리보기 설정을 저장했습니다.");
              }}
            />
          </Toggle>
          <Subtitle>
            미리보기는 동시에 2개까지 열리고 7일 뒤 정리됩니다. 배포 권한이 없는
            사람의 PR은 미리보기를 열지 않습니다.
          </Subtitle>
        </Card>
        <Card>
          <ServicesHeading>
            <CardTitle>사용 기간</CardTitle>
            <Button variant="secondary" onClick={extendUsage}>
              사용 기간 연장
            </Button>
          </ServicesHeading>
          <Field>
            만료
            <input disabled value={app.expiresAt} />
          </Field>
          <Subtitle>
            연장하면 연결한 Database도 앱보다 먼저 끝나지 않게 함께 연장됩니다.
          </Subtitle>
        </Card>
        <Card>
          <ServicesHeading>
            <CardTitle>앱 삭제</CardTitle>
            <Button variant="danger" onClick={deleteApp}>
              앱 삭제
            </Button>
          </ServicesHeading>
          <Subtitle>
            서비스 {app.services.length}개 · 환경 {app.environments.length}개 ·
            배포 기록과 변수가 지워집니다. 연결한 Database는 남습니다. 삭제할 앱
            이름을 입력해 확인합니다.
          </Subtitle>
        </Card>
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
  const [notice, setNotice] = useState("");
  const go = (item: Exclude<StudentNavigationKey, "none">) => {
    if (item === "home") navigate("/");
    if (item === "apps") navigate("/apps");
    if (item === "team") navigate("/teams");
    if (item === "database") navigate("/databases");
  };
  if (!isDemoMode() || !app)
    return (
      <StudentShell
        activeItem="apps"
        scopeLabel="내 Resources"
        userName={user?.name ?? "김민수"}
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
  return (
    <StudentShell
      activeItem="apps"
      scopeLabel="내 Resources"
      userName={user?.name ?? "김민수"}
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
        <Tabs>
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
              const apps = getDemoApps();
              const target = apps.find((item) => item.id === appId);
              if (!target) return;
              const id = `service-${Date.now().toString(36)}`;
              const base = {
                ...target.services[0],
                id,
                name: name.trim(),
                type,
                subdomain:
                  subdomain.trim() ||
                  name.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
              };
              target.services.push(base);
              saveDemoApps(apps);
              navigate(getPath(appId, id));
            }}
          >
            서비스 추가
          </Button>
        </Tabs>
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
          <Subtitle>메모리 할당량 1/2 GB 사용 중 · 남은 할당량 1 GB</Subtitle>
          <Field>
            메모리
            <select>
              <option>512 MB</option>
              <option>256 MB</option>
              <option>1 GB</option>
            </select>
          </Field>
          <Field>
            CPU
            <select>
              <option>0.5 vCPU</option>
              <option>0.25 vCPU</option>
              <option>1 vCPU</option>
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
