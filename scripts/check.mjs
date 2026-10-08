/** Checks the kit: every kit's contrast pairs, then every manifest hash. Exits non-zero on a failure.
 * Run from anywhere: node scripts/check.mjs. Node.js only. */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
for (const script of ['validate-tokens.mjs', 'verify-manifest.mjs']) {
  execFileSync(process.execPath, [path.join(here, script)], { stdio: 'inherit' });
}
execFileSync(process.execPath, ['--test', path.join(here, '../tests/manifest.test.mjs'), path.join(here, '../tests/hplx-assets.test.mjs')], {stdio:'inherit'});
