/** Token generator: the baseline CLI and the shared rendering used by the family API.
 * `node scripts/generate-tokens.mjs` reads kits/cosmik/tokens/source.json (the baseline) and writes,
 * beside it: cosmik.css, cosmik.json (with a `native` section), cosmik.tokens.json (W3C DTCG) and
 * cosmik_tokens.rs. Family kits live in their own `brand-<product>` repositories; scripts/family.mjs
 * merges a family's tokens/family.json over this baseline under the family contract
 * (`familySource`, below) and renders it with `renderKit`. No third-party packages. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// This checkout's root. Resolved from the script, so a vendored copy (vendor/brand/scripts/) uses
// the baseline vendored beside it rather than anything in the consuming repository.
export const brandRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const BASELINE_SOURCE = 'kits/cosmik/tokens/source.json';
export const BASELINE_STEM = 'cosmik';
export const loadBaseline = (root = brandRoot) => JSON.parse(fs.readFileSync(path.join(root, BASELINE_SOURCE), 'utf8'));
const ROOT_PX = 16;
const object = (value, label) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label}: expected an object`);
  return value;
};
const tokenName = (name, label) => {
  if (!/^(?:[a-z][a-z0-9-]*|[0-9]+)$/.test(name)) throw new Error(`${label}: invalid token name ${name}`);
};
const finite = (value, label, minimum = 0) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum) throw new Error(`${label}: expected a finite number >= ${minimum}`);
  return value;
};
// Two-space JSON with numeric arrays kept on one line.
const toJson = (value) => JSON.stringify(value, null, 2)
  .replace(/\[\s+(-?[\d.e+-]+(?:,\s+-?[\d.e+-]+)*)\s+\]/g, (_, inner) => `[${inner.split(/,\s+/).join(', ')}]`) + '\n';

// ---- The family contract: what a family may change, add and never touch ----
// Heading roles a family may set its own typeface for; utility type (body, control, ui,
// ui-small, label, identity-label) stays the baseline's in every family.
const FAMILY_TYPE_ROLES = ['display', 'display-small', 'section', 'card'];
const FAMILY_TYPE_KEYS = ['fontFamily', 'fontWeight'];
export const FAMILY_FIXED = ['space', 'layout', 'motion', 'radius', 'breakpoint'];
/** Resolves a family source over `baseline`, or throws naming the first contract violation. */
export const familySource = (family, baseline) => {
  const fail = (msg) => { throw new Error(`Family ${family.id}: ${msg}`); };
  object(family, 'Family source');
  const allowed = new Set(['id', 'name', 'version', 'status', 'extends', 'description', 'fonts', 'proposals', 'primitives', 'semantic', 'extensions', 'type', 'elevation']);
  for (const key of Object.keys(family)) if (!allowed.has(key)) fail(`unsupported property ${key}`);
  if (!/^[a-z][a-z0-9-]*$/.test(family.id ?? '')) fail('`id` must be lower-case letters, digits and hyphens');
  const expectedBaseline = `${baseline.name} baseline ${baseline.version}`;
  if (family.extends !== expectedBaseline) fail(`extends must be ${JSON.stringify(expectedBaseline)}; generated values resolve the current baseline`);
  object(family.semantic, `Family ${family.id}.semantic`);
  for (const part of ['primitives', 'extensions', 'type', 'elevation']) if (family[part] !== undefined) object(family[part], `Family ${family.id}.${part}`);
  const primitives = { ...baseline.primitives };
  for (const [name, hex] of Object.entries(family.primitives ?? {})) {
    if (name in baseline.primitives) fail(`primitive ${name} exists in the baseline; give the family's its own name`);
    primitives[name] = hex;
  }
  const modesOf = (o) => Object.keys(o ?? {}).sort().join('|');
  const baseModes = modesOf(baseline.semantic);
  for (const part of ['semantic', 'extensions']) {
    if (family[part] && modesOf(family[part]) !== baseModes) fail(`${part} must cover exactly the baseline modes (${baseModes})`);
  }
  const extensionKeys = Object.keys(family.extensions?.dark ?? {}).sort().join('|');
  const semantic = {};
  for (const mode of Object.keys(baseline.semantic)) {
    const overrides = object(family.semantic[mode], `Family ${family.id}.semantic.${mode}`);
    const extensions = family.extensions ? object(family.extensions[mode], `Family ${family.id}.extensions.${mode}`) : {};
    for (const role of Object.keys(overrides)) if (!(role in baseline.semantic[mode])) fail(`${mode}: ${role} is not a baseline role; add it under extensions`);
    for (const role of Object.keys(extensions)) if (role in baseline.semantic[mode]) fail(`${mode}: extension ${role} would replace a baseline role; override it under semantic`);
    if (Object.keys(extensions).sort().join('|') !== extensionKeys) fail(`extensions must name the same roles in every mode`);
    semantic[mode] = { ...baseline.semantic[mode], ...overrides, ...extensions };
  }
  const type = structuredClone(baseline.type);
  for (const [role, values] of Object.entries(family.type ?? {})) {
    if (!FAMILY_TYPE_ROLES.includes(role)) fail(`type ${role} is utility type; it stays the baseline's (heading roles: ${FAMILY_TYPE_ROLES.join(', ')})`);
    object(values, `Family ${family.id}.type.${role}`);
    for (const key of Object.keys(values)) if (!FAMILY_TYPE_KEYS.includes(key)) fail(`type ${role}.${key}: a family sets only ${FAMILY_TYPE_KEYS.join(' and ')}`);
    Object.assign(type[role], values);
  }
  for (const key of FAMILY_FIXED) if (key in family) fail(`${key} is fixed by the baseline`);
  return {
    name: `${baseline.name} · ${family.name}`, version: family.version, status: family.status, family: family.id,
    extends: family.extends, description: family.description, fonts: family.fonts ?? [], proposals: family.proposals ?? [],
    primitives, semantic, extensionRoles: Object.keys(family.extensions?.dark ?? {}),
    overriddenType: Object.keys(family.type ?? {}),
    space: baseline.space, layout: baseline.layout, motion: baseline.motion, radius: baseline.radius,
    breakpoint: baseline.breakpoint, type, elevation: family.elevation ?? {},
  };
};

