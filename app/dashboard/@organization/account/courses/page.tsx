'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const affiliateCourses = [
  {
    category: 'Music',
    items: [
      'Voice',
      'Piano',
      'Guitar',
      'Drums',
      'Violin',
      'Cello',
      'Viola',
      'Bass',
      'Saxophone',
      'Trumpet',
      'Clarinet',
      'Flute',
      'Trombone',
      'Drumline',
      'Marching Band',
      'Pop Band',
      'String Orchestra',
      'Choir',
    ],
  },
  {
    category: 'Sports',
    items: [
      'Football',
      'Swimming',
      'Tennis',
      'Rugby',
      'Athletics',
      'Aerobics',
      'Table tennis',
      'Basketball',
      'Volleyball',
      'Netball',
      'Scatting',
    ],
  },
  { category: 'Dance', items: ['Ballet', 'Contemporary Dance'] },
  { category: 'Theatre', items: ['Musical theatre', 'Technical theatre'] },
  { category: 'Arts', items: ['Painting', 'Sculpture', 'Drawing'] },
];

const coursesSchema = z.object({
  courses: z.array(z.string()).refine(value => value.some(item => item), {
    message: 'You have to select at least one course.',
  }),
});

type CoursesFormValues = z.infer<typeof coursesSchema>;

export default function CoursesPage() {
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'account', title: 'Account', url: '/dashboard/account' },
      {
        id: 'courses',
        title: 'Courses',
        url: '/dashboard/account/courses',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const form = useForm<CoursesFormValues>({
    resolver: zodResolver(coursesSchema),
    defaultValues: {
      courses: ['Piano', 'Football'], // TODO: Replace with fetched data
    },
  });

  const onSubmit = (data: CoursesFormValues) => {
    // TODO: Implement submission logic
    //console.log(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <Card>
          <CardHeader>
            <CardTitle>Manage Affiliate Courses</CardTitle>
            <CardDescription>
              Select the courses and programs your organisation offers across all branches.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name='courses'
              render={() => (
                <div className='space-y-6'>
                  {affiliateCourses.map(category => (
                    <div key={category.category} className='space-y-4 rounded-lg border p-4'>
                      <h3 className='text-lg font-medium'>{category.category}</h3>
                      <div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'>
                        {category.items.map(item => (
                          <FormField
                            key={item}
                            control={form.control}
                            name='courses'
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
                                          ? field.onChange([...field.value, item])
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
                    </div>
                  ))}
                  <FormMessage />
                </div>
              )}
            />
          </CardContent>
        </Card>

        <div className='flex justify-end'>
          <Button type='submit'>Save Courses</Button>
        </div>
      </form>
    </Form>
  );
}
