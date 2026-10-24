import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { verifyManifest } from '../scripts/verify-manifest.mjs';

const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cosmik-manifest-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const write = (relative, bytes) => {
    fs.mkdirSync(path.dirname(path.join(directory, relative)), { recursive: true });
    fs.writeFileSync(path.join(directory, relative), bytes);
  };
  const asset = (p, bytes, metadata = {}) => { write(p, bytes); return { path: p, sha256: hash(bytes), ...metadata }; };
  const manifest = {
    license: 'LICENSE.md',
    entry_points: { token: 'kits/test/tokens/test.css' },
    assets: [
      asset('LICENSE.md', 'Original repository licence'),
      asset('kits/test/assets/original.png', 'approved bytes', { role: { kind: 'approved-original' }, source_bytes_unchanged: true }),
      asset('kits/test/assets/mark.svg', '<svg viewBox="0 0 64 64"></svg>', { viewBox: [0, 0, 64, 64], visible_bounds_xywh: [8, 8, 48, 48] }),
      asset('kits/test/tokens/test.css', ':root {}', { generated_by: 'scripts/generate.mjs' }),
    ],
    desktop_fonts: [asset('fonts/desktop/Test.ttf', 'upstream font', { license_file: 'fonts/licenses/Test-OFL.txt' })],
    font_licenses: [asset('fonts/licenses/Test-OFL.txt', 'Original font licence')],
  };
  write('scripts/generate.mjs', '');
  const save = () => write('asset-manifest.json', JSON.stringify(manifest));
  const check = updateGenerated => { save(); return verifyManifest(directory, { updateGenerated }); };
  return { directory, manifest, write, save, check };
}

const hasProblem = (result, pattern) => assert.ok(result.problems.some(problem => pattern.test(problem)), JSON.stringify(result));

test('valid release archive verifies without Git; generated hashes update only when requested', t => {
  const f = fixture(t);
  assert.deepEqual(f.check().problems, []);
  f.write('kits/test/tokens/test.css', ':root { color: red; }');
  hasProblem(f.check(), /hash mismatch/);
  assert.deepEqual(f.check(true).problems, []);
  const saved = JSON.parse(fs.readFileSync(path.join(f.directory, 'asset-manifest.json')));
  assert.equal(saved.assets.at(-1).sha256, hash(':root { color: red; }'));
});

test('missing hashes, duplicate entries and unlisted exports cannot evade the inventory', t => {
  const f = fixture(t);
  delete f.manifest.assets[1].sha256;
  f.manifest.assets.push({ ...f.manifest.assets[2] });
  f.write('kits/test/assets/new.svg', '<svg/>');
  f.write('fonts/web/unlisted.woff2', 'font');
  const result = f.check(true);
  hasProblem(result, /invalid or missing SHA-256/);
  hasProblem(result, /duplicate file entry/);
  hasProblem(result, /distribution file not listed.*new.svg/);
  hasProblem(result, /distribution file not listed.*unlisted.woff2/);
});

test('upstream fonts, licence notices and approved originals cannot be silently rehashed', t => {
  const f = fixture(t);
  for (const entry of [f.manifest.assets[0], f.manifest.assets[1], f.manifest.desktop_fonts[0], f.manifest.font_licenses[0]]) {
    entry.editable = true;
    f.write(entry.path, 'altered');
  }
  f.save();
  const before = fs.readFileSync(path.join(f.directory, 'asset-manifest.json'));
  const result = verifyManifest(f.directory, { updateGenerated: true });
  for (const pattern of [/immutable input.*LICENSE.md/, /immutable input.*original.png/, /immutable input.*Test.ttf/, /immutable input.*Test-OFL.txt/]) hasProblem(result, pattern);
  assert.deepEqual(fs.readFileSync(path.join(f.directory, 'asset-manifest.json')), before);
});

test('a failed build cannot partially refresh any hashes', t => {
  const f = fixture(t);
  f.write('kits/test/tokens/test.css', 'changed generated output');
  fs.unlinkSync(path.join(f.directory, 'fonts/licenses/Test-OFL.txt'));
  f.save();
  const before = fs.readFileSync(path.join(f.directory, 'asset-manifest.json'));
  hasProblem(verifyManifest(f.directory, { updateGenerated: true }), /missing file.*Test-OFL.txt/);
  assert.deepEqual(fs.readFileSync(path.join(f.directory, 'asset-manifest.json')), before);
});

test('font licences must be explicit hashed notices; deleting the notice entry fails', t => {
  const f = fixture(t);
  f.manifest.font_licenses = [];
  hasProblem(f.check(), /font notice not listed with a hash/);
  delete f.manifest.desktop_fonts[0].license_file;
  hasProblem(f.check(), /font has no license_file/);
});

test('metadata is checked against assets and generator references must exist', t => {
  const f = fixture(t);
  f.manifest.assets[2].viewBox = [0, 0, 32, 32];
  f.manifest.assets[2].visible_bounds_xywh = [0, 0, -1, 32];
  f.manifest.assets[3].generated_by = 'scripts/missing.mjs';
  const result = f.check();
  hasProblem(result, /SVG viewBox differs/);
  hasProblem(result, /invalid or missing visible_bounds_xywh/);
  hasProblem(result, /missing generator/);
});

test('manifest paths are portable and cannot escape the release directory', t => {
  const f = fixture(t);
  for (const p of ['../outside', '/absolute', 'C:/drive', 'kits\\test.svg', 'kits/../outside']) f.manifest.assets.push({ path: p, sha256: '0'.repeat(64) });
  const result = f.check();
  assert.equal(result.problems.filter(problem => problem.startsWith('invalid repository-relative path:')).length, 5);
  f.manifest.entry_points = { broken: null };
  hasProblem(f.check(), /entry points must contain paths/);
});

test('symlinked assets cannot read outside the release directory', { skip: process.platform === 'win32' ? 'Windows file symlinks require elevated privileges' : false }, t => {
  const f = fixture(t);
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'cosmik-outside-'));
  t.after(() => fs.rmSync(outside, { recursive: true, force: true }));
  fs.writeFileSync(path.join(outside, 'source'), 'outside');
  fs.symlinkSync(path.join(outside, 'source'), path.join(f.directory, 'escape'));
  f.manifest.assets.push({ path: 'escape', sha256: hash('outside') });
  hasProblem(f.check(), /file escapes repository: escape/);
});
