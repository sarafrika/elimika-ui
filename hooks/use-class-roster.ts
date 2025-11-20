import {
    getEnrollmentsForClassOptions,
    getStudentByIdOptions,
    getUserByUuidOptions,
} from "@/services/client/@tanstack/react-query.gen";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function useClassRoster(classId: string | undefined) {
    // 1. Fetch all enrollments for a class
    const enrollmentQuery = useQuery(
        getEnrollmentsForClassOptions({
            path: { uuid: classId as string },
        })
    );

    const enrollments = enrollmentQuery?.data?.data ?? [];

    // 2. Deduplicate by student_uuid
    const uniqueEnrollments = useMemo(() => {
        if (!enrollments) return [];

        return Object.values(
            // @ts-ignore
            enrollments?.reduce((acc: any, e: any) => {
                acc[e.student_uuid] = e;
                return acc;
            }, {})
        );
    }, [enrollments]);

    // 3. Fetch individual STUDENT data
    const studentQueries = useQueries({
        queries: uniqueEnrollments.map((enrol: any) => ({
            ...getStudentByIdOptions({
                path: { uuid: enrol?.student_uuid },
            }),
            enabled: !!enrol?.student_uuid,
        })),
    });

    // Extract student records
    const students = studentQueries.map((q: any) => q?.data?.data).filter(Boolean);

    // 4. Fetch USER PROFILES for each student
    const userQueries = useQueries({
        queries: students.map((stu: any) => ({
            ...getUserByUuidOptions({
                path: { uuid: stu.user_uuid },
            }),
            enabled: !!stu.user_uuid,
        })),
    });

    const users = userQueries.map((q) => q.data?.data).filter(Boolean);

    // 5. Combine into a useful structure
    const roster = useMemo(() => {
        return uniqueEnrollments.map((enrollment: any, index: any) => ({
            enrollment,
            student: studentQueries[index]?.data,
            user: userQueries[index]?.data?.data,
        }));
    }, [uniqueEnrollments, studentQueries, userQueries]);

    return {
        roster,
        uniqueEnrollments,
        isLoading:
            enrollmentQuery.isLoading ||
            studentQueries.some((q) => q.isLoading) ||
            userQueries.some((q) => q.isLoading),

        isError:
            enrollmentQuery.isError ||
            studentQueries.some((q) => q.isError) ||
            userQueries.some((q) => q.isError),

        errors: {
            enrollmentError: enrollmentQuery.error,
            studentErrors: studentQueries.map((q) => q.error),
            userErrors: userQueries.map((q) => q.error),
        },
    };
}
