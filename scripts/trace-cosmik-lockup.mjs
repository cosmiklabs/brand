/** Traces the horizontal lockup from the approved banner (kits/cosmik/assets/approved-raster/cosmik-banner-original.png),
 * which stays unchanged. The COSMIK letters are outlined from the banner's own silhouette; the emblem is
 * the accepted vector master, scaled and placed where the banner shows it, so one emblem shape serves
 * every asset. Writes kits/cosmik/assets/vector/cosmik-lockup.source.json (what scripts/build-cosmik-lockup.mjs
 * builds from) and the evidence in kits/cosmik/validation/ (lockup-qa.json, lockup-trace-overlay.png).
 * A one-time derivation, kept to reproduce or audit it: node scripts/trace-cosmik-lockup.mjs. Node.js only. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parsePath, transformCommands, flatten, coverage, decodePng, encodePng } from './vector-raster.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = 'kits/cosmik/assets/approved-raster/cosmik-banner-original.png';
const MASTER = 'kits/cosmik/assets/vector/cosmik-emblem-master-offwhite.svg';
// The emblem trace's silhouette threshold (kits/cosmik/validation/vector-qa.json): mean RGB above it is the mark.
const THRESHOLD = 123;
// Largest distance, in source pixels, a fitted curve or line may leave the smoothed outline.
const TOLERANCE = 0.5;

const bytes = fs.readFileSync(path.join(root, SOURCE));
const { width: W, height: H, rgba } = decodePng(bytes);
const gray = new Float64Array(W * H);
for (let i = 0; i < W * H; i++) gray[i] = (rgba[i * 4] + rgba[i * 4 + 1] + rgba[i * 4 + 2]) / 3;
const mark = Uint8Array.from(gray, g => g > THRESHOLD ? 1 : 0);

// ---- The banner's shapes: the emblem's (left) and one per letter ----
function components(mask) {
  const seen = new Uint8Array(W * H), found = [];
  for (let i = 0; i < W * H; i++) if (mask[i] && !seen[i]) {
    const box = { x0: W, y0: H, x1: 0, y1: 0 }, stack = [i]; seen[i] = 1;
    while (stack.length) {
      const p = stack.pop(), x = p % W, y = (p - x) / W;
      box.x0 = Math.min(box.x0, x); box.x1 = Math.max(box.x1, x); box.y0 = Math.min(box.y0, y); box.y1 = Math.max(box.y1, y);
      for (const q of [x ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y ? p - W : -1, y < H - 1 ? p + W : -1]) if (q >= 0 && mask[q] && !seen[q]) { seen[q] = 1; stack.push(q); }
    }
    found.push(box);
  }
  return found.sort((a, b) => a.x0 - b.x0);
}
const shapes = components(mark);
// Letters stand apart from the emblem: the six tall shapes right of the widest gap.
const letters = shapes.filter(s => s.y1 - s.y0 > 100 && s.x0 > W * 0.38);
const LETTERS = 'COSMIK';
if (letters.length !== LETTERS.length) throw Error(`Expected ${LETTERS.length} letters, found ${letters.length}`);
const emblemRight = Math.min(...letters.map(l => l.x0)) - 1;

// ---- Outlines at the threshold, with sub-pixel positions (marching squares) ----
const value = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : gray[y * W + x];
function outlines(box) {
  const segments = new Map(), link = (a, b) => { for (const [k, o] of [[a, b], [b, a]]) (segments.get(k.key) ?? segments.set(k.key, []).get(k.key)).push({ from: k, to: o }); };
  const edge = (key, x, y) => ({ key, x, y });
  // A sample (x, y) is the centre of pixel x, y: (x + 0.5, y + 0.5).
  const cut = (a, b) => (THRESHOLD - a) / (b - a);
  for (let y = box.y0 - 2; y <= box.y1 + 1; y++) for (let x = box.x0 - 2; x <= box.x1 + 1; x++) {
    const tl = value(x, y), tr = value(x + 1, y), br = value(x + 1, y + 1), bl = value(x, y + 1);
    const inside = v => v > THRESHOLD, code = (inside(tl) << 3) | (inside(tr) << 2) | (inside(br) << 1) | inside(bl);
    if (code === 0 || code === 15) continue;
    const T = () => edge(`h${x},${y}`, x + 0.5 + cut(tl, tr), y + 0.5), B = () => edge(`h${x},${y + 1}`, x + 0.5 + cut(bl, br), y + 1.5);
    const L = () => edge(`v${x},${y}`, x + 0.5, y + 0.5 + cut(tl, bl)), R = () => edge(`v${x + 1},${y}`, x + 1.5, y + 0.5 + cut(tr, br));
    const centre = inside((tl + tr + br + bl) / 4);
    const pairs = {
      1: [[L, B]], 2: [[B, R]], 3: [[L, R]], 4: [[T, R]], 6: [[T, B]], 7: [[L, T]], 8: [[L, T]], 9: [[T, B]],
      11: [[T, R]], 12: [[L, R]], 13: [[B, R]], 14: [[L, B]],
      5: centre ? [[L, T], [B, R]] : [[T, R], [L, B]], 10: centre ? [[T, R], [L, B]] : [[L, T], [B, R]],
    }[code];
    for (const [a, b] of pairs) link(a(), b());
  }
  const used = new Set(), loops = [];
  for (const [startKey] of segments) {
    if (used.has(startKey)) continue;
    const loop = []; let key = startKey, previous = null;
    while (!used.has(key)) {
      used.add(key);
      const ends = segments.get(key);
      loop.push([ends[0].from.x, ends[0].from.y]);
      const next = ends.find(e => e.to.key !== previous) ?? ends[0];
      previous = key; key = next.to.key;
    }
    if (loop.length > 8) loops.push(loop);
  }
  return loops;
}

// ---- Fitting: corners kept sharp, everything between them as few cubic curves as the tolerance allows ----
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], add = (a, b) => [a[0] + b[0], a[1] + b[1]], mul = (a, s) => [a[0] * s, a[1] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1], len = a => Math.hypot(a[0], a[1]), unit = a => mul(a, 1 / (len(a) || 1));
const distanceToSegment = (p, a, b) => { const ab = sub(b, a), t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / (dot(ab, ab) || 1))); return len(sub(p, add(a, mul(ab, t)))); };

/** Index offsets reaching `distance` along a closed loop from point i, backwards and forwards. */
function reach(loop, i, distance) {
  const n = loop.length; let back = 0, fwd = 0, d = 0;
  while (d < distance && back < n / 2) { d += len(sub(loop[(i - back + n) % n], loop[(i - back - 1 + n) % n])); back++; }
  d = 0; while (d < distance && fwd < n / 2) { d += len(sub(loop[(i + fwd + 1) % n], loop[(i + fwd) % n])); fwd++; }
  return [back, fwd];
}
function corners(loop) {
  const n = loop.length, turn = loop.map((p, i) => {
    const [b, f] = reach(loop, i, 3), u = unit(sub(p, loop[(i - b + n) % n])), v = unit(sub(loop[(i + f) % n], p));
    return Math.acos(Math.max(-1, Math.min(1, dot(u, v))));
  });
  const found = [];
  for (let i = 0; i < n; i++) {
    if (turn[i] < 40 * Math.PI / 180) continue;
    const [b, f] = reach(loop, i, 2.5); let peak = true;
    for (let k = -b; k <= f && peak; k++) if (k && turn[(i + k + n) % n] > turn[i] + (k > 0 ? 0 : 1e-12)) peak = false;
    if (peak) found.push(i);
  }
  return found;
}
/** The least-squares line through points, as [point, direction]. */
function line(points) {
  const c = mul(points.reduce(add, [0, 0]), 1 / points.length);
  let xx = 0, xy = 0, yy = 0; for (const p of points) { const d = sub(p, c); xx += d[0] * d[0]; xy += d[0] * d[1]; yy += d[1] * d[1]; }
  const angle = 0.5 * Math.atan2(2 * xy, xx - yy);
  return [c, [Math.cos(angle), Math.sin(angle)]];
}
/** An antialiased corner traces round; where both sides run straight, the corner is where their lines meet. */
function sharpen(loop, i, limitBack, limitFwd) {
  const n = loop.length, side = (sign, limit) => {
    const pts = []; let d = 0;
    for (let k = 1; k < limit; k++) { const a = loop[(i + sign * k + n) % n]; d += len(sub(a, loop[(i + sign * (k - 1) + n) % n])); if (d > 9) break; if (d >= 2.5) pts.push(a); }
    return pts;
  };
  const before = side(-1, limitBack), after = side(1, limitFwd);
  if (before.length < 3 || after.length < 3) return loop[i];
  const [p, u] = line(before), [q, v] = line(after), cross = u[0] * v[1] - u[1] * v[0];
  const straight = (pts, c, d) => pts.every(a => Math.abs((a[0] - c[0]) * d[1] - (a[1] - c[1]) * d[0]) < 0.25);
  if (Math.abs(cross) < 0.2 || !straight(before, p, u) || !straight(after, q, v)) return loop[i];
  const t = ((q[0] - p[0]) * v[1] - (q[1] - p[1]) * v[0]) / cross, meet = add(p, mul(u, t));
  return len(sub(meet, loop[i])) < 1.5 ? meet : loop[i];
}

