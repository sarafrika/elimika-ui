import { elimikaPalette, elimikaThemeRoles, getChartColors } from '@/lib/theme/colors';

/**
 * Elimika Design System
 *
 * This file contains unified design tokens inspired by the Elimika brand identity.
 * The Elimika logo features three horizontal layered lines in blue (#0061ED),
 * representing structured, confident, and purposeful learning experiences.
 *
 * Key principles:
 * - Primary color: Elimika blue (#0061ED) from the logo
 * - Layered gradients and confident geometry
 * - Clean whitespace and modern typography
 * - Consistent shadows and rounded corners
 * - Accessible chart colors optimized for both light and dark modes
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

  // Border radius variants (inspired by logo's rounded lines)
  radius: {
    card: 'rounded-[28px]',
    cardLarge: 'rounded-[32px]',
    section: 'rounded-3xl',
    header: 'rounded-[36px]',
    button: 'rounded-full',
    badge: 'rounded-full',
  },

  // Component variants
  components: {
    // Main page container
    pageContainer: 'space-y-8 p-6 lg:p-10',

    // Header section (for page titles)
    header: {
      base: 'rounded-[36px] border border-blue-200/40 bg-white/80 p-8 shadow-xl shadow-blue-200/30 backdrop-blur dark:border-blue-500/25 dark:bg-blue-950/40 dark:shadow-blue-900/20 lg:p-12',
      title: 'text-3xl font-semibold text-slate-900 dark:text-blue-50 sm:text-4xl',
      subtitle: 'mt-3 max-w-3xl text-base text-slate-600 dark:text-slate-200 sm:text-lg',
      badge:
        'inline-flex items-center gap-2 rounded-full border border-blue-400/40 bg-blue-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-blue-600 dark:border-blue-500/40 dark:bg-blue-900/40 dark:text-blue-100',
    },

    // Form container
    form: {
      wrapper:
        'space-y-8 rounded-[32px] border border-blue-200/40 bg-card p-6 shadow-xl shadow-blue-200/40 transition dark:border-blue-500/25 dark:bg-gradient-to-br dark:from-blue-950/60 dark:via-blue-900/40 dark:to-slate-950/80 dark:shadow-blue-900/20 lg:p-10',
    },

    // Form section (with sidebar title)
    formSection: {
      wrapper:
        'rounded-3xl border border-blue-200/40 bg-white/90 p-6 shadow-lg shadow-blue-200/40 transition dark:border-blue-500/25 dark:bg-blue-950/30 lg:p-8',
      container: 'flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10',
      sidebar: 'lg:w-1/3',
      sidebarBadge:
        'text-xs font-semibold uppercase tracking-[0.4em] text-blue-500/80 dark:text-blue-200',
      sidebarTitle: 'mt-2 text-lg font-semibold text-slate-900 dark:text-blue-50',
      sidebarDescription: 'mt-2 text-sm text-slate-600 dark:text-slate-200',
      content: 'lg:flex-1',
    },

    // Card (for content blocks)
    card: {
      base: 'rounded-[28px] border border-blue-200/60 bg-white/90 p-6 shadow-lg shadow-blue-200/30 transition hover:-translate-y-1 hover:border-blue-400/70 dark:border-blue-500/25 dark:bg-blue-950/40 dark:shadow-blue-900/20',
      header:
        'mb-5 inline-flex items-center justify-center rounded-full bg-blue-500/15 p-3 text-blue-700 dark:text-blue-300',
      title: 'mb-3 text-lg font-semibold text-slate-900 dark:text-blue-50',
      description: 'text-sm leading-6 text-slate-600 dark:text-slate-200',
    },

    // List item card
    listCard: {
      base: 'group rounded-[24px] border border-blue-200/40 bg-white/80 p-5 shadow-md shadow-blue-200/20 transition hover:-translate-y-0.5 hover:border-blue-400/60 hover:shadow-lg hover:shadow-blue-200/30 dark:border-blue-500/20 dark:bg-blue-950/30 dark:shadow-blue-900/10',
    },

    // Loading/Empty state
    emptyState: {
      container:
        'flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-[28px] border border-blue-200/40 bg-card px-6 py-12 text-center shadow-lg shadow-blue-200/40 backdrop-blur dark:border-blue-500/25 dark:bg-gradient-to-br dark:from-blue-950/60 dark:via-blue-900/40 dark:to-slate-950/80 dark:text-slate-200 dark:shadow-blue-900/20',
      icon: 'mb-2 h-12 w-12 text-blue-400 dark:text-blue-300',
      title: 'text-lg font-semibold text-slate-900 dark:text-blue-50',
      description: 'max-w-md text-sm text-slate-600 dark:text-slate-300',
    },

    // Stats/Metric card
    statCard: {
      base: 'rounded-[24px] border border-blue-200/40 bg-card p-6 shadow-lg shadow-blue-200/30 dark:border-blue-500/25 dark:bg-gradient-to-br dark:from-blue-950/40 dark:to-slate-950/60',
      label: 'text-sm font-medium text-slate-600 dark:text-slate-300',
      value: 'mt-2 text-3xl font-bold text-slate-900 dark:text-blue-50',
      change: 'mt-1 text-xs text-blue-600 dark:text-blue-300',
    },

    // Badge variants
    badge: {
      primary:
        'rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 dark:border-blue-500/40 dark:bg-blue-900/40 dark:text-blue-100',
      secondary:
        'rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200',
    },

    // Button variants (extends default shadcn)
    button: {
      primary:
        'rounded-full bg-blue-600 px-7 py-3 text-sm font-medium text-white shadow hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
      secondary:
        'rounded-full border border-blue-200 bg-white px-7 py-3 text-sm font-medium text-blue-700 shadow hover:border-blue-400 hover:text-blue-900 dark:border-blue-500/40 dark:bg-blue-950/40 dark:text-blue-100 dark:hover:border-blue-400',
    },

    // Input field styling
    input: {
      base: 'rounded-lg border border-blue-200/60 bg-white px-4 py-2.5 text-sm shadow-sm transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:border-blue-500/30 dark:bg-blue-950/20 dark:text-blue-50 dark:focus:border-blue-400 dark:focus:ring-blue-900/40',
    },

    // Divider/Separator
    divider: 'border-t border-blue-200/40 dark:border-blue-500/25',
  },

  // Background gradients
  gradients: {
    page: 'bg-background',
    card: 'bg-card',
    cardDark: 'dark:from-blue-950/60 dark:via-blue-900/40 dark:to-slate-950/80',
  },

  // Shadow effects
  shadows: {
    card: 'shadow-lg shadow-blue-200/40 dark:shadow-blue-900/20',
    cardHover: 'shadow-xl shadow-blue-200/50 dark:shadow-blue-900/30',
    header: 'shadow-xl shadow-blue-200/30 dark:shadow-blue-900/20',
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
