'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import LocationInput from '@/components/locationInput';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/lib/error-utils';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import type { ProfessionalProfile } from '@/services/client';
import {
  getAllCategoriesOptions,
  getSummaryOptions,
  getSummaryQueryKey,
  updateBasicsMutation,
  updateCategoriesMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { isDomainOnboardingKey } from '../hooks/useDomainOnboarding';
import {
  creatorOnboardingOptions,
  creatorOnboardingQueryKey,
  useCourseCreatorOnboarding,
} from '../hooks/useCourseCreatorOnboarding';
import { requireApiData } from '../lib/user-onboarding';
import { FieldError, FormError, SavedBadge, StepBody, StepFooter } from './OnboardingFrame';

const HEADLINE_MAX = 120;
const BIO_MAX = 1000;

type StepProps = { onBack: () => void; onDone: () => void };

/** Course Creator categories, kept as Ayomi designed it: a paged grid of choice cards. */
export function CategoriesStep({ onDone }: StepProps) {
  const queryClient = useQueryClient();
  const creator = useCourseCreatorOnboarding(true);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [restored, setRestored] = useState(false);
  const [error, setError] = useState('');
  const categories = useQuery({
    ...getAllCategoriesOptions({ query: { pageable: { page, size: 24 } } }),
    select: response => requireApiData(response),
    staleTime: STALE_TIMES.reference,
  });
  const save = useMutation(updateCategoriesMutation(creatorOnboardingOptions));

  // Restore saved selections once; refetches must not overwrite edits.
  useEffect(() => {
    if (restored || !creator.isSuccess) return;
    setSelected(
      (creator.data?.categories ?? []).flatMap(item =>
        item.category_uuid ? [item.category_uuid] : []
      )
    );
    setRestored(true);
  }, [restored, creator.isSuccess, creator.data]);

  const active =
    categories.data?.content?.filter(category => category.uuid && category.is_active !== false) ??
    [];

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (save.isPending || !selected.length) return;
    setError('');
    try {
      const response = await save.mutateAsync({ body: { category_uuids: selected } });
      requireApiData(response);
      queryClient.setQueryData(creatorOnboardingQueryKey(), response);
      await queryClient.invalidateQueries({ predicate: q => isDomainOnboardingKey(q.queryKey) });
      toast.success('Categories saved.');
      onDone();
    } catch (cause) {
      setError(getErrorMessage(cause, 'Unable to save your categories. Please try again.'));
    }
  };

  return (
    <form onSubmit={event => void handleSubmit(event)} noValidate>
      <StepBody>
        <p className='text-muted-foreground text-sm'>
          Select the categories you want to create courses in. Continue to save your selections.
        </p>
        {categories.isPending || creator.isPending ? (
          <Skeleton className='h-48 w-full' />
        ) : categories.isError ? (
          <EmptyState
            title='Unable to load onboarding information'
            description={getErrorMessage(categories.error, 'Please try again.')}
            action={
              <Button type='button' variant='outline' onClick={() => void categories.refetch()}>
                Try again
              </Button>
            }
          />
        ) : active.length === 0 ? (
          <EmptyState
            title='No categories available'
            description='Please try another page or check again later.'
          />
        ) : (
          <div className='grid gap-2 sm:grid-cols-2'>
            {active.map(category => {
              const uuid = category.uuid ?? '';
              const isSelected = selected.includes(uuid);
              return (
                <Button
                  key={uuid}
                  type='button'
                  variant='outline'
                  aria-pressed={isSelected}
                  disabled={save.isPending}
                  onClick={() =>
                    setSelected(current =>
                      isSelected ? current.filter(item => item !== uuid) : [...current, uuid]
                    )
                  }
                  className={cn(
                    'h-auto w-full flex-col items-start p-4 text-left whitespace-normal',
                    isSelected && 'border-primary bg-primary/5'
                  )}
                >
                  <span className='flex w-full items-center justify-between gap-2 font-semibold'>
                    {category.name}
                    {isSelected && <CheckCircle2 className='text-primary h-4 w-4 shrink-0' />}
                  </span>
                  <span className='text-muted-foreground text-xs leading-5'>
                    {category.description ?? ''}
                  </span>
                </Button>
              );
            })}
          </div>
        )}
        <div className='flex items-center justify-between gap-3'>
          <Button
            type='button'
            variant='outline'
            disabled={page === 0 || categories.isFetching}
            onClick={() => setPage(current => current - 1)}
          >
            Previous
          </Button>
          <span className='text-muted-foreground text-sm'>Page {page + 1}</span>
          <Button
            type='button'
            variant='outline'
            disabled={!categories.data?.metadata?.hasNext || categories.isFetching}
            onClick={() => setPage(current => current + 1)}
          >
            Next
          </Button>
        </div>
        <p className='text-muted-foreground text-sm'>{selected.length} categories selected</p>
      </StepBody>
      <FormError message={error} />
      <StepFooter
        backDisabled
        primaryLabel='Save and continue'
        pending={save.isPending}
        primaryDisabled={!selected.length || creator.isPending}
      />
    </form>
  );
}

