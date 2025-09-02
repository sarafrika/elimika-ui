'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Textarea } from '@/components/ui/textarea';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import CustomLoader from '../../../../../../components/custom-loader';
import LocationInput from '../../../../../../components/locationInput';
import { useUserProfile } from '../../../../../../context/profile-context';
import { useTrainingCenter } from '../../../../../../context/training-center-provide';
import { queryClient } from '../../../../../../lib/query-client';
import { updateOrganisation, updateUser, User } from '../../../../../../services/client';
import { zOrganisation } from '../../../../../../services/client/zod.gen';

const trainingCenterSchema = zOrganisation
  .omit({
    created_date: true,
    updated_date: true,
  })
  .merge(
    z.object({
      logoUrl: z.string().url().optional().or(z.literal('')),
      contactPersonEmail: z.string(),
      contactPersonPhone: z.string(),
      website: z.string().url().optional().or(z.literal('')),
      address: z.string().optional(),
    })
  );

type TrainingCenterFormValues = z.infer<typeof trainingCenterSchema>;

export default function TrainingCenterForm() {
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'account', title: 'Account', url: '/dashboard/account' },
      {
        id: 'training-center',
        title: 'Training Center',
        url: '/dashboard/account/training-center',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const userProfile = useUserProfile();
  const organisation = useTrainingCenter();

  const form = useForm<TrainingCenterFormValues>({
    resolver: zodResolver(trainingCenterSchema),
    defaultValues: {
      ...(organisation ?? {}),
      contactPersonEmail: userProfile!.email,
      contactPersonPhone: userProfile!.phone_number,
      active: true,
    },
  });

  console.log(form.formState.errors)

  const onSubmit = async (orgData: TrainingCenterFormValues) => {
    const updateResponse = await updateOrganisation({
      path: {
        uuid: organisation!.uuid!,
      },
      body: orgData,
    });

    // console.log(updateResponse);
    if (updateResponse.error) {
      toast.error('Error while updateing institution');
      const error = updateResponse.error as any;
      Object.keys(error).forEach((key: any) => form.setError(key, error[key]));
      return;
    }

    if (!userProfile!.phone_number)
      await updateUser({
        path: {
          uuid: userProfile!.uuid!,
        },
        body: {
          ...(userProfile as User),
          phone_number: orgData.contactPersonPhone,
        },
      });

    queryClient.invalidateQueries({ queryKey: ['organization'] });
    toast.success('Saved successfully');
  };

  if (userProfile?.isLoading) {
    return <CustomLoader />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <Card>
          <CardHeader>
            <CardTitle>Training Center Profile</CardTitle>
            <CardDescription>
              Manage your organisation&apos;s core details, branding, and contact information.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-8'>
            <FormField
              control={form.control}
              name='logoUrl'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organisation Logo</FormLabel>
                  <div className='flex items-center gap-x-4'>
                    <Avatar className='h-20 w-20 rounded-lg'>
                      <AvatarImage src={field.value ?? undefined} />
                      <AvatarFallback className='rounded-lg'>Logo</AvatarFallback>
                    </Avatar>
                    <FormControl>
                      <Input
                        type='file'
                        className='max-w-xs'
                        onChange={e => {
                          // Handle file upload preview
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              form.setValue('logoUrl', reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex gap-4'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem className='flex-grow'>
                    <FormLabel>Organisation Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Elimika' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='licence_no'
                render={({ field }) => (
                  <FormItem className='flex-grow'>
                    <FormLabel>Licence Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>About Your Organisation</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Tell us a little about your organisation'
                      className='resize-none'
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Person</CardTitle>
            <CardDescription>The person to contact regarding the institution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='contactPersonEmail'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input type='email' placeholder='contact@elimika.org' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='contactPersonPhone'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder='+254 700 000 000' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
            <CardDescription>Where the instituion is located</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col gap-5'>
            {/* <div className='grid grid-cols-1 gap-6 md:grid-cols-2'> */}
            <FormField
              control={form.control}
              name='location'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Physical Address</FormLabel>
                  <FormControl>
                    <LocationInput
                      {...field}
                      onRetrieve={d => {
                        form.setValue('country', d.properties.context.country?.name);
                        form.setValue('latitude', d.properties.coordinates.latitude);
                        form.setValue('longitude', d.properties.coordinates.longitude);
                        return d;
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* <FormField
                                control={form.control}
                                name='country'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Country</FormLabel>
                                        <FormControl>
                                            <Input {...field} readOnly />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            /> */}
            {/* </div> */}

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='website'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder='https://elimika.org' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>
          </CardContent>
        </Card>

        <div className='flex justify-end'>
          <Button type='submit' disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <Loader2 /> Updating....
              </>
            ) : (
              'Update Profile'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
