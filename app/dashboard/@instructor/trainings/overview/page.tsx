'use client';

import DeleteModal from '@/components/custom-modals/delete-modal';
import { Button } from '@/components/ui/button';
import { useInstructor } from '@/context/instructor-context';
import {
  deactivateClassDefinitionMutation,
  getClassDefinitionsForInstructorQueryKey
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { TrainingClassList } from '../../../_components/training-class-list';
import {
  ClassDialog,
  ScheduleDialog,
  TimetableScheduleDialog,
} from '../../_components/class-management-form';

interface TrainingPageProps {
  classesWithCourseAndInstructor: any;
  loading: boolean;
}

export default function TrainingsPage({
  classesWithCourseAndInstructor,
  loading,
}: TrainingPageProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const instructor = useInstructor();
  const [openAddClass, setOpenAddClass] = useState(false);

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Your Classes</h1>
          <p className="text-muted-foreground">
            Manage your classes and schedules
          </p>
        </div>

        <Button
          onClick={() => router.push(`/dashboard/trainings/create-new`)}
          size="lg"
          className="gap-2 w-full sm:w-auto"
        >
          <PlusIcon className="h-5 w-5" />
          Create New Class
        </Button>
      </div>

      <TrainingClassList
        onEdit={(id: any) => router.push(`/dashboard/trainings?id=${id}`)}
        onDelete={openDeleteModal}
        onOpenTimetable={openTimetableSchedule}
        onOpenRecurring={openRecurrentSchedule}
        classesWithCourseAndInstructor={classesWithCourseAndInstructor}
        loading={loading}
      />

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
