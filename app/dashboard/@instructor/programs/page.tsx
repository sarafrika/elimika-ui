'use client';

import DeleteModal from '@/components/custom-modals/delete-modal';
import HTMLTextPreview from '@/components/editors/html-text-preview';
import { CustomPagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
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
import { useInstructor } from '@/context/instructor-context';
import { formatCourseDate } from '@/lib/format-course-date';
import {
  deleteTrainingProgramMutation,
  getAllCategoriesOptions,
  searchTrainingProgramsOptions,
  searchTrainingProgramsQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BadgeCheck,
  BookOpen,
  EyeIcon,
  FilePenIcon,
  MoreVertical,
  PenIcon,
  PlusIcon,
  Square,
  TrashIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  AddProgramCourseDialog,
  CreateProgramDialog,
  EditProgramDialog,
  ProgramFormValues,
  ProgramRequirementDialog,
} from '../_components/program-management-form';

export default function ClassesPage() {
  const queryClient = useQueryClient();
  const instructor = useInstructor();

  const [isCreateProgramDialog, setIsCreateProgramDialog] = useState(false);
  const openCreateProgramDialog = () => setIsCreateProgramDialog(true);
  const closeCreateProgramDialog = () => setIsCreateProgramDialog(false);

  const [isEditProgramDialog, setIsEditProgramDialog] = useState(false);

  const [editProgramId, setEditProgramId] = useState<string | null>(null);
  const [editingRequirementId, setEditingRequirementId] = useState<string | null>(null);

  const openEditProgramDialog = (id: string) => {
    setEditProgramId(id);
    setIsEditProgramDialog(true);
  };
  const closeEditProgramDialog = () => {
    setEditProgramId(null);
    setIsEditProgramDialog(false);
  };

  const [isAddProgramCourseDialog, setIsAddProgramCourseDialog] = useState(false);
  const openAddProgramCourseDialog = (id: string) => {
    setEditProgramId(id);
    setIsAddProgramCourseDialog(true);
  };

  const [programRequirementModal, setProgramRequirementModal] = useState(false);
  const openProgramRequirementModal = (id: string) => {
    // setEditingRequirementId(id);
    setEditProgramId(id);
    setProgramRequirementModal(true);
  };

  const size = 20;
  const [page, setPage] = useState(0);

  const { data: categories } = useQuery(getAllCategoriesOptions({ query: { pageable: {} } }));

  // GET INSTRUCTOR'S PROGRAMS
  const { data, isLoading, isFetching } = useQuery(
    searchTrainingProgramsOptions({
      query: { searchParams: { instructorUuid: instructor?.uuid }, pageable: { page, size } },
    })
  );

  const programs = data?.data?.content || [];
  const paginationMetadata = data?.data?.metadata;

  // DELETE PROGRAM
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [programToDeleteId, setProgramToDeleteId] = useState<string | null>(null);
  const openDeleteModal = (programId: string) => {
    setProgramToDeleteId(programId);
    setDeleteModalOpen(true);
  };

  const deleteTrainingProgram = useMutation(deleteTrainingProgramMutation());
  const confirmDelete = async () => {
    if (!programToDeleteId) return;

    try {
      await deleteTrainingProgram.mutateAsync(
        {
          path: { uuid: programToDeleteId },
        },
        {
          onSuccess: () => {
            toast.success('Training program deleted successfully');
            queryClient.invalidateQueries({
              queryKey: searchTrainingProgramsQueryKey({
                query: {
                  pageable: { page, size },
                  searchParams: { instructorUuid: instructor?.uuid },
                },
              }),
            });
            setDeleteModalOpen(false);
            setProgramToDeleteId(null);
          },
        }
      );
    } catch (err) {
      toast.error('Failed to delete program');
    }
  };

  const selectedProgram = programs.find((program: any) => program.uuid === editProgramId);

  const programInitialValues: Partial<ProgramFormValues> = {
    title: selectedProgram?.title || '',
    description: selectedProgram?.description || '',
    categories: selectedProgram?.category_uuid || '',
    ...selectedProgram,
  };

  return (
    <div className='space-y-6'>
      <div className='mb-6 flex items-end justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>Your Programs</h1>
          <p className='text-muted-foreground mt-1 text-base'>
            You have {programs?.length} program
            {programs?.length > 1 ? 's' : ''} created.
          </p>
        </div>
        <Button
          onClick={openCreateProgramDialog}
          type='button'
          className='cursor-pointer px-4 py-2 text-sm'
          asChild
        >
          <div>
            <PlusIcon className='mr-1 h-4 w-4' />
            New Program
          </div>
        </Button>
      </div>

      {programs?.length === 0 && !isFetching ? (
        <div className='bg-muted/20 rounded-md border py-12 text-center'>
          <FilePenIcon className='text-muted-foreground mx-auto h-12 w-12' />
          <h3 className='mt-4 text-lg font-medium'>No programs found</h3>
          <p className='text-muted-foreground mt-2'>
            You don&apos;t have any programs yet. Start by creating a new program.
          </p>
          <Button onClick={openCreateProgramDialog} className='mt-4' asChild>
            <div>Create Your First Program</div>
          </Button>
        </div>
      ) : (
        <div className='overflow-hidden rounded-t-lg border border-gray-200'>
          <Table>
            <TableCaption className='py-4'>A list of your programs</TableCaption>
            <TableHeader className='bg-muted'>
              <TableRow>
                <TableHead>
                  <Square size={20} strokeWidth={1} className='mx-auto flex self-center' />
                </TableHead>
                <TableHead className='w-[300px]'>Program Name</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>Program Limit</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className='mx-auto text-center'>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className='py-6'>
                    <div className='flex w-full items-center justify-center'>
                      <Spinner />
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {programs.map((program: any) => (
                    <TableRow key={program.uuid}>
                      <TableHead>
                        <Square size={20} strokeWidth={1} className='mx-auto flex self-center' />
                      </TableHead>
                      <TableCell className='font-medium'>
                        <div>
                          <div>{program.title}</div>
                          <div className='text-muted-foreground line-clamp-1 max-w-[250px] truncate text-sm'>
                            <HTMLTextPreview htmlContent={program?.description as string} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex flex-wrap gap-1'>
                          <Badge variant='outline' className='capitalize'>
                            {categories?.data?.content?.find(
                              (p: any) => p.uuid === program.category_uuid
                            )?.name || 'Unknown'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{program.class_limit || 'Unlimited'}</TableCell>
                      <TableCell>{formatCourseDate(program.updated_date)}</TableCell>
                      <TableCell className='text-center'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='icon' aria-label='Open menu'>
                              <MoreVertical className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/programs/preview/${program.uuid}`}
                                className='flex w-full items-center'
                              >
                                <EyeIcon className='mr-2 h-4 w-4' />
                                Preview
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <div
                                onClick={() => openEditProgramDialog(program.uuid)}
                                className='flex w-full items-center'
                              >
                                <PenIcon className='mr-2 h-4 w-4' />
                                Edit
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openAddProgramCourseDialog(program.uuid)}
                            >
                              <BookOpen className='mr-2 h-4 w-4' />
                              Add Course
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openProgramRequirementModal(program.uuid)}
                            >
                              <BadgeCheck className='mr-2 h-4 w-4' />
                              Add Requirements
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/programs/enrollments/${program.uuid}`}
                                className='flex w-full items-center'
                              >
                                <EyeIcon className='mr-2 h-4 w-4' />
                                View Enrollments
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant='destructive'
                              onClick={() => openDeleteModal(program.uuid)}
                            >
                              <TrashIcon className='mr-2 h-4 w-4' />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* @ts-ignore */}
      {paginationMetadata?.totalPages >= 1 && (
        <CustomPagination
          totalPages={paginationMetadata?.totalPages as number}
          onPageChange={page => {
            setPage(page - 1);
          }}
        />
      )}

      <CreateProgramDialog isOpen={isCreateProgramDialog} onOpenChange={closeCreateProgramDialog} />

      {isEditProgramDialog && selectedProgram && (
        <EditProgramDialog
          isOpen={isEditProgramDialog}
          onOpenChange={closeEditProgramDialog}
          initialValues={programInitialValues}
          programId={editProgramId || ''}
        />
      )}

      <AddProgramCourseDialog
        isOpen={isAddProgramCourseDialog}
        onOpenChange={setIsAddProgramCourseDialog}
        programId={editProgramId || ''}
      />

      <ProgramRequirementDialog
        isOpen={programRequirementModal}
        onOpenChange={setProgramRequirementModal}
        initialValues={undefined}
        programId={editProgramId as string}
        requirementId={editingRequirementId as string}
      />

      <DeleteModal
        open={deleteModalOpen}
        setOpen={setDeleteModalOpen}
        title='Delete Program'
        description='Are you sure you want to delete this training program? This action cannot be undone.'
        onConfirm={confirmDelete}
        isLoading={deleteTrainingProgram.isPending}
        confirmText='Delete Program'
      />
    </div>
  );
}
