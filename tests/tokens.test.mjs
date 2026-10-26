import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import * as validate from '../scripts/validate-tokens.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const json = file => JSON.parse(read(file));
const BASELINE = 'kits/cosmik/tokens/source.json';
const baselineOutput = (extension = 'json') => `kits/cosmik/tokens/cosmik.${extension}`;
const FAMILY = 'tokens/family.json';
const familyOutput = (extension = 'json') => `tokens/example.${extension}`;
const EXTENSIONS = ['json', 'css', 'tokens.json', '_tokens.rs'].map(e => e === '_tokens.rs' ? e : `.${e}`);
const outputNames = stem => EXTENSIONS.map(e => `${stem}${e}`);

/** A throwaway brand checkout (scripts, package.json, baseline) and a family repository beside it. */
function fixture(t, {generated = false} = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'brand-token-test-'));
  t.after(() => fs.rmSync(dir, {recursive: true, force: true}));
  const brand = path.join(dir, 'brand'), family = path.join(dir, 'family');
  fs.mkdirSync(path.join(brand, 'scripts'), {recursive: true});
  for (const script of ['generate-tokens.mjs', 'validate-tokens.mjs', 'family.mjs']) {
    fs.copyFileSync(path.join(root, 'scripts', script), path.join(brand, 'scripts', script));
  }
  fs.copyFileSync(path.join(root, 'package.json'), path.join(brand, 'package.json'));
  fs.mkdirSync(path.join(brand, 'kits/cosmik/tokens'), {recursive: true});
  fs.copyFileSync(path.join(root, BASELINE), path.join(brand, BASELINE));
  if (generated) for (const name of outputNames('cosmik')) fs.copyFileSync(path.join(root, 'kits/cosmik/tokens', name), path.join(brand, 'kits/cosmik/tokens', name));
  fs.mkdirSync(path.join(family, 'tokens'), {recursive: true});
  fs.copyFileSync(path.join(root, 'tests/fixtures/example', FAMILY), path.join(family, FAMILY));
  const run = (args, cwd = dir) => spawnSync(process.execPath, args, {encoding: 'utf8', cwd});
  return {
    dir, brand, family,
    edit(file, mutate) {
      const target = path.isAbsolute(file) ? file : path.join(file.startsWith('tokens/') ? family : brand, file);
      const value = JSON.parse(fs.readFileSync(target, 'utf8'));
      mutate(value);
      fs.writeFileSync(target, JSON.stringify(value));
    },
    generate: () => run([path.join(brand, 'scripts/generate-tokens.mjs')]),
    validate: () => run([path.join(brand, 'scripts/validate-tokens.mjs')]),
    familyCli: command => run([path.join(brand, 'scripts/family.mjs'), command, family]),
  };
}

