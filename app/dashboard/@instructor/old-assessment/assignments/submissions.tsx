'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  getAllAssignmentsOptions,
  getAssignmentSubmissionsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { AssignmentSubmission } from '@/services/client/types.gen';
import { useQuery } from '@tanstack/react-query';
import { Eye, MoreVertical, PenLine, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  CustomEmptyState,
  CustomLoadingState,
} from '../../../@course_creator/_components/loading-state';

type SubmissionRow = AssignmentSubmission & {
  studentName?: string;
  submittedAt?: string | Date;
  grade?: string | number;
};

const AssignmentSubmissionPage = () => {
  const { replaceBreadcrumbs } = useBreadcrumb();
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);

  // 🧩 Fetch all assignments for the select
  const { data: allAssignments, isLoading: isAssignmentsLoading } = useQuery(
    getAllAssignmentsOptions({ query: { pageable: {} } })
  );

  const assignments = allAssignments?.data?.content || [];

  // 🧭 Update breadcrumbs dynamically
  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      { id: 'assignments', title: 'Assignments', url: `/dashboard/assignments` },
      {
        id: 'submissions',
        title: `Submissions`,
        url: `/dashboard/assignments/submissions`,
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  // 📦 Fetch submissions only when an assignment is selected
  const {
    data: submissionsData,
    isLoading: isSubmissionsLoading,
    isFetched,
  } = useQuery({
    ...getAssignmentSubmissionsOptions({ path: { assignmentUuid: selectedAssignment as string } }),
    enabled: !!selectedAssignment,
  });

  const submissions: SubmissionRow[] = submissionsData?.data || [];

  // 🌀 Loading state for assignments
  if (isAssignmentsLoading) {
    return (
      <div className='flex items-center justify-center'>
        <CustomLoadingState subHeading='Loading assignments...' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Assignment Selector */}
      <div className='flex items-center gap-4'>
        <Select
          value={selectedAssignment || ''}
          onValueChange={value => setSelectedAssignment(value)}
        >
          <SelectTrigger className='w-[300px]'>
            <SelectValue placeholder='Select an assignment' />
          </SelectTrigger>
          <SelectContent>
            {assignments.length > 0 ? (
              assignments.map(assignment =>
                assignment.uuid ? (
                  <SelectItem key={assignment.uuid} value={assignment.uuid}>
                    {assignment.title}
                  </SelectItem>
                ) : null
              )
            ) : (
              <div className='text-muted-foreground p-2 text-sm'>No assignments available</div>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Conditional Rendering for Submissions */}
      {!selectedAssignment && (
        <CustomEmptyState
          headline='Select an assignment'
          subHeading='Choose an assignment above to view submissions.'
        />
      )}

      {selectedAssignment && isSubmissionsLoading && (
        <div className='flex items-center justify-center'>
          <CustomLoadingState subHeading='Fetching submitted assignments...' />
        </div>
      )}

      {selectedAssignment && isFetched && submissions?.length === 0 && (
        <CustomEmptyState
          headline='No submissions yet'
          subHeading="Enrolled students' submissions will appear here."
        />
      )}

      {selectedAssignment && isFetched && submissions.length > 0 && (
        <div className='border-border overflow-hidden rounded-lg border'>
          <Table>
            <TableCaption className='py-4'>List of student submissions</TableCaption>
            <TableHeader className='bg-muted/60'>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead className='text-center'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map(submission => (
                <TableRow key={submission.uuid}>
                  <TableCell>
                    {submission.studentName ?? submission.created_by ?? 'Unknown student'}
                  </TableCell>
                  <TableCell>
                    {new Date(
                      submission.submittedAt ?? submission.submitted_at ?? ''
                    ).toLocaleString()}
                  </TableCell>
                  <TableCell>{submission.status}</TableCell>
                  <TableCell>
                    {submission.grade ?? submission.grade_display ?? submission.score ?? '—'}
                  </TableCell>
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
