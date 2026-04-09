import type { Metadata } from 'next';
import { Nunito_Sans } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { RootProviders } from '@/context/root-providers';
import { siteMetadata } from '@/src/lib/seo';

const nunitoSans = Nunito_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
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
        className={`${nunitoSans.className} bg-background text-foreground min-h-screen antialiased`}
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
