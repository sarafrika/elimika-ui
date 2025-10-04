'use client'

import { useParams } from "next/navigation";

const CourseInstructorDetails = () => {
    const params = useParams();
    const instructorId = params?.id as string;

    return (
        <div>CourseInstructorDetails</div>
    )
}

export default CourseInstructorDetails