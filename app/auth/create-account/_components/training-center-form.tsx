import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export const TrainingCenterFormSchema = z.object({
  active: z.boolean().default(true),
  uuid: z.string().optional(),
  code: z.string().optional(),
  slug: z.string().optional(),
  auth_realm: z.string().optional(),
  address: z.string().min(2, 'Address is required'),
  created_date: z.string().optional(),
  modified_date: z.string().optional(),
  name: z.string().min(1, 'Training Center name is required'),
  domain: z.string().min(1, 'Training Center domain is required'),
  description: z.string().min(1, 'Training Center description is required'),
});

export type TrainingCenter = z.infer<typeof TrainingCenterFormSchema>;

interface TrainingCenterFormProps {
  authRealm: string;
  isSubmitting: boolean;

  onSubmit(data: TrainingCenter): void;
}

export function TrainingCenterForm({ authRealm, isSubmitting, onSubmit }: TrainingCenterFormProps) {
  const trainingCenterForm = useForm<TrainingCenter>({
    resolver: zodResolver(TrainingCenterFormSchema),
    defaultValues: {
      active: true,
      name: '',
      domain: '',
      address: '',
      description: '',
      auth_realm: authRealm,
    },
  });

  return (
    <Form {...trainingCenterForm}>
      <form onSubmit={trainingCenterForm.handleSubmit(onSubmit)} className='space-y-6'>
        <div className='rounded-md border bg-white p-6'>
          <h2 className='mb-1 text-lg font-medium'>Training Center Details</h2>
          <p className='mb-4 text-sm text-gray-500'>Tell us about your organization</p>
          <div className='space-y-4'>
            <FormField
              control={trainingCenterForm.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Training Center Name <span className='text-red-500'>*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder='Sarafrika University' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={trainingCenterForm.control}
              name='address'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Address <span className='text-red-500'>*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder='123 Training St, City, Country' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={trainingCenterForm.control}
              name='domain'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Domain <span className='text-red-500'>*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder='example.com' {...field} />
                  </FormControl>
                  <FormDescription className='text-xs'>
                    This will be used for staff email verification
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={trainingCenterForm.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Description <span className='text-red-500'>*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Brief description of your organization and the types of training you offer'
                      className='min-h-24'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className='pt-4'>
          <div className='mt-6 flex items-center justify-end space-x-4'>
            <Button type='submit' disabled={isSubmitting} className='flex-1' size='lg'>
              {isSubmitting ? (
                <div className='flex items-center gap-2'>
                  <span className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                  Processing...
                </div>
              ) : (
                <div className='flex items-center gap-2'>
                  Continue to Account Setup
                  <ArrowRight className='h-4 w-4' />
                </div>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
