'use client';

import { type ComponentType } from 'react';

export const PreviewRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) => (
  <div className="grid min-w-0 gap-2 px-4 py-2.5 sm:px-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center">
    <div className="flex min-w-0 items-center gap-3">
      <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
        <Icon className="h-4 w-4" />
      </div>

      <span className="text-muted-foreground min-w-0 truncate text-sm font-medium">
        {label}
      </span>
    </div>

    <div className="text-foreground min-w-0 truncate text-sm font-medium md:text-right">
      {value}
    </div>
  </div>
);
