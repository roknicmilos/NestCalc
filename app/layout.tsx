import type { ReactNode } from 'react';
import '@/styles/globals.scss';

export const metadata = {
  title: 'NestCalc — kalkulator kupovine nekretnine',
  description: 'Izračunajte stvarne troškove i mesečne rate pri kupovini nekretnine.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sr-Latn">
      <body>{children}</body>
    </html>
  );
}
