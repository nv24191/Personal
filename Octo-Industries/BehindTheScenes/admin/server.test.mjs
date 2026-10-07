import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHmac, randomBytes, pbkdf2Sync } from 'node:crypto';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(project, '../..');

async function freePort() {
  const probe = createServer();
  await new Promise((resolveListen, reject) => {
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', resolveListen);
  });
  const { port } = probe.address();
  await new Promise((resolveClose, reject) => probe.close((error) => error ? reject(error) : resolveClose()));
  return port;
}

async function waitForHealth(baseUrl, process) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (process.exitCode !== null) throw new Error('Admin server exited before becoming healthy.');
    try {
      const response = await fetch(`${baseUrl}/healthz`);
      if (response.ok) return;
    } catch {
      await new Promise((resolveWait) => setTimeout(resolveWait, 50));
    }
  }
  throw new Error('Admin server did not become healthy.');
}

async function waitForJob(baseUrl, headers, id) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const response = await fetch(`${baseUrl}/api/admin/jobs`, { headers });
    assert.equal(response.status, 200);
    const jobs = await response.json();
    const job = jobs.find((entry) => entry.id === id);
    if (job && !['queued', 'running'].includes(job.status)) return job;
    await new Promise((resolveWait) => setTimeout(resolveWait, 50));
  }
  throw new Error(`Job ${id} did not finish.`);
}

async function submitLogin(baseUrl, password) {
  const originHeaders = { 'Content-Type': 'application/json', Origin: baseUrl };
  const challengeResponse = await fetch(`${baseUrl}/api/admin/login/challenge`, {
    method: 'POST',
    headers: originHeaders,
    body: '{}',
  });
  assert.equal(challengeResponse.status, 200);
  const challenge = await challengeResponse.json();
  const verifier = pbkdf2Sync(password, challenge.salt, challenge.iterations, 64, 'sha512');
  const proof = createHmac('sha256', verifier)
    .update(`${challenge.challengeId}\n${challenge.nonce}`)
    .digest('hex');
  return fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: originHeaders,
    body: JSON.stringify({ challengeId: challenge.challengeId, proof }),
  });
}

