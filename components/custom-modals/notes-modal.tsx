'use client';

import { allCourseTrainingRequirementsOptions } from '@/services/course-training-requirements';
import { RateCardGrid } from '@/components/rate-card/rate-card-grid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { normaliseRateCard, type RateCard, validateRateCard } from '@/lib/rate-card';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUserDomain } from '../../context/user-domain-context';
import { CourseTrainingRequirement } from '../../services/client';
import {
  getProgramRequirementsOptions,
} from '../../services/client/@tanstack/react-query.gen';
import type { CatalogTrainingApplicationData } from '../../src/features/dashboard/courses/shared/_components/courses-data';
import {
  CoursesCatalogCardData,
  CoursesRecommendationCardData,
} from '../../src/features/dashboard/courses/shared/_components/courses-data';
import { Checkbox } from '../ui/checkbox';

interface NotesModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  placeholder?: string;
  /** The card is normalised: every cell present, methods not offered as null. */
  onSave: (data: { notes: string; rate_card: RateCard }) => void;
  isLoading?: boolean;
  saveText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'primary' | 'secondary';
  saveButtonProps?: React.ComponentProps<typeof Button>;
  cancelButtonProps?: React.ComponentProps<typeof Button>;
  userType?: 'course_creator' | 'instructor';
  minimum_rate: number | string;
  selectedApplicationCard?: CoursesCatalogCardData | CoursesRecommendationCardData;
  contentKind?: 'course' | 'program';
  contentId?: string;
  applicantRole?: 'course_creator' | 'instructor' | 'organisation' | 'organisation_user';
  existingApplication?: CatalogTrainingApplicationData | null;
  readOnly?: boolean;
  canReapply?: boolean;
  onReapply?: () => void;
  formRevision?: number;
}

type RequirementDisplayItem = Omit<Partial<CourseTrainingRequirement>, 'provided_by'> & {
  uuid?: string;
  name: string;
  provided_by?: string | null;
  checked?: boolean;
};

type ProgramRequirementLike = {
  uuid?: string;
  requirement_text?: string;
  requirement_type?: string;
  requirement_category?: string;
  is_mandatory?: boolean;
};

