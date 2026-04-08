import { ArrowLeft, CircleAlert } from 'lucide-react';
import Link from 'next/link';
import { buildListFromText } from '@/src/features/catalogue/format';
import type { PublicCourseDetail } from '@/src/features/catalogue/types';
import { CataloguePageShell } from './CataloguePageShell';
import { CatalogueStatusCard } from './CatalogueStatusCard';
import { CourseCurriculumSection } from './sections/CourseCurriculumSection';
import { CourseDetailHero } from './sections/CourseDetailHero';
import { CourseObjectivesSection } from './sections/CourseObjectivesSection';
import { CourseOverviewCard } from './sections/CourseOverviewCard';
import { CourseRequirementsSection } from './sections/CourseRequirementsSection';

export function PublicCourseDetailPage({ detail }: { detail: PublicCourseDetail | null }) {
  if (!detail) {
    return (
      <CataloguePageShell>
        <div className='space-y-10'>
          <Link
            href='/courses'
            className='text-primary inline-flex items-center gap-2 text-sm font-medium hover:underline'
          >
            <ArrowLeft className='h-4 w-4' />
            Back to courses
          </Link>
          <CatalogueStatusCard
            title='Course not found'
            description="The course you're looking for doesn't exist or has been removed."
            icon={CircleAlert}
            tone='error'
          />
        </div>
      </CataloguePageShell>
    );
  }

  const objectives = buildListFromText(detail.course.objectives);
  const prerequisites = buildListFromText(detail.course.prerequisites);

  return (
    <CataloguePageShell>
      <Link
        href='/courses'
        className='text-primary inline-flex items-center gap-2 text-sm font-medium hover:underline'
      >
        <ArrowLeft className='h-4 w-4' />
        Back to courses
      </Link>

      <CourseDetailHero detail={detail} />

      <div className='grid gap-6 lg:grid-cols-3'>
        <div className='space-y-6 lg:col-span-2'>
          <CourseObjectivesSection objectives={objectives} />
          <CourseCurriculumSection lessons={detail.lessons} />
          <CourseRequirementsSection prerequisites={prerequisites} />
        </div>

        <div className='lg:col-span-1'>
          <CourseOverviewCard detail={detail} />
        </div>
      </div>
    </CataloguePageShell>
  );
}
