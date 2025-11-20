'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  type AdminUser,
  useUpdateAdminUser,
} from '@/services/admin';
import { getAllUsersOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { zUser } from '@/services/client/zod.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
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

export type UserFormValues = z.infer<typeof userFormSchema>;

export interface AdminUserWorkspaceProps {
  title: string;
  fixedDomain?: string;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
}

export function AdminUserWorkspace({
  title,
  fixedDomain,
  emptyStateTitle = 'No records match your filters',
  emptyStateDescription = 'Adjust search terms or filter selections to discover more entries.',
}: AdminUserWorkspaceProps) {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [domainFilter, setDomainFilter] = useState<string>(fixedDomain ?? 'all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    if (fixedDomain) {
      setDomainFilter(fixedDomain);
    }
  }, [fixedDomain]);

  const { data, isLoading } = useQuery(
    getAllUsersOptions({ query: { pageable: { page, size: 20, sort: ['created_date,desc'] } } })
  );

  const users = useMemo(() => (data?.data?.content ?? []) as AdminUser[], [data?.data?.content]);
  const totalPages = Math.max(data?.data?.metadata?.totalPages ?? 1, 1);

  useEffect(() => {
    if (!selectedUserId && users.length > 0) {
      setSelectedUserId(users[0]?.uuid ?? null);
    }
  }, [selectedUserId, users]);

  useEffect(() => {
    if (page >= totalPages) {
      setPage(0);
    }
  }, [totalPages, page]);

  const selectedUser = users.find(user => user.uuid === selectedUserId) ?? null;
  const handleSelectUser = (user: AdminUser | null) => {
    setSelectedUserId(user?.uuid ?? null);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSheetOpen(true);
    }
  };

  return (
    <div className='bg-background flex h-[calc(100vh-120px)] flex-col lg:flex-row'>
      <UserListPanel
        users={users}
        selectedUserId={selectedUserId}
        onSelect={handleSelectUser}
        statusFilter={statusFilter}
        onStatusFilterChange={value => {
          setStatusFilter((value as typeof statusFilter) || 'all');
          setPage(0);
        }}
        domainFilter={domainFilter}
        onDomainFilterChange={value => {
          setDomainFilter(value || 'all');
          setPage(0);
        }}
        showDomainFilter={!fixedDomain}
        isLoading={isLoading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyStateTitle={emptyStateTitle}
        emptyStateDescription={emptyStateDescription}
      />

      <UserDetailsPanel user={selectedUser} panelTitle={title} />

      <UserDetailSheet
        user={selectedUser}
        open={isSheetOpen && Boolean(selectedUser)}
        onOpenChange={setIsSheetOpen}
      />
    </div>
  );
}

interface UserListPanelProps {
  users: AdminUser[];
  selectedUserId: string | null;
  onSelect: (user: AdminUser) => void;
  statusFilter: 'all' | 'active' | 'inactive';
  onStatusFilterChange: (value: string) => void;
  domainFilter: string;
  onDomainFilterChange: (value: string) => void;
  showDomainFilter: boolean;
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  emptyStateTitle: string;
  emptyStateDescription: string;
}

