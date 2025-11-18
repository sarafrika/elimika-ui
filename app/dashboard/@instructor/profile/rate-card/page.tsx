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
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useUserProfile } from '@/context/profile-context';
import { useProfileFormMode } from '@/context/profile-form-mode-context';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const availabilitySchema = z.object({
  calComLink: z.string().url().optional().or(z.literal('')),
  rates: z.object({
    privateInPerson: z.number().optional(),
    privateVirtual: z.number().optional(),
    groupInPerson: z.number().optional(),
    groupVirtual: z.number().optional(),
  }),
});

type AvailabilityFormValues = z.infer<typeof availabilitySchema>;

const classTypes = [
  {
    type: 'Private Classes',
    description: 'Personalized one-on-one instruction tailored to individual needs.',
    methods: [
      { name: 'In-Person', key: 'privateInPerson' },
      { name: 'Virtual', key: 'privateVirtual' },
    ],
  },
  {
    type: 'Group Classes',
    description: 'Engaging sessions for workshops, camps, and group projects.',
    methods: [
      { name: 'In-Person', key: 'groupInPerson' },
      { name: 'Virtual', key: 'groupVirtual' },
    ],
  },
];

export default function AvailabilitySettings() {
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'profile', title: 'Profile', url: '/dashboard/profile' },
      {
        id: 'availability',
        title: 'Availability',
        url: '/dashboard/profile/availability',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const user = useUserProfile();
  const { disableEditing, isEditing, requestConfirmation, isConfirming } = useProfileFormMode();

  const form = useForm<AvailabilityFormValues>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      calComLink: '',
      rates: {},
    },
  });

  const handleSubmit = (_data: AvailabilityFormValues) => {
    requestConfirmation({
      title: 'Save availability?',
      description: 'These preferences tell learners how to book you and what to expect.',
      confirmLabel: 'Save availability',
      cancelLabel: 'Keep editing',
      onConfirm: async () => {
        await new Promise(resolve => setTimeout(resolve, 300));
        toast.success('Availability saved');
        disableEditing();
      },
    });
  };

  const domainBadges =
    (user?.user_domain as string[] | undefined)?.map(domain =>
      domain
        .split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    ) ?? [];

  return (
    <ProfileFormShell
      eyebrow='Instructor'
      title='Instructor Rates'
      description='Define the hourly rates you offer.'
      badges={domainBadges}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
          <ProfileFormSection
            title='Class types & hourly rates'
            description='Set clear pricing for the formats you support so learners can book with confidence.'
            footer={
              <Button type='submit' className='min-w-36' disabled={!isEditing || isConfirming}>
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
            <div className='space-y-6'>
              {classTypes.map(ct => (
                <div key={ct.type} className='bg-muted/30 rounded-lg border p-4'>
                  <h3 className='mb-1 text-lg font-semibold'>{ct.type}</h3>
                  <p className='text-muted-foreground mb-4 text-sm'>{ct.description}</p>
                  <div className='space-y-4'>
                    {ct.methods.map(method => (
                      <FormField
                        key={method.key}
                        control={form.control}
                        name={`rates.${method.key as keyof AvailabilityFormValues['rates']}`}
                        render={({ field }) => (
                          <FormItem className='bg-background flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between'>
                            <FormLabel className='font-medium'>
                              {method.name === 'In-Person' ? '🏢' : '💻'} {method.name} rate (per
                              hour)
                            </FormLabel>
                            <div className='flex items-center gap-2'>
                              <FormControl>
                                <Input
                                  type='number'
                                  min='0'
                                  step='0.01'
                                  placeholder='e.g., 50.00'
                                  className='w-32 text-right'
                                  {...field}
                                  onChange={e =>
                                    field.onChange(
                                      e.target.value ? parseFloat(e.target.value) : undefined
                                    )
                                  }
                                />
                              </FormControl>
                              <span className='text-muted-foreground text-sm'>USD</span>
                            </div>
                            <FormMessage className='sm:absolute sm:right-4 sm:bottom-[-20px]' />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ProfileFormSection>
        </form>
      </Form>
    </ProfileFormShell>
  );
}
