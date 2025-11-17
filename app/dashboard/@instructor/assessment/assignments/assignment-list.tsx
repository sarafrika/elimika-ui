'use client';

import DeleteModal from '@/components/custom-modals/delete-modal';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Spinner from '@/components/ui/spinner';
import { useInstructor } from '@/context/instructor-context';
import {
  deleteAssignmentMutation,
  getAllAssignmentsOptions,
  getAllAssignmentsQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, MoreVertical, PenLine, Trash } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Card } from '../../../../../components/ui/card';
import { AssignmentDialog } from '../../../@course_creator/_components/assignment-management-form';

export default function AssignmentListPage() {
  const qc = useQueryClient();
  const instructor = useInstructor();

  // const { data, isLoading, isSuccess, isFetched, isFetching } = useQuery({
  //   ...getCoursesByInstructorOptions({
  //     path: { instructorUuid: instructor?.uuid as string },
  //     query: { pageable: { page, size, sort: [] } },
  //   }),
  //   enabled: !!instructor?.uuid,
  // });

  // fetch all instructors' courses, use each course id to fetch its assignments
  // const { data: allCourses } = useQuery(getAllCoursesOptions({ query: { pageable: {} } }));

  const [openAssignmentModal, setOpenAssignmentModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const [editingAssignmetId, setEditingAssignmentId] = useState();
  const [editingAssignmentData, setEditingAssignmentData] = useState();

  const { data, isLoading, isFetching, isFetched } = useQuery(
    getAllAssignmentsOptions({ query: { pageable: {} } })
  );
  const assignments = data?.data?.content;

  const handleEditAssignment = (assignment: any) => {
    setOpenAssignmentModal(true);
    setEditingAssignmentId(assignment?.uuid);
    setEditingAssignmentData(assignment);
  };

  const handleDeleteAssignment = (assignmentId: any) => {
    setEditingAssignmentId(assignmentId);
    setOpenDeleteModal(true);
  };

  const deleteMutation = useMutation(deleteAssignmentMutation());
  const confirmDelete = () => {
    if (!editingAssignmetId) return;
    deleteMutation.mutate(
      { path: { uuid: editingAssignmetId } },
      {
        onSuccess: () => {
          qc.invalidateQueries({
            queryKey: getAllAssignmentsQueryKey({
              query: { pageable: {} },
            }),
          });
          setOpenDeleteModal(false);
          toast.success('Assignmet deleted successfully');
        },
      }
    );
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>Your Assignments</h1>
        <p className='text-muted-foreground mt-1 text-base'>
          You have <span className='text-foreground font-medium'>{assignments?.length || 0}</span>{' '}
          assignment{assignments?.length === 1 ? '' : 's'} assigned.
        </p>
      </div>

      {/* Loading State */}
      {isLoading && isFetching && (
        <div className='flex items-center justify-center py-12'>
          <Spinner />
        </div>
      )}

      {/* Empty State */}
      {isFetched && assignments?.length === 0 && (
        <div className='text-muted-foreground bg-muted/30 rounded-xl border border-dashed p-12 text-center'>
          <BookOpen className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
          <h3 className='text-lg font-medium'>No Assignments Found</h3>
          <p className='mt-2 text-sm'>
            You can create new assignments for your course to get started.
          </p>
        </div>
      )}

      {/* Assignments List */}
      {!isLoading && !isFetching && isFetched && (
        <div className='space-y-4'>
          {assignments?.map((item, index) => (
            <Card
              key={item.uuid || index}
              className='group relative flex flex-col gap-3 px-4'
            >
              {/* Assignment Header with Meta Info */}
              <div className='flex items-start justify-between'>
                <div className='flex items-start gap-3'>
                  {/* Index Circle */}
                  <div className='mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40'>
                    <span className='text-sm font-semibold text-blue-600 dark:text-blue-300'>
                      {index + 1}
                    </span>
                  </div>

                  {/* Title + Meta */}
                  <div className='flex flex-col space-y-1'>
                    <h3 className='text-foreground text-lg font-semibold'>{item.title}</h3>

                    {/* Meta Info */}
                    <div className='text-muted-foreground flex items-center gap-4 text-sm'>
                      {item.due_date && (
                        <div className='flex items-center gap-1'>
                          <span>📅</span>
                          <span className='text-foreground font-medium'>
                            {new Date(item.due_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      )}
                      {item.points_display && (
                        <div className='flex items-center gap-1'>
                          <span>🏆</span>
                          <span className='text-foreground font-medium'>{item.points_display}</span>
                        </div>
                      )}
                    </div>

                    <div className='text-muted-foreground flex items-center gap-4 text-sm'>
                      <div className='flex items-center gap-1'>
                        <span className='text-foreground font-medium'>
                          {item.submission_summary}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <div className='text-muted-foreground mt-1 text-sm leading-snug'>
                      <RichTextRenderer htmlString={item?.description as string} maxChars={180} />
                    </div>
                  </div>
                </div>

                {/* Action Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='opacity-0 transition-opacity group-hover:opacity-100'
                    >
                      <MoreVertical className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem onClick={() => handleEditAssignment(item)}>
                      <PenLine className='mr-1 h-4 w-4' />
                      Edit Assignment
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className='text-red-600'
                      onClick={() => item.uuid && handleDeleteAssignment(item.uuid)}
                    >
                      <Trash className='mr-1 h-4 w-4' />
                      Delete Assignment
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <AssignmentDialog
        isOpen={openAssignmentModal}
        setOpen={setOpenAssignmentModal}
        editingAssignmetId={editingAssignmetId}
        initialValues={editingAssignmentData}
        courseId=''
        onCancel={() => setOpenAssignmentModal(false)}
      />

      <DeleteModal
        open={openDeleteModal}
        setOpen={setOpenDeleteModal}
        title='Delete Assignment'
        description='Are you sure you want to delete this assignment? This action cannot be undone.'
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isPending}
        confirmText='Delete Assignment'
      />
    </div>
  );
}
