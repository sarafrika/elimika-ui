'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, X } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { extractPage } from '@/lib/api-helpers';
import { httpStatusOf } from '@/lib/api-errors';
import { getErrorMessage } from '@/lib/error-utils';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import type { Category } from '@/services/client';
import {
  getAllCategoriesOptions,
  getMyInterestsOptions,
  getMyInterestsQueryKey,
  updateMyInterestsMutation,
} from '@/services/client/@tanstack/react-query.gen';
import {
  type InterestDomain,
  type SelectedInterest,
  readInterests,
  toggleInterest,
} from '../lib/interests';
import { requireApiSuccess } from '../lib/user-onboarding';

const PAGE_SIZE = 24;

export function RegistrationInterests({
  domain,
  userUuid,
  onContinue,
}: {
  domain: InterestDomain;
  userUuid: string;
  onContinue: () => void;
}) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [draft, setDraft] = useState<SelectedInterest[] | null>(null);
  const [error, setError] = useState('');
  const saved = useQuery({
    ...getMyInterestsOptions({ path: { domain } }),
    enabled: Boolean(userUuid),
    staleTime: STALE_TIMES.entity,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    retry: false,
    select: readInterests,
  });
  const available = useQuery({
    ...getAllCategoriesOptions({ query: { pageable: { page, size: PAGE_SIZE } } }),
    enabled: Boolean(userUuid),
    staleTime: STALE_TIMES.reference,
    select: response => {
      requireApiSuccess(response);
      return extractPage<Category>(response);
    },
  });
  const save = useMutation({ ...updateMyInterestsMutation(), retry: false });
  const selected = draft ?? saved.data ?? [];
  const selectedIds = useMemo(() => new Set(selected.map(item => item.category_uuid)), [selected]);
  const choices = useMemo(
    () =>
      (available.data?.items ?? []).flatMap(category =>
        category.uuid && category.is_active !== false
          ? [{ category_uuid: category.uuid, name: category.name }]
          : []
      ),
    [available.data]
  );
  const hasNext =
    available.data?.metadata.hasNext ??
    (available.data?.metadata.totalPages !== undefined
      ? page + 1 < available.data.metadata.totalPages
      : (available.data?.items.length ?? 0) >= PAGE_SIZE);
  const locked = save.isPending || saved.isPending || saved.isError;

  async function continueWithInterests() {
    if (locked || saved.isFetching) return;
    setError('');
    try {
      const response = await save.mutateAsync({
        path: { domain },
        body: { category_uuids: selected.map(category => category.category_uuid) },
      });
      // Validate the save before replacing cached server state or advancing.
      readInterests(response);
      queryClient.setQueryData(getMyInterestsQueryKey({ path: { domain } }), response);
      onContinue();
    } catch (failure) {
      setError(
        getErrorMessage(
          failure,
          'Unable to save your interests. Your selections are still here; please try again.'
        )
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1>Select your interests</h1>
        </CardTitle>
        <CardDescription>
          {domain === 'student'
            ? 'What would you like to learn? Choose the categories that interest you.'
            : domain === 'organisation_user'
              ? 'Select the course categories your organisation is interested in.'
              : 'Select the categories you want to offer courses in.'}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-5'>
        {saved.isPending ? (
          <Skeleton className='h-64 w-full' />
        ) : saved.isError ? (
          <EmptyState
            variant='compact'
            title='Unable to load saved interests'
            description={getErrorMessage(
              saved.error,
              'Please try again before saving a new selection.'
            )}
            action={
              <Button
                variant='outline'
                disabled={saved.isFetching}
                onClick={() => void saved.refetch()}
              >
                Try again
              </Button>
            }
          />
        ) : (
          <>
            <div className='space-y-2'>
              <div className='flex items-center justify-between gap-3'>
                <h2 className='text-sm font-semibold'>Selected interests ({selected.length})</h2>
                {!!selected.length && (
                  <Button variant='ghost' size='sm' disabled={locked} onClick={() => setDraft([])}>
                    Clear all
                  </Button>
                )}
              </div>
              {selected.length ? (
                <div className='flex flex-wrap gap-2'>
                  {selected.map(category => (
                    <Button
                      key={category.category_uuid}
                      type='button'
                      variant='secondary'
                      size='sm'
                      disabled={locked}
                      onClick={() =>
                        setDraft(current =>
                          (current ?? selected).filter(
                            item => item.category_uuid !== category.category_uuid
                          )
                        )
                      }
                      aria-label={`Remove ${category.name}`}
                      className='h-auto text-left whitespace-normal'
                    >
                      {category.name}
                      <X className='size-3 shrink-0' aria-hidden />
                    </Button>
                  ))}
                </div>
              ) : (
                <p className='text-muted-foreground text-sm'>
                  No interests selected. You can continue with an empty selection.
                </p>
              )}
            </div>
            {available.isPending ? (
              <Skeleton className='h-64 w-full' />
            ) : available.isError ? (
              <EmptyState
                variant='compact'
                title='Unable to load categories'
                description='Your selected interests are preserved. Try loading categories again.'
                action={
                  <Button variant='outline' onClick={() => void available.refetch()}>
                    Try again
                  </Button>
                }
              />
            ) : choices.length ? (
              <div className='grid gap-2 sm:grid-cols-2'>
                {choices.map(category => (
                  <Button
                    key={category.category_uuid}
                    type='button'
                    variant='outline'
                    disabled={locked}
                    aria-pressed={selectedIds.has(category.category_uuid)}
                    onClick={() =>
                      setDraft(current => toggleInterest(current ?? selected, category))
                    }
                    className={cn(
                      'h-auto min-h-12 justify-between gap-3 px-4 py-3 text-left whitespace-normal',
                      selectedIds.has(category.category_uuid)
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border bg-background text-muted-foreground'
                    )}
                  >
                    {category.name}
                    {selectedIds.has(category.category_uuid) && (
                      <CheckCircle2 className='text-primary size-4 shrink-0' aria-hidden />
                    )}
                  </Button>
                ))}
              </div>
            ) : (
              <EmptyState
                variant='compact'
                title='No active categories on this page'
                description='Browse another page, or continue with your current selection.'
              />
            )}
            <div className='flex items-center justify-between gap-2'>
              <Button
                variant='outline'
                size='sm'
                disabled={locked || page === 0 || available.isFetching}
                onClick={() => setPage(value => value - 1)}
              >
                Previous
              </Button>
              <span className='text-muted-foreground text-sm'>Page {page + 1}</span>
              <Button
                variant='outline'
                size='sm'
                disabled={locked || !hasNext || available.isFetching || available.isError}
                onClick={() => setPage(value => value + 1)}
              >
                Next
              </Button>
            </div>
          </>
        )}
        <p className='text-muted-foreground text-sm'>
          Your selection is saved to your account when you continue. Clearing all interests replaces
          your saved selection with an empty list.
        </p>
        {error && (
          <p role='alert' className='text-destructive text-sm whitespace-pre-line'>
            {error}
          </p>
        )}
        {(httpStatusOf(save.error) === 401 || httpStatusOf(saved.error) === 401) && (
          <Button variant='outline' onClick={() => void signIn('keycloak')}>
            Sign in again
          </Button>
        )}
        <div className='flex justify-end'>
          <Button
            disabled={locked || saved.isFetching}
            onClick={() => void continueWithInterests()}
          >
            {save.isPending && <Spinner />}
            {save.isPending ? 'Saving interests…' : 'Save and continue'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
