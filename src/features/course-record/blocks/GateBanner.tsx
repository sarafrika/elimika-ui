import { Lock } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { type CourseAccess, courseCapability, fillCourseCopy } from '../types';

/**
 * The gate banner — the one line that tells a gated viewer exactly what is held
 * back and why, before they go looking for it.
 *
 * Three viewers see it and the capability map's `gate` decides all of it: the
 * applicant weighing the course ("Enough to decide, nothing to copy"), the
 * pending applicant whose amber banner says the content stays sealed, and the
 * prospect who may watch the intro but not the lessons. Every other viewer's
 * `gate` is `null` and the block renders nothing.
 *
 * No `<AsyncSection>`, deliberately: the banner is the page's explanation of
 * itself, and a viewer who is about to find lessons missing must read it
 * immediately rather than after a query resolves. Its live figures are `{token}`s
 * that shorten the sentence when they are not there yet.
 */

const GATE_TONES = {
  primary: {
    banner: 'border-primary/30 bg-primary/8',
    icon: 'bg-primary/15 text-primary',
  },
  warning: {
    banner: 'border-warning/35 bg-warning/10',
    icon: 'bg-warning/20 text-warning',
  },
} as const;

export interface GateBannerProps {
  /** From the API. Carries the whole banner through the capability map. */
  access: CourseAccess;
  /**
   * Fills the body's tokens — `{lessons}` and `{duration}` for the applicant,
   * `{contentItems}` for the prospect — and `{introDuration}` in the prospect's
   * call to action.
   */
  vars?: Record<string, string | number | null | undefined>;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function GateBanner({ access, vars, actionHref, onAction, className }: GateBannerProps) {
  const gate = courseCapability(access).gate;

  // Nothing is held back from this viewer.
  if (!gate) return null;

  const tone = GATE_TONES[gate.tone];
  const cta = fillCourseCopy(gate.cta, vars ?? {});

  return (
    <section
      className={cn(
        'flex flex-col gap-3.5 rounded-xl border px-5 py-4 sm:flex-row sm:items-center',
        tone.banner,
        className
      )}
    >
      <span
        className={cn(
          'inline-flex size-[38px] flex-none items-center justify-center rounded-xl',
          tone.icon
        )}
      >
        <Lock className='size-[18px]' aria-hidden />
      </span>

      <div className='min-w-0 flex-1'>
        <h2 className='text-sm font-bold'>{gate.title}</h2>
        <p className='text-muted-foreground mt-[3px] text-[13px] leading-[1.5]'>
          {fillCourseCopy(gate.body, vars ?? {})}
        </p>
      </div>

      {/* The action is offered only where the caller has somewhere to send it. */}
      {actionHref ? (
        <Button asChild className='h-[34px] flex-none rounded-[10px] text-[13px] font-semibold'>
          <Link href={actionHref}>{cta}</Link>
        </Button>
      ) : onAction ? (
        <Button
          className='h-[34px] flex-none rounded-[10px] text-[13px] font-semibold'
          onClick={onAction}
        >
          {cta}
        </Button>
      ) : null}
    </section>
  );
}
