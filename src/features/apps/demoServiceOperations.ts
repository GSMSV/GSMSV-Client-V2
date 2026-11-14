import { getDemoDatabaseCredentials } from "../../entities/database/demo";
import {
  getDemoApp,
  isDemoAppExpired,
  updateDemoService,
  type DemoDeployment,
  type DemoManagedApp,
  type DemoManagedService,
} from "../../entities/app/demo";

export const shellDuration = 60 * 60_000;

export const restartService = (service: DemoManagedService, reason: DemoManagedService["restartReason"]) => ({
  restartReason: reason,
  restartCount: (service.restartCount ?? 0) + 1,
  status: service.status === "정지" ? service.status : service.type === "크론" ? "잠듦" as const : "실행 중" as const,
  shellOpen: false,
  shellLines: [],
  shellExpiresAt: undefined,
});

export function activateDemoDeployment(appId: string, serviceId: string, deployment: DemoDeployment, rollback = false) {
  const app = getDemoApp(appId);
  const service = app?.services.find(item => item.id === serviceId);
  if (!app || !service || isDemoAppExpired(app)) return undefined;

  const failure = rollback ? undefined : demoDeploymentFailure(service);
  const next: DemoDeployment = {
    ...deployment,
    id: deployment.status === "running" ? crypto.randomUUID() : deployment.id,
    commitId: deployment.commitId ?? deployment.id,
    status: failure ? "failed" : "running",
    failure,
    failureDetail: failure === "pre-deploy" ? service.preDeployCommand : failure === "health" ? service.path : undefined,
    message: "빌드 로그 보기",
  };
  const history = service.deployments.filter(item => item.id !== next.id);
  const deployments = [next, ...history.map((item): DemoDeployment =>
    !failure && item.status === "running" ? { ...item, status: "previous", message: "되돌리기" } : item,
  )].slice(0, 10);
  return updateDemoService(appId, serviceId, failure ? { deployments } : {
    ...restartService(service, undefined),
    status: service.type === "크론" ? "잠듦" : "실행 중",
    restartCount: 0,
    deployments,
  });
}

function demoDeploymentFailure(service: DemoManagedService): DemoDeployment["failure"] {
  if (/\btimeout\b/.test(service.startCommand)) return "timeout";
  if (/\b(?:false|exit 1)\b/.test(service.startCommand)) return "build";
  if (/\b(?:false|exit 1)\b/.test(service.preDeployCommand)) return "pre-deploy";
  if (service.type === "웹" && /^\/(?:fail|timeout)(?:\/|$)/.test(service.path)) return "health";
  return undefined;
}

export function deploymentFailureCopy(item: DemoDeployment) {
  if (item.status !== "failed") return null;
  switch (item.failure) {
    case "timeout": return ["빌드가 25분을 넘어 멈췄습니다", "빌드는 25분까지 기다립니다. 지금 배포는 그대로입니다."];
    case "pre-deploy": return ["배포 전 명령이 실패했습니다", `${item.failureDetail ?? "npm run migrate"}가 실패해서 새 배포로 바꾸지 않았습니다. 지금 배포를 계속 씁니다.`];
    case "health": return ["상태 확인에 응답이 없습니다", `${item.failureDetail ?? "/healthz"}가 300초 동안 200을 돌려주지 않아 새 배포로 바꾸지 않았습니다.`];
    default: return ["빌드에 실패했습니다", `${item.commitId ?? item.id} · npm run build가 실패했습니다. 지금 배포는 그대로입니다.`];
  }
}

export function deploymentLog(app: DemoManagedApp, service: DemoManagedService, item: DemoDeployment) {
  if (item.status === "skipped") return `${item.author} · ${item.id}은 배포 권한이 없는 사람의 push라 배포하지 않았습니다.`;
  const failure = deploymentFailureCopy(item);
  return [
    `14:18:02  저장소 가져오기 ${app.repository}@${item.commitId ?? item.id}`,
    "14:18:09  npm ci",
    "14:19:41  npm run build",
    ...(failure ? [failure[1]] : [
      `14:20:05  상태 확인 GET ${service.path || "/healthz"} 200 OK`,
      "14:20:06  새 배포로 바꿈",
    ]),
  ].join("\n");
}

export function databasePasswordVersion(databaseId?: string) {
  if (!databaseId) return undefined;
  const password = getDemoDatabaseCredentials(databaseId)?.password;
  if (!password) return undefined;
  let hash = 0;
  for (const character of password) hash = Math.imul(31, hash) + character.charCodeAt(0) | 0;
  return hash.toString(16);
}

export function reconcileDemoDatabaseRestarts(app: DemoManagedApp) {
  if (isDemoAppExpired(app)) return false;
  let changed = false;
  for (const service of app.services) {
    if (!service.databaseId || service.status === "정지") continue;
    const version = databasePasswordVersion(service.databaseId);
    if (version === undefined || version === service.databasePasswordVersion) continue;
    if (service.databasePasswordVersion === undefined && getDemoDatabaseCredentials(service.databaseId)?.password.startsWith("demo-local-pass")) continue;
    const saved = updateDemoService(app.id, service.id, {
      ...restartService(service, "database"),
      databasePasswordVersion: version,
    });
    changed ||= Boolean(saved);
  }
  return changed;
}
