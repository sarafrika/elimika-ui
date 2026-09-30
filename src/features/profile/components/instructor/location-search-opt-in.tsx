'use client';

import { useMutation } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { asRecord, getErrorMessage } from '@/lib/error-utils';
import { setLocationSearchOptInMutation } from '@/services/client/@tanstack/react-query.gen';

/** The typed 200 is the instructor; the API may also wrap it as `{ data: instructor }`. */
function savedOptIn(response: unknown): boolean | undefined {
  const record = asRecord(response);
  const value = record?.location_search_opt_in ?? asRecord(record?.data)?.location_search_opt_in;
  return typeof value === 'boolean' ? value : undefined;
}

/**
 * "Show me in location search": `PUT /api/v1/instructors/{uuid}/location-search {enabled}`,
 * owner only. The current value is `location_search_opt_in` on the owner's own instructor
 * profile. Saves on toggle, independently of the profile form.
 */
export function LocationSearchOptIn({
  instructorUuid,
  enabled,
  hasCoordinates,
  verified,
  onSaved,
}: {
  instructorUuid: string | null | undefined;
  enabled: boolean | null | undefined;
  hasCoordinates: boolean;
  verified: boolean;
  onSaved?: () => void | Promise<void>;
}) {
  const switchId = useId();
  const descriptionId = useId();
  const [checked, setChecked] = useState(Boolean(enabled));

  useEffect(() => {
    setChecked(Boolean(enabled));
  }, [enabled]);

  const mutation = useMutation(setLocationSearchOptInMutation());

  const onToggle = (next: boolean) => {
    if (!instructorUuid) return;
    const previous = checked;
    setChecked(next);
    mutation.mutate(
      { path: { uuid: instructorUuid }, body: { enabled: next } },
      {
        onSuccess: response => {
          const saved = savedOptIn(response);
          setChecked(typeof saved === 'boolean' ? saved : next);
          toast.success(
            next ? 'You now appear in location search.' : 'You no longer appear in location search.'
          );
          void onSaved?.();
        },
        onError: error => {
          setChecked(previous);
          toast.error(
            getErrorMessage(error, 'Could not update location search. Please try again.')
          );
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base'>
          <MapPin className='size-4' aria-hidden />
          Location search
        </CardTitle>
        <CardDescription id={descriptionId}>
          Let learners and organisations find you with &quot;Near me&quot;. Your location is matched
          approximately, to about 1 km, and your exact coordinates are never shown to anyone.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div className='flex items-center justify-between gap-4'>
          <Label htmlFor={switchId} className='font-medium'>
            Show me in location search
          </Label>
          <div className='flex items-center gap-2'>
            {mutation.isPending ? <Spinner className='size-4' /> : null}
            <Switch
              id={switchId}
              checked={checked}
              onCheckedChange={onToggle}
              disabled={!instructorUuid || mutation.isPending}
              aria-describedby={descriptionId}
            />
          </div>
        </div>
        {checked && (!verified || !hasCoordinates) ? (
          <p className='text-muted-foreground text-xs' role='status'>
            You will only appear once{' '}
            {!verified && !hasCoordinates
              ? 'your profile is verified and your primary location is set'
              : !verified
                ? 'your profile is verified'
                : 'your primary location is set'}
            .
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
