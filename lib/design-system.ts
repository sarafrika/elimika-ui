import { elimikaPalette, elimikaThemeRoles, getChartColors } from '@/lib/theme/colors';

/**
 * Elimika Design System
 *
 * Unified, token-based design primitives for the Elimika dashboard.
 *
 * Everything here resolves to the semantic design tokens defined in `app/globals.css`
 * (`bg-card`, `bg-primary`, `text-foreground`, `text-muted-foreground`, `border-border`,
 * `success` / `warning` / `destructive`, …) so components theme cleanly in light and dark and
 * stay within the brand-color guard (`scripts/check-brand-colors.mjs`).
 *
 * Key principles:
 * - Semantic tokens only — never hardcoded palette classes or raw hex.
 * - Refined depth: rounded-2xl surfaces, hairline borders, soft shadows, subtle hover lift.
 * - Consistent radii and spacing across every consumer.
 * - Accessible chart colors optimized for both light and dark modes.
 */

export const elimikaDesignSystem = {
  // Foundation color data
  palette: elimikaPalette,
  themeRoles: elimikaThemeRoles,

  // Chart colors - WCAG compliant for data visualization
  charts: {
    getColors: getChartColors,
    light: elimikaPalette.charts.light,
    dark: elimikaPalette.charts.dark,
  },

  // Spacing & Layout
  spacing: {
    section: 'space-y-8',
    content: 'space-y-6',
    inline: 'gap-4',
  },

  // Border radius variants
  radius: {
    card: 'rounded-2xl',
    cardLarge: 'rounded-3xl',
    section: 'rounded-2xl',
    header: 'rounded-2xl',
    button: 'rounded-full',
    badge: 'rounded-full',
  },

  // Component variants
  components: {
    // Main page container
    pageContainer: 'space-y-8 p-2 sm:p-6 lg:p-8',

    // Header section (for page titles)
    header: {
      base: 'rounded-2xl border border-border/70 bg-card p-6 shadow-sm lg:p-8',
      title: 'text-3xl font-bold tracking-tight text-foreground sm:text-4xl',
      subtitle: 'mt-3 max-w-3xl text-base text-muted-foreground sm:text-lg',
      badge:
        'inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary',
    },

    // Form container
    form: {
      wrapper:
        'space-y-8 rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition lg:p-8',
    },

    // Form section (with sidebar title)
    formSection: {
      wrapper: 'rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition lg:p-8',
      container: 'flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10',
      sidebar: 'lg:w-1/3',
      sidebarBadge: 'text-[11px] font-semibold uppercase tracking-wide text-primary',
      sidebarTitle: 'mt-2 text-lg font-semibold text-foreground',
      sidebarDescription: 'mt-2 text-sm text-muted-foreground',
      content: 'lg:flex-1',
    },

    // Card (for content blocks)
    card: {
      base: 'group rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md',
      header:
        'mb-5 inline-flex items-center justify-center rounded-xl bg-primary/10 p-3 text-primary',
      title: 'mb-2 text-lg font-semibold text-foreground',
      description: 'text-sm leading-6 text-muted-foreground',
    },

    // List item card
    listCard: {
      base: 'group rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md',
    },

    // Loading/Empty state
    emptyState: {
      container:
        'flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/70 bg-card px-6 py-12 text-center shadow-sm',
      icon: 'mb-2 h-12 w-12 text-primary',
      title: 'text-lg font-semibold text-foreground',
      description: 'max-w-md text-sm text-muted-foreground',
    },

    // Stats/Metric card
    statCard: {
      base: 'rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md',
      label: 'text-sm font-medium text-muted-foreground',
      value: 'mt-2 text-3xl font-bold text-foreground',
      change: 'mt-1 text-xs text-primary',
    },

    // Badge variants
    badge: {
      primary:
        'rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary',
      secondary:
        'rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground',
    },

    // Button variants (extends default shadcn)
    button: {
      primary:
        'rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90',
      secondary:
        'rounded-full border border-border bg-card px-6 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:border-primary/40 hover:text-primary',
    },

    // Input field styling
    input: {
      base: 'rounded-lg border border-border bg-background px-4 py-2.5 text-sm shadow-sm transition focus:border-primary focus:ring-2 focus:ring-ring/30',
    },

    // Divider/Separator
    divider: 'border-t border-border/70',
  },

  // Background gradients
  gradients: {
    page: 'bg-background',
    card: 'bg-card',
    cardDark: 'bg-card',
  },

  // Shadow effects
  shadows: {
    card: 'shadow-sm',
    cardHover: 'shadow-md',
    header: 'shadow-sm',
  },
} as const;

// Utility function to combine design system classes
export function cx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Export reusable component class generators
export const getFormSectionClasses = () => elimikaDesignSystem.components.formSection.wrapper;
export const getCardClasses = () => elimikaDesignSystem.components.card.base;
export const getHeaderClasses = () => elimikaDesignSystem.components.header.base;
export const getEmptyStateClasses = () => elimikaDesignSystem.components.emptyState.container;
export const getListCardClasses = () => elimikaDesignSystem.components.listCard.base;
export const getStatCardClasses = () => elimikaDesignSystem.components.statCard.base;
