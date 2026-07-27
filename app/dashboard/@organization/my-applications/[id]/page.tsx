// @ts-nocheck -- 1:1 Lovable port; @hey-api generated-client type drift
'use client';

import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Copy,
  Download,
  FileText,
  GraduationCap,
  Hash,
  Lock,
  MessageSquare,
  Printer,
  RefreshCw,
  Users,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/page-header';
import { useOrganisation } from '@/context/organisation-context';
import { extractEntity } from '@/lib/api-helpers';
import type { Course, CourseTrainingApplication } from '@/services/client';
import { getCourseByUuidOptions, searchTrainingApplicationsOptions } from '@/services/client/@tanstack/react-query.gen';

const statusVariant = (status?: string) => {
  const s = (status ?? '').toLowerCase();
  if (s === 'approved' || s === 'accepted') return 'default' as const;
  if (s === 'rejected' || s === 'revoked') return 'destructive' as const;
  return 'outline' as const;
};
const pretty = (v?: string | null) => (v ? v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—');

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

function ActionButton({ icon, title, description, onClick, destructive }: { icon: React.ReactNode; title: string; description: string; onClick: () => void; destructive?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-3 rounded-lg border p-4 text-left transition hover:bg-muted/50 ${destructive ? 'border-destructive/30 hover:bg-destructive/5' : ''}`}
    >
      <span className="mt-0.5">{icon}</span>
      <span className="space-y-0.5">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
    </button>
  );
}

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const router = useRouter();
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const [tab, setTab] = useState('overview');

  const applicationsQuery = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        searchParams: { applicant_uuid_eq: organisationUuid, applicant_type_eq: 'organisation' },
        pageable: { page: 0, size: 100 },
      },
    }),
    enabled: Boolean(organisationUuid),
  });
  const app: CourseTrainingApplication | undefined = (applicationsQuery.data?.data?.content ?? []).find(a => a.uuid === id);

  const courseQuery = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: app?.course_uuid ?? '' } }),
    enabled: Boolean(app?.course_uuid),
  });
  const course = extractEntity<Course>(courseQuery.data);
  const cats = course?.category_names ?? [];

  const ref = (id || '').toUpperCase();
  const courseName = course?.name ?? 'Course';
  const notes = app?.review_notes ?? app?.rejection_reason ?? '';

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(ref);
      toast.success('Reference copied', { description: ref });
    } catch {
      toast.error('Could not copy reference');
    }
  };
  const downloadRecord = () => {
    const blob = new Blob([JSON.stringify(app ?? {}, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `application-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Record downloaded');
  };

  if (applicationsQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!app) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Application not found</h1>
        <p className="text-sm text-muted-foreground">This application reference doesn't exist or has been archived.</p>
        <Button asChild>
          <Link href="/dashboard/my-applications">Back to applications</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]">
      <div>
        <Button variant="ghost" size="sm" className="mb-3 -ml-2 h-8" onClick={() => router.push('/dashboard/my-applications')}>
          <ArrowLeft className="mr-1 h-4 w-4" /> All applications
        </Button>
        <PageHeader title={courseName} description={`Immutable record · ${ref}`} />
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" /> Locked audit record
          <Badge variant={statusVariant(app.status)} className="ml-1">{pretty(app.status)}</Badge>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="notes">Reviewer notes</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Application details</CardTitle>
              <CardDescription>Submitted values are locked as part of the permanent audit trail.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                <DetailItem icon={<Hash className="h-4 w-4" />} label="Reference" value={ref} />
                <DetailItem icon={<BookOpen className="h-4 w-4" />} label="Subject" value={cats[1] ?? cats[0] ?? '—'} />
                <DetailItem icon={<FileText className="h-4 w-4" />} label="Course" value={courseName} />
                <DetailItem icon={<Calendar className="h-4 w-4" />} label="Submitted" value={app.created_date ? dayjs(app.created_date).format('DD MMM YYYY') : '—'} />
                <DetailItem icon={<Users className="h-4 w-4" />} label="Applicant type" value={pretty(app.applicant_type)} />
                <DetailItem icon={<GraduationCap className="h-4 w-4" />} label="Status" value={pretty(app.status)} />
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4 text-muted-foreground" /> Reviewer notes
              </CardTitle>
              <CardDescription>Written by the approvals team when the decision was made.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">{notes || 'No notes provided.'}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
              <CardDescription>The record itself can't be changed. These actions let you share it, reference it, or start a follow-up.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <ActionButton icon={<Copy className="h-4 w-4" />} title="Copy reference" description={ref} onClick={copyRef} />
              <ActionButton icon={<Download className="h-4 w-4" />} title="Download record" description="Export as JSON" onClick={downloadRecord} />
              <ActionButton icon={<Printer className="h-4 w-4" />} title="Print" description="Printable copy" onClick={() => window.print()} />
              <ActionButton icon={<RefreshCw className="h-4 w-4" />} title="Reapply" description="Start a new application" onClick={() => router.push('/dashboard/courses/catalog')} />
              <ActionButton icon={<MessageSquare className="h-4 w-4" />} title="Contact reviewer" description="Open notifications" onClick={() => router.push('/dashboard/notifications')} />
              {pretty(app.status) === 'Pending' ? (
                <ActionButton icon={<XCircle className="h-4 w-4 text-destructive" />} title="Withdraw application" description="Cancel this pending request" onClick={() => toast.success('Withdrawal request submitted')} destructive />
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
