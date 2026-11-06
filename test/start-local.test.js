/** Tests: helpers of the local-mode launcher. Run with: node test/start-local.test.js */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { parseArgs, nodeIsSupported, generatePassword, parseEnv, lanAddress, ensureEnv } = require('../scripts/start-local.js');

let passed = 0;
const check = (name, fn) => { fn(); passed++; console.log(`  [PASS] ${name}`); };

check('arguments and Node version', () => {
  assert.deepEqual(parseArgs(['--port', '4000', '--no-open']), { port: 4000, open: false, rebuild: false });
  assert.equal(parseArgs([]).port, 3000);
  assert.equal(nodeIsSupported('20.11.0'), true);
  assert.equal(nodeIsSupported('18.19.0'), false);
});

check('generated passwords are 10 characters without look-alike letters', () => {
  const p = generatePassword();
  assert.match(p, /^[a-z2-9]{10}$/);
  assert.doesNotMatch(p, /[0o1li]/);
  assert.notEqual(generatePassword(), p);
});

check('.env parsing handles quotes, comments and Windows line endings', () => {
  assert.deepEqual(parseEnv('A=1\r\n# c\nB="two"\n  C = three  \n'), { A: '1', B: 'two', C: 'three' });
});

check('picks a private LAN address, ignores loopback', () => {
  const ifaces = {
    lo: [{ family: 'IPv4', address: '127.0.0.1', internal: true }],
    vpn: [{ family: 'IPv4', address: '100.64.0.5', internal: false }],
    wifi: [{ family: 'IPv4', address: '192.168.1.20', internal: false }, { family: 'IPv6', address: 'fe80::1', internal: false }],
  };
  assert.equal(lanAddress(ifaces), '192.168.1.20');
  assert.equal(lanAddress({ lo: ifaces.lo }), null);
});

check('ensureEnv creates the file with a password and never overwrites existing values', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ps-env-'));
  const file = path.join(dir, '.env.local');
  const first = ensureEnv(file);
  assert.equal(first.created, true);
  assert.equal(first.DB_PROVIDER, 'memory');
  assert.match(fs.readFileSync(file, 'utf8'), /ADMIN_PASSWORD=[a-z2-9]{10}/);
  const second = ensureEnv(file);
  assert.equal(second.created, false);
  assert.equal(second.ADMIN_PASSWORD, first.ADMIN_PASSWORD);
  fs.writeFileSync(file, 'GROQ_API_KEY=abc');
  const third = ensureEnv(file);
  assert.equal(parseEnv(fs.readFileSync(file, 'utf8')).GROQ_API_KEY, 'abc');
  assert.ok(third.ADMIN_PASSWORD);
  fs.rmSync(dir, { recursive: true });
});

console.log(`\nstart-local: ${passed} tests passed`);
