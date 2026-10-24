import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {sync, verify, distributionSet, lockFileName, repositoryName} from '../scripts/vendor.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'asset-manifest.json'), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const {version} = pkg;
const files = manifest.distribution.files.map(e => e.path);
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const tool = path.join(root, 'scripts/vendor.mjs');
const LOCK = 'brand.lock.json';

/** A scratch directory removed after the test. */
function scratch(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'brand-vendor-test-'));
  t.after(() => fs.rmSync(dir, {recursive: true, force: true}));
  const config = path.join(dir, 'empty.gitconfig');
  fs.writeFileSync(config, '');
  return {dir, config};
}

/** Commits everything in `repo` and tags it; returns a git helper and the commit. */
function commitRelease(repo, config, tag) {
  const git = (...args) => execFileSync('git', args, {cwd: repo, stdio: 'pipe', encoding: 'utf8', env: {...process.env, GIT_CONFIG_GLOBAL: config, GIT_CONFIG_SYSTEM: config}}).trim();
  git('init', '-q');
  git('add', '-A');
  git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'release');
  if (tag) git('tag', tag);
  return {git, commit: git('rev-parse', 'HEAD')};
}
const write = (dir, file, bytes) => {
  fs.mkdirSync(path.dirname(path.join(dir, file)), {recursive: true});
  fs.writeFileSync(path.join(dir, file), bytes);
};

/** A git repository holding this checkout's distribution, committed and tagged as a release. */
function release(t, {tag = `v${version}`} = {}) {
  const {dir, config} = scratch(t);
  const repo = path.join(dir, 'brand');
  for (const file of [...files, 'asset-manifest.json']) write(repo, file, fs.readFileSync(path.join(root, file)));
  return {dir, config, repo, into: path.join(dir, 'product/vendor/brand'), ...commitRelease(repo, config, tag)};
}

