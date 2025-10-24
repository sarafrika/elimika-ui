'use client';

import DeleteModal from '@/components/custom-modals/delete-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useInstructor } from '@/context/instructor-context';
import {
  deactivateClassDefinitionMutation,
  getClassDefinitionsForInstructorOptions,
  getClassDefinitionsForInstructorQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FilePenIcon,
  PlusIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { TrainingClassComponent } from '../../../_components/training-class-component';
import {
  ClassDialog,
  ScheduleDialog,
  TimetableScheduleDialog,
} from '../../_components/class-management-form';

export default function TrainingsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const instructor = useInstructor();
  const [openAddClass, setOpenAddClass] = useState(false);

  const { data, isLoading, isPending, isFetching } = useQuery(
    getClassDefinitionsForInstructorOptions({
      path: { instructorUuid: instructor?.uuid as string },
      query: { activeOnly: false },
    })
  );
  const classes = data?.data;

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

  const deactivateClass = useMutation(deactivateClassDefinitionMutation());
  const confirmDelete = () => {
    deactivateClass.mutate(
      { path: { uuid: deleteId as string } },
      {
        onSuccess: data => {
          qc.invalidateQueries({
            queryKey: getClassDefinitionsForInstructorQueryKey({
              path: { instructorUuid: instructor?.uuid as string },
            }),
          });
          setDeleteModal(false);
          toast.message(data?.message || `Class definition deactivated successfully`);
        },
      }
    );
  };

  return (
    <div className='mb-20 space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>Your Classes</h1>
          <p className='text-muted-foreground'>Manage your classes and schedules</p>
        </div>
        <Button
          onClick={() => router.push(`/dashboard/trainings/create-new`)}
          size='lg'
          className='gap-2'
        >
          <PlusIcon className='h-5 w-5' />
          Create New Class
        </Button>
      </div>

      {isLoading || isFetching ? (
        <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
          <Skeleton className='h-4 w-32' />
          <Skeleton className='h-4 w-32' />
          <Skeleton className='h-4 w-32' />
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
          <Card>
            <CardHeader className=''>
              <CardTitle className='text-muted-foreground text-sm'>Total Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-semibold'>{classes?.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className=''>
              <CardTitle className='text-muted-foreground text-sm'>Published Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-semibold'>{0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className=''>
              <CardTitle className='text-muted-foreground text-sm'>Draft Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-semibold'>{0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {classes?.length === 0 && !isFetching && (
        <div className='bg-muted/20 space-y-4 rounded-md border py-12 text-center'>
          <FilePenIcon className='text-muted-foreground mx-auto h-12 w-12' />

          <div>
            <h3 className='text-lg font-semibold'>No classes yet</h3>
            <p className='text-muted-foreground'>Get started by creating your first class</p>
          </div>

          <Button onClick={() => router.push('/dashboard/trainings/create-new')} asChild>
            <div>Create Your First Class</div>
          </Button>
        </div>
      )}

      <TrainingClassComponent />

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
