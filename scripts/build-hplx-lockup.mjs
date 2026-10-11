/** Builds the HPLX lockup: Ember centred above "HPLX" set in Spectral SemiBold, the letters as
 * outlines from the bundled font (SIL OFL 1.1), spaced by the font's advances and kerning plus the
 * source's tracking. Layout is in assets/hplx/hplx-lockup.source.json; Ember's geometry and colours
 * come from assets/hplx/ember.source.json. Node.js only. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { flatten, coverage, paintLayers, encodePng } from './vector-raster.mjs';
import { readFont, advance, outline } from './font-outlines.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'assets/hplx');
const read = p => fs.readFileSync(path.join(root, p));
const source = JSON.parse(read('assets/hplx/hplx-lockup.source.json'));
const ember = JSON.parse(read(source.symbol.source));
const font = readFont(read(source.font.path));
const [W, H] = source.canvas_px;
const round = v => Math.round(v * 1000) / 1000;
const move = (contours, f) => contours.map(c => c.map(([op, ...v]) => { const out = [op]; for (let i = 0; i < v.length; i += 2) out.push(...f(v[i], v[i + 1])); return out; }));
const bounds = contours => { const pts = contours.flatMap(flatten); return [Math.min(...pts.map(p => p[0])), Math.min(...pts.map(p => p[1])), Math.max(...pts.map(p => p[0])), Math.max(...pts.map(p => p[1]))]; };

// The word in font units (y up), each letter at its pen position.
const ids = [...source.text].map(c => font.glyphId(c.codePointAt(0)));
let pen = 0; const letters = [];
ids.forEach((id, i) => {
  letters.push(move(outline(font, id), (x, y) => [x + pen, y]));
  if (i < ids.length - 1) pen += advance(font, id) + font.kerning(id, ids[i + 1]) + source.tracking_em * font.unitsPerEm;
});
const scale = source.cap_height_px / font.capHeight;
const [fx0, , fx1] = bounds(letters.flat());
const wordWidth = (fx1 - fx0) * scale, cap = source.cap_height_px;

// Ember above the word, both centred; the pair centred on the banner.
const [sx, sy, sw, sh] = ember.source_reference.symbol_bounds_xywh;
const emberScale = source.symbol.width_of_wordmark * wordWidth / sw, emberHeight = sh * emberScale;
const top = (H - (emberHeight + source.symbol.gap_cap_heights * cap + cap)) / 2, baseline = top + emberHeight + source.symbol.gap_cap_heights * cap + cap;
const wordmark = letters.map(contours => move(contours, (x, y) => [round(W / 2 + (x - (fx0 + fx1) / 2) * scale), round(baseline - y * scale)]));
const symbol = ember.shapes.map(s => move([s.commands], (x, y) => [round(W / 2 + (x - sx - sw / 2) * emberScale), round(top + (y - sy) * emberScale)])[0]);

const pathData = contours => contours.map(c => c.map(([op, ...v]) => [op, ...v].join(' ')).join(' ')).join(' ');
const { amber, bone, ink, background } = ember.colours;
const variants = { primary: [amber, bone, background], amber: [amber, bone], bone: [bone, bone], ink: [ink, ink] };
function svg([symbolFill, wordFill, plate]) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc">
  <title id="title">HPLX</title>
  <desc id="desc">HPLX lockup: the Ember symbol above HPLX set in Spectral SemiBold, as outlines.</desc>
${plate ? `  <path id="background" fill="${plate}" d="M0 0H${W}V${H}H0Z"/>\n` : ''}  <path id="symbol" fill="${symbolFill}" d="${pathData(symbol)}"/>
  <path id="wordmark" fill="${wordFill}" d="${pathData(wordmark.flat())}"/>
</svg>
`;
}

const symbolShapes = symbol.map(c => [flatten(c)]), wordShapes = wordmark.map(contours => contours.map(flatten));
fs.mkdirSync(path.join(dir, 'png'), { recursive: true });
for (const size of [[W, H], [1024, Math.round(1024 * H / W)]]) {
  const view = [0, 0, W, H], symbolCover = coverage(symbolShapes, view, ...size), wordCover = coverage(wordShapes, view, ...size);
  for (const [variant, [symbolFill, wordFill, plate]] of Object.entries(variants)) {
    const pixels = paintLayers([{ cover: symbolCover, fill: symbolFill }, { cover: wordCover, fill: wordFill }], plate);
    fs.writeFileSync(path.join(dir, `png/hplx-lockup-${variant}-${size.join('x')}.png`), encodePng(...size, pixels));
  }
}
for (const [variant, fills] of Object.entries(variants)) fs.writeFileSync(path.join(dir, `hplx-lockup-${variant}.svg`), svg(fills));
const [ax0, ay0, ax1, ay1] = bounds([...symbol, ...wordmark.flat()]);
console.log(`Generated the HPLX lockup SVGs and PNGs; visible bounds ${[ax0, ay0, ax1 - ax0, ay1 - ay0].map(round).join(' ')}.`);
