import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toSafeHref } from '@/src/features/catalogue/format';
import { PROSPECT_GATE } from '@/src/features/catalogue/prospect';

/**
 * The gate banner — the one line that tells a reader exactly what is held back
 * and why, before they go looking for it.
 *
 * It sits above the body on purpose: a prospect who is about to find lesson
 * content missing should read the reason first, not discover it by scrolling.
 * The intro video is the one piece of teaching material a prospect may open, so
 * the call to action appears only when the course actually carries one.
 */
export function CourseGateBanner({
  introVideoUrl,
  className,
}: {
  introVideoUrl?: string | null;
  className?: string;
}) {
  const introHref = toSafeHref(introVideoUrl);

  return (
    <section
      className={cn(
        'border-primary/30 bg-primary/8 flex flex-col gap-3.5 rounded-xl border px-5 py-4 sm:flex-row sm:items-center',
        className
      )}
    >
      <span className='bg-primary/15 text-primary inline-flex size-[38px] flex-none items-center justify-center rounded-xl'>
        <Lock className='size-[18px]' aria-hidden />
      </span>

      <div className='min-w-0 flex-1'>
        <h2 className='text-sm font-bold'>{PROSPECT_GATE.title}</h2>
        <p className='text-muted-foreground mt-[3px] text-[13px] leading-[1.5]'>
          {PROSPECT_GATE.body}
        </p>
      </div>

      {introHref ? (
        <Button asChild className='h-[34px] flex-none rounded-[10px] text-[13px] font-semibold'>
          <a href={introHref} target='_blank' rel='noopener noreferrer'>
            {PROSPECT_GATE.cta}
          </a>
        </Button>
      ) : null}
    </section>
  );
}
