'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, UserPlus, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { extractList } from '@/lib/api-helpers';
import { STALE_TIMES } from '@/lib/query-client';
import type { StudentGroup, StudentGroupMember, User } from '@/services/client';
import {
  addMembersMutation,
  getUsersByOrganisationAndDomainOptions,
  listGroupsQueryKey,
  listMembersOptions,
  listMembersQueryKey,
  removeMemberMutation,
} from '@/services/client/@tanstack/react-query.gen';

const initials = (user?: User) =>
  user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() ||
      (user.email?.[0] ?? '?').toUpperCase()
    : '?';

const fullName = (user?: User) =>
  user
    ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email || 'Student'
    : 'Student';

type GroupMembersSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organisationUuid: string;
  group: StudentGroup | null;
};

/**
 * Roster management for one academic group. Ported from the organisation Groups
 * page, which is losing its member UI. The picker derives `existing` from the
 * live membership query — the previous implementation passed a hardcoded empty
 * set, so students already in the group were offered for adding again.
 */
export function GroupMembersSheet({
  open,
  onOpenChange,
  organisationUuid,
  group,
}: GroupMembersSheetProps) {
  const queryClient = useQueryClient();
  const groupUuid = group?.uuid ?? '';

  const [selected, setSelected] = useState<string[]>([]);
  const [pendingRemoval, setPendingRemoval] = useState<StudentGroupMember | null>(null);

  const membersQuery = useQuery({
    ...listMembersOptions({ path: { groupUuid } }),
    enabled: open && Boolean(groupUuid),
    staleTime: STALE_TIMES.live,
  });

  const studentsQuery = useQuery({
    ...getUsersByOrganisationAndDomainOptions({
      path: { uuid: organisationUuid, domainName: 'student' },
    }),
    enabled: open && Boolean(organisationUuid),
    staleTime: STALE_TIMES.entity,
  });

  const members = extractList<StudentGroupMember>(membersQuery.data);
  const students = extractList<User>(studentsQuery.data);

  const studentsByUuid = useMemo(() => {
    const map = new Map<string, User>();
    for (const student of students) {
      if (student.uuid) map.set(student.uuid, student);
    }
    return map;
  }, [students]);

  const existing = useMemo(
    () =>
      new Set(
        members.map(member => member.student_uuid).filter((uuid): uuid is string => Boolean(uuid))
      ),
    [members]
  );

  const addableStudents = useMemo(
    () => students.filter(student => student.uuid && !existing.has(student.uuid)),
    [students, existing]
  );

  const addMembers = useMutation(addMembersMutation());
  const removeMember = useMutation(removeMemberMutation());

  const refreshRoster = async () => {
    await queryClient.invalidateQueries({ queryKey: listMembersQueryKey({ path: { groupUuid } }) });
    await queryClient.invalidateQueries({
      queryKey: listGroupsQueryKey({ path: { organisationUuid } }),
    });
  };

  const toggle = (uuid: string) =>
    setSelected(current =>
      current.includes(uuid) ? current.filter(value => value !== uuid) : [...current, uuid]
    );

  const handleAdd = async () => {
    if (selected.length === 0 || !groupUuid) return;

    try {
      await addMembers.mutateAsync({
        path: { groupUuid },
        body: { student_uuids: selected },
      });
      toast.success(`${selected.length} student${selected.length === 1 ? '' : 's'} added`);
      setSelected([]);
      await refreshRoster();
    } catch {
      toast.error('Could not add those students.');
    }
  };

  const handleRemove = async () => {
    const studentUuid = pendingRemoval?.student_uuid;
    if (!studentUuid || !groupUuid) return;

    try {
      await removeMember.mutateAsync({ path: { groupUuid, studentUuid } });
      toast.success('Removed from group', {
        description: fullName(studentsByUuid.get(studentUuid)),
      });
      await refreshRoster();
    } catch {
      toast.error('Could not remove that student.');
    } finally {
      setPendingRemoval(null);
    }
  };

  const capacity = group?.capacity ?? null;
  const overCapacity = capacity != null && capacity > 0 && members.length > capacity;

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={next => {
          onOpenChange(next);
          if (!next) setSelected([]);
        }}
      >
        <SheetContent className='w-full gap-0 sm:max-w-lg'>
          <SheetHeader className='px-6 pt-6'>
            <SheetTitle className='flex items-center gap-2'>
              <Users className='text-primary h-5 w-5' />
              {group?.name || 'Group members'}
            </SheetTitle>
            <SheetDescription>
              {[group?.branch_name, group?.tier].filter(Boolean).join(' · ') ||
                'Manage who belongs to this group.'}
            </SheetDescription>
            <div className='flex flex-wrap items-center gap-2 pt-1'>
              <Badge variant={overCapacity ? 'warning' : 'secondary'}>
                {members.length}
                {capacity != null && capacity > 0 ? `/${capacity}` : ''} enrolled
              </Badge>
              {overCapacity ? (
                <span className='text-muted-foreground text-xs'>
                  Over the intended size — advisory only, nothing is blocked.
                </span>
              ) : null}
            </div>
          </SheetHeader>

          <div className='flex-1 space-y-5 overflow-y-auto px-6 py-5'>
            <section className='space-y-2'>
              <h3 className='text-foreground text-sm font-semibold'>Current members</h3>
              {membersQuery.isLoading ? (
                <div className='space-y-2'>
                  {[...Array(3)].map((_, index) => (
                    <Skeleton key={index} className='h-11 w-full' />
                  ))}
                </div>
              ) : members.length === 0 ? (
                <p className='text-muted-foreground border-border/70 rounded-md border border-dashed py-6 text-center text-sm'>
                  No students in this group yet.
                </p>
              ) : (
                <div className='space-y-1'>
                  {members.map(member => {
                    const student = studentsByUuid.get(member.student_uuid ?? '');
                    return (
                      <div
                        key={member.uuid ?? member.student_uuid}
                        className='border-border/70 flex items-center gap-3 rounded-md border p-2'
                      >
                        <Avatar className='h-7 w-7'>
                          <AvatarFallback className='bg-primary/10 text-primary text-[10px] font-semibold'>
                            {initials(student)}
                          </AvatarFallback>
                        </Avatar>
                        <span className='flex-1 truncate text-sm font-medium'>
                          {fullName(student)}
                        </span>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-7 w-7'
                          onClick={() => setPendingRemoval(member)}
                          aria-label={`Remove ${fullName(student)}`}
                        >
                          <Trash2 className='text-muted-foreground h-4 w-4' />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <Separator />

            <section className='space-y-2'>
              <div className='flex items-center justify-between gap-2'>
                <h3 className='text-foreground text-sm font-semibold'>Add students</h3>
                <Button
                  size='sm'
                  onClick={() => void handleAdd()}
                  disabled={selected.length === 0 || addMembers.isPending}
                >
                  <UserPlus className='mr-1.5 h-4 w-4' />
                  {addMembers.isPending ? 'Adding…' : `Add${selected.length ? ` ${selected.length}` : ''}`}
                </Button>
              </div>

              {studentsQuery.isLoading || membersQuery.isLoading ? (
                <div className='space-y-2'>
                  {[...Array(4)].map((_, index) => (
                    <Skeleton key={index} className='h-10 w-full' />
                  ))}
                </div>
              ) : addableStudents.length === 0 ? (
                <p className='text-muted-foreground border-border/70 rounded-md border border-dashed py-6 text-center text-sm'>
                  Every student in this organisation is already in this group.
                </p>
              ) : (
                <ScrollArea className='h-[280px] pr-3'>
                  <div className='space-y-1'>
                    {addableStudents.map(student => {
                      const uuid = student.uuid as string;
                      const isSelected = selected.includes(uuid);
                      return (
                        <label
                          key={uuid}
                          className={`flex cursor-pointer items-center gap-3 rounded-md border p-2.5 transition-colors ${
                            isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                          }`}
                        >
                          <Checkbox checked={isSelected} onCheckedChange={() => toggle(uuid)} />
                          <Avatar className='h-7 w-7'>
                            <AvatarFallback className='bg-primary/10 text-primary text-[10px] font-semibold'>
                              {initials(student)}
                            </AvatarFallback>
                          </Avatar>
                          <span className='truncate text-sm font-medium'>{fullName(student)}</span>
                        </label>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </section>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={Boolean(pendingRemoval)}
        onOpenChange={next => {
          if (!next) setPendingRemoval(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this student from the group?</AlertDialogTitle>
            <AlertDialogDescription>
              {fullName(studentsByUuid.get(pendingRemoval?.student_uuid ?? ''))} keeps their account
              and enrolments — only the group membership is removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMember.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={event => {
                event.preventDefault();
                void handleRemove();
              }}
              disabled={removeMember.isPending}
            >
              {removeMember.isPending ? 'Removing…' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
