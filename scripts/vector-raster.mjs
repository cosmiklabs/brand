/** Vector paths to antialiased pixels, and a minimal PNG codec, for the Cosmik lockup's tracer and builder
 * and for family mark builders that vendor this script from a brand release.
 * Coverage is exact horizontal pixel area at sixteen vertical subpixel positions; each shape fills
 * even-odd, so a letter's counter stays open. Node.js only. */
import zlib from 'node:zlib';

/** SVG path data (M, L, C, Z; commas or spaces) as contours of [op, ...numbers] commands. */
export function parsePath(d) {
  // Keep unknown tokens so an unsupported command cannot silently become numbers
  // for the preceding command. Relative commands are deliberately not supported.
  const tokens = d.match(/[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?|[A-Za-z]|[^\s,]/g) ?? [];
  const contours = []; let op, i = 0;
  while (i < tokens.length) {
    if (/^[A-Za-z]$/.test(tokens[i])) op = tokens[i++];
    const count = { M: 2, L: 2, C: 6, Z: 0 }[op];
    if (count === undefined) throw Error(`Unsupported path command ${op ?? tokens[i]}`);
    const values = tokens.slice(i, i + count).map(Number);
    if (values.length !== count || values.some(value => !Number.isFinite(value))) throw Error(`Incomplete or invalid ${op} path command`);
    i += count;
    if (op === 'M') contours.push([['M', ...values]]);
    else {
      if (!contours.length) throw Error('A path must start with M');
      contours.at(-1).push([op, ...values]);
    }
    if (op === 'M') op = 'L';
    if (count === 0) op = undefined;
  }
  if (!contours.length) throw Error('A path must contain a contour');
  return contours;
}

/** Commands moved by the affine matrix [a, b, c, d, e, f] (as SVG's matrix()). */
export function transformCommands(contours, [a, b, c, d, e, f]) {
  const at = (x, y) => [a * x + c * y + e, b * x + d * y + f];
  return contours.map(contour => contour.map(([op, ...v]) => {
    const out = [op];
    for (let i = 0; i < v.length; i += 2) out.push(...at(v[i], v[i + 1]));
    return out;
  }));
}

const midpoint = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
// Flatten cubic curves to < 0.01 unit control-point distance from a chord.
function flattenCubic(a, b, c, d, out, depth = 0) {
  const dx = d[0] - a[0], dy = d[1] - a[1], length = Math.hypot(dx, dy);
  const distance = p => length ? Math.abs(dy * (p[0] - a[0]) - dx * (p[1] - a[1])) / length : Math.hypot(p[0] - a[0], p[1] - a[1]);
  if (depth >= 16 || Math.max(distance(b), distance(c)) <= 0.01) { out.push(d); return; }
  const ab = midpoint(a, b), bc = midpoint(b, c), cd = midpoint(c, d), abc = midpoint(ab, bc), bcd = midpoint(bc, cd), m = midpoint(abc, bcd);
  flattenCubic(a, ab, abc, m, out, depth + 1); flattenCubic(m, bcd, cd, d, out, depth + 1);
}

/** A contour as a closed polygon. */
export function flatten(contour) {
  const points = []; let current;
  for (const [op, ...v] of contour) {
    if (op === 'M' || op === 'L') { current = v; points.push(v); }
    else if (op === 'C') { const end = v.slice(4, 6); flattenCubic(current, v.slice(0, 2), v.slice(2, 4), end, points); current = end; }
  }
  const [first, last] = [points[0], points.at(-1)];
  if (first[0] !== last[0] || first[1] !== last[1]) points.push(first);
  return points;
}

/** Pixel coverage (0–1) of `shapes` (each a list of polygons, filled even-odd) seen through `viewBox`. */
export function coverage(shapes, viewBox, width, height, samples = 16) {
  const [vx, vy, vw, vh] = viewBox, cover = new Float64Array(width * height);
  const scaled = shapes.map(polygons => polygons.map(points => points.map(([x, y]) => [(x - vx) * width / vw, (y - vy) * height / vh])));
  for (let sy = 0; sy < height * samples; sy++) {
    const y = (sy + 0.5) / samples, row = Math.floor(sy / samples);
    for (const polygons of scaled) {
      const xs = [];
      for (const points of polygons) for (let i = 1; i < points.length; i++) {
        const a = points[i - 1], b = points[i];
        if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i < xs.length; i += 2) {
        const lo = Math.max(0, xs[i]), hi = Math.min(width, xs[i + 1]);
        for (let x = Math.floor(lo); x < Math.ceil(hi); x++) cover[row * width + x] += Math.max(0, Math.min(x + 1, hi) - Math.max(x, lo)) / samples;
      }
    }
  }
  return cover;
}

const rgb = hex => hex.slice(1).match(/../g).map(x => parseInt(x, 16));
/** RGBA pixels: `fill` over `background`, or over transparency when there is none. */
export function paint(cover, fill, background) {
  const pixels = Buffer.alloc(cover.length * 4), fg = rgb(fill), bg = background ? rgb(background) : null;
  for (let i = 0; i < cover.length; i++) {
    const a = Math.min(1, cover[i]), p = i * 4;
    for (let c = 0; c < 3; c++) pixels[p + c] = bg ? Math.round(fg[c] * a + bg[c] * (1 - a)) : (a ? fg[c] : 0);
    pixels[p + 3] = bg ? 255 : Math.round(a * 255);
  }
  return pixels;
}

/** RGBA pixels of several fills that never overlap (a symbol and a wordmark in different colours). */
export function paintLayers(layers, background) {
  const n = layers[0].cover.length, pixels = Buffer.alloc(n * 4), bg = background ? rgb(background) : null, fills = layers.map(l => rgb(l.fill));
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    let a = 0; const c = [0, 0, 0];
    layers.forEach((layer, k) => { const ak = Math.min(1, layer.cover[i]); a += ak; for (let j = 0; j < 3; j++) c[j] += fills[k][j] * ak; });
    const total = a; a = Math.min(1, a);
    for (let j = 0; j < 3; j++) pixels[p + j] = bg ? Math.round(c[j] + bg[j] * (1 - a)) : (total ? Math.round(c[j] / total) : 0);
    pixels[p + 3] = bg ? 255 : Math.round(a * 255);
  }
  return pixels;
}

