'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '../../../../../components/ui/button';
import { Card, CardContent } from '../../../../../components/ui/card';
import { Separator } from '../../../../../components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../../components/ui/table';
import UserBadge from '../../../../../components/user-badge';
import { useTrainingCenter } from '../../../../../context/training-center-provide';
import { getAllStudents, type Student } from '../../../../../services/client';

export default function StudentsList() {
  const trainingCenter = useTrainingCenter();

  const { data, error } = useQuery({
    queryKey: ['organization', 'students'],
    queryFn: () =>
      getAllStudents({
        query: {
          pageable: {
            size: 20,
            page: 0,
          },
        },
      }),
    enabled: !!trainingCenter,
  });

  if (error) {
    return <>Error loading instructors</>;
  }

  let students: Student[] = [];

  if (data && !data.error && data.data && data.data.data && data.data.data.content) {
    students = data.data.data.content;
  }

  return (
    <div className='space-y-6 p-4 md:p-10'>
      <div className='flex items-end justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Manage Students</h1>
          <p>A list of all the students enrolled to {trainingCenter?.name} organisation.</p>
        </div>
        <Link href={'/'}>
          <Button>Enroll Students</Button>
        </Link>
      </div>
      <Separator />

      <Card>
        <CardContent>
          {students.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(student => (
                  <TableRow key={student.uuid}>
                    <TableCell>
                      <UserBadge user_uuid={student.user_uuid!} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className='flex flex-col items-center gap-4'>
              <h3 className='text-2xl'>No students enrolled</h3>
              <Button>Enroll Students</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
