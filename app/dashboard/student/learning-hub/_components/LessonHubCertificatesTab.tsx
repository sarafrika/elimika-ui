'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import type { Certificate } from '@/services/client/types.gen';
import { Download, ExternalLink, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
// import { QRCodeCanvas } from 'qrcode.react';
import { useMemo } from 'react';
import type { LearningHubData } from './useStudentLearningHubData';

type CertificateViewModel = {
    id: string;
    title: string;
    sourceLabel: string;
    issuedLabel: string;
    code: string | null;
    href: string;
    scoreLabel?: string;
    isValid: boolean;
};

function formatDate(value?: Date | string | null) {
    if (!value) return 'Unknown date';

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown date';

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(date);
}

function getCertificateTitle(certificate: Certificate, learningHubData: LearningHubData) {
    if (certificate.course_uuid) {
        const courseName = learningHubData.courseEnrollments.find(
            item => item.course_uuid === certificate.course_uuid
        )?.course_name;

        if (courseName) {
            return courseName;
        }
    }

    if (certificate.program_uuid) {
        return 'Program completion';
    }

    return 'Certificate of completion';
}

function getCertificateSourceLabel(certificate: Certificate, learningHubData: LearningHubData) {
    if (certificate.program_uuid) {
        return 'Completed program';
    }

    if (certificate.course_uuid) {
        const courseEnrollment = learningHubData.courseEnrollments.find(
            item => item.course_uuid === certificate.course_uuid
        );

        if (courseEnrollment?.statusLabel === 'Completed') {
            return `Completed course`;
        }

        return 'Completed learning';
    }

    if (learningHubData.classEnrollments.some(item => item.statusLabel === 'Completed')) {
        return 'Completed class';
    }

    return 'Completed learning';
}

function getCertificateHref(certificate: Certificate) {
    const code = certificate.certificate_number?.trim();

    return code ? `/certificate/${code}` : '';
}

function CertificateCard({ certificate }: { certificate: CertificateViewModel }) {
    const hasCode = Boolean(certificate.code);

    const verifyUrl = hasCode
        ? `/certificate/${certificate.code}`
        : certificate.href;

    return (
        <Card className={cn(certificate.isValid === false && 'opacity-60')}>
            <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <CardTitle className="text-base leading-snug break-words">
                            {certificate.title || 'Course'}
                        </CardTitle>

                        <CardDescription className="mt-1">
                            {certificate.issuedLabel}
                            {certificate.scoreLabel && ` · ${certificate.scoreLabel}`}
                        </CardDescription>
                    </div>

                    <Badge
                        variant={certificate.isValid ? 'secondary' : 'destructive'}
                        className="shrink-0"
                    >
                        {certificate.isValid ? 'Verifiable' : 'Revoked'}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div>
                    <p className="text-muted-foreground mb-1 text-xs">
                        Certificate code
                    </p>

                    <p className="font-mono text-sm font-semibold break-all">
                        {certificate.code ?? 'Pending'}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {verifyUrl ? (
                        <Button asChild size="sm">
                            <Link
                                href={verifyUrl}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <Download className="mr-1 size-4" />
                                Download / Print
                            </Link>
                        </Button>
                    ) : (
                        <Button size="sm" disabled>
                            <Download className="mr-1 size-4" />
                            Download / Print
                        </Button>
                    )}

                    {hasCode ? (
                        <Button asChild size="sm" variant="outline">
                            <Link
                                href={`/certificate/${certificate.code}`}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <ExternalLink className="mr-1 size-4" />
                                Verify
                            </Link>
                        </Button>
                    ) : (
                        <Button size="sm" variant="outline" disabled>
                            <ExternalLink className="mr-1 size-4" />
                            Verify
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

type LessonHubCertificatesTabProps = {
    learningHubData: LearningHubData;
};

export function LessonHubCertificatesTab({ learningHubData }: LessonHubCertificatesTabProps) {
    const certificateRows = useMemo<CertificateViewModel[]>(() => {
        return [...learningHubData.certificates]
            .sort((a, b) => {
                const left = new Date(b.issued_date ?? b.completion_date ?? 0).getTime();
                const right = new Date(a.issued_date ?? a.completion_date ?? 0).getTime();
                return left - right;
            })
            .map(certificate => {
                const code = certificate.certificate_number?.trim() ?? '';
                const href = getCertificateHref(certificate);
                const title = getCertificateTitle(certificate, learningHubData);
                const sourceLabel = getCertificateSourceLabel(certificate, learningHubData);

                return {
                    id: certificate.uuid ?? code ?? `${certificate.student_uuid}-${certificate.course_uuid ?? certificate.program_uuid ?? 'certificate'}`,
                    title,
                    sourceLabel,
                    issuedLabel: `Issued ${formatDate(certificate.issued_date ?? certificate.completion_date)}`,
                    code: code || null,
                    href,
                    scoreLabel:
                        typeof certificate.final_grade === 'number'
                            ? `Final grade ${Math.round(certificate.final_grade)}%`
                            : undefined,
                    isValid: certificate.is_valid !== false,
                };
            });
    }, [learningHubData]);

    const completedCourseCount = learningHubData.courseEnrollments.filter(
        item => item.statusLabel === 'Completed'
    ).length;
    const completedClassCount = learningHubData.classEnrollments.filter(
        item => item.statusLabel === 'Completed'
    ).length;

    if (learningHubData.loading && certificateRows.length === 0) {
        return (
            <div className='space-y-4'>
                <div className='flex items-center justify-between gap-3'>
                    <div className='space-y-1'>
                        <h2 className='text-foreground text-lg font-semibold'>Certificates</h2>
                        <p className='text-muted-foreground text-sm'>Loading live certificate records...</p>
                    </div>
                    <Badge variant='secondary'>0 earned</Badge>
                </div>

                <div className='grid gap-4 md:grid-cols-2'>
                    {Array.from({ length: 2 }).map((_, index) => (
                        <Card key={`certificate-skeleton-${index}`} className='border-border/70 bg-card'>
                            <CardHeader className='space-y-2'>
                                <div className='flex items-start justify-between gap-3'>
                                    <div className='space-y-2'>
                                        <div className='bg-muted h-5 w-44 rounded' />
                                        <div className='bg-muted h-4 w-36 rounded' />
                                    </div>
                                    <div className='bg-muted h-6 w-16 rounded-full' />
                                </div>
                            </CardHeader>
                            <CardContent className='space-y-3'>
                                <div className='bg-muted/50 h-24 rounded-xl' />
                                <div className='flex gap-2'>
                                    <div className='bg-muted h-9 w-32 rounded-md' />
                                    <div className='bg-muted h-9 w-24 rounded-md' />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (certificateRows.length === 0) {
        return (
            <EmptyState
                icon={ShieldCheck}
                title='No certificates yet'
                description='Complete a course or class to see issued certificates appear here in real time.'
                action={
                    <Button asChild>
                        <Link href='/dashboard/student/learning-hub'>
                            Continue learning
                        </Link>
                    </Button>
                }
            />
        );
    }

    return (
        <div className='space-y-4'>
            <div className='flex flex-wrap items-start justify-between gap-3'>
                <div className='space-y-1'>
                    <h2 className='text-foreground text-xl font-semibold'>Certificates</h2>
                    <p className='text-muted-foreground text-sm'>
                        Earned certificates with QR-based verification.
                    </p>
                </div>

                <Badge variant='secondary'>{certificateRows.length} earned</Badge>
            </div>

            <div className='mt-6 grid gap-4 md:grid-cols-2'>
                {certificateRows.map(certificate => (
                    <CertificateCard key={certificate.id} certificate={certificate} />
                ))}
            </div>
        </div>
    );
}

export default LessonHubCertificatesTab;
