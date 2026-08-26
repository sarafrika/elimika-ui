import InstructorApprovedCourseDetailsPage from '@/src/features/dashboard/courses/pages/InstructorApprovedCourseDetailsPage';

type InstructorMyCourseDetailsPageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function InstructorMyCourseDetailsPage({
    params,
}: InstructorMyCourseDetailsPageProps) {
    const { id } = await params;

    return <InstructorApprovedCourseDetailsPage courseId={id} />;
}
