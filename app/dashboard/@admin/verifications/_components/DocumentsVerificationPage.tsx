'use client';

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BriefcaseBusiness,
  ChevronRight,
  Filter,
  GraduationCap,
  Search,
  Users,
} from 'lucide-react';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import * as pdfjsLib from 'pdfjs-dist';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { CredentialDetailGrid } from '@/components/profile-credentials/_components/CredentialDetailGrid';
import { CredentialsTabs } from '@/components/profile-credentials/_components/CredentialsTabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useUserProfile } from '@/context/profile-context';
import { cn } from '@/lib/utils';
import type {
  CourseCreator,
  CourseCreatorDocumentDto,
  CourseCreatorEducation,
  CourseCreatorExperience,
  CourseCreatorProfessionalMembership,
  DocumentTypeOption,
  Instructor,
  InstructorDocument,
  InstructorEducation,
  InstructorExperience,
  InstructorProfessionalMembership,
  Student,
} from '@/services/client';
import {
  getAllCourseCreatorsOptions,
  getAllInstructorsOptions,
  getAllStudentsOptions,
  getCourseCreatorDocumentsOptions,
  getCourseCreatorDocumentsQueryKey,
  getCourseCreatorEducationOptions,
  getCourseCreatorExperienceOptions,
  getCourseCreatorMembershipsOptions,
  getInstructorDocumentsOptions,
  getInstructorDocumentsQueryKey,
  getInstructorEducationOptions,
  getInstructorExperienceOptions,
  getInstructorMembershipsOptions,
  listDocumentTypesOptions,
  verifyCourseCreatorDocumentMutation,
  verifyDocumentMutation
} from '@/services/client/@tanstack/react-query.gen';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';

type ReviewRole = 'instructor' | 'course_creator' | 'student';
type ReviewStatusFilter = 'all' | 'pending' | 'verified' | 'rejected';

type ReviewItem = {
  id: string;
  role: ReviewRole;
  roleLabel: string;
  ownerUuid?: string;
  ownerName: string;
  ownerMeta?: string;
  documentUuid?: string;
  documentLabel: string;
  documentTitle: string;
  documentUrl?: string;
  statusLabel: string;
  statusTone: 'success' | 'warning' | 'destructive' | 'outline';
  recordKind?: 'education' | 'membership' | 'experience';
  recordSummary?: string;
  details?: Array<{ label: string; value: string }>;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
  fileSize?: string;
  uploadedAt?: string;
  uploadedTimestamp?: number;
  documentTypeLabel?: string;
  documentTypeUuid?: string;
  rawDocument: InstructorDocument | CourseCreatorDocumentDto;
};

type ReviewSheetState = {
  open: boolean;
  item: ReviewItem | null;
};

const PAGEABLE = { page: 0, size: 200, sort: ['desc'] };

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

