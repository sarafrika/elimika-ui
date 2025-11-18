'use client';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Button } from '../../../../../components/ui/button';
import { Form, FormControl, FormField, FormItem } from '../../../../../components/ui/form';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../../components/ui/select';
import { useTrainingCenter } from '../../../../../context/training-center-provide';
import type { Course } from '../../../../../services/api/schema';
import { getAllCourses } from '../../../../../services/client';

export default function CreateClassroomForm() {
  const trainingCenter = useTrainingCenter();
  const { data, error } = useQuery({
    queryKey: ['courses'],
    queryFn: () =>
      getAllCourses({
        query: {
          pageable: {
            size: 100,
            page: 0,
          },
        },
      }),
  });

  let courses: Course[] = [];
  if (!error && data && data.data && data.data.data && data.data.data.content) {
    courses = data.data.data.content as Course[];
  }

  const form = useForm();
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => {})} className='flex flex-col gap-3'>
        <FormField
          name='trainingCenter'
          render={({ field }) => (
            <FormItem className='w-full'>
              <Label>Training Center</Label>
              <FormControl>
                <Select>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder={'Select Branch'} />
                  </SelectTrigger>
                  <SelectContent>
                    {trainingCenter?.branches?.map(branch => (
                      <SelectItem key={branch.uuid} value={branch.uuid!}>
                        {branch.branch_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          name='trainingCenter'
          render={({ field }) => (
            <FormItem className='w-full'>
              <Label>Course</Label>
              <FormControl>
                <Select>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder={'Select Course'} />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course.uuid} value={course.uuid!}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          name='trainingCenter'
          render={({ field }) => (
            <FormItem className='w-full'>
              <Label>Class Type</Label>
              <FormControl>
                <Select>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder={'Select class type'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='private-class'>Private</SelectItem>
                    <SelectItem value='group-class'>Group</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          name='trainingCenter'
          render={({ field }) => (
            <FormItem className='w-full'>
              <Label>Training Method</Label>
              <FormControl>
                <Select>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder={'select training method'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='in-person'>In Person</SelectItem>
                    <SelectItem value='virtual'>Virtual</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          name='trainingCenter'
          render={({ field }) => (
            <FormItem className='w-full'>
              <Label>Room Number</Label>
              <FormControl>
                <Input type='number' placeholder='Enter room name' />
              </FormControl>
            </FormItem>
          )}
        />

        <div className='flex flex-row-reverse'>
          <Button>Create Class</Button>
        </div>
      </form>
    </Form>
  );
}
