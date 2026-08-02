#!/usr/bin/env node
/**
 * Génère favicon.ico (16/32/48) + favicon-96.png à partir du design de favicon.svg.
 * Google exige un favicon carré dont le côté est un multiple de 48px, sinon il
 * affiche le globe générique dans les résultats de recherche.
 *
 * Usage : node make-favicon.js
 */

const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const ROOT = __dirname;

// Design repris de favicon.svg (viewBox 0 0 32 32)
const BG = [0x11, 0x11, 0x10];
const INK = [0xf0, 0xed, 0xe6];
const ACCENT = [0xed, 0xf1, 0x0c];

const SS = 4; // supersampling par axe (16 échantillons / pixel)

function blend(dst, src, a) {
  return [
    dst[0] + (src[0] - dst[0]) * a,
    dst[1] + (src[1] - dst[1]) * a,
    dst[2] + (src[2] - dst[2]) * a,
  ];
}

/** Couleur d'un point en coordonnées SVG (0..32). Retourne [r,g,b,a] avec a 0|1. */
function sample(x, y) {
  const d = Math.hypot(x - 16, y - 16);
  if (d > 15) return null; // hors du disque : transparent

  // Liseré jaune sur le bord : sans lui le disque #111110 disparaît sur un
  // fond sombre (SERP Google en dark mode, onglets de navigateur sombres).
  if (d > 13) return ACCENT.slice();

  let c = BG.slice();
  if (Math.abs(d - 10.5) <= 0.5) c = blend(c, INK, 0.18); // sillon externe
  if (Math.abs(d - 7.5) <= 0.5) c = blend(c, INK, 0.13); // sillon interne
  if (d <= 4) c = ACCENT.slice(); // label central
  if (d <= 1.3) c = BG.slice(); // trou de broche
  return c;
}

/** Rastérise en RGBA non prémultiplié, taille × taille. */
function raster(size) {
  const out = Buffer.alloc(size * size * 4);
  const step = 32 / (size * SS);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, hits = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = (px * SS + sx + 0.5) * step;
          const y = (py * SS + sy + 0.5) * step;
          const c = sample(x, y);
          if (c) { r += c[0]; g += c[1]; b += c[2]; hits++; }
        }
      }
      const i = (py * size + px) * 4;
      const total = SS * SS;
      if (hits === 0) continue; // pixel transparent
      out[i] = Math.round(r / hits);
      out[i + 1] = Math.round(g / hits);
      out[i + 2] = Math.round(b / hits);
      out[i + 3] = Math.round((hits / total) * 255);
    }
  }
  return out;
}

// ── PNG ────────────────────────────────────────────────────────────────────
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
}

let CRC_TABLE = null;
function crc32(buf) {
  if (!CRC_TABLE) {
    CRC_TABLE = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c;
    }
  }
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return c ^ -1;
}

function png(rgba, size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const rows = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    rows[y * (size * 4 + 1)] = 0; // filter none
    rgba.copy(rows, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── ICO (entrées BMP 32bpp, compatibilité maximale) ────────────────────────
function bmpEntry(rgba, size) {
  const header = Buffer.alloc(40);
  header.writeUInt32LE(40, 0);
  header.writeInt32LE(size, 4);
  header.writeInt32LE(size * 2, 8); // XOR + masque AND
  header.writeUInt16LE(1, 12);
  header.writeUInt16LE(32, 14);
  const pixels = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const s = ((size - 1 - y) * size + x) * 4; // BMP = bas vers haut
      const d = (y * size + x) * 4;
      pixels[d] = rgba[s + 2]; // B
      pixels[d + 1] = rgba[s + 1]; // G
      pixels[d + 2] = rgba[s]; // R
      pixels[d + 3] = rgba[s + 3]; // A
    }
  }
  const maskRow = Math.ceil(size / 32) * 4;
  return Buffer.concat([header, pixels, Buffer.alloc(maskRow * size)]);
}

function ico(sizes) {
  const images = sizes.map((s) => bmpEntry(raster(s), s));
  const head = Buffer.alloc(6);
  head.writeUInt16LE(0, 0);
  head.writeUInt16LE(1, 2); // type ICO
  head.writeUInt16LE(sizes.length, 4);
  let offset = 6 + sizes.length * 16;
  const dir = sizes.map((s, i) => {
    const e = Buffer.alloc(16);
    e[0] = s === 256 ? 0 : s;
    e[1] = s === 256 ? 0 : s;
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(images[i].length, 8);
    e.writeUInt32LE(offset, 12);
    offset += images[i].length;
    return e;
  });
  return Buffer.concat([head, ...dir, ...images]);
}

if (require.main === module) {
  const icoBuf = ico([16, 32, 48]);
  fs.writeFileSync(path.join(ROOT, 'favicon.ico'), icoBuf);
  console.log(`favicon.ico       ${icoBuf.length} octets (16, 32, 48)`);

  for (const size of [96, 192]) {
    const buf = png(raster(size), size);
    fs.writeFileSync(path.join(ROOT, `favicon-${size}.png`), buf);
    console.log(`favicon-${size}.png   ${buf.length} octets`);
  }
}

module.exports = { raster, png, ico };
