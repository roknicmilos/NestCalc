import type { ReactNode } from 'react';
import { getDictionary } from '@/lib/i18n';
import { I18nProvider } from '@/lib/i18n/I18nProvider';
import { getLocale } from '@/lib/i18n/server';
import '@/styles/globals.scss';

export async function generateMetadata() {
  return getDictionary(await getLocale()).meta;
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale === 'sr' ? 'sr-Latn' : 'en'}>
      <body>
        <I18nProvider locale={locale} dictionary={getDictionary(locale)}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
