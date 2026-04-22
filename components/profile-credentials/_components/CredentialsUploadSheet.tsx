'use client';

import { useMutation } from '@tanstack/react-query';
import {
  AlertCircle,
  BadgeCheck,
  BriefcaseBusiness,
  FileUp,
  GraduationCap,
  UploadCloud,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  addCourseCreatorEducationMutation,
  addCourseCreatorExperienceMutation,
  addCourseCreatorMembershipMutation,
  addInstructorEducationMutation,
  addInstructorExperienceMutation,
  addInstructorMembershipMutation,
  uploadCourseCreatorDocumentMutation,
  uploadInstructorDocumentMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { DocumentTypeOption } from '@/services/client/types.gen';
import type { CredentialsRole } from '../data';

type CredentialsUploadSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: CredentialsRole;
  profileUuid?: string;
  documentTypes: DocumentTypeOption[];
  onSaved: () => void | Promise<void>;
};

type ActiveTab = 'education' | 'membership' | 'experience';

type DraftState = {
  education: {
    qualification: string;
    schoolName: string;
    fieldOfStudy: string;
    yearCompleted: string;
    certificateNumber: string;
  };
  membership: {
    organizationName: string;
    membershipNumber: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
  };
  experience: {
    position: string;
    organizationName: string;
    responsibilities: string;
    yearsOfExperience: string;
    startDate: string;
    endDate: string;
    isCurrentPosition: boolean;
  };
  documentTypeUuid: string;
  title: string;
  description: string;
};

const initialDraft = (): DraftState => ({
  education: {
    qualification: '',
    schoolName: '',
    fieldOfStudy: '',
    yearCompleted: '',
    certificateNumber: '',
  },
  membership: {
    organizationName: '',
    membershipNumber: '',
    startDate: '',
    endDate: '',
    isActive: false,
  },
  experience: {
    position: '',
    organizationName: '',
    responsibilities: '',
    yearsOfExperience: '',
    startDate: '',
    endDate: '',
    isCurrentPosition: false,
  },
  documentTypeUuid: '',
  title: '',
  description: '',
});

