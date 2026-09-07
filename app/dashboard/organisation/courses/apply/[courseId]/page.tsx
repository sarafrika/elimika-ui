'use client';

/**
 * Apply to train — a trainer's application to deliver a course or a programme.
 *
 * The screen is `ApplyToTrainView`: three numbered steps (what the creator
 * requires, your rate card, why you) with the deal beside them. This file is the
 * route around it — the params, the applicant's identity, the queries that fill
 * the view, and the one action the page owns: submitting the application.
 *
 * ## One screen, two content kinds
 *
 * `?kind=program` swaps the course for a training programme end to end:
 * `GET /programs/{uuid}` and its requirements, and
 * `POST /programs/{uuid}/training-applications` on submit. Nothing else changes.
 *
 * ## Identical for schools and instructors
 *
 * `/dashboard/instructor/courses/apply/[id]` re-exports this page. The only
 * things the viewer's domain decides are the applicant identity the API is told
 * about and where "back" goes. Nothing that is *shown* — and in particular
 * nothing commercial — is decided by it, so a school and an instructor weighing
 * the same course read the same page.
 *
 * ## Confidential by construction
 *
 * No call here reads another trainer's rate card, and there is no course-stats
 * or trainers query to read one from. The only earnings figure on the page is
 * the applicant's own arithmetic against the rate they just typed, computed in
 * the browser and sent nowhere. What the creator publishes — the fee floor and
 * the revenue split — is the creator's own term sheet, which is the thing an
 * applicant is deciding against.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useInstructor } from '@/context/instructor-context';
import { useOrganisation } from '@/context/organisation-context';
import { STALE_TIMES } from '@/lib/query-client';
import type { CourseTrainingRateCard, ProgramRequirement } from '@/services/client';
import {
  getCourseByUuidOptions,
  getCourseContentOptions,
  getCourseCreatorByUuidOptions,
  getCourseTrainingRequirementsOptions,
  getProgramRequirementsOptions,
  getTrainingProgramByUuidOptions,
  submitProgramTrainingApplicationMutation,
  submitTrainingApplicationMutation,
} from '@/services/client/@tanstack/react-query.gen';
import {
  COURSE_DEFAULT_CURRENCY,
  type CourseRecordContent,
  type CourseTrainerApplicantType,
} from '@/src/features/course-record';
import {
  ApplyToTrainView,
  COURSE_APPLY_RATE_FIELDS,
  type CourseApplyRateField,
  type CourseApplyRates,
  type CourseApplyRequirementRow,
  courseApplyRequirementRows,
} from '@/src/features/course-record/ApplyToTrainView';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { invalidateTrainingApplicationWorkflowQueries } from '@/src/features/dashboard/workflow-query-invalidation';
import { useUserProfile } from '@/src/features/profile/context/profile-context';

/** How many requirement rows the application form ever needs on screen at once. */
const REQUIREMENT_PAGE_SIZE = 200;

/**
 * Where the outline chip goes — the public course page, for both domains.
 *
 * Deliberately not the organisation's in-dashboard catalogue detail: the
 * instructor dashboard has no equivalent route, and sending a school somewhere
 * richer than an instructor is exactly the asymmetry this screen exists to
 * avoid. A programme has no such page at all, so the chip is left inert for one.
 */
const publicCourseHref = (courseUuid: string) => `/courses/${courseUuid}`;