function formatDate(value?: Date | string) {
  if (!value) return 'Recently';
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Recently';
  return parsed.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatBytes(bytes?: bigint | number) {
  if (!bytes) return undefined;
  const size = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  if (!Number.isFinite(size) || size <= 0) return undefined;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getProfileName(profile?: Instructor | CourseCreator | Student) {
  if (!profile) return 'Unknown profile';
  const record = profile as Partial<Record<'full_name' | 'professional_headline', string>>;
  return record.full_name || record.professional_headline || 'Unknown profile';
}

function getProfileMeta(profile?: Instructor | CourseCreator | Student) {
  if (!profile) return undefined;
  const record = profile as Partial<Record<'formatted_location' | 'email', string>>;
  const details = [record.formatted_location, record.email].filter(Boolean);
  return details.join(' • ') || undefined;
}

function getDocumentTypeLabel(
  documentTypeUuid: string | undefined,
  documentTypes: Map<string, DocumentTypeOption>
) {
  if (!documentTypeUuid) return 'Document';
  const resolved = documentTypes.get(documentTypeUuid);
  return resolved?.name || resolved?.description || 'Document';
}

function getInstructorDocumentStatus(document: InstructorDocument) {
  const verificationStatus = document.verification_status;
  const verified = document.is_verified || verificationStatus === 'VERIFIED';
  const rejected = verificationStatus === 'REJECTED';

  if (verified) {
    return {
      label: 'Verified',
      tone: 'success' as const,
    };
  }

  if (rejected) {
    return {
      label: 'Rejected',
      tone: 'destructive' as const,
    };
  }

  return {
    label: 'Pending review',
    tone: 'warning' as const,
  };
}

function getCourseCreatorDocumentStatus(document: CourseCreatorDocumentDto) {
  if (document.is_verified) {
    return {
      label: 'Verified',
      tone: 'success' as const,
    };
  }

  return {
    label: 'Pending review',
    tone: 'warning' as const,
  };
}

function getStatusBadgeClass(tone: ReviewItem['statusTone']) {
  switch (tone) {
    case 'success':
      return 'border-success/20 bg-success/10 text-success';
    case 'warning':
      return 'border-warning/20 bg-warning/10 text-warning';
    case 'destructive':
      return 'border-destructive/20 bg-destructive/10 text-destructive';
    default:
      return 'border-border/70 bg-background/80 text-muted-foreground';
  }
}

function formatYearValue(value?: number | string | Date | null) {
  if (value === null || value === undefined || value === '') return 'Not specified';
  if (typeof value === 'number') return `${value}`;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? 'Not specified' : `${value.getFullYear()}`;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : `${parsed.getFullYear()}`;
}

function formatRange(start?: Date | string, end?: Date | string, active?: boolean) {
  const formatDate = (value?: Date | string) => {
    if (!value) return undefined;
    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) return undefined;
    return parsed.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  };

  return [formatDate(start), active ? 'Present' : formatDate(end)].filter(Boolean).join(' - ') || 'Not specified';
}

function buildRecordDetails(
  record:
    | InstructorEducation
    | InstructorProfessionalMembership
    | InstructorExperience
    | CourseCreatorEducation
    | CourseCreatorProfessionalMembership
    | CourseCreatorExperience
    | undefined,
  kind: ReviewItem['recordKind']
) {
  if (!record || !kind) return [];

  if (kind === 'education') {
    const education = record as InstructorEducation | CourseCreatorEducation;
    return [
      { label: 'Institution', value: education.school_name || 'Not specified' },
      { label: 'Qualification', value: education.qualification || 'Not specified' },
      {
        label: 'Field',
        value: education.field_of_study || 'Not specified',
      },
      {
        label: 'Completed',
        value:
          'formatted_completion' in education && education.formatted_completion
            ? education.formatted_completion
            : formatYearValue(education.year_completed),
      },
      { label: 'Certificate', value: education.certificate_number || 'Not specified' },
    ];
  }

  if (kind === 'membership') {
    const membership = record as
      | InstructorProfessionalMembership
      | CourseCreatorProfessionalMembership;
    const organisation =
      'organisation_name' in membership
        ? membership.organisation_name
        : 'Not specified';
    const status = 'membership_status' in membership
      ? membership.membership_status
      : membership.status_label;
    return [
      { label: 'Organisation', value: organisation },
      { label: 'Membership No.', value: membership.membership_number || 'Not specified' },
      {
        label: 'Period',
        value:
          ('membership_period' in membership && membership.membership_period) ||
          formatRange(membership.start_date, membership.end_date, membership.is_active),
      },
      { label: 'Status', value: status || (membership.is_active ? 'Active' : 'Inactive') },
    ];
  }

  const experienceRecord = record as InstructorExperience | CourseCreatorExperience;
  return [
    { label: 'Position', value: experienceRecord.position || 'Not specified' },
    { label: 'Organisation', value: experienceRecord.organisation_name || 'Not specified' },
    {
      label: 'Period',
      value:
        ('tenure_label' in experienceRecord && experienceRecord.tenure_label) ||
        formatRange(experienceRecord.start_date, experienceRecord.end_date, experienceRecord.is_current_position),
    },
    {
      label: 'Years',
      value: formatYearValue(experienceRecord.years_of_experience),
    },
    {
      label: 'Responsibilities',
      value: experienceRecord.responsibilities || 'Not specified',
    },
  ];
}

function summarizeLinkedRecord(
  record:
    | InstructorEducation
    | InstructorProfessionalMembership
    | InstructorExperience
    | CourseCreatorEducation
    | CourseCreatorProfessionalMembership
    | CourseCreatorExperience
    | undefined,
  kind: ReviewItem['recordKind']
) {
  if (!record || !kind) return undefined;

  if (kind === 'education') {
    const education = record as InstructorEducation | CourseCreatorEducation;
    if ('full_description' in education && education.full_description) return education.full_description;
    return `${education.qualification || 'Education'} at ${education.school_name || 'Unknown institution'}`;
  }

  if (kind === 'membership') {
    const membership = record as
      | InstructorProfessionalMembership
      | CourseCreatorProfessionalMembership;
    if ('summary' in membership && membership.summary) return membership.summary;
    const organisation =
      'organisation_name' in membership
        ? membership.organisation_name
        : 'Unknown organisation';
    return `${organisation} membership`;
  }

  const experience = record as InstructorExperience | CourseCreatorExperience;
  if ('tenure_label' in experience && experience.tenure_label) return experience.tenure_label;
  return `${experience.position || 'Experience'} at ${experience.organisation_name || 'Unknown organisation'}`;
}


function getDocumentUrl(document: InstructorDocument | CourseCreatorDocumentDto) {
  const resolved = toAuthenticatedMediaUrl(document.file_url ?? document.file_path ?? undefined);
  return resolved || document.file_url || document.file_path || undefined;
}

function PdfPreview({
  documentUrl,
  documentLabel,
  documentTitle,
  height = 190, // default (card preview)
  fullHeight = false, // optional override
}: {
  documentUrl: string;
  documentLabel: string;
  documentTitle: string;
  height?: number;
  fullHeight?: boolean;
}) {
  const resolvedUrl = toAuthenticatedMediaUrl(documentUrl) || documentUrl;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentUrl) return;

    let cancelled = false;
    let pdfDoc: PDFDocumentProxy | null = null;

    const renderPage = async (pdf: PDFDocumentProxy) => {
      const page: PDFPageProxy = await pdf.getPage(1);
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;

      const viewport = page.getViewport({ scale: fullHeight ? 1.6 : 1.1 });
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = '100%';
      canvas.style.height = 'auto';

      const renderParams: Parameters<PDFPageProxy['render']>[0] = {
        canvasContext: context,
        canvas,
        viewport,
      };

      await page.render(renderParams).promise;
    };

    const load = async () => {
      try {
        setError(null);
        const pdf = await pdfjsLib.getDocument(resolvedUrl).promise;
        if (cancelled) return;
        pdfDoc = pdf;
        await renderPage(pdf);
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : 'Preview unavailable.');
      }
    };

    void load();

    return () => {
      cancelled = true;
      pdfDoc?.destroy().catch(() => { });
    };
  }, [documentUrl, resolvedUrl]);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-t-[16px] border-b bg-[linear-gradient(180deg,color-mix(in_srgb,var(--background)_96%,white_4%),color-mix(in_srgb,var(--background)_88%,var(--el-accent-azure)_12%))] p-3',
        fullHeight ? 'h-auto' : 'overflow-hidden'
      )}
      style={!fullHeight ? { height } : undefined}
    >
      <div className='pointer-events-none absolute inset-x-0 top-0 h-18 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--background)_92%,white_8%),transparent)]' />
      <div className='pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,color-mix(in_srgb,var(--background)_94%,white_6%))]' />
      <div className='pointer-events-none absolute top-4 left-4 z-10 rounded-full border border-white/80 bg-background/85 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur'>
        {error ? 'Preview unavailable' : documentTitle}
      </div>
      <div className='h-full overflow-hidden rounded-[12px] border border-border/70 bg-background shadow-[0_18px_40px_-28px_rgba(26,56,126,0.35)]'>
        {error ? (
          <div className='flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground'>
            {error}
          </div>
        ) : (
          <canvas ref={canvasRef} className='block w-full' />
        )}
      </div>
    </div>
  );
}

