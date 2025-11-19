'use client';

import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';

import { ProfileFormSection, ProfileFormShell } from '@/components/profile/profile-form-layout';
import { ProfileViewList, ProfileViewListItem } from '@/components/profile/profile-view-field';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useProfileFormMode } from '@/context/profile-form-mode-context';
import { useUserProfile } from '@/context/profile-context';
import useMultiMutations from '@/hooks/use-multi-mutations';
import { cn } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CalendarIcon, Grip, PlusCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { InstructorProfessionalMembership } from '../../../../../../services/client';
import {
  addInstructorMembershipMutation,
  updateInstructorMembershipMutation,
} from '../../../../../../services/client/@tanstack/react-query.gen';
import { zInstructorProfessionalMembership } from '../../../../../../services/client/zod.gen';

const InstructorMembershipSchema = zInstructorProfessionalMembership
  .omit({
    created_date: true,
    updated_date: true,
    updated_by: true,
  })
  .merge(
    z.object({
      start_date: z.date(),
      end_date: z.date(),
    })
  );

const professionalMembershipSchema = z.object({
  professional_bodies: z.array(InstructorMembershipSchema),
});

type InstructorMembershipType = z.infer<typeof InstructorMembershipSchema>;
type ProfessionalMembershipFormValues = z.infer<typeof professionalMembershipSchema>;

