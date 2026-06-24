'use client'

import { useParams, useSearchParams } from "next/navigation";

const InstructorStudentsDetailPage = () => {
    const params = useParams();
    const searchParams = useSearchParams();

    const userUuid = params?.id as string;
    const studentId = searchParams.get("sId");

    return (
        <div>
            <div>User UUID: {userUuid}</div>
            <div>Student ID: {studentId}</div>
        </div>
    );
};

export default InstructorStudentsDetailPage;