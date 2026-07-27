import { Suspense } from 'react';
import { auth } from '@/services/auth';
import { fetchVerificationQueue } from '@/services/admin/credential-review';
import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';
import { SectionCardSkeleton } from '../_components/ui/SectionCard';
import { VerificationQueue } from './_components/VerificationQueue';

async function VerificationQueueSection() {
  const [documents, session] = await Promise.all([fetchVerificationQueue(), auth()]);
  const verifier = session?.user?.email || 'admin';
  return <VerificationQueue documents={documents} verifierIdentity={verifier} />;
}

export default function VerificationsPage() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Document verification'
          description='Review and verify documents submitted by instructors and course creators across the platform.'
        />
        <Suspense fallback={<SectionCardSkeleton rows={6} />}>
          <VerificationQueueSection />
        </Suspense>
      </div>
    </main>
  );
}
