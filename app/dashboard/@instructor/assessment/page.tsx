'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useInstructor } from '@/context/instructor-context';
import { useDifficultyLevels } from '@/hooks/use-difficultyLevels';
import { useInstructorClassesWithSchedules } from '@/hooks/use-instructor-classes-with-schedules';
import type { CourseAssessment, CourseGradeBook, Enrollment, Student, User } from '@/services/client';
import {
    getCourseAssessmentsOptions,
    getEnrollmentGradeBookOptions,
    getEnrollmentsForClassOptions,
    getStudentByIdOptions,
    getUserByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQueries, useQuery } from '@tanstack/react-query';
import {
    BarChart3,
    BookOpen,
    CircleDot,
    GraduationCap,
    LayoutGrid,
    ListFilter,
    MessageSquareText,
    NotebookPen,
    Search,
    Trophy,
    Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type AssessmentTab = 'overview' | 'attendance' | 'formative' | 'performance' | 'summative';
type StudentSortOption =
    | 'name-asc'
    | 'name-desc'
    | 'score-desc'
    | 'score-asc'
    | 'rank-desc'
    | 'rank-asc';

type StudentAssessmentCard = {
    enrollmentUuid: string;
    studentUuid: string;
    fullName: string;
    avatarUrl?: string;
    studentCode?: string;
    level: string;
    grade: string;
    finalGrade: number | null;
    rank: number | null;
    comments: string[];
    gradebook?: CourseGradeBook;
    student?: Student;
    user?: User;
};

type StudentRosterProps = {
    isLoading: boolean;
    isLoadingClasses: boolean;
    selectedClassUuid: string | null;
    selectedClassTitle: string;
    totalStudents: number;
    searchTerm: string;
    sortOption: StudentSortOption;
    currentPage: number;
    totalPages: number;
    selectedStudentUuid: string | null;
    students: StudentAssessmentCard[];
    classOptions: Array<{ uuid: string; title: string }>;
    onClassChange: (value: string) => void;
    onSearchChange: (value: string) => void;
    onSortChange: (value: StudentSortOption) => void;
    onPageChange: (page: number) => void;
    onSelectStudent: (studentUuid: string) => void;
};

const QUERY_STALE_TIME = 1000 * 60 * 10;
const QUERY_GC_TIME = 1000 * 60 * 60;
const STUDENTS_PER_PAGE = 15;

const tabs: { value: AssessmentTab; label: string }[] = [
    { value: 'overview', label: 'Overview' },
    { value: 'attendance', label: 'Attendance & Behaviour' },
    { value: 'formative', label: 'Formative' },
    { value: 'performance', label: 'Performance' },
    { value: 'summative', label: 'Summative' },
];

const formatLabel = (value?: string | null) => {
    if (!value) return 'Not available';
    return value
        .toLowerCase()
        .split(/[_\s-]+/)
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
};

const formatPercentage = (value?: number | null) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '--';
    const normalized = Number(value);
    return `${Number.isInteger(normalized) ? normalized : normalized.toFixed(1)}%`;
};

const formatGrade = (value?: number | null) => {
    if (value === null || value === undefined || Number.isNaN(value)) return 'Pending';
    if (value >= 85) return 'Distinction';
    if (value >= 70) return 'Merit';
    if (value >= 50) return 'Pass';
    return 'Fail';
};

const getGradeBadgeVariant = (grade: string) => {
    switch (grade) {
        case 'Distinction':
            return 'success' as const;
        case 'Merit':
            return 'default' as const;
        case 'Pass':
            return 'warning' as const;
        case 'Fail':
            return 'destructive' as const;
        default:
            return 'outline' as const;
    }
};

const formatRank = (value?: number | null) => {
    if (!value) return '--';
    const mod10 = value % 10;
    const mod100 = value % 100;
    if (mod10 === 1 && mod100 !== 11) return `${value}st`;
    if (mod10 === 2 && mod100 !== 12) return `${value}nd`;
    if (mod10 === 3 && mod100 !== 13) return `${value}rd`;
    return `${value}th`;
};

const clampPercentage = (value?: number | null) => {
    if (value === null || value === undefined || Number.isNaN(value)) return 0;
    return Math.min(100, Math.max(0, Number(value)));
};

const getInitials = (name?: string) =>
    name
        ?.split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase() || 'ST';

const getStudentLevel = (student?: Student, fallbackLevel?: string | null) => {
    if (student?.demographic_tag) {
        return formatLabel(student.demographic_tag);
    }

    if (fallbackLevel) {
        return formatLabel(fallbackLevel);
    }

    return 'General';
};

