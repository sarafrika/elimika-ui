import { ComponentProps } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const Spinner = ({ className, ...props }: ComponentProps<typeof Skeleton>) => (
  <Skeleton className={cn('h-4 w-4 rounded-full', className)} {...props} />
);

export default Spinner;
