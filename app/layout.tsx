import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { getDictionary } from '@/lib/i18n';
import { I18nProvider } from '@/lib/i18n/I18nProvider';
import { getLocale } from '@/lib/i18n/server';
import { THEME_COLOR } from '@/lib/manifest';
import '@/styles/globals.scss';

export const viewport: Viewport = { themeColor: THEME_COLOR };

export async function generateMetadata(): Promise<Metadata> {
  return {
    ...getDictionary(await getLocale()).meta,
    icons: { apple: '/icons/apple-touch-icon.png' },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale === 'sr' ? 'sr-Latn' : 'en'}>
      <body>
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
