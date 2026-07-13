import { CourseDetailView } from '../_components/CourseDetailView';

export default async function CourseDetailPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  return <CourseDetailView uuid={uuid} />;
}
