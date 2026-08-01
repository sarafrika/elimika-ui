// @ts-nocheck -- 1:1 Lovable port; @hey-api generated-client type drift
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Layers, MoreHorizontal, Plus, Trash2, UserPlus, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useOrganisation } from '@/context/organisation-context';
import { extractList, extractPage } from '@/lib/api-helpers';
import type { StudentGroup, StudentGroupMember, User } from '@/services/client';
import {
  addMembersMutation,
  createGroupMutation,
  deleteGroupMutation,
  getUsersByOrganisationAndDomainOptions,
  listGroupsOptions,
  listGroupsQueryKey,
  listMembersOptions,
  listMembersQueryKey,
  removeMemberMutation,
} from '@/services/client/@tanstack/react-query.gen';

const initials = (u?: User) =>
  u
    ? `${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase() ||
      (u.email?.[0] ?? '?').toUpperCase()
    : '?';
const fullName = (u?: User) =>
  u ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email || 'Student' : 'Student';

function CreateGroupDialog({ organisationUuid }: { organisationUuid: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const create = useMutation(createGroupMutation());

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size='sm'>
          <Plus className='mr-2 h-4 w-4' /> New group
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>Create student group</DialogTitle>
          <DialogDescription>Group students into a cohort or stream.</DialogDescription>
        </DialogHeader>
        <form
          className='space-y-4'
          onSubmit={e => {
            e.preventDefault();
            const form = e.currentTarget;
            const name = (form.elements.namedItem('g-name') as HTMLInputElement)?.value.trim();
            const groupType = (form.elements.namedItem('g-type') as HTMLInputElement)?.value.trim();
            const description = (
              form.elements.namedItem('g-desc') as HTMLTextAreaElement
            )?.value.trim();
            if (!name) {
              toast.error('Group name is required.');
              return;
            }
            create.mutate(
              {
                path: { organisationUuid },
                body: {
                  name,
                  group_type: groupType || undefined,
                  description: description || undefined,
                },
              },
              {
                onSuccess: async () => {
                  setOpen(false);
                  toast.success('Group created', { description: name });
                  await qc.invalidateQueries({
                    queryKey: listGroupsQueryKey({ path: { organisationUuid } }),
                  });
                },
                onError: () => toast.error('Could not create group.'),
              }
            );
          }}
        >
          <div className='space-y-2'>
            <Label htmlFor='g-name'>Group name</Label>
            <Input id='g-name' name='g-name' placeholder='e.g. Grade 9 · Stream A' required />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='g-type'>Type / stream (optional)</Label>
            <Input id='g-type' name='g-type' placeholder='e.g. Cohort, Stream, Level' />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='g-desc'>Description (optional)</Label>
            <Textarea id='g-desc' name='g-desc' rows={2} placeholder='What this group is for' />
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type='submit' disabled={create.isPending}>
              {create.isPending ? 'Creating…' : 'Create group'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddMembersDialog({
  organisationUuid,
  groupUuid,
  existing,
}: {
  organisationUuid: string;
  groupUuid: string;
  existing: Set<string>;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const add = useMutation(addMembersMutation());

  const studentsQuery = useQuery({
    ...getUsersByOrganisationAndDomainOptions({
      path: { uuid: organisationUuid, domainName: 'student' },
    }),
    enabled: open && Boolean(organisationUuid),
  });
  const students = extractPage<User>(studentsQuery.data).items.filter(
    s => s.uuid && !existing.has(s.uuid)
  );

  const toggle = (uuid: string) =>
    setSelected(s => (s.includes(uuid) ? s.filter(x => x !== uuid) : [...s, uuid]));

  return (
    <Dialog
      open={open}
      onOpenChange={o => {
        setOpen(o);
        if (!o) setSelected([]);
      }}
    >
      <DialogTrigger asChild>
        <Button size='sm' variant='outline'>
          <UserPlus className='mr-2 h-4 w-4' /> Add students
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>Add students to group</DialogTitle>
          <DialogDescription>Select students to add to this group.</DialogDescription>
        </DialogHeader>
        <ScrollArea className='h-[320px] pr-3'>
          {studentsQuery.isLoading ? (
            <div className='space-y-2'>
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className='h-10 w-full' />
              ))}
            </div>
          ) : students.length === 0 ? (
            <p className='text-muted-foreground py-8 text-center text-sm'>
              No more students to add.
            </p>
          ) : (
            <div className='space-y-1'>
              {students.map(s => (
                <label
                  key={s.uuid}
                  className={`flex cursor-pointer items-center gap-3 rounded-md border p-2.5 transition-colors ${selected.includes(s.uuid) ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                >
                  <input
                    type='checkbox'
                    className='accent-primary h-4 w-4'
                    checked={selected.includes(s.uuid)}
                    onChange={() => toggle(s.uuid)}
                  />
                  <Avatar className='h-7 w-7'>
                    <AvatarFallback className='bg-primary/10 text-primary text-[10px] font-semibold'>
                      {initials(s)}
                    </AvatarFallback>
                  </Avatar>
                  <span className='text-sm font-medium'>{fullName(s)}</span>
                </label>
              ))}
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button type='button' variant='outline' onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={selected.length === 0 || add.isPending}
            onClick={() =>
              add.mutate(
                { path: { groupUuid }, body: { student_uuids: selected } },
                {
                  onSuccess: async () => {
                    setOpen(false);
                    setSelected([]);
                    toast.success(
                      `${selected.length} student${selected.length === 1 ? '' : 's'} added`
                    );
                    await qc.invalidateQueries({
                      queryKey: listMembersQueryKey({ path: { groupUuid } }),
                    });
                    await qc.invalidateQueries({
                      queryKey: listGroupsQueryKey({ path: { organisationUuid } }),
                    });
                  },
                  onError: () => toast.error('Could not add students.'),
                }
              )
            }
          >
            {add.isPending ? 'Adding…' : `Add ${selected.length || ''}`.trim()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GroupMembers({
  organisationUuid,
  groupUuid,
  studentsByUuid,
}: {
  organisationUuid: string;
  groupUuid: string;
  studentsByUuid: Map<string, User>;
}) {
  const qc = useQueryClient();
  const membersQuery = useQuery({ ...listMembersOptions({ path: { groupUuid } }) });
  const members = extractList<StudentGroupMember>(membersQuery.data);
  const remove = useMutation(removeMemberMutation());

  if (membersQuery.isLoading) {
    return (
      <div className='space-y-2'>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className='h-10 w-full' />
        ))}
      </div>
    );
  }
  if (members.length === 0) {
    return (
      <p className='text-muted-foreground py-4 text-center text-sm'>
        No students in this group yet.
      </p>
    );
  }
  return (
    <div className='space-y-1'>
      {members.map(m => {
        const student = studentsByUuid.get(m.student_uuid ?? '');
        return (
          <div key={m.uuid} className='flex items-center gap-3 rounded-md border p-2'>
            <Avatar className='h-7 w-7'>
              <AvatarFallback className='bg-primary/10 text-primary text-[10px] font-semibold'>
                {initials(student)}
              </AvatarFallback>
            </Avatar>
            <span className='flex-1 text-sm font-medium'>{fullName(student)}</span>
            <Button
              variant='ghost'
              size='icon'
              className='h-7 w-7'
              onClick={() =>
                remove.mutate(
                  { path: { groupUuid, studentUuid: m.student_uuid } },
                  {
                    onSuccess: async () => {
                      toast.success('Removed from group', { description: fullName(student) });
                      await qc.invalidateQueries({
                        queryKey: listMembersQueryKey({ path: { groupUuid } }),
                      });
                      await qc.invalidateQueries({
                        queryKey: listGroupsQueryKey({ path: { organisationUuid } }),
                      });
                    },
                    onError: () => toast.error('Could not remove student.'),
                  }
                )
              }
            >
              <Trash2 className='text-muted-foreground h-4 w-4' />
            </Button>
          </div>
        );
      })}
    </div>
  );
}

