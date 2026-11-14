import {
  isDemoMode,
  readDemoState,
  writeDemoState,
} from "../../../shared/demo";
import type { AppOwner, AppSummary } from "./types";
import { getDemoTeam } from "../../team/demo";
import { getDemoDatabaseState, saveDemoDatabaseState } from "../../database/demo";

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
  commitId?: string;
  failure?: "build" | "timeout" | "pre-deploy" | "health";
  failureDetail?: string;
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
  shellExpiresAt?: number;
  restartCount?: number;
  restartReason?: "database" | "variables" | "limit" | "memory";
  databasePasswordVersion?: string;
  configFile?: boolean;
  cronSchedule?: string;
  cronEnabled?: boolean;
  lastCronRunAt?: string;
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
  expiresAtMs?: number;
  deletionAtMs?: number;
  stoppedFixture?: boolean;
  folder?: string;
  readOnly?: boolean;
  variables: DemoAppVariable[];
  environments: DemoEnvironment[];
  services: DemoManagedService[];
}

const minute = 60_000;
const day = 24 * 60 * minute;
const demoNow = Date.now();

const demoAppSeed: DemoManagedApp[] = [
  {
    id: "demo-portfolio-web",
    name: "portfolio-web",
    owner: { type: "user", id: "demo-student", name: "김민수" },
    sourceType: "github",
    repository: "gsm-jimin/portfolio-web",
    branch: "main",
    expiresAt: "10월 6일 14:00",
    expiresAtMs: demoNow + 7 * day,
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
            failure: "build",
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
        configFile: true,
        shellExpiresAt: demoNow + 52 * minute,
      },
      {
        id: "demo-nightly-report",
        name: "nightly-report",
        type: "크론",
        environment: "production",
        status: "잠듦",
        cronSchedule: "0 3 * * *",
        cronEnabled: true,
        lastCronRunAt: "11월 2일 03:00",
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

const failureDeployments: DemoDeployment[] = [
  { id: "8b5f3a2", status: "failed", failure: "timeout", commit: "빌드 설정 수정", author: "김지민", at: "11월 1일 20:25", message: "빌드 로그 보기" },
  { id: "6e4d2c1", status: "failed", failure: "pre-deploy", commit: "마이그레이션 추가", author: "김지민", at: "11월 1일 16:14", message: "빌드 로그 보기" },
  { id: "5c3b2a1", status: "failed", failure: "health", commit: "상태 확인 경로 수정", author: "김지민", at: "11월 1일 10:05", message: "빌드 로그 보기" },
];

const demoTeamAppSeed: DemoManagedApp = {
  ...structuredClone(demoAppSeed[0]),
  id: "demo-team-portal",
  name: "connect-portal",
  owner: { type: "team", id: "demo-team", name: "GSM Connect" },
  repository: "gsm-jimin/connect-portal",
  services: demoAppSeed[0].services.map((service, index) => ({
    ...structuredClone(service),
    id: `demo-team-service-${index + 1}`,
    subdomain: `connect-${service.subdomain}`,
    databaseId: "connect-db",
    ...(index === 0 ? {
      status: "정지" as const,
      restartReason: "limit" as const,
      restartCount: 11,
    } : { shellOpen: true, shellExpiresAt: demoNow - minute }),
  })),
};

const expiredWeb = structuredClone(demoAppSeed[0].services[0]);
const expiredApp: DemoManagedApp = {
  ...structuredClone(demoTeamAppSeed),
  id: "demo-expired-app",
  name: "events-web",
  repository: "gsm-jimin/events-web",
  expiresAtMs: demoNow - minute,
  stoppedFixture: true,
  services: [{
    ...expiredWeb,
    id: "demo-expired-web",
    subdomain: "events-web",
    databaseId: "connect-db",
    shellOpen: false,
    shellLines: [],
  }],
};

const readOnlyApp: DemoManagedApp = {
  ...structuredClone(demoTeamAppSeed),
  id: "demo-read-only-app",
  name: "study-log-team",
  repository: "gsm-jimin/study-log",
  readOnly: true,
  services: [{
    ...expiredWeb,
    id: "demo-read-only-web",
    subdomain: "study-log-team",
    databaseId: "connect-db",
  }],
};

const seedApps = [...demoAppSeed, demoTeamAppSeed, expiredApp, readOnlyApp];

function isDemoManagedApp(value: unknown): value is DemoManagedApp {
  if (!value || typeof value !== "object") return false;
  const app = value as Partial<DemoManagedApp>;
  return (
    typeof app.id === "string" &&
    typeof app.name === "string" &&
    typeof app.repository === "string" &&
    typeof app.expiresAt === "string" &&
    (app.expiresAtMs === undefined || (Number.isFinite(app.expiresAtMs) && Math.abs(app.expiresAtMs) <= 8.64e15)) &&
    (app.owner === undefined || Boolean(
      app.owner &&
        (app.owner.type === "user" || app.owner.type === "team") &&
        typeof app.owner.id === "string" &&
        typeof app.owner.name === "string",
    )) &&
    Array.isArray(app.environments) &&
    app.environments.every(environment => environment && typeof environment.name === "string") &&
    Array.isArray(app.services) &&
    app.services.every((service) =>
      Boolean(
        service &&
          typeof service.id === "string" &&
          typeof service.name === "string" &&
          typeof service.environment === "string" &&
          Number.isFinite(service.memoryMb) &&
          Number.isFinite(service.cpu) &&
          Array.isArray(service.variables) &&
          service.variables.every(item => item && typeof item.key === "string" && typeof item.value === "string") &&
          Array.isArray(service.deployments) &&
          service.deployments.every(item => item && typeof item.id === "string" && typeof item.status === "string") &&
          Array.isArray(service.shellLines) && service.shellLines.every(line => typeof line === "string"),
      ),
    )
  );
}

export function getDemoApps(): DemoManagedApp[] {
  if (!isDemoMode()) return [];
  const teamFixtureRemoved = readDemoState("apps.teamFixtureRemoved", false);
  const storedApps = readDemoState<unknown>("apps.services.v2", undefined);
  const legacyApps = storedApps === undefined ? readDemoState<unknown>("apps.services", undefined) : undefined;
  const saved = storedApps ?? legacyApps;
  const valid = Array.isArray(saved) && saved.every(isDemoManagedApp);
  let apps: DemoManagedApp[] = valid
    ? saved.map((app: DemoManagedApp) => ({ ...app, owner: app.owner ?? demoPersonalAppOwner }))
    : structuredClone(seedApps);
  if (valid && storedApps !== undefined) return apps;
  if (valid) {
    const migrationFixtures = teamFixtureRemoved
      ? [expiredApp, readOnlyApp]
      : [demoTeamAppSeed, expiredApp, readOnlyApp];
    for (const app of migrationFixtures) {
      if (!apps.some((item) => item.id === app.id)) apps.push(structuredClone(app));
    }
  } else if (teamFixtureRemoved) {
    apps = apps.filter((app) => app.id !== demoTeamAppSeed.id);
  }
  return apps.map((app) => ({
    ...seedApps.find((seed) => seed.id === app.id),
    ...app,
    services: app.services.map((service) => {
      const seeded = seedApps.find((seed) => seed.id === app.id)?.services.find((item) => item.id === service.id);
      const existing = service.deployments;
      const deployments = seeded?.type === "웹"
        ? [...existing, ...failureDeployments.filter((item) => !existing.some((previous) => previous.id === item.id))].slice(0, 10)
        : existing;
      return { ...seeded, ...service, deployments };
    }),
  }));
}

export function getDemoAppSummaries(owner?: AppOwner): AppSummary[] {
  return getDemoApps()
    .filter((app) => (!isDemoAppExpired(app) || Date.now() < getDemoAppDeletionTime(app)) &&
      (!owner || (app.owner?.type === owner.type && app.owner.id === owner.id)))
    .map((app) => ({
      grn: `grn:gsmsv:app:${app.owner?.id ?? "demo-student"}:${app.id}`,
      id: app.id,
      name: app.name,
      owner: app.owner ?? { type: "user", id: "demo-student", name: "김민수" },
      status: isDemoAppExpired(app) ? "suspended" : "active",
      created_by: "demo-student",
      created_at: "2026-10-01T00:00:00.000Z",
      updated_at: "2026-11-13T04:00:00.000Z",
      expires_at: new Date(app.expiresAtMs ?? demoNow + 7 * day).toISOString(),
      permissions: { view: true, update: canManageDemoApp(app), extend: true, delete: canManageDemoApp(app) },
    }));
}

export function saveDemoApps(apps: DemoManagedApp[]): boolean {
  return isDemoMode() && writeDemoState("apps.services.v2", apps);
}

export function getDemoApp(id: string): DemoManagedApp | undefined {
  return getDemoApps().find((app) => app.id === id && (!isDemoAppExpired(app) || Date.now() < getDemoAppDeletionTime(app)));
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
  if (!app || !service || !canManageDemoApp(app) || isDemoAppExpired(app)) return undefined;
  Object.assign(service, update);
  return saveDemoApps(apps) ? service : undefined;
}

interface DemoServiceInput {
  name: string;
  type: DemoManagedService["type"];
  subdomain: string;
  memoryMb: number;
  cpu: number;
  watchPaths?: string;
}

interface DemoAppInput {
  name: string;
  repository: string;
  branch: string;
  sourceType: DemoManagedApp["sourceType"];
  folder: string;
  owner: AppOwner;
  service: DemoServiceInput;
}

function newDemoService(input: DemoServiceInput): DemoManagedService {
  return {
    ...input,
    id: `service-${crypto.randomUUID()}`,
    environment: "production",
    status: input.type === "크론" ? "잠듦" : "실행 중",
    paused: false,
    startCommand: "",
    path: input.type === "웹" ? "/healthz" : "",
    preDeployCommand: "",
    watchPaths: input.watchPaths ?? "",
    alwaysOn: false,
    prPreviews: false,
    previewEnvironment: "production",
    previewBots: false,
    variables: [],
    deployments: [],
    shellOpen: false,
    shellLines: [],
    cronSchedule: input.type === "크론" ? "0 3 * * *" : undefined,
    cronEnabled: input.type === "크론",
  };
}

export function addDemoApp(input: DemoAppInput): string | undefined {
  const apps = getDemoApps();
  const { service, ...app } = input;
  const quota = getDemoAppQuota(app.owner);
  if (!canManageDemoApp({ owner: app.owner }) || quota.count >= quota.limit || service.memoryMb > quota.freeMemory ||
    (service.type === "웹" && !isDemoAppSubdomainAvailable(service.subdomain))) return undefined;
  const id = `demo-${crypto.randomUUID()}`;
  const expiresAtMs = Date.now() + 7 * day;
  apps.unshift({
    ...app,
    id,
    expiresAt: formatDemoAppDate(expiresAtMs),
    expiresAtMs,
    variables: [],
    environments: [
      { name: "production", branch: app.branch, autoDeploy: app.sourceType === "github", waitForCi: app.sourceType === "github" },
    ],
    services: [newDemoService(service)],
  });
  return saveDemoApps(apps) ? id : undefined;
}

export function addDemoService(appId: string, input: DemoServiceInput): string | undefined {
  const apps = getDemoApps();
  const app = apps.find((item) => item.id === appId);
  if (!app || !canManageDemoApp(app) || isDemoAppExpired(app)) return undefined;
  const quota = getDemoAppQuota(app.owner ?? demoPersonalAppOwner);
  if (input.memoryMb > quota.freeMemory || (input.type === "웹" && !isDemoAppSubdomainAvailable(input.subdomain))) return undefined;
  const service = newDemoService(input);
  app.services.push(service);
  return saveDemoApps(apps) ? service.id : undefined;
}

export function isDemoAppExpired(app: DemoManagedApp) {
  return app.expiresAtMs !== undefined && Date.now() >= app.expiresAtMs;
}

export function formatDemoAppDate(time: number) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Seoul",
  }).format(time);
}

