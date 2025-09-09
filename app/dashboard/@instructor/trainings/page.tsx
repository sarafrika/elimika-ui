'use client'

import { getClassDefinitionsForInstructorOptions } from "@/services/client/@tanstack/react-query.gen";
import { useRouter } from "next/navigation";
import { ClassDialog, ScheduleDialog } from "../_components/class-management-form";

import HTMLTextPreview from '@/components/editors/html-text-preview';
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
import { useQuery } from '@tanstack/react-query';
import { Calendar, EyeIcon, FilePenIcon, MoreVertical, PenIcon, PlusIcon, TrashIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from "sonner";
import DeleteModal from "../../../../components/custom-modals/delete-modal";
import { RecurrenceDaysCell, RecurrencePatternCell } from "./component/recurring-patterns";


export default function TrainingsPage() {
  const router = useRouter()
  const instructor = useInstructor();
  const [openAddClass, setOpenAddClass] = useState(false)

  const { data, isFetching, isLoading, isFetched } = useQuery(getClassDefinitionsForInstructorOptions({ path: { instructorUuid: instructor?.uuid as string }, query: { activeOnly: false } }))
  const classes = data?.data

  const [editingClassId, setEditingClassId] = useState<string | null>(null)

  const [scheduleModal, setScheduleModal] = useState(false)
  const openRecurrentSchedule = (id: any) => {
    setEditingClassId(id)
    setScheduleModal(true)
  }


  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState(false)
  const openDeleteModal = (id: any) => {
    setDeleteId(id)
    setDeleteModal(true)
  }
  // const deleteClass = useMutation()
  const confirmDelete = () => {
    toast.message(`implmenet function to delete ${deleteId}`)
  }

  return (
    <div className='space-y-6'>
      <div className='mb-6 flex items-end justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>Your Classes</h1>
          <p className='text-muted-foreground mt-1 text-base'>
            You have {classes?.length} classes
          </p>
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

      {classes?.length === 0 && !isFetching ? (
        <div className='bg-muted/20 rounded-md border py-12 text-center'>
          <FilePenIcon className='text-muted-foreground mx-auto h-12 w-12' />
          <h3 className='mt-4 text-lg font-medium'>No classes found</h3>
          <p className='text-muted-foreground mt-2'>
            You don&apos;t have any classes yet. Start by creating a new class.
          </p>
          <Button onClick={() => router.push('/dashboard/trainings/create-new')} className='mt-4' asChild>
            <div>Create Your First Class</div>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {isLoading ? (
            <div className="col-span-full flex justify-center items-center py-6">
              <Spinner />
            </div>
          ) : (
            classes?.map((cl: any) => (
              <div
                key={cl.uuid}
                className="relative rounded-lg border bg-white p-5 min-h-[250px] shadow-sm transition hover:shadow-md"
              >
                {/* Actions dropdown */}
                <div className="absolute right-2 top-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Open menu">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/dashboard/trainings/preview/${cl.uuid}`}
                          className="flex w-full items-center"
                        >
                          <EyeIcon className="mr-2 h-4 w-4" />
                          Preview
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <div
                          onClick={() =>
                            router.push(`/dashboard/trainings/create-new?id=${cl.uuid}`)
                          }
                          className="flex w-full items-center"
                        >
                          <PenIcon className="mr-2 h-4 w-4" />
                          Edit Class
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="default"
                        onClick={() => openRecurrentSchedule(cl.uuid)}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Schedule Recurring
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => openDeleteModal(cl.uuid)}
                      >
                        <TrashIcon className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Title & description */}
                <h3 className="text-lg font-semibold pr-6">{cl.title}</h3>
                <div className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  <HTMLTextPreview htmlContent={cl?.description as string} />
                </div>

                {/* Class details */}
                <ul className="text-sm space-y-2.5">
                  <li>
                    <strong>📅 Days:</strong>{' '}
                    <RecurrenceDaysCell recurrenceUuid={cl.recurrence_pattern_uuid} />
                  </li>
                  <li>
                    <strong>🕒 Time:</strong>{' '}
                    {cl.default_start_time} - {cl.default_end_time}
                  </li>
                  <li>
                    <strong>📍 Location:</strong> {cl.location_type}
                  </li>
                  <li>
                    <strong>🔁 Recurrence:</strong>{' '}
                    <RecurrencePatternCell recurrenceUuid={cl.recurrence_pattern_uuid} />
                  </li>
                  <li>
                    <strong>👥 Participants:</strong>{' '}
                    {cl.max_participants}
                  </li>
                </ul>
              </div>
            ))
          )}
        </div>

      )}

      <ClassDialog
        isOpen={openAddClass}
        setOpen={setOpenAddClass}
        onCancel={() => { setOpenAddClass(false) }}
      />

      <ScheduleDialog
        isOpen={scheduleModal}
        setOpen={setScheduleModal}
        editingClassId={editingClassId as string}
        onCancel={() => setScheduleModal(false)} />

      <DeleteModal
        open={deleteModal}
        setOpen={setDeleteModal}
        title='Delete Class'
        description='Are you sure you want to delete this class? This action cannot be undone.'
        onConfirm={confirmDelete}
        // isLoading={deleteClass.isPending}
        confirmText='Delete Class'
      />
    </div>
  );
}
