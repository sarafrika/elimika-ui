/**
 * Lazy loader for pdfjs-dist (~2.5 MB uncompressed). Always load it through
 * this helper from an event handler or effect — a static `import 'pdfjs-dist'`
 * pulls the whole library into the route's first-load bundle.
 */
export async function loadPdfjs() {
  const pdfjs = await import('pdfjs-dist');
  if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  }
  return pdfjs;
}
