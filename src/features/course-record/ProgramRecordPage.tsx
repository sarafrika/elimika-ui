'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect } from 'react';

import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { STALE_TIMES } from '@/lib/query-client';
import {
    getCategoryByUuidOptions,
    getProgramCoursesOptions,
    getProgramEnrollmentsOptions,
    getTrainingProgramByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { CourseRecordView } from '@/src/features/course-record/CourseRecordView';

export interface ProgramRecordPageProps {
    programUuid: string;
    backHref?: string;
}

export function ProgramRecordPage({ programUuid, backHref }: ProgramRecordPageProps) {
    const { replaceBreadcrumbs } = useBreadcrumb();
    const programQuery = useQuery({
        ...getTrainingProgramByUuidOptions({ path: { uuid: programUuid } }),
        enabled: !!programUuid,
        staleTime: STALE_TIMES.entity,
    });

    const program = programQuery.data?.data;

    const coursesQuery = useQuery({
        ...getProgramCoursesOptions({ path: { programUuid } }),
        enabled: !!programUuid,
        staleTime: STALE_TIMES.reference,
    });

    const enrollmentsQuery = useQuery({
        ...getProgramEnrollmentsOptions({ path: { programUuid }, query: { pageable: {} } }),
        enabled: !!programUuid,
    });

    const courses = coursesQuery.data?.data ?? [];
    const enrollments = enrollmentsQuery.data?.data?.content ?? [];

    const categoryUuid = program?.category_uuid;
    const categoryQuery = useQuery({
        ...getCategoryByUuidOptions({ path: { uuid: categoryUuid ?? '' } }),
        enabled: !!categoryUuid,
        staleTime: STALE_TIMES.reference,
    });

    const categoryName = categoryQuery.data?.data?.name;

    const totalCourses = courses.length;

    useEffect(() => {
        replaceBreadcrumbs([
            { id: 'dashboard', title: 'Dashboard', url: '/dashboard/course-creator/overview' },
            { id: 'programs', title: 'Programs', url: '/dashboard/course-creator/course-management' },
            {
                id: 'program-details',
                title: program?.title ?? 'Program',
                url: `/dashboard/course-creator/course-management/programs/${program?.uuid}`,
                isLast: true,
            },
        ]);
    }, [replaceBreadcrumbs, program?.title, program?.uuid]);

    const hero = {
        title: program?.title,
        summary: program?.description ?? undefined,
        categories: categoryName ? [categoryName] : undefined,
        status: program?.status,
        creatorName: program?.created_by ?? undefined,
        creatorRole: undefined,
        averageRating: undefined,
        totalReviews: undefined,
        enrolledCount: enrollments.length,
        lessonCount: undefined,
        contentItemCount: undefined,
        contentCountNote: undefined,
        duration: program?.total_duration_display ?? undefined,
        level: program?.program_type ?? undefined,
    };

    const overviewPanel = (
        <div className='space-y-4'>
            <div className='border-border bg-card rounded-lg border p-4'>
                <h3 className='text-foreground mb-2 text-base font-semibold'>Learning Objectives</h3>
                <p className='text-muted-foreground text-sm whitespace-pre-wrap'>{program?.objectives || 'No objectives specified'}</p>
            </div>
            <div className='border-border bg-card rounded-lg border p-4'>
                <h3 className='text-foreground mb-2 text-base font-semibold'>Prerequisites</h3>
                <p className='text-muted-foreground text-sm whitespace-pre-wrap'>{program?.prerequisites || 'No prerequisites specified'}</p>
            </div>
        </div>
    );

    const curriculumPanel = (
        <div className='space-y-3'>
            {courses.length === 0 ? (
                <div className='border-border rounded-lg border-2 border-dashed py-8 text-center'>
                    <p className='text-muted-foreground text-sm'>No courses in this program</p>
                </div>
            ) : (
                courses.map((c: any, idx: number) => (
                    <div key={c.uuid ?? idx} className='border-border bg-card rounded-lg border p-3'>
                        <div className='flex gap-3'>
                            <div className='bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold'>
                                {idx + 1}
                            </div>
                            <div className='min-w-0 flex-1'>
                                <h4 className='text-foreground mb-1 text-sm font-semibold'>{c.name || 'Untitled course'}</h4>
                                <div className='text-muted-foreground mb-2 text-xs'>{c.category_names?.join(', ')}</div>
                                <div className='flex items-center gap-2 text-xs text-muted-foreground mb-2'>
                                    {c.total_duration_display ? (
                                        <span className='rounded-full border border-muted px-2 py-0.5'>{c.total_duration_display}</span>
                                    ) : null}
                                    {c.has_prerequisites ? <span className='rounded-full border border-muted px-2 py-0.5'>Prerequisites</span> : null}
                                    {c.curriculum_summary ? <span className='text-muted-foreground'>· {c.curriculum_summary}</span> : null}
                                </div>
                                <p className='text-muted-foreground line-clamp-3 text-xs' dangerouslySetInnerHTML={{ __html: c.description ?? '' }} />
                                {c.uuid && (
                                    <div className='mt-2'>
                                        <Link href={`/dashboard/course-creator/course-management/preview/${c.uuid}`} className='text-primary underline'>View course details</Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    const kpiBand = (
        <div className='grid grid-cols-2 gap-2 sm:grid-cols-4 mb-2'>
            <div className='bg-card rounded-lg p-3'>
                <div className='text-xs text-muted-foreground'>Price</div>
                <div className='font-bold'>{program?.price ? new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(program.price) : 'Free'}</div>
            </div>
            <div className='bg-card rounded-lg p-3'>
                <div className='text-xs text-muted-foreground'>Class limit</div>
                <div className='font-bold'>{program?.class_limit ?? '—'}</div>
            </div>
            <div className='bg-card rounded-lg p-3'>
                <div className='text-xs text-muted-foreground'>Total duration</div>
                <div className='font-bold'>{program?.total_duration_display ?? '—'}</div>
            </div>
            <div className='bg-card rounded-lg p-3'>
                <div className='text-xs text-muted-foreground'>Type</div>
                <div className='font-bold'>{program?.program_type ?? '—'}</div>
            </div>
        </div>
    );

    //   const kpiBand =
    //     capability.kpi === null ? undefined : (
    //       <KpiBand
    //         access={access}
    //         stats={stats}
    //         priceFrom={course?.price ?? undefined}
    //         classesOpenNow={openClassCount}
    //         nextClassStarts={nextClassStarts}
    //         {...asyncProps(record.stats)}
    //       />
    //     );

    const tabPanels = {
        overview: overviewPanel,
        curriculum: curriculumPanel,
    } as const;

    return (
        <CourseRecordView
            access={'prospect'}
            hero={hero}
            courseName={program?.title}
            backHref={backHref}
            primaryAction={undefined}
            onShare={undefined}
            onExport={undefined}
            kpiBand={kpiBand}
            tabPanels={tabPanels}
            tabCounts={{ curriculum: totalCourses }}
        />
    );
}

export default ProgramRecordPage;
