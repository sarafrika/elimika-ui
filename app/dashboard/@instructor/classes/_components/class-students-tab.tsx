import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { StudentTableRow } from './new-class-page.utils';

export function ClassStudentsTab({
  isLoadingStudents,
  studentRows,
}: {
  isLoadingStudents: boolean;
  studentRows: StudentTableRow[];
}) {
  return (
    <Card className='border-border/70 bg-card shadow-sm'>
      <CardHeader className='pb-3'>
        <CardTitle className='text-lg'>Enrolled students</CardTitle>
        <p className='text-muted-foreground text-sm'>
          Unique students enrolled in the selected class. Duplicate enrollment records are collapsed
          into one row per student.
        </p>
      </CardHeader>
      <CardContent>
        {isLoadingStudents ? (
          <div className='space-y-3'>
            <Skeleton className='h-12 rounded-[16px]' />
            <Skeleton className='h-12 rounded-[16px]' />
            <Skeleton className='h-12 rounded-[16px]' />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className='hover:bg-transparent'>
                <TableHead>Student</TableHead>
                <TableHead>Student UUID</TableHead>
                <TableHead>Enrollment Status</TableHead>
                <TableHead>Enrolled On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentRows.length > 0 ? (
                studentRows.map(student => (
                  <TableRow key={student.studentUuid}>
                    <TableCell className='font-medium'>{student.fullName}</TableCell>
                    <TableCell className='text-muted-foreground'>
                      {student.studentUuid.slice(0, 8)}
                    </TableCell>
                    <TableCell>{student.status}</TableCell>
                    <TableCell>{student.enrolledOn}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className='hover:bg-transparent'>
                  <TableCell colSpan={4} className='text-muted-foreground py-10 text-center'>
                    No enrolled students found for this class.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
