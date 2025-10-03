'use client';

import { deactivateClassDefinitionMutation, getClassDefinitionsForInstructorOptions, getClassDefinitionsForInstructorQueryKey } from '@/services/client/@tanstack/react-query.gen';
import { useRouter } from 'next/navigation';
import { ClassDialog, ScheduleDialog, TimetableScheduleDialog } from '../../_components/class-management-form';

import DeleteModal from '@/components/custom-modals/delete-modal';
import PageLoader from '@/components/page-loader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useInstructor } from '@/context/instructor-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  EyeIcon,
  FilePenIcon,
  LucideFileWarning,
  MoreVertical,
  PenIcon,
  PlusIcon
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import ClassCourseDisplay from '../component/class-course-dislay';


export default function TrainingsPage() {
  const router = useRouter();
  const qc = useQueryClient()
  const instructor = useInstructor();
  const [openAddClass, setOpenAddClass] = useState(false);

  const { data, isLoading, isPending } = useQuery(
    getClassDefinitionsForInstructorOptions({
      path: { instructorUuid: instructor?.uuid as string },
      query: { activeOnly: false },
    })
  );
  const classes = data?.data

  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  const [scheduleModal, setScheduleModal] = useState(false);
  const openRecurrentSchedule = (id: any) => {
    setEditingClassId(id);
    setScheduleModal(true);
  };

  const [timetableModal, setTimetableModal] = useState(false);
  const openTimetableSchedule = (id: any) => {
    setEditingClassId(id);
    setTimetableModal(true);
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const openDeleteModal = (id: any) => {
    setDeleteId(id);
    setDeleteModal(true);
  };

  const deactivateClass = useMutation(deactivateClassDefinitionMutation())
  const confirmDelete = () => {
    deactivateClass.mutate({ path: { uuid: deleteId as string } }, {
      onSuccess: (data) => {
        qc.invalidateQueries({
          queryKey: getClassDefinitionsForInstructorQueryKey({ path: { instructorUuid: instructor?.uuid as string } }),
        });
        setDeleteModal(false);
        toast.message(data?.message || `Class definition deactivated successfully`);
      }
    })
  };

  return (
    <div className='space-y-6'>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your Classes</h1>
          <p className="text-muted-foreground">Manage your classes and schedules</p>
        </div>
        <Button onClick={() => router.push(`/dashboard/trainings/create-new`)} size="lg" className="gap-2">
          <PlusIcon className="w-5 h-5" />
          Create New Class
        </Button>
      </div>

      {isLoading || isPending ?
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
        </div>
        : <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="">
              <CardTitle className="text-sm text-muted-foreground">Total Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{classes?.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="">
              <CardTitle className="text-sm text-muted-foreground">Published Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="">
              <CardTitle className="text-sm text-muted-foreground">Draft Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{0}</div>
            </CardContent>
          </Card>
        </div>}


      {classes?.length === 0 && !isLoading && (
        <div className='space-y-4 bg-muted/20 rounded-md border py-12 text-center'>
          <FilePenIcon className='text-muted-foreground mx-auto h-12 w-12' />

          <div>
            <h3 className="text-lg font-semibold">No classes yet</h3>
            <p className="text-muted-foreground">Get started by creating your first class</p>
          </div>

          <Button
            onClick={() => router.push('/dashboard/trainings/create-new')}
            asChild
          >
            <div>Create Your First Class</div>
          </Button>
        </div>
      )}

      {isLoading || isPending ? (
        <PageLoader />
      ) : (
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
          {classes?.map((cl: any) => (
            <div
              key={cl.uuid}
              className='relative min-h-[250px] rounded-lg border bg-white py-8 px-6 shadow-sm transition hover:shadow-md'
            >
              {/* Actions dropdown */}
              <div className='absolute flex flex-row items-center top-2 right-2 gap-4'>
                <Badge variant={cl.is_active === true ? 'default' : 'secondary'}>
                  {cl.is_active ? 'Active Class' : 'Inactive Class'}
                </Badge>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='icon' aria-label='Open menu'>
                      <MoreVertical className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/dashboard/trainings/overview/${cl.uuid}`}
                        className='flex w-full items-center'
                      >
                        <EyeIcon className='mr-2 h-4 w-4' />
                        Preview
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <div
                        onClick={() => router.push(`/dashboard/trainings/create-new?id=${cl.uuid}`)}
                        className='flex w-full items-center'
                      >
                        <PenIcon className='mr-2 h-4 w-4' />
                        Edit Class
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant='default'
                      onClick={() => openTimetableSchedule(cl.uuid)}
                    >
                      <Calendar className='mr-2 h-4 w-4' />
                      Timetable Schedule
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant='default'
                      onClick={() => openRecurrentSchedule(cl.uuid)}
                    >
                      <Calendar className='mr-2 h-4 w-4' />
                      Schedule Recurring
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant='destructive'
                      onClick={() => openDeleteModal(cl.uuid)}
                    >
                      <LucideFileWarning className='mr-2 h-4 w-4' />
                      Deactivate
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className='mt-12'>
                <ClassCourseDisplay courseUuid={cl.course_uuid} classInfo={cl} />
              </div>
            </div>
          ))}
        </div>
      )}

      <ClassDialog
        isOpen={openAddClass}
        setOpen={setOpenAddClass}
        onCancel={() => {
          setOpenAddClass(false);
        }}
      />

      <ScheduleDialog
        isOpen={scheduleModal}
        setOpen={setScheduleModal}
        editingClassId={editingClassId as string}
        onCancel={() => setScheduleModal(false)}
      />

      <TimetableScheduleDialog
        isOpen={timetableModal}
        setOpen={setTimetableModal}
        editingClassId={editingClassId as string}
        onCancel={() => setTimetableModal(false)}
        status={'SCHEDULED'}
      />

      <DeleteModal
        open={deleteModal}
        setOpen={setDeleteModal}
        title='Deactivate Class'
        description={`Are you sure you want to deactivate this class? Don't worry, you can reactivate the class later.`}
        onConfirm={confirmDelete}
        isLoading={deactivateClass.isPending}
        confirmText='Deactivate Class'
      />
    </div>
  );
}
