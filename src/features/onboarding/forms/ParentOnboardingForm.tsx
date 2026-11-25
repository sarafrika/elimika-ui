'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/ui/spinner';
import { useStudentsByUserIds } from '@/hooks/use-batched-lookups';
import { extractPage } from '@/lib/api-helpers';
import { asRecord, getErrorMessage } from '@/lib/error-utils';
import { STALE_TIMES } from '@/lib/query-client';
import type { GuardianStudentLink, RelationshipTypeEnum2, ShareScopeEnum } from '@/services/client';
import {
  createLinkMutation,
  getCurrentAccountStatusQueryKey,
  searchOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useRefreshSessionIdentity } from '@/src/features/auth/use-refresh-session-identity';
import { buildDashboardSwitchPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { requireApiSuccess } from '@/src/features/onboarding/lib/user-onboarding';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Baby, CheckCircle2, Search, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useMemo, useState } from 'react';
import { z } from 'zod';

const identitySchema = z.object({
  uuid: z.string().uuid(),
  user_uuid: z.string().uuid().optional(),
  full_name: z.string().nullish(),
  first_name: z.string().nullish(),
  last_name: z.string().nullish(),
});
type LearnerIdentity = z.infer<typeof identitySchema>;

function readIdentities(response: unknown): LearnerIdentity[] {
  const envelope = asRecord(response);
  assertApiSuccess(response);
  const payload = asRecord(envelope?.data);
  if (payload) assertApiSuccess(payload);
  return extractPage<unknown>(response).items.flatMap(item => {
    const parsed = identitySchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

function assertApiSuccess(response: unknown) {
  const value = asRecord(response);
  requireApiSuccess({
    error: value?.error,
    success: value?.success === false ? false : undefined,
    message: typeof value?.message === 'string' ? value.message : undefined,
  });
}

function displayName(identity?: LearnerIdentity) {
  return (
    identity?.full_name || [identity?.first_name, identity?.last_name].filter(Boolean).join(' ')
  );
}

export function ParentOnboardingForm() {
  const user = useUserProfile();
  const router = useRouter();
  const queryClient = useQueryClient();
  const refreshIdentity = useRefreshSessionIdentity();
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<LearnerIdentity | null>(null);
  const [relationship, setRelationship] = useState<RelationshipTypeEnum2>('PARENT');
  const [scope, setScope] = useState<ShareScopeEnum>('FULL');
  const [authority, setAuthority] = useState(false);
  const [error, setError] = useState('');
  const [linked, setLinked] = useState<GuardianStudentLink | null>(null);

  // Search names once, then resolve only this page's user ids to student profiles.
  const people = useQuery({
    ...searchOptions({
      query: { searchParams: { q: search, user_domain: 'student' }, pageable: { page, size: 10 } },
    }),
    enabled: !!user?.uuid && search.length >= 2,
    staleTime: STALE_TIMES.entity,
    retry: false,
    select: readIdentities,
  });
  const userIds = useMemo(
    () => (user?.uuid && search.length >= 2 ? (people.data?.map(person => person.uuid) ?? []) : []),
    [people.data, user?.uuid, search]
  );
  const students = useStudentsByUserIds(userIds);
  const results = useMemo(
    () =>
      Object.values(students.studentMap).flatMap(student => {
        const parsed = identitySchema.safeParse(student);
        return parsed.success && parsed.data.user_uuid !== user?.uuid ? [parsed.data] : [];
      }),
    [students.studentMap, user?.uuid]
  );
  const searching = people.isFetching || students.isLoading;
  const searchError = people.isError || students.isError;
  const link = useMutation({
    ...createLinkMutation(),
    onSuccess: async response => {
      assertApiSuccess(response);
      if (!response?.uuid || !['ACTIVE', 'PENDING'].includes(response.status ?? '')) {
        throw new Error('The guardian link was not confirmed. Please try again.');
      }
      setLinked(response);
      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: getCurrentAccountStatusQueryKey() }),
        queryClient.invalidateQueries({ queryKey: ['guardian', 'students'] }),
        user?.invalidateQuery?.(),
        refreshIdentity(),
      ]);
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!selected || !authority || !user?.uuid) {
      setError(
        !selected
          ? 'Select your child’s learner profile.'
          : !authority
            ? 'Confirm your authority to act for this learner.'
            : 'Your account is still loading. Please try again.'
      );
      return;
    }
    link.mutate({
      body: {
        student_uuid: selected.uuid,
        guardian_user_uuid: user.uuid,
        relationship_type: relationship,
        share_scope: scope,
      },
    });
  }

  if (linked) {
    return (
      <Card
        className='mx-auto max-w-xl gap-0 rounded-3xl p-6 text-center shadow-sm sm:p-10'
        role='status'
      >
        <div className='bg-success/15 text-success mx-auto grid size-16 place-items-center rounded-full'>
          <CheckCircle2 className='size-8' aria-hidden />
        </div>
        <h1 className='mt-6 text-3xl font-bold tracking-tight'>
          {linked.student_name || displayName(selected ?? undefined) || 'Your child'}’s guardian
          link is {linked.status === 'ACTIVE' ? 'ready' : 'pending'}
        </h1>
        <p className='text-muted-foreground mt-2'>
          {linked.status === 'ACTIVE'
            ? 'Open Family Hub to support their learning with the access granted to your guardian account.'
            : 'Your guardian relationship is awaiting verification. Learning access follows the permissions approved for your account.'}
        </p>
        <div className='mt-5 flex justify-center'>
          <Badge variant={linked.status === 'ACTIVE' ? 'success' : 'warning'}>
            {linked.status === 'ACTIVE' ? 'Active' : 'Pending review'}
          </Badge>
        </div>
        <div className='mt-8 flex flex-wrap justify-center gap-3'>
          <Button
            variant='outline'
            size='lg'
            className='rounded-xl'
            onClick={() => {
              setLinked(null);
              setSelected(null);
              setName('');
              setSearch('');
              setPage(0);
              setAuthority(false);
              setRelationship('PARENT');
              setScope('FULL');
              link.reset();
            }}
          >
            Add another child
          </Button>
          <Button
            size='lg'
            className='rounded-xl'
            onClick={() =>
              router.push(buildDashboardSwitchPath('parent', '/dashboard/parent/overview'))
            }
          >
            Open Family Hub <ArrowRight aria-hidden />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className='w-full max-w-6xl'>
      <Button asChild variant='ghost' className='mb-6'>
        <Link href='/onboarding'>Back to profiles</Link>
      </Button>
      <form onSubmit={submit} noValidate className='grid gap-8 lg:grid-cols-2'>
        <div>
          <p className='text-primary text-xs font-semibold tracking-[0.2em] uppercase'>
            Support my child
          </p>
          <h1 className='mt-3 text-4xl font-bold tracking-tight'>Set up learning for your child</h1>
          <p className='text-muted-foreground mt-3'>
            Find your child’s existing learner profile and connect your guardian account.
          </p>
          <Card className='mt-8 gap-5 rounded-3xl p-6'>
            <h2 className='flex items-center gap-2 text-lg font-semibold'>
              <Baby className='text-primary size-5' aria-hidden /> Find your child
            </h2>
            <div>
              <Label htmlFor='ward-name'>Learner’s name</Label>
              <div className='mt-2 flex gap-2'>
                <Input
                  id='ward-name'
                  value={name}
                  disabled={link.isPending}
                  onChange={event => {
                    setName(event.target.value);
                    setSelected(null);
                    link.reset();
                    setError('');
                  }}
                  placeholder='e.g. Amani'
                  className='h-11 rounded-xl'
                />
                <Button
                  type='button'
                  variant='outline'
                  className='h-11 rounded-xl'
                  disabled={name.trim().length < 2 || !user?.uuid || link.isPending}
                  onClick={() => {
                    setSearch(name.trim());
                    setPage(0);
                    setSelected(null);
                  }}
                >
                  <Search className='size-4' aria-hidden /> Search
                </Button>
              </div>
              <p className='text-muted-foreground mt-2 text-xs'>
                Search by name, then select the correct learner. Results show profiles available to
                your account.
              </p>
            </div>
            {search && name.trim() === search && (
              <div aria-live='polite' className='space-y-3'>
                {searching ? (
                  <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                    <Spinner className='size-4' /> Searching learners…
                  </div>
                ) : searchError ? (
                  <EmptyState
                    variant='compact'
                    title='Unable to search learners'
                    description='Try again, or ask the learner or their organisation to send a guardian invitation.'
                    action={
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => {
                          void (people.error ? people.refetch() : students.refetch());
                        }}
                      >
                        Try again
                      </Button>
                    }
                  />
                ) : results.length ? (
                  <fieldset className='space-y-2' disabled={link.isPending}>
                    <legend className='mb-2 text-sm font-medium'>Select your child</legend>
                    {results.map(student => (
                      <label
                        key={student.uuid}
                        className='has-[:checked]:border-primary has-[:checked]:bg-primary/5 flex cursor-pointer items-center gap-3 rounded-xl border p-4'
                      >
                        <input
                          type='radio'
                          name='ward'
                          checked={selected?.uuid === student.uuid}
                          onChange={() => {
                            setSelected(student);
                            link.reset();
                            setError('');
                          }}
                          className='accent-primary'
                        />
                        <span className='text-sm font-medium'>
                          {displayName(student) ||
                            displayName(
                              people.data?.find(person => person.uuid === student.user_uuid)
                            ) ||
                            'Learner'}
                        </span>
                      </label>
                    ))}
                  </fieldset>
                ) : (
                  <EmptyState
                    variant='compact'
                    title='No learners found'
                    description='Try another name, or ask your child or their organisation to invite you as a guardian.'
                  />
                )}
                <div className='flex justify-between gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    disabled={page === 0 || searching || link.isPending}
                    onClick={() => {
                      setPage(value => value - 1);
                      setSelected(null);
                    }}
                  >
                    Previous
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    disabled={
                      (people.data?.length ?? 0) < 10 ||
                      searching ||
                      !!searchError ||
                      link.isPending
                    }
                    onClick={() => {
                      setPage(value => value + 1);
                      setSelected(null);
                    }}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
            <div className='space-y-2'>
              <Label htmlFor='guardian-relationship'>Relationship</Label>
              <select
                id='guardian-relationship'
                value={relationship}
                onChange={event => {
                  if (event.target.value === 'PARENT' || event.target.value === 'GUARDIAN')
                    setRelationship(event.target.value);
                }}
                className='border-input bg-background h-11 w-full rounded-xl border px-3 text-sm'
                disabled={link.isPending}
              >
                <option value='PARENT'>Parent</option>
                <option value='GUARDIAN'>Legal guardian / Foster carer</option>
              </select>
            </div>
            <label className='bg-muted/60 flex items-start gap-3 rounded-xl p-4 text-sm'>
              <Checkbox
                checked={authority}
                onCheckedChange={value => setAuthority(value === true)}
                disabled={link.isPending}
                className='mt-0.5'
              />
              <span>
                I confirm my authority to act for this learner. I understand Sarafrika may request
                documentation.
              </span>
            </label>
          </Card>
        </div>
        <div className='space-y-5 lg:pt-28'>
          <Card className='gap-0 rounded-3xl p-6'>
            <h2 className='text-lg font-semibold'>Guardian controls</h2>
            <p className='text-muted-foreground mt-1 text-sm'>
              Choose the learning access for this guardian link.
            </p>
            <fieldset className='mt-5 divide-y' disabled={link.isPending}>
              <legend className='sr-only'>Learning access</legend>
              {(
                [
                  {
                    value: 'FULL',
                    title: 'Full learning visibility',
                    description: 'Access the learner’s shared academics and attendance.',
                  },
                  {
                    value: 'ACADEMICS',
                    title: 'Academics',
                    description: 'Follow coursework, learning goals and progress reports.',
                  },
                  {
                    value: 'ATTENDANCE',
                    title: 'Attendance',
                    description: 'Monitor attendance without academic reports.',
                  },
                ] as const
              ).map(option => (
                <label
                  key={option.value}
                  className='flex cursor-pointer items-center justify-between gap-4 py-4'
                >
                  <span>
                    <span className='block font-semibold'>{option.title}</span>
                    <span className='text-muted-foreground block text-sm'>
                      {option.description}
                    </span>
                  </span>
                  <input
                    type='radio'
                    name='guardian-scope'
                    value={option.value}
                    checked={scope === option.value}
                    onChange={() => setScope(option.value)}
                    className='accent-primary size-4 shrink-0'
                  />
                </label>
              ))}
            </fieldset>
          </Card>
          <Card className='bg-muted flex-row gap-3 rounded-2xl p-5 text-sm'>
            <ShieldCheck className='text-primary size-5 shrink-0' aria-hidden />
            <p>
              Guardian access is subject to authorization. Your child keeps their own learner
              profile, skills and certificates. Their profile is hidden from public discovery, job matching and marketing by default.
            </p>
          </Card>
          {(error || link.error) && (
            <p role='alert' className='text-destructive text-sm'>
              {error ||
                getErrorMessage(
                  link.error,
                  'Unable to add this learner. Ask the learner or their organisation to invite you as a guardian.'
                )}
            </p>
          )}
          <Button
            type='submit'
            size='lg'
            className='h-12 w-full rounded-xl'
            disabled={link.isPending || !user?.uuid || !selected || name.trim() !== search}
          >
            {link.isPending && <Spinner className='size-4' />}{' '}
            {link.isPending ? 'Adding learner…' : 'Add learner to my family'}
          </Button>
        </div>
      </form>
    </div>
  );
}
