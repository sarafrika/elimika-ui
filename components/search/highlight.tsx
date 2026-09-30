import { parseHighlight } from '@/lib/search/highlight';
import { cn } from '@/lib/utils';

/**
 * Renders a search highlight (`<em>`-wrapped matches) as text with `<mark>` around the
 * matches. Never `dangerouslySetInnerHTML`: Meilisearch does not escape its output.
 * Falls back to `fallback` when there is no highlight.
 */
export function Highlight({
  value,
  fallback,
  className,
  markClassName,
}: {
  value?: string | null;
  fallback?: string | null;
  className?: string;
  markClassName?: string;
}) {
  const parts = parseHighlight(value);
  if (parts.length === 0) return <span className={className}>{fallback ?? ''}</span>;

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.match ? (
          <mark
            // biome-ignore lint/suspicious/noArrayIndexKey: parts are positional and never reorder
            key={index}
            className={cn('text-foreground rounded-sm bg-primary/15 px-0.5 font-semibold', markClassName)}
          >
            {part.text}
          </mark>
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: parts are positional and never reorder
          <span key={index}>{part.text}</span>
        )
      )}
    </span>
  );
}
