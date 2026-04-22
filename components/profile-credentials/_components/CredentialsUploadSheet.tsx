'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  addCourseCreatorDocumentMutation,
  addInstructorDocumentMutation,
  uploadCourseCreatorDocumentMutation,
  uploadInstructorDocumentMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { DocumentTypeOption } from '@/services/client/types.gen';
import { useMutation } from '@tanstack/react-query';
import {
  AlertCircle,
  FileUp,
  UploadCloud,
  X,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { CredentialsRole } from '../data';

type CredentialsUploadSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: CredentialsRole;
  profileUuid?: string;
  documentTypes: DocumentTypeOption[];
  onSaved: () => void | Promise<void>;
};

type UploadDraft = {
  documentTypeUuid: string;
  title: string;
  description: string;
  expiryDate: string;
  educationUuid: string;
  experienceUuid: string;
  membershipUuid: string;
};

const initialDraft: UploadDraft = {
  documentTypeUuid: '',
  title: '',
  description: '',
  expiryDate: '',
  educationUuid: '',
  experienceUuid: '',
  membershipUuid: '',
};

function formatBytes(size?: number) {
  if (!size) return 'Unknown size';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function CredentialsUploadSheet({
  open,
  onOpenChange,
  role,
  profileUuid,
  documentTypes,
  onSaved,
}: CredentialsUploadSheetProps) {
  const [draft, setDraft] = useState<UploadDraft>(initialDraft);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addInstructorDocument = useMutation(addInstructorDocumentMutation());
  const uploadInstructorDocument = useMutation(uploadInstructorDocumentMutation());

  const addCourseCreatorDocument = useMutation(addCourseCreatorDocumentMutation());
  const uploadCourseCreatorDocument = useMutation(uploadCourseCreatorDocumentMutation());

  const selectedDocumentType = useMemo(
    () => documentTypes.find(item => item.uuid === draft.documentTypeUuid),
    [documentTypes, draft.documentTypeUuid]
  );

  const isPdfFile = (candidate: File) =>
    candidate.type === 'application/pdf' || candidate.name.toLowerCase().endsWith('.pdf');

  const resetDraft = () => {
    setDraft(initialDraft);
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSuccess = async () => {
    toast.success('Document saved successfully.');
    resetDraft();
    await onSaved();
    setTimeout(() => {
      onOpenChange(false);
    }, 0);
  };

  const submitDocument = async () => {
    if (role === 'student') {
      toast.info('Student document APIs are coming soon.');
      return;
    }

    if (!profileUuid) {
      toast.error('Profile data is still loading.');
      return;
    }

    if (!draft.documentTypeUuid) {
      toast.error('Please choose a document type.');
      return;
    }

    const title = draft.title.trim() || file?.name || selectedDocumentType?.name || 'Document';
    const originalFilename = file?.name || title;
    const description = draft.description.trim() || undefined;
    const expiryDate = draft.expiryDate ? new Date(`${draft.expiryDate}T00:00:00`) : undefined;

    try {
      if (file) {
        if (role === 'instructor') {
          await uploadInstructorDocument.mutateAsync({
            body: { file },
            path: { instructorUuid: profileUuid },
            query: {
              document_type_uuid: draft.documentTypeUuid,
              title,
              description,
              education_uuid: draft.educationUuid.trim() || undefined,
              experience_uuid: draft.experienceUuid.trim() || undefined,
              membership_uuid: draft.membershipUuid.trim() || undefined,
              expiry_date: expiryDate,
            },
          });
        } else {
          await uploadCourseCreatorDocument.mutateAsync({
            body: { file },
            path: { courseCreatorUuid: profileUuid },
            query: {
              document_type_uuid: draft.documentTypeUuid,
              education_uuid: draft.educationUuid.trim() || undefined,
            },
          });
        }
      } else if (role === 'instructor') {
        await addInstructorDocument.mutateAsync({
          body: {
            instructor_uuid: profileUuid,
            document_type_uuid: draft.documentTypeUuid,
            original_filename: originalFilename,
            title,
            description,
            expiry_date: expiryDate,
          },
          path: { instructorUuid: profileUuid },
        });
      } else {
        await addCourseCreatorDocument.mutateAsync({
          body: {
            course_creator_uuid: profileUuid,
            document_type_uuid: draft.documentTypeUuid,
            original_filename: originalFilename,
            education_uuid: draft.educationUuid.trim() || undefined,
          },
          path: { courseCreatorUuid: profileUuid },
        });
      }

      toast.success('Document saved successfully.');
      resetDraft();
      await onSaved();
      onOpenChange(false);

      await handleSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save document.');
    }
  };

  const isSubmitting =
    addInstructorDocument.isPending ||
    uploadInstructorDocument.isPending ||
    addCourseCreatorDocument.isPending ||
    uploadCourseCreatorDocument.isPending;

  return (
    <Sheet open={open} onOpenChange={openState => !isSubmitting && onOpenChange(openState)}>
      <SheetContent side='right' className='flex w-full flex-col overflow-y-auto p-0 sm:max-w-[640px]'>
        <SheetHeader className='border-border/70 border-b px-6 py-5 text-left'>
          <div className='flex items-center gap-3'>
            <span className='bg-primary/10 text-primary grid size-10 place-items-center rounded-xl'>
              <FileUp className='size-5' />
            </span>
            <div>
              <SheetTitle className='text-2xl'>Add document</SheetTitle>
              <SheetDescription>
                Drag and drop a PDF or enter the document details to create the record.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className='space-y-5 px-6 py-5'>
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
            <input
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
              {file ? formatBytes(file.size) : 'Click to browse or drop a document from your device'}
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

          <div className='space-y-2'>
            <Label>Document type</Label>
            <Select
              value={draft.documentTypeUuid}
              onValueChange={value => setDraft(current => ({ ...current, documentTypeUuid: value }))}
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
            <Label htmlFor='document-title'>Title</Label>
            <Input
              id='document-title'
              value={draft.title}
              onChange={event => setDraft(current => ({ ...current, title: event.target.value }))}
              placeholder='Enter a document title'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='document-description'>Description</Label>
            <Textarea
              id='document-description'
              value={draft.description}
              onChange={event => setDraft(current => ({ ...current, description: event.target.value }))}
              placeholder='Add any useful notes about the document'
              className='min-h-24'
            />
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='document-expiry'>Expiry date</Label>
              <Input
                id='document-expiry'
                type='date'
                value={draft.expiryDate}
                onChange={event =>
                  setDraft(current => ({ ...current, expiryDate: event.target.value }))
                }
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='document-reference'>Education reference</Label>
              <Input
                id='document-reference'
                value={draft.educationUuid}
                onChange={event =>
                  setDraft(current => ({ ...current, educationUuid: event.target.value }))
                }
                placeholder='Optional record UUID'
              />
            </div>
          </div>

          {role === 'instructor' ? (
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='experience-reference'>Experience reference</Label>
                <Input
                  id='experience-reference'
                  value={draft.experienceUuid}
                  onChange={event =>
                    setDraft(current => ({ ...current, experienceUuid: event.target.value }))
                  }
                  placeholder='Optional experience UUID'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='membership-reference'>Membership reference</Label>
                <Input
                  id='membership-reference'
                  value={draft.membershipUuid}
                  onChange={event =>
                    setDraft(current => ({ ...current, membershipUuid: event.target.value }))
                  }
                  placeholder='Optional membership UUID'
                />
              </div>
            </div>
          ) : null}

          <div className='rounded-2xl border bg-card px-4 py-4'>
            <div className='flex items-start gap-3'>
              <AlertCircle className='text-muted-foreground mt-0.5 size-4 shrink-0' />
              <div className='space-y-1'>
                <p className='text-sm font-medium'>Endpoint behavior</p>
                <p className='text-muted-foreground text-sm'>
                  {role === 'student'
                    ? 'Student document APIs are not wired yet, so this sheet will become active when the backend fields arrive.'
                    : file
                      ? 'A PDF upload will create the record and attach the file in one step.'
                      : 'If you skip the file, the form falls back to the add-document endpoint.'}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className='flex items-center justify-end gap-3'>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type='button'
              onClick={submitDocument}
              disabled={isSubmitting || role === 'student' || !draft.documentTypeUuid}
            >
              {isSubmitting ? 'Saving...' : 'Save document'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
