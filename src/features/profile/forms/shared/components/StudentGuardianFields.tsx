import type { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { StudentProfileFormData } from '@/src/features/profile/forms/shared/student-profile';

type StudentGuardianFieldsProps = {
  form: UseFormReturn<StudentProfileFormData>;
  variant: 'onboarding' | 'add-profile';
};

export function StudentGuardianFields({ form, variant }: StudentGuardianFieldsProps) {
  if (variant === 'add-profile') {
    return (
      <>
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>Primary Guardian (Optional)</h3>
          <GuardianNameField
            form={form}
            name='first_guardian_name'
            label='Guardian Name'
            placeholder='Enter guardian name'
            description='Full name of your primary guardian'
          />
          <GuardianMobileField
            form={form}
            name='first_guardian_mobile'
            label='Guardian Mobile'
            placeholder='+254 700 000 000'
            description='Mobile number of your primary guardian'
          />
        </div>

        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>Secondary Guardian (Optional)</h3>
          <GuardianNameField
            form={form}
            name='second_guardian_name'
            label='Guardian Name'
            placeholder='Enter guardian name'
            description='Full name of your secondary guardian'
          />
          <GuardianMobileField
            form={form}
            name='second_guardian_mobile'
            label='Guardian Mobile'
            placeholder='+254 700 000 000'
            description='Mobile number of your secondary guardian'
          />
        </div>
      </>
    );
  }

  return (
    <>
      <GuardianNameField
        form={form}
        name='first_guardian_name'
        label='Primary Guardian Name (Optional)'
        placeholder='John Doe'
      />
      <GuardianMobileField
        form={form}
        name='first_guardian_mobile'
        label='Primary Guardian Mobile (Optional)'
        placeholder='Phone number (optional)'
        description='Phone number (any format accepted)'
      />
      <GuardianNameField
        form={form}
        name='second_guardian_name'
        label='Secondary Guardian Name (Optional)'
        placeholder='Jane Doe'
      />
      <GuardianMobileField
        form={form}
        name='second_guardian_mobile'
        label='Secondary Guardian Mobile (Optional)'
        placeholder='Phone number (optional)'
        description='Phone number (any format accepted)'
      />
    </>
  );
}

function GuardianNameField({
  form,
  name,
  label,
  placeholder,
  description,
}: {
  form: UseFormReturn<StudentProfileFormData>;
  name: 'first_guardian_name' | 'second_guardian_name';
  label: string;
  placeholder: string;
  description?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
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

function GuardianMobileField({
  form,
  name,
  label,
  placeholder,
  description,
}: {
  form: UseFormReturn<StudentProfileFormData>;
  name: 'first_guardian_mobile' | 'second_guardian_mobile';
  label: string;
  placeholder: string;
  description?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
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
