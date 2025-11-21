'use client';

import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { getCertificateByUuidOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

// revoked data
const data = {
  uuid: 'c1e2r3t4-5i6f-7i8c-9a10-abcdefghijkl',
  certificate_number: 'CERT-2024-JAV-001234',
  student_uuid: 's1t2u3d4-5e6n-7t8u-9s10-abcdefghijkl',
  course_uuid: 'c1o2u3r4-5s6e-7d8a-9t10-abcdefghijkl',
  program_uuid: null,
  template_uuid: 't1e2m3p4-5l6a-7t8e-9u10-abcdefghijkl',
  issued_date: '2024-05-15T16:30:00',
  completion_date: '2024-05-15T15:45:00',
  final_grade: 87.5,
  certificate_url: 'https://cdn.sarafrika.com/certificates/CERT-2024-JAV-001234.pdf',
  is_valid: true,
  revoked_at: '2024-05 - 15T16: 30:00',
  revoked_reason: 'Impersonation, Plagiarism of project work',
  created_date: '2024-05-15T16:30:00',
  created_by: 'system',
  updated_date: '2024-05-15T16:30:00',
  updated_by: 'system',
  certificate_type: 'Course Completion',
  grade_letter: 'B+',
  is_downloadable: true,
  validity_status: 'Valid Certificate',
};

// cert data
// const data = {
//     uuid: 'c1e2r3t4-5i6f-7i8c-9a10-abcdefghijkl',
//     certificate_number: 'CERT-2024-JAV-001234',
//     student_uuid: 's1t2u3d4-5e6n-7t8u-9s10-abcdefghijkl',
//     course_uuid: 'c1o2u3r4-5s6e-7d8a-9t10-abcdefghijkl',
//     program_uuid: null,
//     template_uuid: 't1e2m3p4-5l6a-7t8e-9u10-abcdefghijkl',
//     issued_date: '2024-05-15T16:30:00',
//     completion_date: '2024-05-15T15:45:00',
//     final_grade: 87.5,
//     certificate_url: 'https://cdn.sarafrika.com/certificates/CERT-2024-JAV-001234.pdf',
//     is_valid: true,
//     revoked_at: null,
//     revoked_reason: null,
//     created_date: '2024-05-15T16:30:00',
//     created_by: 'system',
//     updated_date: '2024-05-15T16:30:00',
//     updated_by: 'system',
//     certificate_type: 'Course Completion',
//     grade_letter: 'B+',
//     is_downloadable: true,
//     validity_status: 'Valid Certificate',
// };

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

  // TODO: Replace with real query
  const { data: certId } = useQuery(getCertificateByUuidOptions({ path: { uuid: certificateId } }));

  return (
    <div className='space-y-8 p-2 sm:p-4 md:p-6'>
      <div>
        <h1 className='text-2xl font-bold'>Certificate Details</h1>
        <p className='text-muted-foreground'>Detailed view of your earned certificate.</p>
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <div className='space-y-3 text-sm'>
          <p>
            <span className='font-medium'>Certificate Type:</span> {data.certificate_type}
          </p>
          <p>
            <span className='font-medium'>Certificate Number:</span> {data.certificate_number}
          </p>
          <p>
            <span className='font-medium'>Final Grade:</span> {data.final_grade} (
            {data.grade_letter})
          </p>
          <p>
            <span className='font-medium'>Completion Date:</span>{' '}
            {new Date(data.completion_date).toLocaleDateString()}
          </p>
          <p>
            <span className='font-medium'>Issued Date:</span>{' '}
            {new Date(data.issued_date).toLocaleDateString()}
          </p>
          <p>
            <span className='font-medium'>Status:</span>{' '}
            <span className='font-semibold text-success'>{data.validity_status}</span>
          </p>

          {data.revoked_at !== null ? (
            <>
              <p className='font-semibold text-destructive'>This certificate has been revoked.</p>
              {data.revoked_reason && (
                <p className='text-sm text-destructive'>Reason: {data.revoked_reason}</p>
              )}
              <p className='mt-2 text-muted-foreground'>Certificate link and download are disabled.</p>
            </>
          ) : (
            <>
              <p>
                <span className='font-medium'>Download Link:</span>{' '}
                {data.certificate_url ? (
                  <Link
                    href={data.certificate_url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-primary underline'
                  >
                    {data.certificate_number}
                  </Link>
                ) : (
                  'Unavailable'
                )}
              </p>

              {data.is_downloadable && data.certificate_url && (
                <a
                  href={data.certificate_url}
                  download
                  target='_blank'
                  rel='noopener noreferrer'
                  className='mt-3 inline-block rounded bg-primary px-4 py-2 text-primary-foreground transition hover:bg-primary/90'
                >
                  Download Certificate
                </a>
              )}
            </>
          )}
        </div>

        <div>
          {data.revoked_at !== null ? (
            <div className='rounded border bg-destructive/10 p-4 text-center text-destructive shadow'>
              Certificate preview is unavailable because this certificate has been revoked.
            </div>
          ) : data.certificate_url ? (
            <div className='h-[500px] overflow-hidden rounded border shadow-md'>
              <iframe
                src={data.certificate_url}
                className='h-full w-full'
                title='Certificate Preview'
              ></iframe>
            </div>
          ) : (
            <p className='text-muted-foreground'>Preview not available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificatePreviewPage;
