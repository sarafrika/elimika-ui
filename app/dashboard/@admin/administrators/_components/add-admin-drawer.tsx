'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { extractPage } from '@/lib/api-helpers';
import { cn } from '@/lib/utils';
import type { AdminUser } from '@/services/admin';
import {
  assignAdminDomainMutation,
  getAdminEligibleUsersOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { ApiResponsePagedDtoUser } from '@/services/client';
import { toast } from 'sonner';

type AddAdminMode = 'existing' | 'new';

const addAdminSchema = z
  .object({
    mode: z.enum(['existing', 'new']).default('existing'),
    email: z.string().email('Enter a valid email address'),
    first_name: z.string().min(1, 'First name is required').optional(),
    last_name: z.string().min(1, 'Last name is required').optional(),
    username: z.string().min(3, 'Username is required').optional(),
    phone_number: z.string().min(7, 'Phone number is required').optional(),
    reason: z.string().max(500, 'Keep the reason under 500 characters').optional(),
    assignment_type: z.enum(['global', 'organization']).default('global'),
  })
  .superRefine((values, ctx) => {
    if (values.mode === 'new') {
      ['first_name', 'last_name', 'username', 'phone_number'].forEach(field => {
        if (!(values as Record<string, unknown>)[field]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field],
            message: 'This field is required for new admins',
          });
        }
      });
    }
  });

type AddAdminFormValues = z.infer<typeof addAdminSchema>;

export function AddAdminDrawer() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const form = useForm<AddAdminFormValues>({
    resolver: zodResolver(addAdminSchema),
    defaultValues: {
      mode: 'existing',
      assignment_type: 'global',
      email: '',
      reason: '',
    },
    mode: 'onChange',
  });

  const eligibleQuery = useQuery({
    ...getAdminEligibleUsersOptions({
      query: {
        pageable: { page: 0, size: 10 },
        search: search || undefined,
      },
    }),
    enabled: (form.watch('mode') === 'existing' && search.length >= 3) || false,
  });

  const eligibleUsers = useMemo(() => {
    const page = extractPage<AdminUser>(eligibleQuery.data as ApiResponsePagedDtoUser | undefined);
    return page.items ?? [];
  }, [eligibleQuery.data]);

  const assignAdmin = useMutation(assignAdminDomainMutation(), {
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: query => Array.isArray(query.queryKey) && query.queryKey[0] === 'getAdminUsers',
      });
      toast.success('Administrator access granted');
      setOpen(false);
      form.reset({
        mode: 'existing',
        email: '',
        reason: '',
        assignment_type: 'global',
      });
    },
    onError: error => {
      const message = (error as any)?.message ?? 'Unable to add administrator';
      toast.error(message);
    },
  });

  const onSubmit = (values: AddAdminFormValues) => {
    if (values.mode === 'existing') {
      const match = eligibleUsers.find(
        user => (user.email ?? '').toLowerCase() === values.email.toLowerCase()
      );

      if (!match?.uuid) {
        toast.error('User not found or not eligible for admin access');
        return;
      }

      assignAdmin.mutate({
        path: { uuid: match.uuid },
        body: {
          domain_name: 'admin',
          assignment_type: values.assignment_type,
          reason: values.reason || 'Added via admin dashboard',
        },
      });
      return;
    }

    toast.error('Admin creation API is not available yet. Use an existing user email instead.');
  };

  const mode = form.watch('mode');

  return (
    <>
      <div className='flex items-center justify-between pb-4'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground'>
            Administrators
          </p>
          <h1 className='text-2xl font-semibold text-foreground'>Admin roster</h1>
        </div>
        <Button onClick={() => setOpen(true)} className='gap-2'>
          <PlusIcon className='h-4 w-4' />
          Add administrator
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className='sm:max-w-xl'>
          <SheetHeader className='space-y-1'>
            <SheetTitle>Add administrator</SheetTitle>
            <SheetDescription>
              Promote an existing user to administrator. Full user creation will be available once the API is ready.
            </SheetDescription>
          </SheetHeader>

          <div className='mt-6 space-y-4'>
            <div className='flex gap-2'>
              {(['existing', 'new'] as AddAdminMode[]).map(option => (
                <button
                  key={option}
                  type='button'
                  onClick={() => form.setValue('mode', option)}
                  className={cn(
                    'flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition',
                    mode === option
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted/60'
                  )}
                >
                  {option === 'existing' ? 'Existing user' : 'New user'}
                </button>
              ))}
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='user@example.com'
                          {...field}
                          onChange={event => {
                            field.onChange(event);
                            setSearch(event.target.value);
                          }}
                          disabled={assignAdmin.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {mode === 'existing' ? (
                  <ExistingUserHelper search={search} users={eligibleUsers} isLoading={eligibleQuery.isFetching} />
                ) : (
                  <>
                    <div className='grid gap-4 sm:grid-cols-2'>
                      <FormField
                        control={form.control}
                        name='first_name'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First name</FormLabel>
                            <FormControl>
                              <Input placeholder='Jane' {...field} disabled={assignAdmin.isPending} />
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
                              <Input placeholder='Doe' {...field} disabled={assignAdmin.isPending} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name='username'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder='jane.doe' {...field} disabled={assignAdmin.isPending} />
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
                            <Input placeholder='+254700000000' {...field} disabled={assignAdmin.isPending} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={form.control}
                  name='assignment_type'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin scope</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={assignAdmin.isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select admin scope' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='global'>System admin</SelectItem>
                          <SelectItem value='organization'>Organization admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='reason'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='Why is this user being granted admin access?'
                          {...field}
                          disabled={assignAdmin.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='flex justify-end gap-2 pt-2'>
                  <Button type='button' variant='outline' onClick={() => setOpen(false)} disabled={assignAdmin.isPending}>
                    Cancel
                  </Button>
                  <Button type='submit' disabled={assignAdmin.isPending}>
                    {assignAdmin.isPending ? 'Saving...' : 'Save administrator'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function ExistingUserHelper({
  search,
  users,
  isLoading,
}: {
  search: string;
  users: AdminUser[];
  isLoading: boolean;
}) {
  if (search.length < 3) {
    return (
      <p className='text-sm text-muted-foreground'>
        Start typing an email to find an existing user to promote.
      </p>
    );
  }

  if (isLoading) {
    return <p className='text-sm text-muted-foreground'>Looking up eligible users…</p>;
  }

  if (users.length === 0) {
    return <p className='text-sm text-destructive'>No eligible users found for that email.</p>;
  }

  return (
    <div className='space-y-2 rounded-xl border border-border bg-muted/40 p-3'>
      <p className='text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground'>
        Eligible users
      </p>
      <div className='space-y-2'>
        {users.map(user => (
          <div
            key={user.uuid}
            className='flex items-center justify-between rounded-lg border border-border/60 bg-card px-3 py-2'
          >
            <div>
              <p className='text-sm font-semibold text-foreground'>
                {(user.full_name as string) ?? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || 'Unnamed user'}
              </p>
              <p className='text-xs text-muted-foreground'>{user.email}</p>
            </div>
            <Badge variant='outline'>Eligible</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
