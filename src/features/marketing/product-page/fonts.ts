import localFont from 'next/font/local';

// Sora + Manrope are the two faces the sarafrika.com product pages ship with.
// Bundle variable fonts locally to keep builds independent of Google Fonts responses.
const productDisplayFont = localFont({
  src: '../../../../assets/fonts/sora-latin-variable.woff2',
  weight: '100 800',
  style: 'normal',
  display: 'swap',
  variable: '--font-sw-display',
});

const productBodyFont = localFont({
  src: '../../../../assets/fonts/manrope-latin-variable.woff2',
  weight: '200 800',
  style: 'normal',
  display: 'swap',
  variable: '--font-sw-body',
});

export const productFontVariables = `${productDisplayFont.variable} ${productBodyFont.variable}`;
