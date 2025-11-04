// app/dashboard/@admin/statistics/page.tsx
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';
import StatisticsContent from './_components/StatisticsContent';

function StatisticsLoading() {
  return (
    <div className='bg-background flex h-[calc(100vh-120px)] items-center justify-center'>
      <div className='text-center'>
        <Loader2 className='text-primary mx-auto mb-4 h-8 w-8 animate-spin' />
        <p className='text-muted-foreground text-sm'>Loading statistics...</p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<StatisticsLoading />}>
      <StatisticsContent />
    </Suspense>
  );
}
