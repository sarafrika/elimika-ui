'use client';

import { AdminDataTable } from '@/components/admin/data-table/data-table';
import { AdminDataTableColumn } from '@/components/admin/data-table/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import {
  AdminUser,
  useAdminUsers,
  useUpdateAdminUser,
} from '@/services/admin';
import { zUser } from '@/services/client/zod.gen';
import { format } from 'date-fns';
import { CheckCircle2, Loader2, ShieldAlert, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

const userFormSchema = z.object({
  first_name: zUser.shape.first_name,
  middle_name: zUser.shape.middle_name.optional(),
  last_name: zUser.shape.last_name,
  email: zUser.shape.email,
  username: zUser.shape.username,
  phone_number: zUser.shape.phone_number,
  dob: zUser.shape.dob,
  gender: zUser.shape.gender.optional(),
  active: zUser.shape.active,
});

const statusFilterOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active only', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

const domainFilterOptions = [
  { label: 'All domains', value: 'all' },
  { label: 'Students', value: 'student' },
  { label: 'Instructors', value: 'instructor' },
  { label: 'Course creators', value: 'course_creator' },
  { label: 'Administrators', value: 'admin' },
  { label: 'Organisation users', value: 'organisation_user' },
];

export default function AdminUsersPage() {
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [domainFilter, setDomainFilter] = useState('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { data, isLoading } = useAdminUsers({
    page,
    size: 20,
    search: searchQuery,
    status: statusFilter,
    domain: domainFilter,
  });

  const users = useMemo(() => data?.items ?? [], [data?.items]);
  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 0;

  useEffect(() => {
    if (!selectedUserId && users.length > 0) {
      setSelectedUserId(users[0]?.uuid ?? null);
    }
  }, [selectedUserId, users]);

  useEffect(() => {
    if (page >= (data?.totalPages ?? 0)) {
      setPage(0);
    }
  }, [data?.totalPages, page]);

  const selectedUser = users.find(user => user.uuid === selectedUserId) ?? null;

  const columns: AdminDataTableColumn<AdminUser>[] = useMemo(
    () => [
      {
        id: 'user',
        header: 'User',
        className: 'min-w-[220px]'
,
        cell: user => (
          <div className='flex items-start gap-3'>
            <Avatar className='h-9 w-9'>
              <AvatarFallback>
                {user.first_name?.[0]}
                {user.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className='space-y-1'>
              <div className='font-semibold leading-tight'>{`${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()}</div>
              <div className='text-muted-foreground text-sm'>{user.email}</div>
            </div>
          </div>
        ),
      },
      {
        id: 'username',
        header: 'Username',
        className: 'hidden md:table-cell',
        cell: user => <span className='font-medium text-sm'>{user.username}</span>,
      },
      {
        id: 'status',
        header: 'Status',
        className: 'hidden sm:table-cell',
        cell: user => (
          <Badge variant={user.active ? 'default' : 'secondary'}>{user.active ? 'Active' : 'Inactive'}</Badge>
        ),
      },
      {
        id: 'domains',
        header: 'Domains',
        className: 'hidden lg:table-cell',
        cell: user => (
          <div className='flex flex-wrap gap-1'>
            {(Array.isArray(user.user_domain) ? user.user_domain : user.user_domain ? [user.user_domain] : []).map(domain => (
              <Badge key={domain} variant='outline' className='uppercase text-xs'>
                {String(domain).replace(/_/g, ' ')}
              </Badge>
            ))}
            {!user.user_domain || (Array.isArray(user.user_domain) && user.user_domain.length === 0) ? (
              <span className='text-muted-foreground text-xs'>No domain</span>
            ) : null}
          </div>
        ),
      },
      {
        id: 'created',
        header: 'Created',
        className: 'hidden xl:table-cell text-muted-foreground',
        cell: user => (
          <span className='text-sm'>
            {user.created_date ? format(new Date(user.created_date), 'dd MMM yyyy') : '—'}
          </span>
        ),
      },
    ],
    []
  );

  const activeUsers = useMemo(() => users.filter(user => user.active).length, [users]);
  const recentlyAdded = useMemo(() => {
    return users
      .slice()
      .sort((a, b) => {
        const aTime = a.created_date ? new Date(a.created_date).getTime() : 0;
        const bTime = b.created_date ? new Date(b.created_date).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 1)
      .map(user => ({
        name: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim(),
        created: user.created_date ? format(new Date(user.created_date), 'dd MMM yyyy') : '—',
      }))[0];
  }, [users]);

  return (
    <div className='mx-auto flex w-full max-w-7xl xl:max-w-[110rem] 2xl:max-w-[130rem] flex-col gap-6 px-4 py-10 2xl:px-10'>
      <div className='relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-sm'>
        <div className='flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
          <div className='space-y-2'>
            <Badge variant='outline' className='border-border/60 bg-muted/80 text-xs font-semibold uppercase tracking-wide'>
              Admin workspace
            </Badge>
            <h1 className='text-3xl font-semibold tracking-tight'>Manage users</h1>
            <p className='text-muted-foreground max-w-2xl text-sm'>
              Audit platform accounts, update key profile details, and manage domain permissions from a unified moderation hub.
            </p>
          </div>
          <div className='grid gap-3 sm:grid-cols-2'>
            <MetricCard
              icon={<Users className='h-5 w-5 text-primary' />}
              label='Total records in view'
              value={totalItems}
            />
            <MetricCard
              icon={<CheckCircle2 className='h-5 w-5 text-emerald-500' />}
              label='Active profiles'
              value={activeUsers}
            />
          </div>
        </div>
        {recentlyAdded ? (
          <div className='mt-6 rounded-xl border border-dashed border-border/60 bg-muted/40 px-4 py-3 text-sm'>
            <span className='font-medium'>Latest addition:</span> {recentlyAdded.name || 'Unknown'} · {recentlyAdded.created}
          </div>
        ) : null}
      </div>

      <AdminDataTable
        title='User directory'
        description='Search across domains, toggle account activity, and open a record to view profile metadata.'
        columns={columns}
        data={users}
        getRowId={user => user.uuid ?? user.username ?? ''}
        selectedId={selectedUserId}
        onRowClick={user => {
          setSelectedUserId(user.uuid ?? null);
          setIsSheetOpen(true);
        }}
        isLoading={isLoading}
        search={{
          value: searchQuery,
          onChange: value => {
            setSearchQuery(value);
            setPage(0);
          },
          onReset: () => {
            setSearchQuery('');
            setStatusFilter('all');
            setDomainFilter('all');
            setPage(0);
          },
          placeholder: 'Search by name, email, or username…',
        }}
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: statusFilter,
            onValueChange: value => {
              setStatusFilter((value as 'all' | 'active' | 'inactive') || 'all');
              setPage(0);
            },
            options: statusFilterOptions,
          },
          {
            id: 'domain',
            label: 'Domain',
            value: domainFilter,
            onValueChange: value => {
              setDomainFilter(value || 'all');
              setPage(0);
            },
            options: domainFilterOptions,
          },
        ]}
        pagination={{
          page,
          pageSize: 20,
          totalItems,
          totalPages: totalPages || 1,
          onPageChange: nextPage => setPage(nextPage),
        }}
        emptyState={{
          title: 'No users match your filters',
          description: 'Adjust search or filters to discover additional platform accounts.',
          icon: <ShieldAlert className='h-10 w-10' />,
        }}
      />

      <UserDetailSheet
        user={selectedUser}
        open={isSheetOpen && Boolean(selectedUser)}
        onOpenChange={setIsSheetOpen}
      />
    </div>
  );
}

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserDetailSheetProps {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function UserDetailSheet({ user, open, onOpenChange }: UserDetailSheetProps) {
  const updateUser = useUpdateAdminUser();

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: user ? mapUserToForm(user) : undefined,
    mode: 'onBlur',
  });

  useEffect(() => {
    form.reset(user ? mapUserToForm(user) : undefined);
  }, [user, form]);

  const handleSubmit = (values: UserFormValues) => {
    if (!user?.uuid) return;

    updateUser.mutate(
      {
        path: { uuid: user.uuid },
        body: {
          ...user,
          ...values,
          middle_name: values.middle_name || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('User updated successfully');
          onOpenChange(false);
        },
        onError: error => {
          toast.error(error instanceof Error ? error.message : 'Failed to update user');
        },
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full max-w-xl border-l'>
        <SheetHeader>
          <SheetTitle>Review user details</SheetTitle>
          <SheetDescription>Manage identity fields, toggle account activity, and record compliance notes.</SheetDescription>
        </SheetHeader>
        {user ? (
          <ScrollArea className='mt-4 flex-1 pr-3'>
            <Form {...form}>
              <form className='space-y-6 pb-6' onSubmit={form.handleSubmit(handleSubmit)}>
                <div className='grid gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='first_name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First name</FormLabel>
                        <FormControl>
                          <Input placeholder='Jane' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='last_name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last name</FormLabel>
                        <FormControl>
                          <Input placeholder='Doe' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='middle_name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Middle name</FormLabel>
                        <FormControl>
                          <Input placeholder='Optional' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='email'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type='email' placeholder='jane@example.com' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='username'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder='janedoe' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='phone_number'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone number</FormLabel>
                        <FormControl>
                          <Input placeholder='+254712345678' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='dob'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of birth</FormLabel>
                        <FormControl>
                          <Input type='date' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='gender'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <FormControl>
                          <Select value={field.value ?? ''} onValueChange={value => field.onChange(value || undefined)}>
                            <SelectTrigger>
                              <SelectValue placeholder='Select gender' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value=''>Not specified</SelectItem>
                              <SelectItem value='MALE'>Male</SelectItem>
                              <SelectItem value='FEMALE'>Female</SelectItem>
                              <SelectItem value='OTHER'>Other</SelectItem>
                              <SelectItem value='PREFER_NOT_TO_SAY'>Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='active'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                      <div className='space-y-0.5'>
                        <FormLabel>Account status</FormLabel>
                        <p className='text-muted-foreground text-sm'>Toggle to immediately enable or disable user access.</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className='rounded-lg border bg-muted/40 p-4 text-xs text-muted-foreground'>
                  <div className='grid gap-2 sm:grid-cols-2'>
                    <div>
                      <span className='font-medium text-foreground'>Created:</span>{' '}
                      {user.created_date ? format(new Date(user.created_date), 'dd MMM yyyy, HH:mm') : '—'}
                    </div>
                    <div>
                      <span className='font-medium text-foreground'>Updated:</span>{' '}
                      {user.updated_date ? format(new Date(user.updated_date), 'dd MMM yyyy, HH:mm') : '—'}
                    </div>
                    <div>
                      <span className='font-medium text-foreground'>Domains:</span>{' '}
                      {(Array.isArray(user.user_domain) ? user.user_domain : user.user_domain ? [user.user_domain] : [])
                        .map(domain => domain.toString().replace(/_/g, ' '))
                        .join(', ') || '—'}
                    </div>
                    <div>
                      <span className='font-medium text-foreground'>UUID:</span> {user.uuid}
                    </div>
                  </div>
                </div>

                <SheetFooter>
                  <Button type='submit' disabled={updateUser.isPending} className='w-full sm:w-auto'>
                    {updateUser.isPending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
                    Save changes
                  </Button>
                </SheetFooter>
              </form>
            </Form>
          </ScrollArea>
        ) : (
          <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>Select a user to manage details.</div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function mapUserToForm(user: AdminUser): UserFormValues {
  return {
    first_name: user.first_name ?? '',
    middle_name: user.middle_name ?? '',
    last_name: user.last_name ?? '',
    email: user.email ?? '',
    username: user.username ?? '',
    phone_number: user.phone_number ?? '',
    dob: user.dob ?? '',
    gender: (user.gender as UserFormValues['gender']) ?? undefined,
    active: Boolean(user.active),
  };
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
}

function MetricCard({ icon, label, value }: MetricCardProps) {
  return (
    <Card className='bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <CardContent className='flex items-center gap-3 p-4'>
        <div className='rounded-full bg-primary/10 p-2'>{icon}</div>
        <div>
          <p className='text-muted-foreground text-xs font-medium uppercase tracking-wide'>{label}</p>
          <p className='text-foreground text-xl font-semibold'>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
