import { Button } from '@/components/ui/button';
import { MoreHorizontal, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type OverviewSectionShellProps = {
  children: React.ReactNode;
  className?: string;
  onActionLabel?: string;
  title: string;
  trailingMode?: 'ellipsis' | 'link' | 'none';
};

export function OverviewSectionShell({
  children,
  className,
  onActionLabel = 'See All',
  title,
  trailingMode = 'link',
}: OverviewSectionShellProps) {
  return (
    <section className={cn('rounded-[12px] border border-[#e6e8fb] bg-[#fbfbff]', className)}>
      <div className='flex items-center justify-between gap-3 px-4 py-3'>
        <h2 className='text-[1.15rem] font-semibold text-slate-800 sm:text-[1.2rem]'>{title}</h2>
        {trailingMode === 'ellipsis' ? (
          <button
            type='button'
            aria-label={`${title} options`}
            className='text-slate-400 transition hover:text-slate-600'
          >
            <MoreHorizontal className='size-5' />
          </button>
        ) : null}
        {trailingMode === 'link' ? (
          <Button
            variant='ghost'
            className='h-auto p-0 text-sm font-medium text-blue-600 hover:bg-transparent hover:text-blue-700'
          >
            {onActionLabel}
            <ChevronRight className='ml-1 size-4' />
          </Button>
        ) : null}
      </div>
      <div className='px-3 pb-3'>{children}</div>
    </section>
  );
}