function formatBytes(size?: number) {
  if (!size) return 'Unknown size';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function isPdfFile(candidate: File) {
  return candidate.type === 'application/pdf' || candidate.name.toLowerCase().endsWith('.pdf');
}

function getRoleLabel(role: CredentialsRole) {
  return role === 'instructor' ? 'Instructor' : 'Course creator';
}

export function CredentialsUploadSheet({
  open,
  onOpenChange,
  role,
  profileUuid,
  documentTypes,
  onSaved,
}: CredentialsUploadSheetProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('education');
  const [draft, setDraft] = useState<DraftState>(() => initialDraft());
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addInstructorEducation = useMutation(addInstructorEducationMutation());
  const addInstructorMembership = useMutation(addInstructorMembershipMutation());
  const addInstructorExperience = useMutation(addInstructorExperienceMutation());
  const uploadInstructorDocument = useMutation(uploadInstructorDocumentMutation());

  const addCourseCreatorEducation = useMutation(addCourseCreatorEducationMutation());
  const addCourseCreatorMembership = useMutation(addCourseCreatorMembershipMutation());
  const addCourseCreatorExperience = useMutation(addCourseCreatorExperienceMutation());
  const uploadCourseCreatorDocument = useMutation(uploadCourseCreatorDocumentMutation());

  const roleMutations = role === 'instructor'
    ? {
        education: addInstructorEducation,
        membership: addInstructorMembership,
        experience: addInstructorExperience,
        upload: uploadInstructorDocument,
      }
    : {
        education: addCourseCreatorEducation,
        membership: addCourseCreatorMembership,
        experience: addCourseCreatorExperience,
        upload: uploadCourseCreatorDocument,
      };

  const selectedDocumentType = useMemo(
    () => documentTypes.find(item => item.uuid === draft.documentTypeUuid),
    [documentTypes, draft.documentTypeUuid]
  );

  const resetDraft = () => {
    setActiveTab('education');
    setDraft(initialDraft());
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (!open) {
      resetDraft();
    }
  }, [open]);

  const setEducationDraft = (patch: Partial<DraftState['education']>) => {
    setDraft(current => ({ ...current, education: { ...current.education, ...patch } }));
  };

  const setMembershipDraft = (patch: Partial<DraftState['membership']>) => {
    setDraft(current => ({ ...current, membership: { ...current.membership, ...patch } }));
  };

  const setExperienceDraft = (patch: Partial<DraftState['experience']>) => {
    setDraft(current => ({ ...current, experience: { ...current.experience, ...patch } }));
  };

  const selectedTabLabel = activeTab === 'education' ? 'Education' : activeTab === 'membership' ? 'Membership' : 'Experience';

  const sectionIsComplete =
    activeTab === 'education'
      ? draft.education.qualification.trim().length > 0 && draft.education.schoolName.trim().length > 0
      : activeTab === 'membership'
        ? draft.membership.organizationName.trim().length > 0
        : draft.experience.position.trim().length > 0 &&
          draft.experience.organizationName.trim().length > 0;

  const hasUploadDetails =
    draft.documentTypeUuid.trim().length > 0 &&
    draft.title.trim().length > 0 &&
    draft.description.trim().length > 0;

  const canSubmit =
    role !== 'student' &&
    !!profileUuid &&
    !!file &&
    sectionIsComplete &&
    hasUploadDetails &&
    !roleMutations.education.isPending &&
    !roleMutations.membership.isPending &&
    !roleMutations.experience.isPending &&
    !roleMutations.upload.isPending;

  const isSubmitting =
    roleMutations.education.isPending ||
    roleMutations.membership.isPending ||
    roleMutations.experience.isPending ||
    roleMutations.upload.isPending;

  const closeSheet = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  const buildUploadQuery = (referenceKey: 'education_uuid' | 'membership_uuid' | 'experience_uuid', referenceValue: string) =>
    ({
      document_type_uuid: draft.documentTypeUuid,
      title: draft.title.trim(),
      description: draft.description.trim(),
      [referenceKey]: referenceValue,
    }) as Record<string, string>;

  const toDateValue = (value: string) => new Date(`${value}T00:00:00`);

  const submitRecord = async () => {
    if (role === 'student') {
      toast.info('Students do not upload supporting documents from this sheet.');
      return;
    }

    if (!profileUuid) {
      toast.error('Profile data is still loading.');
      return;
    }

    if (!file) {
      toast.error('Please attach a supporting PDF.');
      return;
    }

    if (!draft.documentTypeUuid.trim()) {
      toast.error('Please select a document type.');
      return;
    }

    if (!draft.title.trim() || !draft.description.trim()) {
      toast.error('Please provide a title and description for the document.');
      return;
    }

    try {
      let createdUuid = '';

      if (activeTab === 'education') {
        const body =
          role === 'instructor'
            ? {
                instructor_uuid: profileUuid,
                qualification: draft.education.qualification.trim(),
                school_name: draft.education.schoolName.trim(),
                field_of_study: draft.education.fieldOfStudy.trim() || undefined,
                year_completed: draft.education.yearCompleted
                  ? Number(draft.education.yearCompleted)
                  : undefined,
                certificate_number: draft.education.certificateNumber.trim() || undefined,
              }
            : {
                course_creator_uuid: profileUuid,
                qualification: draft.education.qualification.trim(),
                school_name: draft.education.schoolName.trim(),
                field_of_study: draft.education.fieldOfStudy.trim() || undefined,
                year_completed: draft.education.yearCompleted
                  ? Number(draft.education.yearCompleted)
                  : undefined,
                certificate_number: draft.education.certificateNumber.trim() || undefined,
              };

        const response = await roleMutations.education.mutateAsync({
          path:
            role === 'instructor'
              ? { instructorUuid: profileUuid }
              : { courseCreatorUuid: profileUuid },
          body,
        });
        createdUuid = response.data?.uuid ?? '';
      }

      if (activeTab === 'membership') {
        const body =
          role === 'instructor'
            ? {
                instructor_uuid: profileUuid,
                organisation_name: draft.membership.organizationName.trim(),
                membership_number: draft.membership.membershipNumber.trim() || undefined,
                start_date: draft.membership.startDate ? toDateValue(draft.membership.startDate) : undefined,
                end_date: draft.membership.isActive || !draft.membership.endDate
                  ? undefined
                  : toDateValue(draft.membership.endDate),
                is_active: draft.membership.isActive,
              }
            : {
                course_creator_uuid: profileUuid,
                organization_name: draft.membership.organizationName.trim(),
                membership_number: draft.membership.membershipNumber.trim() || undefined,
                start_date: draft.membership.startDate ? toDateValue(draft.membership.startDate) : undefined,
                end_date: draft.membership.isActive || !draft.membership.endDate
                  ? undefined
                  : toDateValue(draft.membership.endDate),
                is_active: draft.membership.isActive,
              };

        const response = await roleMutations.membership.mutateAsync({
          path:
            role === 'instructor'
              ? { instructorUuid: profileUuid }
              : { courseCreatorUuid: profileUuid },
          body,
        });
        createdUuid = response.data?.uuid ?? '';
      }

      if (activeTab === 'experience') {
        const body =
          role === 'instructor'
            ? {
                instructor_uuid: profileUuid,
                position: draft.experience.position.trim(),
                organisation_name: draft.experience.organizationName.trim(),
                responsibilities: draft.experience.responsibilities.trim() || undefined,
                years_of_experience: draft.experience.yearsOfExperience
                  ? Number(draft.experience.yearsOfExperience)
                  : undefined,
                start_date: draft.experience.startDate ? toDateValue(draft.experience.startDate) : undefined,
                end_date: draft.experience.isCurrentPosition || !draft.experience.endDate
                  ? undefined
                  : toDateValue(draft.experience.endDate),
                is_current_position: draft.experience.isCurrentPosition,
              }
            : {
                course_creator_uuid: profileUuid,
                position: draft.experience.position.trim(),
                organisation_name: draft.experience.organizationName.trim(),
                responsibilities: draft.experience.responsibilities.trim() || undefined,
                years_of_experience: draft.experience.yearsOfExperience
                  ? Number(draft.experience.yearsOfExperience)
                  : undefined,
                start_date: draft.experience.startDate ? toDateValue(draft.experience.startDate) : undefined,
                end_date: draft.experience.isCurrentPosition || !draft.experience.endDate
                  ? undefined
                  : toDateValue(draft.experience.endDate),
                is_current_position: draft.experience.isCurrentPosition,
              };

        const response = await roleMutations.experience.mutateAsync({
          path:
            role === 'instructor'
              ? { instructorUuid: profileUuid }
              : { courseCreatorUuid: profileUuid },
          body,
        });
        createdUuid = response.data?.uuid ?? '';
      }

      if (!createdUuid) {
        throw new Error('The created record did not return an identifier.');
      }

      const uploadQuery = buildUploadQuery(
        activeTab === 'education'
          ? 'education_uuid'
          : activeTab === 'membership'
            ? 'membership_uuid'
            : 'experience_uuid',
        createdUuid
      );

      await roleMutations.upload.mutateAsync({
        body: { file },
        path:
          role === 'instructor'
            ? { instructorUuid: profileUuid }
            : { courseCreatorUuid: profileUuid },
        query: uploadQuery as never,
      });

      toast.success(`${selectedTabLabel} record and supporting document saved.`);
      resetDraft();
      await onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save the record.');
    }
  };

  if (role === 'student') {
    return (
      <Sheet open={open} onOpenChange={openState => !isSubmitting && onOpenChange(openState)}>
        <SheetContent side='right' className='flex w-full flex-col overflow-y-auto p-0 sm:max-w-[640px]'>
          <SheetHeader className='border-border/70 border-b px-6 py-5 text-left'>
            <div className='flex items-center gap-3'>
              <span className='bg-primary/10 text-primary grid size-10 place-items-center rounded-xl'>
                <FileUp className='size-5' />
              </span>
              <div>
                <SheetTitle className='text-2xl'>Student credentials</SheetTitle>
                <SheetDescription>
                  Students use certificates directly, so this sheet stays read-only for them.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className='space-y-5 px-6 py-5'>
            <div className='rounded-2xl border bg-card px-4 py-4'>
              <div className='flex items-start gap-3'>
                <AlertCircle className='text-muted-foreground mt-0.5 size-4 shrink-0' />
                <div className='space-y-1'>
                  <p className='text-sm font-medium'>No manual upload needed</p>
                  <p className='text-muted-foreground text-sm'>
                    Student credentials are sourced from the certificates endpoint and do not use this upload flow.
                  </p>
                </div>
              </div>
            </div>

            <div className='flex items-center justify-end gap-3'>
              <Button type='button' variant='outline' onClick={closeSheet}>
                Close
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={openState => !isSubmitting && onOpenChange(openState)}>
      <SheetContent side='right' className='flex w-full flex-col overflow-y-auto p-0 sm:max-w-[760px]'>
        <SheetHeader className='border-border/70 border-b px-6 py-5 text-left'>
          <div className='flex items-center gap-3'>
            <span className='bg-primary/10 text-primary grid size-10 place-items-center rounded-xl'>
              <FileUp className='size-5' />
            </span>
            <div>
              <SheetTitle className='text-2xl'>
                Add {getRoleLabel(role)} credential
              </SheetTitle>
              <SheetDescription>
                Create an education, membership, or experience record, then attach a supporting PDF to it.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className='space-y-5 px-6 py-5'>
          <Tabs value={activeTab} onValueChange={value => setActiveTab(value as ActiveTab)}>
            <TabsList className='grid h-auto w-full grid-cols-3 gap-2 rounded-2xl border bg-card/95 p-2 shadow-sm'>
              <TabsTrigger value='education' className='rounded-xl px-4 py-2'>
                <GraduationCap className='size-4' />
                Education
              </TabsTrigger>
              <TabsTrigger value='membership' className='rounded-xl px-4 py-2'>
                <BadgeCheck className='size-4' />
                Membership
              </TabsTrigger>
              <TabsTrigger value='experience' className='rounded-xl px-4 py-2'>
                <BriefcaseBusiness className='size-4' />
                Experience
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className='mt-5 space-y-5'>
              <div className='rounded-2xl border bg-card px-4 py-4'>
                <div className='flex items-start gap-3'>
                  <AlertCircle className='text-muted-foreground mt-0.5 size-4 shrink-0' />
                  <div className='space-y-1'>
                    <p className='text-sm font-medium'>
                      {selectedTabLabel} record
                    </p>
                    <p className='text-muted-foreground text-sm'>
                      Fill in the fields below. We will save the record first, then upload the PDF against the returned UUID.
                    </p>
                  </div>
                </div>
              </div>

              {activeTab === 'education' ? (
                <div className='space-y-4'>
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <div className='space-y-2'>
                      <Label htmlFor='education-qualification'>Qualification</Label>
                      <Input
                        id='education-qualification'
                        value={draft.education.qualification}
                        onChange={event =>
                          setEducationDraft({ qualification: event.target.value })
                        }
                        placeholder='e.g. Bachelor of Science'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='education-school'>School name</Label>
                      <Input
                        id='education-school'
                        value={draft.education.schoolName}
                        onChange={event => setEducationDraft({ schoolName: event.target.value })}
                        placeholder='e.g. University of Lagos'
                      />
                    </div>
                  </div>

                  <div className='grid gap-4 sm:grid-cols-3'>
                    <div className='space-y-2 sm:col-span-2'>
                      <Label htmlFor='education-field'>Field of study</Label>
                      <Input
                        id='education-field'
                        value={draft.education.fieldOfStudy}
                        onChange={event =>
                          setEducationDraft({ fieldOfStudy: event.target.value })
                        }
                        placeholder='e.g. Computer Science'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='education-year'>Year completed</Label>
                      <Input
                        id='education-year'
                        type='number'
                        min='1950'
                        max='2100'
                        value={draft.education.yearCompleted}
                        onChange={event =>
                          setEducationDraft({ yearCompleted: event.target.value })
                        }
                        placeholder='2024'
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='education-certificate'>Certificate number</Label>
                    <Input
                      id='education-certificate'
                      value={draft.education.certificateNumber}
                      onChange={event =>
                        setEducationDraft({ certificateNumber: event.target.value })
                      }
                      placeholder='Optional certificate number'
                    />
                  </div>
                </div>
              ) : null}

              {activeTab === 'membership' ? (
                <div className='space-y-4'>
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <div className='space-y-2'>
                      <Label htmlFor='membership-organisation'>Organisation name</Label>
                      <Input
                        id='membership-organisation'
                        value={draft.membership.organizationName}
                        onChange={event =>
                          setMembershipDraft({ organizationName: event.target.value })
                        }
                        placeholder='e.g. British Council'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='membership-number'>Membership number</Label>
                      <Input
                        id='membership-number'
                        value={draft.membership.membershipNumber}
                        onChange={event =>
                          setMembershipDraft({ membershipNumber: event.target.value })
                        }
                        placeholder='Optional membership number'
                      />
                    </div>
                  </div>

                  <div className='grid gap-4 sm:grid-cols-2'>
                    <div className='space-y-2'>
                      <Label htmlFor='membership-start'>Start date</Label>
                      <Input
                        id='membership-start'
                        type='date'
                        value={draft.membership.startDate}
                        onChange={event =>
                          setMembershipDraft({ startDate: event.target.value })
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='membership-end'>End date</Label>
                      <Input
                        id='membership-end'
                        type='date'
                        value={draft.membership.endDate}
                        onChange={event => setMembershipDraft({ endDate: event.target.value })}
                      />
                    </div>
                  </div>

                  <div className='flex items-center gap-3 rounded-xl border px-4 py-3'>
                    <Checkbox
                      id='membership-active'
                      checked={draft.membership.isActive}
                      onCheckedChange={checked =>
                        setMembershipDraft({ isActive: checked === true })
                      }
                    />
                    <Label htmlFor='membership-active' className='cursor-pointer'>
                      This membership is currently active
                    </Label>
                  </div>
                </div>
              ) : null}

              {activeTab === 'experience' ? (
                <div className='space-y-4'>
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <div className='space-y-2'>
                      <Label htmlFor='experience-position'>Position</Label>
                      <Input
                        id='experience-position'
                        value={draft.experience.position}
                        onChange={event =>
                          setExperienceDraft({ position: event.target.value })
                        }
                        placeholder='e.g. Senior Trainer'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='experience-organisation'>Organisation name</Label>
                      <Input
                        id='experience-organisation'
                        value={draft.experience.organizationName}
                        onChange={event =>
                          setExperienceDraft({ organizationName: event.target.value })
                        }
                        placeholder='e.g. Elimika Academy'
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='experience-responsibilities'>Responsibilities</Label>
                    <Textarea
                      id='experience-responsibilities'
                      value={draft.experience.responsibilities}
                      onChange={event =>
                        setExperienceDraft({ responsibilities: event.target.value })
                      }
                      placeholder='Describe your core responsibilities and achievements'
                      className='min-h-28'
                    />
                  </div>

                  <div className='grid gap-4 sm:grid-cols-3'>
                    <div className='space-y-2'>
                      <Label htmlFor='experience-years'>Years of experience</Label>
                      <Input
                        id='experience-years'
                        type='number'
                        min='0'
                        max='60'
                        step='0.1'
                        value={draft.experience.yearsOfExperience}
                        onChange={event =>
                          setExperienceDraft({ yearsOfExperience: event.target.value })
                        }
                        placeholder='3.5'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='experience-start'>Start date</Label>
                      <Input
                        id='experience-start'
                        type='date'
                        value={draft.experience.startDate}
                        onChange={event =>
                          setExperienceDraft({ startDate: event.target.value })
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='experience-end'>End date</Label>
                      <Input
                        id='experience-end'
                        type='date'
                        value={draft.experience.endDate}
                        onChange={event => setExperienceDraft({ endDate: event.target.value })}
                      />
                    </div>
                  </div>

                  <div className='flex items-center gap-3 rounded-xl border px-4 py-3'>
                    <Checkbox
                      id='experience-current'
                      checked={draft.experience.isCurrentPosition}
                      onCheckedChange={checked =>
                        setExperienceDraft({ isCurrentPosition: checked === true })
                      }
                    />
                    <Label htmlFor='experience-current' className='cursor-pointer'>
                      This is my current position
                    </Label>
                  </div>
                </div>
              ) : null}
            </TabsContent>
          </Tabs>

          <div className='space-y-4 rounded-2xl border bg-card px-4 py-4'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label>Document type</Label>
                <Select
                  value={draft.documentTypeUuid}
                  onValueChange={value =>
                    setDraft(current => ({ ...current, documentTypeUuid: value }))
                  }
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select a document type' />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.length > 0 ? (
                      documentTypes
                        .filter(type => !!type.uuid)
                        .map(type => (
                          <SelectItem key={type.uuid} value={type.uuid as string}>
                            <span className='flex items-center gap-2'>
                              <span className='font-medium'>{type.name ?? 'Document type'}</span>
                              {type.is_required ? <Badge variant='secondary'>Required</Badge> : null}
                            </span>
                          </SelectItem>
                        ))
                    ) : (
                      <SelectItem value='document-types-loading' disabled>
                        Document types loading...
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {selectedDocumentType?.description ? (
                  <p className='text-muted-foreground text-xs'>{selectedDocumentType.description}</p>
                ) : null}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='document-title'>Document title</Label>
                <Input
                  id='document-title'
                  value={draft.title}
                  onChange={event => setDraft(current => ({ ...current, title: event.target.value }))}
                  placeholder='Enter a title for the uploaded document'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='document-description'>Document description</Label>
              <Textarea
                id='document-description'
                value={draft.description}
                onChange={event =>
                  setDraft(current => ({ ...current, description: event.target.value }))
                }
                placeholder='Describe what the document supports'
                className='min-h-24'
              />
            </div>

            <div
              className={cn(
                'flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-6 text-center transition-colors',
                isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'
              )}
              onDragOver={event => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={event => {
                event.preventDefault();
                setIsDragging(false);
                const droppedFile = event.dataTransfer.files?.[0];
                if (!droppedFile) return;
                if (!isPdfFile(droppedFile)) {
                  toast.error('Only PDF documents are supported.');
                  return;
                }
                setFile(droppedFile);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Input
                ref={fileInputRef}
                type='file'
                accept='application/pdf,.pdf'
                className='hidden'
                onChange={event => {
                  const selectedFile = event.target.files?.[0];
                  if (!selectedFile) return;
                  if (!isPdfFile(selectedFile)) {
                    toast.error('Only PDF documents are supported.');
                    event.target.value = '';
                    return;
                  }
                  setFile(selectedFile);
                }}
              />

              <UploadCloud className='text-primary mb-3 size-10' />
              <p className='text-foreground text-lg font-medium'>
                {file ? file.name : 'Drag and drop a PDF here'}
              </p>
              <p className='text-muted-foreground mt-1 text-sm'>
                {file ? formatBytes(file.size) : 'Click to browse or drop a supporting document'}
              </p>
              {file ? (
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='mt-4'
                  onClick={event => {
                    event.stopPropagation();
                    setFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  <X className='size-4' />
                  Remove file
                </Button>
              ) : null}
            </div>
          </div>

          <div className='rounded-2xl border bg-card px-4 py-4'>
            <div className='flex items-start gap-3'>
              <AlertCircle className='text-muted-foreground mt-0.5 size-4 shrink-0' />
              <div className='space-y-1'>
                <p className='text-sm font-medium'>Submission checks</p>
                <p className='text-muted-foreground text-sm'>
                  The button stays disabled until the selected {selectedTabLabel.toLowerCase()} fields, document type, title, description, and PDF file are all provided.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className='flex items-center justify-end gap-3'>
            <Button type='button' variant='outline' onClick={closeSheet}>
              Cancel
            </Button>
            <Button type='button' onClick={submitRecord} disabled={!canSubmit}>
              {isSubmitting ? 'Saving...' : `Save ${selectedTabLabel.toLowerCase()}`}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
