'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { CertificateData } from './CertificatePDF';

// @react-pdf/renderer is ~1.3 MB; it loads only when a certificate preview renders.
const CertificateViewer = dynamic(() => import('./CertificateViewer'), {
  ssr: false,
  loading: () => <Skeleton className='m-6 h-[720px]' />,
});

export default function CertificatePage({ certData }: { certData: CertificateData }) {
  return <CertificateViewer certData={certData} />;
}
