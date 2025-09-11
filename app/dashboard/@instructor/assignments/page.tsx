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
import {
  deleteAssignmentMutation,
  getAllAssignmentsOptions,
  getAllAssignmentsQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Eye, Grip, MoreVertical, PenLine, Trash } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import Spinner from '../../../../components/ui/spinner';
import { AssignmentDialog } from '../_components/assignment-management-form';

export default function AssignmentsPage() {
  const qc = useQueryClient();

  const [openAssignmentModal, setOpenAssignmentModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const [editingAssignmetId, setEditingAssignmentId] = useState();
  const [editingAssignmentData, setEditingAssignmentData] = useState();

  const { data, isLoading, isFetched } = useQuery(
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
      <div>
        <h1 className='text-xl font-semibold'>Your Assignments</h1>
        <p className='text-muted-foreground mt-1 text-base'>
          You have {assignments?.length || 0} assignment{assignments?.length === 1 ? '' : 's'}.
        </p>
      </div>

      {isLoading && (
        <div className='flex items-center justify-center'>
          <Spinner />
        </div>
      )}

      {isFetched && assignments?.length === 0 && (
        <div className='text-muted-foreground rounded-lg border border-dashed p-12 text-center'>
          <BookOpen className='text-muted-foreground mx-auto h-12 w-12' />
          <h3 className='mt-4 text-lg font-medium'>No Assignment found.</h3>
          <p className='text-muted-foreground mt-2'>
            You can create assignments for your lesson to get started.
          </p>
        </div>
      )}

      {!isLoading && isFetched && (
        <div className='space-y-3'>
          {assignments?.map((item, index) => (
            <div
              key={item.uuid || index}
              className='group relative flex flex-col gap-4 rounded-lg border p-4 transition-all'
            >
              <div className='flex items-start gap-4'>
                <Grip className='text-muted-foreground mt-1 h-5 w-5 cursor-move opacity-0 transition-opacity group-hover:opacity-100' />

                <div className='flex-1 space-y-3'>
                  <div className='flex items-start justify-between'>
                    <div className='flex flex-col items-start'>
                      <h3 className='text-lg font-medium'>{item.title}</h3>
                      <div className='text-muted-foreground text-sm'>
                        <RichTextRenderer htmlString={item?.description as string} maxChars={150} />
                      </div>
                    </div>

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
                        <DropdownMenuItem>
                          <Link
                            href={`/dashboard/assignments/submissions?id=${item.uuid}`}
                            className='flex flex-row items-center'
                          >
                            <Eye className='mr-3 h-4 w-4' />
                            Vew Submissions
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => handleEditAssignment(item)}>
                          <PenLine className='mr-1 h-4 w-4' />
                          Edit Assignment
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className='text-red-600'
                          onClick={() => {
                            if (item.uuid) handleDeleteAssignment(item.uuid);
                          }}
                        >
                          <Trash className='mr-1 h-4 w-4' />
                          Delete Assignment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AssignmentDialog
        isOpen={openAssignmentModal}
        setOpen={setOpenAssignmentModal}
        editingAssignmetId={editingAssignmetId}
        initialValues={editingAssignmentData}
        onCancel={() => {
          setOpenAssignmentModal(false);
        }}
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
