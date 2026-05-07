/**
 * Database abstraction layer.
 * Delegates to the active provider based on DB_PROVIDER environment variable.
 */

let db;

if (process.env.DB_PROVIDER === 'supabase') {
  db = await import('./db-supabase.js');
} else {
  db = await import('./db-memory.js');
}

export const {
  getVersions,
  getVersion,
  createVersion,
  updateVersion,
  deleteVersion,
  getWorkshops,
  getWorkshop,
  getWorkshopByCode,
  getNextWorkshopInChain,
  createWorkshop,
  updateWorkshop,
  deleteWorkshop,
  getSessions,
  getSession,
  getSessionsByChainUserId,
  getLastSessionVersion,
  createSession,
  updateSession,
  deleteSession,
  incrementInteractionCount,
  getMessages,
  createMessage,
  getDashboardMetrics,
} = db;
