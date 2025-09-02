'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useUserProfile } from '../../../../../../context/profile-context';
import { useTrainingCenter } from '../../../../../../context/training-center-provide';
import { queryClient } from '../../../../../../lib/query-client';
import {
  ApiResponse,
  createTrainingBranch,
  updateTrainingBranch,
} from '../../../../../../services/client';
import { zTrainingBranch, zUser } from '../../../../../../services/client/zod.gen';

const userSchema = zUser.merge(z.object({ dob: z.date() }));

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

type UserType = z.infer<typeof userSchema>;
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

  const user = useUserProfile();
  const trainingCenter = useTrainingCenter()
  const { organizations } = user!

  const defaultBranch = (): BranchType => ({
    branch_name: 'Main Campus',
    active: true,
    poc_name: "",
    poc_email: "",
    poc_telephone: ""
  });

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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <Card>
          <CardHeader>
            <CardTitle>Manage Training Locations & Branches</CardTitle>
            <CardDescription>
              Add, edit, or remove your organisation&apos;s branches.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-8'>
              {fields.map((field, index) => (
                <div key={field.id} className='bg-background/50 space-y-6 rounded-lg border p-6'>
                  <div className='flex items-center justify-between'>
                    <h3 className='text-xl font-semibold'>
                      {form.getValues(`branches.${index}.branch_name`) || `Branch ${index + 1}`}
                    </h3>
                    <Button
                      type='button'
                      variant='destructive'
                      size='sm'
                      onClick={() => remove(index)}
                    >
                      <Trash2 className='mr-2 h-4 w-4' />
                      Remove Branch
                    </Button>
                  </div>

                  <Separator />

                  <FormField
                    control={form.control}
                    name={`branches.${index}.branch_name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Branch Name</FormLabel>
                        <FormControl>
                          <Input placeholder='e.g., Westlands Campus' {...field} />
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

                  <div className="grid grid-col-2 gap-3">
                    <FormField
                      control={form.control}
                      name={`branches.${index}.poc_name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Point of contact name</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                            <Input {...field} />
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
                          <FormLabel>Point of contact phone_number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                </div>
              ))}

              <Button
                type='button'
                variant='outline'
                size='sm'
                className='mt-4'
                onClick={() => append(defaultBranch())}
              >
                <PlusCircle className='mr-2 h-4 w-4' />
                Add Another Branch
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className='flex justify-end'>
          <Button type='submit' disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <>Saving...</> : <>Save Branches</>}
          </Button>
        </div>
      </form>
    </Form>
  );
}
