import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, pixel) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x, y);
      const o = y * (size * 3 + 1) + 1 + x * 3;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0)),
  ]);
}
const BG = [0x0f, 0x17, 0x2a], FG = [0xf1, 0xf5, 0xf9], AC = [0x10, 0xb9, 0x81];
function mix(a, b, t) { return a.map((v, i) => Math.round(v + (b[i] - v) * t)); }
function draw(size) {
  const c = size / 2, R = size * 0.34, w = size * 0.045;
  return png(size, (x, y) => {
    const dx = x + 0.5 - c, dy = y + 0.5 - c, d = Math.hypot(dx, dy);
    // anel
    const ring = Math.max(0, 1 - Math.abs(d - R) / w);
    // ponteiro das horas (vertical, pra cima) e dos minutos (pra direita, acento)
    const hour = Math.abs(dx) < w * 0.6 && dy < 0 && dy > -R * 0.55 ? 1 : 0;
    const minute = Math.abs(dy) < w * 0.5 && dx > 0 && dx < R * 0.78 ? 1 : 0;
    if (minute) return AC;
    if (hour) return FG;
    if (ring > 0) return mix(BG, FG, Math.min(1, ring * 1.6));
    return BG;
  });
}
for (const [name, size] of [["icon-192.png", 192], ["icon-512.png", 512], ["apple-touch-icon.png", 180]]) {
  writeFileSync(new URL(`../public/${name}`, import.meta.url), draw(size));
}
console.log("icons ok");
