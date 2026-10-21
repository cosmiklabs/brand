/** Checks the kit: every kit's contrast pairs, every manifest hash, then every test in tests/.
 * Exits non-zero on a failure. Run from anywhere: node scripts/check.mjs. Node.js only. */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
for (const script of ['validate-tokens.mjs', 'verify-manifest.mjs']) {
  execFileSync(process.execPath, [path.join(here, script)], { stdio: 'inherit' });
}
// Discovered, so a new test can never be skipped by forgetting to list it.
const tests = path.join(here, '..', 'tests');
const files = fs.readdirSync(tests).filter((f) => f.endsWith('.test.mjs')).sort().map((f) => path.join(tests, f));
execFileSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