export default function ProfessionalBodySettings() {
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'profile', title: 'Profile', url: '/dashboard/profile' },
      {
        id: 'professional-memberships',
        title: 'Professional Memberships',
        url: '/dashboard/profile/professional-membership',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const user = useUserProfile();
  const { instructor, invalidateQuery } = user!;
  const { disableEditing, isEditing, requestConfirmation, isConfirming } = useProfileFormMode();

  const instructorMembership = instructor?.membership as Omit<
    InstructorProfessionalMembership,
    'created_date' | 'updated_date' | 'created_by'
  >[];

  const defaultMemebership: InstructorMembershipType = {
    organization_name: 'Tech Experts Inc.',
    membership_number: 'MEM-12345',
    start_date: new Date('2020-01-15'),
    end_date: new Date(),
    is_active: false,
    summary: 'Active member of the tech community.',
    instructor_uuid: instructor?.uuid!,
  };

  const passMember = (mem: InstructorProfessionalMembership) => ({
    ...mem,
    start_date: new Date(mem.start_date!),
    end_date: new Date(mem.end_date!),
    updated_date: mem.updated_date ?? new Date().toISOString(),
    updated_by: 'self',
  });

  const form = useForm<ProfessionalMembershipFormValues>({
    resolver: zodResolver(professionalMembershipSchema),
    defaultValues: {
      professional_bodies:
        instructorMembership.length > 0
          ? instructorMembership.map(passMember)
          : [defaultMemebership],
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'professional_bodies',
  });

  const addMemMutation = useMutation(addInstructorMembershipMutation());
  const updateMemMutation = useMutation(updateInstructorMembershipMutation());
  const { errors, submitting } = useMultiMutations([addMemMutation, updateMemMutation]);

  const saveMemberships = async (data: ProfessionalMembershipFormValues) => {
    for (const [index, mem] of data.professional_bodies.entries()) {
      const memData = {
        ...mem,
        start_date: mem.start_date.toISOString(),
        end_date: mem.end_date.toISOString(),
      };

      if (memData.uuid) {
        await updateMemMutation.mutateAsync({
          path: {
            instructorUuid: instructor?.uuid!,
            membershipUuid: memData.uuid,
          },
          body: {
            ...memData,
            start_date: new Date(memData.start_date),
            end_date: new Date(memData.end_date),
          },
        });
      } else {
        const resp = await addMemMutation.mutateAsync({
          path: {
            instructorUuid: instructor?.uuid!,
          },
          body: {
            ...memData,
            start_date: new Date(memData.start_date),
            end_date: new Date(memData.end_date),
          },
        });

        if (!resp.error && resp.data) {
          const memberships = form.getValues('professional_bodies');
          //@ts-expect-error
          memberships[index] = passMember(resp.data!);
          form.setValue('professional_bodies', memberships);
        }
      }
    }

    await invalidateQuery?.();
    toast.success('Professional memberships updated successfully');
    disableEditing();
  };

  const handleSubmit = (data: ProfessionalMembershipFormValues) => {
    requestConfirmation({
      title: 'Save membership updates?',
      description:
        'Keeping these organisations up to date builds trust with learners and partners.',
      confirmLabel: 'Save memberships',
      cancelLabel: 'Keep editing',
      onConfirm: () => saveMemberships(data),
    });
  };

  const handleRemove = (index: number) => {
    if (!isEditing) return;
    remove(index);
  };

  const formatDateRange = (startDate?: string | Date, endDate?: string | Date, isActive?: boolean) => {
    const formatDate = (date?: string | Date) => {
      if (!date) return '';
      return format(new Date(date), 'MMM yyyy');
    };

    const start = formatDate(startDate);
    const end = isActive ? 'Present' : formatDate(endDate);
    return `${start} - ${end}`;
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
      title='Professional memberships'
      description='Highlight the associations and organisations that recognise your practice.'
      badges={domainBadges}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
          {errors && errors.length > 0 ? (
            <Alert variant='destructive'>
              <AlertTitle>We couldn&apos;t save your memberships</AlertTitle>
              <AlertDescription>
                <ul className='ml-4 list-disc space-y-1 text-sm'>
                  {errors.map((error, index) => (
                    <li key={index}>{error.message}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}

          <ProfileFormSection
            title='Associations & organisations'
            description='Add the professional bodies where you hold active or past memberships.'
            viewContent={
              <ProfileViewList emptyMessage='No professional memberships added yet.'>
                {instructorMembership?.map((mem) => (
                  <ProfileViewListItem
                    key={mem.uuid}
                    title={mem.organization_name || 'Organization name not specified'}
                    subtitle={`Membership No: ${mem.membership_number}`}
                    description={mem.summary}
                    badge={mem.is_active ? 'Active' : undefined}
                    dateRange={formatDateRange(mem.start_date, mem.end_date, mem.is_active)}
                  />
                ))}
              </ProfileViewList>
            }
            footer={
              <Button
                type='submit'
                className='min-w-36'
                disabled={!isEditing || submitting || isConfirming}
              >
                {submitting || isConfirming ? (
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
                <div key={field.id} className='group relative space-y-4 rounded-md border p-5'>
                  <div className='flex items-start justify-between gap-4'>
                    <div className='flex items-start gap-2'>
                      <Grip className='text-muted-foreground mt-1 h-5 w-5' />
                      <div>
                        <div className='flex items-center gap-2'>
                          <h3 className='text-base font-medium'>
                            {form.watch(`professional_bodies.${index}.organization_name`) ||
                              'New membership'}
                          </h3>
                          {form.watch(`professional_bodies.${index}.is_active`) && (
                            <Badge className='border-green-200 bg-green-100 text-xs text-green-700'>
                              Active
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      type='button'
                      size='icon'
                      variant='ghost'
                      className='h-8 w-8'
                      onClick={() => handleRemove(index)}
                    >
                      <Trash2 className='text-destructive h-4 w-4' />
                    </Button>
                  </div>

                  <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name={`professional_bodies.${index}.organization_name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Institution *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`professional_bodies.${index}.membership_number`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Membership number *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name={`professional_bodies.${index}.start_date`}
                      render={({ field }) => (
                        <FormItem className='flex flex-col'>
                          <FormLabel>Member since</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant='outline'
                                  className={cn(
                                    'w-full pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, 'PPP')
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className='w-auto p-0' align='start'>
                              <Calendar
                                mode='single'
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`professional_bodies.${index}.end_date`}
                      render={({ field }) => (
                        <FormItem className='flex flex-col'>
                          <FormLabel>End year</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant='outline'
                                  className={cn(
                                    'w-full pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                  disabled={form.watch(`professional_bodies.${index}.is_active`)}
                                >
                                  {field.value ? (
                                    format(field.value, 'PPP')
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className='w-auto p-0' align='start'>
                              <Calendar
                                mode='single'
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`professional_bodies.${index}.is_active`}
                    render={({ field }) => (
                      <FormItem className='flex flex-row items-center space-y-0 space-x-3'>
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel>I am currently a member</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`professional_bodies.${index}.summary`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>

            <Button
              type='button'
              variant='outline'
              className='flex w-full items-center justify-center gap-2'
              onClick={() => append(defaultMemebership)}
              disabled={!isEditing || submitting || isConfirming}
            >
              <PlusCircle className='h-4 w-4' /> Add another membership
            </Button>
          </ProfileFormSection>
        </form>
      </Form>
    </ProfileFormShell>
  );
}
