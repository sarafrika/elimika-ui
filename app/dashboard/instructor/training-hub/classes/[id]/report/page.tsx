import { ClassReportGrid } from '@/components/lesson/ClassReportGrid';

export default async function ClassReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className='mx-auto w-full px-3 py-4 sm:px-4 lg:px-5'>
      <ClassReportGrid classId={id} />
    </main>
  );
}
