// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
import type { LucideIcon } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import LocationInput from '@/components/locationInput';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { coordinatesFromPlace } from '@/lib/location-types';
import type { InstructorProfileFormData } from '@/src/features/profile/forms/shared/instructor-profile';

type InstructorLocationFieldsProps = {
  form: UseFormReturn<InstructorProfileFormData>;
  onUseCurrentLocation: () => void;
  buttonLabel: string;
  buttonClassName?: string;
  buttonIcon?: LucideIcon;
  fieldsWrapperClassName: string;
  fieldItemClassName?: string;
};

export function InstructorLocationFields({
  form,
  onUseCurrentLocation,
  buttonLabel,
  buttonClassName,
  buttonIcon: ButtonIcon,
  fieldsWrapperClassName,
  fieldItemClassName,
}: InstructorLocationFieldsProps) {
  const latitude = form.watch('latitude');
  const longitude = form.watch('longitude');

  return (
    <>
      <div className={fieldsWrapperClassName}>
        <FormField
          control={form.control}
          name='location_name'
          render={({ field }) => (
            <FormItem className={fieldItemClassName}>
              <FormLabel>Where you teach</FormLabel>
              <FormControl>
                <LocationInput
                  name={field.name}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder='Search for a place — e.g. Sarit Centre, Nairobi'
                  coordinates={{ latitude, longitude }}
                  onSuggest={response => {
                    const place = coordinatesFromPlace(response);
                    if (place.latitude !== undefined) form.setValue('latitude', place.latitude);
                    if (place.longitude !== undefined) form.setValue('longitude', place.longitude);
                    return response;
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <p className='text-muted-foreground text-xs'>
        {latitude != null && longitude != null
          ? `Pinned at ${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}.`
          : 'Pick a result to place yourself on the map — the coordinates fill in automatically.'}
      </p>

      <Button
        type='button'
        variant='outline'
        onClick={onUseCurrentLocation}
        className={buttonClassName}
      >
        {ButtonIcon ? <ButtonIcon className='mr-2 h-4 w-4' /> : null}
        {buttonLabel}
      </Button>
    </>
  );
}
