'use client';

import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../../../components/ui/button';
import {
    getProgramCoursesOptions,
    getProgramEnrollmentsOptions,
    getTrainingProgramByUuidOptions,
} from '../../../../../services/client/@tanstack/react-query.gen';

const ProgramPreview = ({ programUuid, onBack, onEdit, editingProgram }: any) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'enrollments'>(
        'overview'
    );

    const { data, isLoading: programLoading } = useQuery({
        ...getTrainingProgramByUuidOptions({ path: { uuid: programUuid } }),
        enabled: !!programUuid,
    });
    const program = data?.data

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
        <div className='p-6'>
            {/* Header */}
            <div className='mb-6'>
                <button
                    onClick={onBack}
                    className='mb-4 flex items-center gap-2 text-primary hover:underline'
                >
                    ← Back to Programs
                </button>

                <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                        <div className='mb-2 flex items-center gap-3'>
                            <h1 className='text-2xl font-bold text-foreground'>
                                {program?.title}
                            </h1>
                            <span
                                className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusClasses(
                                    program?.status
                                )}`}
                            >
                                {program?.status}
                            </span>
                        </div>

                        {program?.program_type && (
                            <p className='mb-2 text-sm text-muted-foreground'>
                                {program?.program_type}
                            </p>
                        )}

                        <p className='text-muted-foreground'>
                            {program?.description}
                        </p>
                    </div>

                    <Button
                        onClick={() => onEdit(program)}
                        className='rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90'
                    >
                        Edit Program
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className='mb-6 grid gap-4 md:grid-cols-4'>
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
                        className='rounded-lg border border-border bg-card p-4'
                    >
                        <div className='text-sm text-muted-foreground'>
                            {stat.label}
                        </div>
                        <div className='text-2xl font-bold text-foreground'>
                            {stat.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className='mb-6 border-b border-border'>
                <div className='flex gap-6'>
                    {(['overview', 'courses', 'enrollments'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`border-b-2 px-1 py-3 font-medium ${activeTab === tab
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
                <div className='space-y-6'>
                    {[
                        { title: 'Learning Objectives', value: program?.objectives },
                        { title: 'Prerequisites', value: program?.prerequisites },
                    ].map((section) => (
                        <div
                            key={section.title}
                            className='rounded-lg border border-border bg-card p-6'
                        >
                            <h3 className='mb-4 text-lg font-semibold text-foreground'>
                                {section.title}
                            </h3>
                            <p className='whitespace-pre-wrap text-muted-foreground'>
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
                        <div className='text-center text-muted-foreground'>
                            Loading courses…
                        </div>
                    ) : courses.length === 0 ? (
                        <div className='rounded-lg border-2 border-dashed border-border py-12 text-center'>
                            <div className='mb-2 text-4xl'>📖</div>
                            <p className='text-muted-foreground'>
                                No courses added to this program yet
                            </p>
                        </div>
                    ) : (
                        <div className='space-y-3'>
                            {courses.map((course, index) => (
                                <div
                                    key={course.uuid}
                                    className='rounded-lg border border-border bg-card p-5'
                                >
                                    <div className='flex gap-4'>
                                        <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary'>
                                            {index + 1}
                                        </div>
                                        <div className='flex-1'>
                                            <h4 className='mb-1 font-semibold text-foreground'>
                                                {course.name || 'Untitled Course'}
                                            </h4>
                                            <div className='flex flex-wrap gap-2 text-sm'>
                                                {course.is_required && (
                                                    <span className='rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive'>
                                                        Required
                                                    </span>
                                                )}

                                                <span
                                                    className="text-muted-foreground line-clamp-3"
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
                        <div className='text-center text-muted-foreground'>
                            Loading enrollments…
                        </div>
                    ) : enrollments.length === 0 ? (
                        <div className='rounded-lg border-2 border-dashed border-border py-12 text-center'>
                            <div className='flex self-center items-center justify-center mb-2 text-4xl'>
                                <Users />
                            </div>
                            <p className='text-muted-foreground'>
                                No students enrolled yet
                            </p>
                        </div>
                    ) : (
                        <div className='rounded-lg border border-border bg-card'>
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
                    )}
                </div>
            )}
        </div>
    );
};

export default ProgramPreview;