function UserListPanel({
  users,
  selectedUserId,
  onSelect,
  statusFilter,
  onStatusFilterChange,
  domainFilter,
  onDomainFilterChange,
  showDomainFilter,
  isLoading,
  page,
  totalPages,
  onPageChange,
  emptyStateTitle,
  emptyStateDescription,
}: UserListPanelProps) {
  const filteredUsers = users.filter(user => {
    if (statusFilter === 'active' && !user.active) return false;
    if (statusFilter === 'inactive' && user.active) return false;
    if (showDomainFilter && domainFilter !== 'all') {
      const domains = Array.isArray(user.user_domain)
        ? user.user_domain
        : user.user_domain
          ? [user.user_domain]
          : [];
      if (!domains.includes(domainFilter)) {
        return false;
      }
    }
    return true;
  });

  const renderContent = () => {
    if (isLoading) {
      return Array.from({ length: 6 }).map((_, index) => (
        <div key={`skeleton-${index}`} className='border-border/60 animate-pulse rounded-2xl border bg-muted/40 p-4'>
          <div className='h-4 w-1/2 rounded bg-muted' />
          <div className='mt-2 h-3 w-1/3 rounded bg-muted' />
        </div>
      ));
    }

    if (filteredUsers.length === 0) {
      return (
        <div className='flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/30 p-6 text-center'>
          <ShieldAlert className='mb-3 h-10 w-10 text-muted-foreground' />
          <p className='text-sm font-medium'>{emptyStateTitle}</p>
          <p className='text-muted-foreground text-xs'>{emptyStateDescription}</p>
        </div>
      );
    }

    return filteredUsers.map(user => (
      <button
        key={user.uuid ?? user.email}
        type='button'
        className={cn(
          'border-border/60 w-full rounded-2xl border bg-card p-4 text-left transition hover:border-primary/50 hover:bg-primary/5',
          selectedUserId === user.uuid ? 'border-primary bg-primary/5' : undefined
        )}
        onClick={() => onSelect(user)}
      >
        <div className='flex items-start gap-3'>
          <Avatar className='h-10 w-10'>
            <AvatarFallback>
              {user.first_name?.[0]}
              {user.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className='flex-1'>
            <div className='flex items-center justify-between gap-2'>
              <div>
                <p className='font-semibold leading-tight'>{`${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || 'Unnamed user'}</p>
                <p className='text-muted-foreground text-xs'>{user.email}</p>
              </div>
              <Badge variant={user.active ? 'secondary' : 'outline'} className='text-xs'>
                {user.active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className='mt-3 flex flex-wrap gap-1.5'>
              {(Array.isArray(user.user_domain) ? user.user_domain : user.user_domain ? [user.user_domain] : []).map(domain => (
                <Badge key={`${user.uuid}-${domain}`} variant='outline' className='uppercase text-[10px]'>
                  {String(domain).replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
            <p className='text-muted-foreground mt-3 text-xs'>
              Joined {user.created_date ? format(new Date(user.created_date), 'dd MMM yyyy') : '—'}
            </p>
          </div>
        </div>
      </button>
    ));
  };

  return (
    <div className='bg-background flex w-full flex-col border-b lg:w-80 lg:border-r lg:border-b-0'>
      <div className='space-y-2 border-b p-4'>
        <div className='flex flex-col gap-2'>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              {statusFilterOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showDomainFilter ? (
            <Select value={domainFilter} onValueChange={onDomainFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder='Domain' />
              </SelectTrigger>
              <SelectContent>
                {domainFilterOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>
      </div>

      <ScrollArea className='flex-1 px-6 py-4'>
        <div className='flex flex-col gap-4 pb-8'>{renderContent()}</div>
      </ScrollArea>

      <div className='border-border/60 flex items-center justify-between border-t px-6 py-4 text-sm'>
        <Button variant='ghost' size='sm' onClick={() => onPageChange(Math.max(page - 1, 0))} disabled={page === 0}>
          Previous
        </Button>
        <div className='text-muted-foreground'>
          Page {totalPages === 0 ? 0 : page + 1} / {totalPages}
        </div>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => onPageChange(Math.min(page + 1, totalPages - 1))}
          disabled={page + 1 >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

interface UserDetailsPanelProps {
  user: AdminUser | null;
  panelTitle: string;
}

function UserDetailsPanel({ user, panelTitle }: UserDetailsPanelProps) {
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
        },
        onError: error => {
          toast.error(error instanceof Error ? error.message : 'Failed to update user');
        },
      }
    );
  };

  return (
    <div className='hidden flex-1 flex-col bg-card lg:flex'>
      {user ? (
        <>
          <div className='border-b p-6'>
            <h2 className='text-2xl font-semibold'>{panelTitle}</h2>
            <p className='text-muted-foreground text-sm'>Moderate profile details and access</p>
          </div>
          <div className='flex items-start justify-between gap-4 border-b px-6 py-4'>
            <div>
              <p className='text-sm font-semibold'>{`${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()}</p>
              <p className='text-muted-foreground text-xs'>{user.email}</p>
            </div>
            <Badge variant={user.active ? 'secondary' : 'outline'}>{user.active ? 'Active' : 'Inactive'}</Badge>
          </div>
          <div className='flex-1 overflow-y-auto px-6'>
            <UserDetailsForm form={form} onSubmit={handleSubmit} isPending={updateUser.isPending} user={user} />
          </div>
        </>
      ) : (
        <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>
          Select a record from the list to begin a review.
        </div>
      )}
    </div>
  );
}

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
          <SheetDescription>Manage identity info, toggle access, and record compliance notes.</SheetDescription>
        </SheetHeader>
        <ScrollArea className='mt-4 flex-1 pr-3'>
          {user ? (
            <UserDetailsForm form={form} onSubmit={handleSubmit} isPending={updateUser.isPending} user={user} />
          ) : (
            <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>
              Select a user to manage details.
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

interface UserDetailsFormProps {
  form: UseFormReturn<UserFormValues>;
  onSubmit: (values: UserFormValues) => void;
  isPending: boolean;
  user: AdminUser | null;
}

function UserDetailsForm({ form, onSubmit, isPending, user }: UserDetailsFormProps) {
  return (
    <Form {...form}>
      <form className='mt-6 space-y-6 pb-6' onSubmit={form.handleSubmit(onSubmit)}>
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
                <Select value={field.value ?? ''} onValueChange={value => field.onChange(value || undefined)}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select gender' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value=''>Not specified</SelectItem>
                    <SelectItem value='MALE'>Male</SelectItem>
                    <SelectItem value='FEMALE'>Female</SelectItem>
                    <SelectItem value='OTHER'>Other</SelectItem>
                    <SelectItem value='PREFER_NOT_TO_SAY'>Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name='active'
          render={({ field }) => (
            <FormItem className='flex flex-row items-center justify-between rounded-xl border bg-muted/40 p-4'>
              <div className='space-y-0.5'>
                <FormLabel>Account status</FormLabel>
                <p className='text-muted-foreground text-xs'>
                  Toggle to immediately enable or disable user access.
                </p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className='rounded-xl border bg-muted/40 p-4 text-xs text-muted-foreground'>
          <div className='grid gap-2 sm:grid-cols-2'>
            <div>
              <span className='font-medium text-foreground'>Created:</span>{' '}
              {user?.created_date ? format(new Date(user.created_date), 'dd MMM yyyy, HH:mm') : '—'}
            </div>
            <div>
              <span className='font-medium text-foreground'>Updated:</span>{' '}
              {user?.updated_date ? format(new Date(user.updated_date), 'dd MMM yyyy, HH:mm') : '—'}
            </div>
            <div>
              <span className='font-medium text-foreground'>Domains:</span>{' '}
              {(Array.isArray(user?.user_domain) ? user?.user_domain : user?.user_domain ? [user?.user_domain] : [])
                .map(domain => domain?.toString().replace(/_/g, ' '))
                .join(', ') || '—'}
            </div>
            <div>
              <span className='font-medium text-foreground'>UUID:</span> {user?.uuid ?? '—'}
            </div>
          </div>
        </div>

        <Button type='submit' disabled={isPending} className='w-full sm:w-auto'>
          {isPending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
          Save changes
        </Button>
      </form>
    </Form>
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
