'use client';

/**
 * Apply to train — a trainer's application to deliver a course or a programme.
 *
 * The page does two jobs and keeps them apart, because they answer two
 * different questions:
 *
 * 1. **Should I apply?** — the shared course record (`CourseRecordPage`): the
 *    hero, the KPI band, the syllabus outline, the commercial terms, the gate
 *    banner. It owns its own fetching and its own per-region loading and error
 *    states, and it is never told who is looking — the API's `access` string
 *    resolves an applicant to `applicant` and withholds the teaching material.
 *
 * 2. **On what terms?** — `ApplyWizard`, five steps, owned by this route. The
 *    record view is read-only by design; an action belongs to the route.
 *
 * ## One screen, two content kinds
 *
 * `?kind=program` swaps the course for a training programme end to end:
 * `GET /programs/{uuid}`, its requirements, and
 * `POST /programs/{uuid}/training-applications` on submit. The record view is
 * course-only, so a programme keeps a plain header instead — the wizard is
 * identical either way, except that a programme's requirements are read rather
 * than answered.
 *
 * ## Identical for schools and instructors
 *
 * `/dashboard/instructor/courses/apply/[id]` and `/dashboard/apply-to-train/[id]`
 * both re-export this page. The viewer's domain decides exactly three things:
 * the applicant identity the API is told about, where "back" goes, and where a
 * successful submission lands. Nothing that is *shown* depends on it, so a
 * school and an instructor weighing the same course read the same page.
 *
 * ## Confidential by construction
 *
 * No query here reads another trainer's rate card, pay or margin, and there is
 * no tile deriving what anyone else earns. The only figures on the page are the
 * creator's own published terms and the amounts the applicant is typing.
 *
 * ## What the API takes, and what it does not
 *
 * The application payload is a rate card and a notes string. The classroom
 * names and photos, the per-unit equipment serials and the lease/hire choices
 * have no field of their own on it — they are captured, validated, shown back
 * on Review, and summarised into `application_notes`, which is what the
 * creator's approval screen reads. Widening the payload needs a backend change.
 */

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef } from 'react';

