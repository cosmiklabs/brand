/** Single-source generator. Run: node tokens/generate-tokens.mjs from the bundle root.
 * Reads cosmik.source.json and writes, beside it: cosmik.css, cosmik.json (with a `native` section),
 * cosmik.tokens.json (W3C DTCG) and cosmik_tokens.rs. No third-party packages. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const source = JSON.parse(fs.readFileSync(path.join(dir, 'cosmik.source.json'), 'utf8'));
const ROOT_PX = 16;
const write = (name, text) => fs.writeFileSync(path.join(dir, name), text);
// Two-space JSON with numeric arrays kept on one line.
const toJson = (value) => JSON.stringify(value, null, 2)
  .replace(/\[\s+(-?[\d.e+-]+(?:,\s+-?[\d.e+-]+)*)\s+\]/g, (_, inner) => `[${inner.split(/,\s+/).join(', ')}]`) + '\n';

// ---- Validation and resolution ----
const modes = {};
const canonical = Object.keys(source.semantic.dark).sort().join('|');
for (const [mode, aliases] of Object.entries(source.semantic)) {
  if (Object.keys(aliases).sort().join('|') !== canonical) throw new Error(`Incomplete ${mode} semantic map`);
  modes[mode] = Object.fromEntries(Object.entries(aliases).map(([key, alias]) => {
    if (!source.primitives[alias]) throw new Error(`Unknown primitive ${alias}`);
    return [key, source.primitives[alias]];
  }));
}
for (const [level, e] of Object.entries(source.elevation)) {
  for (const role of [e.surface, e.color]) if (!(role in source.semantic.dark)) throw new Error(`Elevation ${level}: unknown role ${role}`);
}
for (const [name, hex] of Object.entries(source.primitives)) {
  if (!/^#([0-9A-F]{6}|[0-9A-F]{8})$/.test(hex)) throw new Error(`Primitive ${name}: expected #RRGGBB or #RRGGBBAA, got ${hex}`);
}

// ---- Unit conversion for non-browser consumers ----
const round = (n, d = 6) => Number(n.toFixed(d)) + 0;
const parseLength = (value) => {
  const m = /^(-?[\d.]+)(rem|px|ch|em)?$/.exec(String(value));
  if (!m) throw new Error(`Unparseable length ${value}`);
  return { value: Number(m[1]), unit: m[2] ?? 'px' };
};
const toPx = (value) => {
  const { value: n, unit } = parseLength(value);
  if (unit === 'rem') return round(n * ROOT_PX, 4);
  if (unit === 'px') return n;
  throw new Error(`Cannot convert ${value} to px`);
};
const parseMs = (value) => { const m = /^([\d.]+)ms$/.exec(value); if (!m) throw new Error(`Unparseable duration ${value}`); return Number(m[1]); };
const EASINGS = { linear: [0, 0, 1, 1], ease: [0.25, 0.1, 0.25, 1], 'ease-in': [0.42, 0, 1, 1], 'ease-out': [0, 0, 0.58, 1], 'ease-in-out': [0.42, 0, 0.58, 1] };
const toBezier = (value) => {
  if (EASINGS[value]) return EASINGS[value];
  const m = /^cubic-bezier\(([^)]+)\)$/.exec(value);
  if (!m) throw new Error(`Unsupported easing ${value}`);
  return m[1].split(',').map(Number);
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

// ---- cosmik.json: simple kit-specific contract ----
const output = { name: source.name, version: source.version, status: source.status,
  description: 'Resolved semantic tokens. Use semantic tokens in components; primitives are reference values, not theme roles. All dimensions assume a 16px browser root. All-caps tracking is for labels only.',
  primitives: source.primitives, semantic: modes, aliases: source.semantic,
  space: source.space, layout: source.layout, type: source.type, motion: source.motion,
  proposals: source.proposals, radius: source.radius, breakpoint: source.breakpoint, elevation: source.elevation, native };
write('cosmik.json', toJson(output));

// ---- cosmik.css ----
let css = `/* Cosmik ${source.version} — PROPOSED. Generated by generate-tokens.mjs from cosmik.source.json. */\n`;
css += ':root {\n';
for (const [key, val] of Object.entries(source.primitives)) css += `  --c-primitive-${key}: ${val};\n`;
for (const group of ['space', 'layout', 'motion']) {
  for (const [key, val] of Object.entries(source[group])) css += `  --c-${group}-${key}: ${val};\n`;
}
for (const [role, values] of Object.entries(source.type)) {
  for (const [key, val] of Object.entries(values)) {
    const property = key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
    css += `  --c-type-${role}-${property}: ${key === 'fontFamily' ? JSON.stringify(val) : val};\n`;
  }
}
for (const [key, val] of Object.entries(source.radius)) css += `  --c-radius-${key}: ${val};\n`;
css += '  /* Breakpoints are reference values: custom properties cannot be used inside @media. */\n';
for (const [key, val] of Object.entries(source.breakpoint)) css += `  --c-breakpoint-${key}: ${val};\n`;
css += '}\n';
for (const [mode, aliases] of Object.entries(source.semantic)) {
  css += `\n${mode === 'dark' ? ':root, ' : ''}[data-theme="${mode}"] {\n  color-scheme: ${mode};\n`;
  for (const [key, alias] of Object.entries(aliases)) css += `  --c-${key}: var(--c-primitive-${alias});\n`;
  // Declared per theme so a nested theme scope resolves its own surface and shadow colour.
  for (const [level, e] of Object.entries(source.elevation)) {
    css += `  --c-elevation-${level}-surface: var(--c-primitive-${aliases[e.surface]});\n`;
    css += `  --c-elevation-${level}-shadow: ${e.offsetX} ${e.offsetY} ${e.blur} ${e.spread} var(--c-primitive-${aliases[e.color]});\n`;
  }
  css += '}\n';
}
css += '\n@media (prefers-reduced-motion: reduce) {\n  :root { --c-motion-duration: var(--c-motion-reduced-duration); }\n}\n';
write('cosmik.css', css);

// ---- cosmik.tokens.json: W3C Design Tokens Community Group format (2025.10) ----
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
  $description: `Cosmik ${source.version} — PROPOSED. Generated by generate-tokens.mjs from cosmik.source.json; do not edit. Colour roles in "color" resolve to the default dark theme; each carries $extensions["${MODES_EXT}"] with its alias in every theme (dark, light). Tools without mode support see the dark theme.`,
  $extensions: { 'com.cosmiklabs': { name: source.name, version: source.version, status: source.status, defaultMode: 'dark', modes: Object.keys(modes), proposals: source.proposals } },
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
write('cosmik.tokens.json', toJson(dtcg));

// ---- cosmik_tokens.rs: dependency-free Rust constants ----
const f32 = (n) => (Number.isInteger(n) ? `${n}.0` : String(n));
const arr = (a) => `[${a.map(f32).join(', ')}]`;
const ident = (s) => s.replace(/[^A-Za-z0-9]+/g, '_');
const CONST = (s) => { const id = ident(s).toUpperCase(); return /^\d/.test(id) ? `N${id}` : id; };
const field = (s) => ident(s).toLowerCase();
const rsColor = (hex) => { const c = color(hex); return `Color { hex: "${hex}", srgb: ${arr(c.srgb)}, linear: ${arr(c.linear)} }`; };
const roles = Object.keys(source.semantic.dark);
let rs = `// Cosmik ${source.version} — PROPOSED. Generated by tokens/generate-tokens.mjs from cosmik.source.json; do not edit.
// Dependency-free: include with \`#[path = "…/cosmik_tokens.rs"] mod cosmik_tokens;\` or copy into a crate.
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
rs += `\npub mod typography {\n    use super::TypeRole;\n${Object.entries(native.type).map(([k, t]) => `    pub const ${CONST(k)}: TypeRole = TypeRole { font_family: "${t.fontFamily}", font_weight: ${t.fontWeight}, font_size: ${f32(t.fontSizePx)}, line_height: ${f32(t.lineHeight)}, letter_spacing: ${f32(t.letterSpacing)}, uppercase: ${t.textTransform === 'uppercase'} };`).join('\n')}\n}\n`;
rs += `\npub mod motion {\n    pub const DURATION_MS: u32 = ${native.motion.durationMs};\n    pub const REDUCED_DURATION_MS: u32 = ${native.motion.reducedDurationMs};\n    /// Cubic-bezier control points [x1, y1, x2, y2].\n    pub const EASING: [f32; 4] = ${arr(native.motion.easing)};\n}\n`;
write('cosmik_tokens.rs', rs);

console.log(`Generated cosmik.css, cosmik.json, cosmik.tokens.json and cosmik_tokens.rs from one source; ${canonical.split('|').length} semantic roles × ${Object.keys(modes).length} complete modes.`);
