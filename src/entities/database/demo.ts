export {
  addDemoPreRestoreBackup,
  createDemoDatabase,
  deleteDemoDatabase,
  getDemoDatabase,
  getDemoDatabaseConnectedFunctions,
  getDemoDatabaseCurrentConnections,
  getDemoDatabaseQuota,
  getDemoDatabaseBackups,
  getDemoDatabaseCredentials,
  getDemoDatabaseSuspensionInfo,
  getDemoDatabaseState,
  listDemoDatabases,
  removeDemoDatabasesByOwner,
  saveDemoDatabaseState,
  setDemoDatabasePassword,
  updateDemoDatabase,
} from './model/demoDatabase';
export { DEMO_TEAM_DEDICATED_DATABASE_LIMIT, getDemoTeamDedicatedDatabaseQuota } from './model/demoDedicatedQuota';
export type { DemoDatabaseState } from './model/demoDatabase';
