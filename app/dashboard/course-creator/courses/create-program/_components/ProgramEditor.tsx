'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Form } from '@/components/ui/form';
import Spinner from '@/components/ui/spinner';
import { useCoursesByIds } from '@/hooks/use-batched-lookups';
import { useUserProfile } from '@/context/profile-context';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getAllCategoriesInfiniteOptions,
  getTrainingProgramByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';
import {
  ProgramLifecycleActions,
  ProgramLifecycleBadge,
} from '@/components/programs/program-lifecycle';
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
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  useForm,
  useFormContext,
  useWatch,
  type FieldErrors,
  type FieldPath,
} from 'react-hook-form';
import { toast } from 'sonner';
import { PageHeader } from '../../../../../../components/page-header';
import { clearNewProgramDraft, readProgramDraft, writeProgramDraft } from '../program-local-draft';
import type { ProgramFormValues } from '../program-schema';
import { minimumProgramTrainingFee, programPricingSchema } from '../program-pricing';
import { useSaveProgram } from '../use-save-program';
import ProgramCourses from './ProgramCourses';
import { ProgramSetup } from './ProgramFields';
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

const SETUP_FIELDS: FieldPath<ProgramFormValues>[] = [
  'title',
  'categoryUuids',
  'description',
  'objectives',
  'prerequisites',
  'classLimit',
  'totalDurationHours',
  'totalDurationMinutes',
  'requirements',
];

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
  const [step, setStep] = useState(0);
  const form = useForm<ProgramFormValues>({
    resolver: (values, context, options) =>
      zodResolver(programPricingSchema(minimumTrainingFee))(values, context, options),
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
  const minimumTrainingFee: number | undefined = useMemo(
    () =>
      courseFees.isLoading || courseFees.isError
        ? undefined
        : minimumProgramTrainingFee(selectedCourseIds, courseFees.courseMap),
    [selectedCourseIds, courseFees.courseMap, courseFees.isLoading, courseFees.isError]
  );
  const [draftStorageFailed, setDraftStorageFailed] = useState(false);
  useEffect(() => {
    if (!creatorUuid) return;
    const draft = readProgramDraft(creatorUuid, program?.uuid);
    if (draft) {
      form.setValue('draft', draft.draft);
      form.setValue('categoryUuids', draft.categoryUuids);
    }
    // The callback overload subscribes inside this effect without watching during render.
    const { watch, getValues } = form;
    const subscription = watch(() => {
      setDraftStorageFailed(!writeProgramDraft(creatorUuid, program?.uuid, getValues()));
    });
    return () => subscription.unsubscribe();
  }, [creatorUuid, program?.uuid, form]);
  const save = useSaveProgram(form, creatorUuid, program);
  // The lifecycle actions change the program outside this form; read it live so the
  // badge and the available actions follow.
  const liveProgramQuery = useQuery({
    ...getTrainingProgramByUuidOptions({ path: { uuid: program?.uuid ?? '' } }),
    enabled: Boolean(program?.uuid),
    staleTime: STALE_TIMES.entity,
  });
  const liveProgram = liveProgramQuery.data?.data ?? program;
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

  const goToStep = (target: number) => {
    if (!save.isPending) setStep(target);
  };
  const onInvalid = (errors: FieldErrors<ProgramFormValues>) => {
    const setupInvalid = SETUP_FIELDS.some(name => name in errors);
    setStep(setupInvalid ? 0 : errors.courses ? 1 : 5);
    toast.error('Please correct the highlighted fields before saving.');
  };
  const onSave = async (values: ProgramFormValues) => {
    try {
      const uuid = await save.mutateAsync({ values });
      if (!writeProgramDraft(creatorUuid, uuid, form.getValues())) {
        toast.warning('Program saved, but browser-only draft fields could not be stored.');
      } else if (!program?.uuid) {
        clearNewProgramDraft(creatorUuid);
      }
      toast.success(
        program?.uuid ? 'Program saved' : 'Program saved as a draft. Publish it from its page.'
      );
      router.push(`/dashboard/course-creator/course-management/programs/${uuid}`);
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : 'Unable to save program. Please try again.'
      );
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
          description='Build a program step by step, then open its information page.'
        />

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
            <fieldset disabled={save.isPending} className='min-w-0'>
              <Card className='border-border bg-background gap-0 rounded-md py-0 shadow-sm'>
                <div className='border-border border-b p-5'>
                  <div className='flex flex-wrap items-baseline justify-between gap-2'>
                    <ProgramTitle />
                    {liveProgram?.uuid ? (
                      <ProgramLifecycleActions program={liveProgram} />
                    ) : (
                      <ProgramLifecycleBadge program={undefined} />
                    )}
                    <span
                      className='text-muted-foreground text-xs font-semibold uppercase'
                      aria-live='polite'
                    >
                      Step {step + 1} of {STEPS.length}
                    </span>
                  </div>
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
                      ? 'Browser draft storage is unavailable. Extra categories, program code, subject, award, assessment, evaluation, branding, and revenue shares will be lost when you leave.'
                      : 'Extra categories, program code, subject, award, assessment, evaluation, branding, and revenue shares are saved only in this browser for now. They are not included in the published program.'}
                  </p>
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
                        <p
                          role='status'
                          className='text-muted-foreground flex items-center gap-2 text-sm'
                        >
                          <Spinner />
                          Loading categories…
                        </p>
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
                  {step === 2 && <ProgramAssessment />}
                  {step === 3 && <ProgramEvaluation />}
                  {step === 4 && <ProgramBranding />}
                  {step === 5 && (
                    <ProgramPricing
                      minimumTrainingFee={minimumTrainingFee}
                      isLoading={courseFees.isLoading}
                      onRetry={() => void courseFees.refetch()}
                    />
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
                        <Button type='submit' disabled={!creatorUuid || save.isPending}>
                          {save.isPending ? <Spinner /> : <Check />}
                          {save.isPending ? 'Saving program…' : 'Save program'}
                        </Button>
                      ) : (
                        <Button type='button' onClick={() => void goToStep(step + 1)}>
                          Continue
                          <ArrowRight />
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
