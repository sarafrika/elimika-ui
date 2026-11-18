/** Admin reasons may arrive as rich-text HTML; show them as plain words. */
export function plainText(html?: string | null) {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}
