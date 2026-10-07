/** App-icon builder (run through `node scripts/build.mjs`).
 * Packs the existing plate-variant renders (assets/vector/png/cosmik-emblem-primary-*.png) into
 * cosmik.ico and cosmik.icns, and area-downsamples the 1024 px render to the 512 px and 180 px
 * (apple-touch) PNGs. Node.js only; no third-party packages. The embedded renders are used byte for
 * byte; no optical small-size redesign is implied (see asset-manifest.json known_gaps). */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const render = (size) => fs.readFileSync(path.join(root, `assets/vector/png/cosmik-emblem-primary-${size}.png`));
const out = (name, bytes) => fs.writeFileSync(path.join(root, 'icons', name), bytes);

// ---- Minimal PNG codec: 8-bit RGBA or RGB, non-interlaced ----
const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
function decodePng(buf) {
  if (!buf.subarray(0, 8).equals(SIGNATURE)) throw new Error('Not a PNG');
  let off = 8, ihdr, idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off), type = buf.toString('latin1', off + 4, off + 8), data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') ihdr = data; else if (type === 'IDAT') idat.push(data); else if (type === 'IEND') break;
    off += 12 + len;
  }
  const width = ihdr.readUInt32BE(0), height = ihdr.readUInt32BE(4), depth = ihdr[8], ctype = ihdr[9], interlace = ihdr[12];
  if (depth !== 8 || (ctype !== 6 && ctype !== 2) || interlace !== 0) throw new Error(`Unsupported PNG (depth ${depth}, type ${ctype}, interlace ${interlace})`);
  const bpp = ctype === 6 ? 4 : 3, stride = width * bpp, raw = zlib.inflateSync(Buffer.concat(idat));
  const px = Buffer.alloc(width * height * 4), prev = Buffer.alloc(stride), cur = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
      let p;
      if (f === 0) p = 0; else if (f === 1) p = a; else if (f === 2) p = b; else if (f === 3) p = (a + b) >> 1;
      else if (f === 4) { const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c); p = pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      else throw new Error(`Bad filter ${f}`);
      cur[i] = (line[i] + p) & 255;
    }
    for (let x = 0; x < width; x++) for (let k = 0; k < 4; k++) px[(y * width + x) * 4 + k] = k < bpp ? cur[x * bpp + k] : 255;
    cur.copy(prev);
  }
  return { width, height, px };
}
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = (b) => { let c = -1; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
const chunk = (type, data) => {
  const head = Buffer.alloc(8); head.writeUInt32BE(data.length, 0); head.write(type, 4, 'latin1');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
};
function encodePng({ width, height, px }) {
  const stride = width * 4, rows = [];
  for (let y = 0; y < height; y++) {
    const line = px.subarray(y * stride, (y + 1) * stride), prev = y ? px.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride);
    let best;
    for (let f = 0; f <= 4; f++) { // Adaptive filter: smallest sum of absolute residuals.
      const row = Buffer.alloc(stride + 1); row[0] = f; let score = 0;
      for (let i = 0; i < stride; i++) {
        const a = i >= 4 ? line[i - 4] : 0, b = prev[i], c = i >= 4 ? prev[i - 4] : 0;
        const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c);
        const p = [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][f];
        row[i + 1] = (line[i] - p) & 255; score += row[i + 1] < 128 ? row[i + 1] : 256 - row[i + 1];
      }
      if (!best || score < best.score) best = { row, score };
    }
    rows.push(best.row);
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([SIGNATURE, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(Buffer.concat(rows), { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// ---- Area-average downsampling with premultiplied alpha ----
function downsample({ width, height, px }, size) {
  const axis = (n) => { // For each output index, the source indices and their coverage weights.
    const s = n / size;
    return Array.from({ length: size }, (_, o) => {
      const lo = o * s, hi = lo + s, taps = [];
      for (let i = Math.floor(lo); i < Math.ceil(hi); i++) taps.push([i, Math.min(hi, i + 1) - Math.max(lo, i)]);
      return taps.map(([i, w]) => [i, w / s]);
    });
  };
  const xs = axis(width), ys = axis(height), tmp = new Float64Array(size * height * 4), dst = Buffer.alloc(size * size * 4);
  for (let y = 0; y < height; y++) for (let o = 0; o < size; o++) for (const [x, w] of xs[o]) {
    const s = (y * width + x) * 4, a = px[s + 3] / 255, d = (y * size + o) * 4;
    tmp[d] += px[s] * a * w; tmp[d + 1] += px[s + 1] * a * w; tmp[d + 2] += px[s + 2] * a * w; tmp[d + 3] += a * w;
  }
  for (let o = 0; o < size; o++) for (let x = 0; x < size; x++) {
    const acc = [0, 0, 0, 0];
    for (const [y, w] of ys[o]) for (let k = 0; k < 4; k++) acc[k] += tmp[(y * size + x) * 4 + k] * w;
    const d = (o * size + x) * 4, a = acc[3];
    for (let k = 0; k < 3; k++) dst[d + k] = a > 0 ? Math.min(255, Math.round(acc[k] / a)) : 0;
    dst[d + 3] = Math.min(255, Math.round(a * 255));
  }
  return { width: size, height: size, px: dst };
}

// ---- Outputs ----
const master = decodePng(render(1024));
const png512 = encodePng(downsample(master, 512));
out('cosmik-512.png', png512);
out('cosmik-apple-touch-180.png', encodePng(downsample(master, 180)));

const icoSizes = [16, 24, 32, 48, 64, 256];
const icoImages = icoSizes.map(render);
const ico = Buffer.alloc(6 + 16 * icoSizes.length);
ico.writeUInt16LE(0, 0); ico.writeUInt16LE(1, 2); ico.writeUInt16LE(icoSizes.length, 4);
let offset = ico.length;
icoSizes.forEach((size, i) => {
  const e = 6 + 16 * i;
  ico[e] = size === 256 ? 0 : size; ico[e + 1] = size === 256 ? 0 : size; ico[e + 2] = 0; ico[e + 3] = 0;
  ico.writeUInt16LE(1, e + 4); ico.writeUInt16LE(32, e + 6);
  ico.writeUInt32LE(icoImages[i].length, e + 8); ico.writeUInt32LE(offset, e + 12);
  offset += icoImages[i].length;
});
out('cosmik.ico', Buffer.concat([ico, ...icoImages]));

// ICNS PNG element types: icp4 16, icp5 32, icp6 64, ic07 128, ic08 256, ic09 512, ic10 1024 (512@2x),
// ic11 32 (16@2x), ic12 64 (32@2x), ic13 256 (128@2x), ic14 512 (256@2x).
const icnsEntries = [['icp4', render(16)], ['icp5', render(32)], ['icp6', render(64)], ['ic07', render(128)], ['ic08', render(256)],
  ['ic09', png512], ['ic10', render(1024)], ['ic11', render(32)], ['ic12', render(64)], ['ic13', render(256)], ['ic14', png512]];
const elements = icnsEntries.map(([type, data]) => { const h = Buffer.alloc(8); h.write(type, 0, 'latin1'); h.writeUInt32BE(8 + data.length, 4); return Buffer.concat([h, data]); });
const icnsHead = Buffer.alloc(8); icnsHead.write('icns', 0, 'latin1');
icnsHead.writeUInt32BE(8 + elements.reduce((n, e) => n + e.length, 0), 4);
out('cosmik.icns', Buffer.concat([icnsHead, ...elements]));

console.log(`Generated icons/cosmik.ico (${icoSizes.join('/')}), cosmik.icns, cosmik-512.png and cosmik-apple-touch-180.png from the plate variant.`);