const getEnrollmentTimestamp = (enrollment: Enrollment) => {
    const createdAt = enrollment.created_date ? new Date(enrollment.created_date).getTime() : 0;
    const updatedAt = enrollment.updated_date ? new Date(enrollment.updated_date).getTime() : 0;
    const attendanceAt = enrollment.attendance_marked_at
        ? new Date(enrollment.attendance_marked_at).getTime()
        : 0;

    return Math.max(createdAt, updatedAt, attendanceAt);
};

const getPrimaryEnrollment = (enrollments: Enrollment[]) =>
    [...enrollments].sort((left, right) => {
        const timestampDifference = getEnrollmentTimestamp(right) - getEnrollmentTimestamp(left);
        if (timestampDifference !== 0) {
            return timestampDifference;
        }

        return (right.uuid || '').localeCompare(left.uuid || '');
    })[0] ?? null;

function PlaceholderTab({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <Card className='border-border/70 bg-card shadow-sm'>
            <CardContent className='flex min-h-[320px] flex-col items-center justify-center gap-4 p-8 text-center'>
                <div className='bg-primary/10 text-primary rounded-full p-4'>
                    <LayoutGrid className='h-6 w-6' />
                </div>
                <div className='space-y-2'>
                    <h3 className='text-foreground text-lg font-semibold'>{title}</h3>
                    <p className='text-muted-foreground max-w-xl text-sm'>{description}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function MiniBarChart({ values }: { values: number[] }) {
    return (
        <div className='flex h-28 items-end gap-3 rounded-[24px] border border-border/70 bg-background/80 p-4'>
            {values.map((value, index) => (
                <div key={`${value}-${index}`} className='flex flex-1 items-end'>
                    <div
                        className='bg-primary/80 w-full rounded-t-xl'
                        style={{ height: `${Math.max(18, clampPercentage(value))}%` }}
                    />
                </div>
            ))}
        </div>
    );
}

function StudentRoster({
    isLoading,
    isLoadingClasses,
    selectedClassUuid,
    selectedClassTitle,
    totalStudents,
    searchTerm,
    sortOption,
    currentPage,
    totalPages,
    selectedStudentUuid,
    students,
    classOptions,
    onClassChange,
    onSearchChange,
    onSortChange,
    onPageChange,
    onSelectStudent,
}: StudentRosterProps) {
    const hasSearchTerm = searchTerm.trim().length > 0;

    return (
        <Card className='border-border/70 bg-card shadow-sm'>
            <CardHeader className='space-y-4 p-4'>
                <div className='space-y-2'>
                    <p>Select Class</p>
                    {isLoadingClasses ? (
                        <Skeleton className='h-10 w-full rounded-full' />
                    ) : (
                        <Select
                            value={selectedClassUuid ?? undefined}
                            onValueChange={onClassChange}
                            disabled={!classOptions.length}
                        >
                            <SelectTrigger className='bg-background h-10 max-w-[280px] w-full overflow-hidden rounded-full border border-border/70 text-sm'>
                                <span className='block min-w-0 flex-1 truncate text-left'>
                                    {selectedClassUuid
                                        ? (classOptions.find(c => c.uuid === selectedClassUuid)?.title ?? 'Choose a class')
                                        : 'Choose a class'}
                                </span>
                            </SelectTrigger>

                            <SelectContent className='w-[var(--radix-select-trigger-width)]'>
                                {classOptions.map(classItem => (
                                    <SelectItem key={classItem.uuid} value={classItem.uuid}>
                                        <span className='block truncate' title={classItem.title}>
                                            {classItem.title}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                <div className='flex flex-col gap-2'>
                    <form
                        className='flex flex-col gap-2 sm:flex-row'
                        onSubmit={event => event.preventDefault()}
                    >
                        <div className='relative flex-1'>
                            <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                            <Input
                                value={searchTerm}
                                onChange={event => onSearchChange(event.target.value)}
                                placeholder='Search by learner name, code, level, or grade'
                                className='bg-background h-10 rounded-full border-border/70 pr-4 pl-9 text-sm'
                                aria-label='Search class roster'
                            />
                        </div>
                        <Button type='submit' className='rounded-full px-5'>
                            Search
                        </Button>
                    </form>

                    <div className='flex items-center gap-2'>
                        <div className='text-muted-foreground flex h-10 items-center gap-2 rounded-full border border-border/70 bg-background px-3 text-xs font-medium'>
                            <ListFilter className='h-3.5 w-3.5' />
                            Sort
                        </div>
                        <Select value={sortOption} onValueChange={value => onSortChange(value as StudentSortOption)}>
                            <SelectTrigger className='bg-background h-10 rounded-full border-border/70 text-sm'>
                                <SelectValue placeholder='Sort roster' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='name-asc'>Name A-Z</SelectItem>
                                <SelectItem value='name-desc'>Name Z-A</SelectItem>
                                <SelectItem value='score-desc'>Score high-low</SelectItem>
                                <SelectItem value='score-asc'>Score low-high</SelectItem>
                                <SelectItem value='rank-desc'>Rank high-low</SelectItem>
                                <SelectItem value='rank-asc'>Rank low-high</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>

            <CardContent className='space-y-2.5'>
                {isLoading ? (
                    Array.from({ length: 9 }).map((_, index) => (
                        <Skeleton key={index} className='h-[76px] rounded-[20px]' />
                    ))
                ) : students.length === 0 ? (
                    <div className='border-border/70 rounded-[24px] border border-dashed p-6 text-center'>
                        <p className='text-foreground font-medium'>
                            {hasSearchTerm ? 'No learners match this search' : 'No students enrolled yet'}
                        </p>
                        <p className='text-muted-foreground mt-1 text-sm'>
                            {hasSearchTerm
                                ? 'Try a different search term or sorting option to find a learner faster.'
                                : 'Student assessment cards will appear here once enrollments are active.'}
                        </p>
                    </div>
                ) : (
                    <>
                        {students.map(student => {
                            const isActive = student.studentUuid === selectedStudentUuid;

                            return (
                                <button
                                    key={student.enrollmentUuid}
                                    type='button'
                                    onClick={() => onSelectStudent(student.studentUuid)}
                                    className={`w-full rounded-[20px] border px-3 py-3 text-left transition-colors ${isActive
                                        ? 'border-primary bg-primary/10 shadow-sm'
                                        : 'border-border/70 bg-background/80 hover:bg-primary/10'
                                        }`}
                                >
                                    <div className='flex items-center gap-3'>
                                        <Avatar className='h-10 w-10 rounded-xl'>
                                            <AvatarImage src={student.avatarUrl} alt={student.fullName} />
                                            <AvatarFallback className='rounded-xl text-[11px] font-semibold'>
                                                {getInitials(student.fullName)}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className='min-w-0 flex-1'>
                                            <div className='flex items-start justify-between gap-2'>
                                                <div className='min-w-0 space-y-1'>
                                                    <p className='text-foreground truncate text-sm font-semibold'>
                                                        {student.fullName}
                                                    </p>
                                                    <div className='text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]'>
                                                        <span>{student.studentCode || student.studentUuid.slice(0, 8)}</span>
                                                        <span aria-hidden='true'>•</span>
                                                        <span>{student.level}</span>
                                                    </div>
                                                </div>
                                                <Badge
                                                    variant={getGradeBadgeVariant(student.grade)}
                                                    className='shrink-0'
                                                >
                                                    {student.grade}
                                                </Badge>
                                            </div>

                                            <div className='text-muted-foreground mt-2 flex items-center justify-between gap-3 text-[11px]'>
                                                <span>
                                                    Score{' '}
                                                    <span className='text-foreground font-medium'>
                                                        {formatPercentage(student.finalGrade)}
                                                    </span>
                                                </span>
                                                <span>
                                                    Rank{' '}
                                                    <span className='text-foreground font-medium'>
                                                        {formatRank(student.rank)}
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}

                        {totalPages > 1 ? (
                            <Pagination className='justify-between pt-2'>
                                <PaginationContent className='w-full justify-between'>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href='#'
                                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                                            onClick={event => {
                                                event.preventDefault();
                                                if (currentPage > 1) {
                                                    onPageChange(currentPage - 1);
                                                }
                                            }}
                                        />
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationLink
                                            href='#'
                                            isActive
                                            onClick={event => event.preventDefault()}
                                            className='min-w-[96px]'
                                        >
                                            {currentPage} / {totalPages}
                                        </PaginationLink>
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationNext
                                            href='#'
                                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                                            onClick={event => {
                                                event.preventDefault();
                                                if (currentPage < totalPages) {
                                                    onPageChange(currentPage + 1);
                                                }
                                            }}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        ) : null}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

export default function NewAssessmentPage() {
    const instructor = useInstructor();
    const { replaceBreadcrumbs } = useBreadcrumb();
    const router = useRouter();
    const { difficultyMap } = useDifficultyLevels();
    const [selectedClassUuid, setSelectedClassUuid] = useState<string | null>(null);
    const [selectedStudentUuid, setSelectedStudentUuid] = useState<string | null>(null);
    const [studentSearchTerm, setStudentSearchTerm] = useState('');
    const [studentSortOption, setStudentSortOption] = useState<StudentSortOption>('score-desc');
    const [studentCurrentPage, setStudentCurrentPage] = useState(1);

    useEffect(() => {
        replaceBreadcrumbs([
            { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
            {
                id: 'new-assessment',
                title: 'New Assessment',
                url: '/dashboard/new-assessment',
                isLast: true,
            },
        ]);
    }, [replaceBreadcrumbs]);

    const {
        classes,
        isLoading: isLoadingClasses,
        isError: hasClassesError,
    } = useInstructorClassesWithSchedules(instructor?.uuid);

    useEffect(() => {
        if (!classes.length) {
            setSelectedClassUuid(null);
            return;
        }

        setSelectedClassUuid(previous =>
            previous && classes.some(item => item.uuid === previous) ? previous : classes[0]?.uuid ?? null
        );
    }, [classes]);

    const selectedClass = useMemo(
        () => classes.find(item => item.uuid === selectedClassUuid) ?? null,
        [classes, selectedClassUuid]
    );

    const {
        data: enrollmentsData,
        isLoading: isLoadingEnrollments,
        isError: hasEnrollmentsError,
    } = useQuery({
        ...getEnrollmentsForClassOptions({
            path: { uuid: selectedClass?.uuid as string },
        }),
        enabled: !!selectedClass?.uuid,
        staleTime: QUERY_STALE_TIME,
        gcTime: QUERY_GC_TIME,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
    });

    const classEnrollments = useMemo(
        () =>
            (enrollmentsData?.data ?? []).filter(
                enrollment =>
                    Boolean(enrollment?.uuid) &&
                    Boolean(enrollment?.student_uuid) &&
                    enrollment?.is_active !== false
            ),
        [enrollmentsData]
    );

    const enrollmentGroups = useMemo(() => {
        const groups = new Map<string, Enrollment[]>();

        classEnrollments.forEach(enrollment => {
            const studentUuid = enrollment.student_uuid;

            if (!studentUuid) return;

            const existing = groups.get(studentUuid) ?? [];
            existing.push(enrollment);
            groups.set(studentUuid, existing);
        });

        return groups;
    }, [classEnrollments]);

    const uniqueStudentEnrollments = useMemo(
        () =>
            Array.from(enrollmentGroups.entries())
                .map(([studentUuid, enrollments]) => ({
                    studentUuid,
                    enrollments,
                    primaryEnrollment: getPrimaryEnrollment(enrollments),
                }))
                .filter(
                    (
                        item
                    ): item is {
                        studentUuid: string;
                        enrollments: Enrollment[];
                        primaryEnrollment: Enrollment;
                    } => Boolean(item.primaryEnrollment?.uuid)
                ),
        [enrollmentGroups]
    );

    const studentQueries = useQueries({
        queries: uniqueStudentEnrollments.map(({ studentUuid }) => ({
            ...getStudentByIdOptions({
                path: { uuid: studentUuid },
            }),
            enabled: !!studentUuid,
            staleTime: QUERY_STALE_TIME,
            gcTime: QUERY_GC_TIME,
            refetchOnMount: false,
            refetchOnReconnect: false,
            refetchOnWindowFocus: false,
        })),
    });

    const userQueries = useQueries({
        queries: uniqueStudentEnrollments.map((_, index) => {
            const student = studentQueries[index]?.data?.data;

            return {
                ...getUserByUuidOptions({
                    path: { uuid: student?.user_uuid as string },
                }),
                enabled: !!student?.user_uuid,
                staleTime: QUERY_STALE_TIME,
                gcTime: QUERY_GC_TIME,
                refetchOnMount: false,
                refetchOnReconnect: false,
                refetchOnWindowFocus: false,
            };
        }),
    });

    const gradebookQueries = useQueries({
        queries: uniqueStudentEnrollments.map(({ primaryEnrollment }) => ({
            ...getEnrollmentGradeBookOptions({
                path: {
                    courseUuid: selectedClass?.course_uuid as string,
                    enrollmentUuid: primaryEnrollment.uuid as string,
                },
            }),
            enabled: !!selectedClass?.course_uuid && !!primaryEnrollment.uuid,
            staleTime: QUERY_STALE_TIME,
            gcTime: QUERY_GC_TIME,
            refetchOnMount: false,
            refetchOnReconnect: false,
            refetchOnWindowFocus: false,
        })),
    });

    const studentCards = useMemo<StudentAssessmentCard[]>(() => {
        const baseCards = uniqueStudentEnrollments.map(({ studentUuid, primaryEnrollment }, index) => {
            const student = studentQueries[index]?.data?.data;
            const user = userQueries[index]?.data?.data;
            const gradebook = gradebookQueries[index]?.data?.data;
            const finalGrade = gradebook?.final_grade ?? null;
            const comments =
                gradebook?.components
                    ?.map(component => component.aggregate_score?.comments)
                    .filter((value): value is string => Boolean(value?.trim())) ?? [];

            return {
                enrollmentUuid: primaryEnrollment.uuid as string,
                studentUuid,
                fullName: user?.full_name || student?.full_name || 'Unknown student',
                avatarUrl: user?.profile_image_url,
                studentCode: user?.user_no || student?.uuid?.slice(0, 8)?.toUpperCase(),
                level: getStudentLevel(
                    student,
                    selectedClass?.course?.difficulty_uuid
                        ? difficultyMap[selectedClass.course.difficulty_uuid]
                        : undefined
                ),
                grade: formatGrade(finalGrade),
                finalGrade,
                rank: null,
                comments,
                gradebook,
                student,
                user,
            };
        });

        const ranked = [...baseCards]
            .filter(card => card.finalGrade !== null)
            .sort((left, right) => (right.finalGrade ?? 0) - (left.finalGrade ?? 0));

        const rankMap = new Map<string, number>();
        ranked.forEach((card, index) => {
            rankMap.set(card.enrollmentUuid, index + 1);
        });

        return baseCards
            .map(card => ({
                ...card,
                rank: rankMap.get(card.enrollmentUuid) ?? null,
            }))
            .sort((left, right) => {
                const leftGrade = left.finalGrade ?? -1;
                const rightGrade = right.finalGrade ?? -1;
                if (rightGrade !== leftGrade) {
                    return rightGrade - leftGrade;
                }
                return left.fullName.localeCompare(right.fullName);
            });
    }, [
        difficultyMap,
        gradebookQueries,
        selectedClass?.course?.difficulty_uuid,
        studentQueries,
        uniqueStudentEnrollments,
        userQueries,
    ]);

    const filteredStudentCards = useMemo(() => {
        const normalizedSearch = studentSearchTerm.trim().toLowerCase();

        const filtered = !normalizedSearch
            ? studentCards
            : studentCards.filter(student =>
                [
                    student.fullName,
                    student.studentCode,
                    student.level,
                    student.grade,
                    formatPercentage(student.finalGrade),
                    formatRank(student.rank),
                ]
                    .filter(Boolean)
                    .some(value => value?.toLowerCase().includes(normalizedSearch))
            );

        return [...filtered].sort((left, right) => {
            switch (studentSortOption) {
                case 'name-asc':
                    return left.fullName.localeCompare(right.fullName);
                case 'name-desc':
                    return right.fullName.localeCompare(left.fullName);
                case 'score-asc':
                    return (left.finalGrade ?? -1) - (right.finalGrade ?? -1);
                case 'score-desc':
                    return (right.finalGrade ?? -1) - (left.finalGrade ?? -1);
                case 'rank-asc':
                    return (left.rank ?? Number.MAX_SAFE_INTEGER) - (right.rank ?? Number.MAX_SAFE_INTEGER);
                case 'rank-desc':
                    return (right.rank ?? -1) - (left.rank ?? -1);
                default:
                    return 0;
            }
        });
    }, [studentCards, studentSearchTerm, studentSortOption]);

    const studentTotalPages = Math.max(
        1,
        Math.ceil(filteredStudentCards.length / STUDENTS_PER_PAGE)
    );

    useEffect(() => {
        setStudentCurrentPage(previous => Math.min(previous, studentTotalPages));
    }, [studentTotalPages]);

    const paginatedStudentCards = useMemo(() => {
        const startIndex = (studentCurrentPage - 1) * STUDENTS_PER_PAGE;
        return filteredStudentCards.slice(startIndex, startIndex + STUDENTS_PER_PAGE);
    }, [filteredStudentCards, studentCurrentPage]);

    useEffect(() => {
        if (!filteredStudentCards.length) {
            setSelectedStudentUuid(null);
            return;
        }

        setSelectedStudentUuid(previous =>
            previous && filteredStudentCards.some(card => card.studentUuid === previous)
                ? previous
                : filteredStudentCards[0]?.studentUuid ?? null
        );
    }, [filteredStudentCards]);

    useEffect(() => {
        if (!paginatedStudentCards.length) {
            return;
        }

        setSelectedStudentUuid(previous =>
            previous && paginatedStudentCards.some(card => card.studentUuid === previous)
                ? previous
                : paginatedStudentCards[0]?.studentUuid ?? null
        );
    }, [paginatedStudentCards]);

    const selectedStudent = useMemo(
        () => studentCards.find(card => card.studentUuid === selectedStudentUuid) ?? null,
        [selectedStudentUuid, studentCards]
    );

    const {
        data: courseAssessmentsData,
        isLoading: isLoadingAssessments,
        isError: hasAssessmentsError,
    } = useQuery({
        ...getCourseAssessmentsOptions({
            path: { courseUuid: selectedClass?.course_uuid as string },
            query: { pageable: {} },
        }),
        enabled: !!selectedClass?.course_uuid,
        staleTime: QUERY_STALE_TIME,
        gcTime: QUERY_GC_TIME,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
    });

    const courseAssessments = useMemo<CourseAssessment[]>(
        () => courseAssessmentsData?.data?.content ?? [],
        [courseAssessmentsData]
    );

    const overviewRows = useMemo(() => {
        if (selectedStudent?.gradebook?.components?.length) {
            return selectedStudent.gradebook.components.map((component, index) => ({
                id: component.assessment?.uuid ?? `${component.assessment?.title ?? 'assessment'}-${index}`,
                title: component.assessment?.title || 'Untitled assessment',
                type:
                    component.assessment?.assessment_category ||
                    component.assessment?.assessment_type ||
                    'Assessment',
                weight:
                    component.assessment?.weight_display ||
                    formatPercentage(component.configured_line_item_weight_percentage),
                score:
                    component.aggregate_score?.grade_display ||
                    formatPercentage(component.aggregate_score?.percentage),
            }));
        }

        return courseAssessments.map(assessment => ({
            id: assessment.uuid ?? assessment.title,
            title: assessment.title,
            type: assessment.assessment_category || assessment.assessment_type,
            weight: assessment.weight_display || formatPercentage(assessment.weight_percentage),
            score: '--',
        }));
    }, [courseAssessments, selectedStudent?.gradebook?.components]);

    const overviewWeightTotal = useMemo(() => {
        const source =
            selectedStudent?.gradebook?.configured_weight_percentage ??
            courseAssessments.reduce((sum, assessment) => sum + (assessment.weight_percentage ?? 0), 0);
        return formatPercentage(source);
    }, [courseAssessments, selectedStudent?.gradebook?.configured_weight_percentage]);

    const assessedComponents = useMemo(
        () =>
            selectedStudent?.gradebook?.components?.filter(
                component =>
                    component.aggregate_score?.percentage !== null &&
                    component.aggregate_score?.percentage !== undefined
            ) ?? [],
        [selectedStudent?.gradebook?.components]
    );

    const selectedStudentEnrollments = useMemo(
        () => (selectedStudentUuid ? enrollmentGroups.get(selectedStudentUuid) ?? [] : []),
        [enrollmentGroups, selectedStudentUuid]
    );

    const totalSessions = selectedClass?.schedule?.length ?? 0;

    const attendedSessions = useMemo(
        () => selectedStudentEnrollments.filter(enrollment => enrollment.did_attend === true).length,
        [selectedStudentEnrollments]
    );

    const attendanceCompletion = totalSessions
        ? Math.round((attendedSessions / totalSessions) * 100)
        : 0;

    const remainingSessions = Math.max(totalSessions - attendedSessions, 0);

    const suggestionItems = useMemo(() => {
        const lowPerforming = assessedComponents
            .filter(component => (component.aggregate_score?.percentage ?? 0) < 60)
            .slice(0, 3)
            .map(component => `Revisit ${component.assessment?.title || 'this component'}`);

        if (lowPerforming.length) {
            return lowPerforming;
        }

        return [
            'Maintain consistency across graded components',
            'Keep instructor feedback visible before the next review',
            'Use stronger assessment areas as a model for weaker ones',
        ];
    }, [assessedComponents]);

    const chartValues = useMemo(() => {
        const values =
            assessedComponents
                .slice(0, 5)
                .map(component => clampPercentage(component.aggregate_score?.percentage ?? 0)) ?? [];

        if (values.length) return values;

        return [28, 54, 40, 72, 61];
    }, [assessedComponents]);

    const instructorComments = useMemo(() => {
        if (!selectedStudent?.comments.length) return 'No instructor comments have been added yet.';
        return selectedStudent.comments.join(' ');
    }, [selectedStudent?.comments]);

    const isLoadingRoster =
        isLoadingEnrollments ||
        studentQueries.some(query => query.isPending) ||
        userQueries.some(query => query.isPending) ||
        gradebookQueries.some(query => query.isPending);

    const hasError = hasClassesError || hasEnrollmentsError || hasAssessmentsError;

    return (
        <div className='flex min-h-full flex-col gap-6 py-10 pb-8'>
            {hasError ? (
                <Card className='border-destructive/40'>
                    <CardContent className='flex min-h-48 flex-col items-center justify-center gap-3 p-8 text-center'>
                        <NotebookPen className='text-destructive h-8 w-8' />
                        <div className='space-y-1'>
                            <p className='text-foreground font-semibold'>Unable to load assessment workspace</p>
                            <p className='text-muted-foreground text-sm'>
                                We hit a problem while loading classes, learners, or assessment data for this
                                screen.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : null}

            {selectedClass ? (
                <div className='grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)] '>
                    <aside className='space-y-4'>
                        <StudentRoster
                            isLoading={isLoadingRoster}
                            isLoadingClasses={isLoadingClasses}
                            selectedClassUuid={selectedClassUuid}
                            selectedClassTitle={selectedClass.title}
                            totalStudents={studentCards.length}
                            searchTerm={studentSearchTerm}
                            sortOption={studentSortOption}
                            currentPage={studentCurrentPage}
                            totalPages={studentTotalPages}
                            selectedStudentUuid={selectedStudentUuid}
                            students={paginatedStudentCards}
                            classOptions={classes.map(classItem => ({
                                uuid: classItem.uuid,
                                title: classItem.title,
                            }))}
                            onClassChange={value => {
                                setSelectedClassUuid(value);
                                setStudentCurrentPage(1);
                            }}
                            onSearchChange={value => {
                                setStudentSearchTerm(value);
                                setStudentCurrentPage(1);
                            }}
                            onSortChange={value => {
                                setStudentSortOption(value);
                                setStudentCurrentPage(1);
                            }}
                            onPageChange={setStudentCurrentPage}
                            onSelectStudent={setSelectedStudentUuid}
                        />
                    </aside>

                    <Tabs defaultValue='overview' className='space-y-4'>
                        <TabsList className='bg-card h-auto w-full flex-wrap justify-start rounded-[28px] p-2'>
                            {tabs.map(tab => (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    className='rounded-[20px] px-4 py-2 text-[11px] uppercase tracking-[0.18em]'
                                >
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <TabsContent value='overview' className='mt-0'>
                            <Card className='border-border/70 bg-card shadow-sm'>
                                <CardContent className='space-y-6 p-4 sm:p-6'>
                                    {isLoadingAssessments || isLoadingRoster ? (
                                        <div className='space-y-4'>
                                            <Skeleton className='h-44 rounded-[28px]' />
                                            <Skeleton className='h-64 rounded-[28px]' />
                                            <Skeleton className='h-48 rounded-[28px]' />
                                        </div>
                                    ) : (
                                        <>
                                            <div className='rounded-[28px] border border-border/70 bg-background/80'>
                                                <div className='border-border/70 flex flex-col gap-5 border-b p-5 lg:flex-row lg:items-start lg:justify-between'>
                                                    <div className='flex min-w-0 gap-4'>
                                                        <div className='bg-muted hidden h-24 w-24 shrink-0 rounded-[24px] border border-border/60 sm:flex sm:items-center sm:justify-center'>
                                                            <BookOpen className='text-muted-foreground h-8 w-8' />
                                                        </div>
                                                        <div className='min-w-0 space-y-4'>
                                                            <div className='space-y-2'>
                                                                <h2 className='text-foreground text-2xl font-semibold'>
                                                                    {selectedClass.course?.name || 'Course assessment'}
                                                                </h2>
                                                                <p className='text-muted-foreground text-sm leading-6'>
                                                                    {selectedStudent
                                                                        ? `Assessment detail for ${selectedStudent.fullName}`
                                                                        : 'Select a learner to inspect the current assessment breakdown.'}
                                                                </p>
                                                            </div>

                                                            <div className='text-muted-foreground flex flex-wrap gap-x-4 gap-y-2 text-sm'>
                                                                <span className='inline-flex items-center gap-1.5'>
                                                                    <CircleDot className='h-4 w-4' />
                                                                    {selectedClass?.schedule?.length} sessions
                                                                </span>
                                                                <span className='inline-flex items-center gap-1.5'>
                                                                    <GraduationCap className='h-4 w-4' />
                                                                    {selectedStudent?.level || 'General'}
                                                                </span>
                                                                <span className='inline-flex items-center gap-1.5'>
                                                                    <Users className='h-4 w-4' />
                                                                    Instructor {instructor?.full_name || 'view'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <Button
                                                        type="button"
                                                        onClick={() => router.push("/dashboard/trainings/create-new")}
                                                        className="rounded-md border border-border/70 bg-primary hover:bg-accent cursor-pointer"
                                                    >
                                                        Add classes
                                                    </Button>
                                                </div>

                                                <div className='space-y-3 p-5'>
                                                    <Progress
                                                        value={attendanceCompletion}
                                                        className='h-2.5 bg-primary/15'
                                                    />
                                                    <div className='flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between'>
                                                        <p className='text-foreground font-semibold'>
                                                            {attendedSessions} of {totalSessions} sessions attended
                                                        </p>
                                                        <p className='text-muted-foreground'>
                                                            {remainingSessions} session
                                                            {remainingSessions === 1 ? '' : 's'} remaining
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_180px]'>
                                                <div className='rounded-[28px] border border-border/70 bg-background/80 p-4'>
                                                    <div className='mb-4'>
                                                        <h3 className='text-foreground text-lg font-semibold'>
                                                            Course assessment
                                                        </h3>
                                                        <p className='text-muted-foreground mt-1 text-sm'>
                                                            Component title, type, weight, and learner result.
                                                        </p>
                                                    </div>

                                                    <div className='overflow-hidden rounded-[24px] border border-border/70'>
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead>Component title</TableHead>
                                                                    <TableHead>Type</TableHead>
                                                                    <TableHead>Score</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {overviewRows.length === 0 ? (
                                                                    <TableRow>
                                                                        <TableCell colSpan={3} className='py-8 text-center'>
                                                                            <div className='space-y-1'>
                                                                                <p className='text-foreground font-medium'>
                                                                                    No assessment components yet
                                                                                </p>
                                                                                <p className='text-muted-foreground text-sm'>
                                                                                    This course does not have configured assessment rows yet.
                                                                                </p>
                                                                            </div>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ) : (
                                                                    overviewRows.map(row => (
                                                                        <TableRow key={row.id}>
                                                                            <TableCell className='whitespace-normal font-medium'>
                                                                                {row.title}
                                                                            </TableCell>
                                                                            <TableCell className='whitespace-normal'>
                                                                                <div className='space-y-1'>
                                                                                    <p>{formatLabel(row.type)}</p>
                                                                                    <p className='text-muted-foreground text-xs'>
                                                                                        Weight {row.weight}
                                                                                    </p>
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell>{row.score}</TableCell>
                                                                        </TableRow>
                                                                    ))
                                                                )}
                                                                <TableRow>
                                                                    <TableCell className='font-semibold'>Total</TableCell>
                                                                    <TableCell className='text-muted-foreground text-xs'>
                                                                        Weight {overviewWeightTotal}
                                                                    </TableCell>
                                                                    <TableCell className='font-semibold'>
                                                                        {selectedStudent
                                                                            ? formatPercentage(selectedStudent.finalGrade)
                                                                            : '--'}
                                                                    </TableCell>
                                                                </TableRow>
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                </div>

                                                <div className='rounded-[28px] border border-border/70 bg-background/80 p-4'>
                                                    <div className='flex items-center gap-2'>
                                                        <Trophy className='text-primary h-4 w-4' />
                                                        <h3 className='text-foreground font-semibold'>Final grade</h3>
                                                    </div>
                                                    <div className='mt-4 rounded-[24px] border border-border/70 bg-card p-4 text-center'>
                                                        <p className='text-foreground text-3xl font-semibold'>
                                                            {selectedStudent
                                                                ? formatPercentage(selectedStudent.finalGrade)
                                                                : '--'}
                                                        </p>
                                                        <p className='text-muted-foreground mt-2 text-sm'>
                                                            {selectedStudent?.grade || 'Pending grade'}
                                                        </p>
                                                        <p className='text-muted-foreground mt-3 text-xs'>
                                                            Rank{' '}
                                                            {selectedStudent
                                                                ? formatRank(selectedStudent.rank)
                                                                : '--'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_220px]'>
                                                <div className='rounded-[28px] border border-border/70 bg-background/80 p-4'>
                                                    <div className='mb-4 flex items-center gap-2'>
                                                        <BarChart3 className='text-primary h-4 w-4' />
                                                        <h3 className='text-foreground font-semibold'>
                                                            Growth & learning suggestions
                                                        </h3>
                                                    </div>

                                                    <div className='grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]'>
                                                        <MiniBarChart values={chartValues} />
                                                        <div className='space-y-3'>
                                                            {suggestionItems.map(item => (
                                                                <div key={item} className='flex items-start gap-2 text-sm'>
                                                                    <CircleDot className='text-primary mt-0.5 h-4 w-4 shrink-0' />
                                                                    <p className='text-muted-foreground leading-6'>{item}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className='rounded-[28px] border border-border/70 bg-background/80 p-4'>
                                                    <div className='mb-4 flex items-center gap-2'>
                                                        <MessageSquareText className='text-primary h-4 w-4' />
                                                        <h3 className='text-foreground font-semibold'>
                                                            Instructor comments
                                                        </h3>
                                                    </div>
                                                    <div className='rounded-[24px] border border-border/70 bg-card p-4'>
                                                        <p className='text-muted-foreground text-sm leading-6'>
                                                            {instructorComments}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value='attendance' className='mt-0'>
                            <PlaceholderTab
                                title='Attendance & behaviour'
                                description='This section is ready for the attendance and classroom behaviour workflow. The shared learner roster stays available while the detailed tools are added in a later pass.'
                            />
                        </TabsContent>

                        <TabsContent value='formative' className='mt-0'>
                            <PlaceholderTab
                                title='Formative assessments'
                                description='This tab is intentionally left open for the next iteration, where formative grading components and interactions can be added.'
                            />
                        </TabsContent>

                        <TabsContent value='performance' className='mt-0'>
                            <PlaceholderTab
                                title='Performance assessments'
                                description='This panel is reserved for performance-specific scoring details and instructor review tooling.'
                            />
                        </TabsContent>

                        <TabsContent value='summative' className='mt-0'>
                            <PlaceholderTab
                                title='Summative assessments'
                                description='This area is in place as a placeholder and can be connected to the summative assessment workflow when you are ready.'
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            ) : null}
        </div>
    );
}
