import { UserDetailView } from '../../users/_components/UserDetailView';

export default async function CourseCreatorDetailPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  return (
    <UserDetailView uuid={uuid} backHref='/dashboard/course-creators' backLabel='Back to course creators' />
  );
}
