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
export type { DemoDatabaseState } from './model/demoDatabase';
