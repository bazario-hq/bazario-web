#!/usr/bin/env node
// Copies the API contract into this repo and records where it came from.
//
//   npm run api:sync                       # from ../bazario-api (or API_DIR)
//   npm run api:sync -- --ref <sha|tag>    # from GitHub at a pinned ref
//
// Then run `npm run api:generate` to rebuild src/api/schema.d.ts.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const refIdx = args.indexOf('--ref');
const ref = refIdx >= 0 ? args[refIdx + 1] : null;

let body;
let source;
if (ref) {
  const url = `https://raw.githubusercontent.com/bazario-hq/bazario-api/${ref}/openapi.json`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Could not download ${url}: ${res.status}`);
    process.exit(1);
  }
  body = await res.text();
  source = { repo: 'bazario-hq/bazario-api', ref };
} else {
  const apiDir = path.resolve(root, process.env.API_DIR ?? '../bazario-api');
  body = readFileSync(path.join(apiDir, 'openapi.json'), 'utf8');
  let commit = null;
  try {
    commit = execFileSync('git', ['-C', apiDir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    // not a git checkout
  }
  source = { repo: 'bazario-hq/bazario-api', ref: commit };
}

const spec = JSON.parse(body);
const out = JSON.stringify(spec, null, 2) + '\n';
writeFileSync(path.join(root, 'openapi/openapi.json'), out);
writeFileSync(
  path.join(root, 'openapi/source.json'),
  JSON.stringify(
    {
      ...source,
      apiVersion: spec.info?.version ?? null,
      sha256: createHash('sha256').update(out).digest('hex'),
      syncedAt: new Date().toISOString().slice(0, 10),
    },
    null,
    2,
  ) + '\n',
);
console.log(`openapi/openapi.json updated from ${source.repo}@${source.ref ?? 'working tree'}`);
