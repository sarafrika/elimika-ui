import { zStudent } from '@/services/client/zod.gen';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, GraduationCap, CheckCircle } from 'lucide-react';
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

const studentFormSchema = zStudent.omit({
  uuid: true,
  created_date: true,
  updated_date: true,
  created_by: true,
  updated_by: true,
  secondaryGuardianContact: true,
  primaryGuardianContact: true,
  allGuardianContacts: true,
});

export type StudentFormData = z.infer<typeof studentFormSchema>;

export default function StudentProfileForm({
                                             userUuid,
                                             onSubmit,
                                             onBack,
                                             isSubmitting,
                                           }: {
  userUuid?: string;
  onSubmit: (data: StudentFormData) => void;
  onBack: () => void;
  isSubmitting: boolean;
}) {
  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      user_uuid: userUuid,
      first_guardian_name: '',
      first_guardian_mobile: '',
      second_guardian_name: '',
      second_guardian_mobile: '',
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <GraduationCap className='h-5 w-5 text-[#1976D2]' />
          Student Profile
        </CardTitle>
        <CardDescription>
          Tell us about your guardian contacts for emergency situations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Primary Guardian Information */}
            <div className='space-y-4'>
              <h3 className='text-lg font-medium text-foreground'>Primary Guardian/Parent</h3>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='first_guardian_name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='e.g., John Doe'
                          disabled={isSubmitting}
                          maxLength={100}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Full name of your primary guardian or parent
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='first_guardian_mobile'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian Mobile</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='+254 712 345 678'
                          disabled={isSubmitting}
                          maxLength={20}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Mobile number for emergency contact
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Secondary Guardian Information */}
            <div className='space-y-4'>
              <h3 className='text-lg font-medium text-foreground'>Secondary Guardian/Parent (Optional)</h3>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='second_guardian_name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Second Guardian Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='e.g., Jane Doe'
                          disabled={isSubmitting}
                          maxLength={100}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Full name of your secondary guardian or parent
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='second_guardian_mobile'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Second Guardian Mobile</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='+254 712 345 678'
                          disabled={isSubmitting}
                          maxLength={20}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Alternative mobile number for emergencies
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

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