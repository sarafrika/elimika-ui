'use client';

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
import { formatCourseDate } from '@/lib/format-course-date';
import { deleteTrainingProgramMutation, getAllTrainingProgramsQueryKey, searchTrainingProgramsOptions } from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, EyeIcon, FilePenIcon, PenIcon, PlusIcon, Square, TrashIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { CustomPagination } from '../../../../components/pagination';
import { useInstructor } from '../../../../context/instructor-context';
import {
  AddProgramCourseDialog,
  ClassFormValues,
  CreateClassDialog,
  EditClassDialog
} from '../_components/class-management-form';

export default function ClassesPage() {
  const queryClient = useQueryClient()
  const instructor = useInstructor()

  const [isCreateClassDialog, setIsCreateClassDialog] = useState(false);
  const openCreateClassDialog = () => setIsCreateClassDialog(true);
  const closeCreateClassDialog = () => setIsCreateClassDialog(false);

  const [isEditClassDialog, setIsEditClassDialog] = useState(false);
  const [editClassId, setEditClassId] = useState<string | null>(null);

  const openEditClassDialog = (id: string) => {
    setEditClassId(id);
    setIsEditClassDialog(true);
  };
  const closeEditClassDialog = () => {
    setEditClassId(null);
    setIsEditClassDialog(false);
  };


  const [isAddClassCourseDialog, setIsAddClassCourseDialog] = useState(false);
  const openAddClassCourseDialog = (id: string) => {
    setEditClassId(id);
    setIsAddClassCourseDialog(true)
  }

  const size = 20;
  const [page, setPage] = useState(0);

  // GET INSTRUCTOR'S PROGRAMS
  const { data, isLoading, isFetching, } = useQuery(searchTrainingProgramsOptions({ query: { page, size, searchParams: { instructorUuid: instructor?.uuid } } }))

  // @ts-ignore
  const trainingPrograms = data?.data?.content || [];
  //@ts-ignore
  const paginationMetadata = data?.data?.metadata;


  // DELETE TRAINING PROGRAM
  const deleteTrainingProgram = useMutation(deleteTrainingProgramMutation());
  const handleDelete = async (classId: string) => {
    if (!classId) return;

    try {
      await deleteTrainingProgram.mutateAsync({
        path: { uuid: classId }
      }, {
        onSuccess: () => {
          toast.success('Training program deleted succcessfully');
          queryClient.invalidateQueries({
            queryKey: getAllTrainingProgramsQueryKey({ query: { page, size } })
          });
        },
      });
    } catch (err) { }
  };

  const selectedClass = trainingPrograms.find((cls: any) => cls.uuid === editClassId);
  const classInitialValues: Partial<ClassFormValues> = {
    title: selectedClass?.title || '',
    description: selectedClass?.description || '',
    ...selectedClass
  };

  return (
    <div className='space-y-6'>
      <div className='flex justify-end'>
        <Button
          onClick={openCreateClassDialog}
          type='button'
          className='cursor-pointer px-4 py-2 text-sm'
          asChild
        >
          <div>
            <PlusIcon className='mr-1 h-4 w-4' />
            New Class
          </div>
        </Button>
      </div>

      {/* Classes Table or Empty State */}
      {trainingPrograms?.length === 0 && !isFetching ? (
        <div className='bg-muted/20 rounded-md border py-12 text-center'>
          <FilePenIcon className='text-muted-foreground mx-auto h-12 w-12' />
          <h3 className='mt-4 text-lg font-medium'>No classes found</h3>
          <p className='text-muted-foreground mt-2'>
            You don&apos;t have any classes yet. Start by creating a new class.
          </p>
          <Button onClick={openCreateClassDialog} className='mt-4' asChild>
            <div>Create Your First Class</div>
          </Button>
        </div>
      ) : (
        <div className="rounded-t-lg border border-gray-200 overflow-hidden">
          <Table>
            <TableCaption className='py-4'>A list of your classes</TableCaption>
            <TableHeader className='bg-muted'>
              <TableRow>
                <TableHead>
                  <Square size={20} strokeWidth={1} className='flex mx-auto self-center' />
                </TableHead>
                <TableHead className='w-[300px]'>Class Name</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>Class Limit</TableHead>
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
                  {trainingPrograms.map((cls: any) => (
                    <TableRow key={cls.uuid}>
                      <TableHead>
                        <Square size={20} strokeWidth={1} className='flex mx-auto self-center' />
                      </TableHead>
                      <TableCell className='font-medium'>
                        <div>
                          <div>{cls.title}</div>
                          <div className='text-muted-foreground max-w-[250px] truncate text-sm'>
                            {cls.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex flex-wrap gap-1'>
                          <Badge variant='outline' className='capitalize'>
                            {cls.cat}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{cls.class_limit || 'Unlimited'}</TableCell>
                      <TableCell>{formatCourseDate(cls.updated_date)}</TableCell>
                      <TableCell className='text-center'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='icon' aria-label='Open menu'>
                              <svg
                                width='15'
                                height='15'
                                viewBox='0 0 15 15'
                                fill='none'
                                xmlns='http://www.w3.org/2000/svg'
                                className='h-4 w-4'
                              >
                                <path
                                  d='M8.625 2.5C8.625 3.12132 8.12132 3.625 7.5 3.625C6.87868 3.625 6.375 3.12132 6.375 2.5C6.375 1.87868 6.87868 1.375 7.5 1.375C8.12132 1.375 8.625 1.87868 8.625 2.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM7.5 13.625C8.12132 13.625 8.625 13.1213 8.625 12.5C8.625 11.8787 8.12132 11.375 7.5 11.375C6.87868 11.375 6.375 11.8787 6.375 12.5C6.375 13.1213 6.87868 13.625 7.5 13.625Z'
                                  fill='currentColor'
                                  fillRule='evenodd'
                                  clipRule='evenodd'
                                ></path>
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem asChild>
                              <div
                                onClick={() => openEditClassDialog(cls.uuid)}
                                className='flex w-full items-center'
                              >
                                <PenIcon className='mr-2 h-4 w-4' />
                                Edit
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/classes/preview/${cls.uuid}`}
                                className='flex w-full items-center'
                              >
                                <EyeIcon className='mr-2 h-4 w-4' />
                                Preview
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openAddClassCourseDialog(cls.uuid)}
                            >
                              <BookOpen className='mr-2 h-4 w-4' />
                              Add Course
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant='destructive'
                              onClick={() => handleDelete(cls.uuid)}
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

      <CreateClassDialog
        isOpen={isCreateClassDialog}
        onOpenChange={closeCreateClassDialog} />

      {isEditClassDialog && selectedClass && (
        <EditClassDialog
          isOpen={isEditClassDialog}
          onOpenChange={closeEditClassDialog}
          initialValues={classInitialValues}
          classId={editClassId || ''}
        />
      )}

      <AddProgramCourseDialog isOpen={isAddClassCourseDialog} onOpenChange={setIsAddClassCourseDialog} classId={editClassId || ''} />

    </div >
  );
}
