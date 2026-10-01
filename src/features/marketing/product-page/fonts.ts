import { Manrope, Sora } from 'next/font/google';

// Sora + Manrope are the two faces the sarafrika.com product pages ship with.
// Both are variable, so the full 400-800 range the design uses arrives in one file.
const productDisplayFont = Sora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sw-display',
});

const productBodyFont = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sw-body',
});

export const productFontVariables = `${productDisplayFont.variable} ${productBodyFont.variable}`;
