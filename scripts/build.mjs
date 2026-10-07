/** Rebuilds every generated file, then refreshes their hashes in asset-manifest.json.
 * Run from anywhere: node scripts/build.mjs. Node.js only. */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const run = (script, ...args) => execFileSync(process.execPath, [path.join(here, script), ...args], { stdio: 'inherit' });
run('generate-tokens.mjs');
run('build-icons.mjs');
run('build-web-fonts.mjs');
run('verify-manifest.mjs', '--update-generated');