export default function NotesModal({
  open,
  setOpen,
  title = 'Add Training Details',
  description = 'Provide additional notes and specify the trainer rate details below:',
  placeholder = 'Type your notes here...',
  onSave,
  isLoading = false,
  saveText = 'Save',
  cancelText = 'Cancel',
  variant = 'default',
  saveButtonProps,
  cancelButtonProps,
  userType = 'instructor',
  minimum_rate,
  selectedApplicationCard,
  contentKind,
  contentId,
  applicantRole,
  existingApplication,
  readOnly = false,
  canReapply = false,
  onReapply,
  formRevision = 0,
}: NotesModalProps) {
  const [notes, setNotes] = useState('');
  const [card, setCard] = useState<RateCard>(() => normaliseRateCard(null));
  const minimumFee = Number(minimum_rate) || null;
  const rateValidation = useMemo(() => validateRateCard(card, minimumFee), [card, minimumFee]);

  const { activeDomain } = useUserDomain();
  const [requirements, setRequirements] = useState<RequirementDisplayItem[]>([]);
  const selectedContentKind =
    contentKind ??
    (selectedApplicationCard as { contentKind?: 'course' | 'program' } | undefined)?.contentKind;
  const selectedContentId = contentId ?? selectedApplicationCard?.id ?? '';

  const applyExistingApplication = useCallback(() => {
    setNotes(existingApplication?.application_notes ?? '');
    setCard(normaliseRateCard(existingApplication?.rate_card));
  }, [existingApplication]);

  const resetForm = useCallback(() => {
    setNotes('');
    setCard(normaliseRateCard(null));
  }, []);

  const handleSave = () => {
    onSave({ notes, rate_card: normaliseRateCard(card) });
    resetForm();
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  useEffect(() => {
    if (!open) return;

    if (readOnly && existingApplication) {
      applyExistingApplication();
      return;
    }

    resetForm();
  }, [applyExistingApplication, existingApplication, formRevision, open, readOnly, resetForm]);

  const { data: courseTrainingReqResp } = useQuery({
    ...allCourseTrainingRequirementsOptions(selectedContentId),
    enabled: open && selectedContentKind === 'course' && Boolean(selectedContentId),
  });
  // const { data: courseRequirementResp } = useQuery({
  //   ...getCourseRequirementsOptions({ path: { courseUuid: selectedApplicationCard?.id }, query: { pageable: {} } }),
  //   enabled: (selectedApplicationCard as { contentKind?: string } | undefined)?.contentKind === "course"
  // })
  const { data: programRequirementResp } = useQuery({
    ...getProgramRequirementsOptions({
      path: { programUuid: selectedContentId },
      query: { pageable: {} },
    }),
    enabled: selectedContentKind === 'program' && Boolean(selectedContentId),
  });

  const normalizeProvider = (provider?: string | undefined | null) => {
    switch (provider?.toLowerCase()) {
      case 'organisation':
      case 'organization':
      case 'organisation_user':
      case 'organization_user':
      case 'training_center':
        return 'organisation_user';
      default:
        return provider?.toLowerCase();
    }
  };

  const providerFromProgramRequirement = (requirementType?: string) => {
    switch (requirementType?.toUpperCase()) {
      case 'TRAINING_CENTER':
        return 'organisation_user';
      case 'INSTRUCTOR':
        return 'instructor';
      case 'STUDENT':
        return 'student';
      default:
        return null;
    }
  };

  const providerLabels = {
    student: 'Student',
    instructor: 'Instructor',
    organisation_user: 'Organisation',
    course_creator: 'Course creator',
    unassigned: 'Unassigned',
  } as const;

  const activeProvider = useMemo(
    () => normalizeProvider(applicantRole ?? activeDomain ?? userType),
    [activeDomain, applicantRole, userType]
  );

  const checkableProviders = useMemo(() => {
    switch (activeProvider) {
      case 'instructor':
        return ['instructor'];

      case 'organisation_user':
        return ['organisation_user'];

      default:
        return [];
    }
  }, [activeProvider]);

  const canCheckProvider = (provider?: string | null) =>
    checkableProviders.includes(normalizeProvider(provider) ?? '');

  const groupedRequirements = useMemo(() => {
    return requirements.reduce(
      (acc, req) => {
        const provider = normalizeProvider(req?.provided_by as string) ?? 'unassigned';

        if (!acc[provider]) {
          acc[provider] = [];
        }

        acc[provider].push(req);

        return acc;
      },
      {} as Record<string, typeof requirements>
    );
  }, [requirements]);

  const requirementGroups = useMemo(() => {
    return Object.entries(groupedRequirements).map(([provider, items]) => ({
      provider,
      label: providerLabels[normalizeProvider(provider) as keyof typeof providerLabels] ?? provider,
      items,
      hasUncheckedMandatoryRequirements: items.some(
        req =>
          req.is_mandatory &&
          canCheckProvider(req.provided_by) &&
          !(req as { checked?: boolean }).checked
      ),
    }));
  }, [groupedRequirements, checkableProviders]);

  const hasUncheckedMandatoryRequirements = useMemo(() => {
    return requirements
      .filter(req => req.is_mandatory && canCheckProvider(req.provided_by))
      .some(req => !(req as { checked?: boolean }).checked);
  }, [requirements, checkableProviders]);

  useEffect(() => {
    if (!open || !selectedContentKind) {
      setRequirements([]);
      return;
    }

    if (selectedContentKind === 'program') {
      const data = programRequirementResp?.data?.content as ProgramRequirementLike[] | undefined;
      setRequirements(
        (data ?? []).map((req, index) => ({
          uuid: req.uuid ?? `program-requirement-${index}`,
          name: req.requirement_text ?? req.requirement_category ?? 'Program requirement',
          description: req.requirement_category,
          provided_by: providerFromProgramRequirement(req.requirement_type),
          is_mandatory: req.is_mandatory,
          checked: false,
        }))
      );
      return;
    }

    setRequirements(
      (courseTrainingReqResp?.data?.content ?? []).map(req => ({
        ...req,
        checked: false,
      }))
    );
  }, [
    open,
    selectedContentKind,
    selectedContentId,
    courseTrainingReqResp?.data?.content,
    programRequirementResp?.data?.content,
  ]);

  const statusLabel = (existingApplication?.status ?? '').toLowerCase() || 'unknown';

  return (
    <Sheet
      open={open}
      onOpenChange={open => {
        setOpen(open);
        if (!open) resetForm();
      }}
    >
      <SheetContent className='flex w-full flex-col p-3 sm:max-w-[820px] sm:p-6'>
        <SheetHeader className='border-border border-b p-0 pb-4'>
          <SheetTitle>{title}</SheetTitle>
          {description && (
            <SheetDescription className='text-muted-foreground text-sm'>
              {description}
            </SheetDescription>
          )}
        </SheetHeader>

        {/* Scrollable body */}
        <div className='flex-1 space-y-4 overflow-y-auto py-4 pr-1'>
          {existingApplication ? (
            <div className='bg-muted/40 space-y-3 rounded-md border p-3'>
              <div className='flex items-center justify-between gap-2'>
                <div>
                  <p className='text-sm font-semibold'>Application summary</p>
                  <p className='text-muted-foreground text-xs capitalize'>Status: {statusLabel}</p>
                </div>
                <Badge
                  variant={
                    statusLabel === 'approved'
                      ? 'default'
                      : statusLabel === 'pending'
                        ? 'secondary'
                        : 'destructive'
                  }
                >
                  {statusLabel}
                </Badge>
              </div>

              <div className='grid gap-2 text-sm sm:grid-cols-2'>
                <div>
                  <p className='text-muted-foreground text-xs'>Submitted</p>
                  <p>
                    {existingApplication.created_date
                      ? new Date(existingApplication.created_date).toLocaleDateString()
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className='text-muted-foreground text-xs'>Reviewed</p>
                  <p>
                    {existingApplication.reviewed_at
                      ? new Date(existingApplication.reviewed_at).toLocaleDateString()
                      : '—'}
                  </p>
                </div>
                <div className='sm:col-span-2'>
                  <p className='text-muted-foreground text-xs'>Reviewer</p>
                  <p>{existingApplication.reviewed_by ?? '—'}</p>
                </div>
              </div>

              {existingApplication.review_notes ? (
                <div>
                  <p className='text-muted-foreground text-xs'>Reviewer notes</p>
                  <p className='text-sm'>{existingApplication.review_notes}</p>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Notes */}
          <div className='space-y-1'>
            <label className='text-muted-foreground text-sm font-medium'>Notes</label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={placeholder}
              rows={6}
              disabled={readOnly}
            />
          </div>

          {userType === 'instructor' && (
            <>
              <p className='text-muted-foreground text-sm'>
                {readOnly
                  ? 'The rates in this application, per learner.'
                  : 'Switch on each training method you offer and price it per hour, per session and per day.'}
              </p>
              <RateCardGrid
                mode={readOnly ? 'view' : 'edit'}
                value={card}
                onChange={setCard}
                errors={readOnly ? undefined : rateValidation.cells}
                minimum={minimumFee}
              />
              {!readOnly && rateValidation.card.length > 0 ? (
                <p className='text-destructive text-xs'>{rateValidation.card.join(' ')}</p>
              ) : null}
            </>
          )}
          <div className='space-y-4'>
            <div>
              <h3 className='text-sm font-medium'>Course Training Requirements</h3>
              <p className='text-muted-foreground text-xs'>
                Review the requirements below. Tick only the ones your role is responsible for.
              </p>
            </div>
            {requirementGroups.length === 0 ? (
              <div className='text-muted-foreground rounded-md border border-dashed p-6 text-center'>
                <p className='text-sm font-medium'>No training requirements have been set.</p>
                <p className='mt-1 text-xs'>
                  The course creator has not configured any training requirements for this course.
                </p>
              </div>
            ) : (
              requirementGroups.map(group => (
                <div key={group.provider} className='rounded-md border p-3'>
                  <div className='mb-2 flex items-center justify-between'>
                    <h4 className='text-sm font-semibold'>{group.label}</h4>
                  </div>

                  <div className='space-y-2'>
                    {group.items?.map(item => {
                      const canCheck = canCheckProvider(item.provided_by);

                      return (
                        <div
                          key={item.uuid ?? `${group.provider}-${item.name}`}
                          className='flex items-start gap-3 rounded-md border p-2.5'
                        >
                          {canCheck ? (
                            <Checkbox
                              className='border-foreground bg-background data-[state=checked]:bg-primary data-[state=checked]:border-primary mt-0.5 h-4 w-4 border-2 shadow-none'
                              checked={(item as { checked?: boolean }).checked}
                              disabled={readOnly}
                              onCheckedChange={checked => {
                                setRequirements(prev =>
                                  prev.map(req =>
                                    req.uuid === item.uuid
                                      ? { ...req, checked: checked === true }
                                      : req
                                  )
                                );
                              }}
                            />
                          ) : (
                            <div className='mt-0.5 h-4 w-4' />
                          )}

                          <div className='flex-1'>
                            <div className='flex items-center gap-2'>
                              <p className='text-sm font-medium'>{item.name}</p>

                              {item.is_mandatory && (
                                <span className='text-destructive text-xs'>Required</span>
                              )}

                              <p className='text-muted-foreground text-xs'>
                                ({item.quantity} {item.unit})
                              </p>
                            </div>

                            {item.description && (
                              <p className='text-muted-foreground mt-1 text-xs'>
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {!readOnly && group.hasUncheckedMandatoryRequirements && (
                    <p className='text-destructive text-xs'>
                      Please confirm all required training requirements before submitting.
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sticky footer */}
        <div className='border-border flex justify-end gap-2 border-t pt-4'>
          {readOnly ? (
            <>
              {canReapply && onReapply ? (
                <Button
                  variant='outline'
                  onClick={onReapply}
                  disabled={isLoading}
                  {...cancelButtonProps}
                >
                  Re-apply
                </Button>
              ) : null}
              <Button onClick={handleClose} disabled={isLoading}>
                Close
              </Button>
            </>
          ) : (
            <>
              <Button
                variant='outline'
                onClick={handleClose}
                disabled={isLoading}
                {...cancelButtonProps}
              >
                {cancelText}
              </Button>
              <Button
                onClick={handleSave}
                className='min-w-[100px]'
                disabled={
                  isLoading ||
                  !notes.trim() ||
                  hasUncheckedMandatoryRequirements ||
                  (userType === 'instructor' && !rateValidation.valid)
                }
                {...saveButtonProps}
              >
                {isLoading ? <Spinner /> : saveText}
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