export default function ApplyPage() {
  const params = useParams();
  const rawId = params?.courseId ?? params?.id;
  const trainingId = typeof rawId === 'string' ? rawId : (rawId?.[0] ?? '');

  const searchParams = useSearchParams();
  const isProgram = searchParams.get('kind') === 'program';

  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { replaceBreadcrumbs } = useBreadcrumb();

  /* ── who is applying ────────────────────────────────────────────────── */

  const { activeDomain } = useUserDomain();
  const isInstructorDomain = activeDomain === 'instructor';
  const organisation = useOrganisation();
  const instructor = useInstructor();
  const profile = useUserProfile();

  const applicantType: CourseTrainerApplicantType = isInstructorDomain
    ? 'instructor'
    : 'organisation';

  /*
   * `/dashboard/apply-to-train/[id]` re-exports this page too, and sits outside
   * the organisation layout — so `useOrganisation()` has no provider there and
   * answers null. The school is still knowable from the signed-in user's own
   * affiliations, and without this fallback the submit button on that route is
   * dead for every organisation applicant.
   */
  const affiliations = profile?.organisation_affiliations ?? [];
  const affiliatedOrganisationUuid = (affiliations.find(row => row.active) ?? affiliations[0])
    ?.organisation_uuid;
  const applicantUuid =
    (isInstructorDomain
      ? instructor?.uuid
      : (organisation?.uuid ?? affiliatedOrganisationUuid)) ?? '';

  const backHref = isInstructorDomain
    ? '/dashboard/instructor/courses'
    : '/dashboard/organisation/courses/catalog';
  const backLabel = isInstructorDomain ? 'Back to courses' : 'Back to catalogue';
  const successHref = isInstructorDomain
    ? '/dashboard/instructor/courses'
    : '/dashboard/organisation/my-applications';

  /* ── what is being applied for ──────────────────────────────────────── */

  const forCourse = Boolean(trainingId) && !isProgram;
  const forProgram = Boolean(trainingId) && isProgram;

  const courseQuery = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: trainingId } }),
    enabled: forCourse,
    staleTime: STALE_TIMES.entity,
  });
  const programQuery = useQuery({
    ...getTrainingProgramByUuidOptions({ path: { uuid: trainingId } }),
    enabled: forProgram,
    staleTime: STALE_TIMES.entity,
  });

  const course = courseQuery.data?.data;
  const program = programQuery.data?.data;

  const courseRequirementsQuery = useQuery({
    ...getCourseTrainingRequirementsOptions({
      path: { courseUuid: trainingId },
      query: { pageable: { page: 0, size: REQUIREMENT_PAGE_SIZE } },
    }),
    enabled: forCourse,
    staleTime: STALE_TIMES.entity,
  });
  const programRequirementsQuery = useQuery({
    ...getProgramRequirementsOptions({
      path: { programUuid: trainingId },
      query: { pageable: { page: 0, size: REQUIREMENT_PAGE_SIZE } },
    }),
    enabled: forProgram,
    staleTime: STALE_TIMES.entity,
  });

  // The curriculum's shape, for the "all N lessons and M content items" line on
  // the unlock list. This is the outline endpoint — it is what an applicant is
  // allowed to see, and it carries no lesson bodies.
  const contentQuery = useQuery({
    ...getCourseContentOptions({ path: { courseUuid: trainingId } }),
    enabled: forCourse,
    staleTime: STALE_TIMES.entity,
  });
  const content = contentQuery.data?.data as CourseRecordContent | undefined;

  const creatorUuid = (isProgram ? program : course)?.course_creator_uuid ?? '';
  const creatorQuery = useQuery({
    ...getCourseCreatorByUuidOptions({ path: { uuid: creatorUuid } }),
    enabled: Boolean(creatorUuid),
    staleTime: STALE_TIMES.entity,
  });

  /* ── the draft application ──────────────────────────────────────────── */

  const [rates, setRates] = useState<CourseApplyRates>({});
  const [notes, setNotes] = useState('');

  const setRate = (field: CourseApplyRateField, value: number | undefined) =>
    setRates(previous => ({ ...previous, [field]: value }));

  /* ── what the creator requires ──────────────────────────────────────── */

  // The paged call is the source; a course that carries its requirements inline
  // still answers when that call has not resolved (or is not served for it).
  const courseRequirements =
    courseRequirementsQuery.data?.data?.content ?? course?.training_requirements ?? undefined;
  const programRequirements = programRequirementsQuery.data?.data?.content;

  const requirements = useMemo<CourseApplyRequirementRow[]>(
    () =>
      isProgram
        ? programRequirementRows(programRequirements)
        : courseApplyRequirementRows(courseRequirements),
    [isProgram, courseRequirements, programRequirements]
  );

  const requirementsQuery = isProgram ? programRequirementsQuery : courseRequirementsQuery;

  /* ── figures the view interpolates ──────────────────────────────────── */

  const title = isProgram ? program?.title : course?.name;
  // A route with no uuid resolves to "not found" immediately: its queries never
  // run, so waiting on one of them would leave an empty form on screen forever.
  const settled = !trainingId || (isProgram ? programQuery.isFetched : courseQuery.isFetched);

  const classHours = isProgram
    ? totalHours(program?.total_duration_hours, program?.total_duration_minutes)
    : totalHours(course?.duration_hours, course?.duration_minutes);
  const classSize = (isProgram ? program?.class_limit : course?.class_limit) ?? undefined;

  const lessonCount = content?.total_lessons ?? content?.lessons?.length;
  // A zero is not a count the unlock line should state — "0 content items, in
  // full" is worse than dropping the line, which is what an absent token does.
  const contentItemCount =
    content?.lessons?.reduce(
      (total, lesson) => total + (lesson.content_count ?? lesson.contents?.length ?? 0),
      0
    ) || undefined;

  /* ── submitting ─────────────────────────────────────────────────────── */

  const courseSubmit = useMutation(submitTrainingApplicationMutation());
  const programSubmit = useMutation(submitProgramTrainingApplicationMutation());
  const submitting = courseSubmit.isPending || programSubmit.isPending;

  const submit = () => {
    const blockers: string[] = [];

    if (!title) {
      blockers.push(
        isProgram ? 'The programme has not loaded yet.' : 'The course has not loaded yet.'
      );
    }
    if (!applicantUuid) {
      blockers.push(
        isInstructorDomain
          ? 'Your instructor profile is still loading.'
          : 'Your organisation profile is still loading.'
      );
    }
    if (!COURSE_APPLY_RATE_FIELDS.some(({ field }) => (rates[field] ?? 0) > 0)) {
      blockers.push('Quote at least one hourly rate — the creator decides on your rate card.');
    }

    if (blockers.length > 0) {
      toast.error('Not ready to submit', { description: blockers.join(' ') });
      return;
    }

    const body = {
      applicant_type: applicantType,
      applicant_uuid: applicantUuid,
      rate_card: buildRateCard(rates),
      application_notes: notes.trim() || null,
    };

    const onSuccess = async () => {
      await invalidateTrainingApplicationWorkflowQueries(queryClient);
      toast.success('Application submitted', {
        description: `Your application to train ${title} is under review.`,
      });
      router.push(successHref);
    };
    const onError = () => {
      toast.error('Could not submit application', {
        description: 'Please review your rate card and notes, then try again.',
      });
    };

    if (isProgram) {
      programSubmit.mutate({ path: { programUuid: trainingId }, body }, { onSuccess, onError });
    } else {
      courseSubmit.mutate({ path: { courseUuid: trainingId }, body }, { onSuccess, onError });
    }
  };

  /* ── chrome ─────────────────────────────────────────────────────────── */

  /*
   * A new tab, not a navigation. The draft rate card and the notes live in this
   * component's state, so following the outline in place and coming back would
   * throw away everything typed so far — the one click on the page most likely
   * to be made halfway through filling it in.
   */
  const viewOutline = () => {
    window.open(publicCourseHref(trainingId), '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    const dashboard = isInstructorDomain ? 'instructor' : 'organisation';
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: `/dashboard/${dashboard}/overview` },
      { id: 'opportunities', title: 'Training opportunities', url: backHref },
      // Three routes re-export this page; the last crumb is wherever we are.
      { id: 'apply', title: 'Apply to train', url: pathname, isLast: true },
    ]);
  }, [replaceBreadcrumbs, isInstructorDomain, backHref, pathname]);

  // Only a settled query that found nothing is a reason not to render the form.
  // Everything else fills in as it arrives.
  if (settled && !title) {
    return (
      <div className='text-muted-foreground p-8 text-center text-sm'>
        {isProgram ? 'Programme' : 'Course'} not found.{' '}
        <Link href={backHref} className='text-primary hover:underline'>
          {backLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className='mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]'>
      <Link
        href={backHref}
        className='text-muted-foreground hover:text-foreground mb-4 inline-flex h-8 items-center gap-2 rounded-[10px] text-sm font-medium transition-colors'
      >
        <ArrowLeft className='size-4' />
        {backLabel}
      </Link>

      <ApplyToTrainView
        courseTitle={title}
        creatorName={creatorQuery.data?.full_name}
        applicantType={applicantType}
        onViewOutline={isProgram ? undefined : viewOutline}
        requirements={requirements}
        loading={requirementsQuery.isLoading && requirements.length === 0}
        error={requirementsQuery.error}
        onRetry={() => void requirementsQuery.refetch()}
        rates={rates}
        onRateChange={setRate}
        minimumTrainingFee={isProgram ? undefined : (course?.minimum_training_fee ?? undefined)}
        currency={COURSE_DEFAULT_CURRENCY}
        notes={notes}
        onNotesChange={setNotes}
        onSubmit={submit}
        submitting={submitting}
        classHours={classHours}
        classSize={classSize}
        creatorSharePercentage={isProgram ? undefined : course?.creator_share_percentage}
        earningsAsync={{
          loading: isProgram ? programQuery.isLoading : courseQuery.isLoading,
          error: isProgram ? programQuery.error : courseQuery.error,
          onRetry: () => void (isProgram ? programQuery.refetch() : courseQuery.refetch()),
        }}
        vars={{ lessons: lessonCount, contentItems: contentItemCount }}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Composing
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * A programme's requirements as the form's tiles.
 *
 * `ProgramRequirement` is a different shape from a course's — one sentence and a
 * category, with no `provided_by` and no quantity — so it is mapped here rather
 * than pushed through `courseApplyRequirementRows`. A mandatory one reads as
 * outstanding for the same reason it does on a course: it is the applicant's to
 * satisfy and nobody has yet said they do.
 */
function programRequirementRows(
  requirements: readonly ProgramRequirement[] | undefined
): CourseApplyRequirementRow[] {
  return (requirements ?? []).map((requirement, index) => ({
    id: requirement.uuid ?? `${requirement.requirement_text}-${index}`,
    label: requirement.requirement_text,
    note: [
      requirement.is_mandatory === true ? 'Mandatory.' : 'Optional.',
      requirement.requirement_category ?? requirement.requirement_type,
    ]
      .filter(Boolean)
      .join(' '),
    met: requirement.is_mandatory !== true,
  }));
}

/**
 * The rate card as the API takes it.
 *
 * The four hourly rates are required by the schema, so a format the applicant
 * did not quote is sent as `0` — the same "not offered" the previous wizard
 * sent, and what makes them ineligible for work contracted that way rather than
 * quietly priced at a guess.
 */
function buildRateCard(rates: CourseApplyRates): CourseTrainingRateCard {
  return {
    currency: COURSE_DEFAULT_CURRENCY,
    private_online_hourly_rate: rates.private_online_hourly_rate ?? 0,
    private_inperson_hourly_rate: rates.private_inperson_hourly_rate ?? 0,
    group_online_hourly_rate: rates.group_online_hourly_rate ?? 0,
    group_inperson_hourly_rate: rates.group_inperson_hourly_rate ?? 0,
  };
}

/** Teaching hours in one class, or `undefined` when the duration is not published. */
function totalHours(hours: number | undefined, minutes: number | undefined): number | undefined {
  const total = (hours ?? 0) + (minutes ?? 0) / 60;
  return total > 0 ? total : undefined;
}
