import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className='flex flex-col items-center justify-center gap-3 px-6 py-12 text-center'>
      <div className='bg-primary/10 text-primary flex h-14 w-14 items-center justify-center rounded-full'>
        <Icon className='h-6 w-6' />
      </div>
      <div className='space-y-1'>
        <h3 className='text-base font-semibold'>{title}</h3>
        {description && (
          <p className='text-muted-foreground mx-auto max-w-sm text-sm'>{description}</p>
        )}
      </div>
      {action && <div className='mt-2 flex flex-wrap justify-center gap-2'>{action}</div>}
    </div>
  );
}
