import type { MetadataRoute } from 'next';
import { getDictionary } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n/server';
import { buildManifest } from '@/lib/manifest';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  return buildManifest(getDictionary(await getLocale()).meta);
}
