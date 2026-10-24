import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {sync, verify, vendorSet, LOCK} from '../scripts/vendor.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'asset-manifest.json'), 'utf8'));
const {version} = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const files = manifest.vendor.files;
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

/** A git repository holding this checkout's vendorable files, committed and tagged as a release. */
function release(t, {tag = `v${version}`} = {}) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'brand-vendor-test-'));
  t.after(() => fs.rmSync(temporary, {recursive: true, force: true}));
  const repo = path.join(temporary, 'brand');
  for (const file of [...files, 'asset-manifest.json']) {
    fs.mkdirSync(path.dirname(path.join(repo, file)), {recursive: true});
    fs.copyFileSync(path.join(root, file), path.join(repo, file));
  }
  const config = path.join(temporary, 'empty.gitconfig');
  fs.writeFileSync(config, '');
  const git = (...args) => execFileSync('git', args, {cwd: repo, stdio: 'pipe', encoding: 'utf8', env: {...process.env, GIT_CONFIG_GLOBAL: config, GIT_CONFIG_SYSTEM: config}}).trim();
  git('init', '-q');
  git('add', '-A');
  git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'release');
  if (tag) git('tag', tag);
  return {repo, into: path.join(temporary, 'product/vendor/brand'), git, commit: git('rev-parse', 'HEAD')};
}
const problems = (dir, options) => verify(dir, options).problems;

test('sync copies the reviewable set and locks the tag, commit and every hash', t => {
  const r = release(t);
  const lock = sync({from: r.repo, into: r.into});
  assert.deepEqual(Object.keys(lock), ['lockfileVersion', 'repository', 'tag', 'commit', 'files']);
  assert.equal(lock.repository, 'cosmiklabs/brand');
  assert.equal(lock.tag, `v${version}`);
  assert.equal(lock.commit, r.commit);
  assert.deepEqual(Object.keys(lock.files), [...files].sort());
  for (const file of files) {
    const bytes = fs.readFileSync(path.join(r.into, file));
    assert.deepEqual(bytes, fs.readFileSync(path.join(root, file)), file);
    assert.equal(lock.files[file], sha256(bytes), file);
  }
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(r.into, LOCK), 'utf8')), lock);
  assert.deepEqual(problems(r.into), []);
  assert.deepEqual(problems(r.into, {release: r.repo}), []);
  // Re-syncing over an existing vendored release replaces it cleanly.
  fs.writeFileSync(path.join(r.into, 'stale.txt'), 'left behind');
  sync({from: r.repo, into: r.into});
  assert.deepEqual(problems(r.into), []);
});

test('verify detects tampered, extra and missing files', t => {
  const r = release(t);
  sync({from: r.repo, into: r.into});
  fs.appendFileSync(path.join(r.into, 'kits/cosmik/tokens/cosmik.css'), '\n:root { --c-bg: red; }\n');
  fs.writeFileSync(path.join(r.into, 'scripts/local-patch.mjs'), '');
  fs.unlinkSync(path.join(r.into, 'fonts/licenses/Inter-OFL.txt'));
  const found = problems(r.into);
  assert.ok(found.includes(`modified: kits/cosmik/tokens/cosmik.css differs from cosmiklabs/brand v${version}`), found.join('\n'));
  assert.ok(found.includes(`extra: scripts/local-patch.mjs is not part of cosmiklabs/brand v${version}`), found.join('\n'));
  assert.ok(found.includes('missing: fonts/licenses/Inter-OFL.txt'), found.join('\n'));
  const cli = spawnSync(process.execPath, [path.join(root, 'scripts/vendor.mjs'), 'verify', r.into], {encoding: 'utf8'});
  assert.equal(cli.status, 1);
  assert.match(cli.stderr, /verification failed: 3 problem/);
});

