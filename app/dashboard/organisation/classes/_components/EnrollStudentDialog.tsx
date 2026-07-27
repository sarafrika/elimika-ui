'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2, Search, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { STALE_TIMES } from '@/lib/query-client';
import type { Student } from '@/services/client';
import {
  enrollStudentMutation,
  searchStudentsOptions,
} from '@/services/client/@tanstack/react-query.gen';

/** Search registered students and enroll one into an assigned class. */
export function EnrollStudentDialog({
  classDefinitionUuid,
  classTitle,
}: {
  classDefinitionUuid: string;
  classTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const studentsQuery = useQuery({
    ...searchStudentsOptions({
      query: {
        searchParams: query.trim() ? { full_name_like: query.trim() } : {},
        pageable: { page: 0, size: 20 },
      },
    }),
    enabled: open,
    staleTime: STALE_TIMES.reference,
  });

  const enroll = useMutation({
    ...enrollStudentMutation(),
    onSuccess: () => {
      toast.success('Student enrolled.');
      setOpen(false);
      setQuery('');
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Unable to enroll student.');
    },
  });

  const students = (studentsQuery.data?.content ?? []) as Student[];

  return (
    <>
      <Button size='sm' variant='outline' onClick={() => setOpen(true)}>
        <UserPlus className='mr-2 size-4' />
        Add student
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add student</DialogTitle>
            <DialogDescription>
              Enroll a registered student into “{classTitle}”.
            </DialogDescription>
          </DialogHeader>
          <div className='relative'>
            <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
            <Input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder='Search students by name…'
              className='pl-9'
            />
          </div>
          <div className='max-h-72 space-y-1 overflow-y-auto'>
            {studentsQuery.isLoading ? (
              <p className='py-4 text-center text-sm text-muted-foreground'>Loading…</p>
            ) : students.length === 0 ? (
              <p className='py-4 text-center text-sm text-muted-foreground'>No students found.</p>
            ) : (
              students.map(student => (
                <div
                  key={student.uuid}
                  className='flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2'
                >
                  <span className='truncate text-sm text-foreground'>
                    {student.full_name ?? 'Unnamed student'}
                  </span>
                  <Button
                    size='sm'
                    disabled={enroll.isPending || !student.uuid}
                    onClick={() =>
                      student.uuid &&
                      enroll.mutate({
                        body: {
                          class_definition_uuid: classDefinitionUuid,
                          student_uuid: student.uuid,
                        },
                      })
                    }
                  >
                    {enroll.isPending ? <Loader2 className='size-4 animate-spin' /> : 'Enroll'}
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
