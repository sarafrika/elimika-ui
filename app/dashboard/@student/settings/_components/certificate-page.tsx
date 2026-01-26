'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/context/profile-context';
import { useStudent } from '@/context/student-context';
import type { Certificate } from '@/services/client';
import {
  getCertificateByNumberOptions,
  getStudentCertificatesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import {
  Clock,
  Download,
  FileWarning,
  RefreshCw,
  Search,
  Shield,
  Upload,
  Verified,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CertificateErrorModal } from './certificate-error-modal';
import { CertificateSuccessModal } from './certificate-success-modal';
import { CertificateUploadModal } from './certificate-upload-modal';

const formatDate = (value?: Date | string | null) => {
  if (!value) return '—';
  const dateValue = value instanceof Date ? value : new Date(value);
  return Number.isNaN(dateValue.getTime()) ? '—' : dateValue.toLocaleDateString();
};

const getStatusBadge = (certificate: Certificate) => {
  if (certificate.validity_status === 'pending') {
    return { label: 'Pending', variant: 'secondary' as const, icon: Clock };
  }
  if (certificate.is_valid === false) {
    return { label: 'Invalid', variant: 'secondary' as const, icon: FileWarning };
  }
  return {
    label: certificate.validity_status ?? 'Valid',
    variant: 'success' as const,
    icon: Verified,
  };
};

export default function CertificatesPage() {
  const profile = useUserProfile();
  const student = useStudent();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'pending' | 'invalid'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [verifyCertificateNumber, setVerifyCertificateNumber] = useState<string | null>(null);
  const [openSuccessModal, setOpenSuccessModal] = useState(false);
  const [openErrorModal, setOpenErrorModal] = useState(false);
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    data: certificatesResponse,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    ...getStudentCertificatesOptions({
      path: { studentUuid: student?.uuid as string },
    }),
    enabled: Boolean(student?.uuid),
  });

  const certificates = certificatesResponse?.data ?? [];

  const certificateTypes = useMemo(
    () =>
      Array.from(
        new Set(
          certificates
            .map(cert => cert.certificate_type || 'Unspecified')
            .filter(type => type && type.length > 0)
        )
      ),
    [certificates]
  );

  const filteredCertificates = useMemo(() => {
    return certificates.filter(cert => {
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'valid'
            ? cert.is_valid !== false && cert.validity_status !== 'pending'
            : statusFilter === 'pending'
              ? cert.validity_status === 'pending'
              : cert.is_valid === false;

      const matchesType =
        typeFilter === 'all' || (cert.certificate_type || 'Unspecified') === typeFilter;
      const matchesSearch =
        searchTerm.trim().length === 0 ||
        cert.certificate_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.certificate_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.template_uuid?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [certificates, searchTerm, statusFilter, typeFilter]);

  const {
    data: verificationResponse,
    isSuccess: verifySuccess,
    isError: verifyError,
    error: verifyErrorObject,
    isFetching: verifying,
  } = useQuery({
    ...getCertificateByNumberOptions({
      path: { certificateNumber: verifyCertificateNumber ?? '' },
    }),
    enabled: Boolean(verifyCertificateNumber),
    retry: false,
  });

  useEffect(() => {
    if (verifySuccess && verificationResponse?.data) {
      setOpenSuccessModal(true);
    } else if (verifySuccess && !verificationResponse?.data) {
      setOpenErrorModal(true);
    }
    if (verifyError) {
      setOpenErrorModal(true);
    }
  }, [verifySuccess, verifyError, verificationResponse]);

  const summary = useMemo(() => {
    const total = certificates.length;
    const downloadable = certificates.filter(
      cert => cert.is_downloadable && Boolean(cert.certificate_url)
    ).length;
    const pending = certificates.filter(cert => cert.validity_status === 'pending').length;
    const valid = certificates.filter(
      cert => cert.is_valid !== false && cert.validity_status !== 'pending'
    ).length;
    const invalid = total - valid - pending;
    return { total, downloadable, pending, valid, invalid };
  }, [certificates]);

  const handleVerify = (certificateNumber?: string | null) => {
    if (!certificateNumber) return;
    setVerifyCertificateNumber(certificateNumber);
  };

  const handleModalClose = () => {
    setOpenSuccessModal(false);
    setOpenErrorModal(false);
    setVerifyCertificateNumber(null);
  };

  const handleUploadClick = () => {
    setOpenUploadModal(true);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        setSelectedFile(file);
        setOpenUploadModal(true);
      } else {
        alert('Please upload an image or PDF file');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        setSelectedFile(file);
        setOpenUploadModal(true);
      } else {
        alert('Please upload an image or PDF file');
      }
    }
  };

  const handleUploadComplete = () => {
    setSelectedFile(null);
    setOpenUploadModal(false);
    refetch();
  };

  return (
    <div className='space-y-8'>
      <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <p className='text-muted-foreground text-sm'>Certificates</p>
          <h1 className='text-2xl font-semibold'>
            {profile?.first_name} {profile?.last_name}
          </h1>
          <p className='text-muted-foreground text-sm'>
            Track, verify, and download your earned certificates.
          </p>
        </div>
        <div className='flex flex-col-reverse gap-2 sm:flex-row sm:items-center'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className='gap-2'
          >
            <RefreshCw className='h-4 w-4' />
            Refresh
          </Button>
          <Button
            size='sm'
            onClick={handleUploadClick}
            className='bg-primary text-primary-foreground hover:bg-primary/90 gap-2'
          >
            <Upload className='h-4 w-4' />
            Upload Certificate
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5'>
        {[
          { label: 'Total', value: summary.total, icon: Shield, color: 'text-primary' },
          {
            label: 'Downloadable',
            value: summary.downloadable,
            icon: Download,
            color: 'text-info',
          },
          { label: 'Valid', value: summary.valid, icon: Verified, color: 'text-success' },
          { label: 'Pending', value: summary.pending, icon: Clock, color: 'text-warning' },
          {
            label: 'Invalid',
            value: summary.invalid,
            icon: FileWarning,
            color: 'text-destructive',
          },
        ].map(item => (
          <Card key={item.label} className='border-0 shadow-sm'>
            <CardContent className='flex flex-col items-center justify-center gap-2 pt-4 text-center'>
              <item.icon className={`h-5 w-5 ${item.color}`} />
              <p className='text-muted-foreground text-xs'>{item.label}</p>
              {isLoading ? (
                <Skeleton className='h-6 w-8' />
              ) : (
                <p className='text-foreground text-xl font-semibold'>{item.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Section */}
      <Card className='border-0 shadow-sm'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base'>Filters</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center'>
          <div className='relative flex-1 sm:min-w-64'>
            <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
            <Input
              placeholder='Search by number, type, or template'
              className='pl-10'
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={value => setStatusFilter(value as typeof statusFilter)}
          >
            <SelectTrigger className='w-full sm:w-44'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All statuses</SelectItem>
              <SelectItem value='valid'>Valid</SelectItem>
              <SelectItem value='pending'>Pending</SelectItem>
              <SelectItem value='invalid'>Invalid</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className='w-full sm:w-48'>
              <SelectValue placeholder='Type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All types</SelectItem>
              {certificateTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Error State */}
      {isError ? (
        <Alert variant='destructive'>
          <AlertTitle>Unable to load certificates</AlertTitle>
          <AlertDescription>Please refresh or try again later.</AlertDescription>
        </Alert>
      ) : null}

      {/* Certificates Grid */}
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        {isLoading || isFetching
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card key={`skeleton-${index}`} className='border-0 shadow-sm'>
                <CardContent className='space-y-3 pt-6'>
                  <Skeleton className='h-5 w-32' />
                  <Skeleton className='h-4 w-48' />
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-4 w-1/2' />
                </CardContent>
              </Card>
            ))
          : filteredCertificates.map(certificate => {
              const status = getStatusBadge(certificate);
              const StatusIcon = status.icon;
              const canDownload =
                certificate.is_downloadable && Boolean(certificate.certificate_url);
              return (
                <Card
                  key={
                    certificate.uuid ?? certificate.certificate_number ?? certificate.template_uuid
                  }
                  className='border-0 shadow-sm transition hover:shadow-md'
                >
                  <CardHeader className='flex flex-row items-start justify-between gap-3 pb-3'>
                    <div className='space-y-2'>
                      <CardTitle className='text-lg'>
                        {certificate.certificate_type || 'Certificate'}
                      </CardTitle>
                      <p className='text-muted-foreground text-sm'>
                        Number: {certificate.certificate_number ?? 'Pending'}
                      </p>
                      <div className='flex flex-wrap gap-2'>
                        <Badge variant={status.variant}>
                          <StatusIcon className='mr-1.5 h-3.5 w-3.5' />
                          {status.label}
                        </Badge>
                        {certificate.is_downloadable && (
                          <Badge
                            variant='outline'
                            className='border-primary/20 bg-primary/5 text-primary'
                          >
                            <Download className='mr-1 h-3 w-3' />
                            Downloadable
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='text-muted-foreground grid grid-cols-2 gap-3 text-sm'>
                      <div>
                        <p className='text-muted-foreground text-xs tracking-wide uppercase'>
                          Completion date
                        </p>
                        <p className='text-foreground font-medium'>
                          {formatDate(certificate.completion_date)}
                        </p>
                      </div>
                      <div>
                        <p className='text-muted-foreground text-xs tracking-wide uppercase'>
                          Issued date
                        </p>
                        <p className='text-foreground font-medium'>
                          {formatDate(certificate.issued_date)}
                        </p>
                      </div>
                      <div>
                        <p className='text-muted-foreground text-xs tracking-wide uppercase'>
                          Final grade
                        </p>
                        <p className='text-foreground font-medium'>
                          {certificate.final_grade ?? '—'}{' '}
                          {certificate.grade_letter ? `(${certificate.grade_letter})` : ''}
                        </p>
                      </div>
                      <div>
                        <p className='text-muted-foreground text-xs tracking-wide uppercase'>
                          Template
                        </p>
                        <p className='text-foreground font-medium'>
                          {certificate.template_uuid?.slice(0, 8) ?? 'Not set'}
                        </p>
                      </div>
                    </div>

                    {certificate.validity_status === 'pending' && (
                      <Alert className='border-warning/20 bg-warning/5'>
                        <Clock className='text-warning h-4 w-4' />
                        <AlertTitle className='text-warning'>Verification Pending</AlertTitle>
                        <AlertDescription className='text-warning/90 text-sm'>
                          This certificate is under review. It will be verified shortly.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className='flex flex-wrap gap-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        disabled={!canDownload}
                        asChild={canDownload}
                      >
                        {canDownload ? (
                          <a href={certificate.certificate_url} target='_blank' rel='noreferrer'>
                            <Download className='mr-2 h-4 w-4' />
                            Download
                          </a>
                        ) : (
                          <>
                            <Download className='mr-2 h-4 w-4' />
                            Unavailable
                          </>
                        )}
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleVerify(certificate.certificate_number)}
                        disabled={
                          !certificate.certificate_number ||
                          verifying ||
                          certificate.validity_status === 'pending'
                        }
                      >
                        <Shield className='mr-2 h-4 w-4' />
                        Verify
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {/* Empty State */}
      {!isLoading && filteredCertificates.length === 0 ? (
        <div className='border-border rounded-lg border border-dashed p-8 text-center'>
          <Shield className='text-muted-foreground mx-auto mb-3 h-12 w-12 opacity-50' />
          <p className='text-foreground text-lg font-semibold'>No certificates found</p>
          <p className='text-muted-foreground text-sm'>
            Adjust your filters or upload a certificate to get started.
          </p>
        </div>
      ) : null}

      {/* Certificate Upload Modal */}
      <CertificateUploadModal
        open={openUploadModal}
        onOpenChange={setOpenUploadModal}
        selectedFile={selectedFile}
        onUploadComplete={handleUploadComplete}
        onDragActive={setDragActive}
        dragActive={dragActive}
      />

      {/* Verification Modals */}
      <CertificateSuccessModal
        open={openSuccessModal}
        onOpenChange={handleModalClose}
        certificate={verificationResponse?.data}
      />
      <CertificateErrorModal
        open={openErrorModal}
        onOpenChange={handleModalClose}
        message={
          verifyErrorObject instanceof Error
            ? verifyErrorObject.message
            : 'The certificate number could not be verified.'
        }
      />

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type='file'
        accept='image/*,.pdf'
        onChange={handleFileSelect}
        className='hidden'
      />
    </div>
  );
}
