/** Letter outlines from a TrueType font, for setting a wordmark as paths. Node.js only.
 * Reads cmap (format 4), hmtx, loca and glyf (simple glyphs), and the GPOS `kern` feature's pair
 * adjustments, so a word is spaced as the font spaces it. Quadratic outlines become cubic commands. */

export function readFont(buf) {
  const tables = {};
  for (let i = 0; i < buf.readUInt16BE(4); i++) {
    const at = 12 + i * 16;
    tables[buf.toString('latin1', at, at + 4)] = buf.readUInt32BE(at + 8);
  }
  const head = tables.head, longLoca = buf.readInt16BE(head + 50) === 1;
  const unitsPerEm = buf.readUInt16BE(head + 18), capHeight = buf.readInt16BE(tables['OS/2'] + 88);
  const metrics = buf.readUInt16BE(tables.hhea + 34);
  return { buf, tables, longLoca, unitsPerEm, capHeight, metrics, glyphId: cmap(buf, tables.cmap), kerning: kerning(buf, tables.GPOS) };
}

function cmap(buf, table) {
  for (let i = 0; i < buf.readUInt16BE(table + 2); i++) {
    const record = table + 4 + i * 8, platform = buf.readUInt16BE(record), encoding = buf.readUInt16BE(record + 2);
    const sub = table + buf.readUInt32BE(record + 4);
    if (platform !== 3 || encoding !== 1 || buf.readUInt16BE(sub) !== 4) continue;
    const segments = buf.readUInt16BE(sub + 6) / 2, ends = sub + 14, starts = ends + segments * 2 + 2, deltas = starts + segments * 2, ranges = deltas + segments * 2;
    return code => {
      for (let s = 0; s < segments; s++) {
        if (code > buf.readUInt16BE(ends + s * 2) || code < buf.readUInt16BE(starts + s * 2)) continue;
        const delta = buf.readInt16BE(deltas + s * 2), range = buf.readUInt16BE(ranges + s * 2);
        if (!range) return (code + delta) & 0xffff;
        const id = buf.readUInt16BE(ranges + s * 2 + range + (code - buf.readUInt16BE(starts + s * 2)) * 2);
        return id ? (id + delta) & 0xffff : 0;
      }
      return 0;
    };
  }
  throw Error('No Unicode BMP cmap');
}

export function advance(font, id) {
  const { buf, tables, metrics } = font;
  return buf.readUInt16BE(tables.hmtx + Math.min(id, metrics - 1) * 4);
}

/** A glyph's contours as [op, ...numbers] commands in font units (y up). */
export function outline(font, id) {
  const { buf, tables, longLoca } = font;
  const loca = i => longLoca ? buf.readUInt32BE(tables.loca + i * 4) : buf.readUInt16BE(tables.loca + i * 2) * 2;
  const start = tables.glyf + loca(id);
  if (loca(id + 1) === loca(id)) return [];
  const count = buf.readInt16BE(start);
  if (count < 0) throw Error(`Glyph ${id} is composite`);
  const ends = Array.from({ length: count }, (_, i) => buf.readUInt16BE(start + 10 + i * 2));
  const points = ends.at(-1) + 1;
  let at = start + 10 + count * 2; at += 2 + buf.readUInt16BE(at);
  const flags = [];
  while (flags.length < points) {
    const flag = buf[at++]; flags.push(flag);
    if (flag & 8) for (let r = buf[at++]; r > 0; r--) flags.push(flag);
  }
  const coords = (short, same) => {
    let v = 0;
    return flags.map(flag => {
      if (flag & short) v += (flag & same ? 1 : -1) * buf[at++];
      else if (!(flag & same)) { v += buf.readInt16BE(at); at += 2; }
      return v;
    });
  };
  const xs = coords(2, 16), ys = coords(4, 32);
  const contours = []; let first = 0;
  for (const end of ends) {
    const pts = []; for (let i = first; i <= end; i++) pts.push({ x: xs[i], y: ys[i], on: (flags[i] & 1) === 1 });
    first = end + 1;
    contours.push(quadraticToCubic(pts));
  }
  return contours;
}

