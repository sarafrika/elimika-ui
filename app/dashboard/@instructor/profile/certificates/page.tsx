'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useInstructor } from '@/context/instructor-context';
import { getInstructorDocumentsOptions } from '@/services/client/@tanstack/react-query.gen';
import type { InstructorDocument } from '@/services/client/types.gen';
import { useQuery } from '@tanstack/react-query';
import { Download, FileWarning, RefreshCw, ShieldCheck, UploadCloud } from 'lucide-react';
import { useEffect } from 'react';

const formatDate = (value?: Date | string) => {
  if (!value) return '—';
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString();
};

const renderDocuments = (
  title: string,
  docs: InstructorDocument[],
  loading: boolean,
  emptyText: string
) => (
  <Card>
    <CardHeader className='pb-3'>
      <CardTitle className='text-lg'>{title}</CardTitle>
    </CardHeader>
    <CardContent className='space-y-3'>
      {loading ? (
        <div className='space-y-2'>
          <div className='bg-muted h-4 w-48 animate-pulse rounded' />
          <div className='bg-muted h-4 w-full animate-pulse rounded' />
          <div className='bg-muted h-4 w-2/3 animate-pulse rounded' />
        </div>
      ) : docs.length === 0 ? (
        <p className='text-muted-foreground text-sm'>{emptyText}</p>
      ) : (
        docs.map(doc => (
          <div
            key={doc.uuid ?? `${doc.original_filename}-${doc.upload_date}`}
            className='rounded-md border p-3'
          >
            <div className='flex items-start justify-between gap-3'>
              <div className='space-y-1'>
                <p className='font-medium'>{doc.title ?? doc.original_filename}</p>
                <p className='text-muted-foreground text-sm'>
                  Uploaded: {formatDate(doc.upload_date)}
                </p>
                {doc.description ? (
                  <p className='text-muted-foreground text-xs'>{doc.description}</p>
                ) : null}
              </div>
              <Badge
                variant={
                  doc.verification_status === 'VERIFIED' || doc.is_verified
                    ? 'success'
                    : 'secondary'
                }
                className='shrink-0'
              >
                {doc.verification_status ?? (doc.is_verified ? 'Verified' : 'Pending')}
              </Badge>
            </div>
            <div className='text-muted-foreground mt-3 flex flex-wrap gap-2 text-xs'>
              <span>Type: {doc.mime_type ?? 'Unknown'}</span>
              <span>Size: {doc.file_size_formatted ?? '—'}</span>
            </div>
            {doc.file_path ? (
              <div className='mt-3'>
                <Button asChild size='sm' variant='outline'>
                  <a href={doc.file_path} target='_blank' rel='noreferrer'>
                    <Download className='mr-2 h-4 w-4' />
                    View document
                  </a>
                </Button>
              </div>
            ) : null}
          </div>
        ))
      )}
    </CardContent>
  </Card>
);

export default function CertificatesPage() {
  const instructor = useInstructor();
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'profile', title: 'Profile', url: '/dashboard/profile' },
      {
        id: 'certifciates',
        title: 'Certifciates',
        url: '/dashboard/profile/certifciates',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const {
    data: documents,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    ...getInstructorDocumentsOptions({ path: { instructorUuid: instructor?.uuid as string } }),
    enabled: !!instructor?.uuid,
  });

  const loading = isLoading || isFetching;
  const allDocuments = documents?.data ?? [];
  const verifiedDocs = allDocuments.filter(
    doc => doc.is_verified || doc.verification_status === 'VERIFIED'
  );
  const pendingDocs = allDocuments.filter(doc => !verifiedDocs.includes(doc));

  return (
    <div className='mx-auto space-y-6'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-semibold'>Certificates</h1>
          <p className='text-muted-foreground text-sm'>
            Review the documents attached to your instructor profile.
          </p>
        </div>
        <Button variant='outline' size='sm' className='gap-2' onClick={() => refetch()}>
          <RefreshCw className='h-4 w-4' />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className='flex flex-wrap gap-3 pt-6 text-sm'>
          <Badge variant='secondary' className='gap-1'>
            <ShieldCheck className='h-4 w-4' />
            Verified: {verifiedDocs.length}
          </Badge>
          <Badge variant='outline' className='gap-1'>
            <FileWarning className='h-4 w-4' />
            Pending: {pendingDocs.length}
          </Badge>
          <Badge variant='outline' className='gap-1'>
            <UploadCloud className='h-4 w-4' />
            Total uploads: {allDocuments.length}
          </Badge>
        </CardContent>
      </Card>

      {isError ? (
        <Alert variant='destructive'>
          <AlertTitle>Unable to load documents</AlertTitle>
          <AlertDescription>Please try refreshing the page.</AlertDescription>
        </Alert>
      ) : null}

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        {renderDocuments('Verified documents', verifiedDocs, loading, 'No verified documents yet.')}
        {renderDocuments('Pending verification', pendingDocs, loading, 'No pending documents.')}
      </div>
    </div>
  );
}
