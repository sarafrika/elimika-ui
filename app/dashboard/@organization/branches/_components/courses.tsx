'use client';
import { useQuery } from '@tanstack/react-query';
import { Book } from 'lucide-react';
import Image from 'next/image';
import { Card, CardHeader, CardTitle } from '../../../../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../../components/ui/table';
import { Course, getAllCourses } from '../../../../../services/client';

export default function Courses({
  user_uuid,
  viewType = 'list',
}: {
  user_uuid: string;
  viewType: 'list' | 'grid';
}) {
  const { data, error } = useQuery({
    queryKey: ['courses'],
    queryFn: () =>
      getAllCourses({
        query: {
          pageable: {
            page: 0,
            size: 10,
          },
        },
      }),
  });

  if (error || !data || !data.data || !data.data.data || !data.data.data.content) {
    return <>No courses</>;
  }

  const courses = data.data.data.content as Course[];

  return (
    <>
      {viewType === 'grid' ? (
        <div className='grid grid-cols-3 gap-4'>
          {courses.map(course => (
            <Card key={course.uuid}>
              <CardHeader>
                <CardTitle>{course.name}</CardTitle>
              </CardHeader>

              {course.thumbnail_url && course.thumbnail_url.length > 0 ? (
                <Image
                  width={12}
                  height={12}
                  alt={course.name}
                  src={course.thumbnail_url}
                  className='object-fit w-full rounded-sm'
                />
              ) : (
                <Book size={256} color='gray-500' />
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Table className='table-striped table w-full'>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map(course => (
              <TableRow key={course.uuid}>
                <TableCell>
                  {course.thumbnail_url && course.thumbnail_url.length > 0 ? (
                    <Image
                      width={40}
                      height={40}
                      alt={course.name}
                      className='object-fit h-10 w-10 rounded-md'
                      src={course.thumbnail_url}
                    />
                  ) : (
                    <Book size={32} color='gray-500' />
                  )}
                </TableCell>
                <TableCell>{course.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
