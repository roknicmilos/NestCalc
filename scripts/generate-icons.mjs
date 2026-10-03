// Renders scripts/icon.svg into the PNG icons referenced by the web app manifest.
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.join(import.meta.dirname, '..');
const svg = readFileSync(path.join(import.meta.dirname, 'icon.svg'));
const out = path.join(root, 'public', 'icons');
const BACKGROUND = '#2f6f55';

mkdirSync(out, { recursive: true });

async function render(file, size) {
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(path.join(out, file));
  console.log(`Wrote public/icons/${file}`);
}

// Maskable: glyph scaled to 80% (inside the safe zone) on a full-bleed background.
async function renderMaskable(file, size) {
  const inner = Math.round(size * 0.8);
  const glyph = await sharp(svg, { density: 384 }).resize(inner, inner).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: BACKGROUND } })
    .composite([{ input: glyph, gravity: 'centre' }])
    .png()
    .toFile(path.join(out, file));
  console.log(`Wrote public/icons/${file}`);
}

await render('icon-192.png', 192);
await render('icon-512.png', 512);
await render('apple-touch-icon.png', 180);
await renderMaskable('icon-maskable-512.png', 512);
