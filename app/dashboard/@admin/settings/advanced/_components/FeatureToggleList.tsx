'use client';

import * as React from 'react';

import { Button } from '@ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@ui/card';
import { Switch } from '@ui/switch';

import {
  FeatureToggle,
  useAdminFeatureToggles,
  useAdminUpdateFeatureToggle,
} from '@/services/admin/settings';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function FeatureToggleList() {
  const { data: toggles = [], isLoading, isError, refetch } = useAdminFeatureToggles();
  const updateToggle = useAdminUpdateFeatureToggle();

  const handleToggle = React.useCallback(
    async (feature: FeatureToggle, enabled: boolean) => {
      try {
        await updateToggle.mutateAsync({ featureName: feature.name, enabled });
        toast.success(`${feature.name} ${enabled ? 'enabled' : 'disabled'}`);
      } catch (_error) {
        toast.error('We were unable to update the feature flag. Please try again.');
      }
    },
    [updateToggle]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature lifecycle</CardTitle>
        <CardDescription>
          Enable beta capabilities for trusted admins or revert changes instantly if issues arise.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {isError ? (
          <div className='rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive-foreground'>
            <p>We couldn&apos;t load the current feature flags.</p>
            <Button variant='outline' size='sm' className='mt-3' onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : null}
        <div className='divide-y divide-border rounded-md border border-border/70'>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className='flex items-center justify-between gap-3 px-4 py-5'>
                <div className='space-y-2'>
                  <div className='h-4 w-32 rounded bg-muted' />
                  <div className='h-3 w-48 rounded bg-muted/80' />
                </div>
                <div className='h-6 w-12 rounded bg-muted' />
              </div>
            ))
          ) : toggles.length > 0 ? (
            toggles.map(toggle => (
              <div
                key={toggle.name}
                className={cn(
                  'flex flex-col gap-2 px-4 py-4 transition-colors sm:flex-row sm:items-center sm:justify-between',
                  toggle.enabled ? 'bg-primary/5' : undefined
                )}
              >
                <div className='max-w-xl space-y-1'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-semibold text-foreground'>{toggle.name}</span>
                    {toggle.category ? (
                      <span className='rounded-full border border-border px-2 py-0.5 text-xs uppercase tracking-wide text-muted-foreground'>
                        {toggle.category}
                      </span>
                    ) : null}
                  </div>
                  {toggle.description ? (
                    <p className='text-sm text-muted-foreground'>{toggle.description}</p>
                  ) : (
                    <p className='text-sm text-muted-foreground'>No description provided.</p>
                  )}
                </div>
                <Switch
                  checked={toggle.enabled}
                  onCheckedChange={value => handleToggle(toggle, value)}
                  disabled={updateToggle.isPending}
                  aria-label={`Toggle feature ${toggle.name}`}
                />
              </div>
            ))
          ) : (
            <div className='px-4 py-16 text-center text-sm text-muted-foreground'>
              No feature flags found for this environment.
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className='flex justify-between border-t border-border bg-muted/40 px-6 py-4 text-xs text-muted-foreground'>
        <span>{toggles.length} feature flags loaded</span>
        <span>Changes take effect instantly for all admins.</span>
      </CardFooter>
    </Card>
  );
}
