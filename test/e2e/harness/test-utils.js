/**
 * Assertion and test reporting utilities for PromptSketch E2E tests.
 */

export const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

export class AssertionError extends Error {
  constructor(message, actual, expected) {
    super(message);
    this.name = 'AssertionError';
    this.actual = actual;
    this.expected = expected;
  }
}

export function assert(condition, message = 'Assertion failed') {
  if (!condition) {
    throw new AssertionError(message, false, true);
  }
}

export function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    const msg = message ? `${message} — ` : '';
    throw new AssertionError(
      `${msg}Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`,
      actual,
      expected
    );
  }
}

export function assertNotEqual(actual, expected, message = '') {
  if (actual === expected) {
    const msg = message ? `${message} — ` : '';
    throw new AssertionError(
      `${msg}Expected value NOT to equal ${JSON.stringify(expected)}`,
      actual,
      expected
    );
  }
}

export function assertApproxEqual(actual, expected, tolerance = 1e-4, message = '') {
  if (typeof actual !== 'number' || typeof expected !== 'number' || isNaN(actual) || isNaN(expected)) {
    throw new AssertionError(
      `${message} — Numbers required: got actual=${actual}, expected=${expected}`,
      actual,
      expected
    );
  }
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    const msg = message ? `${message} — ` : '';
    throw new AssertionError(
      `${msg}Expected ${actual} to be approximately ${expected} (diff: ${diff} > tol: ${tolerance})`,
      actual,
      expected
    );
  }
}

export function assertDeepEqual(actual, expected, message = '') {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    const msg = message ? `${message} — ` : '';
    throw new AssertionError(
      `${msg}Deep equality mismatch:\nExpected: ${expectedStr}\nActual:   ${actualStr}`,
      actual,
      expected
    );
  }
}

export function assertThrows(fn, expectedErrorSubstring = '', message = '') {
  let threw = false;
  let thrownError = null;
  try {
    fn();
  } catch (err) {
    threw = true;
    thrownError = err;
  }
  if (!threw) {
    throw new AssertionError(
      `${message || 'Expected function to throw, but it did not throw.'}`,
      'No error thrown',
      'Error thrown'
    );
  }
  if (expectedErrorSubstring && !thrownError.message.includes(expectedErrorSubstring)) {
    throw new AssertionError(
      `Error message "${thrownError.message}" does not include expected substring "${expectedErrorSubstring}"`,
      thrownError.message,
      expectedErrorSubstring
    );
  }
}

export async function assertThrowsAsync(fn, expectedErrorSubstring = '', message = '') {
  let threw = false;
  let thrownError = null;
  try {
    await fn();
  } catch (err) {
    threw = true;
    thrownError = err;
  }
  if (!threw) {
    throw new AssertionError(
      `${message || 'Expected async function to throw, but it did not throw.'}`,
      'No error thrown',
      'Error thrown'
    );
  }
  if (expectedErrorSubstring && !thrownError.message.includes(expectedErrorSubstring)) {
    throw new AssertionError(
      `Error message "${thrownError.message}" does not include expected substring "${expectedErrorSubstring}"`,
      thrownError.message,
      expectedErrorSubstring
    );
  }
}

/**
 * Test Suite Runner Registry
 */
export class TestSuite {
  constructor(name, tier = 1) {
    this.name = name;
    this.tier = tier;
    this.tests = [];
    this.results = [];
  }

  test(description, fn) {
    this.tests.push({ description, fn });
  }

  async run() {
    console.log(`\n${colors.bold}${colors.cyan}▶ Suite: ${this.name} (Tier ${this.tier})${colors.reset}`);
    let passed = 0;
    let failed = 0;

    for (const t of this.tests) {
      const start = performance.now();
      try {
        await t.fn();
        const duration = (performance.now() - start).toFixed(1);
        console.log(`  ${colors.green}✓${colors.reset} ${t.description} ${colors.dim}(${duration}ms)${colors.reset}`);
        this.results.push({ description: t.description, passed: true, duration });
        passed++;
      } catch (err) {
        const duration = (performance.now() - start).toFixed(1);
        console.error(`  ${colors.red}✗${colors.reset} ${t.description} ${colors.dim}(${duration}ms)${colors.reset}`);
        console.error(`    ${colors.red}${err.message}${colors.reset}`);
        if (err.actual !== undefined && err.expected !== undefined) {
          console.error(`    ${colors.dim}Actual:   ${JSON.stringify(err.actual)}${colors.reset}`);
          console.error(`    ${colors.dim}Expected: ${JSON.stringify(err.expected)}${colors.reset}`);
        }
        if (err.stack) {
          const stackLine = err.stack.split('\n')[1] || '';
          console.error(`    ${colors.dim}${stackLine.trim()}${colors.reset}`);
        }
        this.results.push({ description: t.description, passed: false, duration, error: err });
        failed++;
      }
    }

    return { name: this.name, tier: this.tier, total: this.tests.length, passed, failed };
  }
}