test('admin service protects and manages the canonical library', async (t) => {
  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const dataDirectory = await mkdtemp(resolve(tmpdir(), 'octo-admin-test-'));
  const password = `Test-${randomBytes(12).toString('hex')}`;
  const salt = randomBytes(16).toString('hex');
  const digest = pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
  const child = spawn(process.execPath, [resolve(project, 'admin/server.mjs')], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: String(port),
      OCTO_DATA_DIR: dataDirectory,
      OCTO_ADMIN_PASSWORD_HASH: `pbkdf2$120000$${salt}$${digest}`,
      GEMINI_API_KEY: '',
    },
    stdio: 'ignore',
  });

  t.after(async () => {
    if (child.exitCode === null) child.kill('SIGTERM');
    await new Promise((resolveExit) => {
      if (child.exitCode !== null) resolveExit();
      else child.once('exit', resolveExit);
    });
    await rm(dataDirectory, { recursive: true, force: true });
  });

  await waitForHealth(baseUrl, child);
  const homepage = await fetch(baseUrl);
  assert.equal(homepage.status, 200);
  const homepageHtml = await homepage.text();
  assert.match(homepageHtml, /Octo Industries/);
  assert.match(homepageHtml, /href="\/admin">Admin sign in<\/a>/);
  assert.match(homepageHtml, /class="footer-admin-link" href="\/admin"/);
  const adminPage = await fetch(`${baseUrl}/admin`);
  assert.equal(adminPage.status, 200);
  const adminHtml = await adminPage.text();
  assert.match(adminPage.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.match(adminHtml, /OCTO AI GAME AGENT/);
  assert.match(adminHtml, /id="chat-form"/);
  const privateServerSource = await fetch(`${baseUrl}/admin/server.mjs`);
  assert.equal(privateServerSource.status, 404);
  const wasmAsset = await fetch(`${baseUrl}/Octo-Industries/Age-of-War/ruffle/72a20ef1c0b8ceb37720.wasm`);
  assert.equal(wasmAsset.headers.get('content-type'), 'application/wasm');
  const hiddenFile = await fetch(`${baseUrl}/.git/config`);
  assert.equal(hiddenFile.status, 404);
  const unauthorized = await fetch(`${baseUrl}/api/admin/dashboard`);
  assert.equal(unauthorized.status, 401);

  const badLogin = await submitLogin(baseUrl, 'incorrect');
  assert.equal(badLogin.status, 401);

  const login = await submitLogin(baseUrl, password);
  assert.equal(login.status, 200);
  const session = await login.json();
  assert.match(login.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
  const cookie = login.headers.get('set-cookie').split(';', 1)[0];
  const headers = { Cookie: cookie };
  const writeHeaders = { ...headers, Origin: baseUrl, 'X-CSRF-Token': session.csrfToken, 'Content-Type': 'application/json' };

  const unauthenticatedChat = await fetch(`${baseUrl}/api/admin/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'What needs attention?' }] }),
  });
  assert.equal(unauthenticatedChat.status, 401);

  const chatNotConfigured = await fetch(`${baseUrl}/api/admin/chat`, {
    method: 'POST',
    headers: writeHeaders,
    body: JSON.stringify({ messages: [{ role: 'user', content: 'What needs attention?' }] }),
  });
  assert.equal(chatNotConfigured.status, 503);
  assert.match((await chatNotConfigured.json()).error, /GEMINI_API_KEY/);

  const forbidden = await fetch(`${baseUrl}/api/admin/build`, {
    method: 'POST',
    headers: { ...headers, Origin: baseUrl, 'Content-Type': 'application/json' },
    body: '{}',
  });
  assert.equal(forbidden.status, 403);

  const dashboard = await fetch(`${baseUrl}/api/admin/dashboard`, { headers });
  assert.equal(dashboard.status, 200);
  const initial = await dashboard.json();
  assert.ok(initial.counts.total > 0);
  const gameId = initial.games[0].id;

  const healthResponse = await fetch(`${baseUrl}/api/admin/games/${gameId}/health`, {
    method: 'POST',
    headers: writeHeaders,
    body: '{}',
  });
  assert.equal(healthResponse.status, 202);
  const health = await waitForJob(baseUrl, headers, (await healthResponse.json()).id);
  assert.equal(health.status, 'completed');
  assert.ok(health.result.checks.some((check) => check.name === 'Launch file exists' && check.passed));

  const updated = await fetch(`${baseUrl}/api/admin/games/${gameId}`, {
    method: 'PATCH',
    headers: writeHeaders,
    body: JSON.stringify({ description: 'Admin-managed test description.' }),
  });
  assert.equal(updated.status, 200);
  const catalogResponse = await fetch(`${baseUrl}/api/catalog`);
  const catalog = await catalogResponse.json();
  assert.equal(catalog.find((game) => game.id === gameId).description, 'Admin-managed test description.');

  const unpublished = await fetch(`${baseUrl}/api/admin/games/${gameId}/publish`, {
    method: 'POST',
    headers: writeHeaders,
    body: JSON.stringify({ published: false }),
  });
  assert.equal(unpublished.status, 200);
  const hiddenCatalog = await (await fetch(`${baseUrl}/api/catalog`)).json();
  assert.equal(hiddenCatalog.some((game) => game.id === gameId), false);

  const blockedAnalysis = await fetch(`${baseUrl}/api/admin/analyze`, {
    method: 'POST',
    headers: writeHeaders,
    body: JSON.stringify({ url: 'http://127.0.0.1/private' }),
  });
  assert.equal(blockedAnalysis.status, 202);
  const analysisJob = await blockedAnalysis.json();
  const failedAnalysis = await waitForJob(baseUrl, headers, analysisJob.id);
  assert.equal(failedAnalysis.status, 'failed');
  assert.match(failedAnalysis.message, /private or reserved/i);

  const mappedLoopback = await fetch(`${baseUrl}/api/admin/analyze`, {
    method: 'POST',
    headers: writeHeaders,
    body: JSON.stringify({ url: 'http://[::ffff:7f00:1]/private' }),
  });
  assert.equal(mappedLoopback.status, 202);
  const mappedJob = await waitForJob(baseUrl, headers, (await mappedLoopback.json()).id);
  assert.equal(mappedJob.status, 'failed');
  assert.match(mappedJob.message, /private or reserved/i);

  const buildResponse = await fetch(`${baseUrl}/api/admin/build`, {
    method: 'POST',
    headers: writeHeaders,
    body: '{}',
  });
  assert.equal(buildResponse.status, 202);
  const build = await buildResponse.json();
  const completedBuild = await waitForJob(baseUrl, headers, build.id);
  assert.equal(completedBuild.status, 'completed');
  assert.equal(completedBuild.result.gameCount, initial.counts.total - 1);

  const standalone = await fetch(`${baseUrl}/masterstandalone.html`);
  assert.equal(standalone.status, 200);
  assert.match(standalone.headers.get('content-security-policy'), /sha256-/);
  assert.match(await standalone.text(), /window\.OCTO_GAMES/);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const rejected = await submitLogin(baseUrl, 'incorrect-again');
    assert.equal(rejected.status, 401);
  }
  const rateLimited = await submitLogin(baseUrl, 'incorrect-again');
  assert.equal(rateLimited.status, 429);

  const logout = await fetch(`${baseUrl}/api/admin/logout`, {
    method: 'POST',
    headers: writeHeaders,
    body: '{}',
  });
  assert.equal(logout.status, 200);
  const afterLogout = await fetch(`${baseUrl}/api/admin/dashboard`, { headers });
  assert.equal(afterLogout.status, 401);
});
