'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { type FormEvent, useEffect, useId, useRef, useState } from 'react';
import { toast } from 'sonner';
import { DocumentPreview } from '@/components/data-display/document-preview';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { dayjs, localDate } from '@/lib/date';
import { getErrorMessage } from '@/lib/error-utils';
import { STALE_TIMES } from '@/lib/query-client';
import {
  addPortfolioItemMutation, listDocumentsOptions, listDocumentsQueryKey, listDocumentTypesOptions,
  updatePortfolioItemMutation, uploadDocumentMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { ItemTypeEnum, type UserDocument, type UserPortfolioItem } from '@/services/client/types.gen';
import { requireApiData } from '@/src/features/onboarding/lib/user-onboarding';
import { isAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { PORTFOLIO_ITEM_TYPES, portfolioDateInput, portfolioLink } from './portfolio';

type UploadedAttachment = { file: File; documentType: string; document: UserDocument };

function AttachmentPreview({ url, name, mime = '' }: { url: string; name: string; mime?: string }) {
  const extension = name.split('.').pop()?.toLowerCase() ?? '';
  return (
    <div className='border-border bg-muted/20 space-y-2 overflow-hidden rounded-md border p-3'>
      <p className='text-foreground break-all text-sm font-medium'>{name}</p>
      {mime.startsWith('image/') || /^(png|jpe?g|gif|webp|avif|bmp|svg)$/.test(extension) ? (
        <Image src={url} alt={name} width={640} height={360} className='max-h-64 w-full rounded-md object-contain' />
      ) : mime.startsWith('video/') || /^(mp4|webm|mov|m4v|ogv)$/.test(extension) ? (
        <video key={url} src={url} controls preload='metadata' aria-label={name} className='max-h-64 w-full rounded-md' />
      ) : mime.startsWith('audio/') || /^(mp3|wav|m4a|aac|ogg|flac)$/.test(extension) ? (
        <audio key={url} src={url} controls preload='metadata' aria-label={name} className='w-full' />
      ) : mime === 'application/pdf' || extension === 'pdf' ? (
        <DocumentPreview key={url} documentUrl={url} documentTitle={name} height={260} />
      ) : (
        <p className='text-muted-foreground text-xs'>An inline preview is unavailable for this file type.</p>
      )}
      <a className='text-primary text-sm underline' href={url} target='_blank' rel='noopener noreferrer'>Open attachment</a>
    </div>
  );
}

function SelectedFilePreview({ file }: { file: File }) {
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreview({ file, url });
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return preview?.file === file
    ? <AttachmentPreview url={preview.url} name={file.name} mime={file.type} />
    : <Spinner />;
}

function attachmentName(url: string) {
  try {
    return decodeURIComponent(new URL(url, 'https://local.invalid').pathname.split('/').pop() || 'Current attachment');
  } catch {
    return 'Current attachment';
  }
}

export function PortfolioProjectDialog({ project, onClose, onSaved }: {
  project?: UserPortfolioItem;
  onClose: () => void;
  onSaved: () => Promise<unknown>;
}) {
  const id = useId();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState({
    title: project?.title ?? '',
    itemType: project?.item_type ?? ItemTypeEnum.PROJECT,
    description: project?.description ?? '',
    completedOn: portfolioDateInput(project?.completed_on),
    link: project?.link_url ?? '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [attachmentSource, setAttachmentSource] = useState<'file' | 'external' | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState('');
  // Retain successful work if a later request fails so retries reuse the same records.
  const uploadedAttachment = useRef<UploadedAttachment | null>(null);
  const savedUuid = useRef(project?.uuid);
  const saving = useRef(false);
  const [stage, setStage] = useState<'upload' | 'project' | null>(null);
  const [error, setError] = useState('');
  const pending = stage !== null;
  const add = useMutation(addPortfolioItemMutation());
  const update = useMutation(updatePortfolioItemMutation());
  const upload = useMutation(uploadDocumentMutation());
  const documentTypes = useQuery({
    ...listDocumentTypesOptions(),
    select: requireApiData,
    enabled: !!file,
    staleTime: STALE_TIMES.reference,
  });
  const selectedType = documentTypes.data?.find(type => type.uuid === documentType);
  const currentLink = portfolioLink(draft.link);
  const documents = useQuery({
    ...listDocumentsOptions(),
    select: requireApiData,
    enabled: !!project?.link_url,
    staleTime: STALE_TIMES.entity,
  });
  const existingDocument = documents.data?.find(document => {
    const url = portfolioLink(document.file_url);
    return !!url && url === currentLink;
  });
  const isUploadedLink = draft.link.startsWith('/') || isAuthenticatedMediaUrl(currentLink) || !!existingDocument;
  const source = attachmentSource ?? (
    !draft.link || isUploadedLink || !documents.isSuccess ? 'file' : 'external'
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (saving.current) return;
    setError('');
    if (!draft.title.trim() || !draft.description.trim()) {
      setError('Enter a project title and description.');
      return;
    }
    const itemType = Object.values(ItemTypeEnum).find(type => type === draft.itemType);
    if (!itemType) {
      setError('Select a project type.');
      return;
    }
    if (project && !savedUuid.current) {
      setError('This project has no ID. Reload your portfolio before editing it.');
      return;
    }
    if (source === 'external' && draft.link.trim() && (
      !currentLink || (draft.link.trim().startsWith('/') && draft.link.trim() !== project?.link_url)
    )) {
      setError('Enter a valid http or https project link.');
      return;
    }
    const completedOn = draft.completedOn || (project ? '' : dayjs().format('YYYY-MM-DD'));
    if (completedOn) {
      const parsed = new Date(`${completedOn}T00:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(completedOn) ||
        !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== completedOn) {
        setError('Enter a valid project date.');
        return;
      }
    }
    if (file) {
      if (!selectedType?.uuid) {
        setError('Select a document type for your attachment.');
        return;
      }
      if (!file.size) {
        setError('Choose a non-empty attachment.');
        return;
      }
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (selectedType.allowed_extensions?.length && !selectedType.allowed_extensions.some(
        allowed => allowed === '*' || allowed.replace(/^\./, '').toLowerCase() === extension
      )) {
        setError('This file format is not allowed for the selected document type.');
        return;
      }
      if (selectedType.max_file_size_mb && file.size > selectedType.max_file_size_mb * 1024 * 1024) {
        setError(`Choose an attachment smaller than ${selectedType.max_file_size_mb} MB.`);
        return;
      }
    }

    saving.current = true;
    setStage(file ? 'upload' : 'project');
    try {
      let link = draft.link.trim();
      if (file) {
        let attachment = uploadedAttachment.current;
        if (!attachment || attachment.file !== file || attachment.documentType !== documentType) {
          const document = requireApiData(await upload.mutateAsync({
            body: { file },
            query: { document_type_uuid: documentType, title: draft.title.trim() },
          }));
          attachment = { file, documentType, document };
          uploadedAttachment.current = attachment;
          void queryClient.invalidateQueries({ queryKey: listDocumentsQueryKey() });
        }
        if (!attachment.document.file_url || !portfolioLink(attachment.document.file_url)) {
          throw new Error('The uploaded document has no usable attachment link. Check your profile documents before trying again.');
        }
        link = attachment.document.file_url;
      } else if (source === 'external' && link && !link.startsWith('/')) {
        link = new URL(link).toString();
      }
      setStage('project');
      const body: UserPortfolioItem = {
        title: draft.title.trim(),
        item_type: itemType,
        description: draft.description.trim(),
        completed_on: completedOn ? localDate(completedOn) : undefined,
        link_url: link || undefined,
      };
      const saved = requireApiData(savedUuid.current
        ? await update.mutateAsync({ path: { itemUuid: savedUuid.current }, body })
        : await add.mutateAsync({ body }));
      savedUuid.current = saved.uuid || savedUuid.current;
      await onSaved();
      toast.success(project ? 'Project updated.' : 'Project added.');
      onClose();
    } catch (cause) {
      const attachmentSaved = file && uploadedAttachment.current?.file === file &&
        uploadedAttachment.current.documentType === documentType &&
        portfolioLink(uploadedAttachment.current.document.file_url);
      setError(`${attachmentSaved ? 'Your attachment was uploaded. Save again to link it to the project. ' : ''}${getErrorMessage(cause, 'Unable to save this project. Please try again.')}`);
    } finally {
      saving.current = false;
      setStage(null);
    }
  };

  return (
    <Dialog open onOpenChange={open => { if (!open && !saving.current) onClose(); }}>
      <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{project ? 'Edit project' : 'Add new project'}</DialogTitle>
          <DialogDescription>Showcase your work with a description, a link, or an attachment.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className='space-y-4'>
          <fieldset disabled={pending} className='grid gap-4 sm:grid-cols-2'>
            <legend className='sr-only'>Project details</legend>
            <div className='space-y-2 sm:col-span-2'>
              <Label htmlFor={`${id}-title`}>Project title</Label>
              <Input id={`${id}-title`} required value={draft.title} onChange={event => setDraft(value => ({ ...value, title: event.target.value }))} />
            </div>
            <div className='space-y-2'>
              <Label htmlFor={`${id}-type`}>Project type</Label>
              <Select value={draft.itemType} disabled={pending} onValueChange={value => {
                const type = Object.values(ItemTypeEnum).find(item => item === value);
                if (type) setDraft(current => ({ ...current, itemType: type }));
              }}>
                <SelectTrigger id={`${id}-type`}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(ItemTypeEnum).map(type => <SelectItem key={type} value={type}>{PORTFOLIO_ITEM_TYPES[type]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor={`${id}-date`}>Project date (optional)</Label>
              <Input id={`${id}-date`} type='date' value={draft.completedOn} onChange={event => setDraft(value => ({ ...value, completedOn: event.target.value }))} />
            </div>
            <div className='space-y-2 sm:col-span-2'>
              <Label htmlFor={`${id}-description`}>Description</Label>
              <Textarea id={`${id}-description`} required rows={4} value={draft.description} onChange={event => setDraft(value => ({ ...value, description: event.target.value }))} />
            </div>
            <div className='space-y-2 sm:col-span-2'>
              <Label htmlFor={`${id}-source`}>Project media (optional)</Label>
              <Select value={source} disabled={pending} onValueChange={value => {
                if (value !== 'file' && value !== 'external') return;
                if (value === source) return;
                setAttachmentSource(value);
                setDraft(current => ({ ...current, link: '' }));
                setFile(null);
                setDocumentType('');
                if (fileInput.current) fileInput.current.value = '';
              }}>
                <SelectTrigger id={`${id}-source`}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value='file'>Upload a file</SelectItem>
                  <SelectItem value='external'>External URL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {source === 'external' && <div className='space-y-2 sm:col-span-2'>
              <Label htmlFor={`${id}-link`}>Project or media link (optional)</Label>
              <Input id={`${id}-link`} inputMode='url' placeholder='https://' value={draft.link} onChange={event => setDraft(value => ({ ...value, link: event.target.value }))} />
              {currentLink && <div className='flex flex-wrap items-center gap-2'>
                <a className='text-primary text-sm underline' href={currentLink} target='_blank' rel='noopener noreferrer'>Open current link</a>
                <Button type='button' variant='ghost' size='sm' onClick={() => setDraft(value => ({ ...value, link: '' }))}>Remove link</Button>
              </div>}
            </div>}
            {source === 'file' && <div className='space-y-2 sm:col-span-2'>
              <Label htmlFor={`${id}-file`}>Attachment (optional)</Label>
              <Input ref={fileInput} id={`${id}-file`} type='file' onChange={event => {
                setAttachmentSource('file');
                setFile(event.target.files?.[0] ?? null);
              }} />
              <p className='text-muted-foreground text-xs'>Uploading a file replaces the project link. Uploaded files are also saved in your profile documents.</p>
              {file ? <SelectedFilePreview file={file} /> : currentLink && (
                <>
                  <AttachmentPreview url={currentLink} name={existingDocument?.original_filename || attachmentName(draft.link)} mime={existingDocument?.mime_type} />
                  <Button type='button' variant='ghost' size='sm' onClick={() => setDraft(value => ({ ...value, link: '' }))}>Remove attachment</Button>
                </>
              )}
              {file && <Button type='button' variant='outline' size='sm' onClick={() => {
                setFile(null);
                if (fileInput.current) fileInput.current.value = '';
              }}>Remove selected file</Button>}
            </div>}
            {file && (
              <div className='space-y-2 sm:col-span-2'>
                <Label htmlFor={`${id}-document-type`}>Attachment document type</Label>
                <Select value={documentType} onValueChange={setDocumentType} disabled={pending || documentTypes.isPending}>
                  <SelectTrigger id={`${id}-document-type`}><SelectValue placeholder={documentTypes.isPending ? 'Loading document types…' : 'Select a document type'} /></SelectTrigger>
                  <SelectContent>{documentTypes.data?.map(type => type.uuid ? <SelectItem key={type.uuid} value={type.uuid}>{type.description || type.name || 'Document type'}</SelectItem> : null)}</SelectContent>
                </Select>
                {selectedType && <p className='text-muted-foreground text-xs'>
                  {selectedType.allowed_extensions?.length ? `Allowed formats: ${selectedType.allowed_extensions.join(', ')}. ` : ''}
                  {selectedType.max_file_size_mb ? `Maximum size: ${selectedType.max_file_size_mb} MB.` : ''}
                </p>}
                {documentTypes.isError ? <p role='alert' className='text-destructive text-sm'>Unable to load document types. <Button type='button' variant='link' onClick={() => void documentTypes.refetch()}>Try again</Button></p>
                  : !documentTypes.isPending && !documentTypes.data?.some(type => type.uuid) ? <p role='alert' className='text-destructive text-sm'>No document types are available. Remove the attachment to save your project without it.</p> : null}
              </div>
            )}
          </fieldset>
          {error && <p role='alert' className='text-destructive text-sm'>{error}</p>}
          <DialogFooter>
            <Button type='button' variant='outline' disabled={pending} onClick={onClose}>Cancel</Button>
            <Button type='submit' disabled={pending || (!!file && !selectedType?.uuid)}>
              {pending && <Spinner />}
              {stage === 'upload' ? 'Uploading attachment…' : stage === 'project' ? 'Saving project…' : project ? 'Save changes' : 'Add project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
