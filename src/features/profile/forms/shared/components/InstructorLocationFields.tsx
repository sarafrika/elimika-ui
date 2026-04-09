import type { LucideIcon } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { InstructorProfileFormData } from '@/src/features/profile/forms/shared/instructor-profile';

type InstructorLocationFieldsProps = {
  form: UseFormReturn<InstructorProfileFormData>;
  onUseCurrentLocation: () => void;
  latitudePlaceholder: string;
  longitudePlaceholder: string;
  buttonLabel: string;
  buttonClassName?: string;
  buttonIcon?: LucideIcon;
  fieldsWrapperClassName: string;
  fieldItemClassName?: string;
};

export function InstructorLocationFields({
  form,
  onUseCurrentLocation,
  latitudePlaceholder,
  longitudePlaceholder,
  buttonLabel,
  buttonClassName,
  buttonIcon: ButtonIcon,
  fieldsWrapperClassName,
  fieldItemClassName,
}: InstructorLocationFieldsProps) {
  return (
    <>
      <div className={fieldsWrapperClassName}>
        <FormField
          control={form.control}
          name='latitude'
          render={({ field }) => (
            <FormItem className={fieldItemClassName}>
              <FormLabel>Latitude</FormLabel>
              <FormControl>
                <Input
                  type='number'
                  step='any'
                  placeholder={latitudePlaceholder}
                  {...field}
                  onChange={e =>
                    field.onChange(e.target.value ? Number.parseFloat(e.target.value) : undefined)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='longitude'
          render={({ field }) => (
            <FormItem className={fieldItemClassName}>
              <FormLabel>Longitude</FormLabel>
              <FormControl>
                <Input
                  type='number'
                  step='any'
                  placeholder={longitudePlaceholder}
                  {...field}
                  onChange={e =>
                    field.onChange(e.target.value ? Number.parseFloat(e.target.value) : undefined)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

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
