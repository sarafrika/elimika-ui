'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { Check, CircleCheck, Filter, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';
import { useStudentsByIds, useUsersWithContactByIds } from '@/hooks/use-batched-lookups';
import { buildSocialShareUrl, openShareWindow } from '@/lib/share';
import { cn } from '@/lib/utils';
import type { Enrollment } from '@/services/client';

const filters = [
  { value: 'all', label: 'All' },
  { value: 'enrolled', label: 'Enrolled' },
  { value: 'not_enrolled', label: 'Not enrolled' },
] as const;

type InviteStudentsSheetContentProps = {
  studentUuids: string[];
  enrollments: Enrollment[];
  loading: boolean;
  title: string;
  registrationLink: string;
};

export function InviteStudentsSheetContent({
  studentUuids,
  enrollments,
  loading,
  title,
  registrationLink,
}: InviteStudentsSheetContentProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<(typeof filters)[number]['value']>('all');
  const [selectedStudentUuids, setSelectedStudentUuids] = useState<string[]>([]);
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const { studentMap, isLoading: studentsLoading } = useStudentsByIds(studentUuids);

  const classEnrolledSet = useMemo(
    () =>
      new Set(
        enrollments
          .filter(
            enrollment =>
              enrollment.is_active !== false &&
              enrollment.status !== 'CANCELLED' &&
              enrollment.status !== 'WAITLISTED'
          )
          .map(enrollment => enrollment.student_uuid)
      ),
    [enrollments]
  );

  const students = useMemo(
    () =>
      studentUuids
        .flatMap(uuid => {
          const student = studentMap[uuid];
          return student ? [{ ...student, uuid }] : [];
        })
        .sort((a, b) => (a.full_name ?? '').localeCompare(b.full_name ?? '')),
    [studentUuids, studentMap]
  );

  const selectedStudents = useMemo(
    () =>
      students.filter(
        student =>
          selectedStudentUuids.includes(student.uuid) && !classEnrolledSet.has(student.uuid)
      ),
    [students, selectedStudentUuids, classEnrolledSet]
  );
  // The directory projection has no email addresses. Resolve full contacts only
  // for the selected recipients, using the same contact lookup as the roster.
  const selectedUserUuids = useMemo(
    () => selectedStudents.map(student => student.user_uuid).filter(Boolean),
    [selectedStudents]
  );
  const { userMap, isLoading: contactsLoading } = useUsersWithContactByIds(selectedUserUuids);
  const recipients = useMemo(
    () => [
      ...new Set(
        selectedStudents.flatMap(student => {
          const email = userMap[student.user_uuid]?.email?.trim();
          return email ? [email] : [];
        })
      ),
    ],
    [selectedStudents, userMap]
  );
  const missingContacts = selectedStudents.some(
    student => !userMap[student.user_uuid]?.email?.trim()
  );

  const filteredStudents = useMemo(
    () =>
      students.filter(student => {
        const enrolled = classEnrolledSet.has(student.uuid);
        if (filter === 'enrolled' && !enrolled) return false;
        if (filter === 'not_enrolled' && enrolled) return false;
        return !deferredSearch || student.full_name?.toLowerCase().includes(deferredSearch);
      }),
    [students, classEnrolledSet, filter, deferredSearch]
  );

  const isLoading = loading || studentsLoading;
  const canInvite =
    !isLoading &&
    !contactsLoading &&
    !missingContacts &&
    recipients.length > 0 &&
    Boolean(registrationLink);

  const handleInvite = () => {
    if (!canInvite) return;
    openShareWindow(
      buildSocialShareUrl('email', {
        title,
        description: `You're invited to join my live class: ${title}`,
        url: registrationLink,
        recipients,
      })
    );
  };

  return (
    <>
      <div className='flex-1 overflow-y-auto px-3'>
        <h3 className='mb-3 text-sm font-medium'>Select students</h3>
        <div className='mb-3 flex gap-2'>
          <Input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder='Search students...'
            aria-label='Search students'
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='sm'>
                <Filter className='size-4' />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='w-48' align='end'>
              {filters.map(item => (
                <DropdownMenuItem
                  key={item.value}
                  onClick={() => setFilter(item.value)}
                  className={cn(
                    'flex items-center justify-between',
                    filter === item.value && 'bg-muted font-medium'
                  )}
                >
                  {item.label}
                  {filter === item.value && <Check className='size-4' />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isLoading ? (
          <div role='status' className='text-muted-foreground flex items-center gap-2 py-6 text-sm'>
            <Spinner /> Loading your students...
          </div>
        ) : students.length === 0 && studentUuids.length > 0 ? (
          <EmptyState
            variant='compact'
            title='Unable to load your students'
            description='Close the sheet and try again.'
          />
        ) : filteredStudents.length === 0 ? (
          <EmptyState
            icon={Users}
            variant='compact'
            title={students.length ? 'No matching students' : 'No students to invite'}
            description={
              students.length
                ? 'Try another search or filter.'
                : 'Students enrolled in your active classes will appear here.'
            }
          />
        ) : (
          <div className='space-y-2'>
            {filteredStudents.map(student => {
              const enrolled = classEnrolledSet.has(student.uuid);
              const selected = !enrolled && selectedStudentUuids.includes(student.uuid);
              return (
                <Button
                  key={student.uuid}
                  type='button'
                  variant='outline'
                  aria-pressed={selected}
                  disabled={enrolled}
                  onClick={() =>
                    setSelectedStudentUuids(current =>
                      current.includes(student.uuid)
                        ? current.filter(uuid => uuid !== student.uuid)
                        : [...current, student.uuid]
                    )
                  }
                  className={cn(
                    'h-auto w-full justify-between rounded-lg p-3 text-left',
                    selected && 'border-primary bg-primary/5'
                  )}
                >
                  <span className='min-w-0 truncate'>{student.full_name || 'Student'}</span>
                  <span className='flex shrink-0 items-center gap-2'>
                    {enrolled && (
                      <span className='bg-primary/10 text-primary rounded px-2 py-0.5 text-[12px]'>
                        Enrolled
                      </span>
                    )}
                    {selected && <CircleCheck className='text-primary size-5' />}
                  </span>
                </Button>
              );
            })}
          </div>
        )}
      </div>

      <div className='bg-background space-y-3 border-t p-4'>
        <p className='text-muted-foreground text-sm'>
          Opens your email app with the class invite link addressed to the selected students.
        </p>
        {!contactsLoading && missingContacts && (
          <p role='alert' className='text-destructive text-sm'>
            Email addresses could not be loaded for{' '}
            {selectedStudents
              .filter(student => !userMap[student.user_uuid]?.email?.trim())
              .map(student => student.full_name || 'Student')
              .join(', ')}
            . Deselect them to continue.
          </p>
        )}
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <p className='text-muted-foreground text-sm'>{selectedStudents.length} selected</p>
          <Button disabled={!canInvite} onClick={handleInvite}>
            {contactsLoading && <Spinner />}
            Send invite{selectedStudents.length > 0 ? ` (${selectedStudents.length})` : ''}
          </Button>
        </div>
      </div>
    </>
  );
}