const bezier = (c, t) => { const s = 1 - t; return add(add(mul(c[0], s * s * s), mul(c[1], 3 * s * s * t)), add(mul(c[2], 3 * s * t * t), mul(c[3], t * t * t))); };
const bezierD = (c, t) => { const s = 1 - t; return add(add(mul(sub(c[1], c[0]), 3 * s * s), mul(sub(c[2], c[1]), 6 * s * t)), mul(sub(c[3], c[2]), 3 * t * t)); };
const bezierDD = (c, t) => add(mul(add(sub(c[2], mul(c[1], 2)), c[0]), 6 * (1 - t)), mul(add(sub(c[3], mul(c[2], 2)), c[1]), 6 * t));
/** Philip J. Schneider's curve fit (Graphics Gems, 1990): one cubic through the points, with fixed end tangents. */
function fitCubic(points, tA, tB, u) {
  const [a, b] = [points[0], points.at(-1)];
  let c11 = 0, c12 = 0, c22 = 0, x1 = 0, x2 = 0;
  points.forEach((p, i) => {
    const t = u[i], s = 1 - t, b1 = 3 * t * s * s, b2 = 3 * t * t * s, A1 = mul(tA, b1), A2 = mul(tB, b2);
    c11 += dot(A1, A1); c12 += dot(A1, A2); c22 += dot(A2, A2);
    const rest = sub(p, add(mul(a, s * s * s + b1), mul(b, b2 + t * t * t)));
    x1 += dot(A1, rest); x2 += dot(A2, rest);
  });
  const det = c11 * c22 - c12 * c12, chord = len(sub(b, a));
  let al = det ? (x1 * c22 - c12 * x2) / det : 0, ar = det ? (c11 * x2 - c12 * x1) / det : 0;
  if (al < chord * 1e-3 || ar < chord * 1e-3) al = ar = chord / 3;
  return [a, add(a, mul(tA, al)), add(b, mul(tB, ar)), b];
}
function fitRun(points, tA, tB, out) {
  const [a, b] = [points[0], points.at(-1)];
  if (points.every(p => distanceToSegment(p, a, b) <= TOLERANCE)) { out.push(['L', ...b]); return; }
  let u = [0]; for (let i = 1; i < points.length; i++) u.push(u[i - 1] + len(sub(points[i], points[i - 1])));
  u = u.map(t => t / u.at(-1));
  let curve, worst = 0, at = 0;
  for (let pass = 0; pass < 6; pass++) {
    curve = fitCubic(points, tA, tB, u);
    worst = 0; at = Math.floor(points.length / 2);
    points.forEach((p, i) => { const e = len(sub(bezier(curve, u[i]), p)); if (e > worst) { worst = e; at = i; } });
    if (worst <= TOLERANCE) break;
    // Newton-Raphson: move each parameter to the curve's nearest point.
    u = u.map((t, i) => { const d = sub(bezier(curve, t), points[i]), d1 = bezierD(curve, t), d2 = bezierDD(curve, t), den = dot(d1, d1) + dot(d, d2); return den ? Math.max(0, Math.min(1, t - dot(d, d1) / den)) : t; });
  }
  if (worst <= TOLERANCE || points.length < 6) { out.push(['C', ...curve[1], ...curve[2], ...curve[3]]); return; }
  at = Math.max(3, Math.min(points.length - 4, at));
  const centre = unit(sub(points[at + 2], points[at - 2]));
  fitRun(points.slice(0, at + 1), tA, mul(centre, -1), out);
  fitRun(points.slice(at), centre, tB, out);
}
/** A tangent leaving `from` toward the points that follow it (one-sided, over about 3 px). */
function tangent(points) {
  let d = 0, k = 1; while (k < points.length - 1 && d < 3) { d += len(sub(points[k], points[k - 1])); k++; }
  return unit(sub(points[k], points[0]));
}
function fitLoop(loop) {
  const n = loop.length; let breaks = corners(loop);
  const sharp = new Map(breaks.map((i, k) => {
    const prev = breaks[(k - 1 + breaks.length) % breaks.length], next = breaks[(k + 1) % breaks.length];
    const gap = (from, to) => ((to - from + n) % n) || n;
    return [i, sharpen(loop, i, Math.floor(gap(prev, i) / 2), Math.floor(gap(i, next) / 2))];
  }));
  // A loop without corners (the O) is cut at its extremes, where the tangents are level or upright.
  const smooth = !breaks.length;
  if (smooth) {
    const by = (f) => loop.reduce((best, p, i) => f(p) > f(loop[best]) ? i : best, 0);
    breaks = [...new Set([by(p => -p[1]), by(p => p[0]), by(p => p[1]), by(p => -p[0])])].sort((a, b) => a - b);
  }
  const point = i => sharp.get(i) ?? loop[i];
  const out = [['M', ...point(breaks[0])]];
  breaks.forEach((start, k) => {
    const end = breaks[(k + 1) % breaks.length], run = [point(start)];
    for (let i = (start + 1) % n; i !== end; i = (i + 1) % n) run.push(loop[i]);
    run.push(point(end));
    for (let pass = 0; pass < 4; pass++) for (let i = 1; i < run.length - 1; i++) run[i] = mul(add(mul(run[i], 2), add(run[i - 1], run[i + 1])), 0.25);
    const ends = i => { const c = sub(loop[(i + 2) % n], loop[(i - 2 + n) % n]); return unit(c); };
    const tA = smooth ? ends(start) : tangent(run), tB = smooth ? mul(ends(end), -1) : tangent([...run].reverse());
    fitRun(run, tA, tB, out);
  });
  out.push(['Z']);
  return out;
}

