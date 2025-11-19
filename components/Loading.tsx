import type React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  className?: string;
  label?: string;
}

const Loading: React.FC<LoadingProps> = ({ className = '', label }) => (
  <div
    className={cn(`flex flex-1 flex-col items-center justify-center py-8 ${className}`)}
    role='status'
  >
    <Loader2 className='mb-4 h-8 w-8 animate-spin' />
    <span className='text-muted-foreground text-sm'>{label}</span>
  </div>
);

export default Loading;
