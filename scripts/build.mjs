/** Rebuild generated deliverables, then verify distribution inputs and refresh
 * output hashes. Supplied originals and manual trace evidence are never rebuilt.
 * Run from anywhere: node scripts/build.mjs [--check]. Node.js only. */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

export function assertCleanTree(directory) {
  const changes = execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=all'], { cwd: directory, encoding: 'utf8' }).trim();
  if (changes) throw new Error(`The rebuild must leave a clean worktree, including staged and new files:\n${changes}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--check')) throw new Error('Usage: build.mjs [--check]');
  const run = (script, ...args) => execFileSync(process.execPath, [path.join(here, script), ...args], { stdio: 'inherit', cwd: root });
  for (const script of ['generate-tokens.mjs', 'build-glimmer-assets.mjs', 'build-tectra-assets.mjs', 'build-hplx-assets.mjs', 'build-hplx-lockup.mjs', 'build-cosmik-lockup.mjs', 'build-icons.mjs', 'build-web-fonts.mjs']) run(script);
  run('verify-manifest.mjs', '--update-generated');
  if (args.includes('--check')) assertCleanTree(root);
}
