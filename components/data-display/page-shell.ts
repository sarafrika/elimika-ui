/**
 * Layout class strings shared by data-heavy dashboard pages. Borders carry the
 * structure instead of shadows, and corners stay crisp.
 */
export const surfaceTheme = {
  /** Centered page shell. */
  page: 'mx-auto w-full max-w-[1520px] px-3 py-4 sm:px-5 lg:px-7',
  pageStack: 'flex w-full flex-col gap-4',
  /**
   * Opt-in wide container for pages that should use a large screen (the public catalogue
   * and course pages): up to 2400px instead of a centred 1520px column. Horizontal gutters
   * only: pages add their own vertical padding (`py-*`).
   */
  pageWide: 'mx-auto w-full max-w-[2400px] px-4 sm:px-6 xl:px-10 2xl:px-14',
  /**
   * Opt-in card grid: one column on phones, two on tablets, then as many 290px+ cards as
   * the width allows, so large screens fill out instead of crowding the middle.
   */
  cardGrid:
    'grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-[repeat(auto-fill,minmax(290px,1fr))] 2xl:gap-6',
  /**
   * Opt-in grid for wide horizontal cards (jobs, credentials, hired jobs): one column until
   * the width fits two 520px cards, then as many as fit.
   */
  cardGridWide: 'grid grid-cols-1 gap-4 xl:grid-cols-[repeat(auto-fill,minmax(520px,1fr))]',
  /**
   * A stat or KPI row: two columns on tablets, then the columns follow the card count
   * (auto-fit, 220px+ each), so three cards fill the row as well as five do.
   */
  statGrid: 'grid gap-4 sm:grid-cols-2 xl:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]',

  /** Card surfaces. */
  card: 'rounded-md border border-border/70 bg-card',
  cardMuted: 'rounded-md border border-border/60 bg-muted/30',
  cardPadded: 'rounded-md border border-border/70 bg-card p-5',

  /** Controls. */
  control: 'rounded-md border-border/70 bg-background',

  /** Small caps label above a group of fields. */
  sectionLabel: 'text-xs font-medium uppercase tracking-wide text-muted-foreground',
} as const;
