import { CatalogueSectionCard } from '../CatalogueSectionCard';
import { getLessonDescription } from '@/src/lib/catalogue/format';
import type { PublicCourseDetail } from '@/src/lib/catalogue/types';
import { BookOpen } from 'lucide-react';

type LessonItemProps = {
  lesson: PublicCourseDetail['lessons'][number];
  index: number;
};

function LessonItem({ lesson, index }: LessonItemProps) {
  const safeDescription = getLessonDescription(lesson);
  const lessonNumber = lesson.lesson_number || index;

  return (
    <div className='group border-border bg-muted/40 hover:border-primary/40 hover:bg-primary/5 rounded-2xl border p-4 transition'>
      <div className='flex items-start gap-4'>
        <div className='bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold'>
          {lessonNumber}
        </div>
        <div className='flex-1 space-y-1'>
          <h4 className='text-foreground font-semibold'>{lesson.title}</h4>
          {safeDescription ? (
            <div
              className='text-muted-foreground line-clamp-2 text-sm'
              dangerouslySetInnerHTML={{ __html: safeDescription }}
            />
          ) : (
            <p className='text-muted-foreground text-sm'>No lesson description provided yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function CourseCurriculumSection({ lessons }: { lessons: PublicCourseDetail['lessons'] }) {
  if (lessons.length === 0) {
    return null;
  }

  return (
    <CatalogueSectionCard
      title='Course curriculum'
      description={`${lessons.length} ${lessons.length === 1 ? 'lesson' : 'lessons'} to help you master the material`}
      icon={BookOpen}
    >
      <div className='space-y-3'>
        {lessons.map((lesson, index) => (
          <LessonItem
            key={lesson.uuid ?? `${lesson.title}-${index}`}
            index={index + 1}
            lesson={lesson}
          />
        ))}
      </div>
    </CatalogueSectionCard>
  );
}
