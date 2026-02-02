'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useInstructor } from '@/context/instructor-context';
import { getInstructorDocumentsOptions, getInstructorDocumentsQueryKey, uploadInstructorDocumentMutation } from '@/services/client/@tanstack/react-query.gen';
import type { InstructorDocument } from '@/services/client/types.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, FileWarning, RefreshCw, ShieldCheck, UploadCloud } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Input } from '../../../../../components/ui/input';
import { cn } from '../../../../../lib/utils';

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
  const qc = useQueryClient()

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false)

  const isPdfFile = (file: File) =>
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  const uploadInstructorDocument = useMutation(uploadInstructorDocumentMutation())

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

      <div
        className={cn(
          'space-y-4 rounded-lg border-2 flex flex-col items-center border-dashed p-8 transition-all',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border bg-background'
        )}
        onDragOver={e => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setIsDragging(false);

          const file = e.dataTransfer.files?.[0];
          if (!file) return;

          if (!isPdfFile(file)) {
            toast.error('Only PDF files are supported');
            return;
          }

          setMediaFile(file);
        }}

      >
        <Input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (!file) return;

            if (!isPdfFile(file)) {
              toast.error('Only PDF files are supported');
              e.target.value = '';
              return;
            }

            setMediaFile(file);
          }}
        />


        <div
          onClick={() => fileInputRef.current?.click()}
          className='cursor-pointer rounded-md text-center'
        >
          <p className="text-foreground mb-1 font-medium">
            {mediaFile
              ? mediaFile.name
              : 'Drag & drop or click to upload a PDF'}
          </p>

          <p className="text-muted-foreground text-sm">
            PDF files only (application/pdf)
          </p>

        </div>

        <Button
          type='button'
          disabled={!mediaFile || uploadInstructorDocument.isPending}
          onClick={() => {
            if (!mediaFile) return;
            uploadInstructorDocument.mutate(
              {
                body: { file: mediaFile },
                path: {
                  instructorUuid: instructor?.uuid as string,
                },
                query: {
                  title: 'Title',
                  description: 'Desscription',
                  document_type_uuid: '35b49d4c-aec0-4a88-873b-5fa91342198f',
                  education_uuid: '',
                  experience_uuid: '',
                  expiry_date: '',
                  membership_uuid: '',
                },
              },
              {
                onSuccess: () => {
                  toast.success('Document uploaded');
                  setMediaFile(null);
                  qc.invalidateQueries({
                    queryKey: getInstructorDocumentsQueryKey({
                      path: {
                        instructorUuid: instructor?.uuid as string,
                      },
                    }),
                  });
                },
                onError: (error) => {
                  toast.error(error?.message)
                }
              }
            );
          }}
          className='w-full max-w-[150px]'
        >
          {uploadInstructorDocument.isPending ? 'Uploading...' : 'Upload Document'}
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
