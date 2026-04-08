'use client';

import type { DashboardClass } from '@/app/dashboard/_components/types';
import DeleteModal from '@/components/custom-modals/delete-modal';
import { Button } from '@/components/ui/button';
import { useInstructor } from '@/context/instructor-context';
import {
  deactivateClassDefinitionMutation,
  getClassDefinitionsForInstructorQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { cx, elimikaDesignSystem } from '../../../../../lib/design-system';
import { TrainingClassList } from '../../../_components/training-class-list';
import {
  ClassDialog,
  ScheduleDialog,
  TimetableScheduleDialog,
} from '../../_components/class-management-form';

interface TrainingPageProps {
  classesWithCourseAndInstructor: DashboardClass[];
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
  const openRecurrentSchedule = (id: string) => {
    setEditingClassId(id);
    setScheduleModal(true);
  };

  const [timetableModal, setTimetableModal] = useState(false);
  const openTimetableSchedule = (id: string) => {
    setEditingClassId(id);
    setTimetableModal(true);
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const openDeleteModal = (id: string) => {
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

      <Link
        href="/dashboard/new-class"
        className={cx(
          elimikaDesignSystem.components.header.badge,
          'inline-flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity'
        )}
      >
        <span>New Class Page</span>
        <ArrowRight className="h-4 w-4" />
      </Link>

      <div className='flex flex-col self-end'>
        <Button
          onClick={() => router.push(`/dashboard/trainings/create-new`)}
          size='lg'
          className='w-full max-w-fit gap-2 self-end'
        >
          <PlusIcon className='h-5 w-5' />
          Create New Class
        </Button>
      </div>

      <TrainingClassList
        onEdit={id => router.push(`/dashboard/trainings?id=${id}`)}
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
