import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildManifest } from './manifest';

const meta = { title: 'NestCalc — kalkulator kupovine nekretnine', description: 'd' };

describe('buildManifest', () => {
  const manifest = buildManifest(meta);

  it('has the fields Chrome needs for installability', () => {
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/');
    expect(manifest.name).toBe(meta.title);
    expect(manifest.short_name).toBe('NestCalc');
    expect(manifest.theme_color).toBeTruthy();
    expect(manifest.background_color).toBeTruthy();
  });

  it('declares 192 and 512 PNG icons and a maskable icon', () => {
    const icons = manifest.icons ?? [];
    expect(icons.find((i) => i.sizes === '192x192')?.type).toBe('image/png');
    expect(icons.find((i) => i.sizes === '512x512')?.type).toBe('image/png');
    expect(icons.some((i) => i.purpose === 'maskable')).toBe(true);
  });

  it('only references icon files that exist in public/', () => {
    for (const icon of manifest.icons ?? []) {
      expect(existsSync(path.join(__dirname, '..', 'public', icon.src)), icon.src).toBe(true);
    }
  });
});
