// Generates KepUp PWA icons (gradient rounded square + white ring).
// Run: node scripts/gen-icons.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

const STOPS = [
  [0.0, [255, 154, 77]], // #FF9A4D
  [0.55, [238, 75, 139]], // #EE4B8B
  [1.0, [155, 92, 240]], // #9B5CF0
];

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function gradientAt(t) {
  for (let i = 1; i < STOPS.length; i++) {
    if (t <= STOPS[i][0]) {
      const [t0, c0] = STOPS[i - 1];
      const [t1, c1] = STOPS[i];
      const k = (t - t0) / (t1 - t0);
      return [lerp(c0[0], c1[0], k), lerp(c0[1], c1[1], k), lerp(c0[2], c1[2], k)];
    }
  }
  return STOPS[STOPS.length - 1][1];
}

function crcTable() {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
}
const TABLE = crcTable();

function crc(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.from(type, "ascii");
  const cb = Buffer.alloc(4);
  cb.writeUInt32BE(crc(Buffer.concat([td, data])));
  return Buffer.concat([len, td, data, cb]);
}

function makePng(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const r = size / 2;
  const radius = size * 0.225; // corner radius
  const ringR = size * 0.26;
  const ringW = size * 0.075;
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0; // filter byte
    for (let x = 0; x < size; x++) {
      // rounded-rect mask
      const cx = Math.min(Math.max(x, radius), size - radius);
      const cy = Math.min(Math.max(y, radius), size - radius);
      const dc = Math.hypot(x - cx, y - cy);
      let a = 255;
      if (dc > radius) a = 0;
      else if (dc > radius - 1) a = Math.round(255 * (radius - dc));
      // gradient + white ring (countdown-ring identity)
      const [gr, gg, gb] = gradientAt(y / size);
      const dx = x - r;
      const dy = y - r;
      const dist = Math.hypot(dx, dy);
      let cr = gr;
      let cg = gg;
      let cb = gb;
      if (Math.abs(dist - ringR) <= ringW / 2) {
        cr = 255;
        cg = 255;
        cb = 255;
      }
      raw[p++] = cr;
      raw[p++] = cg;
      raw[p++] = cb;
      raw[p++] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  return png;
}

mkdirSync(root, { recursive: true });
for (const [name, size] of [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-touch-icon.png", 180],
]) {
  writeFileSync(join(root, name), makePng(size));
  console.log("wrote", name, size);
}