test('a lock edited to bless altered files fails against the release', t => {
  const r = release(t);
  sync({from: r.repo, into: r.into});
  const file = 'scripts/family.mjs';
  fs.appendFileSync(path.join(r.into, file), '\n// relaxed contract\n');
  const lockFile = path.join(r.into, LOCK);
  const lock = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
  lock.files[file] = sha256(fs.readFileSync(path.join(r.into, file)));
  fs.writeFileSync(lockFile, JSON.stringify(lock, null, 2));
  assert.deepEqual(problems(r.into), [], 'self-consistent locally');
  assert.ok(problems(r.into, {release: r.repo}).includes(`release: ${LOCK} hash for ${file} is not the v${version} file`));
  lock.commit = '0'.repeat(40);
  fs.writeFileSync(lockFile, JSON.stringify(lock, null, 2));
  assert.match(problems(r.into, {release: r.repo}).join('\n'), new RegExp(`tag v${version.replaceAll('.', '\\.')} is [0-9a-f]{40}, but ${LOCK} records 0{40}`));
});

test('sync refuses a checkout that is not exactly at a release tag', t => {
  const untagged = release(t, {tag: null});
  assert.throws(() => sync({from: untagged.repo, into: untagged.into}), /must be exactly one vX\.Y\.Z release tag \(found none\)/);
  const prerelease = release(t, {tag: `v${version}-proof`});
  assert.throws(() => sync({from: prerelease.repo, into: prerelease.into}), /found none/);
  const mismatched = release(t, {tag: 'v9.9.9'});
  assert.throws(() => sync({from: mismatched.repo, into: mismatched.into}), /tag v9\.9\.9 does not match package\.json version/);
  const moved = release(t);
  fs.writeFileSync(path.join(moved.repo, 'NOTE.md'), 'after the release');
  assert.throws(() => sync({from: moved.repo, into: moved.into}), /uncommitted or untracked changes/);
  moved.git('add', 'NOTE.md');
  moved.git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'later');
  assert.throws(() => sync({from: moved.repo, into: moved.into}), /found none/);
  assert.equal(fs.existsSync(moved.into), false, 'nothing is written on refusal');
});

test('sync never replaces a directory that is not a vendored release', t => {
  const r = release(t);
  fs.mkdirSync(r.into, {recursive: true});
  fs.writeFileSync(path.join(r.into, 'product-source.txt'), 'keep me');
  assert.throws(() => sync({from: r.repo, into: r.into}), /not empty and has no brand\.lock\.json/);
  assert.equal(fs.readFileSync(path.join(r.into, 'product-source.txt'), 'utf8'), 'keep me');
});

test('the vendor set is complete: scripts carry their imports, fonts their notices, every guide page', () => {
  const set = vendorSet(manifest);
  assert.deepEqual(set.files, [...new Set(files)].sort());
  for (const file of files) assert.ok(fs.statSync(path.join(root, file)).isFile(), file);
  for (const file of files.filter(f => f.endsWith('.mjs'))) {
    for (const [, spec] of fs.readFileSync(path.join(root, file), 'utf8').matchAll(/\bfrom\s+['"](\.[^'"]+)['"]/g)) {
      assert.ok(files.includes(path.posix.join(path.posix.dirname(file), spec)), `${file} imports ${spec}, which is not vendored`);
    }
  }
  for (const required of ['scripts/generate-tokens.mjs', 'scripts/family.mjs', 'scripts/validate-tokens.mjs', 'scripts/vendor.mjs',
    'scripts/font-outlines.mjs', 'scripts/vector-raster.mjs', 'kits/cosmik/components/controls.css', 'LICENSE.md', 'package.json']) assert.ok(files.includes(required), required);
  for (const font of [...manifest.web_fonts, ...manifest.desktop_fonts]) {
    assert.ok(files.includes(font.path), `${font.path} is not vendored`);
    assert.ok(files.includes(font.license_file), `${font.license_file} is not vendored`);
  }
  for (const page of fs.readdirSync(path.join(root, 'guide')).filter(f => f.endsWith('.md'))) assert.ok(files.includes(`guide/${page}`), page);
  for (const file of fs.readdirSync(path.join(root, 'kits/cosmik/tokens'))) assert.ok(files.includes(`kits/cosmik/tokens/${file}`), file);
});
