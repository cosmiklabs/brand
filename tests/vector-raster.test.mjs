import test from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import { parsePath, encodePng, decodePng } from '../scripts/vector-raster.mjs';

// Independent chunk writer lets tests corrupt scanlines while preserving a valid
// container checksum. Otherwise a CRC check could hide broken filter validation.
function chunk(type, data) {
  const name = Buffer.from(type);
  let crc = 0xffffffff;
  for (const byte of Buffer.concat([name, data])) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc & 1) ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  const header = Buffer.alloc(8), tail = Buffer.alloc(4);
  header.writeUInt32BE(data.length); name.copy(header, 4);
  tail.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([header, data, tail]);
}
const rawPng = rows => {
  const valid = encodePng(2, 1, Buffer.alloc(8));
  return Buffer.concat([valid.subarray(0, 33), chunk('IDAT', zlib.deflateSync(rows)), chunk('IEND', Buffer.alloc(0))]);
};

test('path parsing preserves implicit segments and exponent coordinates', () => {
  assert.deepEqual(parsePath('M +1e1, .5 20 30 C20 31 22 33 24 35 Z'), [[['M', 10, 0.5], ['L', 20, 30], ['C', 20, 31, 22, 33, 24, 35], ['Z']]]);
});

test('unsupported or malformed paths fail instead of manufacturing wrong geometry', () => {
  for (const d of ['M8 12H36L24 24Z', 'm1 2l3 4z', 'L1 2', 'M1', 'M1 2 C3 4', 'M1 2 LNaN 4', 'M1 2 @3 4', 'M1 2 Z3 4', '']) assert.throws(() => parsePath(d), undefined, d);
});

test('RGBA PNG round-trips opaque, translucent and transparent pixels', () => {
  const pixels = Buffer.from([255, 0, 0, 255, 0, 255, 0, 128, 0, 0, 0, 0, 16, 32, 64, 255]);
  assert.deepEqual(decodePng(encodePng(2, 2, pixels)), { width: 2, height: 2, rgba: pixels });
  assert.throws(() => encodePng(2, 2, Buffer.alloc(4)), /dimensions/);
  assert.throws(() => encodePng(0, 1, Buffer.alloc(0)), /dimensions/);
});

test('PNG rejects corrupt chunks, incomplete streams, invalid filters and inconsistent dimensions', () => {
  const valid = encodePng(2, 1, Buffer.alloc(8));
  const corrupt = Buffer.from(valid); corrupt[20] ^= 1;
  assert.throws(() => decodePng(corrupt), /checksum/);
  assert.throws(() => decodePng(valid.subarray(0, valid.length - 1)), /Truncated/);
  assert.throws(() => decodePng(valid.subarray(0, 33)), /Incomplete/);
  assert.throws(() => decodePng(rawPng(Buffer.from([5, 0, 0, 0, 0, 0, 0, 0, 0]))), /Invalid PNG filter 5/);
  assert.throws(() => decodePng(rawPng(Buffer.alloc(8))), /scanline data/);
  assert.throws(() => decodePng(rawPng(Buffer.alloc(10))));
});
