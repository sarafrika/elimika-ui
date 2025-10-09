'use client'

import { useBreadcrumb } from "@/context/breadcrumb-provider";
import { getClassDefinitionsForCourseOptions, getCourseByUuidOptions } from "@/services/client/@tanstack/react-query.gen";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { ClassCard } from "../../../../_components/class-card";

const EnrollmentPage = () => {
    const params = useParams();
    const courseId = params?.id as string;
    const { replaceBreadcrumbs } = useBreadcrumb();

    useEffect(() => {
        if (courseId) {
            replaceBreadcrumbs([
                { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
                {
                    id: 'courses',
                    title: 'Courses',
                    url: `/dashboard/courses`,
                },
                {
                    id: 'course-details',
                    title: `Enroll`,
                    url: `/dashboard/courses/enroll/${courseId}`,
                },
            ]);
        }
    }, [replaceBreadcrumbs, courseId]);

    const { data: courseData } = useQuery({
        ...getCourseByUuidOptions({ path: { uuid: courseId } }),
        enabled: !!courseId,
    });

    const { data: classesForCourse, isLoading, isError } = useQuery({
        ...getClassDefinitionsForCourseOptions({ path: { courseUuid: courseId } }),
        enabled: !!courseId,
    });
    const classes = classesForCourse?.data || [];


    if (isLoading) {
        return <div className="p-4">Loading available classes...</div>;
    }

    if (isError) {
        return <div className="p-4 text-red-600">Failed to load classes. Please try again later.</div>;
    }


    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-semibold">Available Classes to Enroll In</h1>

            {!isLoading && classes.length === 0 ? (
                <div className="text-gray-500">No classes available for this course.</div>
            ) : (
                <ul className="flex flex-row flex-wrap gap-4">
                    {classes.map((cls: any) => (
                        <ClassCard
                            key={cls?.uuid}
                            course={courseData?.data}
                            classData={cls}
                            onViewClass={() => { }}
                        />
                    ))}
                </ul>
            )}
        </div>
    );
};

export default EnrollmentPage;