// ---- Unit conversion for non-browser consumers ----
const round = (n, d = 6) => Number(n.toFixed(d)) + 0;
const parseLength = (value) => {
  const m = /^(-?(?:\d+(?:\.\d+)?|\.\d+))(rem|px|ch|em)?$/.exec(String(value));
  if (!m || !Number.isFinite(Number(m[1])) || (!m[2] && Number(m[1]) !== 0)) throw new Error(`Unparseable length ${value}: use a finite dimension (or unitless zero)`);
  return { value: Number(m[1]), unit: m[2] ?? 'px' };
};
const toPx = (value) => {
  const { value: n, unit } = parseLength(value);
  if (unit === 'rem') return round(n * ROOT_PX, 4);
  if (unit === 'px') return n;
  throw new Error(`Cannot convert ${value} to px`);
};
const parseMs = (value) => {
  const m = /^(\d+)ms$/.exec(value);
  if (!m || !Number.isSafeInteger(Number(m[1])) || Number(m[1]) > 0xFFFFFFFF) throw new Error(`Unparseable duration ${value}: expected whole milliseconds in u32 range`);
  return Number(m[1]);
};
const EASINGS = { linear: [0, 0, 1, 1], ease: [0.25, 0.1, 0.25, 1], 'ease-in': [0.42, 0, 1, 1], 'ease-out': [0, 0, 0.58, 1], 'ease-in-out': [0.42, 0, 0.58, 1] };
const toBezier = (value) => {
  if (EASINGS[value]) return EASINGS[value];
  const m = /^cubic-bezier\(([^)]+)\)$/.exec(value);
  if (!m) throw new Error(`Unsupported easing ${value}`);
  const points = m[1].split(',').map(s => s.trim());
  if (points.length !== 4 || points.some(s => !/^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(s))) throw new Error(`Invalid easing ${value}: expected four finite control points`);
  const numbers = points.map(Number);
  if (numbers.some(n => !Number.isFinite(n)) || [numbers[0], numbers[2]].some(n => n < 0 || n > 1)) throw new Error(`Invalid easing ${value}: x coordinates must be in 0..1`);
  return numbers;
};
const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const color = (hex) => {
  const bytes = hex.slice(1).match(/../g).map((x) => parseInt(x, 16) / 255);
  const [r, g, b] = bytes;
  const a = bytes.length === 4 ? bytes[3] : 1;
  return { hex, srgb: [r, g, b, a].map((x) => round(x)), linear: [toLinear(r), toLinear(g), toLinear(b), a].map((x) => round(x)) };
};
const letterSpacingFraction = (value) => {
  const { value: n, unit } = parseLength(value);
  if (n === 0) return 0;
  if (unit !== 'em') throw new Error(`Letter spacing ${value}: expected em`);
  return n;
};
const nativeType = (t) => {
  const sizePx = toPx(t.fontSize);
  const spacing = letterSpacingFraction(t.letterSpacing);
  return { fontFamily: t.fontFamily, fontWeight: t.fontWeight, fontSizePx: sizePx, lineHeight: t.lineHeight,
    lineHeightPx: round(sizePx * t.lineHeight, 4), letterSpacing: spacing, letterSpacingPx: round(sizePx * spacing, 4),
    textTransform: t.textTransform ?? 'none' };
};

