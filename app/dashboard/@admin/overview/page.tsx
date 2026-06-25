import { ClipboardCheck, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';
import { SectionCard, SectionCardSkeleton } from '../_components/ui/SectionCard';
import { StatCardSkeleton } from '../_components/ui/StatCard';
import { ActivitySection } from './_components/ActivitySection';
import { KpiSection } from './_components/KpiSection';

function KpiSkeleton() {
  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {Array.from({ length: 6 }).map((_, index) => (
        <StatCardSkeleton key={index} />
      ))}
    </div>
  );
}

export default function OverviewPage() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Admin overview'
          description='A live snapshot of platform health, people, content, and commerce.'
          actions={
            <>
              <Button variant='outline' asChild>
                <Link href='/dashboard/verifications'>
                  <ShieldCheck className='size-4' />
                  Verifications
                </Link>
              </Button>
              <Button variant='outline' asChild>
                <Link href='/dashboard/moderation'>
                  <ClipboardCheck className='size-4' />
                  Moderation
                </Link>
              </Button>
            </>
          }
        />

        {/* KPI grid — streams independently */}
        <Suspense fallback={<KpiSkeleton />}>
          <KpiSection />
        </Suspense>

        {/* Activity — streams independently */}
        <Suspense fallback={<SectionCardSkeleton rows={6} />}>
          <SectionCard title='Recent activity' description='Latest system-wide events.'>
            <ActivitySection />
          </SectionCard>
        </Suspense>
      </div>
    </main>
  );
}