function quadraticToCubic(pts) {
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, on: true });
  // Start on a point that is on the curve (or between two that are not).
  const at = pts.findIndex(p => p.on), ring = at < 0 ? [mid(pts[0], pts[1]), ...pts.slice(1), pts[0]] : [...pts.slice(at), ...pts.slice(0, at)];
  const startPoint = ring[0], out = [['M', startPoint.x, startPoint.y]];
  let current = startPoint, control = null;
  const curveTo = (c, end) => out.push(['C', current.x + 2 / 3 * (c.x - current.x), current.y + 2 / 3 * (c.y - current.y), end.x + 2 / 3 * (c.x - end.x), end.y + 2 / 3 * (c.y - end.y), end.x, end.y]);
  for (const p of [...ring.slice(1), startPoint]) {
    if (p.on) { if (control) curveTo(control, p); else out.push(['L', p.x, p.y]); control = null; current = p; }
    else if (control) { const m = mid(control, p); curveTo(control, m); current = m; control = p; }
    else control = p;
  }
  out.push(['Z']);
  return out;
}

/** The kern feature's pair adjustment (first glyph's x advance) as kern(left, right) in font units. */
function kerning(buf, gpos) {
  if (!gpos) return () => 0;
  const featureList = gpos + buf.readUInt16BE(gpos + 6), lookupList = gpos + buf.readUInt16BE(gpos + 8);
  const lookups = new Set();
  for (let i = 0; i < buf.readUInt16BE(featureList); i++) {
    const record = featureList + 2 + i * 6;
    if (buf.toString('latin1', record, record + 4) !== 'kern') continue;
    const feature = featureList + buf.readUInt16BE(record + 4);
    for (let k = 0; k < buf.readUInt16BE(feature + 2); k++) lookups.add(buf.readUInt16BE(feature + 4 + k * 2));
  }
  const coverage = table => {
    const format = buf.readUInt16BE(table), n = buf.readUInt16BE(table + 2);
    return id => {
      if (format === 1) { for (let i = 0; i < n; i++) if (buf.readUInt16BE(table + 4 + i * 2) === id) return i; return -1; }
      for (let i = 0; i < n; i++) { const r = table + 4 + i * 6, lo = buf.readUInt16BE(r), hi = buf.readUInt16BE(r + 2); if (id >= lo && id <= hi) return buf.readUInt16BE(r + 4) + id - lo; }
      return -1;
    };
  };
  const classOf = table => {
    const format = buf.readUInt16BE(table);
    return id => {
      if (format === 1) { const start = buf.readUInt16BE(table + 2), n = buf.readUInt16BE(table + 4); return id >= start && id < start + n ? buf.readUInt16BE(table + 6 + (id - start) * 2) : 0; }
      for (let i = 0; i < buf.readUInt16BE(table + 2); i++) { const r = table + 4 + i * 6; if (id >= buf.readUInt16BE(r) && id <= buf.readUInt16BE(r + 2)) return buf.readUInt16BE(r + 4); }
      return 0;
    };
  };
  const size = format => { let n = 0; for (let bit = format; bit; bit >>= 1) n += bit & 1; return n * 2; };
  // The x advance is the third field a value record can hold (XPlacement, YPlacement, XAdvance, …).
  const xAdvance = (at, format) => format & 4 ? buf.readInt16BE(at + ((format & 1) ? 2 : 0) + ((format & 2) ? 2 : 0)) : 0;
  const subtables = [];
  for (const index of [...lookups].sort((a, b) => a - b)) {
    const lookup = lookupList + buf.readUInt16BE(lookupList + 2 + index * 2);
    const lookupType = buf.readUInt16BE(lookup);
    for (let s = 0; s < buf.readUInt16BE(lookup + 4); s++) {
      let table = lookup + buf.readUInt16BE(lookup + 6 + s * 2), type = lookupType;
      if (type === 9) { type = buf.readUInt16BE(table + 2); table += buf.readUInt32BE(table + 4); }
      if (type === 2) subtables.push(table);
    }
  }
  return (left, right) => {
    for (const table of subtables) {
      const format = buf.readUInt16BE(table), covered = coverage(table + buf.readUInt16BE(table + 2))(left);
      if (covered < 0) continue;
      const f1 = buf.readUInt16BE(table + 4), f2 = buf.readUInt16BE(table + 6), record = size(f1) + size(f2);
      if (format === 1) {
        const set = table + buf.readUInt16BE(table + 10 + covered * 2);
        for (let i = 0; i < buf.readUInt16BE(set); i++) { const r = set + 2 + i * (2 + record); if (buf.readUInt16BE(r) === right) return xAdvance(r + 2, f1); }
      } else {
        const c1 = classOf(table + buf.readUInt16BE(table + 8))(left), c2 = classOf(table + buf.readUInt16BE(table + 10))(right), classes2 = buf.readUInt16BE(table + 14);
        // A class-pair subtable that covers the left glyph decides, even when its value is zero.
        return xAdvance(table + 16 + (c1 * classes2 + c2) * record, f1);
      }
    }
    return 0;
  };
}