export function getDemoAppDeletionTime(app: DemoManagedApp) {
  return app.deletionAtMs ?? (app.expiresAtMs ?? demoNow) + 3 * day;
}

export function renewDemoApp(appId: string) {
  const apps = getDemoApps();
  const app = apps.find((item) => item.id === appId);
  if (!app || (isDemoAppExpired(app) && Date.now() >= getDemoAppDeletionTime(app))) return undefined;
  const expiresAtMs = Math.max(Date.now(), app.expiresAtMs ?? demoNow) + 14 * day;
  app.expiresAtMs = expiresAtMs;
  app.expiresAt = app.stoppedFixture ? "10월 20일 14:00" : formatDemoAppDate(expiresAtMs);
  app.stoppedFixture = false;
  if (!saveDemoApps(apps)) return undefined;
  const databaseState = getDemoDatabaseState();
  const databaseIds = new Set(app.services.map((service) => service.databaseId));
  const connected = databaseState.databases.filter((database) => database.owner.id === app.owner?.id &&
    (databaseIds.has(database.id) || databaseIds.has(database.grn)) && Date.parse(database.expires_at) < expiresAtMs);
  if (connected.length) {
    for (const database of connected) database.expires_at = new Date(expiresAtMs).toISOString();
    saveDemoDatabaseState(databaseState);
  }
  return app;
}

