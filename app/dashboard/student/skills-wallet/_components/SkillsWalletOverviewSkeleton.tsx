import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const METRICS = [
  { name: 'skills', tint: 'bg-primary/10' },
  { name: 'education', tint: 'bg-primary/10' },
  { name: 'competencies', tint: 'bg-warning/10' },
  { name: 'credentials', tint: 'bg-success/10' },
  { name: 'projects', tint: 'bg-secondary' },
  { name: 'achievements', tint: 'bg-muted' },
];

function Placeholder({ className }: { className?: string }) {
  return (
    <Skeleton
      className={cn('bg-muted dark:bg-foreground/10 motion-reduce:animate-none', className)}
    />
  );
}

function PanelHeader({ badge = false }: { badge?: boolean }) {
  return (
    <CardHeader className='flex flex-row items-center justify-between gap-2 pb-3'>
      <Placeholder className='h-4 w-36 max-w-[60%]' />
      <Placeholder className={cn('h-8 w-20 shrink-0', badge && 'h-5 w-16 rounded-full')} />
    </CardHeader>
  );
}

export function SkillsWalletOverviewSkeleton() {
  return (
    <div role='status' aria-label='Loading wallet overview' aria-busy='true'>
      <span className='sr-only'>Loading your skills wallet overview…</span>
      <div className='space-y-6' aria-hidden='true'>
        <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
          <Placeholder className='h-7 w-64 max-w-full' />
          <Placeholder className='h-9 w-32 rounded-md' />
        </div>

        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6'>
          {METRICS.map(metric => (
            <Card key={metric.name} className='rounded-sm'>
              <CardContent className='flex items-start gap-4 px-4 py-0'>
                <div
                  className={cn(
                    'grid h-11 w-11 shrink-0 place-items-center rounded-full',
                    metric.tint
                  )}
                >
                  <Placeholder className='h-5 w-5 rounded-md' />
                </div>
                <div className='min-w-0 flex-1'>
                  <Placeholder className='my-1 h-3 w-24 max-w-full' />
                  <Placeholder className='my-1 h-7 w-10' />
                  <div className='mt-1 flex h-7 items-center px-2'>
                    <Placeholder className='h-3 w-20 max-w-full' />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className='grid gap-4 lg:grid-cols-2 2xl:grid-cols-4'>
          <Card className='rounded-md'>
            <PanelHeader badge />
            <CardContent className='flex items-center gap-6'>
              <div className='relative h-[132px] w-[132px] shrink-0'>
                <Placeholder className='h-full w-full rounded-full' />
                <div className='bg-card absolute inset-3 flex flex-col items-center justify-center gap-2 rounded-full'>
                  <Placeholder className='h-7 w-12' />
                  <Placeholder className='h-2 w-10' />
                  <Placeholder className='h-2 w-14' />
                </div>
              </div>
              <div className='min-w-0 flex-1 space-y-2'>
                {['expert', 'advanced', 'intermediate', 'beginner'].map(level => (
                  <div key={level} className='flex h-5 items-center gap-2'>
                    <Placeholder className='h-2.5 w-2.5 shrink-0 rounded-full' />
                    <Placeholder className='h-3 flex-1' />
                    <Placeholder className='ml-auto h-3 w-6 shrink-0' />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className='rounded-md'>
            <PanelHeader />
            <CardContent className='space-y-3'>
              {['w-3/4', 'w-1/2', 'w-2/3', 'w-3/5', 'w-2/5'].map(width => (
                <div key={width} className='flex items-center gap-3'>
                  <Placeholder className='h-8 w-8 shrink-0' />
                  <div className='min-w-0 flex-1'>
                    <div className='flex h-5 items-center justify-between gap-3'>
                      <Placeholder className={cn('h-3', width)} />
                      <Placeholder className='h-2.5 w-12 shrink-0' />
                    </div>
                    <div className='mt-1 flex h-4 items-center gap-2'>
                      <div className='bg-muted/50 h-1.5 flex-1 overflow-hidden rounded-full'>
                        <Placeholder className={cn('h-full rounded-full', width)} />
                      </div>
                      <Placeholder className='h-2.5 w-9' />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {['education', 'achievements'].map(section => (
            <Card key={section} className='rounded-md'>
              <PanelHeader />
              <CardContent className='space-y-3'>
                {['w-4/5', 'w-3/5', 'w-2/3', 'w-1/2'].map(width => (
                  <div key={width} className='flex items-start gap-3'>
                    <Placeholder
                      className={cn('h-8 w-8 shrink-0', section === 'achievements' && 'h-9 w-9')}
                    />
                    <div className='min-w-0 flex-1 space-y-1.5 py-1'>
                      <Placeholder className={cn('h-3', width)} />
                      <Placeholder className='h-2.5 w-5/6' />
                      <Placeholder className='h-2.5 w-2/5' />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
