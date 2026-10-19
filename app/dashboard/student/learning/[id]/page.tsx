import { Suspense } from 'react';
import { ClassWorkbookRoute } from '@/components/lesson/ClassWorkbookRoute';
import { WorkbookLoading } from '@/components/lesson/WorkbookLoading';

export default async function ClassWorkbookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<WorkbookLoading />}>
      <ClassWorkbookRoute classId={id} role='student' />
    </Suspense>
  );
}


- Add rubric scoring tables and close assignment sheets after saving
  - Show student scores, submission feedback and quiz results in sheets
    - Display full assignment rubrics and remove quiz grading criteria
      - Use actual class completion percentages and refresh after sessions end
        - Refine workbook layouts, practice empty states and lesson plan actions
          - Add rubric scoring regression tests
