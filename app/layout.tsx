import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { RootProviders } from '@/context/root-providers';
import { siteMetadata } from '@/src/lib/seo';
import type { Metadata } from 'next';
import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

/** Figures, identifiers and times read in mono across the data-heavy dashboards. */
const jetBrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
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
