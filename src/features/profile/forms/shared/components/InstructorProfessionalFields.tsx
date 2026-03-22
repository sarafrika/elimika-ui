import type { UseFormReturn } from 'react-hook-form';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { InstructorProfileFormData } from '@/src/features/profile/forms/shared/instructor-profile';

type InstructorProfessionalFieldsProps = {
  form: UseFormReturn<InstructorProfileFormData>;
  professionalHeadlinePlaceholder: string;
  bioDescription: string;
  websitePlaceholder: string;
  websiteDescription: string;
};

export function InstructorProfessionalFields({
  form,
  professionalHeadlinePlaceholder,
  bioDescription,
  websitePlaceholder,
  websiteDescription,
}: InstructorProfessionalFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name='professional_headline'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Professional Headline</FormLabel>
            <FormControl>
              <Input placeholder={professionalHeadlinePlaceholder} {...field} />
            </FormControl>
            <FormDescription>
              A brief title that summarizes your expertise (max 150 characters)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='bio'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bio</FormLabel>
            <FormControl>
              <SimpleEditor
                value={field.value ?? ''}
                onChange={field.onChange}
                showToolbar
                isEditable
              />
            </FormControl>
            <FormDescription>{bioDescription}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='website'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Website (Optional)</FormLabel>
            <FormControl>
              <Input type='url' placeholder={websitePlaceholder} {...field} />
            </FormControl>
            <FormDescription>{websiteDescription}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
