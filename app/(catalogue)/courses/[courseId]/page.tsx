import type { Metadata } from 'next';
import { PublicCourseDetailPage } from '@/src/features/catalogue/components/PublicCourseDetailPage';
import { getCourseDisplayTitle, sanitizeRichText } from '@/src/features/catalogue/format';
import { getPublicCourseDetail } from '@/src/features/catalogue/server';
import { createPageMetadata } from '@/src/lib/seo';

type CourseDetailPageProps = {
  params: Promise<{ courseId: string }>;
};

export async function generateMetadata({ params }: CourseDetailPageProps): Promise<Metadata> {
  const { courseId } = await params;
  const detail = await getPublicCourseDetail(courseId);

  if (!detail) {
    return createPageMetadata({
      title: 'Course not found',
      description: 'The course you requested could not be found on Elimika.',
      path: `/courses/${courseId}`,
      noIndex: true,
    });
  }

  const title = getCourseDisplayTitle(detail.course);
  const descriptionSource =
    sanitizeRichText(detail.course.description) ||
    sanitizeRichText(detail.course.objectives) ||
    `Explore ${title} on Elimika.`;
  const description = descriptionSource.slice(0, 160);

  return createPageMetadata({
    title,
    description,
    path: `/courses/${courseId}`,
    image: detail.course.thumbnail_url ?? null,
    keywords: [title, 'course', 'training', 'Elimika'],
  });
}

export default async function CourseDetailRoute({ params }: CourseDetailPageProps) {
  const { courseId } = await params;
  const detail = await getPublicCourseDetail(courseId);

  return <PublicCourseDetailPage detail={detail} />;
}
