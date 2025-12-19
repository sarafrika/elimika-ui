'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { getCertificateByUuidOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

const CertificatePreviewPage = () => {
  const params = useParams();
  const certificateId = params?.id as string;
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    if (!certificateId) return;

    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      {
        id: 'certificates',
        title: 'Certificates',
        url: '/dashboard/certificates',
      },
      {
        id: 'preview-certificate',
        title: 'Preview',
        url: `/dashboard/certificates/${certificateId}`,
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs, certificateId]);

  const { data, isLoading, isError } = useQuery({
    ...getCertificateByUuidOptions({ path: { uuid: certificateId } }),
    enabled: Boolean(certificateId),
  });

  const certificate = data?.data;

  if (isLoading) {
    return (
      <div className='space-y-6 p-2 sm:p-4 md:p-6'>
        <Skeleton className='h-8 w-48' />
        <Card>
          <CardContent className='space-y-4 pt-6'>
            <Skeleton className='h-4 w-40' />
            <Skeleton className='h-4 w-64' />
            <Skeleton className='h-52 w-full' />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !certificate) {
    return (
      <div className='p-2 sm:p-4 md:p-6'>
        <Alert variant='destructive'>
          <AlertTitle>Certificate not found</AlertTitle>
          <AlertDescription>
            We could not load this certificate. Please check the link or try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className='space-y-8 p-2 sm:p-4 md:p-6'>
      <div>
        <h1 className='text-2xl font-bold'>Certificate Details</h1>
        <p className='text-muted-foreground'>Detailed view of your earned certificate.</p>
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-lg'>
              {certificate.certificate_type || 'Certificate'}
            </CardTitle>
            <div className='text-muted-foreground flex flex-wrap gap-2 text-sm'>
              <Badge
                variant={
                  certificate.revoked_at || certificate.is_valid === false
                    ? 'destructive'
                    : 'success'
                }
              >
                {certificate.validity_status ?? (certificate.revoked_at ? 'Revoked' : 'Valid')}
              </Badge>
              <span>Number: {certificate.certificate_number ?? 'Pending'}</span>
            </div>
          </CardHeader>
          <CardContent className='space-y-3 text-sm'>
            <p>
              <span className='font-medium'>Final Grade:</span> {certificate.final_grade ?? '—'}{' '}
              {certificate.grade_letter ? `(${certificate.grade_letter})` : ''}
            </p>
            <p>
              <span className='font-medium'>Completion Date:</span>{' '}
              {certificate.completion_date
                ? new Date(certificate.completion_date).toLocaleDateString()
                : '—'}
            </p>
            <p>
              <span className='font-medium'>Issued Date:</span>{' '}
              {certificate.issued_date
                ? new Date(certificate.issued_date).toLocaleDateString()
                : '—'}
            </p>
            <p>
              <span className='font-medium'>Template:</span>{' '}
              {certificate.template_uuid ?? 'Not set'}
            </p>

            {certificate.revoked_at ? (
              <Alert variant='destructive'>
                <AlertTitle>Certificate revoked</AlertTitle>
                <AlertDescription>
                  {certificate.revoked_reason ?? 'This certificate is no longer valid.'}
                </AlertDescription>
              </Alert>
            ) : (
              <div className='space-y-2'>
                <p>
                  <span className='font-medium'>Download link:</span>{' '}
                  {certificate.certificate_url ? (
                    <Link
                      href={certificate.certificate_url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-primary underline'
                    >
                      {certificate.certificate_number ?? 'Certificate link'}
                    </Link>
                  ) : (
                    'Unavailable'
                  )}
                </p>

                {certificate.is_downloadable && certificate.certificate_url ? (
                  <Button asChild>
                    <a href={certificate.certificate_url} target='_blank' rel='noopener noreferrer'>
                      Download certificate
                    </a>
                  </Button>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {certificate.revoked_at ? (
              <div className='bg-destructive/10 text-destructive rounded border p-4 text-center shadow'>
                Certificate preview is unavailable because this certificate has been revoked.
              </div>
            ) : certificate.certificate_url ? (
              <div className='h-[500px] overflow-hidden rounded border shadow-md'>
                <iframe
                  src={certificate.certificate_url}
                  className='h-full w-full'
                  title='Certificate Preview'
                />
              </div>
            ) : (
              <p className='text-muted-foreground'>Preview not available.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CertificatePreviewPage;
