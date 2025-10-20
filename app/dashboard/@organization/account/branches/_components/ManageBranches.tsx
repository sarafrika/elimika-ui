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
import { Separator } from '@/components/ui/separator';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import LocationInput from '../../../../../../components/locationInput';
import { useTrainingCenter } from '../../../../../../context/training-center-provide';
import { useUserProfile } from '../../../../../../context/profile-context';
import { queryClient } from '../../../../../../lib/query-client';
import {
  ApiResponse,
  createTrainingBranch,
  updateTrainingBranch,
} from '../../../../../../services/client';
import { zTrainingBranch } from '../../../../../../services/client/zod.gen';

const branchSchema = zTrainingBranch
  .omit({
    created_date: true,
    updated_date: true,
  })
  .merge(
    z.object({
      organisation_uuid: z.string().optional(),
    })
  );

const branchesSchema = z.object({
  branches: z.array(branchSchema),
});

type BranchType = z.infer<typeof branchSchema>;
type BranchesFormValues = z.infer<typeof branchesSchema>;

export default function ManageBranch() {
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'account', title: 'Account', url: '/dashboard/account' },
      {
        id: 'branches',
        title: 'Branches',
        url: '/dashboard/account/branches',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const userProfile = useUserProfile();
  const trainingCenter = useTrainingCenter();

  const defaultBranch = (): BranchType => ({
    branch_name: 'Main Campus',
    active: true,
    poc_name: '',
    poc_email: '',
    poc_telephone: '',
  });

  const domainBadges =
    userProfile?.user_domain?.map(domain =>
      domain
        .split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    ) ?? [];

  const form = useForm<BranchesFormValues>({
    resolver: zodResolver(branchesSchema),
    defaultValues: {
      branches:
        trainingCenter && trainingCenter.branches!.length > 0
          ? trainingCenter.branches
          : [defaultBranch()],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'branches',
  });

  const onSubmit = async (data: BranchesFormValues) => {
    if (!trainingCenter || !trainingCenter.uuid) {
      toast.warning('No training center selected');
      return;
    }

    const responses = await Promise.all(
      data.branches.map(branch => {
        if (branch.uuid)
          return updateTrainingBranch({
            path: {
              uuid: branch.uuid,
            },
            body: {
              ...branch,
              organisation_uuid: trainingCenter.uuid!,
            },
          });

        return createTrainingBranch({
          body: {
            ...branch,
            organisation_uuid: trainingCenter.uuid!,
          },
        });
      })
    );

    let hasError = false;
    responses.map((response: ApiResponse, i) => {
      if (response.error) {
        Object.keys(response.error).map((key: string) => {
          const fieldName = `branches.${i}.${key}` as any;
          const { error } = response.error as any;
          form.setError(fieldName, error[key]);
        });
        hasError = true;
      } else {
      }
    });

    if (hasError) toast.error('Error saving branch');
    else {
      toast.success('Branch added successfully');
      queryClient.invalidateQueries({ queryKey: ['organization'] });
    }
  };

  return (
    <ProfileFormShell
      eyebrow='Organisation'
      title='Branches'
      description='Add, edit, and manage the training locations that learners can attend.'
      badges={domainBadges}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <ProfileFormSection
            title='Training locations'
            description='Keep each branch up to date so learners and instructors know where programmes run.'
            footer={
              <div className='flex flex-col items-stretch gap-3 sm:flex-row sm:justify-between'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => append(defaultBranch())}
                  className='sm:w-auto'
                >
                  <PlusCircle className='mr-2 h-4 w-4' />
                  Add branch
                </Button>
                <Button type='submit' disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Saving…' : 'Save branches'}
                </Button>
              </div>
            }
          >
            <div className='space-y-8'>
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className='rounded-xl border border-border/60 bg-background/60 p-6 shadow-sm'
                >
                  <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                    <div>
                      <h3 className='text-lg font-semibold'>
                        {form.watch(`branches.${index}.branch_name`) || `Branch ${index + 1}`}
                      </h3>
                      <p className='text-muted-foreground text-sm'>
                        Outline where this branch is located and who to contact.
                      </p>
                    </div>
                    {fields.length > 1 ? (
                      <Button
                        type='button'
                        variant='destructive'
                        size='sm'
                        onClick={() => remove(index)}
                      >
                        <Trash2 className='mr-2 h-4 w-4' />
                        Remove
                      </Button>
                    ) : null}
                  </div>

                  <Separator className='my-4' />

                  <div className='space-y-6'>
                    <FormField
                      control={form.control}
                      name={`branches.${index}.branch_name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Branch name</FormLabel>
                          <FormControl>
                            <Input placeholder='e.g. Westlands Campus' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`branches.${index}.address`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <LocationInput {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className='grid gap-4 sm:grid-cols-3'>
                      <FormField
                        control={form.control}
                        name={`branches.${index}.poc_name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Point of contact name</FormLabel>
                            <FormControl>
                              <Input placeholder='Jane Doe' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`branches.${index}.poc_email`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Point of contact email</FormLabel>
                            <FormControl>
                              <Input placeholder='jane.doe@elimika.org' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`branches.${index}.poc_telephone`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Point of contact phone</FormLabel>
                            <FormControl>
                              <Input placeholder='+254 700 000 000' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
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
