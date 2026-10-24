import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const json = file => JSON.parse(read(file));
const kits = ['cosmik', 'hplx', 'tectra'];
const sourcePath = id => `kits/${id}/tokens/${id === 'cosmik' ? 'source' : 'family'}.json`;
const generatedPath = (id, extension = 'json') => `kits/${id}/tokens/${id}.${extension}`;

function fixture(t, generated = false) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'brand-token-test-'));
  t.after(() => fs.rmSync(dir, {recursive: true, force: true}));
  fs.mkdirSync(path.join(dir, 'scripts'));
  for (const script of ['generate-tokens.mjs', 'validate-tokens.mjs']) {
    fs.copyFileSync(path.join(root, 'scripts', script), path.join(dir, 'scripts', script));
  }
  for (const id of kits) {
    fs.mkdirSync(path.join(dir, `kits/${id}/tokens`), {recursive: true});
    fs.copyFileSync(path.join(root, sourcePath(id)), path.join(dir, sourcePath(id)));
    if (generated) fs.copyFileSync(path.join(root, generatedPath(id)), path.join(dir, generatedPath(id)));
  }
  return {
    dir,
    edit(file, mutate) {
      const target = path.join(dir, file);
      const value = JSON.parse(fs.readFileSync(target, 'utf8'));
      mutate(value);
      fs.writeFileSync(target, JSON.stringify(value));
    },
    run(script = 'generate-tokens.mjs') {
      return spawnSync(process.execPath, [path.join(dir, 'scripts', script)], {encoding: 'utf8'});
    },
  };
}

for (const [label, file, mutate, expected] of [
  ['malformed dimensions', sourcePath('cosmik'), s => { s.space.base = '1.2.3rem'; }, /Unparseable length/],
  ['unitless nonzero CSS lengths', sourcePath('cosmik'), s => { s.layout.gutter = '24'; }, /Unparseable length/],
  ['negative radii', sourcePath('cosmik'), s => { s.radius.md = '-1px'; }, /finite number >= 0/],
  ['fractional duration not representable in Rust u32', sourcePath('cosmik'), s => { s.motion.duration = '140.5ms'; }, /whole milliseconds/],
  ['missing easing coordinate', sourcePath('cosmik'), s => { s.motion.easing = 'cubic-bezier(0, 0, .58)'; }, /four finite control points/],
  ['invalid easing x coordinate', sourcePath('cosmik'), s => { s.motion.easing = 'cubic-bezier(2, 0, .58, 1)'; }, /x coordinates/],
  ['fractional character measure', sourcePath('cosmik'), s => { s.layout.line = '65.5ch'; }, /whole-character/],
  ['invalid font weight', sourcePath('cosmik'), s => { s.type.body.fontWeight = 1001; }, /font weight/],
  ['misspelled typography field', sourcePath('cosmik'), s => { s.type.body.fontSzie = '1rem'; }, /unsupported property fontSzie/],
  ['missing theme roles', sourcePath('cosmik'), s => { delete s.semantic.light.text; }, /incomplete light/],
  ['unresolved aliases', sourcePath('cosmik'), s => { s.semantic.dark.text = 'unknown'; }, /unknown primitive unknown/],
  ['unsupported modes', sourcePath('cosmik'), s => { s.semantic.sepia = s.semantic.light; }, /exactly dark and light/],
  ['Rust constant collisions', sourcePath('cosmik'), s => { s.space.n2 = '1rem'; }, /colliding token name n2/],
  ['stale family baseline metadata', sourcePath('tectra'), s => { s.extends = 'Cosmik baseline 0.4.0'; }, /extends must be/],
  ['missing family modes', sourcePath('tectra'), s => { delete s.semantic.light; }, /exactly the baseline modes/],
  ['misspelled family sections', sourcePath('tectra'), s => { s.typography = {}; }, /unsupported property typography/],
  ['family motion overrides', sourcePath('tectra'), s => { s.motion = {duration: '1ms'}; }, /unsupported property motion/],
  ['family utility type overrides', sourcePath('tectra'), s => { s.type = {body: {fontFamily: 'Other'}}; }, /utility type/],
  ['family primitive collisions', sourcePath('tectra'), s => { s.primitives.paper = '#FFFFFF'; }, /exists in the baseline/],
  ['asymmetric family extensions', sourcePath('tectra'), s => { s.extensions.dark.extra = 'white'; }, /same roles/],
  ['negative shadow blur', sourcePath('hplx'), s => { s.elevation['1'].blur = '-2px'; }, /finite number >= 0/],
]) {
  test(`generator rejects ${label} without publishing partial output`, t => {
    const f = fixture(t);
    f.edit(file, mutate);
    const result = f.run();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, expected);
    for (const id of kits) assert.equal(fs.existsSync(path.join(f.dir, generatedPath(id))), false);
  });
}

test('a late family failure preserves all existing generated files', t => {
  const f = fixture(t, true);
  const before = kits.map(id => fs.readFileSync(path.join(f.dir, generatedPath(id)), 'utf8'));
  f.edit(sourcePath('cosmik'), s => { s.motion.duration = '150ms'; });
  f.edit(sourcePath('tectra'), s => { s.semantic.dark.bg = 'not-a-color'; });
  assert.notEqual(f.run().status, 0);
  assert.deepEqual(kits.map(id => fs.readFileSync(path.join(f.dir, generatedPath(id)), 'utf8')), before);
});

