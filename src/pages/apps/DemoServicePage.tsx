import { useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import styled from "styled-components";
import {
  getDemoApp,
  getDemoService,
  updateDemoService,
  type DemoManagedService,
  type DemoAppVariable,
} from "../../entities/app";
import { getSessionUser } from "../../entities/session";
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

function useDemoService() {
  const { appId = "demo-portfolio-web", serviceId = "demo-web" } = useParams<{
    appId: string;
    serviceId: string;
  }>();
  const app = useMemo(() => getDemoApp(appId), [appId]);
  const service = useMemo(
    () => getDemoService(appId, serviceId),
    [appId, serviceId],
  );
  return { app, service, appId, serviceId };
}

export default function DemoServicePage() {
  const navigate = useNavigate();
  const { app, service, appId, serviceId } = useDemoService();
  const { tab: rawTab = "deployments" } = useParams<{ tab: string }>();
  const tab = tabLabel(rawTab);
  const user = getSessionUser();
  const [notice, setNotice] = useState("");
  const [variableKey, setVariableKey] = useState("CONTACT_EMAIL");
  const [variableValue, setVariableValue] = useState("jimin@example.com");
  const [variableSecret, setVariableSecret] = useState(false);
  const [variablesEditing, setVariablesEditing] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState("a1b2c3d");
  const [settingsDraft, setSettingsDraft] = useState<
    Partial<DemoManagedService>
  >({});
  const [domainDraft, setDomainDraft] = useState("");
  const [shellInput, setShellInput] = useState("");

  const move = (next: string) =>
    navigate(
      `/apps/${encodeURIComponent(appId)}/services/${encodeURIComponent(serviceId)}/${next}`,
    );
  const navigateFromShell = (item: Exclude<StudentNavigationKey, "none">) => {
    if (item === "home") navigate("/");
    if (item === "apps") navigate("/apps");
    if (item === "team") navigate("/teams");
    if (item === "database") navigate("/databases");
  };
  const shell = (children: React.ReactNode) => (
    <StudentShell
      activeItem="apps"
      scopeLabel="내 Resources"
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
          <CardTitle>데모 앱을 찾을 수 없습니다</CardTitle>
          <Button onClick={() => navigate("/apps")}>Apps로 이동</Button>
        </Card>
      </Page>,
    );

  const update = (patch: Partial<DemoManagedService>) => {
    updateDemoService(appId, serviceId, patch);
    setNotice("변경사항을 로컬 미리보기에 저장했습니다.");
  };
  const addVariable = (event: FormEvent) => {
    event.preventDefault();
    const key = variableKey.trim();
    if (!key || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || key === "PORT") return;
    const variables = [
      ...service.variables.filter((item) => item.key !== key),
      { key, value: variableValue, secret: variableSecret },
    ];
    update({ variables });
    setVariableKey("");
    setVariableValue("");
    setVariableSecret(false);
  };
  const updateVariable = (key: string, patch: Partial<DemoAppVariable>) =>
    update({
      variables: service.variables.map((item) =>
        item.key === key ? { ...item, ...patch } : item,
      ),
    });
  const actionButton =
    tab === "deployments" ? (
      <Button
        variant="secondary"
        onClick={() => {
          const deployment = {
            id: Math.random().toString(16).slice(2, 9),
            status: "running" as const,
            commit: "로컬 미리보기 재배포",
            author: user?.name ?? "김민수",
            at: new Date().toLocaleString("ko-KR", {
              month: "numeric",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            message: "빌드 로그 보기",
          };
          update({ deployments: [deployment, ...service.deployments] });
        }}
      >
        재배포
      </Button>
    ) : tab === "logs" ? (
      <Button
        variant="secondary"
        onClick={() => {
          update({ paused: !service.paused });
          setNotice(
            service.paused
              ? "로그 스트리밍을 다시 시작했습니다."
              : "로그 스트리밍을 일시 정지했습니다.",
          );
        }}
      >
        {service.paused ? "다시 시작" : "일시 정지"}
      </Button>
    ) : tab === "variables" ? (
      <>
        <Button
          variant="secondary"
          onClick={() =>
            document.getElementById("demo-new-variable-key")?.focus()
          }
        >
          변수 추가
        </Button>
        <Button
          onClick={() => setNotice("변경사항을 로컬 미리보기에 저장했습니다.")}
        >
          변경사항 저장
        </Button>
      </>
    ) : tab === "shell" ? (
      <Button
        variant="secondary"
        onClick={() => {
          update({ shellOpen: !service.shellOpen });
          setNotice(
            service.shellOpen
              ? "셸 세션을 종료했습니다."
              : "로컬 셸 세션을 열었습니다.",
          );
        }}
      >
        {service.shellOpen ? "세션 끝내기" : "셸 열기"}
      </Button>
    ) : tab === "settings" ? (
      <Button onClick={() => update(settingsDraft)}>설정 저장</Button>
    ) : tab === "domains" ? (
      <Button
        onClick={() =>
          update({ subdomain: domainDraft.trim() || service.subdomain })
        }
      >
        저장
      </Button>
    ) : null;

  let content: React.ReactNode;
  if (tab === "deployments") {
    content = (
      <>
        <Banner $warning>
          <Octicon name="shield" size={18} />
          <BannerCopy>
            건너뛴 push가 있어요
            <small>
              배포 권한이 없는 사람의 push라 배포하지 않았습니다. 기록에서
              확인한 뒤 이 커밋 배포로 내보낼 수 있습니다.
            </small>
          </BannerCopy>
        </Banner>
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
            {service.deployments.map((item) => (
              <TableRow
                key={item.id}
                $selected={item.id === selectedDeployment}
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
                  <code>{item.id}</code> {item.commit}
                </span>
                <span>{item.author}</span>
                <span>{item.at}</span>
                <span>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (item.status === "skipped") {
                        update({
                          deployments: service.deployments.map((deployment) =>
                            deployment.id === item.id
                              ? {
                                  ...deployment,
                                  status: "running",
                                  message: "빌드 로그 보기",
                                }
                              : deployment,
                          ),
                        });
                        setSelectedDeployment(item.id);
                        setNotice(
                          `${item.id} 커밋을 로컬 미리보기에서 배포했습니다.`,
                        );
                      } else if (item.status === "previous") {
                        setSelectedDeployment(item.id);
                        setNotice(
                          `${item.id} 이전 배포를 로컬 미리보기에서 복구했습니다.`,
                        );
                      } else {
                        setSelectedDeployment(item.id);
                        setNotice(`${item.id} 빌드 로그를 열었습니다.`);
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
        {service.deployments.find((item) => item.id === selectedDeployment) && (
          <Card>
            <CardTitle>
              <Octicon name="terminal" size={16} />
              　선택한 배포 · {selectedDeployment} 빌드 로그
            </CardTitle>
            <Code>
              {[
                "14:18:02  저장소 가져오기 gsm-jimin/portfolio-web@a1b2c3d",
                "14:18:09  npm ci",
                "14:19:41  npm run build",
                "14:20:05  상태 확인 GET /healthz 200 OK",
                "14:20:06  새 배포로 바뀜",
              ].join("\n")}
            </Code>
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
            　production · {service.name} ·{" "}
            {service.paused ? "일시 정지됨" : "실시간"}
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
        <Banner $warning>
          <Octicon name="alert" size={18} />
          <BannerCopy>
            메모리 상한에 닿아 다시 시작했습니다
            <small>
              11월 2일 09:40에 512 MB를 넘어 강제로 종료한 뒤 다시 시작했습니다.
              메모리를 늘리거나 코드를 확인해 주세요.
            </small>
          </BannerCopy>
          <Button variant="secondary" onClick={() => move("settings")}>
            설정 열기
          </Button>
        </Banner>
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
              등록된 변수 · {service.variables.length}개 · 1.2 / 32 KB
            </CardTitle>
            <Button
              variant="ghost"
              onClick={() => setVariablesEditing((value) => !value)}
            >
              {variablesEditing ? "편집 완료" : "변수 편집"}
            </Button>
          </NavRow>
          {service.variables.map((variable) => (
            <VariableRow key={variable.key}>
              <VariableText>
                <strong>{variable.key}</strong>
                <span>
                  {variable.secret
                    ? "비밀 · 저장한 뒤 다시 볼 수 없습니다"
                    : variable.value}
                </span>
              </VariableText>
              {(variablesEditing || variable.secret) && (
                <div>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      const next = window.prompt(
                        `${variable.key} 값 바꾸기`,
                        variable.secret ? "" : variable.value,
                      );
                      if (next !== null)
                        updateVariable(variable.key, {
                          value: next,
                          secret: variable.secret,
                        });
                    }}
                  >
                    값 바꾸기
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      update({
                        variables: service.variables.filter(
                          (item) => item.key !== variable.key,
                        ),
                      })
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
              value={variableKey}
              onChange={(event) => setVariableKey(event.currentTarget.value)}
            />
          </Field>
          <Field>
            값
            <input
              value={variableValue}
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
              onChange={(event) =>
                setVariableSecret(event.currentTarget.checked)
              }
            />
          </ToggleRow>
          <Button type="submit" disabled={!variableKey.trim()}>
            변수 추가
          </Button>
        </Card>
        <Card>
          <CardTitle>Database 연결</CardTitle>
          <Field>
            연결할 Database
            <select
              value={service.databaseId ?? ""}
              onChange={(event) =>
                update({ databaseId: event.currentTarget.value })
              }
            >
              <option value="">연결하지 않음</option>
              <option value="welcome-db">welcome-db · MySQL</option>
              <option value="study-db">study-db · PostgreSQL</option>
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
        <Card>
          <CardTitle>실행</CardTitle>
          <Field>
            시작 명령
            <input
              disabled
              value={settingsDraft.startCommand ?? service.startCommand}
            />
          </Field>
          <Help>
            설정 파일이 덮어씀 · 바꾸려면 저장소의 설정 파일을 고쳐 주세요.
          </Help>
          <Field>
            상태 확인 경로
            <input
              value={settingsDraft.path ?? service.path}
              onChange={(event) =>
                setSettingsDraft((current) => ({
                  ...current,
                  path: event.currentTarget.value,
                }))
              }
            />
          </Field>
          <Help>
            새 배포가 이 경로에서 200을 돌려줘야 바꿉니다. 300초 안에 응답하지
            않으면 실패로 남습니다.
          </Help>
          <Field>
            배포 전 명령
            <input
              value={settingsDraft.preDeployCommand ?? service.preDeployCommand}
              onChange={(event) =>
                setSettingsDraft((current) => ({
                  ...current,
                  preDeployCommand: event.currentTarget.value,
                }))
              }
            />
          </Field>
          <Help>
            새 배포로 바꾸기 전에 한 번 실행합니다. 기본 10분, 최대 30분까지
            기다립니다.
          </Help>
          <Field>
            감시 경로
            <input
              value={settingsDraft.watchPaths ?? service.watchPaths}
              onChange={(event) =>
                setSettingsDraft((current) => ({
                  ...current,
                  watchPaths: event.currentTarget.value,
                }))
              }
            />
          </Field>
          <Help>
            이 경로의 파일이 바뀐 push만 배포합니다. 비워 두면 모든 push를
            배포합니다.
          </Help>
        </Card>
        <Card>
          <CardTitle>자원</CardTitle>
          <Help>메모리 할당량 1/2 GB 사용 중 · 남은 할당량 1 GB</Help>
          <SliderField
            label="메모리"
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
                지금 0개 씁니다.
              </small>
            </span>
            <input
              type="checkbox"
              checked={settingsDraft.alwaysOn ?? service.alwaysOn}
              onChange={(event) =>
                setSettingsDraft((current) => ({
                  ...current,
                  alwaysOn: event.currentTarget.checked,
                }))
              }
            />
          </ToggleRow>
        </Card>
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
              value={domainDraft || service.subdomain}
              onChange={(event) => setDomainDraft(event.currentTarget.value)}
            />
          </Field>
          <Help>
            주소는 https://{domainDraft || service.subdomain}.gsmsv.app입니다.
            production만 직접 정할 수 있습니다.
          </Help>
        </Card>
        <Card>
          <CardTitle>다른 환경</CardTitle>
          <VariableRow>
            <VariableText>
              <strong>staging</strong>
              <span>{app.name}-staging.gsmsv.app</span>
              <small>자동으로 붙는 이름이라 바꿀 수 없습니다.</small>
            </VariableText>
            <Octicon name="globe" size={16} />
          </VariableRow>
          <VariableRow>
            <VariableText>
              <strong>PR 미리보기</strong>
              <span>{app.name}-pr-&#123;번호&#125;.gsmsv.app</span>
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
            셸 안에서는 비밀 변수 값이 보입니다
            <small>
              화면을 공유할 때 조심하세요. 세션은 1시간 뒤 끝납니다.
            </small>
          </BannerCopy>
        </Banner>
        <Card>
          <CardTitle>
            <Octicon name="terminal" size={16} />
            　production · {service.name} ·{" "}
            {service.shellOpen ? "남은 시간 52분" : "셸이 닫혀 있습니다"}
          </CardTitle>
          <Code>
            {service.shellLines.join("\n")}
            {service.shellOpen && shellInput ? `${shellInput}` : ""}
          </Code>
          {service.shellOpen && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const lines = [
                  ...service.shellLines,
                  shellInput === "node -v"
                    ? "v20.11.1"
                    : shellInput === "ls"
                      ? "dist  node_modules  package.json  src"
                      : shellInput === "echo $NODE_ENV"
                        ? "production"
                        : shellInput
                          ? `명령을 실행했습니다: ${shellInput}`
                          : "",
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
          {tabs.map(([key, label]) => (
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
      {notice && <Alert role="status">{notice}</Alert>}
    </Page>,
  );
}

export function DemoStoppedPublicAppPage() {
  const navigate = useNavigate();
  const { appId = "demo-portfolio-web" } = useParams<{ appId: string }>();
  const app = getDemoApp(appId);
  if (!isDemoMode())
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
            <span>{app?.name ?? "portfolio-web"}.gsmsv.app</span>
          </VariableText>
          <Octicon name="globe" size={16} />
        </VariableRow>
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
