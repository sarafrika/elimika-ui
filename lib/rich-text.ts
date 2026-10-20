/** The editor saves an empty field as `<p></p>`; treat markup with no text or image as blank. */
export function isBlankRichText(html?: string | null) {
  if (!html) return true;
  if (/<img\b/i.test(html)) return false;
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;| /g, ' ').trim().length === 0;
}

/** The value to send for a rich-text field: undefined when it is blank. */
export function richTextOrUndefined(html?: string | null) {
  return isBlankRichText(html) ? undefined : (html ?? undefined);
}
