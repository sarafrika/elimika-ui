import { zInstructor } from '@/services/client/zod.gen';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Building2, CheckCircle } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const instructorFormSchema = zInstructor.omit({
  uuid: true,
  created_date: true,
  updated_date: true,
  created_by: true,
  updated_by: true,
  full_name: true,
  admin_verified: true,
  has_location_coordinates: true,
  formatted_location: true,
  is_profile_complete: true,
});

export type InstructorFormData = z.infer<typeof instructorFormSchema>;

export default function InstructorProfileForm({
  userUuid,
  onSubmit,
  onBack,
  isSubmitting,
}: {
  userUuid?: string;
  onSubmit: (data: InstructorFormData) => void;
  onBack: () => void;
  isSubmitting: boolean;
}) {
  const form = useForm<InstructorFormData>({
    resolver: zodResolver(instructorFormSchema),
    defaultValues: {
      user_uuid: userUuid,
      professional_headline: '',
      bio: '',
      website: '',
    },
  });

  const { isValid, errors } = form.formState;

  console.log("Form is valid:", isValid);
  console.log("Form errors:", errors);


  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Building2 className='h-5 w-5 text-[#1976D2]' />
          Instructor Profile
        </CardTitle>
        <CardDescription>Tell us about your teaching background and expertise</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <FormField
              control={form.control}
              name='professional_headline'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Professional Headline</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='e.g., Experienced Mathematics Teacher'
                      disabled={isSubmitting}
                      maxLength={150}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A brief title that describes your expertise (max 150 characters)
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
                    <Textarea
                      placeholder='Tell us about your teaching experience, qualifications, and what makes you passionate about education...'
                      className='min-h-[120px]'
                      disabled={isSubmitting}
                      maxLength={2000}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Share your background, expertise, and teaching philosophy (max 2000 characters)
                  </FormDescription>
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
                    <Input
                      type='url'
                      placeholder='https://your-portfolio.com'
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Link to your professional website or portfolio</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex justify-between'>
              <Button type='button' variant='outline' onClick={onBack} disabled={isSubmitting}>
                <ArrowLeft className='mr-2 h-4 w-4' />
                Back
              </Button>

              <Button
                type='submit'
                className='bg-[#1976D2] hover:bg-[#1976D2]/90'
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Completing...' : 'Complete Registration'}
                {!isSubmitting && <CheckCircle className='ml-2 h-4 w-4' />}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}