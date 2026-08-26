'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUserDomain } from '../../context/user-domain-context';
import { CourseTrainingRequirement } from '../../services/client';
import {
  getCourseTrainingRequirementsOptions,
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
  onSave: (data: {
    notes: string;
    private_online_hourly_rate: number;
    private_inperson_hourly_rate: number;
    group_online_hourly_rate: number;
    group_inperson_hourly_rate: number;
    rate_currency: string;
  }) => void;
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
  const [privateOnlineRate, setPrivateOnlineRate] = useState<number | ''>(0);
  const [privateInpersonRate, setPrivateInpersonRate] = useState<number | ''>(0);
  const [groupOnlineRate, setGroupOnlineRate] = useState<number | ''>(0);
  const [groupInpersonRate, setGroupInpersonRate] = useState<number | ''>(0);
  const [currency, setCurrency] = useState('KES');

  const { activeDomain } = useUserDomain();
  const [requirements, setRequirements] = useState<RequirementDisplayItem[]>([]);
  const selectedContentKind =
    contentKind ??
    (selectedApplicationCard as { contentKind?: 'course' | 'program' } | undefined)?.contentKind;
  const selectedContentId = contentId ?? selectedApplicationCard?.id ?? '';

  const applyExistingApplication = useCallback(() => {
    const rateCard = existingApplication?.rate_card;
    setNotes(existingApplication?.application_notes ?? '');
    setPrivateOnlineRate(rateCard?.private_online_hourly_rate ?? '');
    setPrivateInpersonRate(rateCard?.private_inperson_hourly_rate ?? '');
    setGroupOnlineRate(rateCard?.group_online_hourly_rate ?? '');
    setGroupInpersonRate(rateCard?.group_inperson_hourly_rate ?? '');
    setCurrency((rateCard?.currency ?? 'KES').toUpperCase());
  }, [existingApplication]);

  const resetForm = useCallback(() => {
    setNotes('');
    setPrivateOnlineRate(0);
    setPrivateInpersonRate(0);
    setGroupOnlineRate(0);
    setGroupInpersonRate(0);
    setCurrency('KES');
  }, []);

  const handleSave = () => {
    onSave({
      notes,
      private_online_hourly_rate: Number(privateOnlineRate),
      private_inperson_hourly_rate: Number(privateInpersonRate),
      group_online_hourly_rate: Number(groupOnlineRate),
      group_inperson_hourly_rate: Number(groupInpersonRate),
      rate_currency: currency,
    });
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
    ...getCourseTrainingRequirementsOptions({
      path: { courseUuid: selectedContentId },
      query: { pageable: {} },
    }),
    enabled: selectedContentKind === 'course' && Boolean(selectedContentId),
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
      <SheetContent className='flex w-full flex-col p-3 sm:max-w-[600px] sm:p-6'>
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
              {/* Currency */}
              <div className='space-y-1'>
                <label className='text-muted-foreground text-sm font-medium'>Currency</label>
                <Select value={currency} onValueChange={setCurrency} disabled={readOnly}>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select currency' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='KES'>KES</SelectItem>
                    {/* <SelectItem value='USD'>USD</SelectItem>
                    <SelectItem value='EUR'>EUR</SelectItem>
                    <SelectItem value='GBP'>GBP</SelectItem> */}
                  </SelectContent>
                </Select>
              </div>

              {/* Minimum rate note */}
              <p className='text-muted-foreground text-sm'>
                Set the amount you want to charge students per hour per head. The minimum amount you
                can charge has already been preset by the course creator:{' '}
                <span className='font-semibold'>
                  {minimum_rate} {currency}
                </span>{' '}
                per hour per head.
              </p>

              {/* Private Training Rates */}
              <div className='rounded-md border p-3'>
                <h3 className='mb-3 text-sm font-semibold'>Private Training Rates</h3>
                <p className='text-muted-foreground mb-3 text-xs'>
                  Enter the amount you will charge one student per hour per head for private
                  sessions.
                </p>
                <div className='flex gap-4'>
                  <div className='flex-1 space-y-1'>
                    <label className='text-muted-foreground text-sm font-medium'>Online</label>
                    <Input
                      type='number'
                      min={minimum_rate}
                      value={privateOnlineRate}
                      disabled={readOnly}
                      onChange={e =>
                        setPrivateOnlineRate(e.target.value ? Number(e.target.value) : '')
                      }
                    />
                  </div>
                  <div className='flex-1 space-y-1'>
                    <label className='text-muted-foreground text-sm font-medium'>In-Person</label>
                    <Input
                      type='number'
                      min={minimum_rate}
                      value={privateInpersonRate}
                      disabled={readOnly}
                      onChange={e =>
                        setPrivateInpersonRate(e.target.value ? Number(e.target.value) : '')
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Group Training Rates */}
              <div className='rounded-md border p-3'>
                <h3 className='mb-3 text-sm font-semibold'>Group Training Rates</h3>
                <p className='text-muted-foreground mb-3 text-xs'>
                  Enter the amount you will charge each student per hour per head for group
                  sessions.
                </p>
                <div className='flex gap-4'>
                  <div className='flex-1 space-y-1'>
                    <label className='text-muted-foreground text-sm font-medium'>Online</label>
                    <Input
                      type='number'
                      min={minimum_rate}
                      value={groupOnlineRate}
                      disabled={readOnly}
                      onChange={e =>
                        setGroupOnlineRate(e.target.value ? Number(e.target.value) : '')
                      }
                    />
                  </div>
                  <div className='flex-1 space-y-1'>
                    <label className='text-muted-foreground text-sm font-medium'>In-Person</label>
                    <Input
                      type='number'
                      min={minimum_rate}
                      value={groupInpersonRate}
                      disabled={readOnly}
                      onChange={e =>
                        setGroupInpersonRate(e.target.value ? Number(e.target.value) : '')
                      }
                    />
                  </div>
                </div>
              </div>
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
                disabled={isLoading || !notes.trim() || hasUncheckedMandatoryRequirements}
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
