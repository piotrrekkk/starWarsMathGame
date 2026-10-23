// Minimal script using Node built-in zlib to generate valid PNG icons for PWA
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPng(width, height, drawFn) {
  // RGBA buffer
  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rgba[idx] = r;
      rgba[idx + 1] = g;
      rgba[idx + 2] = b;
      rgba[idx + 3] = a;
    }
  }

  // PNG filter byte (0 = none) prepended to each scanline
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const srcStart = y * width * 4;
    const destStart = y * (1 + width * 4);
    scanlines[destStart] = 0; // Filter: None
    rgba.copy(scanlines, destStart + 1, srcStart, srcStart + width * 4);
  }

  const compressed = zlib.deflateSync(scanlines);

  function createChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type);
    const body = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body), 0);
    return Buffer.concat([len, body, crc]);
  }

  // Simple CRC32
  function crc32(buf) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ (-1)) >>> 0;
  }

  const IHDR = Buffer.alloc(13);
  IHDR.writeUInt32BE(width, 0);
  IHDR.writeUInt32BE(height, 4);
  IHDR[8] = 8; // bit depth
  IHDR[9] = 6; // color type: RGBA
  IHDR[10] = 0; // compression
  IHDR[11] = 0; // filter
  IHDR[12] = 0; // interlace

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrChunk = createChunk('IHDR', IHDR);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate CRC table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
  }
  crcTable[n] = c >>> 0;
}

// Drawing function: Star Wars theme with glowing saber & starfield
function drawIcon(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background circle
  const maxR = w * 0.46;
  if (dist > maxR) {
    return [0, 0, 0, 0]; // transparent outside circle
  }

  // Deep space gradient
  let r = 8 + (x / w) * 15;
  let g = 10 + (y / h) * 18;
  let b = 25 + (dist / maxR) * 35;

  // Outer gold ring
  if (dist >= maxR - 8 && dist <= maxR) {
    return [255, 234, 41, 255]; // Kyber gold
  }

  // Crossed lightsabers (diagonal blades)
  const d1 = Math.abs((x - cx) - (y - cy)); // diagonal 1
  const d2 = Math.abs((x - cx) + (y - cy)); // diagonal 2
  const bladeLen = w * 0.35;

  if (Math.abs(dx) < bladeLen && Math.abs(dy) < bladeLen) {
    // Blue saber blade
    if (d1 < 7) {
      if (d1 < 2) return [255, 255, 255, 255]; // white core
      return [0, 208, 255, 255]; // cyan glow
    }
    // Green saber blade
    if (d2 < 7) {
      if (d2 < 2) return [255, 255, 255, 255]; // white core
      return [37, 242, 82, 255]; // green glow
    }
  }

  // Center Kyber diamond
  if (Math.abs(dx) + Math.abs(dy) < w * 0.12) {
    return [255, 234, 41, 255];
  }

  return [Math.floor(r), Math.floor(g), Math.floor(b), 255];
}

const iconsDir = path.join(__dirname, 'public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), createPng(192, 192, drawIcon));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), createPng(512, 512, drawIcon));
console.log('✅ Icons 192x192 and 512x512 generated successfully!');