type Basics = {
  professional_headline: string;
  bio: string;
  location_name: string;
  latitude?: number;
  longitude?: number;
};

function useProfileBasics() {
  const queryClient = useQueryClient();
  const summary = useQuery({
    ...getSummaryOptions(),
    select: response => requireApiData(response).basics,
    staleTime: STALE_TIMES.entity,
  });
  const [basics, setBasics] = useState<Basics>({
    professional_headline: '',
    bio: '',
    location_name: '',
  });
  const [seeded, setSeeded] = useState(false);
  const mutation = useMutation(updateBasicsMutation());

  useEffect(() => {
    if (seeded || !summary.isSuccess) return;
    setBasics({
      professional_headline: summary.data?.professional_headline ?? '',
      bio: summary.data?.bio ?? '',
      location_name: summary.data?.location_name ?? '',
      latitude: summary.data?.latitude,
      longitude: summary.data?.longitude,
    });
    setSeeded(true);
  }, [seeded, summary.isSuccess, summary.data]);

  const save = async (withLocation: boolean) => {
    const body: ProfessionalProfile = {
      website: summary.data?.website,
      location_name: summary.data?.location_name,
      latitude: summary.data?.latitude,
      longitude: summary.data?.longitude,
      professional_headline: basics.professional_headline.trim(),
      bio: basics.bio.trim(),
      ...(withLocation
        ? {
            location_name: basics.location_name.trim(),
            latitude: basics.latitude,
            longitude: basics.longitude,
          }
        : {}),
    };
    requireApiData(await mutation.mutateAsync({ body }));
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getSummaryQueryKey() }),
      queryClient.invalidateQueries({ predicate: q => isDomainOnboardingKey(q.queryKey) }),
    ]);
  };

  return { summary, basics, setBasics, save, saving: mutation.isPending, ready: seeded };
}

function validateBasics(basics: Basics, withLocation: boolean) {
  const errors: Record<string, string> = {};
  if (!basics.professional_headline.trim()) errors.headline = 'Add a one-line headline.';
  if (!basics.bio.trim()) errors.bio = 'Add a short bio.';
  if (withLocation && !basics.location_name.trim()) errors.location = 'Add where you teach.';
  return errors;
}

function BasicsFields({
  basics,
  setBasics,
  errors,
}: {
  basics: Basics;
  setBasics: (update: (current: Basics) => Basics) => void;
  errors: Record<string, string>;
}) {
  return (
    <>
      <div className='space-y-1.5'>
        <div className='flex justify-between gap-2'>
          <Label htmlFor='headline'>Headline</Label>
          <span className='text-muted-foreground text-xs'>
            {basics.professional_headline.length} / {HEADLINE_MAX}
          </span>
        </div>
        <Input
          id='headline'
          maxLength={HEADLINE_MAX}
          placeholder='e.g. Music producer and vocal coach'
          value={basics.professional_headline}
          onChange={event =>
            setBasics(current => ({ ...current, professional_headline: event.target.value }))
          }
          aria-invalid={Boolean(errors.headline)}
          aria-describedby={errors.headline ? 'headline-error' : undefined}
        />
        <FieldError id='headline' message={errors.headline} />
      </div>
      <div className='space-y-1.5'>
        <div className='flex justify-between gap-2'>
          <Label htmlFor='bio'>Short bio</Label>
          <span className='text-muted-foreground text-xs'>
            {basics.bio.length} / {BIO_MAX}
          </span>
        </div>
        <Textarea
          id='bio'
          rows={4}
          maxLength={BIO_MAX}
          value={basics.bio}
          onChange={event => setBasics(current => ({ ...current, bio: event.target.value }))}
          aria-invalid={Boolean(errors.bio)}
          aria-describedby={errors.bio ? 'bio-error' : undefined}
        />
        <FieldError id='bio' message={errors.bio} />
      </div>
    </>
  );
}

