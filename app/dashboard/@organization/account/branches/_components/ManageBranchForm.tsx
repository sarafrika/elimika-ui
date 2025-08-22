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
import { CommandInput } from 'cmdk';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import Combobox from '../../../../../../components/combobox';
import LocationInput from '../../../../../../components/locationInput';
import { useOrganization } from '../../../../../../context/organization-context';
import { useUserProfile } from '../../../../../../context/profile-context';
import { queryClient } from '../../../../../../lib/query-client';
import { ApiResponse, createTrainingBranch, updateTrainingBranch } from '../../../../../../services/client';
import { zTrainingBranch, zUser } from '../../../../../../services/client/zod.gen';

const userSchema = zUser.merge(z.object({ dob: z.date() }));

const branchSchema = zTrainingBranch.omit({
  created_date: true,
  updated_date: true
}).merge(z.object({
  organisation_uuid: z.string().optional()
}))

const branchesSchema = z.object({
  branches: z.array(
    branchSchema
  ),
});

type UserType = z.infer<typeof userSchema>;
type BranchType = z.infer<typeof branchSchema>;
type BranchesFormValues = z.infer<typeof branchesSchema>;

export default function ManageBranchForm() {
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
  const trainingCenter = useOrganization()
  const { organizations } = user!

  const defaultBranch = (): BranchType => ({
    branch_name: 'Main Campus',
    active: true,
    poc_user_uuid: user!.uuid
  });

  const form = useForm<BranchesFormValues>({
    resolver: zodResolver(branchesSchema),
    defaultValues: {
      branches: trainingCenter && trainingCenter.branches!.length > 0 ?
        trainingCenter.branches :
        [defaultBranch()],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'branches',
  });

  const onSubmit = async (data: BranchesFormValues) => {

    console.log(data);
    const responses = await Promise.all(data.branches.map(branch => {
      if (branch.uuid) return updateTrainingBranch({
        path: {
          uuid: branch.uuid
        },
        body: {
          ...branch,
          organisation_uuid: trainingCenter?.uuid!
        }
      });

      return createTrainingBranch({
        body: {
          ...branch,
          organisation_uuid: trainingCenter?.uuid!
        }
      })
    }));

    let hasError = false;
    responses.map((response: ApiResponse, i) => {
      if (response.error) {
        console.log(response.error)
        Object.keys(response.error).map((key: string) => {
          const fieldName = `branches.${i}.${key}` as any;
          const { error } = response.error as any;
          form.setError(fieldName, error[key]);
        });
        hasError = true;
      }
      else {

      }
    });

    if (hasError) toast.error("Error saving branch");
    else {
      toast.success("Branch added successfully");
      queryClient.invalidateQueries({ queryKey: ["organization"] })
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
                          {/* <Input placeholder='e.g., 123 Waiyaki Way' {...field} /> */}
                          <LocationInput {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`branches.${index}.poc_user_uuid`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Point of Contact Person</FormLabel>
                        <div className="flex gap-3">
                          <div className='flex-grow'>
                            <Combobox value={field.value ?? ""} setValue={field.onChange} items={(trainingCenter && trainingCenter.users ? trainingCenter.users : []).map(user => ({
                              label: user.full_name!,
                              value: user.uuid!
                            }))}>
                              <CommandInput placeholder="Search framework..." className="h-9" />
                            </Combobox>
                          </div>
                          <Button type='button' variant={"outline"}>Invite User</Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* <div>
                    <h4 className='text-md mb-4 font-medium'>Point of Contact</h4>
                    <div className='space-y-4 rounded-md border p-4'>

                      

                      <FormField
                        control={form.control}
                        name={`branches.${index}.poc_user.full_name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input readOnly placeholder='e.g., John Doe' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className='grid gap-6 sm:grid-cols-2'>
                        <FormField
                          control={form.control}
                          name={`branches.${index}.poc_user.phone_number`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input readOnly placeholder='+254 7...' {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`branches.${index}.poc_user.email`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input readOnly type='email' placeholder='johndoe@example.com' {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div> */}

                  {/* <div>
                    <h4 className='text-md mb-4 font-medium'>Branch Details</h4>
                    <div className='space-y-4 rounded-md border p-4'>
                      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                        <FormField
                          control={form.control}
                          name={`branches.${index}.classrooms`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Number of Classrooms</FormLabel>
                              <FormControl>
                                <Input
                                  type='number'
                                  placeholder='e.g., 15'
                                  {...field}
                                  onChange={e =>
                                    field.onChange(
                                      e.target.value ? parseInt(e.target.value, 10) : ''
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`branches.${index}.coursesOffered`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Courses Offered</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder='List courses separated by commas (e.g., Piano, Guitar, Vocals)'
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name={`branches.${index}.ageGroups`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Age Groups Served</FormLabel>
                            <div className='grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-3'>
                              {ageGroups.map(item => (
                                <FormField
                                  key={item}
                                  control={form.control}
                                  name={`branches.${index}.ageGroups`}
                                  render={({ field }) => {
                                    return (
                                      <FormItem
                                        key={item}
                                        className='flex flex-row items-start space-y-0 space-x-3'
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(item)}
                                            onCheckedChange={checked => {
                                              return checked
                                                ? field.onChange([...(field.value ?? []), item])
                                                : field.onChange(
                                                  field.value?.filter(value => value !== item)
                                                );
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className='font-normal'>{item}</FormLabel>
                                      </FormItem>
                                    );
                                  }}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div> */}
                </div>
              ))}

              <Button
                type='button'
                variant='outline'
                size='sm'
                className='mt-4'
                onClick={() =>
                  append(defaultBranch())
                }
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