export const demoAppMemoryLimit = 2048;

export function getDemoAppQuota(owner: Pick<AppOwner, "type" | "id">) {
  const apps = getDemoApps().filter((app) => app.owner?.id === owner.id && app.owner.type === owner.type &&
    (!isDemoAppExpired(app) || Date.now() < getDemoAppDeletionTime(app)));
  const services = apps.flatMap((app) => app.services);
  const usedMemory = services.reduce((total, service) => total + service.memoryMb, 0);
  return {
    count: apps.length,
    limit: owner.type === "user" ? 2 : 4,
    usedMemory,
    freeMemory: Math.max(0, demoAppMemoryLimit - usedMemory),
    alwaysOn: services.filter((service) => service.alwaysOn).length,
  };
}

export const demoPersonalAppOwner = { type: "user", id: "demo-student", name: "김민수" } as const;

export function isDemoAppSubdomainAvailable(value: string, currentServiceId?: string) {
  const reserved = ["www", "api", "admin", "status", "docs", "reserved", "login"];
  return /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(value) && !value.includes("--") &&
    !reserved.includes(value) && !getDemoApps().some((app) => (!isDemoAppExpired(app) || Date.now() < getDemoAppDeletionTime(app)) && app.services.some((service) =>
      service.id !== currentServiceId && service.type === "웹" && service.subdomain === value,
    ));
}

export function canManageDemoApp(app: Pick<DemoManagedApp, "owner" | "readOnly">) {
  if (app.readOnly) return false;
  if (app.owner?.type !== "team") return true;
  const team = getDemoTeam(app.owner.id);
  return team?.status === "approved" && team.my_role !== "member";
}

export function isDemoAppId(id: string): boolean {
  return id.startsWith("demo-");
}

export function removeDemoAppsByTeam(teamId: string): boolean {
  const apps = getDemoApps();
  return saveDemoApps(apps.filter(app => app.owner?.type !== "team" || app.owner.id !== teamId))
    && (teamId !== demoTeamAppSeed.owner?.id || writeDemoState("apps.teamFixtureRemoved", true));
}
