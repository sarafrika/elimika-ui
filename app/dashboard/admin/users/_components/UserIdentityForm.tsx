'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useUpdateAdminUser } from '@/services/admin';
import type { User } from '@/services/client';
import { zUser } from '@/services/client/zod.gen';

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

type UserFormValues = z.infer<typeof userFormSchema>;

function toDateInput(value?: Date | string | null): string {
  if (!value) return '';
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
}

function mapUserToForm(user: User): UserFormValues {
  return {
    first_name: user.first_name ?? '',
    middle_name: user.middle_name ?? '',
    last_name: user.last_name ?? '',
    email: user.email ?? '',
    username: user.username ?? '',
    phone_number: user.phone_number ?? '',
    dob: toDateInput(user.dob),
    gender: (user.gender as UserFormValues['gender']) ?? undefined,
    active: Boolean(user.active),
  };
}

export function UserIdentityForm({ user }: { user: User }) {
  const router = useRouter();
  const updateUser = useUpdateAdminUser();
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: mapUserToForm(user),
    mode: 'onBlur',
  });

  const onSubmit = (values: UserFormValues) => {
    if (!user.uuid) return;
    updateUser.mutate(
      {
        path: { uuid: user.uuid },
        body: {
          ...user,
          ...values,
          middle_name: values.middle_name || undefined,
          dob: values.dob ? new Date(values.dob) : user.dob,
        } as User,
      },
      {
        onSuccess: () => {
          toast.success('User updated successfully');
          router.refresh();
        },
        onError: error => {
          toast.error(error instanceof Error ? error.message : 'Failed to update user');
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form className='space-y-6' onSubmit={form.handleSubmit(onSubmit)}>
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
                  <Input placeholder='Optional' {...field} value={field.value ?? ''} />
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
                  <Input placeholder='+254712345678' {...field} value={field.value ?? ''} />
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
                <Select
                  value={field.value ?? 'UNSPECIFIED'}
                  onValueChange={value => field.onChange(value === 'UNSPECIFIED' ? undefined : value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select gender' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='UNSPECIFIED'>Not specified</SelectItem>
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
            <FormItem className='flex flex-row items-center justify-between rounded-md border border-border/70 bg-muted/30 p-4'>
              <div className='space-y-0.5'>
                <FormLabel>Account status</FormLabel>
                <p className='text-xs text-muted-foreground'>
                  Toggle to immediately enable or disable user access.
                </p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type='submit' disabled={updateUser.isPending}>
          {updateUser.isPending ? <Loader2 className='size-4 animate-spin' /> : null}
          Save changes
        </Button>
      </form>
    </Form>
  );
}
