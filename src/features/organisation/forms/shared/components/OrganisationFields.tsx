import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import LocationInput from '@/components/locationInput';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type SharedFormProps<TFieldValues extends FieldValues> = {
  form: UseFormReturn<TFieldValues>;
};

type OrganisationIdentityFieldsProps<TFieldValues extends FieldValues> =
  SharedFormProps<TFieldValues> & {
    nameLabel?: string;
    namePlaceholder: string;
    nameDescription?: string;
    licenceLabel?: string;
    licencePlaceholder: string;
    licenceDescription?: string;
    descriptionLabel?: string;
    descriptionPlaceholder: string;
    descriptionDescription?: string;
    descriptionRows?: number;
    requiredName?: boolean;
  };

export function OrganisationIdentityFields<TFieldValues extends FieldValues>({
  form,
  nameLabel = 'Organisation name',
  namePlaceholder,
  nameDescription,
  licenceLabel = 'Licence number',
  licencePlaceholder,
  licenceDescription,
  descriptionLabel = 'About your organisation',
  descriptionPlaceholder,
  descriptionDescription,
  descriptionRows = 4,
  requiredName = false,
}: OrganisationIdentityFieldsProps<TFieldValues>) {
  return (
    <>
      <div className='grid gap-6 sm:grid-cols-2'>
        <FormField
          control={form.control}
          name={'name' as Path<TFieldValues>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {nameLabel}
                {requiredName ? <span className='text-destructive'> *</span> : null}
              </FormLabel>
              <FormControl>
                <Input placeholder={namePlaceholder} {...field} />
              </FormControl>
              {nameDescription ? <FormDescription>{nameDescription}</FormDescription> : null}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={'licence_no' as Path<TFieldValues>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{licenceLabel}</FormLabel>
              <FormControl>
                <Input placeholder={licencePlaceholder} {...field} />
              </FormControl>
              {licenceDescription ? <FormDescription>{licenceDescription}</FormDescription> : null}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name={'description' as Path<TFieldValues>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{descriptionLabel}</FormLabel>
            <FormControl>
              <Textarea
                placeholder={descriptionPlaceholder}
                className='resize-none'
                rows={descriptionRows}
                {...field}
              />
            </FormControl>
            {descriptionDescription ? (
              <FormDescription>{descriptionDescription}</FormDescription>
            ) : null}
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

type OrganisationLocationFieldProps<TFieldValues extends FieldValues> =
  SharedFormProps<TFieldValues> & {
    coordinates: {
      latitude?: number;
      longitude?: number;
    };
    label?: string;
    description?: string;
    onSuggest: Parameters<typeof LocationInput>[0]['onSuggest'];
  };

export function OrganisationLocationField<TFieldValues extends FieldValues>({
  form,
  coordinates,
  label = 'Physical address',
  description,
  onSuggest,
}: OrganisationLocationFieldProps<TFieldValues>) {
  return (
    <FormField
      control={form.control}
      name={'location' as Path<TFieldValues>}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <LocationInput {...field} coordinates={coordinates} onSuggest={onSuggest} />
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

type OrganisationCountryFieldProps<TFieldValues extends FieldValues> =
  SharedFormProps<TFieldValues> & {
    label?: string;
    placeholder: string;
    description?: string;
  };

export function OrganisationCountryField<TFieldValues extends FieldValues>({
  form,
  label = 'Country',
  placeholder,
  description,
}: OrganisationCountryFieldProps<TFieldValues>) {
  return (
    <FormField
      control={form.control}
      name={'country' as Path<TFieldValues>}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input placeholder={placeholder} {...field} />
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

type OrganisationWebsiteFieldProps<TFieldValues extends FieldValues> =
  SharedFormProps<TFieldValues> & {
    label?: string;
    placeholder: string;
    description?: string;
  };

export function OrganisationWebsiteField<TFieldValues extends FieldValues>({
  form,
  label = 'Website',
  placeholder,
  description,
}: OrganisationWebsiteFieldProps<TFieldValues>) {
  return (
    <FormField
      control={form.control}
      name={'website' as Path<TFieldValues>}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input placeholder={placeholder} {...field} />
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