/** Headline and bio as a self-saving card, shown above the skills wallet for Course Creators. */
export function ProfileBasicsCard() {
  const { summary, basics, setBasics, save, saving, ready } = useProfileBasics();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = async () => {
    const next = validateBasics(basics, false);
    setErrors(next);
    if (saving || Object.keys(next).length) return;
    try {
      await save(false);
      toast.success('Profile saved.');
    } catch (cause) {
      toast.error(getErrorMessage(cause, 'Unable to save your profile. Please try again.'));
    }
  };

  return (
    <div className='border-border space-y-4 rounded-xl border p-4'>
      <div className='flex flex-wrap items-start justify-between gap-2'>
        <div>
          <p className='text-foreground text-[15px] font-semibold'>Professional profile</p>
          <p className='text-muted-foreground text-xs'>
            Learners see this on your courses. Required before review.
          </p>
        </div>
        <SavedBadge show={Boolean(summary.data?.basics_complete)} />
      </div>
      {summary.isError ? (
        <p className='text-destructive text-sm'>
          Unable to load your profile. Refresh to try again.
        </p>
      ) : !ready ? (
        <Skeleton className='h-36 w-full' />
      ) : (
        <fieldset disabled={saving} className='space-y-4'>
          <BasicsFields basics={basics} setBasics={setBasics} errors={errors} />
          <div className='flex justify-end'>
            <Button type='button' variant='outline' onClick={() => void handleSave()}>
              {saving && <Spinner />}Save profile
            </Button>
          </div>
        </fieldset>
      )}
    </div>
  );
}

/** Instructor role details: headline, bio and where they teach. */
export function InstructorDetails({ onBack, onDone }: StepProps) {
  const { summary, basics, setBasics, save, saving, ready } = useProfileBasics();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const next = validateBasics(basics, true);
    setErrors(next);
    if (saving || Object.keys(next).length) return;
    setFormError('');
    try {
      await save(true);
      toast.success('Profile saved.');
      onDone();
    } catch (cause) {
      setFormError(getErrorMessage(cause, 'Unable to save your profile. Please try again.'));
    }
  };

  return (
    <form onSubmit={event => void handleSubmit(event)} noValidate>
      <StepBody>
        {summary.isError ? (
          <EmptyState
            title='Unable to load your profile'
            description={getErrorMessage(summary.error, 'Please try again.')}
            action={
              <Button type='button' variant='outline' onClick={() => void summary.refetch()}>
                Try again
              </Button>
            }
          />
        ) : !ready ? (
          <Skeleton className='h-56 w-full' />
        ) : (
          <fieldset disabled={saving} className='space-y-5'>
            <SavedBadge show={Boolean(summary.data?.basics_complete)} />
            <BasicsFields basics={basics} setBasics={setBasics} errors={errors} />
            <div className='border-border space-y-2 rounded-xl border p-4'>
              <Label htmlFor='location'>Where you teach</Label>
              <LocationInput
                id='location'
                value={basics.location_name}
                onChange={value => setBasics(current => ({ ...current, location_name: value }))}
                coordinates={{ latitude: basics.latitude, longitude: basics.longitude }}
                onSuggest={result => {
                  const coords = result.features[0]?.properties?.coordinates;
                  if (typeof coords?.latitude === 'number' && typeof coords.longitude === 'number')
                    setBasics(current => ({
                      ...current,
                      latitude: coords.latitude,
                      longitude: coords.longitude,
                    }));
                }}
              />
              <p className='text-muted-foreground text-xs'>
                Organisations near you see your profile first. You can set your availability later
                from your calendar.
              </p>
              <FieldError id='location' message={errors.location} />
            </div>
          </fieldset>
        )}
      </StepBody>
      <FormError message={formError} />
      <StepFooter
        onBack={onBack}
        primaryLabel='Save and continue'
        pending={saving}
        primaryDisabled={!ready || summary.isError}
      />
    </form>
  );
}