const round = v => Math.round(v * 1000) / 1000;
const pathData = contours => contours.map(c => c.map(([op, ...v]) => [op, ...v.map(round)].join(' ')).join(' ')).join(' ');
const glyphs = letters.map((box, k) => ({ id: LETTERS[k], d: pathData(outlines(box).map(fitLoop)) }));

// ---- The emblem: the accepted master, placed to cover the banner's emblem best ----
const masterSvg = fs.readFileSync(path.join(root, MASTER), 'utf8');
const masterPath = masterSvg.match(/<path id="emblem"[^>]* d="([^"]+)"/)[1];
const master = parsePath(masterPath);
const emblemBox = { x0: 0, y0: 0, x1: emblemRight, y1: H - 1 };
const masterBox = [137, 222, 1074, 1001]; // kits/cosmik/validation/vector-qa.json visible_pixel_bounds_xyxy
const emblemShapes = shapes.filter(s => s.x1 <= emblemRight);
const banner = [Math.min(...emblemShapes.map(s => s.x0)), Math.min(...emblemShapes.map(s => s.y0)), Math.max(...emblemShapes.map(s => s.x1)), Math.max(...emblemShapes.map(s => s.y1))];
const crop = [banner[0] - 8, banner[1] - 8, banner[2] - banner[0] + 17, banner[3] - banner[1] + 17];
function emblemIou([s, tx, ty], samples = 4) {
  const cover = coverage([transformCommands(master, [s, 0, 0, s, tx, ty]).map(flatten)], crop, crop[2], crop[3], samples);
  let both = 0, either = 0;
  for (let y = 0; y < crop[3]; y++) for (let x = 0; x < crop[2]; x++) {
    const v = cover[y * crop[2] + x] >= 0.5, m = mark[(crop[1] + y) * W + crop[0] + x] === 1;
    if (v && m) both++; if (v || m) either++;
  }
  return both / either;
}
// Start from the silhouettes' heights and centres, then climb to the best overlap.
const scale0 = (banner[3] - banner[1] + 1) / (masterBox[3] - masterBox[1] + 1);
let best = [scale0, (banner[0] + banner[2]) / 2 - scale0 * (masterBox[0] + masterBox[2]) / 2, banner[1] - scale0 * masterBox[1]];
let bestIou = emblemIou(best);
for (const [ds, dt] of [[0.004, 2], [0.001, 0.5], [0.00025, 0.125]]) {
  for (let improved = true; improved;) {
    improved = false;
    for (const step of [[ds, 0, 0], [-ds, 0, 0], [0, dt, 0], [0, -dt, 0], [0, 0, dt], [0, 0, -dt]]) {
      const trial = best.map((v, i) => v + step[i]), iou = emblemIou(trial);
      if (iou > bestIou) { best = trial; bestIou = iou; improved = true; }
    }
  }
}
const scale = Math.round(best[0] * 1e6) / 1e6, transform = [scale, 0, 0, scale, round(best[1]), round(best[2])];

