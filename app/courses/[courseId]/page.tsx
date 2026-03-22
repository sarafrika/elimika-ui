import { PublicCourseDetailPage } from '@/src/components/catalogue/PublicCourseDetailPage';
import { getPublicCourseDetail } from '@/src/lib/catalogue/server';

type CourseDetailPageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function CourseDetailRoute({ params }: CourseDetailPageProps) {
  const { courseId } = await params;
  const detail = await getPublicCourseDetail(courseId);

  return <PublicCourseDetailPage detail={detail} />;
}
