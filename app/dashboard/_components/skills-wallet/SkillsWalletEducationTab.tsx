'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GraduationCap, Pencil, Plus, Trash2 } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import { toast } from 'sonner';
import DeleteModal from '@/components/custom-modals/delete-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { getErrorMessage } from '@/lib/error-utils';
import { STALE_TIMES } from '@/lib/query-client';
import {
  addEducationMutation, deleteEducationMutation, listDocumentsOptions,
  getSummaryQueryKey,
  listDocumentsQueryKey, listDocumentTypesOptions, listEducationOptions,
  listEducationQueryKey, updateEducationMutation, uploadDocumentMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { UserDocument, UserEducation } from '@/services/client/types.gen';
import { requireApiData } from '@/src/features/onboarding/lib/user-onboarding';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';

function verificationStatus(documents: UserDocument[]) {
  if (documents.some(document => document.status === 'Rejected')) return 'Rejected';
  if (documents.some(document => document.status === 'Expired')) return 'Expired';
  if (documents.length && documents.every(document => document.is_verified || document.status === 'Approved'))
    return 'Verified';
  return 'Pending';
}

export function SkillsWalletEducationTab({ readOnly = false }: { readOnly?: boolean }) {
  const queryClient = useQueryClient();
  const educationQuery = useQuery({
    ...listEducationOptions(),
    select: requireApiData,
    staleTime: STALE_TIMES.entity,
  });
  const documentsQuery = useQuery({
    ...listDocumentsOptions(),
    select: requireApiData,
    staleTime: STALE_TIMES.entity,
  });
  const documentsByEducation = useMemo(() => {
    const grouped = new Map<string, UserDocument[]>();
    for (const document of documentsQuery.data ?? []) {
      if (!document.education_uuid) continue;
      const documents = grouped.get(document.education_uuid) ?? [];
      documents.push(document);
      grouped.set(document.education_uuid, documents);
    }
    return grouped;
  }, [documentsQuery.data]);
  const [editor, setEditor] = useState<{ education?: UserEducation } | null>(null);
  const [deleting, setDeleting] = useState<UserEducation | null>(null);
  const deletion = useMutation(deleteEducationMutation());
  const [deletingPending, setDeletingPending] = useState(false);

  const refresh = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: listEducationQueryKey() }),
    queryClient.invalidateQueries({ queryKey: listDocumentsQueryKey() }),
    queryClient.invalidateQueries({ queryKey: getSummaryQueryKey() }),
  ]);
  const remove = async () => {
    if (!deleting?.uuid || deletingPending) return;
    setDeletingPending(true);
    try {
      const response = await deletion.mutateAsync({ path: { itemUuid: deleting.uuid } });
      if (typeof response === 'object' && response !== null &&
        (('error' in response && response.error) || ('success' in response && response.success === false)))
        throw new Error(getErrorMessage(response, 'Unable to delete education.'));
      await refresh();
      setDeleting(null);
      toast.success('Education deleted.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to delete education. Please try again.'));
    } finally {
      setDeletingPending(false);
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex flex-col justify-between gap-3 sm:flex-row sm:items-center'>
        <div>
          <h2 className='text-xl font-semibold'>Education</h2>
          <p className='text-muted-foreground text-sm'>
            {readOnly ? 'Your saved qualifications and supporting evidence.' : 'Add your qualifications and upload supporting images or PDFs.'}
          </p>
        </div>
        {!readOnly && <Button type='button' onClick={() => setEditor({})}>
          <Plus className='size-4' />Add education
        </Button>}
      </div>
      {educationQuery.isLoading || documentsQuery.isLoading ? (
        <Skeleton className='h-40 w-full' />
      ) : educationQuery.isError || documentsQuery.isError ? (
        <EmptyState
          title='Unable to load education'
          description='Please try loading your education and evidence again.'
          action={<Button type='button' variant='outline' onClick={() => void refresh()}>Try again</Button>}
        />
      ) : !educationQuery.data?.length ? (
        <EmptyState icon={GraduationCap} title='No education added yet' description='Add a qualification with evidence to start your education record.' />
      ) : (
        <div className='space-y-3'>
          {educationQuery.data.map(education => {
            const documents = education.uuid ? documentsByEducation.get(education.uuid) ?? [] : [];
            return (
              <Card key={education.uuid}>
                <CardContent className='space-y-3 p-5'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0 space-y-1'>
                      <h3 className='font-semibold break-words'>{education.qualification}</h3>
                      <p className='text-muted-foreground text-sm break-words'>{education.school_name}</p>
                      <p className='text-muted-foreground text-sm'>
                        {education.field_of_study || 'Field of study not specified'}
                        {education.year_completed ? ` · ${education.year_completed}` : ''}
                      </p>
                    </div>
                    {!readOnly && <div className='flex shrink-0 gap-1'>
                      <Button type='button' variant='ghost' size='icon' aria-label={`Edit ${education.qualification}`} disabled={!education.uuid} onClick={() => setEditor({ education })}>
                        <Pencil className='size-4' />
                      </Button>
                      <Button type='button' variant='ghost' size='icon' aria-label={`Delete ${education.qualification}`} disabled={!education.uuid} onClick={() => setDeleting(education)}>
                        <Trash2 className='text-destructive size-4' />
                      </Button>
                    </div>}
                  </div>
                  <Badge variant='outline'>{verificationStatus(documents)}</Badge>
                  {documents.length ? (
                    <ul className='space-y-1 text-sm'>
                      {documents.map(document => {
                        const url = toAuthenticatedMediaUrl(document.file_url);
                        const label = document.original_filename || document.title || 'Education evidence';
                        return <li key={document.uuid}>{url ? (
                          <a className='text-primary break-words underline' href={url} target='_blank' rel='noopener noreferrer'>{label}</a>
                        ) : <span>{label}</span>}</li>;
                      })}
                    </ul>
                  ) : <p className='text-muted-foreground text-sm'>No evidence uploaded.{!readOnly && ' Edit this qualification to attach evidence.'}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      {editor && (
        <EducationDialog
          education={editor.education}
          documents={editor.education?.uuid ? documentsByEducation.get(editor.education.uuid) ?? [] : []}
          onClose={() => setEditor(null)}
          onSaved={refresh}
        />
      )}
      <DeleteModal
        open={Boolean(deleting)}
        setOpen={open => { if (!open && !deletingPending) setDeleting(null); }}
        title='Delete education?'
        description={`Remove “${deleting?.qualification ?? ''}” from your education record?`}
        onConfirm={() => void remove()}
        isLoading={deletingPending}
      />
    </div>
  );
}

function EducationDialog({ education, documents, onClose, onSaved }: {
  education?: UserEducation;
  documents: UserDocument[];
  onClose: () => void;
  onSaved: () => Promise<unknown>;
}) {
  const [draft, setDraft] = useState({
    qualification: education?.qualification ?? '',
    field_of_study: education?.field_of_study ?? '',
    school_name: education?.school_name ?? '',
    year_completed: education?.year_completed?.toString() ?? '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  // Keep the created id if upload fails so retrying cannot create duplicate education.
  const [savedUuid, setSavedUuid] = useState(education?.uuid);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const add = useMutation(addEducationMutation());
  const update = useMutation(updateEducationMutation());
  const upload = useMutation(uploadDocumentMutation());
  const documentTypes = useQuery({
    ...listDocumentTypesOptions(),
    select: requireApiData,
    staleTime: STALE_TIMES.reference,
  });
  const selectedType = documentTypes.data?.find(type => type.uuid === documentType);
  const currentYear = new Date().getFullYear();
  const canConfirm = Boolean(
    draft.qualification.trim() && draft.field_of_study.trim() && draft.school_name.trim() &&
    /^\d{4}$/.test(draft.year_completed) && Number(draft.year_completed) <= currentYear &&
    Number(draft.year_completed) >= 1900 && (file || documents.length) && (!file || selectedType)
  );
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (pending || !canConfirm) return;
    setError('');
    if (file) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf' || extension === 'pdf';
      if (!file.size || (!isImage && !isPdf)) {
        setError('Choose a non-empty image or PDF.');
        return;
      }
      if (selectedType?.allowed_extensions?.length && !selectedType.allowed_extensions.some(
        allowed => allowed.replace(/^\./, '').toLowerCase() === extension
      )) {
        setError('This file format is not allowed for the selected document type.');
        return;
      }
      if (selectedType?.max_file_size_mb && file.size > selectedType.max_file_size_mb * 1024 * 1024) {
        setError(`Choose a file smaller than ${selectedType.max_file_size_mb} MB.`);
        return;
      }
    }
    setPending(true);
    let recordSaved = false;
    try {
      const body: UserEducation = {
        qualification: draft.qualification.trim(),
        field_of_study: draft.field_of_study.trim(),
        school_name: draft.school_name.trim(),
        year_completed: Number(draft.year_completed),
        ...(education?.start_year !== undefined ? { start_year: education.start_year } : {}),
        ...(education?.certificate_number ? { certificate_number: education.certificate_number } : {}),
      };
      const record = requireApiData(savedUuid
        ? await update.mutateAsync({ path: { itemUuid: savedUuid }, body })
        : await add.mutateAsync({ body }));
      const uuid = record.uuid || savedUuid;
      if (!uuid) throw new Error('The saved qualification has no id. Reload education before trying again.');
      setSavedUuid(uuid);
      recordSaved = true;
      if (file) {
        requireApiData(await upload.mutateAsync({
          body: { file },
          query: {
            document_type_uuid: documentType,
            education_uuid: uuid,
            title: `${body.qualification} — ${body.school_name}`,
          },
        }));
      }
      await onSaved();
      toast.success(education ? 'Education updated.' : 'Education added.');
      onClose();
    } catch (cause) {
      setError(`${recordSaved ? 'Your qualification was saved. Retry to attach the evidence. ' : ''}${getErrorMessage(cause, 'Unable to save education. Please try again.')}`);
      if (recordSaved) await onSaved();
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open onOpenChange={open => { if (!open && !pending) onClose(); }}>
      <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{education ? 'Edit education' : 'Add education'}</DialogTitle>
          <DialogDescription>Upload an image or PDF to support your qualification. Evidence is pending verification when added.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <fieldset disabled={pending} className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='education-qualification'>Skill (qualification)</Label>
              <Input id='education-qualification' placeholder='e.g. Bachelor of Science' required value={draft.qualification} onChange={event => setDraft(value => ({ ...value, qualification: event.target.value }))} />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='education-field'>Taxonomy / category (field of study)</Label>
              <Input id='education-field' placeholder='e.g. Computer Science' required value={draft.field_of_study} onChange={event => setDraft(value => ({ ...value, field_of_study: event.target.value }))} />
            </div>
            <div className='space-y-2 sm:col-span-2'>
              <Label htmlFor='education-school'>School name / awarding institution</Label>
              <Input id='education-school' placeholder='e.g. University of Nairobi' required value={draft.school_name} onChange={event => setDraft(value => ({ ...value, school_name: event.target.value }))} />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='education-proficiency'>Proficiency level</Label>
              <Input id='education-proficiency' value='' disabled readOnly />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='education-status'>Verification status</Label>
              <Input id='education-status' value={file ? 'Pending' : verificationStatus(documents)} readOnly />
            </div>
            <div className='space-y-2 sm:col-span-2'>
              <Label htmlFor='education-year'>Date issued / obtained (year completed)</Label>
              <Input id='education-year' type='number' min={1900} max={currentYear} step={1} placeholder='YYYY' required value={draft.year_completed} onChange={event => setDraft(value => ({ ...value, year_completed: event.target.value }))} />
            </div>
            <div className='space-y-2 sm:col-span-2'>
              <Label htmlFor='education-evidence'>Evidence (image or PDF)</Label>
              <Input id='education-evidence' type='file' accept='image/*,.pdf,application/pdf' required={!documents.length} onChange={event => setFile(event.target.files?.[0] ?? null)} />
              <p className='text-muted-foreground text-xs'>
                {documents.length ? `${documents.length} evidence document(s) already attached. You can upload additional evidence.` : 'Evidence is required to confirm this qualification.'}
              </p>
            </div>
            {file && (
              <div className='space-y-2 sm:col-span-2'>
                <Label htmlFor='education-document-type'>Evidence document type</Label>
                <Select value={documentType} onValueChange={setDocumentType} disabled={pending || documentTypes.isPending}>
                  <SelectTrigger id='education-document-type'><SelectValue placeholder={documentTypes.isPending ? 'Loading document types…' : 'Select document type'} /></SelectTrigger>
                  <SelectContent>
                    {(documentTypes.data ?? []).map(type => type.uuid ? <SelectItem key={type.uuid} value={type.uuid}>{type.description || type.name || 'Document type'}</SelectItem> : null)}
                  </SelectContent>
                </Select>
                {documentTypes.isError ? (
                  <p role='alert' className='text-destructive text-sm'>Unable to load document types. <Button type='button' variant='link' onClick={() => void documentTypes.refetch()}>Try again</Button></p>
                ) : !documentTypes.isPending && !documentTypes.data?.some(type => type.uuid) ? (
                  <p role='alert' className='text-destructive text-sm'>No evidence document types are available.</p>
                ) : null}
              </div>
            )}
            {error && <p role='alert' className='text-destructive text-sm whitespace-pre-line sm:col-span-2'>{error}</p>}
            <DialogFooter className='sm:col-span-2'>
              <Button type='button' variant='outline' onClick={onClose}>Cancel</Button>
              <Button type='submit' disabled={pending || !canConfirm}>{pending && <Spinner />}Confirm</Button>
            </DialogFooter>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
}
