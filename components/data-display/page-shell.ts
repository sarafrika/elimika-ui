/**
 * Layout class strings shared by data-heavy dashboard pages. Borders carry the
 * structure instead of shadows, and corners stay crisp.
 */
export const surfaceTheme = {
  /** Centered page shell. */
  page: 'mx-auto w-full max-w-[1520px] px-3 py-4 sm:px-5 lg:px-7',
  pageStack: 'flex w-full flex-col gap-4',

  /** Card surfaces. */
  card: 'rounded-md border border-border/70 bg-card',
  cardMuted: 'rounded-md border border-border/60 bg-muted/30',
  cardPadded: 'rounded-md border border-border/70 bg-card p-5',

  /** Controls. */
  control: 'rounded-md border-border/70 bg-background',

  /** Small caps label above a group of fields. */
  sectionLabel: 'text-xs font-medium uppercase tracking-wide text-muted-foreground',
} as const;
