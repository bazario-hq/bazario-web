#!/usr/bin/env node
// Starts the real bazario-api for the Playwright suite:
//   fresh database -> migrations -> fixture data -> local S3 server -> API -> product images.
// Used as a Playwright webServer; also handy on its own: `node e2e/stack/start-api.mjs`.
//
// Needs Postgres from `npm run e2e:db` and a checkout of bazario-api with dependencies
// installed (API_DIR, default ../bazario-api).
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import pg from 'pg';
import { seed } from './seed.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const apiDir = path.resolve(root, process.env.API_DIR ?? '../bazario-api');
const adminUrl = process.env.E2E_DATABASE_ADMIN_URL ?? 'postgres://bazario:bazario@localhost:55433/postgres';
const dbName = process.env.E2E_DATABASE_NAME ?? 'bazario_e2e';
const apiPort = Number(process.env.E2E_API_PORT ?? 3999);
const s3Port = Number(process.env.E2E_S3_PORT ?? 4569);
const webUrl = process.env.E2E_WEB_URL ?? 'http://localhost:4173';
const fx = JSON.parse(readFileSync(path.join(root, 'e2e/support/fixtures.json'), 'utf8'));

const apiRequire = createRequire(path.join(apiDir, 'package.json'));
const tsx = path.join(apiDir, 'node_modules/.bin/tsx');

function databaseUrl(name) {
  const url = new URL(adminUrl);
  url.pathname = `/${name}`;
  return url.toString();
}

async function resetDatabase() {
  const client = new pg.Client({ connectionString: adminUrl });
  try {
    await client.connect();
  } catch (err) {
    throw new Error(`Cannot reach Postgres at ${adminUrl}. Start it with \`npm run e2e:db\`.\n${err.message}`);
  }
  await client.query(`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`);
  await client.query(`CREATE DATABASE ${dbName}`);
  await client.end();
}

const env = {
  ...process.env,
  NODE_ENV: 'development',
  LOG_LEVEL: process.env.E2E_API_LOG_LEVEL ?? 'error',
  PORT: String(apiPort),
  DATABASE_URL: databaseUrl(dbName),
  DATABASE_POOL_MAX: '10',
  S3_ENDPOINT: `http://127.0.0.1:${s3Port}`,
  S3_BUCKET: 'bazario-images',
  S3_ACCESS_KEY: 'S3RVER',
  S3_SECRET_KEY: 'S3RVER',
  S3_FORCE_PATH_STYLE: 'true',
  JWT_ACCESS_SECRET: 'e2e-access-secret',
  JWT_REFRESH_SECRET: 'e2e-refresh-secret',
  BCRYPT_ROUNDS: '4',
  PAYMENT_LATENCY_MS: '50',
  PUBLIC_API_URL: `http://localhost:${apiPort}`,
  WEB_URL: webUrl,
  CORS_ORIGINS: `${webUrl},http://127.0.0.1:4173,http://localhost:5173`,
  SMTP_HOST: '',
  JOBS_ENABLED: 'false',
};

async function waitForHealth() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://localhost:${apiPort}/health`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('bazario-api did not become healthy within 60s');
}

async function login(email) {
  const res = await fetch(`http://localhost:${apiPort}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: fx.password }),
  });
  if (!res.ok) throw new Error(`login failed for ${email}: ${res.status}`);
  return (await res.json()).accessToken;
}

/** Uploads generated product photos through the API so variants and /images URLs are real. */
async function uploadImages(productIds) {
  const sharp = apiRequire('sharp');
  const owners = [fx.seller.email, fx.seller2.email, fx.seller2.email];
  const colours = [
    { r: 40, g: 70, b: 140 },
    { r: 170, g: 90, b: 50 },
    { r: 150, g: 110, b: 60 },
  ];
  for (const [i, productId] of productIds.entries()) {
    const token = await login(owners[i]);
    for (let n = 0; n < (i === 0 ? 3 : 1); n++) {
      const c = colours[(i + n) % colours.length];
      const jpeg = await sharp({ create: { width: 1600, height: 1200, channels: 3, background: c } })
        .composite([{ input: Buffer.from(`<svg width="1600" height="1200"><circle cx="${600 + n * 200}" cy="600" r="380" fill="rgba(255,255,255,0.35)"/></svg>`) }])
        .jpeg({ quality: 80 })
        .toBuffer();
      const form = new FormData();
      form.append('image', new Blob([jpeg], { type: 'image/jpeg' }), `photo-${n}.jpg`);
      form.append('altText', `Photo ${n + 1}`);
      const res = await fetch(`http://localhost:${apiPort}/api/seller/products/${productId}/images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) throw new Error(`image upload failed for product ${productId}: ${res.status} ${await res.text()}`);
    }
  }
}

async function main() {
  await resetDatabase();

  const migrate = spawnSync(tsx, ['src/migrate.ts'], { cwd: apiDir, env, stdio: 'inherit' });
  if (migrate.status !== 0) throw new Error('migrations failed');

  const seeded = await seed(env.DATABASE_URL);

  const S3rver = apiRequire('s3rver');
  const s3Dir = mkdtempSync(path.join(os.tmpdir(), 'bazario-e2e-s3-'));
  const s3 = new S3rver({
    port: s3Port,
    address: '127.0.0.1',
    silent: true,
    directory: s3Dir,
    configureBuckets: [{ name: env.S3_BUCKET, configs: [] }],
  });
  await s3.run();

  const api = spawn(tsx, ['src/server.ts'], { cwd: apiDir, env, stdio: 'inherit' });

  let stopping = false;
  const stop = async (code = 0) => {
    if (stopping) return;
    stopping = true;
    api.kill('SIGTERM');
    await s3.close().catch(() => {});
    rmSync(s3Dir, { recursive: true, force: true });
    process.exit(code);
  };
  api.on('exit', (code) => {
    if (!stopping) {
      console.error(`bazario-api exited with code ${code}`);
      stop(1);
    }
  });
  process.on('SIGTERM', () => stop(0));
  process.on('SIGINT', () => stop(0));

  await waitForHealth();
  await uploadImages(seeded.imageProducts);
  // Ready: Playwright polls this until it answers.
  const marker = await import('node:http');
  marker
    .createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('ready');
    })
    .listen(Number(process.env.E2E_READY_PORT ?? 3998));
  console.log(`[e2e] bazario-api ready on http://localhost:${apiPort} (db ${dbName})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