for (const [label, mutate, expected] of [
  ['malformed dimensions', s => { s.space.base = '1.2.3rem'; }, /Unparseable length/],
  ['unitless nonzero CSS lengths', s => { s.layout.gutter = '24'; }, /Unparseable length/],
  ['negative radii', s => { s.radius.md = '-1px'; }, /finite number >= 0/],
  ['fractional duration not representable in Rust u32', s => { s.motion.duration = '140.5ms'; }, /whole milliseconds/],
  ['missing easing coordinate', s => { s.motion.easing = 'cubic-bezier(0, 0, .58)'; }, /four finite control points/],
  ['invalid easing x coordinate', s => { s.motion.easing = 'cubic-bezier(2, 0, .58, 1)'; }, /x coordinates/],
  ['fractional character measure', s => { s.layout.line = '65.5ch'; }, /whole-character/],
  ['invalid font weight', s => { s.type.body.fontWeight = 1001; }, /font weight/],
  ['misspelled typography field', s => { s.type.body.fontSzie = '1rem'; }, /unsupported property fontSzie/],
  ['missing theme roles', s => { delete s.semantic.light.text; }, /incomplete light/],
  ['unresolved aliases', s => { s.semantic.dark.text = 'unknown'; }, /unknown primitive unknown/],
  ['unsupported modes', s => { s.semantic.sepia = s.semantic.light; }, /exactly dark and light/],
  ['Rust constant collisions', s => { s.space.n2 = '1rem'; }, /colliding token name n2/],
  ['unknown glass properties', s => { s.glass.opacity = 0.5; }, /glass: unsupported property opacity/],
  ['a negative glass blur', s => { s.glass.blur = '-4px'; }, /glass\.blur: expected a finite number >= 0/],
  ['a missing glass saturation', s => { delete s.glass.saturation; }, /glass\.saturation: expected a finite number/],
  ['a tone threshold outside 0..1', s => { s.glass.toneThreshold = 1.2; }, /toneThreshold: expected a relative luminance/],
  ['a tone band that leaves 0..1', s => { s.glass.toneHysteresis = 0.3; }, /threshold ± hysteresis must stay within/],
  ['a sheen angle of a full turn or more', s => { s.glass.sheenAngle = 360; }, /sheenAngle: expected degrees/],
  ['a role named after a glass switch', s => { for (const m of ['dark', 'light']) s.semantic[m]['glass-fill'] = 'paper'; }, /glass-fill is reserved/],
]) {
  test(`baseline generator rejects ${label} without publishing partial output`, t => {
    const f = fixture(t);
    f.edit(BASELINE, mutate);
    const result = f.generate();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, expected);
    for (const name of outputNames('cosmik')) assert.equal(fs.existsSync(path.join(f.brand, 'kits/cosmik/tokens', name)), false);
  });
}

// The family contract: what a family may change, add and never touch.
for (const [label, mutate, expected] of [
  ['stale family baseline metadata', s => { s.extends = 'Cosmik baseline 0.4.0'; }, /extends must be/],
  ['missing family modes', s => { delete s.semantic.light; }, /exactly the baseline modes/],
  ['misspelled family sections', s => { s.typography = {}; }, /unsupported property typography/],
  ['family motion overrides', s => { s.motion = {duration: '1ms'}; }, /unsupported property motion/],
  ['family utility type overrides', s => { s.type = {body: {fontFamily: 'Other'}}; }, /utility type/],
  ['family heading size overrides', s => { s.type = {display: {fontSize: '9rem'}}; }, /sets only fontFamily and fontWeight/],
  ['family primitive collisions', s => { s.primitives.paper = '#FFFFFF'; }, /exists in the baseline/],
  ['asymmetric family extensions', s => { s.extensions.dark.extra = 'white'; }, /same roles/],
  ['extensions replacing baseline roles', s => { s.extensions.dark.text = 'white'; s.extensions.light.text = 'black'; }, /would replace a baseline role/],
  ['new roles outside extensions', s => { s.semantic.dark.brand = 'white'; }, /not a baseline role/],
  ['invalid family ids', s => { s.id = 'Example Family'; }, /`id` must be/],
  ['negative shadow blur', s => { s.elevation['1'].blur = '-2px'; }, /finite number >= 0/],
  ['family colour values that are not hex', s => { s.primitives['example-dark-action'] = 'blue'; }, /expected #RRGGBB/],
]) {
  test(`family build rejects ${label} without publishing partial output`, t => {
    const f = fixture(t);
    f.edit(FAMILY, mutate);
    const result = f.familyCli('build');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, expected);
    assert.deepEqual(fs.readdirSync(path.join(f.family, 'tokens')), ['family.json']);
  });
}

for (const key of ['space', 'layout', 'radius', 'breakpoint', 'glass']) {
  test(`family build rejects a ${key} override`, t => {
    const f = fixture(t);
    f.edit(FAMILY, s => { s[key] = {}; });
    const result = f.familyCli('build');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, new RegExp(`unsupported property ${key}`));
  });
}

