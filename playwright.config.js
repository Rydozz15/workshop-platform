// UI tests for the critical journeys. Run: npm run test:ui  (uses the installed Google Chrome).
const { defineConfig } = require('@playwright/test');

const PORT = 3130;
module.exports = defineConfig({
  testDir: './e2e-ui',
  timeout: 60_000,
  workers: 1, // one shared in-memory database file
  reporter: [['list']],
  use: { baseURL: `http://localhost:${PORT}`, channel: 'chrome', trace: 'retain-on-failure' },
  webServer: {
    command: `rm -f scratch/ui-e2e.json && npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DB_PROVIDER: 'memory',
      DB_MEMORY_PATH: 'scratch/ui-e2e.json',
      ADMIN_PASSWORD: 'ui-test-pass',
      // Force the simulated assistant so tests never call a real AI provider.
      GROQ_API_KEY: 'mock',
      OPENROUTER_API_KEY: 'mock',
      OPENAI_API_KEY: 'mock',
      ANTHROPIC_API_KEY: 'mock',
    },
  },
});