function ReviewCard({
  item,
  onOpenReview,
  onOpenViewer,
}: {
  item: ReviewItem;
  onOpenReview: (item: ReviewItem) => void;
  onOpenViewer: (item: ReviewItem) => void;
}) {
  const hasDocumentUrl = !!item.documentUrl;

  return (
    <Card className='w-full gap-0 overflow-hidden rounded-[18px] border-white/60 bg-card/95 py-0 shadow-sm max-w-[450px]'>
      {hasDocumentUrl ? (
        <PdfPreview
          documentUrl={item.documentUrl as string}
          documentLabel={item.documentLabel}
          documentTitle={item.documentTitle}
        />
      ) : (
        <div className='flex h-[190px] items-center justify-center rounded-t-[16px] border-b bg-muted/20 px-4 text-center text-sm text-muted-foreground'>
          Preview unavailable
        </div>
      )}

      <div className='space-y-4 px-5 py-4'>
        <div className='space-y-2'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <Badge
              variant='secondary'
              className='rounded-lg bg-[color-mix(in_srgb,var(--primary)_8%,white)] px-3 py-1 text-primary'
            >
              {item.documentLabel || 'Document'}
            </Badge>

            <Badge
              variant='outline'
              className={cn(
                'rounded-lg px-3 py-1 text-xs',
                getStatusBadgeClass(item.statusTone)
              )}
            >
              {item.statusLabel}
            </Badge>
          </div>

          <div className='flex flex-wrap items-center gap-3 text-base'>
            <span className='text-muted-foreground'>
              {item.ownerName}
              {item.ownerMeta ? ` • ${item.ownerMeta}` : ''}
            </span>
            <span className='text-muted-foreground'>|</span>
            {item.recordSummary ? (
              <p className='text-muted-foreground text-sm leading-6'>
                {item.recordSummary}
              </p>
            ) : null}
          </div>

          <p className='text-muted-foreground text-xs'>
            Uploaded {item.uploadedAt || 'Recently'}
            {item.verifiedAt ? ` • Verified ${item.verifiedAt}` : ''}
          </p>
        </div>

        <div className='flex flex-wrap gap-2'>
          <Badge
            variant='outline'
            className='min-h-10 rounded-lg border-white/70 bg-background/80 px-3 text-sm font-medium text-muted-foreground'
          >
            {item.fileSize || 'Unknown size'}
          </Badge>

          {/* {hasDocumentUrl && (
            <Button
              variant="outline"
              className="min-h-10 rounded-lg border-white/70 bg-background/80 px-4"
              onClick={() => onOpenViewer(item)}
            >
              View
              <ChevronRight className="size-4" />
            </Button>
          )} */}

          <Button
            variant='outline'
            className='min-h-10 rounded-lg border-white/70 bg-background/80 px-4'
            onClick={() => onOpenReview(item)}
          >
            Review
            <ChevronRight className='size-4' />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ReviewSheet({
  state,
  verifierName,
  onOpenChange,
  onVerify,
  isVerifying,
}: {
  state: ReviewSheetState;
  verifierName?: string;
  onOpenChange: (open: boolean) => void;
  onVerify: (notes: string) => Promise<void>;
  isVerifying: boolean;
}) {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setNotes(state.item?.notes ?? '');
  }, [state.item]);

  const item = state.item;

  return (
    <Sheet open={state.open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='flex w-full flex-col overflow-y-auto p-0 sm:max-w-[720px]'>
        <SheetHeader className='border-border/70 border-b px-6 py-5 text-left'>
          <SheetTitle className='text-2xl'>Review document</SheetTitle>
          <SheetDescription>
            Verify the uploaded document after checking the preview, owner, and attached notes.
          </SheetDescription>
        </SheetHeader>

        {item ? (
          <div className='space-y-5 px-6 py-5'>
            {item.documentUrl ? (
              <div className='overflow-hidden rounded-[18px] border bg-card shadow-sm'>
                <PdfPreview documentUrl={item.documentUrl} documentLabel={item.documentLabel} documentTitle={item.documentTitle} fullHeight />
              </div>
            ) : null}

            <div className='grid gap-4 rounded-[18px] border bg-card p-4 shadow-sm'>
              <div className='flex flex-wrap items-start justify-between gap-3'>
                <div className='space-y-1'>
                  <h3 className='text-foreground text-xl font-semibold'>{item.ownerName}</h3>
                  <div className="flex items-center gap-2 min-w-0">
                    {item.recordSummary && (
                      <p className="text-muted-foreground text-sm truncate">
                        {item.recordSummary}
                      </p>
                    )}

                    {item.recordSummary && (
                      <span className="text-muted-foreground shrink-0">-</span>
                    )}

                    <p className="text-muted-foreground text-sm truncate">
                      {item.documentTitle}
                    </p>
                  </div>
                </div>
                <Badge
                  variant='outline'
                  className={cn('rounded-lg px-3 py-1', getStatusBadgeClass(item.statusTone))}
                >
                  {item.statusLabel}
                </Badge>
              </div>

              <div className='grid gap-3 text-sm sm:grid-cols-2'>
                <DetailRow label='Role' value={item.roleLabel} />
                <DetailRow label='Document type' value={item.documentTypeLabel || 'Document'} />
                <DetailRow label='Uploaded' value={item.uploadedAt || 'Recently'} />
                <DetailRow label='Verified' value={item.verifiedAt || 'Not yet verified'} />
                <DetailRow label='Size' value={item.fileSize || 'Unknown'} />
                <DetailRow label='Verifier' value={verifierName || 'Admin'} />
              </div>
            </div>

            {item.details && item.details.length > 0 ? (
              <div className='rounded-[18px] border bg-card p-4 shadow-sm'>
                <div className='mb-3 space-y-1'>
                  <h4 className='text-foreground font-semibold'>Linked credential</h4>
                  <p className='text-muted-foreground text-sm'>
                    This document supports the {item.recordKind ?? 'credential'} record below.
                  </p>
                </div>
                <CredentialDetailGrid details={item.details} />
              </div>
            ) : null}

            <div className='rounded-[18px] border bg-card p-4 shadow-sm'>
              <div className='mb-2 flex items-center justify-between gap-3'>
                <div>
                  <h4 className='text-foreground font-semibold'>Verification notes</h4>
                  <p className='text-muted-foreground text-sm'>
                    Add a short audit note before confirming the document.
                  </p>
                </div>
              </div>
              <Textarea
                value={notes}
                onChange={event => setNotes(event.target.value)}
                placeholder='Add verification notes'
                className='min-h-32 rounded-xl'
              />
            </div>

            {item.notes ? (
              <div className='rounded-[18px] border border-dashed bg-muted/20 p-4'>
                <p className='text-foreground mb-1 text-sm font-medium'>Existing notes</p>
                <p className='text-muted-foreground text-sm leading-6'>{item.notes}</p>
              </div>
            ) : null}

            <Separator />

            <div className='flex flex-wrap gap-3'>
              <Button
                type='button'
                className='min-h-11 rounded-xl px-5'
                disabled={isVerifying || item.statusLabel === 'Verified'}
                onClick={() => void onVerify(notes)}
              >
                {item.statusLabel === 'Verified' ? 'Already verified' : 'Verify document'}
              </Button>
              {item.documentUrl ? (
                <Button type='button' variant='outline' className='min-h-11 rounded-xl px-5' asChild>
                  <a href={item.documentUrl} target='_blank' rel='noreferrer'>
                    Open file
                  </a>
                </Button>
              ) : (
                <Button type='button' variant='outline' className='min-h-11 rounded-xl px-5' disabled>
                  Open file
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function PdfViewerModal({
  item,
  open,
  onOpenChange,
}: {
  item: ReviewItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!item || !item.documentUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen max-w-none h-screen p-0 gap-0">
        <div className="flex h-full flex-col bg-background">

          {/* Header */}
          <DialogHeader className="border-b px-6 py-4 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold">
                {item.documentTitle}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {item.ownerName} • {item.documentLabel}
              </p>
            </div>
          </DialogHeader>

          {/* Viewer */}
          <div className="flex-1 overflow-auto bg-muted/20 p-6">
            <div className="mx-auto max-w-4xl">
              <PdfPreview
                documentUrl={item.documentUrl}
                documentLabel={item.documentLabel}
                documentTitle={item.documentTitle}
                fullHeight
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-xl border bg-muted/20 px-3 py-2.5'>
      <p className='text-muted-foreground text-xs uppercase tracking-wide'>{label}</p>
      <p className='text-foreground mt-1 text-sm font-medium'>{value}</p>
    </div>
  );
}

export default function DocumentsVerificationPage() {
  const admin = useUserProfile();
  const qc = useQueryClient();
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReviewStatusFilter>('all');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<ReviewRole>('instructor');
  const [sheetState, setSheetState] = useState<ReviewSheetState>({
    open: false,
    item: null,
  });
  const [viewerItem, setViewerItem] = useState<ReviewItem | null>(null);

  const profileName = admin?.full_name || admin?.email || 'Admin';
  const verifierIdentity = admin?.email || admin?.full_name || 'admin';

  const instructorsQuery = useQuery(
    getAllInstructorsOptions({ query: { pageable: PAGEABLE } })
  );
  const courseCreatorsQuery = useQuery(
    getAllCourseCreatorsOptions({ query: { pageable: PAGEABLE } })
  );
  const studentsQuery = useQuery(getAllStudentsOptions({ query: { pageable: PAGEABLE } }));
  const documentTypesQuery = useQuery(listDocumentTypesOptions());

  const instructors = useMemo(
    () => (instructorsQuery.data?.data?.content ?? []) as Instructor[],
    [instructorsQuery.data?.data?.content]
  );
  const courseCreators = useMemo(
    () => (courseCreatorsQuery.data?.data?.content ?? []) as CourseCreator[],
    [courseCreatorsQuery.data?.data?.content]
  );
  const students = useMemo(
    () => (studentsQuery.data?.data?.content ?? []) as Student[],
    [studentsQuery.data?.data?.content]
  );
  const documentTypes = useMemo(
    () => (documentTypesQuery.data?.data ?? []) as DocumentTypeOption[],
    [documentTypesQuery.data?.data]
  );

  const documentTypesMap = useMemo(
    () => new Map(documentTypes.map(item => [item.uuid as string, item])),
    [documentTypes]
  );

  const instructorsWithUuid = useMemo(
    () => instructors.filter((item): item is Instructor & { uuid: string } => !!item.uuid),
    [instructors]
  );
  const courseCreatorsWithUuid = useMemo(
    () => courseCreators.filter((item): item is CourseCreator & { uuid: string } => !!item.uuid),
    [courseCreators]
  );

  const instructorDocumentQueries = useQueries({
    queries: instructorsWithUuid.map(instructor =>
      getInstructorDocumentsOptions({ path: { instructorUuid: instructor.uuid } })
    ),
  });
  const courseCreatorDocumentQueries = useQueries({
    queries: courseCreatorsWithUuid.map(courseCreator =>
      getCourseCreatorDocumentsOptions({ path: { courseCreatorUuid: courseCreator.uuid } })
    ),
  });
  const instructorEducationQueries = useQueries({
    queries: instructorsWithUuid.map(instructor =>
      getInstructorEducationOptions({ path: { instructorUuid: instructor.uuid } })
    ),
  });
  const instructorMembershipQueries = useQueries({
    queries: instructorsWithUuid.map(instructor =>
      getInstructorMembershipsOptions({
        path: { instructorUuid: instructor.uuid },
        query: { pageable: PAGEABLE },
      })
    ),
  });
  const instructorExperienceQueries = useQueries({
    queries: instructorsWithUuid.map(instructor =>
      getInstructorExperienceOptions({
        path: { instructorUuid: instructor.uuid },
        query: { pageable: PAGEABLE },
      })
    ),
  });
  const courseCreatorEducationQueries = useQueries({
    queries: courseCreatorsWithUuid.map(courseCreator =>
      getCourseCreatorEducationOptions({
        path: { courseCreatorUuid: courseCreator.uuid },
        query: { pageable: PAGEABLE },
      })
    ),
  });
  const courseCreatorMembershipQueries = useQueries({
    queries: courseCreatorsWithUuid.map(courseCreator =>
      getCourseCreatorMembershipsOptions({
        path: { courseCreatorUuid: courseCreator.uuid },
        query: { pageable: PAGEABLE },
      })
    ),
  });
  const courseCreatorExperienceQueries = useQueries({
    queries: courseCreatorsWithUuid.map(courseCreator =>
      getCourseCreatorExperienceOptions({
        path: { courseCreatorUuid: courseCreator.uuid },
        query: { pageable: PAGEABLE },
      })
    ),
  });

  const instructorEducationMaps = useMemo(
    () =>
      new Map(
        instructorsWithUuid.map((instructor, index) => [
          instructor.uuid,
          ((instructorEducationQueries[index]?.data?.data ?? []) as InstructorEducation[]).filter(
            item => !!item.uuid
          ),
        ])
      ),
    [instructorEducationQueries, instructorsWithUuid]
  );
  const instructorMembershipMaps = useMemo(
    () =>
      new Map(
        instructorsWithUuid.map((instructor, index) => [
          instructor.uuid,
          ((instructorMembershipQueries[index]?.data?.data?.content ?? []) as InstructorProfessionalMembership[]).filter(
            item => !!item.uuid
          ),
        ])
      ),
    [instructorMembershipQueries, instructorsWithUuid]
  );
  const instructorExperienceMaps = useMemo(
    () =>
      new Map(
        instructorsWithUuid.map((instructor, index) => [
          instructor.uuid,
          ((instructorExperienceQueries[index]?.data?.data?.content ?? []) as InstructorExperience[]).filter(
            item => !!item.uuid
          ),
        ])
      ),
    [instructorExperienceQueries, instructorsWithUuid]
  );
  const courseCreatorEducationMaps = useMemo(
    () =>
      new Map(
        courseCreatorsWithUuid.map((courseCreator, index) => [
          courseCreator.uuid,
          ((courseCreatorEducationQueries[index]?.data?.data?.content ?? []) as CourseCreatorEducation[]).filter(
            item => !!item.uuid
          ),
        ])
      ),
    [courseCreatorEducationQueries, courseCreatorsWithUuid]
  );
  const courseCreatorMembershipMaps = useMemo(
    () =>
      new Map(
        courseCreatorsWithUuid.map((courseCreator, index) => [
          courseCreator.uuid,
          ((courseCreatorMembershipQueries[index]?.data?.data?.content ?? []) as CourseCreatorProfessionalMembership[]).filter(
            item => !!item.uuid
          ),
        ])
      ),
    [courseCreatorMembershipQueries, courseCreatorsWithUuid]
  );
  const courseCreatorExperienceMaps = useMemo(
    () =>
      new Map(
        courseCreatorsWithUuid.map((courseCreator, index) => [
          courseCreator.uuid,
          ((courseCreatorExperienceQueries[index]?.data?.data?.content ?? []) as CourseCreatorExperience[]).filter(
            item => !!item.uuid
          ),
        ])
      ),
    [courseCreatorExperienceQueries, courseCreatorsWithUuid]
  );

  const reviewItems = useMemo(() => {
    const instructorItems = instructorDocumentQueries.flatMap((query, index) => {
      const owner = instructorsWithUuid[index];
      if (!owner) return [];
      const documents = (query.data?.data ?? []) as InstructorDocument[];

      return documents.map(document => {
        const status = getInstructorDocumentStatus(document);
        const education = document.education_uuid
          ? instructorEducationMaps.get(owner.uuid)?.find(item => item.uuid === document.education_uuid)
          : undefined;
        const membership = (document as InstructorDocument & { membership_uuid?: string }).membership_uuid
          ? instructorMembershipMaps.get(owner.uuid)?.find(
            item =>
              item.uuid ===
              (document as InstructorDocument & { membership_uuid?: string }).membership_uuid
          )
          : undefined;
        const experience = (document as InstructorDocument & { experience_uuid?: string }).experience_uuid
          ? instructorExperienceMaps.get(owner.uuid)?.find(
            item =>
              item.uuid ===
              (document as InstructorDocument & { experience_uuid?: string }).experience_uuid
          )
          : undefined;
        const linkedRecord = education ?? membership ?? experience;
        const recordKind = education
          ? ('education' as const)
          : membership
            ? ('membership' as const)
            : experience
              ? ('experience' as const)
              : undefined;
        return {
          id: `instructor-${document.uuid ?? `${owner.uuid}-${document.original_filename}`}`,
          role: 'instructor' as const,
          roleLabel: 'Instructor',
          ownerUuid: owner.uuid,
          ownerName: getProfileName(owner),
          ownerMeta: getProfileMeta(owner),
          documentUuid: document.uuid,
          documentLabel:
            getDocumentTypeLabel(document.document_type_uuid, documentTypesMap) ||
            document.original_filename,
          documentTitle: document.title || document.original_filename,
          documentUrl: getDocumentUrl(document),
          statusLabel: status.label,
          statusTone: status.tone,
          recordKind,
          recordSummary: summarizeLinkedRecord(linkedRecord, recordKind),
          details: recordKind ? buildRecordDetails(linkedRecord as never, recordKind) : undefined,
          verifiedBy: document.verified_by,
          verifiedAt: document.verified_at ? formatDate(document.verified_at) : undefined,
          notes: document.verification_notes || undefined,
          fileSize: formatBytes(document.file_size_bytes),
          uploadedAt: formatDate(document.upload_date || document.created_date),
          uploadedTimestamp: new Date(document.upload_date || document.created_date || 0).getTime(),
          documentTypeLabel: getDocumentTypeLabel(document.document_type_uuid, documentTypesMap),
          documentTypeUuid: document.document_type_uuid,
          rawDocument: document,
        } satisfies ReviewItem;
      });
    });

    const courseCreatorItems = courseCreatorDocumentQueries.flatMap((query, index) => {
      const owner = courseCreatorsWithUuid[index];
      if (!owner) return [];
      const documents = (query.data?.data ?? []) as CourseCreatorDocumentDto[];

      return documents.map(document => {
        const status = getCourseCreatorDocumentStatus(document);
        const education = document.education_uuid
          ? courseCreatorEducationMaps.get(owner.uuid)?.find(item => item.uuid === document.education_uuid)
          : undefined;
        const membership = (document as CourseCreatorDocumentDto & { membership_uuid?: string }).membership_uuid
          ? courseCreatorMembershipMaps.get(owner.uuid)?.find(
            item =>
              item.uuid ===
              (document as CourseCreatorDocumentDto & { membership_uuid?: string }).membership_uuid
          )
          : undefined;
        const experience = (document as CourseCreatorDocumentDto & { experience_uuid?: string }).experience_uuid
          ? courseCreatorExperienceMaps.get(owner.uuid)?.find(
            item =>
              item.uuid ===
              (document as CourseCreatorDocumentDto & { experience_uuid?: string }).experience_uuid
          )
          : undefined;
        const linkedRecord = education ?? membership ?? experience;
        const recordKind = education
          ? ('education' as const)
          : membership
            ? ('membership' as const)
            : experience
              ? ('experience' as const)
              : undefined;
        return {
          id: `course-creator-${document.uuid ?? `${owner.uuid}-${document.original_filename}`}`,
          role: 'course_creator' as const,
          roleLabel: 'Course creator',
          ownerUuid: owner.uuid,
          ownerName: getProfileName(owner),
          ownerMeta: getProfileMeta(owner),
          documentUuid: document.uuid,
          documentLabel:
            getDocumentTypeLabel(document.document_type_uuid, documentTypesMap) ||
            document.original_filename,
          documentTitle: document.original_filename,
          documentUrl: getDocumentUrl(document),
          statusLabel: status.label,
          statusTone: status.tone,
          recordKind,
          recordSummary: summarizeLinkedRecord(linkedRecord, recordKind),
          details: recordKind ? buildRecordDetails(linkedRecord as never, recordKind) : undefined,
          verifiedBy: document.verified_by,
          verifiedAt: document.verified_at ? formatDate(document.verified_at) : undefined,
          notes: document.verification_notes || undefined,
          fileSize: formatBytes(document.file_size_bytes),
          uploadedAt: formatDate(document.created_date),
          uploadedTimestamp: new Date(document.created_date || 0).getTime(),
          documentTypeLabel: getDocumentTypeLabel(document.document_type_uuid, documentTypesMap),
          documentTypeUuid: document.document_type_uuid,
          rawDocument: document,
        } satisfies ReviewItem;
      });
    });

    return [...instructorItems, ...courseCreatorItems].sort((left, right) => {
      const leftDate = left.uploadedTimestamp ?? 0;
      const rightDate = right.uploadedTimestamp ?? 0;
      return rightDate - leftDate;
    });
  }, [
    courseCreatorDocumentQueries,
    courseCreatorEducationMaps,
    courseCreatorExperienceMaps,
    courseCreatorMembershipMaps,
    courseCreatorsWithUuid,
    documentTypesMap,
    instructorEducationMaps,
    instructorExperienceMaps,
    instructorMembershipMaps,
    instructorDocumentQueries,
    instructorsWithUuid,
  ]);

  const filteredItems = useMemo(() => {
    const term = searchValue.trim().toLowerCase();

    return reviewItems.filter(item => {
      if (item.role !== activeTab) return false;
      if (statusFilter !== 'all') {
        const toneToStatus: Record<ReviewItem['statusTone'], ReviewStatusFilter> = {
          success: 'verified',
          warning: 'pending',
          destructive: 'rejected',
          outline: 'pending',
        };

        if (toneToStatus[item.statusTone] !== statusFilter) return false;
      }

      if (documentTypeFilter !== 'all' && item.documentTypeUuid !== documentTypeFilter) {
        return false;
      }

      if (!term) return true;

      return [item.ownerName, item.documentTitle, item.documentLabel, item.statusLabel].some(
        value => value.toLowerCase().includes(term)
      );
    });
  }, [activeTab, documentTypeFilter, reviewItems, searchValue, statusFilter]);

  const instructorsCount = useMemo(
    () => reviewItems.filter(item => item.role === 'instructor').length,
    [reviewItems]
  );
  const courseCreatorsCount = useMemo(
    () => reviewItems.filter(item => item.role === 'course_creator').length,
    [reviewItems]
  );
  const studentsCount = students.length;

  const instructorVerifyMutation = useMutation(verifyDocumentMutation());
  const courseCreatorVerifyMutation = useMutation(verifyCourseCreatorDocumentMutation());

  const invalidateDocumentQueries = async () => {
    await qc.invalidateQueries({
      predicate: query =>
        [
          'getInstructorDocuments',
          'getCourseCreatorDocuments',
          'getAllInstructors',
          'getAllCourseCreators',
        ].includes(String(query.queryKey[0])),
    });
  };

  const applyVerifiedDocumentToCache = async (item: ReviewItem, notes?: string) => {
    const verifiedAt = new Date();

    if (item.role === 'instructor' && item.ownerUuid && item.documentUuid) {
      qc.setQueryData(
        getInstructorDocumentsQueryKey({ path: { instructorUuid: item.ownerUuid } }),
        (current?: { data?: InstructorDocument[] }) => {
          const data = (current?.data ?? []).map(document => {
            if (document.uuid !== item.documentUuid) return document;
            return {
              ...document,
              is_verified: true,
              verification_status: 'VERIFIED',
              verified_by: verifierIdentity,
              verified_at: verifiedAt,
              verification_notes: notes?.trim() || document.verification_notes,
            };
          });

          return current ? { ...current, data } : current;
        }
      );
      return;
    }

    if (item.role === 'course_creator' && item.ownerUuid && item.documentUuid) {
      qc.setQueryData(
        getCourseCreatorDocumentsQueryKey({ path: { courseCreatorUuid: item.ownerUuid } }),
        (current?: { data?: CourseCreatorDocumentDto[] }) => {
          const data = (current?.data ?? []).map(document => {
            if (document.uuid !== item.documentUuid) return document;
            return {
              ...document,
              is_verified: true,
              verified_by: verifierIdentity,
              verified_at: verifiedAt,
              verification_notes: notes?.trim() || document.verification_notes,
            };
          });

          return current ? { ...current, data } : current;
        }
      );
    }
  };

  return (
    <main className='bg-background px-3 py-4 sm:px-5 lg:px-7'>
      <div className='mx-auto flex w-full max-w-[1520px] flex-col gap-4'>
        <header className='rounded-[20px] border bg-card px-5 py-5 shadow-sm sm:px-6 lg:px-7'>
          <div className='flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between'>
            <div className='space-y-1.5'>
              <h1 className='text-foreground text-3xl font-semibold tracking-tight'>
                Document verification
              </h1>
              <p className='text-muted-foreground max-w-2xl text-sm'>
                Review uploaded documents from instructors, course creators, and students across
                the platform.
              </p>
            </div>
          </div>
        </header>

        <Tabs
          value={activeTab}
          onValueChange={value => setActiveTab(value as ReviewRole)}
          className="gap-4"
        >
          <CredentialsTabs
            tabs={[
              {
                id: 'instructor',
                label: 'Instructors',
                countLabel: `${instructorsCount}`,
                icon: GraduationCap,
              },
              {
                id: 'course_creator',
                label: 'Course creators',
                countLabel: `${courseCreatorsCount}`,
                icon: BriefcaseBusiness,
              },
              {
                id: 'student',
                label: 'Students',
                countLabel: `${studentsCount}`,
                icon: Users,
              },
            ]}
            rightSlot={
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                {/* Search — grows to fill available space */}
                <div className="relative min-w-0 flex-1">
                  <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2" />
                  <Input
                    aria-label="Search documents"
                    placeholder="Search documents or owners"
                    value={searchValue}
                    onChange={event => setSearchValue(event.target.value)}
                    className="h-11 w-full rounded-xl border-border/70 bg-background pl-11 pr-4 shadow-sm"
                  />
                </div>

                {/* Filters — fixed width, sit beside search on sm+ */}
                <div className="flex shrink-0 gap-3">
                  <Select
                    value={statusFilter}
                    onValueChange={value => setStatusFilter(value as ReviewStatusFilter)}
                  >
                    <SelectTrigger className="h-11 w-full min-w-[148px] rounded-xl border-border/70 bg-background px-3 shadow-sm sm:w-auto">
                      <Filter className="text-muted-foreground size-4" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={documentTypeFilter}
                    onValueChange={setDocumentTypeFilter}
                  >
                    <SelectTrigger className="h-11 w-full min-w-[176px] rounded-xl border-border/70 bg-background px-3 shadow-sm sm:w-auto">
                      <SelectValue placeholder="Document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All document types</SelectItem>
                      {documentTypes
                        .filter(item => !!item.uuid)
                        .map(item => (
                          <SelectItem key={item.uuid} value={item.uuid as string}>
                            {item.name || item.description || 'Document type'}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            }
            className="gap-4"
            listClassName="bg-background"
            triggerClassName="data-[state=active]:bg-muted data-[state=active]:text-foreground"
          />

          <TabsContent value={activeTab} className="mt-0 space-y-4">
            {/* Sidebar + content: stacked on mobile, side-by-side from xl */}
            <section className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">

              {/* Sidebar info card */}
              <Card className="h-fit rounded-[18px] border-white/60 bg-card/95 p-5 shadow-sm">
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm uppercase tracking-wide">
                    Active workspace
                  </p>
                  <h2 className="text-foreground text-2xl font-semibold">
                    {activeTab === 'instructor'
                      ? 'Instructor documents'
                      : activeTab === 'course_creator'
                        ? 'Course creator documents'
                        : 'Student documents'}
                  </h2>
                  <p className="text-muted-foreground text-sm leading-6">
                    {activeTab === 'student'
                      ? 'Student documents are not wired to a verification API yet, so this tab currently shows profiles only.'
                      : 'Open a document to inspect the preview and verify it from the side sheet.'}
                  </p>
                </div>

                <Separator className="my-4" />

                {/* Detail rows: 3 cols on sm–xl, 1 col otherwise */}
                <div className="grid gap-3 text-sm sm:grid-cols-3 xl:grid-cols-1">
                  <DetailRow
                    label="Documents visible"
                    value={`${filteredItems.length} matching record${filteredItems.length === 1 ? '' : 's'}`}
                  />
                  <DetailRow
                    label="Search term"
                    value={searchValue.trim() || 'None'}
                  />
                  <DetailRow
                    label="Profiles loaded"
                    value={
                      activeTab === 'instructor'
                        ? `${instructors.length}`
                        : activeTab === 'course_creator'
                          ? `${courseCreators.length}`
                          : `${studentsCount}`
                    }
                  />
                </div>
              </Card>

              {/* Document cards grid */}
              <div className="min-w-0">
                {filteredItems.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
                    {filteredItems.map(item => (
                      <ReviewCard
                        key={item.id}
                        item={item}
                        onOpenReview={selected =>
                          setSheetState({ open: true, item: selected })
                        }
                        onOpenViewer={setViewerItem}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="flex min-h-[360px] items-center justify-center rounded-[18px] border border-dashed border-border/60 bg-card/90 px-6 py-10 text-center shadow-sm">
                    <div className="max-w-md space-y-2">
                      <h3 className="text-foreground text-xl font-semibold">
                        {activeTab === 'student'
                          ? 'Student review queue coming soon'
                          : 'No documents found'}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-6">
                        {activeTab === 'student'
                          ? 'Student profile records are loaded, but the client does not yet have a student document verification endpoint.'
                          : 'Try adjusting the search term or wait for more documents to be uploaded.'}
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </div>

      <PdfViewerModal
        item={viewerItem}
        open={!!viewerItem}
        onOpenChange={(open) => {
          if (!open) setViewerItem(null);
        }}
      />

      <ReviewSheet
        state={sheetState}
        verifierName={profileName}
        onOpenChange={open =>
          setSheetState(prev => ({
            open,
            item: open ? prev.item : null,
          }))
        }
        onVerify={async notes => {
          if (!sheetState.item) {
            throw new Error('No document selected.');
          }

          const trimmedNotes = notes.trim() || undefined;
          const item = sheetState.item;

          if (item.role === 'instructor') {
            if (!item.ownerUuid || !item.documentUuid) {
              throw new Error('Missing instructor document identifiers.');
            }

            await instructorVerifyMutation.mutateAsync({
              path: {
                instructorUuid: item.ownerUuid,
                documentUuid: item.documentUuid,
              },
              query: {
                verifiedBy: verifierIdentity,
                verificationNotes: trimmedNotes,
              },
            });
          } else {
            if (!item.ownerUuid || !item.documentUuid) {
              throw new Error('Missing course creator document identifiers.');
            }

            await courseCreatorVerifyMutation.mutateAsync({
              path: {
                courseCreatorUuid: item.ownerUuid,
                documentUuid: item.documentUuid,
              },
              query: {
                verifiedBy: verifierIdentity,
                verificationNotes: trimmedNotes,
              },
            });
          }

          await applyVerifiedDocumentToCache(item, notes);
          toast.success('Document verified successfully.');
          setSheetState({ open: false, item: null });
          await invalidateDocumentQueries();
        }}
        isVerifying={instructorVerifyMutation.isPending || courseCreatorVerifyMutation.isPending}
      />
    </main>
  );
}
