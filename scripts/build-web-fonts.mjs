/** Web-font builder (run through `node scripts/build.mjs`).
 * Wraps each TTF in FONTS as WOFF 2.0 (W3C REC): IBM Plex Mono Regular for the baseline and Spectral
 * SemiBold for the HPLX family's headings.
 * Every table is stored unchanged with the null transform (glyf/loca version 3), compressed with
 * Node's built-in Brotli; no glyph, metric or name data is altered. The script decodes its own output
 * and checks that every table round-trips byte for byte. Node.js only; no third-party packages. */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FONTS = [
  ['fonts/web/IBMPlexMono-Regular.ttf', 'fonts/web/IBMPlexMono-Regular.woff2'],
  ['fonts/desktop/Spectral-SemiBold.ttf', 'fonts/web/Spectral-SemiBold.woff2'],
];

// WOFF2 known-table index (W3C WOFF2 §5.1, table 1).
const KNOWN = ['cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT',
  'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH', 'CBDT', 'CBLC',
  'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar', 'gvar', 'hsty', 'just', 'lcar',
  'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill'];
const round4 = (n) => (n + 3) & ~3;
const base128 = (n) => { const out = [n & 0x7f]; while ((n >>>= 7)) out.unshift(0x80 | (n & 0x7f)); return Buffer.from(out); };
const readBase128 = (buf, off) => { let n = 0; for (let i = 0; i < 5; i++) { const b = buf[off + i]; n = n * 128 + (b & 0x7f); if (!(b & 0x80)) return [n, off + i + 1]; } throw new Error('Bad UIntBase128'); };

function readSfnt(buf) {
  const flavor = buf.readUInt32BE(0), numTables = buf.readUInt16BE(4), tables = [];
  if (flavor !== 0x00010000) throw new Error('Only TrueType-flavoured fonts are supported');
  for (let i = 0; i < numTables; i++) {
    const e = 12 + 16 * i;
    tables.push({ tag: buf.toString('latin1', e, e + 4), data: buf.subarray(buf.readUInt32BE(e + 8), buf.readUInt32BE(e + 8) + buf.readUInt32BE(e + 12)) });
  }
  // Directory order is the stream order; loca immediately follows glyf, as WOFF2 decoders expect.
  tables.sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0));
  const glyf = tables.findIndex((t) => t.tag === 'glyf'), loca = tables.findIndex((t) => t.tag === 'loca');
  if (glyf >= 0 && loca >= 0) tables.splice(glyf + 1, 0, ...tables.splice(loca, 1));
  return { flavor, tables };
}

function encodeWoff2({ flavor, tables }) {
  const dir = Buffer.concat(tables.map(({ tag, data }) => {
    const index = KNOWN.indexOf(tag);
    const nullTransform = tag === 'glyf' || tag === 'loca' ? 3 : 0;
    const flags = Buffer.from([(nullTransform << 6) | (index >= 0 ? index : 63)]);
    const tagBytes = index >= 0 ? Buffer.alloc(0) : Buffer.from(tag, 'latin1');
    return Buffer.concat([flags, tagBytes, base128(data.length)]);
  }));
  const stream = Buffer.concat(tables.map((t) => t.data));
  const compressed = zlib.brotliCompressSync(stream, { params: {
    [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_FONT,
    [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
    [zlib.constants.BROTLI_PARAM_LGWIN]: 24,
    [zlib.constants.BROTLI_PARAM_SIZE_HINT]: stream.length } });
  const totalSfntSize = 12 + 16 * tables.length + tables.reduce((n, t) => n + round4(t.data.length), 0);
  const length = round4(48 + dir.length + compressed.length);
  const head = tables.find((t) => t.tag === 'head').data;
  const header = Buffer.alloc(48);
  header.write('wOF2', 0, 'latin1'); header.writeUInt32BE(flavor, 4); header.writeUInt32BE(length, 8);
  header.writeUInt16BE(tables.length, 12); header.writeUInt32BE(totalSfntSize, 16); header.writeUInt32BE(compressed.length, 20);
  header.writeUInt16BE(head.readUInt16BE(4), 24); header.writeUInt16BE(head.readUInt16BE(6), 26); // fontRevision as major.minor
  return Buffer.concat([header, dir, compressed, Buffer.alloc(length - 48 - dir.length - compressed.length)]);
}

function decodeWoff2(buf) {
  if (buf.toString('latin1', 0, 4) !== 'wOF2' || buf.readUInt32BE(8) !== buf.length) throw new Error('Bad WOFF2 header');
  const numTables = buf.readUInt16BE(12), compressedLength = buf.readUInt32BE(20), entries = [];
  let off = 48;
  for (let i = 0; i < numTables; i++) {
    const flags = buf[off++], index = flags & 63;
    let tag = KNOWN[index];
    if (index === 63) { tag = buf.toString('latin1', off, off + 4); off += 4; }
    let length; [length, off] = readBase128(buf, off);
    entries.push({ tag, length });
  }
  const stream = zlib.brotliDecompressSync(buf.subarray(off, off + compressedLength));
  let at = 0;
  return entries.map(({ tag, length }) => ({ tag, data: stream.subarray(at, (at += length)) }));
}

for (const [from, to] of FONTS) {
  const sfnt = readSfnt(fs.readFileSync(path.join(root, from)));
  const woff2 = encodeWoff2(sfnt);
  const back = decodeWoff2(woff2);
  if (back.length !== sfnt.tables.length || back.some((t, i) => t.tag !== sfnt.tables[i].tag || !t.data.equals(sfnt.tables[i].data))) throw new Error(`${to}: round trip failed`);
  fs.writeFileSync(path.join(root, to), woff2);
  console.log(`Generated ${to} from ${from}: ${sfnt.tables.length} tables, round trip verified.`);
}