// Fail at the source boundary, before conversion can turn invalid numbers into
// JSON nulls or produce Rust constants that cannot compile.
export const validateSource = (source, stem) => {
  for (const key of ['name', 'version', 'status']) {
    if (typeof source[key] !== 'string' || !source[key].trim() || /[\r\n]/.test(source[key])) throw new Error(`${stem}.${key}: expected a non-empty single line`);
  }
  for (const group of ['primitives', 'semantic', 'space', 'layout', 'type', 'motion', 'radius', 'breakpoint', 'elevation']) object(source[group], `${stem}.${group}`);
  if (Object.keys(source.semantic).sort().join('|') !== 'dark|light') throw new Error(`${stem}.semantic: expected exactly dark and light modes`);
  for (const [mode, roles] of Object.entries(source.semantic)) {
    object(roles, `${stem}.semantic.${mode}`);
    if (!Object.keys(roles).length) throw new Error(`${stem}.semantic.${mode}: no roles`);
    for (const [name, alias] of Object.entries(roles)) {
      tokenName(name, `${stem}.semantic.${mode}`);
      // These become public Rust fields. Keep names portable to all outputs.
      if (/^(?:as|break|const|continue|crate|else|enum|extern|false|fn|for|if|impl|in|let|loop|match|mod|move|mut|pub|ref|return|self|static|struct|super|trait|true|type|unsafe|use|where|while|async|await|dyn)$/.test(name)) throw new Error(`${stem}: reserved semantic role ${name}`);
      if (typeof alias !== 'string' || !Object.hasOwn(source.primitives, alias)) throw new Error(`${stem}: unknown primitive ${alias}`);
    }
  }
  for (const group of ['primitives', 'space', 'layout', 'type', 'radius', 'breakpoint', 'elevation']) {
    const names = new Set();
    for (const name of Object.keys(source[group])) {
      tokenName(name, `${stem}.${group}`);
      const constant = name.replaceAll('-', '_').toUpperCase().replace(/^(?=\d)/, 'N');
      if (names.has(constant)) throw new Error(`${stem}.${group}: colliding token name ${name}`);
      names.add(constant);
    }
  }
  for (const group of ['space', 'radius', 'breakpoint']) {
    for (const [name, value] of Object.entries(source[group])) finite(toPx(value), `${stem}.${group}.${name}`);
  }
  for (const [name, value] of Object.entries(source.layout)) {
    const dimension = parseLength(value);
    if (dimension.unit === 'ch') {
      if (name !== 'line' || !Number.isInteger(dimension.value) || dimension.value > 0xFFFFFFFF) throw new Error(`${stem}.layout.${name}: only the whole-character line measure uses ch`);
      finite(dimension.value, `${stem}.layout.${name}`, 1);
    } else finite(toPx(value), `${stem}.layout.${name}`);
  }
  for (const [role, type] of Object.entries(source.type)) {
    object(type, `${stem}.type.${role}`);
    for (const key of Object.keys(type)) if (!['fontFamily', 'fontWeight', 'fontSize', 'lineHeight', 'letterSpacing', 'textTransform'].includes(key)) throw new Error(`${stem}.type.${role}: unsupported property ${key}`);
    if (typeof type.fontFamily !== 'string' || !type.fontFamily.trim() || /[\\\r\n\x00-\x1f]/.test(type.fontFamily)) throw new Error(`${stem}.type.${role}: invalid font family`);
    if (!Number.isInteger(type.fontWeight) || type.fontWeight < 1 || type.fontWeight > 1000) throw new Error(`${stem}.type.${role}: font weight must be an integer in 1..1000`);
    finite(toPx(type.fontSize), `${stem}.type.${role}.fontSize`, Number.EPSILON);
    finite(type.lineHeight, `${stem}.type.${role}.lineHeight`, Number.EPSILON);
    letterSpacingFraction(type.letterSpacing);
    if (type.textTransform !== undefined && !['none', 'uppercase'].includes(type.textTransform)) throw new Error(`${stem}.type.${role}: unsupported text transform ${type.textTransform}`);
  }
  for (const key of Object.keys(source.motion)) if (!['duration', 'reduced-duration', 'easing'].includes(key)) throw new Error(`${stem}.motion: unsupported property ${key}`);
  parseMs(source.motion.duration); parseMs(source.motion['reduced-duration']); toBezier(source.motion.easing);
  for (const [level, elevation] of Object.entries(source.elevation)) {
    object(elevation, `${stem}.elevation.${level}`);
    for (const key of Object.keys(elevation)) if (!['surface', 'color', 'offsetX', 'offsetY', 'blur', 'spread'].includes(key)) throw new Error(`${stem}.elevation.${level}: unsupported property ${key}`);
    for (const key of ['offsetX', 'offsetY', 'blur', 'spread']) finite(toPx(elevation[key]), `${stem}.elevation.${level}.${key}`, key === 'blur' ? 0 : -Infinity);
  }
};

