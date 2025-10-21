'use client';

import { ProfileFormSection, ProfileFormShell } from '@/components/profile/profile-form-layout';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';
import { useProfileFormMode } from '@/context/profile-form-mode-context';
import { useUserProfile } from '@/context/profile-context';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const trainingAreasSchema = z.object({
  areas: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().min(1, 'Training area name is required.'),
    })
  ),
});

type TrainingAreasFormValues = z.infer<typeof trainingAreasSchema>;

export default function TrainingAreasSettings() {
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'profile', title: 'Profile', url: '/dashboard/profile' },
      {
        id: 'training-areas',
        title: 'Training Areas',
        url: '/dashboard/profile/training-areas',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const user = useUserProfile();
  const { disableEditing, isEditing, requestConfirmation, isConfirming } = useProfileFormMode();

  const form = useForm<TrainingAreasFormValues>({
    resolver: zodResolver(trainingAreasSchema),
    defaultValues: {
      areas: [{ name: 'Web Development' }, { name: 'Data Science' }],
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'areas',
  });

  const handleSubmit = (data: TrainingAreasFormValues) => {
    requestConfirmation({
      title: 'Save training areas?',
      description: 'Learners use these interests to discover the sessions you can facilitate.',
      confirmLabel: 'Save interests',
      cancelLabel: 'Keep editing',
      onConfirm: async () => {
        // Placeholder for future API work
        await new Promise(resolve => setTimeout(resolve, 300));
        toast.success('Training areas updated');
        disableEditing();
      },
    });
  };

  const domainBadges =
    user?.user_domain?.map(domain =>
      domain
        .split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    ) ?? [];

  return (
    <ProfileFormShell
      eyebrow='Instructor'
      title='Interested training areas'
      description='List the subjects or courses you are interested in teaching.'
      badges={domainBadges}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
          <ProfileFormSection
            title='Focus areas'
            description='Add or remove the disciplines you would like to facilitate.'
            footer={
              <Button
                type='submit'
                className='min-w-36'
                disabled={!isEditing || isConfirming}
              >
                {isConfirming ? (
                  <span className='flex items-center gap-2'>
                    <Spinner className='h-4 w-4' />
                    Saving…
                  </span>
                ) : (
                  'Save changes'
                )}
              </Button>
            }
          >
            <div className='space-y-4'>
              {fields.map((field, index) => (
                <div key={field.id} className='flex items-end gap-4 rounded-md border p-4'>
                  <FormField
                    control={form.control}
                    name={`areas.${index}.name`}
                    render={({ field }) => (
                      <FormItem className='flex-1'>
                        <FormLabel>Area / subject / course</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='e.g. Graphic Design, Yoga, Public Speaking'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type='button'
                    variant='destructive'
                    size='icon'
                    onClick={() => remove(index)}
                    className='h-10 w-10 flex-shrink-0'
                    disabled={!isEditing}
                  >
                    <Trash2 className='h-4 w-4' />
                    <span className='sr-only'>Remove area</span>
                  </Button>
                </div>
              ))}
            </div>

            <Button
              type='button'
              variant='outline'
              className='flex w-full items-center justify-center gap-2'
              onClick={() => append({ name: '' })}
              disabled={!isEditing}
            >
              <PlusCircle className='h-4 w-4' />
              Add another area
            </Button>
          </ProfileFormSection>
        </form>
      </Form>
    </ProfileFormShell>
  );
}
