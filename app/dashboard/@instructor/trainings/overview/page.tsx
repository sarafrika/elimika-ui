'use client';

import DeleteModal from '@/components/custom-modals/delete-modal';
import { Button } from '@/components/ui/button';
import { useInstructor } from '@/context/instructor-context';
import {
  deactivateClassDefinitionMutation,
  getClassDefinitionsForInstructorOptions,
  getClassDefinitionsForInstructorQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
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
  // const classes = data?.data;

  const classes = [
    {
      uuid: "cd123456-7890-abcd-ef01-234567890abc",
      title: "Introduction to Java Programming",
      description: "Comprehensive introduction to Java programming covering basics, OOP concepts, and practical application development.",
      default_instructor_uuid: "inst1234-5678-90ab-cdef-123456789abc",
      organisation_uuid: "org12345-6789-abcd-ef01-234567890abc",
      course_uuid: "course123-4567-89ab-cdef-123456789abc",
      training_fee: 240,
      duration_minutes: 90,
      location_type: "HYBRID",
      max_participants: 25,
      allow_waitlist: true,
      recurrence_pattern_uuid: "rp123456-7890-abcd-ef01-234567890abc",
      is_active: true,
      created_date: "2024-09-05T10:00:00",
      updated_date: "2024-09-05T15:30:00",
      created_by: "admin@sarafrika.com",
      updated_by: "admin@sarafrika.com",
    },
    {
      uuid: "cd123456-7890-abcd-ef01-sdfldjsf",
      title: "Introduction to Java Programming",
      description: "Comprehensive introduction to Java programming covering basics, OOP concepts, and practical application development.",
      default_instructor_uuid: "inst1234-5678-90ab-cdef-123456789abc",
      organisation_uuid: "org12345-6789-abcd-ef01-234567890abc",
      course_uuid: "course123-4567-89ab-cdef-123456789abc",
      training_fee: 240,
      duration_minutes: 90,
      location_type: "HYBRID",
      max_participants: 25,
      allow_waitlist: true,
      recurrence_pattern_uuid: "rp123456-7890-abcd-ef01-234567890abc",
      is_active: true,
      created_date: "2024-09-05T10:00:00",
      updated_date: "2024-09-05T15:30:00",
      created_by: "admin@sarafrika.com",
      updated_by: "admin@sarafrika.com",
    },
    {
      uuid: "cd123456-7890-abcd-ef01-sdfsdfsfd",
      title: "Introduction to Java Programming",
      description: "Comprehensive introduction to Java programming covering basics, OOP concepts, and practical application development.",
      default_instructor_uuid: "inst1234-5678-90ab-cdef-123456789abc",
      organisation_uuid: "org12345-6789-abcd-ef01-234567890abc",
      course_uuid: "course123-4567-89ab-cdef-123456789abc",
      training_fee: 240,
      duration_minutes: 90,
      location_type: "HYBRID",
      max_participants: 25,
      allow_waitlist: true,
      recurrence_pattern_uuid: "rp123456-7890-abcd-ef01-234567890abc",
      is_active: true,
      created_date: "2024-09-05T10:00:00",
      updated_date: "2024-09-05T15:30:00",
      created_by: "admin@sarafrika.com",
      updated_by: "admin@sarafrika.com",
    },
  ];

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