const crcTable = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = bytes => { let c = 0xffffffff; for (const b of bytes) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const h = Buffer.alloc(8), t = Buffer.from(type), crc = Buffer.alloc(4); h.writeUInt32BE(data.length); t.copy(h, 4); crc.writeUInt32BE(crc32(Buffer.concat([t, data]))); return Buffer.concat([h, data, crc]); };
const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

/** An 8-bit RGBA PNG. */
export function encodePng(width, height, pixels) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0 || pixels.length !== width * height * 4) throw Error('PNG dimensions must match RGBA pixels');
  const rows = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) pixels.copy(rows, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  const header = Buffer.alloc(13); header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 6;
  return Buffer.concat([SIGNATURE, chunk('IHDR', header), chunk('IDAT', zlib.deflateSync(rows, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

/** An 8-bit RGB or RGBA, non-interlaced PNG as { width, height, rgba }. */
export function decodePng(buf) {
  if (!buf.subarray(0, 8).equals(SIGNATURE)) throw Error('Not a PNG');
  let at = 8, ihdr, ended = false; const idat = [];
  while (at < buf.length) {
    if (buf.length - at < 12) throw Error('Truncated PNG chunk');
    const n = buf.readUInt32BE(at), type = buf.toString('latin1', at + 4, at + 8);
    if (n > buf.length - at - 12) throw Error(`Truncated PNG ${type} chunk`);
    if (buf.readUInt32BE(at + 8 + n) !== crc32(buf.subarray(at + 4, at + 8 + n))) throw Error(`Invalid PNG ${type} checksum`);
    if (!ihdr && type !== 'IHDR') throw Error('PNG must begin with IHDR');
    if (type === 'IHDR') {
      if (ihdr || n !== 13) throw Error('Invalid PNG IHDR');
      ihdr = buf.subarray(at + 8, at + 8 + n);
    } else if (type === 'IDAT') idat.push(buf.subarray(at + 8, at + 8 + n));
    else if (type === 'IEND') {
      if (n !== 0 || at + 12 !== buf.length) throw Error('Invalid PNG end');
      ended = true;
    } else if (/^[A-Z]/.test(type) && type !== 'PLTE') throw Error(`Unsupported PNG ${type} chunk`);
    at += n + 12;
  }
  if (!ihdr || !idat.length || !ended) throw Error('Incomplete PNG');
  const width = ihdr.readUInt32BE(0), height = ihdr.readUInt32BE(4), type = ihdr[9];
  if (!width || !height || ihdr[8] !== 8 || (type !== 2 && type !== 6) || ihdr[10] !== 0 || ihdr[11] !== 0 || ihdr[12] !== 0) throw Error('Unsupported PNG');
  const bpp = type === 6 ? 4 : 3, stride = width * bpp;
  const expectedLength = height * (stride + 1);
  const raw = zlib.inflateSync(Buffer.concat(idat), { maxOutputLength: expectedLength });
  if (raw.length !== expectedLength) throw Error('PNG scanline data does not match dimensions');
  const px = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)], line = y * (stride + 1) + 1;
    if (filter > 4) throw Error(`Invalid PNG filter ${filter}`);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[y * stride + x - bpp] : 0, up = y ? px[(y - 1) * stride + x] : 0, c = x >= bpp && y ? px[(y - 1) * stride + x - bpp] : 0;
      const p = a + up - c, pa = Math.abs(p - a), pb = Math.abs(p - up), pc = Math.abs(p - c);
      px[y * stride + x] = (raw[line + x] + [0, a, up, (a + up) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? up : c][filter]) & 255;
    }
  }
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) for (let c = 0; c < 4; c++) rgba[i * 4 + c] = c < bpp ? px[i * bpp + c] : 255;
  return { width, height, rgba };
}
