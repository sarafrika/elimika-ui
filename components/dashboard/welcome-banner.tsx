import type { ReactNode } from 'react';

/**
 * Gradient welcome banner ported from the Lovable dashboard. Presentational —
 * the greeting, summary line and CTAs are all passed in as props.
 */
export interface WelcomeBannerProps {
  /** Small uppercase line, e.g. the current date. */
  eyebrow?: string;
  title: string;
  /** Rich summary line (can embed highlighted counts). */
  description?: ReactNode;
  actions?: ReactNode;
}

export function WelcomeBanner({ eyebrow, title, description, actions }: WelcomeBannerProps) {
  return (
    <div className='relative overflow-hidden rounded-2xl border bg-gradient-to-r from-teal-700 via-teal-600 to-primary p-5 text-white shadow-sm sm:p-6 2xl:p-8'>
      <div
        aria-hidden
        className='pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-teal-300/30 blur-3xl'
      />
      <div className='relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div className='space-y-1'>
          {eyebrow && (
            <p className='text-xs font-semibold uppercase tracking-wider text-white/70'>{eyebrow}</p>
          )}
          <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl'>{title}</h1>
          {description && <p className='max-w-2xl text-sm text-white/80'>{description}</p>}
        </div>
        {actions && <div className='flex flex-wrap gap-2'>{actions}</div>}
      </div>
    </div>
  );
}
