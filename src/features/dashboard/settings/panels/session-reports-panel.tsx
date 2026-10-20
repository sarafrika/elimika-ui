'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { STALE_TIMES } from '@/lib/query-client';
import { getOptions, getQueryKey, updateMutation } from '@/services/client/@tanstack/react-query.gen';
import { useOrganisation } from '@/src/features/organisation/context/organisation-context';

const PRESETS: { hours: number; label: string }[] = [
  { hours: 24, label: '24 hours' },
  { hours: 48, label: '48 hours' },
  { hours: 72, label: '3 days' },
  { hours: 168, label: '7 days' },
];

/** How long trainers may still correct a submitted session report before it locks. */
export function SessionReportsPanel() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const client = useQueryClient();
  const query = useQuery({
    ...getOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
    staleTime: STALE_TIMES.entity,
  });
  const mutation = useMutation(updateMutation());
  const saved = query.data?.data?.session_report_grace_hours;
  const [draft, setDraft] = useState<string | null>(null);
  const [savedHours, setSavedHours] = useState<number | null>(null);
  const value = draft ?? (saved != null ? String(saved) : '48');
  const hours = Number(value);
  const valid = Number.isInteger(hours) && hours >= 1 && hours <= 720;

  const save = async () => {
    if (!valid || !organisationUuid) return;
    const response = await mutation.mutateAsync({
      path: { organisationUuid },
      body: { session_report_grace_hours: hours },
    });
    if (!response?.success) {
      toast.error(response?.message || 'Could not save the grace period.');
      return;
    }
    setSavedHours(hours);
    toast.success('Grace period saved.');
    await client.invalidateQueries({ queryKey: getQueryKey({ path: { organisationUuid } }) });
  };

  return (
    <Card className='max-w-2xl'>
      <CardHeader>
        <CardTitle>Session reports</CardTitle>
        <CardDescription>How long trainers may still correct a session report after submitting it.</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {query.isLoading ? (
          <Skeleton className='h-24 w-full' />
        ) : (
          <>
            <Label htmlFor='session-report-grace'>Trainers can edit a submitted report for</Label>
            <fieldset className='flex flex-wrap gap-2' aria-label='Grace period presets'>
              {PRESETS.map(preset => (
                <Button
                  key={preset.hours}
                  type='button'
                  size='sm'
                  variant={hours === preset.hours ? 'default' : 'outline'}
                  aria-pressed={hours === preset.hours}
                  onClick={() => {
                    setDraft(String(preset.hours));
                    setSavedHours(null);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </fieldset>
            <div className='flex items-center gap-2'>
              <Input
                id='session-report-grace'
                inputMode='numeric'
                className='w-24 font-mono'
                value={value}
                aria-describedby='session-report-grace-help'
                aria-invalid={!valid}
                onChange={event => {
                  setDraft(event.target.value.replace(/[^0-9]/g, ''));
                  setSavedHours(null);
                }}
              />
              <span>hours</span>
            </div>
            <p id='session-report-grace-help' className='text-muted-foreground text-sm'>
              Between 1 hour and 30 days. After this the report locks and its attendance and marks can no
              longer change. Reports are due 24 hours after each session.
            </p>
            <div className='flex justify-end'>
              <Button onClick={() => void save()} disabled={!valid || mutation.isPending}>
                Save
              </Button>
            </div>
            {savedHours != null && (
              <p role='status' className='bg-primary/10 rounded-md px-3 py-2 text-sm'>
                Saved. Reports submitted from now on stay editable for {savedHours} hours.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
