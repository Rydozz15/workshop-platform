/**
 * Environment isolation harness for E2E tests.
 * Enforces DB_PROVIDER=memory and isolated scratch file path.
 * Guaranteed zero touching of Supabase.
 */
import path from 'path';
import fs from 'fs';

const scratchDir = path.resolve(process.cwd(), 'scratch');
if (!fs.existsSync(scratchDir)) {
  fs.mkdirSync(scratchDir, { recursive: true });
}

const testDbPath = path.join(scratchDir, 'test-e2e.json');

// Force test environment variables
process.env.NODE_ENV = 'test';
process.env.DB_PROVIDER = 'memory';
process.env.DB_MEMORY_PATH = testDbPath;

export { scratchDir, testDbPath };
