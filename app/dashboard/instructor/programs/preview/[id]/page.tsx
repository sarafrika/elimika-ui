// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, CheckCheck, Clock, CoinsIcon, Trash, Users } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import DeleteModal from '@/components/custom-modals/delete-modal';
import { type EntityFact, EntityHeaderCard } from '@/components/data-display/entity-header-card';
import { surfaceTheme } from '@/components/data-display/page-shell';
import {
  type SectionTab,
  SectionTabPanel,
  SectionTabs,
  useSectionTab,
} from '@/components/data-display/section-tabs';
import HTMLTextPreview from '@/components/editors/html-text-preview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useUserProfile } from '@/context/profile-context';
import {
  deleteProgramRequirementMutation,
  getProgramCertificatesOptions,
  getProgramCoursesOptions,
  getProgramCoursesQueryKey,
  getProgramRequirementsOptions,
  getProgramRequirementsQueryKey,
  getTrainingProgramByUuidOptions,
  publishProgramMutation,
  removeProgramCourseMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { Course } from '@/services/client/types.gen';
import { invalidateContentModerationWorkflowQueries } from '@/src/features/dashboard/workflow-query-invalidation';
import { AddProgramCourseDialog } from '../../../../course-creator/_components/program-management-form';

const PREVIEW_TABS = ['overview', 'courses'] as const;
type PreviewTab = (typeof PREVIEW_TABS)[number];

export default function ProgramPreviewPage() {
  const params = useParams();
  const programId = params?.id as string;
  const qc = useQueryClient();
  const user = useUserProfile();
  const { value: tab, setValue: setTab, hrefFor } = useSectionTab(PREVIEW_TABS, 'overview');

  // GET TRAINING PROGRAM BY ID
  const { data, isLoading, isFetching } = useQuery(
    getTrainingProgramByUuidOptions({ path: { uuid: programId } })
  );
  const programData = data?.data;

  // GET PROGRAM REQUIREMENT
  const { data: programRequirement } = useQuery(
    getProgramRequirementsOptions({ path: { programUuid: programId }, query: { pageable: {} } })
  );

  // GET TRAINING PROGRAM COURSES
  const { data: programCourses } = useQuery(
    getProgramCoursesOptions({ path: { programUuid: programId } })
  );

  // GET PROGRAM CERTIFICATES
  const { data: programCertificates } = useQuery(
    getProgramCertificatesOptions({ path: { programUuid: programId }, query: { pageable: {} } })
  );

  const { replaceBreadcrumbs } = useBreadcrumb();
  useEffect(() => {
    const title =
      isLoading || isFetching || !programData?.title
        ? 'Preview - ...'
        : `Preview - ${programData.title}`;

    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/instructor/overview' },
      { id: 'programs', title: 'Programs', url: '/dashboard/instructor/programs' },
      {
        id: 'preview',
        title,
        url: `/dashboard/instructor/programs/preview/${programId}`,
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs, programId, programData?.title, isLoading, isFetching]);

  const [isAddClassCourseDialog, setIsAddClassCourseDialog] = useState(false);
  const openAddClassCourseDialog = () => {
    setIsAddClassCourseDialog(true);
  };

  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const confirmDelete = (course: Course) => {
    setCourseToDelete(course);
    setIsDialogOpen(true);
  };

  // MUTATION
  const removeProgramCourse = useMutation(removeProgramCourseMutation());
  const handleConfirm = () => {
    if (courseToDelete) {
      removeProgramCourse.mutate(
        { path: { courseUuid: courseToDelete?.uuid, programUuid: programId } },
        {
          onSuccess: () => {
            toast.success('');
            setIsDialogOpen(false);
            setCourseToDelete(null);
            qc.invalidateQueries({
              queryKey: getProgramCoursesQueryKey({ path: { programUuid: programId } }),
            });
          },
          onError: error => {
            toast.error(error?.message);
          },
        }
      );
    }
  };

  const deleteRequirement = useMutation(deleteProgramRequirementMutation());
  const handleDeleteRequirement = (requirementId: string) => {
    deleteRequirement.mutate(
      { path: { programUuid: programId, requirementUuid: requirementId } },
      {
        onSuccess: () => {
          qc.invalidateQueries({
            queryKey: getProgramRequirementsQueryKey({
              path: { programUuid: programId },
              query: { pageable: {} },
            }),
          });
          toast.success('Program requirement deleted successfully');
        },
      }
    );
  };

  const publishProgram = useMutation(publishProgramMutation());
  const handlePublishProgram = () => {
    if (!programId) return;

    publishProgram.mutate(
      { path: { uuid: programId } },
      {
        async onSuccess(data) {
          toast.success(data?.message);
          await invalidateContentModerationWorkflowQueries(qc);
        },
        onError: error => {
          toast.error(error?.message);
        },
      }
    );
  };

  if (isLoading)
    return (
      <div className='flex flex-col gap-4'>
        <Skeleton className='h-44 w-full rounded-2xl' />
        <Skeleton className='h-12 w-full rounded-2xl' />
        <Skeleton className='h-64 w-full rounded-2xl' />
      </div>
    );

  const courses = programCourses?.data ?? [];
  const requirements = programRequirement?.data?.content ?? [];

  const facts: EntityFact[] = [
    {
      key: 'size',
      icon: Users,
      label:
        programData?.class_limit === 0
          ? 'Unlimited students'
          : `Up to ${programData?.class_limit ?? '—'} students`,
    },
  ];
  if (programData?.total_duration_display) {
    facts.push({
      key: 'duration',
      icon: Clock,
      label: `Approx. ${programData.total_duration_display}`,
    });
  }
  if (programData?.price != null) {
    facts.push({ key: 'price', icon: CoinsIcon, value: programData.price, label: 'KES' });
  }
  facts.push({
    key: 'courses',
    icon: BookOpen,
    value: courses.length,
    label: courses.length === 1 ? 'course' : 'courses',
  });

  const tabs: SectionTab<PreviewTab>[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'courses', label: 'Courses', count: courses.length },
  ];

  return (
    <div className='mb-10 flex flex-col gap-[18px]'>
      <EntityHeaderCard
        title={programData?.title ?? '—'}
        eyebrow='Programme preview'
        badges={
          programData?.status ? (
            <Badge variant='outline' className='capitalize'>
              {String(programData.status).toLowerCase()}
            </Badge>
          ) : null
        }
        description={
          programData?.description ? (
            <div className='line-clamp-3'>
              <HTMLTextPreview htmlContent={programData.description as string} />
            </div>
          ) : null
        }
        context={
          <div className='text-muted-foreground flex flex-wrap items-center gap-2'>
            <span>Instructor:</span>
            <Badge variant='outline'>{user?.display_name}</Badge>
            {user?.instructor?.professional_headline ? (
              <span className='text-xs'>({user.instructor.professional_headline})</span>
            ) : null}
          </div>
        }
        facts={facts}
        aside={
          <div className='bg-muted/40 flex h-full flex-col gap-3 rounded-[14px] border p-[18px]'>
            <span className={surfaceTheme.sectionLabel}>Ready to go live?</span>
            <p className='text-muted-foreground text-sm'>
              Publishing sends the programme for review and lists it once approved.
            </p>
            <div className='grow' />
            <Button onClick={handlePublishProgram} className='h-10 w-full rounded-[10px]'>
              {publishProgram?.isPending ? <Spinner /> : 'Publish Program'}
            </Button>
          </div>
        }
      />

      <SectionTabs
        tabs={tabs}
        value={tab}
        onValueChange={setTab}
        hrefFor={hrefFor}
        label='Programme sections'
        variant='pill'
        sticky
      >
        <SectionTabPanel value='overview' className='print:data-[state=inactive]:block!'>
          <div className='grid items-start gap-[22px] xl:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle>What You’ll Learn</CardTitle>
                <CardDescription>Key learning outcomes of this program</CardDescription>
              </CardHeader>
              <CardContent className='max-w-prose'>
                <HTMLTextPreview htmlContent={programData?.objectives as string} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Before you start</CardTitle>
                <CardDescription>Prerequisites and requirements</CardDescription>
              </CardHeader>
              <CardContent className='flex max-w-prose flex-col gap-4 text-sm'>
                <div className='flex flex-col gap-1.5'>
                  <span className='text-foreground font-semibold'>Pre-requisites</span>
                  <span className='text-muted-foreground'>
                    {programData?.prerequisites || 'None specified'}
                  </span>
                </div>
                <div className='flex flex-col gap-1.5'>
                  <span className='text-foreground font-semibold'>Requirements</span>
                  {requirements.length === 0 ? (
                    <span className='text-muted-foreground'>None specified</span>
                  ) : (
                    requirements.map((r, i) => (
                      <div
                        key={r.uuid ?? i}
                        className='group text-muted-foreground relative flex items-center gap-2 py-1 pr-8'
                      >
                        <CheckCheck className='h-4 w-4 min-w-4 self-start' />
                        <div>
                          {r?.requirement_type} - {r.requirement_text}
                        </div>
                        <button
                          type='button'
                          onClick={() => handleDeleteRequirement(r.uuid)}
                          className='text-muted-foreground hover:text-destructive absolute right-0 px-2 opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100'
                          aria-label='Delete requirement'
                        >
                          <Trash className='h-4 w-4' />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </SectionTabPanel>

        <SectionTabPanel value='courses' className='print:data-[state=inactive]:block!'>
          {courses.length === 0 ? (
            <div className='bg-muted/20 rounded-md border py-8 text-center'>
              <BookOpen className='text-muted-foreground mx-auto h-8 w-8' />
              <h3 className='mt-4 text-base font-medium'>No added courses</h3>
              <p className='text-muted-foreground mt-2 text-sm'>
                You don&apos;t have any courses added to this program.
              </p>
              <Button className='mt-4' onClick={openAddClassCourseDialog}>
                Add Your First Course
              </Button>
            </div>
          ) : (
            <div className={surfaceTheme.cardGrid}>
              {courses.map((c, i) => (
                <Card key={c.uuid ?? i} className='gap-3 py-4'>
                  <CardContent className='flex flex-col gap-2 px-4'>
                    <div className='flex items-start justify-between gap-2'>
                      <h3 className='flex items-center gap-2 text-base font-semibold'>
                        <BookOpen className='text-primary h-4 w-4 shrink-0' />
                        {c?.name}
                      </h3>
                      <button
                        type='button'
                        onClick={() => confirmDelete(c)}
                        className='text-destructive hover:text-destructive/80 cursor-pointer'
                        aria-label='Remove course'
                      >
                        <Trash className='h-4 w-4' />
                      </button>
                    </div>
                    <div className='text-muted-foreground line-clamp-3 text-sm'>
                      <HTMLTextPreview htmlContent={c?.description as string} />
                    </div>
                    {c?.total_duration_display ? (
                      <Badge className='w-fit' variant='secondary'>
                        {c.total_duration_display}
                      </Badge>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </SectionTabPanel>
      </SectionTabs>

      <AddProgramCourseDialog
        isOpen={isAddClassCourseDialog}
        onOpenChange={setIsAddClassCourseDialog}
        programId={programId}
        onSuccess={() => {}}
      />

      {/* Confirm Remove Program Course Modal */}
      <DeleteModal
        open={isDialogOpen}
        setOpen={setIsDialogOpen}
        title='Confirm Deletion'
        description={
          <>
            Are you sure you want to remove{' '}
            <span className='font-semibold'>&quot;{courseToDelete?.name}&quot;</span> from this
            program? This action cannot be undone.
          </>
        }
        onConfirm={handleConfirm}
        isLoading={removeProgramCourse?.isPending}
        confirmText='Delete'
      />
    </div>
  );
}