test('a failed family build preserves its existing generated files', t => {
  const f = fixture(t);
  assert.equal(f.familyCli('build').status, 0);
  const before = outputNames('example').map(name => fs.readFileSync(path.join(f.family, 'tokens', name), 'utf8'));
  f.edit(FAMILY, s => { s.semantic.dark['action-primary'] = 'not-a-primitive'; });
  assert.notEqual(f.familyCli('build').status, 0);
  assert.deepEqual(outputNames('example').map(name => fs.readFileSync(path.join(f.family, 'tokens', name), 'utf8')), before);
});

test('valid signed dimensions and bezier y overshoot survive all output formats', t => {
  const f = fixture(t);
  f.edit(BASELINE, s => {
    s.type.body.letterSpacing = '-0.02em';
    s.motion.easing = 'cubic-bezier(0.1, -0.5, 0.9, 1.5)';
  });
  f.edit(FAMILY, s => {
    s.elevation['1'].offsetX = '-2px';
    s.elevation['1'].spread = '-1px';
  });
  const result = f.familyCli('build');
  assert.equal(result.status, 0, result.stderr);
  const actual = JSON.parse(fs.readFileSync(path.join(f.family, familyOutput()), 'utf8'));
  assert.deepEqual(actual.native.motion.easing, [0.1, -0.5, 0.9, 1.5]);
  assert.equal(actual.native.type.body.letterSpacing, -0.02);
  assert.equal(actual.native.elevation.dark['1'].offsetXPx, -2);
  assert.equal(actual.native.elevation.dark['1'].spreadPx, -1);
});

