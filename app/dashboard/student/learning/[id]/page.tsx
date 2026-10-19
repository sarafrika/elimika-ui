import { ClassWorkbookRoute } from '@/components/lesson/ClassWorkbookRoute';
import { WorkbookLoading } from '@/components/lesson/WorkbookLoading';
import { Suspense } from 'react';

export default async function ClassWorkbookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<WorkbookLoading />}>
      <ClassWorkbookRoute classId={id} role='student' />
    </Suspense>
  );
}
