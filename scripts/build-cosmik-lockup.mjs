/** Builds the Cosmik horizontal lockup from kits/cosmik/assets/vector/cosmik-lockup.source.json (traced by
 * scripts/trace-cosmik-lockup.mjs) and the accepted emblem master. Node.js only.
 * Every variant keeps the approved banner's composition and shares one geometry: the master's emblem
 * path under the traced placement, and the traced COSMIK wordmark. PNGs are the full banner size and
 * 1024 px wide. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePath, transformCommands, flatten, coverage, paint, encodePng } from './vector-raster.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'kits/cosmik/assets/vector');
const source = JSON.parse(fs.readFileSync(path.join(dir, 'cosmik-lockup.source.json'), 'utf8'));
const master = fs.readFileSync(path.join(root, source.emblem.master), 'utf8').match(/<path id="emblem"[^>]* d="([^"]+)"/)[1];
const wordmark = source.wordmark.glyphs.map(g => g.d).join(' ');
const [x, y, w, h] = source.viewBox;
const write = (name, content) => fs.writeFileSync(path.join(dir, name), content);

function svg(fill, background) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${source.viewBox.join(' ')}" role="img" aria-labelledby="title desc">
  <title id="title">Cosmik</title>
  <desc id="desc">Horizontal lockup: the accepted emblem master beside the COSMIK wordmark traced from the approved banner. Banner composition preserved.</desc>
${background ? `  <path id="background" fill="${background}" d="M${x} ${y}H${w}V${h}H${x}Z"/>\n` : ''}  <path id="emblem" fill="${fill}" fill-rule="evenodd" transform="matrix(${source.emblem.transform.join(' ')})" d="${master}"/>
  <path id="wordmark" fill="${fill}" fill-rule="evenodd" d="${wordmark}"/>
</svg>
`;
}

const shapes = [transformCommands(parsePath(master), source.emblem.transform).map(flatten), ...source.wordmark.glyphs.map(g => parsePath(g.d).map(flatten))];
const { offwhite, ink, background } = source.colours;
const variants = { offwhite: [offwhite], ink: [ink], primary: [offwhite, background] };
fs.mkdirSync(path.join(dir, 'png'), { recursive: true });
const full = coverage(shapes, source.viewBox, w, h), small = [1024, Math.round(1024 * h / w)], reduced = coverage(shapes, source.viewBox, ...small);
for (const [variant, [fill, plate]] of Object.entries(variants)) {
  write(`cosmik-lockup-${variant}.svg`, svg(fill, plate));
  write(`cosmik-lockup-${variant}.png`, encodePng(w, h, paint(full, fill, plate)));
  write(`png/cosmik-lockup-${variant}-${small.join('x')}.png`, encodePng(...small, paint(reduced, fill, plate)));
}
console.log('Generated the Cosmik lockup SVGs and PNGs from the traced banner geometry.');