test('CSS exposes effective, normal and system motion durations without changing native values', t => {
  const source = json(BASELINE);
  const css = read(baselineOutput('css'));
  assert.ok(css.includes(`--c-motion-normal-duration: ${source.motion.duration};`));
  assert.match(css, /--c-motion-duration: var\(--c-motion-system-duration\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)\s*\{\s*:root \{ --c-motion-system-duration: var\(--c-motion-reduced-duration\); \}/);
  for (const [preference, token] of [['system', 'system'], ['reduce', 'reduced'], ['full', 'normal']]) {
    assert.ok(css.includes(`[data-motion="${preference}"] { --c-motion-duration: var(--c-motion-${token}-duration); }`));
  }
  const f = fixture(t);
  assert.equal(f.familyCli('build').status, 0);
  for (const tokens of [json(baselineOutput()), JSON.parse(fs.readFileSync(path.join(f.family, familyOutput()), 'utf8'))]) {
    assert.equal(tokens.motion.duration, source.motion.duration);
    assert.equal(tokens.native.motion.durationMs, parseInt(source.motion.duration));
    assert.equal(tokens.native.motion.reducedDurationMs, parseInt(source.motion['reduced-duration']));
  }
});

test('generated JSON, DTCG and Rust retain matching modes, aliases, alpha and dimensions', t => {
  const f = fixture(t);
  assert.equal(f.familyCli('build').status, 0);
  const kits = [
    [read(baselineOutput()), read(baselineOutput('tokens.json')), read('kits/cosmik/tokens/cosmik_tokens.rs')],
    outputNames('example').filter(name => name !== 'example.css').map(name => fs.readFileSync(path.join(f.family, 'tokens', name), 'utf8')),
  ];
  for (const [resolvedText, dtcgText, rust] of kits) {
    const resolved = JSON.parse(resolvedText), dtcg = JSON.parse(dtcgText);
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

test('the baseline CLI regenerates the committed baseline byte for byte', t => {
  const f = fixture(t);
  const result = f.generate();
  assert.equal(result.status, 0, result.stderr);
  for (const name of outputNames('cosmik')) {
    assert.equal(fs.readFileSync(path.join(f.brand, 'kits/cosmik/tokens', name), 'utf8'), read(`kits/cosmik/tokens/${name}`), name);
  }
});

test('contrast check rejects a missing baseline instead of accepting an empty report', t => {
  const f = fixture(t, {generated: true});
  fs.rmSync(path.join(f.brand, 'kits'), {recursive: true});
  fs.mkdirSync(path.join(f.brand, 'kits'));
  const result = f.validate();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Missing Cosmik baseline/);
});

test('contrast check rejects missing generated baseline tokens instead of silently skipping them', t => {
  const f = fixture(t, {generated: true});
  fs.unlinkSync(path.join(f.brand, baselineOutput()));
  const result = f.validate();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Missing generated tokens: kits\/cosmik/);
});

test('contrast check validates actual neutral status borders', t => {
  const f = fixture(t, {generated: true});
  f.edit(baselineOutput(), s => { s.semantic.dark['status-border'] = s.semantic.dark['status-bg']; });
  const result = f.validate();
  assert.notEqual(result.status, 0);
  const report = JSON.parse(result.stdout);
  assert.ok(report.failed.some(check => check.pair === 'status-border / status-bg' && check.ratio === 1));
});

test('contrast check diagnoses missing or translucent functional roles', t => {
  for (const value of [undefined, '#00000080']) {
    const f = fixture(t, {generated: true});
    f.edit(baselineOutput(), s => { s.semantic.dark.text = value; });
    const result = f.validate();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /cosmik dark text: contrast pairs require an opaque/);
  }
});

test('glass blur and saturation reach every output format', () => {
  const source = json(BASELINE);
  const css = read(baselineOutput('css'));
  assert.match(css, new RegExp(`--c-glass-blur: ${source.glass.blur};`));
  assert.match(css, new RegExp(`--c-glass-saturation: ${source.glass.saturation};`));
  const out = json(baselineOutput());
  assert.deepEqual(out.glass, source.glass);
  assert.equal(out.native.glass.saturation, source.glass.saturation);
  assert.equal(typeof out.native.glass.blurPx, 'number');
  const dtcg = json(baselineOutput('tokens.json'));
  assert.equal(dtcg.glass.blur.$type, 'dimension');
  assert.equal(dtcg.glass.saturation.$value, source.glass.saturation);
  assert.match(css, new RegExp(`--c-glass-sheen-angle: ${source.glass.sheenAngle}deg;`));
  assert.match(read('kits/cosmik/tokens/cosmik_tokens.rs'), /pub mod glass \{\n {4}pub const BLUR: f32 = [\d.]+;\n {4}pub const SATURATION: f32 = [\d.]+;/);
});

test('each glass tone fails over the other band, so a product must switch tones', () => {
  const tokens = json(baselineOutput());
  const {glassComposite, contrast} = validate;
  // Muted text on the dark tone over a white backdrop, and on the light tone over a black one.
  assert.ok(contrast(tokens.semantic.dark['glass-muted'], glassComposite(tokens.semantic.dark.glass, [1, 1, 1], tokens.glass.saturation)) < 4.5);
  assert.ok(contrast(tokens.semantic.light['glass-muted'], glassComposite(tokens.semantic.light.glass, [0, 0, 0], tokens.glass.saturation)) < 4.5);
  // The bands overlap around the threshold, so either tone holds where a product hesitates.
  const [, darkHigh] = validate.glassBand('dark', tokens.glass), [lightLow] = validate.glassBand('light', tokens.glass);
  assert.ok(lightLow < tokens.glass.toneThreshold && tokens.glass.toneThreshold < darkHigh);
});

test('contrast check requires a translucent glass tint and names the backdrop a glass role fails over', t => {
  const f = fixture(t);
  f.edit(BASELINE, s => { s.primitives['glass-dark'] = '#121212'; });
  assert.equal(f.generate().status, 0);
  let result = f.validate();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /dark glass: expected a translucent #RRGGBBAA role/);
  f.edit(BASELINE, s => { s.primitives['glass-dark'] = '#12121210'; });
  assert.equal(f.generate().status, 0);
  result = f.validate();
  assert.equal(result.status, 1);
  const report = JSON.parse(result.stdout);
  assert.ok(report.failed.some(c => c.pair === 'text / glass over backdrops of luminance 0.00–0.25' && c.mode === 'dark' && /^#12121210 over #/.test(c.background)), JSON.stringify(report.failed));
});
