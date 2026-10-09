'use client';

import {
  ProgramLifecycleActions,
  ProgramLifecycleBadge,
  useProgramLifecycle,
} from '@/components/programs/program-lifecycle';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Form } from '@/components/ui/form';
import Spinner from '@/components/ui/spinner';
import { useUserProfile } from '@/context/profile-context';
import { useCoursesByIds } from '@/hooks/use-batched-lookups';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getAllCategoriesInfiniteOptions,
  getTrainingProgramByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { TrainingProgram } from '@/services/client/types.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  BadgeDollarSign,
  Check,
  ClipboardList,
  Layers,
  ListChecks,
  Palette,
  Scale,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { type FieldPath, useForm, useFormContext, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { PageHeader } from '../../../../../../components/page-header';
import { clearNewProgramDraft, readProgramDraft, writeProgramDraft } from '../program-local-draft';
import { programRevenueShares } from '../program-pricing';
import type { ProgramSaveStep } from '../program-save-state';
import type { ProgramFormValues } from '../program-schema';
import { PROGRAM_STEP_FIELDS, programFormSchema, programStepSchema } from '../program-schema';
import type { PendingProgramMedia, ProgramMediaKey } from '../save-program-media';
import { useSaveProgram } from '../use-save-program';
import ProgramCourses from './ProgramCourses';
import { ProgramSetup } from './ProgramFields';
import { ProgramSavingOverlay } from './ProgramSavingOverlay';
import {
  ProgramAssessment,
  ProgramBranding,
  ProgramEvaluation,
  ProgramPricing,
} from './ProgramFutureSteps';

const STEPS = [
  { key: 'setup', label: 'Program set-up', icon: ClipboardList },
  { key: 'courses', label: 'Courses in this program', icon: Layers },
  { key: 'assessment', label: 'Program assessment', icon: ListChecks },
  { key: 'evaluation', label: 'Evaluation', icon: Scale },
  { key: 'branding', label: 'Branding', icon: Palette },
  { key: 'pricing', label: 'Pricing', icon: BadgeDollarSign },
] as const;

export default function ProgramEditor({
  initialValues,
  program,
}: {
  initialValues: ProgramFormValues;
  program?: TrainingProgram;
}) {
  const router = useRouter();
  const profile = useUserProfile();
  const creatorUuid = profile?.courseCreator?.uuid ?? '';
  const [step, setStep] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const requested = Number(new URLSearchParams(window.location.search).get('step') ?? 0);
    return program?.uuid &&
      Number.isInteger(requested) &&
      requested >= 0 &&
      requested < STEPS.length
      ? requested
      : 0;
  });
  const navigationLock = useRef(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [evaluationPending, setEvaluationPending] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<PendingProgramMedia>({});
  const selectMedia = (key: ProgramMediaKey, file?: File) => {
    setPendingMedia(current => ({ ...current, [key]: file }));
  };
  const form = useForm<ProgramFormValues>({
    resolver: zodResolver(programFormSchema),
    defaultValues: initialValues,
    mode: 'onTouched',
    shouldUnregister: false,
  });
  const selectedCourses = useWatch({ control: form.control, name: 'courses' });
  const selectedCourseIds = useMemo(
    () => selectedCourses.map(course => course.courseUuid),
    [selectedCourses]
  );
  const courseFees = useCoursesByIds(selectedCourseIds);
  const revenueShares = useMemo(
    () =>
      courseFees.isLoading || courseFees.isError
        ? undefined
        : programRevenueShares(selectedCourseIds, courseFees.courseMap),
    [selectedCourseIds, courseFees.courseMap, courseFees.isLoading, courseFees.isError]
  );
  const save = useSaveProgram(form, creatorUuid, program);
  const lifecycle = useProgramLifecycle();
  const [savedForPublication, setSavedForPublication] = useState<string>();
  const [draftStorageFailed, setDraftStorageFailed] = useState(false);
  useEffect(() => {
    if (!creatorUuid) return;
    const draft = readProgramDraft(creatorUuid, save.programUuid);
    if (draft) {
      form.setValue('draft', { ...form.getValues('draft'), ...draft.draft });
      if (!program && !form.getValues('programCode'))
        form.setValue('programCode', draft.programCode ?? draft.draft.programCode);
      form.setValue('categoryUuids', draft.categoryUuids);
    }
    // The callback overload subscribes inside this effect without watching during render.
    const { watch, getValues } = form;
    const subscription = watch(() => {
      setDraftStorageFailed(!writeProgramDraft(creatorUuid, save.programUuid, getValues()));
    });
    return () => subscription.unsubscribe();
  }, [creatorUuid, program, save.programUuid, form]);
  const categoriesQuery = useInfiniteQuery({
    ...getAllCategoriesInfiniteOptions({ query: { pageable: { size: 100 } } }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.error || lastPage.success === false) return undefined;
      const metadata = lastPage.data?.metadata;
      return (metadata?.hasNext ?? pages.length < (metadata?.totalPages ?? 1))
        ? pages.length
        : undefined;
    },
    enabled: step === 0,
    staleTime: STALE_TIMES.reference,
  });
  const categoryError =
    categoriesQuery.isError ||
    categoriesQuery.data?.pages.some(page => page.error || page.success === false);
  const categories = useMemo(
    () =>
      categoriesQuery.data?.pages.flatMap(page =>
        page.error || page.success === false ? [] : (page.data?.content ?? [])
      ) ?? [],
    [categoriesQuery.data]
  );

  const updateUrl = (uuid: string, nextStep: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('id', uuid);
    url.searchParams.set('step', String(nextStep));
    window.history.replaceState(null, '', url);
  };
  const persistStep = async (saveStep: ProgramSaveStep = step) => {
    const values = form.getValues();
    const uuid =
      save.programUuid && !save.hasChanges(values, saveStep, pendingMedia)
        ? save.programUuid
        : await save.mutateAsync({
          values,
          step: saveStep,
          media: pendingMedia,
          onCreated: uuid => updateUrl(uuid, step),
          onMediaUploaded: (key, file) =>
            setPendingMedia(current =>
              current[key] === file ? { ...current, [key]: undefined } : current
            ),
        });
    if (!writeProgramDraft(creatorUuid, uuid, form.getValues())) setDraftStorageFailed(true);
    else clearNewProgramDraft(creatorUuid);
    return uuid;
  };
  const validateStep = (target: number | 'requirements' | 'assessments') => {
    const fields: FieldPath<ProgramFormValues>[] =
      target === 'requirements'
        ? ['requirements']
        : target === 'assessments'
          ? ['draft.assessments']
          : [...(PROGRAM_STEP_FIELDS[target] ?? [])];
    form.clearErrors(fields);
    const result = programStepSchema(target).safeParse(form.getValues());
    if (result.success) {
      setValidationMessage('');
      return true;
    }
    result.error.issues.forEach((issue, index) => {
      form.setError(
        issue.path.join('.') as FieldPath<ProgramFormValues>,
        {
          type: 'schema',
          message: issue.message,
        },
        { shouldFocus: index === 0 }
      );
    });
    const message = result.error.issues[0]?.message ?? 'Check the fields on this step.';
    setValidationMessage(message);
    toast.error(message);
    return false;
  };
  const goToStep = async (target: number) => {
    if (navigationLock.current || save.isPending || evaluationPending || target === step) return;
    // Only setup can create the UUID. Once created, every step is reachable.
    if (!save.programUuid && target !== step + 1) return;
    navigationLock.current = true;
    try {
      const changed = save.hasChanges(form.getValues(), step, pendingMedia);
      if (changed && !validateStep(step)) return;
      const uuid = await persistStep();
      updateUrl(uuid, target);
      setValidationMessage('');
      setStep(target);
      if (changed) toast.success('Program step saved');
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to save this step.');
    } finally {
      navigationLock.current = false;
    }
  };
  const onInvalid = () => {
    const result = programFormSchema.safeParse(form.getValues());
    if (result.success) return;
    const issue = result.error.issues[0];
    if (!issue) return;
    const field = issue.path.join('.');
    const invalidStep = PROGRAM_STEP_FIELDS.findIndex(fields =>
      fields.some(name => field === name || field.startsWith(`${name}.`))
    );
    const target = invalidStep >= 0 ? invalidStep : 0;
    setStep(target);
    if (save.programUuid) updateUrl(save.programUuid, target);
    setValidationMessage(issue.message);
    toast.error(issue.message);
  };
  const onSave = async () => {
    if (navigationLock.current || save.isPending || evaluationPending || lifecycle.pending) return;
    if (selectedCourseIds.length && !revenueShares) {
      toast.error('Reload the selected course data before saving pricing.');
      return;
    }
    navigationLock.current = true;
    try {
      const uuid = await persistStep('all');
      setSavedForPublication(uuid);
      updateUrl(uuid, step);
      toast.success('Program saved');
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : 'Unable to save program. Please try again.'
      );
    } finally {
      navigationLock.current = false;
    }
  };
  const openProgram = (uuid: string) =>
    router.push(`/dashboard/course-creator/course-management/programs/${uuid}`);
  const onPublish = async () => {
    if (
      !savedForPublication ||
      navigationLock.current ||
      save.isPending ||
      evaluationPending ||
      lifecycle.pending
    ) return;
    if (selectedCourseIds.length && !revenueShares) {
      toast.error('Reload the selected course data before publishing.');
      return;
    }
    navigationLock.current = true;
    try {
      // Save any edits made after the final save; unchanged content sends no update.
      const uuid = await persistStep('all');
      if (await lifecycle.run('publish', uuid)) openProgram(uuid);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to publish program.');
    } finally {
      navigationLock.current = false;
    }
  };
  const backToPrograms = () => router.push('/dashboard/course-creator/course-management');

  return (
    <main className='bg-muted/20 min-h-screen px-4 py-6 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-[1500px] space-y-5'>
        <Link
          href='/dashboard/course-creator/course-management'
          className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm'
        >
          <ArrowLeft className='h-4 w-4' /> Back to my courses
        </Link>

        <PageHeader
          title='Programs'
          description='Build a program step by step, then publish it.'
        />

        <ProgramSavingOverlay progress={save.progress} />
        <Form {...form}>
          <form
            noValidate
            onSubmit={event => {
              if (step < STEPS.length - 1) {
                event.preventDefault();
                void goToStep(step + 1);
              } else void form.handleSubmit(onSave, onInvalid)(event);
            }}
          >
            <fieldset
              disabled={save.isPending || evaluationPending || lifecycle.pending !== null}
              className='min-w-0'
            >
              <Card className='border-border bg-background gap-0 rounded-md py-0 shadow-sm'>
                <div className='border-border border-b p-5'>
                  <div className='flex flex-wrap items-baseline justify-between gap-2'>
                    <ProgramTitle />
                    {save.programUuid ? (
                      <SavedProgramActions
                        uuid={save.programUuid}
                        fallback={program}
                        onPublished={step === STEPS.length - 1 ? openProgram : undefined}
                      />
                    ) : (
                      <ProgramLifecycleBadge program={undefined} />
                    )}

                  </div>


                  <span
                    className='text-muted-foreground text-xs font-semibold uppercase'
                    aria-live='polite'
                  >
                    Step {step + 1} of {STEPS.length}
                  </span>

                  <nav aria-label='Program setup steps'>
                    <ol className='mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-6'>
                      {STEPS.map((entry, index) => {
                        const Icon = entry.icon;
                        const state = index === step ? 'current' : index < step ? 'done' : 'todo';
                        return (
                          <li key={entry.key}>
                            <Button
                              type='button'
                              variant='ghost'
                              onClick={() => void goToStep(index)}
                              disabled={
                                (!save.programUuid && index !== 0) ||
                                save.isPending ||
                                evaluationPending
                              }
                              aria-current={index === step ? 'step' : undefined}
                              className={`h-auto w-full justify-start gap-2 rounded-md border p-2.5 text-left text-xs font-medium ${state === 'current' ? 'border-primary bg-primary/5 text-foreground' : state === 'done' ? 'border-border bg-muted/40 text-foreground' : 'border-border text-muted-foreground hover:bg-muted/40'}`}
                            >
                              <span
                                className={`flex h-6 w-6 shrink-0 items-center justify-center ${state === 'todo' ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground'}`}
                              >
                                {state === 'done' ? (
                                  <Check className='size-3.5' />
                                ) : (
                                  <Icon className='size-3.5' />
                                )}
                              </span>
                              <span className='min-w-0 truncate' title={entry.label}>
                                {entry.label}
                              </span>
                            </Button>
                          </li>
                        );
                      })}
                    </ol>
                  </nav>
                </div>
                <div className='space-y-6 p-5'>
                  <p className='text-muted-foreground text-xs' role='status'>
                    {draftStorageFailed
                      ? 'Browser draft storage is unavailable. Extra categories, subject, award, and brand identity cannot be stored in this browser.'
                      : 'Changed steps are saved before you continue. Extra categories, subject, award, and brand identity are kept in this browser draft.'}
                  </p>
                  {validationMessage && (
                    <p role='alert' className='text-destructive text-sm'>
                      {validationMessage}
                    </p>
                  )}
                  {save.isError && (
                    <div
                      role='alert'
                      className='border-destructive/30 bg-destructive/5 text-destructive border p-3 text-sm'
                    >
                      {save.error instanceof Error ? save.error.message : 'Unable to save program.'}{' '}
                      Your form entries are still here. Retry saving to finish.
                    </div>
                  )}
                  {step === 0 && (
                    <>
                      {categoryError ? (
                        <EmptyState
                          variant='compact'
                          title='Unable to load categories'
                          action={
                            <Button
                              type='button'
                              variant='outline'
                              onClick={() => categoriesQuery.refetch()}
                            >
                              Try again
                            </Button>
                          }
                        />
                      ) : categoriesQuery.isLoading ? (
                        <div
                          role='status'
                          className='text-muted-foreground flex items-center gap-2 text-sm'
                        >
                          <Spinner />
                          Loading categories…
                        </div>
                      ) : categories.length === 0 ? (
                        <EmptyState
                          variant='compact'
                          title='No categories available'
                          description='A category is needed to save a program. Try again once categories are available.'
                        />
                      ) : null}
                      <ProgramSetup categories={categories} />
                      {categoriesQuery.hasNextPage && (
                        <Button
                          type='button'
                          variant='outline'
                          onClick={() => categoriesQuery.fetchNextPage()}
                          disabled={categoriesQuery.isFetchingNextPage}
                        >
                          {categoriesQuery.isFetchingNextPage && <Spinner />}Load more categories
                        </Button>
                      )}
                    </>
                  )}
                  {step === 1 && <ProgramCourses creatorUuid={creatorUuid} />}
                  {step === 2 && (
                    <ProgramAssessment
                      programUuid={save.programUuid}
                      onSave={async assessments => {
                        if (navigationLock.current || save.isPending || evaluationPending)
                          return false;
                        navigationLock.current = true;
                        try {
                          form.setValue('draft.assessments', assessments, { shouldDirty: true });
                          if (!validateStep('assessments')) return false;
                          await persistStep('assessments');
                          return true;
                        } finally {
                          navigationLock.current = false;
                        }
                      }}
                    />
                  )}
                  {step === 3 && save.programUuid && (
                    <ProgramEvaluation
                      programUuid={save.programUuid}
                      creatorUuid={creatorUuid}
                      associatedBy={profile?.uuid}
                      onPendingChange={setEvaluationPending}
                    />
                  )}
                  {step === 4 && <ProgramBranding files={pendingMedia} onSelect={selectMedia} />}
                  {step === 5 && (
                    <>
                      <ProgramPricing
                        revenueShares={revenueShares}
                        isLoading={courseFees.isLoading}
                        onRetry={() => void courseFees.refetch()}
                      />
                      {savedForPublication && (
                        <p role='status' className='text-success text-sm'>
                          Program saved. You can now publish it.
                        </p>
                      )}
                    </>
                  )}
                  <div className='border-border flex flex-wrap items-center justify-between gap-2 border-t pt-5'>
                    <Button type='button' variant='ghost' onClick={backToPrograms}>
                      Cancel
                    </Button>
                    <div className='flex gap-2'>
                      {step > 0 && (
                        <Button
                          type='button'
                          variant='outline'
                          onClick={() => void goToStep(step - 1)}
                        >
                          <ArrowLeft />
                          Back
                        </Button>
                      )}
                      {step === STEPS.length - 1 ? (
                        <>
                          <Button
                            type='submit'
                            variant={savedForPublication ? 'outline' : 'default'}
                            disabled={!creatorUuid || save.isPending || evaluationPending}
                          >
                            {save.isPending ? <Spinner /> : <Check />}
                            {save.isPending ? 'Saving program…' : 'Save program'}
                          </Button>
                          {savedForPublication && (
                            <Button
                              type='button'
                              disabled={
                                !creatorUuid || save.isPending || evaluationPending ||
                                lifecycle.pending !== null
                              }
                              onClick={() => void form.handleSubmit(onPublish, onInvalid)()}
                            >
                              {save.isPending || lifecycle.pending === 'publish' ? (
                                <Spinner />
                              ) : (
                                <Send />
                              )}
                              {save.isPending || lifecycle.pending === 'publish'
                                ? 'Publishing…'
                                : 'Publish program'}
                            </Button>
                          )}
                        </>
                      ) : (
                        <Button
                          type='button'
                          disabled={!creatorUuid || save.isPending || evaluationPending}
                          onClick={() => void goToStep(step + 1)}
                        >
                          {save.isPending ? <Spinner /> : <ArrowRight />}
                          {save.isPending ? 'Saving…' : 'Save and continue'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </fieldset>
          </form>
        </Form>
      </div>
    </main>
  );
}

function ProgramTitle() {
  const { control } = useFormContext<ProgramFormValues>();
  const title = useWatch({ control, name: 'title' });
  return <h2 className='text-foreground text-xl font-bold'>{title.trim() || 'New program'}</h2>;
}

function SavedProgramActions({
  uuid,
  fallback,
  onPublished,
}: {
  uuid: string;
  fallback?: TrainingProgram;
  onPublished?: (uuid: string) => void;
}) {
  const query = useQuery({
    ...getTrainingProgramByUuidOptions({ path: { uuid } }),
    enabled: Boolean(uuid),
    staleTime: STALE_TIMES.entity,
  });
  const program =
    query.data?.error || query.data?.success === false ? fallback : (query.data?.data ?? fallback);
  return program ? (
    <ProgramLifecycleActions program={program} onPublished={onPublished} />
  ) : (
    <ProgramLifecycleBadge program={undefined} />
  );
}