test('valid signed dimensions and bezier y overshoot survive all output formats', t => {
  const f = fixture(t);
  f.edit(sourcePath('cosmik'), s => {
    s.type.body.letterSpacing = '-0.02em';
    s.motion.easing = 'cubic-bezier(0.1, -0.5, 0.9, 1.5)';
  });
  f.edit(sourcePath('hplx'), s => {
    s.elevation['1'].offsetX = '-2px';
    s.elevation['1'].spread = '-1px';
  });
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  const actual = JSON.parse(fs.readFileSync(path.join(f.dir, generatedPath('hplx')), 'utf8'));
  assert.deepEqual(actual.native.motion.easing, [0.1, -0.5, 0.9, 1.5]);
  assert.equal(actual.native.type.body.letterSpacing, -0.02);
  assert.equal(actual.native.elevation.dark['1'].offsetXPx, -2);
  assert.equal(actual.native.elevation.dark['1'].spreadPx, -1);
});

test('CSS exposes effective, normal and system motion durations without changing native values', () => {
  const source = json(sourcePath('cosmik'));
  const css = read(generatedPath('cosmik', 'css'));
  assert.ok(css.includes(`--c-motion-normal-duration: ${source.motion.duration};`));
  assert.match(css, /--c-motion-duration: var\(--c-motion-system-duration\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)\s*\{\s*:root \{ --c-motion-system-duration: var\(--c-motion-reduced-duration\); \}/);
  for (const [preference, token] of [['system', 'system'], ['reduce', 'reduced'], ['full', 'normal']]) {
    assert.ok(css.includes(`[data-motion="${preference}"] { --c-motion-duration: var(--c-motion-${token}-duration); }`));
  }
  for (const id of kits) {
    const tokens = json(generatedPath(id));
    assert.equal(tokens.motion.duration, source.motion.duration);
    assert.equal(tokens.native.motion.durationMs, parseInt(source.motion.duration));
    assert.equal(tokens.native.motion.reducedDurationMs, parseInt(source.motion['reduced-duration']));
  }
});

test('generated JSON, DTCG and Rust retain matching modes, aliases, alpha and dimensions', () => {
  for (const id of kits) {
    const resolved = json(generatedPath(id));
    const dtcg = json(generatedPath(id, 'tokens.json'));
    const rust = read(`kits/${id}/tokens/${id}_tokens.rs`);
    for (const [mode, roles] of Object.entries(resolved.aliases)) {
      for (const [role, primitive] of Object.entries(roles)) {
        assert.equal(resolved.semantic[mode][role], resolved.primitives[primitive]);
        assert.equal(dtcg.color[role].$extensions['com.cosmiklabs.modes'][mode], `{primitive.color.${primitive}}`);
        assert.deepEqual(resolved.native.semantic[mode][role], resolved.native.primitives[primitive]);
      }
    }
    for (const [primitive, color] of Object.entries(resolved.native.primitives)) {
      assert.equal(dtcg.primitive.color[primitive].$value.alpha, color.srgb[3]);
      assert.deepEqual(dtcg.primitive.color[primitive].$value.components, color.srgb.slice(0, 3));
      for (const value of [...color.srgb, ...color.linear]) assert.ok(Number.isFinite(value) && value >= 0 && value <= 1);
    }
    assert.equal(dtcg.motion.duration.$value.value, resolved.native.motion.durationMs);
    assert.ok(rust.includes(`pub const DURATION_MS: u32 = ${resolved.native.motion.durationMs};`));
    for (const [role, type] of Object.entries(resolved.native.type)) {
      assert.equal(dtcg.typography[role].$value.letterSpacing.value, type.letterSpacingPx);
      assert.equal(type.lineHeightPx, Number((type.fontSizePx * type.lineHeight).toFixed(4)));
    }
  }
});

test('contrast check rejects missing generated kits instead of silently skipping them', t => {
  const f = fixture(t, true);
  fs.unlinkSync(path.join(f.dir, generatedPath('tectra')));
  const result = f.run('validate-tokens.mjs');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Missing generated tokens: kits\/tectra/);
});

test('contrast check rejects a missing baseline instead of accepting an empty report', t => {
  const f = fixture(t, true);
  fs.rmSync(path.join(f.dir, 'kits'), {recursive: true});
  fs.mkdirSync(path.join(f.dir, 'kits'));
  const result = f.run('validate-tokens.mjs');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Missing Cosmik baseline/);
});

test('contrast check validates actual neutral status borders', t => {
  const f = fixture(t, true);
  f.edit(generatedPath('tectra'), s => { s.semantic.dark['status-border'] = s.semantic.dark['status-bg']; });
  const result = f.run('validate-tokens.mjs');
  assert.notEqual(result.status, 0);
  const report = JSON.parse(result.stdout);
  assert.ok(report.failed.some(check => check.pair === 'status-border / status-bg' && check.ratio === 1));
});

test('contrast check diagnoses missing or translucent functional roles', t => {
  for (const value of [undefined, '#00000080']) {
    const f = fixture(t, true);
    f.edit(generatedPath('tectra'), s => { s.semantic.dark.text = value; });
    const result = f.run('validate-tokens.mjs');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /tectra dark text: contrast pairs require an opaque/);
  }
});
