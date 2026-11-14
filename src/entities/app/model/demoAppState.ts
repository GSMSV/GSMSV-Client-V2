import {
  isDemoMode,
  readDemoState,
  writeDemoState,
} from "../../../shared/demo";
import type { AppOwner, AppSummary } from "./types";

export interface DemoAppVariable {
  key: string;
  value: string;
  secret: boolean;
}
export interface DemoEnvironment {
  name: string;
  branch: string;
  autoDeploy: boolean;
  waitForCi: boolean;
}
export interface DemoDeployment {
  id: string;
  status: "running" | "skipped" | "failed" | "previous";
  commit: string;
  message: string;
  author: string;
  at: string;
}
export interface DemoManagedService {
  id: string;
  name: string;
  type: "웹" | "워커" | "크론";
  environment: string;
  status: "실행 중" | "잠듦" | "정지";
  memoryMb: number;
  cpu: number;
  subdomain: string;
  paused: boolean;
  startCommand: string;
  path: string;
  preDeployCommand: string;
  watchPaths: string;
  alwaysOn: boolean;
  prPreviews: boolean;
  previewEnvironment: string;
  previewBots: boolean;
  databaseId?: string;
  variables: DemoAppVariable[];
  deployments: DemoDeployment[];
  shellOpen: boolean;
  shellLines: string[];
}
export interface DemoManagedApp {
  id: string;
  name: string;
  owner?: AppOwner;
  sourceType: "github" | "container" | "archive";
  repository: string;
  branch: string;
  expiresAt: string;
  variables: DemoAppVariable[];
  environments: DemoEnvironment[];
  services: DemoManagedService[];
}

const demoAppSeed: DemoManagedApp[] = [
  {
    id: "demo-portfolio-web",
    name: "portfolio-web",
    owner: { type: "user", id: "demo-student", name: "김민수" },
    sourceType: "github",
    repository: "gsm-jimin/portfolio-web",
    branch: "main",
    expiresAt: "10월 6일 14:00",
    variables: [],
    environments: [
      { name: "production", branch: "main", autoDeploy: true, waitForCi: true },
      {
        name: "staging",
        branch: "develop",
        autoDeploy: true,
        waitForCi: false,
      },
    ],
    services: [
      {
        id: "demo-web",
        name: "web",
        type: "웹",
        environment: "production",
        status: "실행 중",
        memoryMb: 512,
        cpu: 0.5,
        subdomain: "portfolio-web",
        paused: false,
        startCommand: "npm run start",
        path: "/healthz",
        preDeployCommand: "npm run migrate",
        watchPaths: "src/**, package.json",
        alwaysOn: false,
        prPreviews: true,
        previewEnvironment: "staging",
        previewBots: false,
        variables: [
          { key: "NODE_ENV", value: "production", secret: false },
          {
            key: "SITE_URL",
            value: "https://portfolio-web.{앱 도메인}",
            secret: false,
          },
          { key: "MAIL_API_KEY", value: "sk-demo-mail-key", secret: true },
        ],
        deployments: [
          {
            id: "a1b2c3d",
            status: "running",
            commit: "메인 화면 문구 수정",
            author: "김지민",
            at: "11월 2일 14:20",
            message: "빌드 로그 보기",
          },
          {
            id: "9f8e7d6",
            status: "skipped",
            commit: "로그인 버튼 색 바꾸기",
            author: "윤채원",
            at: "11월 2일 11:05",
            message: "이 커밋 배포",
          },
          {
            id: "7c6b5a4",
            status: "failed",
            commit: "의존성 업데이트",
            author: "김지민",
            at: "11월 1일 22:40",
            message: "빌드 로그 보기",
          },
          {
            id: "3d2e1f0",
            status: "previous",
            commit: "첫 화면 만들기",
            author: "김지민",
            at: "10월 30일 18:02",
            message: "되돌리기",
          },
        ],
        shellOpen: true,
        shellLines: [
          "$ node -v",
          "v20.11.1",
          "$ ls",
          "dist  node_modules  package.json  src",
          "$ echo $NODE_ENV",
          "production",
          "$",
        ],
        databaseId: "welcome-db",
      },
      {
        id: "demo-nightly-report",
        name: "nightly-report",
        type: "크론",
        environment: "production",
        status: "잠듦",
        memoryMb: 256,
        cpu: 0.25,
        subdomain: "nightly-report",
        paused: false,
        startCommand: "npm run report",
        path: "",
        preDeployCommand: "",
        watchPaths: "",
        alwaysOn: false,
        prPreviews: true,
        previewEnvironment: "staging",
        previewBots: false,
        variables: [],
        deployments: [
          {
            id: "c9d8e7f",
            status: "previous",
            commit: "일일 리포트 작업",
            author: "김지민",
            at: "11월 2일 03:00",
            message: "성공",
          },
        ],
        shellOpen: false,
        shellLines: [],
        databaseId: "welcome-db",
      },
    ],
  },
];

