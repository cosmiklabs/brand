/** Manifest check. Run: node verify-manifest.mjs from the bundle root.
 * Verifies the SHA-256 of every file asset-manifest.json lists, that every entry point is listed and
 * hashed, and that vector entries carry visible_bounds_xywh. With --update-generated it first rewrites
 * the hashes of entries marked generated_by or editable (never approved originals). Node.js only. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(root, 'asset-manifest.json');
const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
const sha256 = (p) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, p))).digest('hex');
const entries = [];
const walk = (node) => {
  if (Array.isArray(node)) node.forEach(walk);
  else if (node && typeof node === 'object') { if (typeof node.path === 'string' && 'sha256' in node) entries.push(node); Object.values(node).forEach(walk); }
};
walk(manifest);
if (process.argv.includes('--update-generated')) {
  for (const e of entries) if (e.generated_by || e.editable) e.sha256 = sha256(e.path);
  fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n');
}
const problems = [];
for (const e of entries) {
  if (!fs.existsSync(path.join(root, e.path))) problems.push(`missing file: ${e.path}`);
  else if (sha256(e.path) !== e.sha256) problems.push(`hash mismatch: ${e.path}`);
  if (e.viewBox && !(Array.isArray(e.visible_bounds_xywh) && e.visible_bounds_xywh.length === 4)) problems.push(`no visible_bounds_xywh: ${e.path}`);
  if ('visible_bounds' in e) problems.push(`legacy visible_bounds key: ${e.path}`);
}
const listed = new Set(entries.map((e) => e.path));
const entryPoints = Object.values(manifest.entry_points).flat();
for (const p of entryPoints) if (!listed.has(p)) problems.push(`entry point not listed with a hash: ${p}`);
console.log(JSON.stringify({ files: entries.length, entry_points: entryPoints.length, problems }, null, 2));
process.exit(problems.length ? 1 : 0);
