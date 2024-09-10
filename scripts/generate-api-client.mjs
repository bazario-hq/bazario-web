#!/usr/bin/env node
// Generates src/api/schema.d.ts from openapi/openapi.json.
//
// The API spec (OpenAPI 3.0) marks nullable references as
//   allOf: [{ $ref }, { nullable: true }]
// which openapi-typescript turns into `Ref & unknown`, losing the null. We rewrite
// those to `{ allOf: [{ $ref }], nullable: true }` first so the types say `Ref | null`.
//
//   node scripts/generate-api-client.mjs           # write the file
//   node scripts/generate-api-client.mjs --check   # fail if the committed file is stale
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import openapiTS, { astToString } from 'openapi-typescript';

const root = path.resolve(import.meta.dirname, '..');
const specPath = path.join(root, 'openapi/openapi.json');
const outPath = path.join(root, 'src/api/schema.d.ts');

function normalizeNullable(node) {
  if (Array.isArray(node)) {
    node.forEach(normalizeNullable);
    return;
  }
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node.allOf)) {
    const markers = node.allOf.filter((s) => s && typeof s === 'object' && Object.keys(s).length === 1 && s.nullable === true);
    if (markers.length) {
      node.allOf = node.allOf.filter((s) => !markers.includes(s));
      node.nullable = true;
    }
  }
  Object.values(node).forEach(normalizeNullable);
}

const spec = JSON.parse(readFileSync(specPath, 'utf8'));
normalizeNullable(spec);
const source = JSON.parse(readFileSync(path.join(root, 'openapi/source.json'), 'utf8'));

const banner = `/**
 * Generated from openapi/openapi.json (${source.repo}@${source.ref ?? 'unknown'}).
 * Do not edit by hand: run \`npm run api:generate\`.
 */

`;
const output = banner + astToString(await openapiTS(spec));

if (process.argv.includes('--check')) {
  if (readFileSync(outPath, 'utf8') !== output) {
    console.error('src/api/schema.d.ts is out of date. Run `npm run api:generate` and commit the result.');
    process.exit(1);
  }
  console.log('API client types match openapi/openapi.json');
} else {
  writeFileSync(outPath, output);
  console.log(`Wrote ${path.relative(root, outPath)}`);
}
