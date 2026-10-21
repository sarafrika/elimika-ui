import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { StreamRevealSeed } from '@/components/perf/stream-reveal-seed';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { RootProviders } from '@/context/root-providers';
import { siteMetadata } from '@/src/lib/seo';
import './globals.css';

// Keep font assets local so builds do not depend on Google Fonts URL parsing or availability.
const plusJakartaSans = localFont({
  src: '../assets/fonts/plus-jakarta-sans-latin-variable.woff2',
  variable: '--font-sans',
  weight: '400 800',
  style: 'normal',
  display: 'swap',
});

/** Figures, identifiers and times read in mono across the data-heavy dashboards. */
const jetBrainsMono = localFont({
  src: '../assets/fonts/jetbrains-mono-latin-variable.woff2',
  variable: '--font-mono',
  weight: '400 600',
  style: 'normal',
  display: 'swap',
});

export const metadata: Metadata = siteMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <StreamRevealSeed />
      </head>
      <body
        className={`${plusJakartaSans.className} ${plusJakartaSans.variable} ${jetBrainsMono.variable} bg-background text-foreground min-h-screen antialiased`}
      >
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
          <div className='relative min-h-screen'>
            <RootProviders>
              <div className='relative z-0 flex min-h-screen flex-col'>{children}</div>
            </RootProviders>
            <Toaster richColors />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