// ---- Evidence: the lockup rasterised at source size against the banner's silhouette ----
const emblem = transformCommands(master, transform).map(flatten);
const wordmark = glyphs.map(g => parsePath(g.d).map(flatten));
const cover = coverage([emblem, ...wordmark], [0, 0, W, H], W, H);
const vector = Uint8Array.from(cover, c => c >= 0.5 ? 1 : 0);
function compare(x0, x1) {
  let both = 0, either = 0, sourceOnly = 0, vectorOnly = 0;
  for (let y = 0; y < H; y++) for (let x = x0; x <= x1; x++) {
    const i = y * W + x, a = mark[i], b = vector[i];
    if (a && b) both++; if (a || b) either++; if (a && !b) sourceOnly++; if (b && !a) vectorOnly++;
  }
  // Edge distances: each boundary pixel of one silhouette to the nearest boundary pixel of the other.
  const boundary = m => { const out = []; for (let y = 1; y < H - 1; y++) for (let x = Math.max(1, x0); x <= Math.min(W - 2, x1); x++) { const i = y * W + x; if (m[i] && (!m[i - 1] || !m[i + 1] || !m[i - W] || !m[i + W])) out.push([x, y]); } return out; };
  const [ea, eb] = [boundary(mark), boundary(vector)], grid = new Map();
  for (const p of eb) { const k = `${p[0] >> 3},${p[1] >> 3}`; (grid.get(k) ?? grid.set(k, []).get(k)).push(p); }
  const nearest = p => { let d = Infinity; for (let gy = (p[1] >> 3) - 1; gy <= (p[1] >> 3) + 1; gy++) for (let gx = (p[0] >> 3) - 1; gx <= (p[0] >> 3) + 1; gx++) for (const q of grid.get(`${gx},${gy}`) ?? []) d = Math.min(d, Math.hypot(p[0] - q[0], p[1] - q[1])); return Math.min(d, 16); };
  const distances = ea.map(nearest).sort((a, b) => a - b);
  const r5 = v => Math.round(v * 1e5) / 1e5;
  return {
    iou: r5(both / either), symmetric_difference_pixels: sourceOnly + vectorOnly, source_only_pixels: sourceOnly, vector_only_pixels: vectorOnly,
    edge_mean_px: r5(distances.reduce((s, d) => s + d, 0) / distances.length), edge_p95_px: r5(distances[Math.floor(distances.length * 0.95)]), edge_max_px: r5(distances.at(-1)),
  };
}
const wordmarkX0 = Math.min(...letters.map(l => l.x0)) - 3, wordmarkX1 = Math.max(...letters.map(l => l.x1)) + 3;
const qa = {
  source: SOURCE, threshold: THRESHOLD, fit_tolerance_px: TOLERANCE,
  wordmark: compare(wordmarkX0, wordmarkX1), emblem: compare(0, emblemRight), lockup: compare(0, W - 1),
  emblem_transform: transform,
};
const overlay = Buffer.alloc(W * H * 4);
for (let i = 0; i < W * H; i++) {
  const colour = mark[i] && vector[i] ? [128, 128, 128] : mark[i] ? [255, 0, 255] : vector[i] ? [0, 255, 255] : [0, 0, 0];
  overlay.set([...colour, 255], i * 4);
}