/** A fictional product brand that vendors the brand fixture and publishes its own distribution with it. */
function productRelease(t, {tag = 'v1.2.3', mutate} = {}) {
  const brand = release(t);
  const repo = path.join(brand.dir, 'brand-example');
  sync({from: brand.repo, into: path.join(repo, 'vendor/brand')});
  write(repo, 'tokens/example.css', '[data-family="example"] { --c-accent: teal; }\n');
  write(repo, 'LICENSE.md', 'Example terms\n');
  write(repo, 'README.md', '# Example family\n');
  write(repo, 'package.json', JSON.stringify({name: '@example/brand-example', version: '1.2.3', repository: {type: 'git', url: 'git+https://github.com/example/brand-example.git'}}, null, 2));
  const listed = [];
  const walk = sub => {
    for (const entry of fs.readdirSync(path.join(repo, sub), {withFileTypes: true})) {
      const p = sub ? `${sub}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(p);
      else if (p !== 'package.json') listed.push({path: p, sha256: sha256(fs.readFileSync(path.join(repo, p)))});
    }
  };
  walk('');
  const productManifest = {name: 'Example family', distribution: {files: listed}};
  mutate?.(repo, productManifest);
  write(repo, 'asset-manifest.json', JSON.stringify(productManifest, null, 2));
  const consumer = path.join(brand.dir, 'consumer');
  return {brand, repo, consumer, into: path.join(consumer, 'vendor/brand-example'), ...commitRelease(repo, brand.config, tag)};
}
const problems = (dir, options) => verify(dir, options).problems;

test('sync copies the distribution and locks the package, tag, commit and every hash', t => {
  const r = release(t);
  const lock = sync({from: r.repo, into: r.into});
  assert.deepEqual(Object.keys(lock), ['lockfileVersion', 'package', 'repository', 'tag', 'commit', 'files']);
  assert.equal(lock.lockfileVersion, 2);
  assert.equal(lock.package, '@cosmiklabs/brand');
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
  assert.deepEqual(fs.readdirSync(path.dirname(r.into)), ['brand'], 'no staging directory is left behind');
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
  const cli = spawnSync(process.execPath, [tool, 'verify', r.into], {encoding: 'utf8'});
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

test('sync checks every byte against the release manifest before writing anything', t => {
  const {dir, config} = scratch(t);
  const repo = path.join(dir, 'stale');
  for (const file of [...files, 'asset-manifest.json']) write(repo, file, fs.readFileSync(path.join(root, file)));
  fs.appendFileSync(path.join(repo, 'guide/voice.md'), '\nCommitted after the hashes were taken.\n');
  commitRelease(repo, config, `v${version}`);
  const into = path.join(dir, 'product/vendor/brand');
  assert.throws(() => sync({from: repo, into}), /guide\/voice\.md differs from its distribution hash/);
  assert.equal(fs.existsSync(into), false);
});

test('sync never replaces a directory that is not a vendored release of the same repository', t => {
  const r = release(t);
  fs.mkdirSync(r.into, {recursive: true});
  fs.writeFileSync(path.join(r.into, 'product-source.txt'), 'keep me');
  assert.throws(() => sync({from: r.repo, into: r.into}), /not empty and has no \*\.lock\.json/);
  assert.equal(fs.readFileSync(path.join(r.into, 'product-source.txt'), 'utf8'), 'keep me');
  const p = productRelease(t);
  sync({from: p.repo, into: p.into});
  assert.throws(() => sync({from: r.repo, into: p.into}), /holds example\/brand-example, not cosmiklabs\/brand/);
  assert.deepEqual(problems(p.into), []);
});

test('a product brand release carries the brand lock forward: one verify checks both layers', t => {
  const p = productRelease(t);
  const lock = sync({from: p.repo, into: p.into});
  assert.equal(lock.package, '@example/brand-example');
  assert.equal(lock.repository, 'example/brand-example');
  assert.equal(lock.tag, 'v1.2.3');
  assert.ok(fs.existsSync(path.join(p.into, 'brand-example.lock.json')));
  assert.ok(Object.hasOwn(lock.files, `vendor/brand/${LOCK}`), 'the nested lock is part of the synced set');
  const result = verify(p.into, {release: p.repo});
  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.layers.map(l => [l.directory, l.lockFile, l.lock.repository, l.lock.tag]), [
    ['.', 'brand-example.lock.json', 'example/brand-example', 'v1.2.3'],
    ['vendor/brand', `vendor/brand/${LOCK}`, 'cosmiklabs/brand', `v${version}`],
  ]);
  // The tool vendored inside the product brand syncs and verifies the same way.
  const nestedTool = path.join(p.repo, 'vendor/brand/scripts/vendor.mjs');
  const cli = spawnSync(process.execPath, [nestedTool, 'verify', p.into, '--release', p.repo], {encoding: 'utf8'});
  assert.equal(cli.status, 0, cli.stderr);
  assert.match(cli.stdout, /matches example\/brand-example v1\.2\.3 .*proven against the release tag/);
  assert.match(cli.stdout, new RegExp(`vendor/brand matches cosmiklabs/brand v${version.replaceAll('.', '\\.')}`));
});

test('nested tampering is named in both layers, and an edited outer lock cannot hide it', t => {
  const p = productRelease(t);
  sync({from: p.repo, into: p.into});
  const file = 'vendor/brand/kits/cosmik/tokens/cosmik.css';
  fs.appendFileSync(path.join(p.into, file), '\n:root { --c-bg: red; }\n');
  fs.writeFileSync(path.join(p.into, 'vendor/brand/scripts/patch.mjs'), '');
  let found = problems(p.into);
  assert.ok(found.includes(`modified: ${file} differs from example/brand-example v1.2.3`), found.join('\n'));
  assert.ok(found.includes(`modified: ${file} differs from cosmiklabs/brand v${version}`), found.join('\n'));
  assert.ok(found.includes(`extra: vendor/brand/scripts/patch.mjs is not part of cosmiklabs/brand v${version}`), found.join('\n'));
  fs.unlinkSync(path.join(p.into, 'vendor/brand/scripts/patch.mjs'));
  // Bless the change in the outer lock: the nested lock still fails.
  const outerFile = path.join(p.into, 'brand-example.lock.json');
  const outer = JSON.parse(fs.readFileSync(outerFile, 'utf8'));
  outer.files[file] = sha256(fs.readFileSync(path.join(p.into, file)));
  fs.writeFileSync(outerFile, JSON.stringify(outer, null, 2));
  assert.deepEqual(problems(p.into), [`modified: ${file} differs from cosmiklabs/brand v${version}`]);
  // Bless it in the nested lock too: locally consistent, but the outer release proves otherwise.
  const nestedFile = path.join(p.into, 'vendor/brand', LOCK);
  const nested = JSON.parse(fs.readFileSync(nestedFile, 'utf8'));
  nested.files['kits/cosmik/tokens/cosmik.css'] = outer.files[file];
  fs.writeFileSync(nestedFile, JSON.stringify(nested, null, 2));
  outer.files[`vendor/brand/${LOCK}`] = sha256(fs.readFileSync(nestedFile));
  fs.writeFileSync(outerFile, JSON.stringify(outer, null, 2));
  assert.deepEqual(problems(p.into), []);
  found = problems(p.into, {release: p.repo});
  assert.ok(found.includes(`release: brand-example.lock.json hash for ${file} is not the v1.2.3 file`), found.join('\n'));
  assert.ok(found.includes(`release: brand-example.lock.json hash for vendor/brand/${LOCK} is not the v1.2.3 file`), found.join('\n'));
  const cli = spawnSync(process.execPath, [tool, 'verify', p.into], {encoding: 'utf8'});
  assert.equal(cli.status, 0, cli.stderr);
});

test('a product brand release whose nested layer does not verify is never installed', t => {
  const p = productRelease(t, {mutate: (repo, m) => {
    // Edited after vendoring, with the product manifest re-hashed: only the nested lock can tell.
    const file = 'vendor/brand/guide/voice.md';
    fs.appendFileSync(path.join(repo, file), '\nlocal edit\n');
    m.distribution.files.find(e => e.path === file).sha256 = sha256(fs.readFileSync(path.join(repo, file)));
  }});
  assert.throws(() => sync({from: p.repo, into: p.into}), /does not verify after copying:\nmodified: vendor\/brand\/guide\/voice\.md differs from cosmiklabs\/brand/);
  assert.equal(fs.existsSync(p.into), false);
});

test('a lockfileVersion 1 lock from brand 0.8.0 still verifies, with and without --release', t => {
  const {dir, config} = scratch(t);
  const repo = path.join(dir, 'brand-0.8.0');
  const legacy = ['LICENSE.md', 'package.json', 'kits/cosmik/tokens/cosmik.css', 'scripts/family.mjs'];
  for (const file of legacy) write(repo, file, file === 'package.json' ? JSON.stringify({name: '@cosmiklabs/brand', version: '0.8.0'}) : fs.readFileSync(path.join(root, file)));
  write(repo, 'asset-manifest.json', JSON.stringify({version: '0.8.0', vendor: {repository: 'cosmiklabs/brand', files: legacy}}));
  const {commit} = commitRelease(repo, config, 'v0.8.0');
  // As the 0.8.0 tool wrote it: no package, no distribution section in the release.
  const into = path.join(dir, 'product/vendor/brand');
  for (const file of legacy) write(into, file, fs.readFileSync(path.join(repo, file)));
  const lock = {lockfileVersion: 1, repository: 'cosmiklabs/brand', tag: 'v0.8.0', commit, files: Object.fromEntries(legacy.map(f => [f, sha256(fs.readFileSync(path.join(repo, f)))]))};
  write(into, LOCK, JSON.stringify(lock, null, 2) + '\n');
  assert.deepEqual(problems(into), []);
  assert.deepEqual(problems(into, {release: repo}), []);
  fs.appendFileSync(path.join(into, 'scripts/family.mjs'), '\n');
  assert.deepEqual(problems(into), ['modified: scripts/family.mjs differs from cosmiklabs/brand v0.8.0']);
  // The new tool refuses to sync the old shape rather than guess at it, and says which tool to use.
  assert.throws(() => sync({from: repo, into: path.join(dir, 'fresh')}), /predates the distribution contract/);
  // A v1 lock nested inside a product brand's distribution is checked as its own layer.
  const outer = path.join(dir, 'consumer/vendor/brand-example');
  fs.cpSync(into, path.join(outer, 'vendor/brand'), {recursive: true});
  fs.writeFileSync(path.join(outer, 'vendor/brand/scripts/family.mjs'), fs.readFileSync(path.join(repo, 'scripts/family.mjs')));
  const outerFiles = {};
  for (const file of [...legacy, LOCK]) outerFiles[`vendor/brand/${file}`] = sha256(fs.readFileSync(path.join(outer, 'vendor/brand', file)));
  write(outer, 'brand-example.lock.json', JSON.stringify({lockfileVersion: 2, package: '@example/brand-example', repository: 'example/brand-example', tag: 'v1.0.0', commit, files: outerFiles}));
  const result = verify(outer);
  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.layers.map(l => l.lock.lockfileVersion), [2, 1]);
});

test('lock names, repositories and the distribution contract', () => {
  assert.equal(lockFileName('@cosmiklabs/brand'), 'brand.lock.json');
  assert.equal(lockFileName('@cosmiklabs/brand-tectra'), 'brand-tectra.lock.json');
  assert.throws(() => lockFileName(''), /cannot name a lock file/);
  for (const value of ['cosmiklabs/brand', 'github:cosmiklabs/brand', 'https://github.com/cosmiklabs/brand', {url: 'git+https://github.com/cosmiklabs/brand.git'}, 'git@github.com:cosmiklabs/brand.git']) assert.equal(repositoryName(value), 'cosmiklabs/brand', JSON.stringify(value));
  assert.equal(repositoryName('https://example.com/x.git'), undefined);
  const file = {path: 'a.txt', sha256: '0'.repeat(64)};
  assert.throws(() => distributionSet({distribution: {files: [file]}}, {name: 'x', version: '1.0.0'}), /repository is required/);
  assert.throws(() => distributionSet({distribution: {repository: 'a/b', files: [file]}}, {name: 'x', version: '1.0.0', repository: 'c/d'}), /differs from package\.json repository/);
  assert.throws(() => distributionSet({distribution: {files: [file, file]}}, {name: 'x', version: '1.0.0', repository: 'a/b'}), /lists a\.txt twice/);
  assert.throws(() => distributionSet({distribution: {files: [{path: 'x.lock.json', sha256: file.sha256}]}}, {name: 'x', version: '1.0.0', repository: 'a/b'}), /top-level \.lock\.json/);
  assert.throws(() => distributionSet({distribution: {files: [{path: 'a.txt'}]}}, {name: 'x', version: '1.0.0', repository: 'a/b'}), /no valid sha256/);
  assert.throws(() => distributionSet({vendor: {files: ['a.txt']}}, {name: 'x', version: '1.0.0', repository: 'a/b'}), /distribution section is required/);
});

test('the distribution is complete: scripts carry their imports, fonts their notices, every guide page', () => {
  const set = distributionSet(manifest, pkg);
  assert.equal(set.repository, 'cosmiklabs/brand');
  assert.deepEqual(set.files.map(e => e.path), [...new Set(files)].sort());
  for (const {path: file, sha256: hash} of set.files) assert.equal(sha256(fs.readFileSync(path.join(root, file))), hash, file);
  for (const file of files.filter(f => f.endsWith('.mjs'))) {
    for (const [, spec] of fs.readFileSync(path.join(root, file), 'utf8').matchAll(/\bfrom\s+['"](\.[^'"]+)['"]/g)) {
      assert.ok(files.includes(path.posix.join(path.posix.dirname(file), spec)), `${file} imports ${spec}, which is not distributed`);
    }
  }
  for (const required of ['scripts/generate-tokens.mjs', 'scripts/family.mjs', 'scripts/validate-tokens.mjs', 'scripts/vendor.mjs',
    'scripts/font-outlines.mjs', 'scripts/vector-raster.mjs', 'kits/cosmik/components/controls.css', 'LICENSE.md', 'package.json']) assert.ok(files.includes(required), required);
  for (const font of [...manifest.web_fonts, ...manifest.desktop_fonts]) {
    assert.ok(files.includes(font.path), `${font.path} is not distributed`);
    assert.ok(files.includes(font.license_file), `${font.license_file} is not distributed`);
  }
  for (const page of fs.readdirSync(path.join(root, 'guide')).filter(f => f.endsWith('.md'))) assert.ok(files.includes(`guide/${page}`), page);
  for (const file of fs.readdirSync(path.join(root, 'kits/cosmik/tokens'))) assert.ok(files.includes(`kits/cosmik/tokens/${file}`), file);
});
