const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');

function analyze(name, dir) {
  const file = path.join(dir, name + '.jpg');
  const buf = fs.readFileSync(file);
  const raw = jpeg.decode(buf, { useTArray: true, formatAsRGBA: true });
  const { width, height, data } = raw;
  const corner = [data[0], data[1], data[2], data[3]];
  const counts = {};
  let step = 3;
  for (let i = 0; i < data.length; i += 4 * step * step) {
    const key = (data[i] >> 4) + ',' + (data[i + 1] >> 4) + ',' + (data[i + 2] >> 4);
    counts[key] = (counts[key] || 0) + 1;
  }
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const isBg = (i) => Math.abs(data[i] - data[0]) + Math.abs(data[i + 1] - data[1]) + Math.abs(data[i + 2] - data[2]) < 45;
  let minX = 1e9, minY = 1e9, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y += 4) for (let x = 0; x < width; x += 4) {
    const i = (y * width + x) * 4;
    if (!isBg(i)) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  }
  return JSON.stringify({ name, w: width, h: height, corner, topColors: entries.slice(0, 6), bbox: [minX, minY, maxX, maxY] });
}

const dir = 'D:/ai/beast/resources/animals/static';
console.log(analyze('sheep', dir));
console.log(analyze('tiger', dir));
console.log(analyze('fish', dir));
console.log(analyze('cat', dir));
const dir2 = 'D:/ai/beast/resources/animals/active';
console.log(analyze('sheep_active', dir2));
console.log(analyze('tiger_active', dir2));