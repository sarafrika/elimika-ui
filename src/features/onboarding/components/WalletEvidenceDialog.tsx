'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/lib/error-utils';
import { STALE_TIMES } from '@/lib/query-client';
import { listDocumentTypesOptions, listDocumentsQueryKey, uploadDocumentMutation } from '@/services/client/@tanstack/react-query.gen';
import { requireApiData } from '../lib/user-onboarding';

export function WalletEvidenceDialog({ experienceUuid, onClose, onSaved }: {
  experienceUuid?: string;
  onClose: () => void;
  onSaved: () => Promise<unknown>;
}) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [typeUuid, setTypeUuid] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const upload = useMutation(uploadDocumentMutation());
  const types = useQuery({ ...listDocumentTypesOptions(), select: requireApiData, staleTime: STALE_TIMES.reference });
  const selectedType = types.data?.find(type => type.uuid === typeUuid);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!file || !selectedType || pending) return;
    setError('');
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!file.size || (!file.type.startsWith('image/') && file.type !== 'application/pdf' && extension !== 'pdf')) {
      setError('Choose a non-empty image or PDF.');
      return;
    }
    if (selectedType.allowed_extensions?.length && !selectedType.allowed_extensions.some(allowed => allowed.replace(/^\./, '').toLowerCase() === extension)) {
      setError('This file format is not allowed for the selected document type.');
      return;
    }
    if (selectedType.max_file_size_mb && file.size > selectedType.max_file_size_mb * 1024 * 1024) {
      setError(`Choose a file smaller than ${selectedType.max_file_size_mb} MB.`);
      return;
    }
    setPending(true);
    try {
      requireApiData(await upload.mutateAsync({ body: { file }, query: {
        document_type_uuid: typeUuid, experience_uuid: experienceUuid,
        title: title.trim() || file.name, description: description.trim() || undefined,
      } }));
      await queryClient.invalidateQueries({ queryKey: listDocumentsQueryKey() });
      await onSaved();
      toast.success('Evidence uploaded for admin review.');
      onClose();
    } catch (cause) {
      setError(getErrorMessage(cause, 'Unable to upload evidence. Please try again.'));
    } finally {
      setPending(false);
    }
  };
  return (
    <Dialog open onOpenChange={open => { if (!open && !pending) onClose(); }}>
      <DialogContent className='max-h-[90dvh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Upload evidence</DialogTitle>
          <DialogDescription>Upload an image or PDF. Evidence starts pending admin verification.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <fieldset disabled={pending} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='wallet-evidence-file'>Evidence (image or PDF)</Label>
              <Input id='wallet-evidence-file' type='file' accept='image/*,.pdf,application/pdf' required onChange={event => setFile(event.target.files?.[0] ?? null)} />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='wallet-evidence-type'>Document type</Label>
              <Select value={typeUuid} onValueChange={setTypeUuid} disabled={pending || types.isPending}>
                <SelectTrigger id='wallet-evidence-type'><SelectValue placeholder={types.isPending ? 'Loading document types…' : 'Select a document type'} /></SelectTrigger>
                <SelectContent>{types.data?.map(type => type.uuid ? <SelectItem key={type.uuid} value={type.uuid}>{type.description || type.name || 'Document type'}</SelectItem> : null)}</SelectContent>
              </Select>
              {types.isError ? <p role='alert' className='text-destructive text-sm'>Unable to load document types. <Button type='button' variant='link' onClick={() => void types.refetch()}>Try again</Button></p>
                : !types.isPending && !types.data?.some(type => type.uuid) ? <p role='alert' className='text-destructive text-sm'>No document types are available.</p> : null}
            </div>
            <div className='space-y-2'><Label htmlFor='wallet-evidence-title'>Title</Label><Input id='wallet-evidence-title' value={title} onChange={event => setTitle(event.target.value)} /></div>
            <div className='space-y-2'><Label htmlFor='wallet-evidence-description'>Description</Label><Textarea id='wallet-evidence-description' value={description} onChange={event => setDescription(event.target.value)} /></div>
            {error && <p role='alert' className='text-destructive text-sm'>{error}</p>}
            <DialogFooter>
              <Button type='button' variant='outline' onClick={onClose}>Cancel</Button>
              <Button type='submit' disabled={pending || !file || !selectedType}>{pending && <Spinner />}Confirm</Button>
            </DialogFooter>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
}
