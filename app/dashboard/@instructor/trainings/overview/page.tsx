'use client';

import { deactivateClassDefinitionMutation, getClassDefinitionsForInstructorOptions, getClassDefinitionsForInstructorQueryKey } from '@/services/client/@tanstack/react-query.gen';
import { useRouter } from 'next/navigation';
import { ClassDialog, ScheduleDialog, TimetableScheduleDialog } from '../../_components/class-management-form';

import DeleteModal from '@/components/custom-modals/delete-modal';
import HTMLTextPreview from '@/components/editors/html-text-preview';
import PageLoader from '@/components/page-loader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { RecurrenceDaysCell, RecurrencePatternCell } from '../component/recurring-patterns';

export default function TrainingsPage() {
  const router = useRouter();
  const qc = useQueryClient()
  const instructor = useInstructor();
  const [openAddClass, setOpenAddClass] = useState(false);

  const { data, isLoading, } = useQuery(
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
      <div className='mb-6 flex items-end justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>Your Classes</h1>
          <p className='text-muted-foreground mt-1 text-base'>You have {classes?.length} classes</p>
        </div>
        <Button
          onClick={() => router.push(`/dashboard/trainings/create-new`)}
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

      {classes?.length === 0 && !isLoading && (
        <div className='bg-muted/20 rounded-md border py-12 text-center'>
          <FilePenIcon className='text-muted-foreground mx-auto h-12 w-12' />
          <h3 className='mt-4 text-lg font-medium'>No classes found</h3>
          <p className='text-muted-foreground mt-2'>
            You don&apos;t have any classes yet. Start by creating a new class.
          </p>
          <Button
            onClick={() => router.push('/dashboard/trainings/create-new')}
            className='mt-4'
            asChild
          >
            <div>Create Your First Class</div>
          </Button>
        </div>
      )}

      {isLoading ? (
        <PageLoader />
      ) : (
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
          {classes?.map((cl: any) => (
            <div
              key={cl.uuid}
              className='relative min-h-[250px] rounded-lg border bg-white p-5 shadow-sm transition hover:shadow-md'
            >
              {/* Actions dropdown */}
              <div className='absolute top-2 right-2'>
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

              {/* Title & description */}
              <h3 className='pr-6 text-lg font-semibold'>{cl.title}</h3>
              <div className='text-muted-foreground mb-1 line-clamp-2 text-sm'>
                <HTMLTextPreview htmlContent={cl?.description as string} />
              </div>

              <div className='mb-2 flex justify-end'>
                <Badge>{cl.is_active ? 'Active' : 'Inactive'}</Badge>
              </div>

              {/* Class details */}
              <ul className='space-y-2.5 text-sm'>
                <li>
                  <strong>📅 Days:</strong>{' '}
                  <RecurrenceDaysCell recurrenceUuid={cl.recurrence_pattern_uuid} />
                </li>
                <li>
                  <strong>🕒 Time:</strong> {cl.default_start_time} - {cl.default_end_time}
                </li>
                <li>
                  <strong>📍 Location:</strong> {cl.location_type}
                </li>
                <li>
                  <strong>🔁 Recurrence:</strong>{' '}
                  <RecurrencePatternCell recurrenceUuid={cl.recurrence_pattern_uuid} />
                </li>
                <li>
                  <strong>👥 Participants:</strong> {cl.max_participants}
                </li>
              </ul>
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
