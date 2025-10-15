'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Spinner from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { getAssignmentSubmissionsOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { Eye, FileEdit, MoreVertical, PenLine, Trash } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

const AssignmentSubmissionPage = () => {
  const searchParams = useSearchParams();
  const assignmentId = searchParams.get('id');
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      {
        id: 'assignments',
        title: 'Assignments',
        url: `/dashboard/assignments`,
      },
      {
        id: 'submissions',
        title: `Submissions`,
        url: `/dashboard/assigments/submissions?id=${assignmentId}`,
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs, assignmentId]);

  const { data, isLoading, isFetched } = useQuery(
    getAssignmentSubmissionsOptions({ path: { assignmentUuid: assignmentId as string } })
  );
  const submissions = data?.data || [];

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold'>Assignment Submissions</h1>
        <p className='text-muted-foreground text-sm'>
          Review and manage all student submissions for this assignment.
        </p>
      </div>

      {isLoading && (
        <div className='flex items-center justify-center'>
          <Spinner />
        </div>
      )}

      {isFetched && submissions?.length === 0 && (
        <div className='text-muted-foreground rounded-lg border border-dashed p-12 text-center'>
          <FileEdit className='text-muted-foreground mx-auto h-12 w-12' />
          <h3 className='mt-4 text-lg font-medium'>No submissions yet.</h3>
        </div>
      )}

      {isFetched && submissions.length > 0 && (
        <div className='overflow-hidden rounded-lg border border-gray-200'>
          <Table>
            <TableCaption className='py-4'>List of student submissions</TableCaption>
            <TableHeader className='bg-gray-100'>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead className='text-center'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission: any) => (
                <TableRow key={submission.uuid}>
                  <TableCell>{submission.studentName}</TableCell>
                  <TableCell>{new Date(submission.submittedAt).toLocaleString()}</TableCell>
                  <TableCell>{submission.status}</TableCell>
                  <TableCell>{submission.grade != null ? submission.grade : '—'}</TableCell>
                  <TableCell className='text-center'>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon'>
                          <MoreVertical className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem>
                          <Eye className='mr-2 h-4 w-4' />
                          View Submission
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <PenLine className='mr-2 h-4 w-4' />
                          Grade
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className='text-red-600'>
                          <Trash className='mr-2 h-4 w-4' />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AssignmentSubmissionPage;
