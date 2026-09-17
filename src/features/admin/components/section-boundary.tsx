'use client';
// admin-boundary: foundation

import { Clock } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { AsyncSection, type AsyncSectionProps } from '@/components/data/async-section';
import { Button } from '@/components/ui/button';

/** How long a section may load before it says so and offers a retry. */
export const SECTION_TIMEOUT_MS = 10_000;

interface SectionBoundaryProps extends AsyncSectionProps {
  /** What this section is, used in the timeout message. */
  label?: string;
  timeoutMs?: number;
}

/**
 * AsyncSection with a time limit. A section that never resolves — a missing endpoint,
 * a hung request — stops looking like it is about to finish and offers a way out.
 * Nothing here blocks the rest of the page.
 */
export function SectionBoundary({
  label = 'this section',
  timeoutMs = SECTION_TIMEOUT_MS,
  loading,
  onRetry,
  children,
  ...rest
}: SectionBoundaryProps) {
  const [timedOut, setTimedOut] = useState(false);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    if (!loading || waiting) {
      setTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setTimedOut(true), timeoutMs);
    return () => clearTimeout(timer);
  }, [loading, waiting, timeoutMs]);

  if (loading && timedOut) {
    return (
      <SectionTimeout
        label={label}
        onRetry={() => {
          setTimedOut(false);
          onRetry?.();
        }}
        onKeepWaiting={() => {
          setWaiting(true);
          setTimedOut(false);
        }}
      />
    );
  }

  return (
    <AsyncSection loading={loading} onRetry={onRetry} {...rest}>
      {children}
    </AsyncSection>
  );
}

function SectionTimeout({
  label,
  onRetry,
  onKeepWaiting,
}: {
  label: string;
  onRetry: () => void;
  onKeepWaiting: () => void;
}): ReactNode {
  return (
    <div className='border-warning/40 bg-warning/5 flex flex-col gap-3 rounded-md border p-5'>
      <div className='flex items-center gap-2'>
        <Clock className='text-warning size-4' />
        <p className='text-foreground text-sm font-semibold'>
          Loading {label} is taking longer than usual
        </p>
      </div>
      <p className='text-muted-foreground text-sm'>
        The rest of the page is unaffected. Retry, or keep waiting if you know this one is slow.
      </p>
      <div className='flex flex-wrap gap-2'>
        <Button variant='outline' size='sm' className='rounded-md' onClick={onRetry}>
          Retry
        </Button>
        <Button variant='ghost' size='sm' onClick={onKeepWaiting}>
          Keep waiting
        </Button>
      </div>
    </div>
  );
}
