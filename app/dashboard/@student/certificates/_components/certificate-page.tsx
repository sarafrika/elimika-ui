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
  Download,
  FileWarning,
  RefreshCw,
  Search,
  Shield,
  ShieldOff,
  Verified,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CertificateErrorModal } from './certificate-error-modal';
import { CertificateSuccessModal } from './certificate-success-modal';

const formatDate = (value?: Date | string | null) => {
  if (!value) return '—';
  const dateValue = value instanceof Date ? value : new Date(value);
  return Number.isNaN(dateValue.getTime()) ? '—' : dateValue.toLocaleDateString();
};

const getStatusBadge = (certificate: Certificate) => {
  if (certificate.revoked_at) {
    return { label: 'Revoked', variant: 'destructive' as const, icon: ShieldOff };
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'revoked'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [verifyCertificateNumber, setVerifyCertificateNumber] = useState<string | null>(null);
  const [openSuccessModal, setOpenSuccessModal] = useState(false);
  const [openErrorModal, setOpenErrorModal] = useState(false);

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
            ? !cert.revoked_at && cert.is_valid !== false
            : Boolean(cert.revoked_at || cert.is_valid === false);

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
    const revoked = certificates.filter(cert => cert.revoked_at || cert.is_valid === false).length;
    const valid = total - revoked;
    return { total, downloadable, revoked, valid };
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

  return (
    <div className='space-y-8'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <p className='text-muted-foreground text-sm'>Certificates</p>
          <h1 className='text-2xl font-semibold'>
            {profile?.first_name} {profile?.last_name}
          </h1>
          <p className='text-muted-foreground text-sm'>
            Track, verify, and download your earned certificates.
          </p>
        </div>
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
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
        {[
          { label: 'Total certificates', value: summary.total, icon: Shield },
          { label: 'Downloadable', value: summary.downloadable, icon: Download },
          { label: 'Valid', value: summary.valid, icon: Verified },
          { label: 'Revoked / invalid', value: summary.revoked, icon: ShieldOff },
        ].map(item => (
          <Card key={item.label}>
            <CardContent className='flex items-center justify-between gap-3 pt-6'>
              <div>
                <p className='text-muted-foreground text-sm'>{item.label}</p>
                {isLoading ? (
                  <Skeleton className='mt-2 h-6 w-12' />
                ) : (
                  <p className='text-2xl font-semibold'>{item.value}</p>
                )}
              </div>
              <item.icon className='text-primary h-6 w-6' />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-base'>Filters</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-wrap items-center gap-4'>
          <div className='relative min-w-64 flex-1'>
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
            <SelectTrigger className='w-44'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All statuses</SelectItem>
              <SelectItem value='valid'>Valid</SelectItem>
              <SelectItem value='revoked'>Revoked / invalid</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className='w-48'>
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

      {isError ? (
        <Alert variant='destructive'>
          <AlertTitle>Unable to load certificates</AlertTitle>
          <AlertDescription>Please refresh or try again later.</AlertDescription>
        </Alert>
      ) : null}

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        {isLoading || isFetching
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card key={`skeleton-${index}`}>
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
                  className='transition hover:shadow-md'
                >
                  <CardHeader className='flex flex-row items-start justify-between gap-3 pb-3'>
                    <div className='space-y-1'>
                      <CardTitle className='text-lg'>
                        {certificate.certificate_type || 'Certificate'}
                      </CardTitle>
                      <p className='text-muted-foreground text-sm'>
                        Number: {certificate.certificate_number ?? 'Pending'}
                      </p>
                      <div className='flex flex-wrap gap-2'>
                        <Badge variant={status.variant}>
                          <StatusIcon className='h-3.5 w-3.5' />
                          {status.label}
                        </Badge>
                        {certificate.is_downloadable && (
                          <Badge variant='outline' className='border-primary text-primary'>
                            Downloadable
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <div className='text-muted-foreground grid grid-cols-2 gap-3 text-sm'>
                      <div>
                        <p className='text-xs tracking-wide uppercase'>Completion date</p>
                        <p className='text-foreground font-medium'>
                          {formatDate(certificate.completion_date)}
                        </p>
                      </div>
                      <div>
                        <p className='text-xs tracking-wide uppercase'>Issued date</p>
                        <p className='text-foreground font-medium'>
                          {formatDate(certificate.issued_date)}
                        </p>
                      </div>
                      <div>
                        <p className='text-xs tracking-wide uppercase'>Final grade</p>
                        <p className='text-foreground font-medium'>
                          {certificate.final_grade ?? '—'}{' '}
                          {certificate.grade_letter ? `(${certificate.grade_letter})` : ''}
                        </p>
                      </div>
                      <div>
                        <p className='text-xs tracking-wide uppercase'>Template</p>
                        <p className='text-foreground font-medium'>
                          {certificate.template_uuid?.slice(0, 8) ?? 'Not set'}
                        </p>
                      </div>
                    </div>

                    {certificate.revoked_reason ? (
                      <Alert variant='destructive'>
                        <AlertTitle>Revoked</AlertTitle>
                        <AlertDescription className='text-sm'>
                          {certificate.revoked_reason}
                        </AlertDescription>
                      </Alert>
                    ) : null}

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
                        disabled={!certificate.certificate_number || verifying}
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

      {!isLoading && filteredCertificates.length === 0 ? (
        <div className='rounded-md border border-dashed p-8 text-center'>
          <p className='text-lg font-semibold'>No certificates found</p>
          <p className='text-muted-foreground text-sm'>
            Adjust your filters or check back after completing more courses.
          </p>
        </div>
      ) : null}

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
    </div>
  );
}