export default function GroupsPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const qc = useQueryClient();

  const groupsQuery = useQuery({
    ...listGroupsOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });
  const groups = extractList<StudentGroup>(groupsQuery.data);

  const studentsQuery = useQuery({
    ...getUsersByOrganisationAndDomainOptions({
      path: { uuid: organisationUuid, domainName: 'student' },
    }),
    enabled: Boolean(organisationUuid),
  });
  const studentsByUuid = useMemo(() => {
    const map = new Map<string, User>();
    for (const u of extractPage<User>(studentsQuery.data).items) if (u.uuid) map.set(u.uuid, u);
    return map;
  }, [studentsQuery.data]);

  const remove = useMutation(deleteGroupMutation());
  const totalMembers = groups.reduce((a, g) => a + Number(g.member_count ?? 0), 0);

  return (
    <div className='mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]'>
      <PageHeader
        title='Academic Groups'
        description='Organise students into cohorts and streams.'
        action={<CreateGroupDialog organisationUuid={organisationUuid} />}
      />

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <Card className='border-l-primary border-l-4'>
          <CardContent className='p-6'>
            <div className='text-2xl font-bold'>{groups.length}</div>
            <div className='text-muted-foreground text-xs'>Groups</div>
          </CardContent>
        </Card>
        <Card className='border-l-success border-l-4'>
          <CardContent className='p-6'>
            <div className='text-2xl font-bold'>{totalMembers}</div>
            <div className='text-muted-foreground text-xs'>Grouped students</div>
          </CardContent>
        </Card>
        <Card className='border-l-4 border-l-teal-400'>
          <CardContent className='p-6'>
            <div className='text-2xl font-bold'>{studentsByUuid.size}</div>
            <div className='text-muted-foreground text-xs'>Total students</div>
          </CardContent>
        </Card>
      </div>

      {groupsQuery.isLoading ? (
        <div className='space-y-2'>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className='h-16 w-full' />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Layers}
          title='No groups yet'
          description='Create a group to organise students into cohorts or streams.'
        />
      ) : (
        <Accordion type='multiple' className='space-y-2'>
          {groups.map(g => (
            <AccordionItem key={g.uuid} value={g.uuid as string} className='rounded-lg border px-4'>
              <div className='flex items-center gap-2'>
                <AccordionTrigger className='flex-1 hover:no-underline'>
                  <div className='flex min-w-0 items-center gap-3 text-left'>
                    <div className='bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-md'>
                      <Users className='h-4 w-4' />
                    </div>
                    <div className='min-w-0'>
                      <div className='flex items-center gap-2'>
                        <span className='truncate font-medium'>{g.name}</span>
                        {g.group_type && (
                          <Badge variant='outline' className='text-[10px]'>
                            {g.group_type}
                          </Badge>
                        )}
                        <Badge variant='secondary' className='text-[10px]'>
                          {Number(g.member_count ?? 0)} member
                          {Number(g.member_count ?? 0) === 1 ? '' : 's'}
                        </Badge>
                      </div>
                      {g.description && (
                        <p className='text-muted-foreground truncate text-xs'>{g.description}</p>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='icon' className='h-8 w-8 shrink-0'>
                      <MoreHorizontal className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem
                      className='text-destructive focus:text-destructive'
                      onClick={() =>
                        remove.mutate(
                          { path: { groupUuid: g.uuid } },
                          {
                            onSuccess: async () => {
                              toast.success('Group deleted', { description: g.name });
                              await qc.invalidateQueries({
                                queryKey: listGroupsQueryKey({ path: { organisationUuid } }),
                              });
                            },
                            onError: () => toast.error('Could not delete group.'),
                          }
                        )
                      }
                    >
                      <Trash2 className='mr-2 h-4 w-4' /> Delete group
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <AccordionContent className='space-y-3 pb-4'>
                <div className='flex justify-end'>
                  <AddMembersDialog
                    organisationUuid={organisationUuid}
                    groupUuid={g.uuid as string}
                    existing={new Set()}
                  />
                </div>
                <GroupMembers
                  organisationUuid={organisationUuid}
                  groupUuid={g.uuid as string}
                  studentsByUuid={studentsByUuid}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