/** Renders one kit without touching the file system, returning `{ files: [[name, text]], summary }`.
 * `stem` names the files; `scope` is null for the baseline (`:root`) or a family id (CSS scoped to
 * `[data-family="<id>"]`). `baseline` is the raw baseline source the family resolves over;
 * `provenance` completes the generated headers ("Generated by … from …"). */
export const renderKit = (source, { stem, scope = null, baseline, provenance }) => {
  const files = [];
  const write = (name, text) => files.push([name, text]);
  const label = `${source.name} ${source.version} — ${/^Approved/.test(source.status) ? 'APPROVED' : 'PROPOSED'}`;
  if (/[\r\n]|\*\//.test(provenance)) throw new Error('provenance must be a single line without a comment terminator');

  // ---- Validation and resolution ----
  validateSource(source, stem);
  const modes = {};
  const canonical = Object.keys(source.semantic.dark).sort().join('|');
  for (const [mode, aliases] of Object.entries(source.semantic)) {
    if (Object.keys(aliases).sort().join('|') !== canonical) throw new Error(`${stem}: incomplete ${mode} semantic map`);
    modes[mode] = Object.fromEntries(Object.entries(aliases).map(([key, alias]) => {
      if (!source.primitives[alias]) throw new Error(`${stem}: unknown primitive ${alias}`);
      return [key, source.primitives[alias]];
    }));
  }
  for (const [level, e] of Object.entries(source.elevation)) {
    for (const role of [e.surface, e.color]) if (!(role in source.semantic.dark)) throw new Error(`${stem}: elevation ${level}: unknown role ${role}`);
  }
  for (const [name, hex] of Object.entries(source.primitives)) {
    if (!/^#([0-9A-F]{6}|[0-9A-F]{8})$/.test(hex)) throw new Error(`${stem}: primitive ${name}: expected #RRGGBB or #RRGGBBAA, got ${hex}`);
  }

  const nativeLayout = Object.fromEntries(Object.entries(source.layout).map(([key, value]) => {
    const { value: n, unit } = parseLength(value);
    return unit === 'ch' ? [key, { chars: n }] : [key, toPx(value)];
  }));
  const nativeElevation = (mode) => Object.fromEntries(Object.entries(source.elevation).map(([level, e]) => [level, {
    surface: e.surface, offsetXPx: toPx(e.offsetX), offsetYPx: toPx(e.offsetY), blurPx: toPx(e.blur), spreadPx: toPx(e.spread),
    color: color(modes[mode][e.color]) }]));
  const native = {
    description: 'Values for non-browser consumers (desktop, game UI, design tools). Lengths are logical px at a 16 px root; letterSpacing is a fraction of the font size; layout.line is a measure in characters; easing is cubic-bezier control points [x1, y1, x2, y2]; colours give hex, straight-alpha sRGB floats [r, g, b, a] and linear-light floats.',
    rootPx: ROOT_PX,
    primitives: Object.fromEntries(Object.entries(source.primitives).map(([k, v]) => [k, color(v)])),
    semantic: Object.fromEntries(Object.keys(modes).map((mode) => [mode, Object.fromEntries(Object.entries(modes[mode]).map(([k, v]) => [k, color(v)]))])),
    elevation: Object.fromEntries(Object.keys(modes).map((mode) => [mode, nativeElevation(mode)])),
    space: Object.fromEntries(Object.entries(source.space).map(([k, v]) => [k, toPx(v)])),
    radius: Object.fromEntries(Object.entries(source.radius).map(([k, v]) => [k, toPx(v)])),
    breakpoint: Object.fromEntries(Object.entries(source.breakpoint).map(([k, v]) => [k, toPx(v)])),
    layout: nativeLayout,
    type: Object.fromEntries(Object.entries(source.type).map(([k, v]) => [k, nativeType(v)])),
    motion: { durationMs: parseMs(source.motion.duration), reducedDurationMs: parseMs(source.motion['reduced-duration']), easing: toBezier(source.motion.easing) },
  };

  // ---- <stem>.json: simple kit-specific contract ----
  const output = { name: source.name, version: source.version, status: source.status,
    ...(scope ? { family: scope, extends: source.extends, extensionRoles: source.extensionRoles, fonts: source.fonts } : {}),
    description: 'Resolved semantic tokens. Use semantic tokens in components; primitives are reference values, not theme roles. All dimensions assume a 16px browser root. All-caps tracking is for labels only.',
    primitives: source.primitives, semantic: modes, aliases: source.semantic,
    space: source.space, layout: source.layout, type: source.type, motion: source.motion,
    proposals: source.proposals, radius: source.radius, breakpoint: source.breakpoint, elevation: source.elevation, native };
  write(`${stem}.json`, toJson(output));

  // ---- <stem>.css ----
  const typeVars = (roles) => {
    let out = '';
    for (const role of roles) {
      for (const [key, val] of Object.entries(source.type[role])) {
        const property = key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
        out += `  --c-type-${role}-${property}: ${key === 'fontFamily' ? JSON.stringify(val) : val};\n`;
      }
    }
    return out;
  };
  const themeBlock = (mode, aliases, selector) => {
    let out = `\n${selector} {\n  color-scheme: ${mode};\n`;
    for (const [key, alias] of Object.entries(aliases)) out += `  --c-${key}: var(--c-primitive-${alias});\n`;
    // Declared per theme so a nested theme scope resolves its own surface and shadow colour.
    for (const [level, e] of Object.entries(source.elevation)) {
      out += `  --c-elevation-${level}-surface: var(--c-primitive-${aliases[e.surface]});\n`;
      out += `  --c-elevation-${level}-shadow: ${e.offsetX} ${e.offsetY} ${e.blur} ${e.spread} var(--c-primitive-${aliases[e.color]});\n`;
    }
    return out + '}\n';
  };
  let css;
  if (!scope) {
    css = `/* ${label}. ${provenance}. */\n`;
    css += ':root {\n';
    for (const [key, val] of Object.entries(source.primitives)) css += `  --c-primitive-${key}: ${val};\n`;
    for (const group of ['space', 'layout']) {
      for (const [key, val] of Object.entries(source[group])) css += `  --c-${group}-${key}: ${val};\n`;
    }
    css += `  --c-motion-normal-duration: ${source.motion.duration};\n`;
    css += `  --c-motion-reduced-duration: ${source.motion['reduced-duration']};\n`;
    css += `  --c-motion-easing: ${source.motion.easing};\n`;
    css += '  --c-motion-system-duration: var(--c-motion-normal-duration);\n';
    css += '  --c-motion-duration: var(--c-motion-system-duration);\n';
    css += typeVars(Object.keys(source.type));
    for (const [key, val] of Object.entries(source.radius)) css += `  --c-radius-${key}: ${val};\n`;
    css += '  /* Breakpoints are reference values: custom properties cannot be used inside @media. */\n';
    for (const [key, val] of Object.entries(source.breakpoint)) css += `  --c-breakpoint-${key}: ${val};\n`;
    css += '}\n';
    for (const [mode, aliases] of Object.entries(source.semantic)) {
      css += themeBlock(mode, aliases, `${mode === 'dark' ? ':root, ' : ''}[data-theme="${mode}"]`);
    }
    // A page that names no theme follows the operating system. Family files
    // resolve light-dark() against the color-scheme this sets, so they follow too.
    css += `\n@media (prefers-color-scheme: light) {${themeBlock('light', source.semantic.light, ':root:not([data-theme])').replace(/\n/g, '\n  ').replace(/\n  $/, '\n')}}\n`;
    css += '\n/* Preserve the normal duration so an explicit preference can override the OS. */\n';
    css += '@media (prefers-reduced-motion: reduce) {\n  :root { --c-motion-system-duration: var(--c-motion-reduced-duration); }\n}\n';
    css += '\n/* The nearest explicit scope wins; system restores the OS preference inside an override. */\n';
    css += '[data-motion="system"] { --c-motion-duration: var(--c-motion-system-duration); }\n';
    css += '[data-motion="reduce"] { --c-motion-duration: var(--c-motion-reduced-duration); }\n';
    css += '[data-motion="full"] { --c-motion-duration: var(--c-motion-normal-duration); }\n';
  } else {
    // Inherit the nearest explicit color-scheme from the baseline. Ancestor selectors
    // cannot implement nearest-theme inheritance: a distant light ancestor would win
    // over an explicit dark scope. light-dark() resolves at the consuming element.
    const f = `[data-family="${scope}"]`;
    css = `/* ${label}. ${provenance}. Load after ${BASELINE_STEM}.css. */\n`;
    css += `${f} {\n`;
    for (const [key, val] of Object.entries(source.primitives)) if (!(key in baseline.primitives)) css += `  --c-primitive-${key}: ${val};\n`;
    css += typeVars(source.overriddenType);
    css += '}\n';
    const themedColor = (role) => `light-dark(var(--c-primitive-${source.semantic.light[role]}), var(--c-primitive-${source.semantic.dark[role]}))`;
    css += `\n${f}, ${f} [data-theme] {\n`;
    for (const role of Object.keys(source.semantic.dark)) css += `  --c-${role}: ${themedColor(role)};\n`;
    for (const [level, e] of Object.entries(source.elevation)) {
      css += `  --c-elevation-${level}-surface: ${themedColor(e.surface)};\n`;
      css += `  --c-elevation-${level}-shadow: ${e.offsetX} ${e.offsetY} ${e.blur} ${e.spread} ${themedColor(e.color)};\n`;
    }
    css += '}\n';
  }
  write(`${stem}.css`, css);

  // ---- <stem>.tokens.json: W3C Design Tokens Community Group format (2025.10) ----
  const dtcgColor = (hex) => {
    const c = color(hex);
    return { colorSpace: 'srgb', components: c.srgb.slice(0, 3), alpha: c.srgb[3], hex: hex.slice(0, 7).toLowerCase() };
  };
  const dtcgDimension = (value) => {
    const { value: n, unit } = parseLength(value);
    if (unit !== 'px' && unit !== 'rem') throw new Error(`DTCG dimension ${value}: unit must be px or rem`);
    return { value: n, unit };
  };
  const tok = (type, value, extra = {}) => ({ $type: type, $value: value, ...extra });
  const MODES_EXT = 'com.cosmiklabs.modes';
  const dtcg = {
    $description: `${label}. ${provenance}; do not edit. Colour roles in "color" resolve to the dark theme; each carries $extensions["${MODES_EXT}"] with its alias in every theme (dark, light). Tools without mode support see the dark theme.`,
    $extensions: { 'com.cosmiklabs': { name: source.name, version: source.version, status: source.status, ...(scope ? { family: scope, extends: source.extends } : {}), defaultMode: 'dark', modes: Object.keys(modes), proposals: source.proposals } },
    primitive: { color: Object.fromEntries(Object.entries(source.primitives).map(([k, v]) => [k, tok('color', dtcgColor(v))])) },
    color: Object.fromEntries(Object.keys(source.semantic.dark).map((role) => [role, tok('color', `{primitive.color.${source.semantic.dark[role]}}`, {
      $extensions: { [MODES_EXT]: Object.fromEntries(Object.keys(modes).map((mode) => [mode, `{primitive.color.${source.semantic[mode][role]}}`])) } })])),
    space: Object.fromEntries(Object.entries(source.space).map(([k, v]) => [k, tok('dimension', dtcgDimension(v))])),
    radius: Object.fromEntries(Object.entries(source.radius).map(([k, v]) => [k, tok('dimension', dtcgDimension(v))])),
    breakpoint: Object.fromEntries(Object.entries(source.breakpoint).map(([k, v]) => [k, tok('dimension', dtcgDimension(v))])),
    layout: Object.fromEntries(Object.entries(source.layout).map(([k, v]) => {
      const { value: n, unit } = parseLength(v);
      return [k, unit === 'ch' ? tok('number', n, { $description: 'Reading measure in characters (CSS ch).' }) : tok('dimension', dtcgDimension(v))];
    })),
    elevation: Object.fromEntries(Object.entries(source.elevation).map(([level, e]) => [level, {
      surface: tok('color', `{color.${e.surface}}`),
      shadow: tok('shadow', { color: `{color.${e.color}}`, offsetX: dtcgDimension(e.offsetX), offsetY: dtcgDimension(e.offsetY), blur: dtcgDimension(e.blur), spread: dtcgDimension(e.spread) }),
    }])),
    typography: Object.fromEntries(Object.entries(source.type).map(([role, t]) => {
      const n = nativeType(t);
      return [role, tok('typography', { fontFamily: t.fontFamily, fontSize: dtcgDimension(t.fontSize), fontWeight: t.fontWeight,
        letterSpacing: { value: n.letterSpacingPx, unit: 'px' }, lineHeight: t.lineHeight }, {
        $extensions: { 'com.cosmiklabs': { letterSpacingEm: n.letterSpacing, textTransform: n.textTransform } } })];
    })),
    motion: {
      duration: tok('duration', { value: parseMs(source.motion.duration), unit: 'ms' }),
      'reduced-duration': tok('duration', { value: parseMs(source.motion['reduced-duration']), unit: 'ms' }),
      easing: tok('cubicBezier', toBezier(source.motion.easing)),
    },
  };
  write(`${stem}.tokens.json`, toJson(dtcg));

  // ---- <stem>_tokens.rs: dependency-free Rust constants ----
  const f32 = (n) => (Number.isInteger(n) ? `${n}.0` : String(n));
  const arr = (a) => `[${a.map(f32).join(', ')}]`;
  const ident = (s) => s.replace(/[^A-Za-z0-9]+/g, '_');
  const CONST = (s) => { const id = ident(s).toUpperCase(); return /^\d/.test(id) ? `N${id}` : id; };
  const field = (s) => ident(s).toLowerCase();
  const rsColor = (hex) => { const c = color(hex); return `Color { hex: "${hex}", srgb: ${arr(c.srgb)}, linear: ${arr(c.linear)} }`; };
  const roles = Object.keys(source.semantic.dark);
  let rs = `// ${label}. ${provenance}; do not edit.
// Dependency-free: include with \`#[path = "…/${stem}_tokens.rs"] mod ${stem}_tokens;\` or copy into a crate.
// Colours: hex, straight-alpha sRGB floats and linear-light floats, each [r, g, b, a] in 0..=1.
// Lengths: logical pixels at a 16 px root. Letter spacing: fraction of the font size.

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Color {
    pub hex: &'static str,
    pub srgb: [f32; 4],
    pub linear: [f32; 4],
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct TypeRole {
    pub font_family: &'static str,
    pub font_weight: u16,
    pub font_size: f32,
    pub line_height: f32,
    pub letter_spacing: f32,
    pub uppercase: bool,
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Elevation {
    pub surface: Color,
    pub shadow_color: Color,
    pub offset_x: f32,
    pub offset_y: f32,
    pub blur: f32,
    pub spread: f32,
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Theme {
${roles.map((r) => `    pub ${field(r)}: Color,`).join('\n')}
${Object.keys(source.elevation).map((l) => `    pub elevation_${l}: Elevation,`).join('\n')}
}

pub mod primitive {
    use super::Color;
${Object.entries(source.primitives).map(([k, v]) => `    pub const ${CONST(k)}: Color = ${rsColor(v)};`).join('\n')}
}
`;
  for (const mode of Object.keys(modes)) {
    rs += `\npub const ${mode.toUpperCase()}: Theme = Theme {\n`;
    rs += roles.map((r) => `    ${field(r)}: primitive::${CONST(source.semantic[mode][r])},`).join('\n') + '\n';
    for (const [level, e] of Object.entries(nativeElevation(mode))) {
      const shadowAlias = source.semantic[mode][source.elevation[level].color];
      rs += `    elevation_${level}: Elevation { surface: primitive::${CONST(source.semantic[mode][e.surface])}, shadow_color: primitive::${CONST(shadowAlias)}, offset_x: ${f32(e.offsetXPx)}, offset_y: ${f32(e.offsetYPx)}, blur: ${f32(e.blurPx)}, spread: ${f32(e.spreadPx)} },\n`;
    }
    rs += '};\n';
  }
  const rsGroup = (name, values) => `\npub mod ${name} {\n${Object.entries(values).map(([k, v]) => `    pub const ${CONST(k)}: f32 = ${f32(v)};`).join('\n')}\n}\n`;
  rs += rsGroup('space', native.space);
  rs += rsGroup('radius', native.radius);
  rs += rsGroup('breakpoint', native.breakpoint);
  rs += `\npub mod layout {\n${Object.entries(native.layout).map(([k, v]) => (typeof v === 'object'
    ? `    /// Reading measure in characters.\n    pub const ${CONST(k)}_CHARS: u32 = ${v.chars};`
    : `    pub const ${CONST(k)}: f32 = ${f32(v)};`)).join('\n')}\n}\n`;
  rs += `\npub mod typography {\n    use super::TypeRole;\n${Object.entries(native.type).map(([k, t]) => `    pub const ${CONST(k)}: TypeRole = TypeRole { font_family: ${JSON.stringify(t.fontFamily)}, font_weight: ${t.fontWeight}, font_size: ${f32(t.fontSizePx)}, line_height: ${f32(t.lineHeight)}, letter_spacing: ${f32(t.letterSpacing)}, uppercase: ${t.textTransform === 'uppercase'} };`).join('\n')}\n}\n`;
  rs += `\npub mod motion {\n    pub const DURATION_MS: u32 = ${native.motion.durationMs};\n    pub const REDUCED_DURATION_MS: u32 = ${native.motion.reducedDurationMs};\n    /// Cubic-bezier control points [x1, y1, x2, y2].\n    pub const EASING: [f32; 4] = ${arr(native.motion.easing)};\n}\n`;
  write(`${stem}_tokens.rs`, rs);

  return { files, summary: `${stem}: ${canonical.split('|').length} semantic roles × ${Object.keys(modes).length} complete modes` };
};

/** The baseline's own outputs, with the header provenance they have always carried. */
export const renderBaseline = (baseline) => renderKit(baseline, {
  stem: BASELINE_STEM, scope: null, baseline,
  provenance: `Generated by scripts/generate-tokens.mjs from ${BASELINE_SOURCE}`,
});

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  if (process.argv.length > 2) throw new Error('Usage: generate-tokens.mjs (families: scripts/family.mjs build <familyRoot>)');
  // Validate and render everything before replacing any generated file.
  const { files, summary } = renderBaseline(loadBaseline());
  const outDir = path.join(brandRoot, path.dirname(BASELINE_SOURCE));
  for (const [name, text] of files) fs.writeFileSync(path.join(outDir, name), text);
  console.log(`Generated css, json, tokens.json and _tokens.rs from ${BASELINE_SOURCE}; ${summary}.`);
}