const demoTeamAppSeed: DemoManagedApp = {
  ...structuredClone(demoAppSeed[0]),
  id: "demo-team-portal",
  name: "connect-portal",
  owner: { type: "team", id: "demo-team", name: "GSM Connect" },
  services: demoAppSeed[0].services.map((service, index) => ({
    ...structuredClone(service),
    id: `demo-team-service-${index + 1}`,
    subdomain: `connect-${service.subdomain}`,
  })),
};

function isDemoManagedApp(value: unknown): value is DemoManagedApp {
  if (!value || typeof value !== "object") return false;
  const app = value as Partial<DemoManagedApp>;
  return (
    typeof app.id === "string" &&
    typeof app.name === "string" &&
    typeof app.repository === "string" &&
    (app.owner === undefined || Boolean(
      app.owner &&
        (app.owner.type === "user" || app.owner.type === "team") &&
        typeof app.owner.id === "string" &&
        typeof app.owner.name === "string",
    )) &&
    Array.isArray(app.environments) &&
    Array.isArray(app.services) &&
    app.services.every((service) =>
      Boolean(
        service &&
          typeof service.id === "string" &&
          typeof service.name === "string" &&
          Array.isArray(service.variables) &&
          Array.isArray(service.deployments) &&
          Array.isArray(service.shellLines),
      ),
    )
  );
}

export function getDemoApps(): DemoManagedApp[] {
  if (!isDemoMode()) return [];
  const storedApps = readDemoState<unknown>(
    "apps.services",
    structuredClone([...demoAppSeed, demoTeamAppSeed]),
  );
  const apps = Array.isArray(storedApps) && storedApps.every(isDemoManagedApp)
    ? storedApps.map((app) => ({
        ...app,
        owner: app.owner ?? { type: "user", id: "demo-student", name: "김민수" },
      }))
    : structuredClone([...demoAppSeed, demoTeamAppSeed]);
  if (!apps.some((app) => app.id === demoTeamAppSeed.id)) apps.push(structuredClone(demoTeamAppSeed));
  return apps;
}

export function getDemoAppSummaries(owner?: AppOwner): AppSummary[] {
  return getDemoApps()
    .filter((app) => !owner || (app.owner?.type === owner.type && app.owner.id === owner.id))
    .map((app) => ({
      grn: `grn:gsmsv:app:${app.owner?.id ?? "demo-student"}:${app.id}`,
      id: app.id,
      name: app.name,
      owner: app.owner ?? { type: "user", id: "demo-student", name: "김민수" },
      status: "active",
      created_by: "demo-student",
      created_at: "2026-10-01T00:00:00.000Z",
      updated_at: "2026-11-13T04:00:00.000Z",
      expires_at: "2026-12-31T14:59:59.000Z",
      permissions: { view: true, update: true, extend: true, delete: true },
    }));
}

export function saveDemoApps(apps: DemoManagedApp[]): boolean {
  return isDemoMode() && writeDemoState("apps.services", apps);
}

export function getDemoApp(id: string): DemoManagedApp | undefined {
  return getDemoApps().find((app) => app.id === id);
}

export function getDemoService(
  appId: string,
  serviceId: string,
): DemoManagedService | undefined {
  return getDemoApp(appId)?.services.find(
    (service) => service.id === serviceId,
  );
}

export function updateDemoService(
  appId: string,
  serviceId: string,
  update: Partial<DemoManagedService>,
): DemoManagedService | undefined {
  const apps = getDemoApps();
  const app = apps.find((item) => item.id === appId);
  const service = app?.services.find((item) => item.id === serviceId);
  if (!app || !service) return undefined;
  Object.assign(service, update);
  saveDemoApps(apps);
  return service;
}

export function addDemoApp(
  name: string,
  repository = "gsm-jimin/portfolio-web",
  branch = "main",
  serviceName = "web",
  subdomain = "portfolio-web",
  sourceType: DemoManagedApp["sourceType"] = "github",
  owner: AppOwner = { type: "user", id: "demo-student", name: "김민수" },
): string {
  const apps = getDemoApps();
  const suffix = Date.now().toString(36);
  const appId = `demo-${suffix}`;
  const serviceId = `service-${suffix}`;
  const base = demoAppSeed[0].services[0];
  apps.unshift({
    ...demoAppSeed[0],
    id: appId,
    name,
    owner,
    sourceType,
    repository,
    branch,
    environments: [
      { name: "production", branch, autoDeploy: true, waitForCi: true },
    ],
    services: [{ ...base, id: serviceId, name: serviceName, subdomain }],
  });
  saveDemoApps(apps);
  return appId;
}

export function addDemoService(
  appId: string,
  serviceName: string,
  type: DemoManagedService["type"],
  subdomain: string,
): string | null {
  const apps = getDemoApps();
  const app = apps.find((item) => item.id === appId);
  if (!app) return null;
  const id = `service-${Date.now().toString(36)}`;
  const base = demoAppSeed[0].services[0];
  app.services.push({ ...base, id, name: serviceName, type, subdomain });
  saveDemoApps(apps);
  return id;
}

export function isDemoAppId(id: string): boolean {
  return id.startsWith("demo-");
}
