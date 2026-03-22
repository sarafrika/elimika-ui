import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type CataloguePageShellProps = {
  children: ReactNode;
  contentClassName?: string;
};

export function CataloguePageShell({ children, contentClassName }: CataloguePageShellProps) {
  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:py-16',
        contentClassName
      )}
    >
      {children}
    </div>
  );
}
