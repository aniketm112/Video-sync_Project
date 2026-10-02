/**
 * Video Sync — extension icon generator.
 *
 * Regenerates icons/icon{16,48,128}.png with zero dependencies (Node's zlib
 * only). Design matches the product brand: dark navy rounded square with a
 * sky-blue play triangle.
 *
 *   node tools/make-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'icons');

/* ---------- Minimal PNG encoder ---------- */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([len, typeBytes, data, crc]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  // compression, filter, interlace = 0

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------- Icon rasterizer ---------- */

const BG = [11, 18, 32]; // #0b1220
const FG = [56, 189, 248]; // #38bdf8
const CORNER = 0.22;

function maskRoundedSquare(x, y, size, r) {
  const cx = Math.min(Math.max(x, r), size - r);
  const cy = Math.min(Math.max(y, r), size - r);
  const dx = x - cx;
  const dy = y - cy;
  return Math.hypot(dx, dy) <= r;
}

function maskTriangle(x, y, size) {
  // Right-pointing play triangle, slightly offset for optical centering.
  const ax = size * 0.36;
  const ayTop = size * 0.27;
  const ayBottom = size * 0.73;
  const bx = size * 0.74;
  const by = size * 0.5;

  const cross = (px, py, qx, qy) => px * qy - py * qx;
  const d1 = cross(x - ax, y - ayTop, bx - ax, by - ayTop);
  const d2 = cross(x - bx, y - by, ax - bx, ayBottom - by);
  const d3 = cross(x - ax, y - ayBottom, ax - ax, ayTop - ayBottom);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

function renderIcon(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const r = size * CORNER;
  const SS = 3; // supersampling factor for smooth edges

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let fgHits = 0;
      let bgHits = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = px + (sx + 0.5) / SS;
          const y = py + (sy + 0.5) / SS;
          if (maskRoundedSquare(x, y, size, r)) {
            bgHits++;
            if (maskTriangle(x, y, size)) fgHits++;
          }
        }
      }
      const samples = SS * SS;
      const i = (py * size + px) * 4;
      if (bgHits === 0) {
        rgba[i + 3] = 0; // fully transparent outside the rounded square
        continue;
      }
      const fgRatio = fgHits / samples;
      const bgRatio = bgHits / samples;
      for (let c = 0; c < 3; c++) {
        rgba[i + c] = Math.round(BG[c] * (bgRatio - fgRatio) + FG[c] * fgRatio);
      }
      rgba[i + 3] = Math.round(255 * bgRatio);
    }
  }
  return encodePng(size, size, rgba);
}

mkdirSync(outDir, { recursive: true });
for (const size of [16, 48, 128]) {
  const file = join(outDir, `icon${size}.png`);
  writeFileSync(file, renderIcon(size));
  console.log(`wrote ${file}`);
}
