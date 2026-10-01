/**
 * Meilisearch wraps matches in `<em>…</em>` and does not escape the rest of the text,
 * so highlight strings are never rendered as HTML. This splits on the literal tags only;
 * anything else, including other markup, stays plain text.
 */
type HighlightPart = { text: string; match: boolean };

const OPEN = '<em>';
const CLOSE = '</em>';

export function parseHighlight(value: string | null | undefined): HighlightPart[] {
  if (!value) return [];
  const parts: HighlightPart[] = [];
  let rest = value;

  while (rest.length > 0) {
    const open = rest.indexOf(OPEN);
    if (open === -1) {
      parts.push({ text: rest, match: false });
      break;
    }
    const close = rest.indexOf(CLOSE, open + OPEN.length);
    if (close === -1) {
      // An unbalanced tag is shown as written rather than guessed at.
      parts.push({ text: rest, match: false });
      break;
    }
    if (open > 0) parts.push({ text: rest.slice(0, open), match: false });
    const matched = rest.slice(open + OPEN.length, close);
    if (matched) parts.push({ text: matched, match: true });
    rest = rest.slice(close + CLOSE.length);
  }

  // Merge neighbours of the same kind so the output is minimal.
  return parts.reduce<HighlightPart[]>((merged, part) => {
    const last = merged[merged.length - 1];
    if (last && last.match === part.match) last.text += part.text;
    else merged.push({ ...part });
    return merged;
  }, []);
}
