'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { elimikaDesignSystem } from "@/lib/design-system";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock } from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "../../../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { useInstructor } from "../../../../context/instructor-context";
import {
    getAllCoursesOptions,
    getCourseEnrollmentsOptions,
    getStudentByIdOptions,
    searchTrainingApplicationsOptions
} from "../../../../services/client/@tanstack/react-query.gen";

const EnrollmentsPage = () => {
    const instructor = useInstructor();

    // GET INSTRUCTOR COURSES
    // const { data } = useQuery({
    //     ...getCoursesByInstructorOptions({ path: { instructorUuid: instructor?.uuid as string }, query: { pageable: {} } }),
    //     enabled: !!instructor?.uuid
    // })

    const [statusFilter, setStatusFilter] = useState<string | null>('all');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [searchQuery, setSearchQuery] = useState('');
    const [applyModal, setApplyModal] = useState(false);
    const [applyingCourseId, setApplyingCourseId] = useState<string | null>(null);
    const [applyingCourse, setApplyingCourse] = useState<any | null>(null);

    const size = 20;
    const [page, setPage] = useState(0);

    const {
        data: allCourses,
    } = useQuery(getAllCoursesOptions({ query: { pageable: { page, size, sort: [] } } }));

    const { data: appliedCourses } = useQuery({
        ...searchTrainingApplicationsOptions({
            query: { pageable: {}, searchParams: { applicant_uuid_eq: instructor?.uuid as string } },
        }),
        enabled: !!instructor?.uuid,
    });

    const combinedCourses = React.useMemo(() => {
        if (!allCourses?.data?.content || !appliedCourses?.data?.content) return [];
        const appliedMap = new Map(
            appliedCourses.data.content.map((app: any) => [app.course_uuid, app])
        );

        return allCourses.data.content.map((course: any) => ({
            ...course,
            application: appliedMap.get(course.uuid) || null,
        }));
    }, [allCourses, appliedCourses]);

    const filteredCourses = useMemo(() => {
        if (!Array.isArray(combinedCourses)) return [];

        const filtered = combinedCourses.filter(course => {
            const isActiveAndPublished = course.active === true && course.is_published === true;

            const matchesSearch =
                !searchQuery ||
                course?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course?.description?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                !statusFilter || statusFilter === 'all' || course.application?.status === statusFilter;

            return isActiveAndPublished && matchesSearch && matchesStatus;
        });

        if (sortOrder) {
            filtered.sort((a, b) => {
                const dateA = new Date(a.application?.reviewed_at || 0).getTime();
                const dateB = new Date(b.application?.reviewed_at || 0).getTime();
                return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
            });
        }

        return filtered;
    }, [combinedCourses, searchQuery, statusFilter, sortOrder]);


    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

    // Fetch enrollments for selected course
    const { data: enrollmentsResponse, isLoading: isLoadingEnrollments } = useQuery({
        ...getCourseEnrollmentsOptions({
            path: { courseUuid: selectedCourseId as string },
            query: { pageable: {} }
        }),
        enabled: !!selectedCourseId
    });

    const enrollmentsForSelectedCourse = enrollmentsResponse?.data?.content || [];

    // Fetch student data for each enrollment
    const studentQueries = enrollmentsForSelectedCourse.map(enrollment =>
        useQuery({
            ...getStudentByIdOptions({ path: { uuid: enrollment.student_uuid } }),
            enabled: !!enrollment.student_uuid
        })
    );

    // Map student data with enrollment data
    const enrichedEnrollments = enrollmentsForSelectedCourse.map((enrollment, index) => {
        const studentData = studentQueries[index]?.data?.data;
        return {
            ...enrollment,
            studentName: studentData?.first_name && studentData?.last_name
                ? `${studentData.first_name} ${studentData.last_name}`
                : studentData?.email || 'Unknown Student',
            studentAvatar: studentData?.profile_image_url
        };
    });

    const handleViewProfile = (studentName: string) => {
        toast.message(`Viewing profile of ${studentName}`);
    };

    return (
        <div className={`${elimikaDesignSystem.components.pageContainer} px-4 sm:px-6`}>
            {/* Header */}
            <section className="mb-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                            Enrollments
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Review all students enrolled in each course
                        </p>
                    </div>
                </div>
            </section>

            {/* Construction Banner */}
            <Card className="mb-6 border-l-4 border-yellow-500 bg-yellow-50 p-3 sm:p-4 dark:bg-yellow-950/20">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                        🚧 Under Construction
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Student data is being fetched and displayed dynamically.
                    </p>
                </div>
            </Card>

            {/* Two-column layout */}
            <div className="flex flex-col gap-6 lg:flex-row">
                {/* Left: Course List */}
                {/* Course Selector (Mobile) */}
                <div className="lg:hidden flex flex-col gap-2">
                    <p className="text-sm" >Select a course to see its enrollment details</p>
                    <Select
                        value={selectedCourseId ?? undefined}
                        onValueChange={value => setSelectedCourseId(value)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a course" />
                        </SelectTrigger>

                        <SelectContent>
                            {filteredCourses?.map(course => {
                                const enrollmentCount = enrollmentsForSelectedCourse.filter(
                                    e => e.course_uuid === course.uuid
                                ).length;

                                return (
                                    <SelectItem key={course.uuid} value={course.uuid}>
                                        <div className="flex w-full items-center justify-between gap-2">
                                            <span className="truncate">{course.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                ({enrollmentCount})
                                            </span>
                                        </div>
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </div>

                {/* Course List (Desktop) */}
                <div className="hidden space-y-2 lg:block lg:w-1/3 lg:max-h-[calc(100vh-250px)] lg:overflow-y-auto">
                    {filteredCourses?.map(course => {
                        const enrollmentCount = enrollmentsForSelectedCourse.filter(
                            e => e.course_uuid === course.uuid
                        ).length;

                        const isSelected = selectedCourseId === course.uuid;

                        return (
                            <button
                                key={course.uuid}
                                onClick={() => setSelectedCourseId(course.uuid)}
                                className={`w-full rounded-xl border p-3 text-left text-sm transition-all
          flex items-center justify-between gap-3
          ${isSelected
                                        ? 'border-primary bg-primary/10 shadow-sm'
                                        : 'border-border bg-background hover:bg-muted'
                                    }`}
                            >
                                <span className="truncate font-medium text-foreground">
                                    {course.name}
                                </span>
                                <Badge variant="secondary" className="shrink-0">
                                    {enrollmentCount}
                                </Badge>
                            </button>
                        );
                    })}
                </div>

                {/* Right: Enrollments List */}
                <div className="space-y-4 lg:w-2/3 lg:max-h-[calc(100vh-250px)] lg:overflow-y-auto">
                    {selectedCourseId === null ? (
                        <Card className="p-6 sm:p-12 text-center">
                            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                            <p className="text-lg font-medium text-foreground">
                                Select a course
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Choose a course on the left to view enrollments.
                            </p>
                        </Card>
                    ) : isLoadingEnrollments ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <Card key={i} className="p-4">
                                    <div className="flex gap-4 items-center">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-40" />
                                        </div>
                                        <Skeleton className="h-9 w-24" />
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : enrichedEnrollments.length === 0 ? (
                        <Card className="p-6 sm:p-12 text-center">
                            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                            <p className="text-lg font-medium text-foreground">
                                No enrollments
                            </p>
                            <p className="text-sm text-muted-foreground">
                                No students have enrolled in this course yet.
                            </p>
                        </Card>
                    ) : (
                        enrichedEnrollments.map(enrollment => (
                            <Card
                                key={enrollment.uuid}
                                className="flex flex-col gap-3 sm:flex-row sm:items-center p-4"
                            >
                                <Avatar>
                                    <AvatarImage src={enrollment.studentAvatar} />
                                    <AvatarFallback>
                                        {enrollment.studentName
                                            .split(' ')
                                            .map((n: any) => n[0])
                                            .join('')
                                            .toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-semibold text-foreground">
                                        {enrollment.studentName}
                                    </p>
                                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3 shrink-0" />
                                        {/* enrollment time */}
                                    </p>
                                </div>

                                <Button
                                    size="sm"
                                    className="w-full sm:w-auto"
                                    onClick={() => handleViewProfile(enrollment.studentName)}
                                >
                                    View Profile
                                </Button>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>

    );
};

export default EnrollmentsPage;