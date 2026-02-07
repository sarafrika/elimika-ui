'use client';

import { useQuery } from '@tanstack/react-query';
import { Pen, Users } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '../../../../../components/ui/button';
import { useBreadcrumb } from '../../../../../context/breadcrumb-provider';
import {
    getProgramCoursesOptions,
    getProgramEnrollmentsOptions,
    getTrainingProgramByUuidOptions,
} from '../../../../../services/client/@tanstack/react-query.gen';

const ProgramPreview = ({ onEdit }: any) => {
    const router = useRouter()
    const params = useParams()
    const programUuid = params?.id

    const { replaceBreadcrumbs } = useBreadcrumb();


    const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'enrollments'>(
        'overview'
    );

    const { data, isLoading: programLoading } = useQuery({
        ...getTrainingProgramByUuidOptions({ path: { uuid: programUuid } }),
        enabled: !!programUuid,
    });
    const program = data?.data

    useEffect(() => {
        replaceBreadcrumbs([
            { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
            {
                id: 'programs',
                title: 'Programs',
                url: '/dashboard/programs',
            },
            {
                id: 'program-details',
                title: `${program?.title}`,
                url: `/dashboard/programs/${program?.uuid}`,
                isLast: true,
            },
        ]);
    }, [replaceBreadcrumbs]);

    const { data: programCourses, isLoading: coursesLoading } = useQuery({
        ...getProgramCoursesOptions({ path: { programUuid } }),
        enabled: !!programUuid,
    });

    const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery({
        ...getProgramEnrollmentsOptions({
            path: { programUuid },
            query: { pageable: {} },
        }),
        enabled: !!programUuid,
    });

    if (programLoading) {
        return (
            <div className='flex h-96 items-center justify-center'>
                <div className='text-muted-foreground'>Loading program details…</div>
            </div>
        );
    }

    if (!program) {
        return (
            <div className='flex h-96 items-center justify-center'>
                <div className='text-muted-foreground'>Program not found</div>
            </div>
        );
    }

    const enrollments = enrollmentsData?.data?.content || [];
    const courses = programCourses?.data || [];

    const getStatusClasses = (status: string) => {
        switch (status) {
            case 'PUBLISHED':
                return 'bg-primary/10 text-primary';
            case 'DRAFT':
                return 'bg-muted text-foreground';
            case 'ARCHIVED':
                return 'bg-secondary text-secondary-foreground';
            default:
                return 'bg-muted text-muted-foreground';
        }
    };

    return (
        <div className=''>
            {/* Header */}
            <div className='mb-4 md:mb-6'>
                <button
                    onClick={() => router.push('/dashboard/programs')}
                    className='mb- py-4 flex items-center gap-2 text-sm text-primary hover:underline md:mb-4 md:text-base'
                >
                    ← Back
                </button>

                <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4'>
                    <div className='flex-1'>
                        <div className='mb-2 flex flex-col gap-2 md:flex-row md:items-center md:gap-3'>
                            <h1 className='text-xl font-bold text-foreground md:text-2xl'>
                                {program?.title}
                            </h1>
                            <span
                                className={`self-start rounded-full px-2.5 py-0.5 text-xs font-medium md:px-3 md:py-1 md:text-sm ${getStatusClasses(
                                    program?.status
                                )}`}
                            >
                                {program?.status}
                            </span>
                        </div>

                        {program?.program_type && (
                            <p className='mb-1.5 text-xs text-muted-foreground md:mb-2 md:text-sm'>
                                {program?.program_type}
                            </p>
                        )}

                        <p className='text-sm text-muted-foreground md:text-base'>
                            {program?.description}
                        </p>
                    </div>

                    <Button
                        onClick={() => onEdit(program)}
                        className='w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 md:w-auto md:text-base'
                    >
                        <Pen /> Edit
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className='mb-4 grid grid-cols-2 gap-2 md:mb-6 md:grid-cols-4 md:gap-4'>
                {[
                    { label: 'Total Courses', value: courses.length },
                    { label: 'Enrolled Students', value: enrollments.length },
                    {
                        label: 'Available Spots',
                        value: program?.class_limit - enrollments.length,
                    },
                    { label: 'Price', value: `KES ${program?.price}` },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className='rounded-lg border border-border bg-card p-3 md:p-4'
                    >
                        <div className='text-xs text-muted-foreground md:text-sm'>
                            {stat.label}
                        </div>
                        <div className='text-lg font-bold text-foreground md:text-2xl'>
                            {stat.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className='mb-4 border-b border-border md:mb-6'>
                <div className='flex gap-3 overflow-x-auto md:gap-6'>
                    {(['overview', 'courses', 'enrollments'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium md:py-3 md:text-base ${activeTab === tab
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            {tab === 'courses' && ` (${courses.length})`}
                            {tab === 'enrollments' && ` (${enrollments.length})`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Overview */}
            {activeTab === 'overview' && (
                <div className='space-y-4 md:space-y-6'>
                    {[
                        { title: 'Learning Objectives', value: program?.objectives },
                        { title: 'Prerequisites', value: program?.prerequisites },
                    ].map((section) => (
                        <div
                            key={section.title}
                            className='rounded-lg border border-border bg-card p-4 md:p-6'
                        >
                            <h3 className='mb-3 text-base font-semibold text-foreground md:mb-4 md:text-lg'>
                                {section.title}
                            </h3>
                            <p className='whitespace-pre-wrap text-sm text-muted-foreground md:text-base'>
                                {section.value || `No ${section.title.toLowerCase()} specified`}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Courses */}
            {activeTab === 'courses' && (
                <div>
                    {coursesLoading ? (
                        <div className='py-8 text-center text-sm text-muted-foreground md:text-base'>
                            Loading courses…
                        </div>
                    ) : courses.length === 0 ? (
                        <div className='rounded-lg border-2 border-dashed border-border py-8 text-center md:py-12'>
                            <div className='mb-2 text-3xl md:text-4xl'>📖</div>
                            <p className='text-sm text-muted-foreground md:text-base'>
                                No courses added to this program yet
                            </p>
                        </div>
                    ) : (
                        <div className='space-y-2 md:space-y-3'>
                            {courses.map((course, index) => (
                                <div
                                    key={course.uuid}
                                    className='rounded-lg border border-border bg-card p-3 md:p-5'
                                >
                                    <div className='flex gap-3 md:gap-4'>
                                        <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary md:h-10 md:w-10 md:text-base'>
                                            {index + 1}
                                        </div>
                                        <div className='min-w-0 flex-1'>
                                            <h4 className='mb-1 text-sm font-semibold text-foreground md:text-base'>
                                                {course.name || 'Untitled Course'}
                                            </h4>
                                            <div className='flex flex-wrap gap-1.5 text-xs md:gap-2 md:text-sm'>
                                                {course.is_required && (
                                                    <span className='rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive md:text-xs'>
                                                        Required
                                                    </span>
                                                )}

                                                <span
                                                    className='text-muted-foreground line-clamp-3'
                                                    dangerouslySetInnerHTML={{ __html: course.description }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Enrollments */}
            {activeTab === 'enrollments' && (
                <div>
                    {enrollmentsLoading ? (
                        <div className='py-8 text-center text-sm text-muted-foreground md:text-base'>
                            Loading enrollments…
                        </div>
                    ) : enrollments.length === 0 ? (
                        <div className='rounded-lg border-2 border-dashed border-border py-8 text-center md:py-12'>
                            <div className='mb-2 flex items-center justify-center self-center text-3xl md:text-4xl'>
                                <Users />
                            </div>
                            <p className='text-sm text-muted-foreground md:text-base'>
                                No students enrolled yet
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile Card View */}
                            <div className='space-y-2 md:hidden'>
                                {enrollments.map((e: any) => (
                                    <div
                                        key={e.uuid}
                                        className='rounded-lg border border-border bg-card p-3'
                                    >
                                        <div className='mb-2 flex items-start justify-between gap-2'>
                                            <div className='min-w-0 flex-1'>
                                                <p className='truncate text-sm font-semibold text-foreground'>
                                                    {e.student_name || e.student_uuid}
                                                </p>
                                            </div>
                                            <span className='flex-shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary'>
                                                {e.status || 'Active'}
                                            </span>
                                        </div>
                                        <p className='text-xs text-muted-foreground'>
                                            Enrolled: {e.enrollment_date || 'N/A'}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table View */}
                            <div className='hidden rounded-lg border border-border bg-card md:block'>
                                <table className='w-full'>
                                    <thead className='border-b border-border bg-muted'>
                                        <tr>
                                            {['Student', 'Status', 'Enrolled Date'].map((h) => (
                                                <th
                                                    key={h}
                                                    className='px-6 py-3 text-left text-sm font-medium text-muted-foreground'
                                                >
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className='divide-y divide-border'>
                                        {enrollments.map((e: any) => (
                                            <tr key={e.uuid}>
                                                <td className='px-6 py-4 text-sm text-foreground'>
                                                    {e.student_name || e.student_uuid}
                                                </td>
                                                <td className='px-6 py-4'>
                                                    <span className='rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary'>
                                                        {e.status || 'Active'}
                                                    </span>
                                                </td>
                                                <td className='px-6 py-4 text-sm text-muted-foreground'>
                                                    {e.enrollment_date || 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProgramPreview;
