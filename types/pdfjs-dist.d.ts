declare module 'pdfjs-dist/webpack' {
  const pdfjsLib: typeof import('pdfjs-dist');
  export = pdfjsLib;
}
