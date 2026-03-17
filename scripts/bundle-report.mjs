#!/usr/bin/env node
// Prints a Markdown table of everything in dist/ (raw and gzip bytes).
// Used by CI for the bundle size report; run `npm run build` first.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const dist = path.resolve(import.meta.dirname, '../dist');

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const rows = walk(dist)
  .map((file) => {
    const body = readFileSync(file);
    return { name: path.relative(dist, file), raw: body.length, gzip: gzipSync(body).length };
  })
  .sort((a, b) => b.raw - a.raw);

const total = rows.reduce((t, r) => ({ raw: t.raw + r.raw, gzip: t.gzip + r.gzip }), { raw: 0, gzip: 0 });
console.log('## Bundle size\n');
console.log('| File | Raw | Gzip |\n| --- | ---: | ---: |');
for (const r of rows.slice(0, 20)) console.log(`| ${r.name} | ${kb(r.raw)} | ${kb(r.gzip)} |`);
console.log(`| **Total (${rows.length} files)** | **${kb(total.raw)}** | **${kb(total.gzip)}** |`);
