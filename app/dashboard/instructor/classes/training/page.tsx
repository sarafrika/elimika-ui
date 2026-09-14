import { Suspense } from 'react';
import { ClassWorkbookRoute } from '@/components/lesson/ClassWorkbookRoute';
import { WorkbookLoading } from '@/components/lesson/WorkbookLoading';

export default function TrainingView() {
  return (
    <Suspense fallback={<WorkbookLoading />}>
      <ClassWorkbookRoute role='instructor' />
    </Suspense>
  );
}
