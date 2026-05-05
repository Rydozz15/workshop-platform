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
  createWorkshop,
  updateWorkshop,
  deleteWorkshop,
  getSessions,
  getSession,
  createSession,
  updateSession,
  incrementInteractionCount,
  getMessages,
  createMessage,
  getDashboardMetrics,
} = db;
