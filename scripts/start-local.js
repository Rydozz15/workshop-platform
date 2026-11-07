#!/usr/bin/env node
/**
 * One-command local mode for people who don't program (Windows, macOS, Linux).
 *   node scripts/start-local.js [--port 3000] [--no-open] [--rebuild]
 *
 * It installs dependencies if needed, creates .env.local with an admin password, builds the app the
 * first time, starts it and opens the admin in the browser using the machine's network address, so that
 * the QR codes work for phones on the same Wi-Fi. Data stays in data.json (memory mode).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const MIN_NODE = 20;

function parseArgs(argv) {
  const opts = { port: 3000, open: true, rebuild: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--port') opts.port = Number(argv[++i]) || 3000;
    else if (argv[i] === '--no-open') opts.open = false;
    else if (argv[i] === '--rebuild') opts.rebuild = true;
  }
  return opts;
}

function nodeIsSupported(version = process.versions.node) {
  return Number(version.split('.')[0]) >= MIN_NODE;
}

function generatePassword() {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789'; // no look-alike characters
  return Array.from(crypto.randomBytes(10), (b) => alphabet[b % alphabet.length]).join('');
}

function parseEnv(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
  }
  return out;
}

/** First private IPv4 address (the one phones on the same Wi-Fi can reach), or null. */
function lanAddress(interfaces = os.networkInterfaces()) {
  const candidates = [];
  for (const list of Object.values(interfaces)) {
    for (const i of list || []) if (i.family === 'IPv4' && !i.internal) candidates.push(i.address);
  }
  const isPrivate = (a) => /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(a);
  return candidates.find(isPrivate) || candidates[0] || null;
}

/** Creates or completes .env.local without touching existing values. Returns the settings in force. */
function ensureEnv(envPath = path.join(ROOT, '.env.local')) {
  const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const env = parseEnv(existing);
  const additions = [];
  if (!env.DB_PROVIDER) additions.push('DB_PROVIDER=memory');
  if (!env.ADMIN_PASSWORD) {
    env.ADMIN_PASSWORD = generatePassword();
    additions.push(`ADMIN_PASSWORD=${env.ADMIN_PASSWORD}`);
  }
  if (additions.length) {
    const sep = existing && !existing.endsWith('\n') ? '\n' : '';
    fs.writeFileSync(envPath, `${existing}${sep}${additions.join('\n')}\n`);
  }
  return { ...env, DB_PROVIDER: env.DB_PROVIDER || 'memory', created: additions.length > 0 };
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', ...opts });
  return r.status === 0;
}

/** Installs with pnpm (the project's package manager); falls back to corepack's pnpm, then to npm. */
function installDependencies() {
  const hasLock = fs.existsSync(path.join(ROOT, 'pnpm-lock.yaml'));
  const attempts = [
    ['pnpm', ['install', ...(hasLock ? ['--frozen-lockfile'] : [])]],
    ['corepack', ['pnpm', 'install', ...(hasLock ? ['--frozen-lockfile'] : [])]],
    ['npm', ['install', '--no-audit', '--no-fund']],
  ];
  for (const [cmd, args] of attempts) {
    const probe = spawnSync(cmd, ['--version'], { shell: process.platform === 'win32', stdio: 'ignore' });
    if (probe.status !== 0) continue;
    if (run(cmd, args, { shell: process.platform === 'win32' })) return true;
  }
  return false;
}

function openBrowser(url) {
  const [cmd, args] =
    process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
  try {
    spawn(cmd, args, { stdio: 'ignore', detached: true }).on('error', () => {}).unref();
  } catch {
    /* the URL is printed anyway */
  }
}

async function waitForServer(port, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/auth`);
      if (res.ok) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!nodeIsSupported()) {
    console.error(`\nNode.js ${MIN_NODE} or newer is required (you have ${process.versions.node}). Download it at https://nodejs.org (LTS version).`);
    process.exit(1);
  }

  console.log('\n=== PromptSketch: local mode ===\n');
  if (!fs.existsSync(path.join(ROOT, 'node_modules'))) {
    console.log('Installing components (first run only, it can take a few minutes)...');
    if (!installDependencies()) {
      console.error('\nInstallation failed. Check your internet connection and try again.');
      process.exit(1);
    }
  }

  const env = ensureEnv();
  const nextBin = path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next');
  const built = fs.existsSync(path.join(ROOT, '.next', 'BUILD_ID'));
  if (!built || opts.rebuild) {
    console.log('Preparing the app (first run only, ~1-2 minutes)...');
    if (!run(process.execPath, [nextBin, 'build'], { env: { ...process.env, DB_PROVIDER: env.DB_PROVIDER } })) {
      console.error('\nCould not prepare the app.');
      process.exit(1);
    }
  }

  const host = lanAddress();
  const base = host ? `http://${host}:${opts.port}` : `http://localhost:${opts.port}`;
  const server = spawn(process.execPath, [nextBin, 'start', '-p', String(opts.port), '-H', '0.0.0.0'], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production', LOCAL_MODE: '1', DB_PROVIDER: env.DB_PROVIDER, ADMIN_PASSWORD: env.ADMIN_PASSWORD, NEXT_PUBLIC_BASE_URL: base },
  });
  const stop = () => server.kill();
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  server.on('exit', (code) => process.exit(code || 0));

  if (await waitForServer(opts.port)) {
    console.log('\n----------------------------------------------------------');
    console.log(' PromptSketch is running.');
    console.log(`  Admin:           ${base}/admin`);
    console.log(`  Password:        ${env.ADMIN_PASSWORD}${env.created ? '   (saved in the .env.local file)' : ''}`);
    console.log('  Participants:    share the code or QR of your campaign;');
    console.log('                   they must be on the same Wi-Fi as this computer.');
    console.log('  Your data:       saved in the data.json file (keep backups).');
    console.log('  To stop:         press Ctrl + C in this window.');
    console.log('----------------------------------------------------------\n');
    if (opts.open) openBrowser(`${base}/admin`);
  } else {
    console.error('\nThe app did not respond in time. Check the messages above.');
  }
}

module.exports = { parseArgs, nodeIsSupported, generatePassword, parseEnv, lanAddress, ensureEnv };
if (require.main === module) main();
