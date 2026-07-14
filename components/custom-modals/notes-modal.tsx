'use client';

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
import { useEffect, useMemo, useState } from 'react';
import { CoursesCatalogCardData, CoursesRecommendationCardData } from '../../app/dashboard/workspace/[domain]/courses/_components/courses-data';
import { useUserDomain } from '../../context/user-domain-context';
import { getCourseTrainingRequirementsOptions, getProgramRequirementsOptions } from '../../services/client/@tanstack/react-query.gen';
import { Checkbox } from '../ui/checkbox';

interface NotesModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  placeholder?: string;
  onSave: (data: {
    notes: string;
    private_online_rate: number;
    private_inperson_rate: number;
    group_online_rate: number;
    group_inperson_rate: number;
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
  selectedApplicationCard: CoursesCatalogCardData | CoursesRecommendationCardData
}

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
  selectedApplicationCard
}: NotesModalProps) {
  const [notes, setNotes] = useState('');
  const [privateOnlineRate, setPrivateOnlineRate] = useState<number | ''>(0);
  const [privateInpersonRate, setPrivateInpersonRate] = useState<number | ''>(0);
  const [groupOnlineRate, setGroupOnlineRate] = useState<number | ''>(0);
  const [groupInpersonRate, setGroupInpersonRate] = useState<number | ''>(0);
  const [currency, setCurrency] = useState('KES');

  const { activeDomain } = useUserDomain()
  const [requirements, setRequirements] = useState<unknown[]>([]);

  const resetForm = () => {
    setNotes('');
    setPrivateOnlineRate(0);
    setPrivateInpersonRate(0);
    setGroupOnlineRate(0);
    setGroupInpersonRate(0);
    setCurrency('KES');
  };

  const handleSave = () => {
    onSave({
      notes,
      private_online_rate: Number(privateOnlineRate),
      private_inperson_rate: Number(privateInpersonRate),
      group_online_rate: Number(groupOnlineRate),
      group_inperson_rate: Number(groupInpersonRate),
      rate_currency: currency,
    });
    resetForm();
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };


  const { data: courseTrainingReqResp } = useQuery({
    ...getCourseTrainingRequirementsOptions({
      path: { courseUuid: selectedApplicationCard?.id }, query: { pageable: {} }
    }),
    enabled: selectedApplicationCard?.contentKind === "course"
  })
  // const { data: courseRequirementResp } = useQuery({
  //   ...getCourseRequirementsOptions({ path: { courseUuid: selectedApplicationCard?.id }, query: { pageable: {} } }),
  //   enabled: selectedApplicationCard?.contentKind === "course"
  // })
  const { data: programRequirementResp } = useQuery({
    ...getProgramRequirementsOptions({ path: { programUuid: selectedApplicationCard?.id }, query: { pageable: {} } }),
    enabled: selectedApplicationCard?.contentKind === "program"
  })



  const providerLabels = {
    student: "Student",
    instructor: "Instructor",
    organisation: "Organisation",
  };

  const checkableProviders = useMemo(() => {
    switch (activeDomain) {
      case "instructor":
        return ["organisation", "instructor"];

      case "organisation":
        return ["organisation", "instructor"];

      default:
        return [];
    }
  }, [activeDomain]);

  const groupedRequirements = useMemo(() => {
    return requirements.reduce((acc, req) => {
      if (!acc[req.provided_by]) {
        acc[req.provided_by] = [];
      }

      acc[req.provided_by].push(req);

      return acc;
    }, {} as Record<string, typeof requirements>);
  }, [requirements]);

  const hasUncheckedMandatoryRequirements = useMemo(() => {
    return requirements
      .filter(
        req =>
          req.is_mandatory &&
          checkableProviders.includes(req.provided_by)
      )
      .some(req => !req.checked);
  }, [requirements, checkableProviders]);


  useEffect(() => {
    const data =
      selectedApplicationCard?.contentKind === "course"
        ? courseTrainingReqResp?.data?.content
        : programRequirementResp?.data?.content;

    if (!data) return;

    setRequirements(
      data.map(req => ({
        ...req,
        checked: false,
      }))
    );
  }, [
    courseTrainingReqResp?.data?.content,
    programRequirementResp?.data?.content,
    selectedApplicationCard?.contentKind,
  ]);


  return (
    <Sheet
      open={open}
      onOpenChange={open => {
        setOpen(open);
        if (!open) resetForm();
      }}
    >
      <SheetContent className='flex w-full flex-col p-3 sm:max-w-[600px] sm:p-6'>
        <SheetHeader className='border-border border-b pb-4'>
          <SheetTitle>{title}</SheetTitle>
          {description && (
            <SheetDescription className='text-muted-foreground text-sm'>
              {description}
            </SheetDescription>
          )}
        </SheetHeader>

        {/* Scrollable body */}
        <div className='flex-1 space-y-4 overflow-y-auto py-4 pr-1'>
          {/* Notes */}
          <div className='space-y-1'>
            <label className='text-muted-foreground text-sm font-medium'>Notes</label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={placeholder}
              rows={6}
            />
          </div>

          {userType === 'instructor' && (
            <>
              {/* Currency */}
              <div className='space-y-1'>
                <label className='text-muted-foreground text-sm font-medium'>Currency</label>
                <Select value={currency} onValueChange={setCurrency}>
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
                Set the amount you want to charge students per hour per head. The minimum amount
                you can charge has already been preset by the course creator:{' '}
                <span className='font-semibold'>
                  {minimum_rate} {currency}
                </span>{' '}
                per hour per head.
              </p>

              {/* Private Training Rates */}
              <div className='rounded-md border p-3'>
                <h3 className='mb-3 text-sm font-semibold'>
                  Private Training Rates
                </h3>
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
                      onChange={e =>
                        setPrivateInpersonRate(e.target.value ? Number(e.target.value) : '')
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Group Training Rates */}
              <div className='rounded-md border p-3'>
                <h3 className='mb-3 text-sm font-semibold'>
                  Group Training Rates
                </h3>
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
                      onChange={e =>
                        setGroupInpersonRate(e.target.value ? Number(e.target.value) : '')
                      }
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">
                Course Training Requirements
              </h3>
              <p className="text-muted-foreground text-xs">
                Select the requirements that are currently available.
              </p>
            </div>

            {Object.entries(groupedRequirements).map(([provider, items]) => (
              <div
                key={provider}
                className="rounded-md border p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-semibold">
                    {providerLabels[provider as keyof typeof providerLabels]}
                  </h4>
                </div>

                <div className="space-y-2">
                  {items?.map(item => {
                    const canCheck = checkableProviders.includes(item.provided_by);

                    return (
                      <div
                        key={item.uuid}
                        className="flex items-start gap-3 rounded-md border p-2.5"
                      >
                        {canCheck ? (
                          <Checkbox
                            className="mt-0.5"
                            checked={item.checked}
                            onCheckedChange={(checked) => {
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
                          <div className="h-4 w-4 mt-0.5" />
                        )}

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">
                              {item.name}
                            </p>

                            {item.is_mandatory && (
                              <span className="text-destructive text-xs">
                                Required
                              </span>
                            )}

                            <p className="text-muted-foreground text-xs">
                              ({item.quantity} {item.unit})
                            </p>
                          </div>

                          {item.description && (
                            <p className="text-muted-foreground mt-1 text-xs">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {hasUncheckedMandatoryRequirements && (
                  <p className="text-destructive text-xs">
                    Please confirm all required training requirements before submitting.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sticky footer */}
        <div className='border-border flex justify-end gap-2 border-t pt-4'>
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
            className="min-w-[100px]"
            disabled={
              isLoading ||
              !notes.trim() ||
              hasUncheckedMandatoryRequirements
            }
            {...saveButtonProps}
          >
            {isLoading ? <Spinner /> : saveText}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