const bounds = contours => { const xs = [], ys = []; for (const c of contours) for (const [x, y] of c) { xs.push(x); ys.push(y); } return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
const [wx0, wy0, wx1, wy1] = bounds(wordmark.flat().length ? wordmark.flat() : []);
const [ex0, ey0, ex1, ey1] = bounds(emblem);
const source = {
  name: 'Cosmik horizontal lockup',
  status: 'Traced from the approved banner; accepted (owner, 2026-10-11)',
  source_reference: { path: SOURCE, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), dimensions_px: [W, H] },
  method: `COSMIK outlined at mean RGB > ${THRESHOLD} (marching squares with sub-pixel edges); antialiased corners restored where both sides run straight; cubic Béziers and lines fitted within ${TOLERANCE} px (Schneider). The emblem is the accepted master (${MASTER}), uniformly scaled and moved to the banner's emblem by best overlap.`,
  viewBox: [0, 0, W, H],
  colours: { offwhite: '#F6F5F0', ink: '#000000', background: '#000000' },
  emblem: { master: MASTER, transform, visible_bounds_xywh: [ex0, ey0, ex1 - ex0, ey1 - ey0].map(round) },
  wordmark: { glyphs, visible_bounds_xywh: [wx0, wy0, wx1 - wx0, wy1 - wy0].map(round) },
};
fs.writeFileSync(path.join(root, 'kits/cosmik/assets/vector/cosmik-lockup.source.json'), JSON.stringify(source, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'kits/cosmik/validation/lockup-qa.json'), JSON.stringify(qa, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'kits/cosmik/validation/lockup-trace-overlay.png'), encodePng(W, H, overlay));
console.log(JSON.stringify({ wordmark: qa.wordmark, emblem: qa.emblem, transform, segments: glyphs.map(g => `${g.id}:${(g.d.match(/[LC]/g) || []).length}`).join(' ') }, null, 1));
