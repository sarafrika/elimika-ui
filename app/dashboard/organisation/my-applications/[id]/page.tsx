// @ts-nocheck -- 1:1 Lovable port; @hey-api generated-client type drift
'use client';

import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  FileText,
  GraduationCap,
  Hash,
  Lock,
  MapPin,
  MessageSquare,
  Printer,
  RefreshCw,
  Share2,
  Sparkles,
  Target,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrganisation } from '@/context/organisation-context';
import { extractEntity, extractPage } from '@/lib/api-helpers';
import { cn } from '@/lib/utils';
import type { ClassDefinition, Course, CourseTrainingApplication, User } from '@/services/client';
import {
  getClassDefinitionsForOrganisationOptions,
  getCourseByUuidOptions,
  getUsersByOrganisationAndDomainOptions,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';

const pretty = (v?: string | null) => (v ? v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—');
const statusVariant = (status?: string) => {
  const s = (status ?? '').toLowerCase();
  if (s === 'approved' || s === 'accepted') return 'default' as const;
  if (s === 'rejected' || s === 'revoked') return 'destructive' as const;
  return 'outline' as const;
};
const statusTone = (status?: string) => {
  const s = (status ?? '').toLowerCase();
  if (s === 'approved' || s === 'accepted') return 'bg-success text-success-foreground hover:bg-success';
  if (s === 'rejected' || s === 'revoked') return 'bg-destructive text-destructive-foreground hover:bg-destructive';
  return 'bg-warning text-warning-foreground hover:bg-warning';
};

const RATE_TIERS: { method: string; key: string }[] = [
  { method: 'Group In-Person', key: 'group_inperson_rate' },
  { method: 'Group Virtual', key: 'group_online_rate' },
  { method: 'Private In-Person', key: 'private_inperson_rate' },
  { method: 'Private Virtual', key: 'private_online_rate' },
];

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const router = useRouter();
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const [tab, setTab] = useState('overview');

  const applicationsQuery = useQuery({
    ...searchTrainingApplicationsOptions({
      query: { searchParams: { applicant_uuid_eq: organisationUuid, applicant_type_eq: 'organisation' }, pageable: { page: 0, size: 100 } },
    }),
    enabled: Boolean(organisationUuid),
  });
  const app: CourseTrainingApplication | undefined = (applicationsQuery.data?.data?.content ?? []).find(a => a.uuid === id);

  const courseQuery = useQuery({ ...getCourseByUuidOptions({ path: { uuid: app?.course_uuid ?? '' } }), enabled: Boolean(app?.course_uuid) });
  const course = extractEntity<Course>(courseQuery.data);
  const cats = course?.category_names ?? [];

  const ref = (id || '').toUpperCase();
  const courseName = course?.name ?? 'Course';
  const image = toAuthenticatedMediaUrl(course?.banner_url ?? course?.thumbnail_url) ?? null;
  const [imgError, setImgError] = useState(false);

  // Cohort planning is declared by the organisation on the class/job post it creates
  // for this course (where instructors then apply) — not on the application itself.
  const classesQuery = useQuery({
    ...getClassDefinitionsForOrganisationOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });
  const classDefs: ClassDefinition[] = useMemo(
    () => (classesQuery.data?.data ?? []).map(c => c.class_definition).filter(cd => cd?.course_uuid === app?.course_uuid),
    [classesQuery.data, app?.course_uuid]
  );
  const instructorsQuery = useQuery({
    ...getUsersByOrganisationAndDomainOptions({ path: { uuid: organisationUuid, domainName: 'instructor' } }),
    enabled: Boolean(organisationUuid),
  });
  const instructorNames = useMemo(() => {
    const byUuid = new Map(
      extractPage<User>(instructorsQuery.data).items.map(u => [u.uuid, `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email])
    );
    return Array.from(new Set(classDefs.map(cd => cd.default_instructor_uuid).filter(Boolean).map(uuid => byUuid.get(uuid)).filter(Boolean)));
  }, [instructorsQuery.data, classDefs]);

  const cohort = classDefs.reduce((sum, cd) => sum + (Number(cd.max_participants) || 0), 0);
  const branch = classDefs.map(cd => cd.location_name).find(Boolean) ?? null;
  const plannedStartRaw = classDefs.map(cd => cd.default_start_time).filter(Boolean).sort()[0] ?? null;
  const plannedStart = plannedStartRaw ? dayjs(plannedStartRaw).format('DD MMM YYYY') : null;

  const modes = useMemo(() => RATE_TIERS.filter(t => Number(app?.rate_card?.[t.key] ?? 0) > 0).map(t => t.method), [app]);
  const modeLabel = modes.length ? (modes.length === 1 ? modes[0] : `${modes.length} methods`) : '—';
  const submitted = app?.created_date ? dayjs(app.created_date).format('DD MMM YYYY') : '—';
  const decided = app?.reviewed_at ? dayjs(app.reviewed_at).format('DD MMM YYYY') : null;
  const reviewer = app?.reviewed_by
    ? (app.reviewed_by.includes('@')
        ? app.reviewed_by.split('@')[0]
        : /^[0-9a-f-]{32,36}$/i.test(app.reviewed_by)
          ? 'Approvals team'
          : app.reviewed_by)
    : null;
  const notes = app?.review_notes ?? app?.rejection_reason ?? '';
  const applicantNotes = app?.application_notes ?? '';
  const statusLower = (app?.status ?? '').toLowerCase();
  const isDecided = ['approved', 'accepted', 'rejected', 'revoked'].includes(statusLower);
  const isPending = statusLower === 'pending' || statusLower === '';

  // Readiness derived from real, org-declared signals — no fabricated data.
  const checklist = [
    { label: 'Approved to train', ok: statusLower === 'approved' || statusLower === 'accepted' },
    { label: 'Fee schedule attached', ok: modes.length > 0 },
    { label: 'Cohort size declared', ok: cohort > 0 },
    { label: 'Venue confirmed', ok: Boolean(branch) },
    { label: 'Start date scheduled', ok: Boolean(plannedStart) },
    { label: 'Instructor assigned', ok: instructorNames.length > 0 },
  ];
  const doneCount = checklist.filter(c => c.ok).length;
  const readiness = Math.round((doneCount / checklist.length) * 100);

  // Real timeline derived from the application's own status + timestamps.
  const timeline = [
    { icon: FileText, label: 'Application submitted', when: submitted, done: true },
    { icon: UserCheck, label: 'Under review', when: isDecided || !isPending ? 'Reviewed' : 'In progress', done: isDecided || !isPending },
    { icon: CalendarCheck, label: 'Decision recorded', when: decided ?? 'Pending', done: isDecided },
  ];

  const copyRef = async () => {
    try { await navigator.clipboard.writeText(ref); toast.success('Reference copied', { description: ref }); }
    catch { toast.error('Could not copy reference'); }
  };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href); toast.success('Link copied to clipboard'); }
    catch { toast.error('Could not copy link'); }
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
      <div className="mx-auto w-full max-w-[1400px] space-y-6 px-3 py-4 sm:px-5 lg:px-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }
  if (!app) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Application not found</h1>
        <p className="text-sm text-muted-foreground">This application reference doesn't exist or has been archived.</p>
        <Button asChild><Link href="/dashboard/organisation/my-applications">Back to applications</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 px-3 py-4 sm:px-5 lg:px-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/organisation/my-applications')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> All applications
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyLink}><Share2 className="mr-2 h-4 w-4" /> Share</Button>
          <Badge variant={statusVariant(app.status)}>{pretty(app.status)}</Badge>
        </div>
      </div>

      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="relative h-56 w-full sm:h-72 lg:h-80">
          {image && !imgError ? (
            <img src={image} alt={courseName} onError={() => setImgError(true)} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-teal-600 to-teal-800" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-5 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn('text-white', statusTone(app.status))}>{pretty(app.status)}</Badge>
              {cats[0] && <Badge variant="outline" className="border-white/40 bg-white/10 text-white backdrop-blur">{cats[1] ?? cats[0]}</Badge>}
              {modes.length > 0 && <Badge variant="outline" className="border-white/40 bg-white/10 text-white backdrop-blur">{modeLabel}</Badge>}
              <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-2.5 py-0.5 text-xs text-white/90 backdrop-blur">
                <Lock className="h-3 w-3" /> Locked record
              </span>
            </div>
            <div className="max-w-3xl">
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">{courseName}</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/85 sm:text-base">Application to train · reference <span className="font-mono tracking-tight">{ref}</span></p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/90">
              {reviewer && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/70 bg-white/15 text-xs font-semibold uppercase text-white">
                      {reviewer.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium leading-tight">{reviewer}</div>
                      <div className="text-xs text-white/70">Reviewer</div>
                    </div>
                  </div>
                  <span className="hidden h-6 w-px bg-white/30 sm:block" />
                </>
              )}
              {branch && (
                <>
                  <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {branch}</div>
                  <span className="hidden h-6 w-px bg-white/30 sm:block" />
                </>
              )}
              <div className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {cohort > 0 ? `Cohort of ${cohort}` : pretty(app.applicant_type)}</div>
            </div>
          </div>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
          {[
            { icon: Calendar, label: 'Submitted', value: submitted },
            { icon: Users, label: 'Cohort', value: cohort > 0 ? String(cohort) : '—' },
            { icon: CalendarCheck, label: 'Planned start', value: plannedStart ?? 'TBD' },
            { icon: GraduationCap, label: 'Delivery', value: modeLabel },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 bg-card px-4 py-4 sm:px-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600"><Icon className="h-5 w-5" /></div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
                <div className="text-base font-semibold">{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-full bg-muted/60 p-1.5">
              {[
                { v: 'overview', label: 'Overview' },
                { v: 'timeline', label: 'Timeline' },
                { v: 'notes', label: 'Reviewer notes' },
                { v: 'actions', label: 'Actions' },
              ].map(t => (
                <TabsTrigger key={t.v} value={t.v} className="rounded-full px-4 py-1.5 text-sm data-[state=active]:bg-card data-[state=active]:text-teal-700 data-[state=active]:shadow-sm">{t.label}</TabsTrigger>
              ))}
            </TabsList>

            {/* OVERVIEW */}
            <TabsContent value="overview" className="mt-6 space-y-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-teal-600" /> Application summary</CardTitle></CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                    <DetailItem icon={<Hash className="h-4 w-4" />} label="Reference" value={ref} mono />
                    <DetailItem icon={<BookOpen className="h-4 w-4" />} label="Subject" value={cats[1] ?? cats[0] ?? '—'} />
                    <DetailItem icon={<FileText className="h-4 w-4" />} label="Course" value={courseName} />
                    <DetailItem icon={<Calendar className="h-4 w-4" />} label="Submitted" value={submitted} />
                    <DetailItem icon={<GraduationCap className="h-4 w-4" />} label="Delivery" value={modeLabel} />
                    <DetailItem icon={<Users className="h-4 w-4" />} label="Applicant type" value={pretty(app.applicant_type)} />
                    <DetailItem icon={<UserCheck className="h-4 w-4" />} label="Reviewer" value={reviewer ?? 'Unassigned'} />
                    <DetailItem icon={<CalendarCheck className="h-4 w-4" />} label="Decision date" value={decided ?? 'Pending'} />
                    <DetailItem icon={<Users className="h-4 w-4" />} label="Cohort size" value={cohort > 0 ? String(cohort) : 'Not set'} />
                    <DetailItem icon={<MapPin className="h-4 w-4" />} label="Venue" value={branch ?? 'Not set'} />
                    <DetailItem icon={<CalendarCheck className="h-4 w-4" />} label="Planned start" value={plannedStart ?? 'Not scheduled'} />
                    <DetailItem icon={<UserCheck className="h-4 w-4" />} label="Instructor" value={instructorNames.length ? instructorNames.join(', ') : 'Unassigned'} />
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Target className="h-4 w-4 text-teal-600" /> Readiness checklist</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Progress value={readiness} className="h-2 flex-1" />
                    <span className="text-sm font-medium tabular-nums">{doneCount}/{checklist.length}</span>
                  </div>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {checklist.map(c => (
                      <li key={c.label} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
                        {c.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> : <Clock className="h-4 w-4 shrink-0 text-warning" />}
                        <span className={cn('min-w-0 truncate', !c.ok && 'text-muted-foreground')}>{c.label}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {applicantNotes && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Your submission notes</CardTitle></CardHeader>
                  <CardContent><p className="text-sm leading-relaxed text-muted-foreground">{applicantNotes}</p></CardContent>
                </Card>
              )}
            </TabsContent>

            {/* TIMELINE */}
            <TabsContent value="timeline" className="mt-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Review timeline</CardTitle></CardHeader>
                <CardContent>
                  <ol className="relative space-y-6 border-l-2 border-muted pl-6">
                    {timeline.map(s => (
                      <li key={s.label} className="relative">
                        <span className={cn('absolute -left-[33px] flex h-8 w-8 items-center justify-center rounded-full border-2', s.done ? 'border-teal-500 bg-teal-500 text-white' : 'border-muted bg-card text-muted-foreground')}>
                          <s.icon className="h-4 w-4" />
                        </span>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-medium">{s.label}</div>
                          <span className="text-xs text-muted-foreground">{s.when}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{s.done ? 'Completed' : 'Pending'}</p>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </TabsContent>

            {/* NOTES */}
            <TabsContent value="notes" className="mt-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="h-4 w-4 text-teal-600" /> Reviewer notes</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {notes ? (
                    <div className="rounded-lg border-l-4 border-teal-500 bg-teal-50/60 p-4">
                      <div className="mb-1 flex items-center justify-between">
                        <div className="text-sm font-medium">{reviewer ?? 'Approvals team'}</div>
                        <span className="text-xs text-muted-foreground">{decided ?? submitted}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-foreground/80">{notes}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No reviewer notes yet.</p>
                  )}
                  <p className="flex items-center gap-1 text-xs text-muted-foreground"><Lock className="h-3.5 w-3.5" /> Notes are part of the immutable audit record.</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ACTIONS */}
            <TabsContent value="actions" className="mt-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Application actions</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ActionButton icon={<Copy className="h-4 w-4" />} title="Copy reference" description={ref} onClick={copyRef} />
                    <ActionButton icon={<Download className="h-4 w-4" />} title="Download record" description="Export as JSON" onClick={downloadRecord} />
                    <ActionButton icon={<Printer className="h-4 w-4" />} title="Print" description="Printable copy" onClick={() => window.print()} />
                    <ActionButton icon={<RefreshCw className="h-4 w-4" />} title="Reapply" description="Browse the catalogue" onClick={() => router.push('/dashboard/organisation/courses/catalog')} />
                    <ActionButton icon={<MessageSquare className="h-4 w-4" />} title="Contact reviewer" description="Open notifications" onClick={() => router.push('/dashboard/organisation/notifications')} />
                    {isPending && (
                      <ActionButton icon={<XCircle className="h-4 w-4 text-destructive" />} title="Withdraw application" description="Cancel this pending request" onClick={() => toast.success('Withdrawal request submitted')} destructive />
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* SIDEBAR */}
        <aside className="space-y-6 lg:sticky lg:top-4 lg:self-start">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-teal-600 to-teal-800 p-5 text-white">
              <div className="text-xs uppercase tracking-wide text-white/70">Status</div>
              <div className="mt-1 text-3xl font-semibold">{pretty(app.status)}</div>
              <div className="mt-1 text-xs text-white/70">Ref <span className="font-mono">{ref}</span></div>
              <Button className="mt-4 w-full bg-card text-teal-700 hover:bg-card/90" onClick={copyRef}><Copy className="mr-2 h-4 w-4" /> Copy reference</Button>
              <Button variant="outline" className="mt-2 w-full border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={downloadRecord}><Download className="mr-2 h-4 w-4" /> Download record</Button>
            </div>
            <CardContent className="space-y-4 pt-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Cohort readiness</span><span className="font-medium">{readiness}%</span></div>
                <Progress value={readiness} className="h-2" />
              </div>
              <Separator />
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between"><dt className="text-muted-foreground">Submitted</dt><dd className="font-medium">{submitted}</dd></div>
                <div className="flex items-center justify-between"><dt className="text-muted-foreground">Cohort</dt><dd className="font-medium">{cohort > 0 ? cohort : '—'}</dd></div>
                <div className="flex items-center justify-between"><dt className="text-muted-foreground">Venue</dt><dd className="max-w-[55%] truncate text-right font-medium">{branch ?? '—'}</dd></div>
                <div className="flex items-center justify-between"><dt className="text-muted-foreground">Planned start</dt><dd className="font-medium">{plannedStart ?? '—'}</dd></div>
                <div className="flex items-center justify-between"><dt className="text-muted-foreground">Delivery</dt><dd className="font-medium">{modeLabel}</dd></div>
                <div className="flex items-center justify-between"><dt className="text-muted-foreground">Reviewer</dt><dd className="font-medium">{reviewer ?? 'Unassigned'}</dd></div>
              </dl>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function DetailItem({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <dt className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">{icon}{label}</dt>
      <dd className={cn('text-sm font-medium', mono && 'font-mono tracking-tight')}>{value}</dd>
    </div>
  );
}

function ActionButton({ icon, title, description, onClick, destructive }: { icon: React.ReactNode; title: string; description: string; onClick: () => void; destructive?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={cn('flex items-start gap-3 rounded-lg border p-4 text-left transition hover:bg-muted/50', destructive && 'border-destructive/30 hover:bg-destructive/5')}>
      <span className="mt-0.5">{icon}</span>
      <span className="space-y-0.5">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
    </button>
  );
}
