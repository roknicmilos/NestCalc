import type { MetadataRoute } from 'next';

/** Matches `--color-primary` / `--color-bg` in styles/tokens.scss and scripts/icon.svg. */
export const THEME_COLOR = '#2f6f55';
export const BACKGROUND_COLOR = '#f7f6f2';

export function buildManifest(meta: { title: string; description: string }): MetadataRoute.Manifest {
  return {
    name: meta.title,
    short_name: 'NestCalc',
    description: meta.description,
    start_url: '/',
    display: 'standalone',
    theme_color: THEME_COLOR,
    background_color: BACKGROUND_COLOR,
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
