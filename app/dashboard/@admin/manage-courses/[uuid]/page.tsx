import { CourseReviewPage } from './_components/CourseReviewPage';

export default async function CourseDetailPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  return <CourseReviewPage uuid={uuid} />;
}
