import { ExternalLink, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { SharedCredentialSummary, SharedTimelineItem } from '../types';

type CredentialSummaryPanelProps = {
  summary: SharedCredentialSummary;
  timeline: SharedTimelineItem[];
};

export function CredentialSummaryPanel({ summary, timeline }: CredentialSummaryPanelProps) {
  const values = [
    { label: 'Skill Badges', value: summary.badgesEarned },
    { label: 'Certificates Earned', value: summary.certificatesEarned },
    { label: 'Shares', value: summary.shares },
  ];

  return (
    <div className='grid gap-4'>
      <article className='h-auto border-border/60 bg-card rounded-lg border p-3 shadow-sm'>
        <h2 className='mb-3 text-sm font-semibold sm:text-base'>Credential Summary</h2>
        <div className='grid grid-cols-3 gap-2'>
          {values.map(item => (
            <div key={item.label} className='bg-muted/50 rounded-md px-2 py-3 text-center'>
              <p className='text-primary text-lg font-semibold sm:text-xl'>{item.value}</p>
              <p className='text-muted-foreground text-[10px] sm:text-xs'>{item.label}</p>
            </div>
          ))}
        </div>

        <div className='mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2'>
          <div className='border-border/60 bg-background flex items-center gap-2 rounded-md border p-2'>
            <span className='bg-primary/10 text-primary grid size-8 place-items-center rounded-md'>
              <ShieldCheck className='size-4' />
            </span>
            <div className='min-w-0'>
              <p className='text-foreground truncate text-xs font-medium'>Verified Wallet</p>
              <p className='text-muted-foreground text-[10px]'>Ready to share</p>
            </div>
          </div>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='h-auto justify-between py-2 text-xs'
          >
            View Details
            <ExternalLink className='size-3.5' />
          </Button>
        </div>
      </article>

      {/* <article className='border-border/60 bg-card rounded-lg border p-3 shadow-sm'>
        <h2 className='mb-3 text-sm font-semibold sm:text-base'>Growth Timeline</h2>
        <div className='space-y-2'>
          {timeline.slice(0, 3).map(item => (
            <div
              key={item.id}
              className='border-border/60 bg-background grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-md border px-2 py-2'
            >
              <span className='bg-primary/10 text-primary grid size-7 place-items-center rounded-md'>
                {item.icon ?? <ShieldCheck className='size-4' />}
              </span>
              <div className='min-w-0'>
                <p className='text-foreground truncate text-xs font-medium'>{item.provider}</p>
                <p className='text-muted-foreground truncate text-[10px]'>{item.description}</p>
              </div>
              {item.metric ? (
                <span className='text-muted-foreground text-[10px]'>{item.metric}</span>
              ) : null}
            </div>
          ))}
        </div>
      </article> */}
    </div>
  );
}
