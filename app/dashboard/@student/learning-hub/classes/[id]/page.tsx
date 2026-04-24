'use client';

import { useStudent } from '@/context/student-context';
import {
    getClassEnrollmentsForStudentOptions
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import StudentClassPage from '../_components/StudentClassPage';

export default function Page() {
    const params = useParams()
    const classId = params.id as string

    const student = useStudent();

    const { data: studentEnrolledClassResp } = useQuery({
        ...getClassEnrollmentsForStudentOptions({ path: { studentUuid: student?.uuid as string }, query: { pageable: {} } })
    })
    const studentEnrolledClasses =
        studentEnrolledClassResp?.data?.content?.filter(
            item => item.class_definition_uuid === classId
        ) || [];

    return (
        <StudentClassPage
            studentEnrolledClasses={studentEnrolledClasses ?? []}
            loading={false}
        />
    );
}