import { AsyncSection } from '@/components/data/async-section';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useInstructor } from '@/context/instructor-context';
import { useOrganisation } from '@/context/organisation-context';
import { STALE_TIMES } from '@/lib/query-client';
import type { CourseTrainingRequirement, ProgramRequirement } from '@/services/client';
import {
  getCourseByUuidOptions,
  getCourseTrainingRequirementsOptions,
  getProgramRequirementsOptions,
  getTrainingProgramByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { CourseRecordPage, type CourseTrainerApplicantType } from '@/src/features/course-record';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { useUserProfile } from '@/src/features/profile/context/profile-context';

import { isOrganisationTrainingRequirement } from './_components/apply-model';
import { ApplyWizard } from './_components/apply-wizard';

/** How many requirement rows the application form ever needs on screen at once. */
const REQUIREMENT_PAGE_SIZE = 200;

export default function ApplyPage() {
  const applyWizardRef = useRef<HTMLElement>(null);
  const params = useParams<{ courseId?: string; id?: string }>();
  const trainingId = params?.courseId ?? params?.id ?? '';

  const searchParams = useSearchParams();
  const isProgram = searchParams.get('kind') === 'program';

  const router = useRouter();
  const pathname = usePathname();
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
   * `/dashboard/apply-to-train/[id]` re-exports this page and sits outside the
   * organisation layout — `useOrganisation()` has no provider there and answers
   * null. The school is still knowable from the signed-in user's own
   * affiliations, and without this fallback the submit button on that route is
   * dead for every organisation applicant.
   */
  const affiliations = profile?.organisation_affiliations ?? [];
  const affiliatedOrganisationUuid = (affiliations.find(row => row.active) ?? affiliations[0])
    ?.organisation_uuid;
  const applicantUuid =
    (isInstructorDomain ? instructor?.uuid : (organisation?.uuid ?? affiliatedOrganisationUuid)) ??
    '';

  const backHref = isInstructorDomain
    ? '/dashboard/instructor/courses'
    : '/dashboard/organisation/courses/catalog';
  const backLabel = isInstructorDomain ? 'Back to courses' : 'Back to catalog';
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

  /* ── what the creator requires ──────────────────────────────────────── */

  // The paged call is the source; a course that carries its requirements inline
  // still answers when that call has not resolved (or is not served for it).
  const courseRequirements = useMemo<CourseTrainingRequirement[]>(
    () => courseRequirementsQuery.data?.data?.content ?? course?.training_requirements ?? [],
    [courseRequirementsQuery.data?.data?.content, course?.training_requirements]
  );

  /*
   * Only what the applicant is on the hook for. A requirement the student
   * brings, or the creator supplies, is not a question to put to a school —
   * and every downstream count (the Review strip, the "Equipment ready: 3/5"
   * in the notes) is against this same list, so they cannot disagree.
   */
  const requirements = useMemo(
    () => courseRequirements.filter(isOrganisationTrainingRequirement),
    [courseRequirements]
  );

  const programRequirements = useMemo<ProgramRequirement[]>(
    () => programRequirementsQuery.data?.data?.content ?? [],
    [programRequirementsQuery.data?.data?.content]
  );

  const requirementsQuery = isProgram ? programRequirementsQuery : courseRequirementsQuery;
  const requirementRowCount = isProgram ? programRequirements.length : requirements.length;

  /* ── chrome ─────────────────────────────────────────────────────────── */

  const contentTitle = (isProgram ? program?.title : course?.name) ?? '';

  /*
   * "Not found" means the server answered and had nothing — not that the call
   * failed, which is a region's own problem to report and retry. A route with
   * no uuid is the one case decided without asking: its queries never run, so
   * waiting on one would leave an empty form on screen forever.
   */
  const notFound =
    !trainingId ||
    (isProgram ? programQuery.isSuccess && !program : courseQuery.isSuccess && !course);

  useEffect(() => {
    const dashboard = isInstructorDomain ? 'instructor' : 'organisation';
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: `/dashboard/${dashboard}/overview` },
      { id: 'opportunities', title: 'Training opportunities', url: backHref },
      // Three routes re-export this page; the last crumb is wherever we are.
      { id: 'apply', title: 'Apply to train', url: pathname, isLast: true },
    ]);
  }, [replaceBreadcrumbs, isInstructorDomain, backHref, pathname]);

  // Everything still in flight fills in region by region — no page-wide spinner.
  if (notFound) {
    return (
      <div className='text-muted-foreground p-8 text-center text-sm'>
        {isProgram ? 'Program' : 'Course'} not found.{' '}
        <Link href={backHref} className='text-primary hover:underline'>
          {backLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className='mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]'>
      {isProgram ? (
        // No record view exists for a programme — it is a course-shaped feature.
        // The header is what a programme applicant gets to decide against, and
        // it resolves itself rather than holding the wizard behind a spinner.
        <AsyncSection
          loading={programQuery.isLoading && !program}
          error={programQuery.error}
          onRetry={() => void programQuery.refetch()}
          errorTitle='Couldn’t load this program'
          skeleton={<Skeleton className='h-16 w-full' />}
        >
          <PageHeader
            title={`Apply to train: ${contentTitle || 'Untitled'}`}
            description={`${program?.program_type ?? 'Program'} · ${program?.total_duration_display ?? '—'}`}
            action={
              <Button asChild variant='ghost' size='sm'>
                <Link href={backHref}>
                  <ArrowLeft className='mr-2 h-4 w-4' /> {backLabel}
                </Link>
              </Button>
            }
          />
        </AsyncSection>
      ) : (
        <CourseRecordPage
          courseUuid={trainingId}
          backHref={backHref}
          onPrimaryAction={() => {
            applyWizardRef.current?.focus({ preventScroll: true });
            applyWizardRef.current?.scrollIntoView({
              behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                ? 'instant'
                : 'smooth',
              block: 'start',
            });
          }}
        />
      )}

      <section
        ref={applyWizardRef}
        id='apply-wizard'
        tabIndex={-1}
        aria-labelledby='apply-heading'
        className='scroll-mt-24 space-y-4 border-t pt-6'
      >
        <div>
          <h2 id='apply-heading' className='text-lg font-semibold'>
            Apply to train {contentTitle || (isProgram ? 'this program' : 'this course')}
          </h2>
          <p className='text-muted-foreground text-sm'>
            Tell the {isProgram ? 'program' : 'course'} creator how you would deliver it, what you
            can provide, and what you would charge.
          </p>
        </div>

        <ApplyWizard
          trainingId={trainingId}
          isProgram={isProgram}
          contentTitle={contentTitle}
          applicantType={applicantType}
          applicantUuid={applicantUuid}
          requirements={requirements}
          programRequirements={programRequirements}
          requirementsLoading={requirementsQuery.isLoading && requirementRowCount === 0}
          requirementsError={requirementsQuery.error}
          onRetryRequirements={() => void requirementsQuery.refetch()}
          onSubmitted={() => router.push(successHref)}
        />
      </section>
    </div>
  );
}
