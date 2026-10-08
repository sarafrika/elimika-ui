'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { type FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { SkillsWalletEducationTab } from '@/app/dashboard/_components/skills-wallet/SkillsWalletEducationTab';
import DeleteModal from '@/components/custom-modals/delete-modal';
import { SectionTabPanel, SectionTabs } from '@/components/data-display';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/lib/error-utils';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { useProfileWallet, type WalletRecord } from '../hooks/useProfileWallet';
import { deleteWalletRecord, PROFILE_SUMMARY_QUERY_KEY, PROFILE_WALLET_QUERY_KEYS, saveWalletRecord } from '../lib/profile-wallet-api';
import { WALLET_SECTIONS, walletSection, type EditableWalletSection, type WalletField, type WalletSectionKey } from '../lib/wallet-sections';
import { WalletEvidenceDialog } from './WalletEvidenceDialog';

const TABS = WALLET_SECTIONS.map(section => ({ id: section.key, label: section.label }));

export function OnboardingSkillsWallet({ readOnly = false, initialTab = 'skills' }: {
  readOnly?: boolean;
  initialTab?: WalletSectionKey;
}) {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user?.id ?? session?.user?.email ?? '';
  const [identity, setIdentity] = useState<string | null>(null);
  const authenticated = status === 'authenticated' && !session?.error;
  const ready = authenticated && identity === userId;
  useEffect(() => {
    if (!authenticated) { setIdentity(null); return; }
    // /me keys must not paint another account's cached claims after signing in.
    for (const queryKey of [...Object.values(PROFILE_WALLET_QUERY_KEYS), PROFILE_SUMMARY_QUERY_KEY])
      queryClient.removeQueries({ queryKey });
    setIdentity(userId);
  }, [authenticated, queryClient, userId]);
  return ready ? <ProfileWallet key={userId} readOnly={readOnly} initialTab={initialTab} /> : <Skeleton className='h-64 w-full' />;
}

function ProfileWallet({ readOnly, initialTab }: { readOnly: boolean; initialTab: WalletSectionKey }) {
  const [tab, setTab] = useState(initialTab);
  const wallet = useProfileWallet(tab, true);
  const [editor, setEditor] = useState<{ section: EditableWalletSection; record?: WalletRecord } | null>(null);
  const [deleting, setDeleting] = useState<WalletRecord | null>(null);
  const [evidence, setEvidence] = useState<{ experienceUuid?: string } | null>(null);
  const deletion = useMutation({
    mutationFn: async (record: WalletRecord) => {
      if (!record.uuid || record.section === 'education' || record.document) throw new Error('This record cannot be deleted here.');
      await deleteWalletRecord(record.section, record.uuid);
    },
    onSuccess: async (_, record) => {
      await wallet.invalidate(record.section);
      setDeleting(null);
      toast.success('Wallet record deleted.');
    },
    onError: error => toast.error(getErrorMessage(error, 'Unable to delete this record.')),
  });

  return (
    <div className='space-y-4'>
      <p className='text-muted-foreground text-sm'>
        {readOnly ? 'Your saved wallet information and available admin verification decisions.'
          : 'Add or update your wallet information. Your changes are saved to your profile; check Verification for admin decisions.'}
      </p>
      <SectionTabs tabs={TABS} value={tab} onValueChange={setTab} label='Skills wallet sections' variant='pill'>
        {WALLET_SECTIONS.map(section => (
          <SectionTabPanel key={section.key} value={section.key}>
            {tab === section.key && (
              section.key === 'education' ? <SkillsWalletEducationTab readOnly={readOnly} /> : (
                <div className='space-y-4'>
                  <div className='flex flex-wrap items-center justify-between gap-3'>
                    <div>
                      <h2 className='text-xl font-semibold'>{section.label}</h2>
                      <p className='text-muted-foreground text-sm'>{section.summary}</p>
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      <Button type='button' variant='outline' disabled={wallet.isFetching} onClick={() => void wallet.refresh()}>
                        {wallet.isFetching ? <Spinner /> : <RefreshCw className='size-4' />}Refresh
                      </Button>
                      {!readOnly && section.key !== 'verification' && (
                        <Button type='button' onClick={() => {
                          if (section.key !== 'education' && section.key !== 'verification') setEditor({ section: section.key });
                        }}><Plus className='size-4' />{section.addLabel}</Button>
                      )}
                      {!readOnly && section.key === 'credentials' && (
                        <Button type='button' variant='outline' onClick={() => setEvidence({})}>Upload evidence</Button>
                      )}
                    </div>
                  </div>
                  {section.key === 'verification' && (
                    <p className='text-muted-foreground text-sm'>
                      Decisions refresh automatically every five minutes. Education and experience show linked evidence decisions.
                      Portfolio and achievements do not have individual review decisions yet.
                    </p>
                  )}
                  {wallet.isLoading ? <Skeleton className='h-48 w-full' /> : wallet.failed ? (
                    <EmptyState title='Unable to load wallet information' description='Please reload to see all saved records and their latest statuses.'
                      action={<Button type='button' variant='outline' onClick={() => void wallet.refresh()}>Try again</Button>} />
                  ) : (
                    <WalletRecords
                      records={wallet.records.filter(record => tab === 'verification' || record.section === tab)}
                      verification={tab === 'verification'}
                      onEdit={!readOnly && tab !== 'verification' ? record => {
                        if (record.section !== 'education') setEditor({ section: record.section, record });
                      } : undefined}
                      onDelete={!readOnly && tab !== 'verification' ? setDeleting : undefined}
                      onEvidence={!readOnly && tab === 'experience' ? record => setEvidence({ experienceUuid: record.uuid }) : undefined}
                    />
                  )}
                </div>
              )
            )}
          </SectionTabPanel>
        ))}
      </SectionTabs>
      {editor && !readOnly && <WalletRecordDialog section={editor.section} record={editor.record} onClose={() => setEditor(null)} onSaved={() => wallet.invalidate(editor.section)} />}
      {evidence && !readOnly && <WalletEvidenceDialog experienceUuid={evidence.experienceUuid} onClose={() => setEvidence(null)} onSaved={() => wallet.invalidate(evidence.experienceUuid ? 'experience' : 'credentials')} />}
      <DeleteModal open={Boolean(deleting)} setOpen={open => { if (!open && !deletion.isPending) setDeleting(null); }}
        title='Delete wallet record?' description={`Remove “${deleting?.title ?? ''}” from your profile?`}
        isLoading={deletion.isPending} onConfirm={() => { if (deleting && !deletion.isPending) deletion.mutate(deleting); }} />
    </div>
  );
}

function WalletRecords({ records, verification, onEdit, onDelete, onEvidence }: {
  records: WalletRecord[];
  verification: boolean;
  onEdit?: (record: WalletRecord) => void;
  onDelete?: (record: WalletRecord) => void;
  onEvidence?: (record: WalletRecord) => void;
}) {
  if (!records.length) return <EmptyState title={verification ? 'No wallet information yet' : 'No records added yet'} description='Saved information will appear here after you add it to your profile.' />;
  return (
    <div className='space-y-3'>
      {records.map((record, index) => (
        <Card key={`${record.section}-${record.document ? 'document' : 'record'}-${record.uuid ?? index}`}>
          <CardContent className='space-y-3 p-5'>
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0 space-y-1'>
                {verification && <p className='text-muted-foreground text-xs'>{record.document ? 'Evidence document' : walletSection(record.section).label}</p>}
                <h3 className='font-semibold break-words'>{record.title}</h3>
                <Badge variant='outline'>
                  {record.status ? `${record.status}${record.statusBasis === 'evidence' ? ' evidence' : ''}` : 'Review status unavailable'}
                </Badge>
              </div>
              {!record.document && record.uuid && (
                <div className='flex shrink-0 gap-1'>
                  {onEdit && <Button type='button' variant='ghost' size='icon' aria-label={`Edit ${record.title}`} onClick={() => onEdit(record)}><Pencil className='size-4' /></Button>}
                  {onDelete && <Button type='button' variant='ghost' size='icon' aria-label={`Delete ${record.title}`} onClick={() => onDelete(record)}><Trash2 className='text-destructive size-4' /></Button>}
                </div>
              )}
            </div>
            <dl className='grid gap-2 text-sm sm:grid-cols-2'>
              {walletSection(record.section).fields.filter(field => !field.disabled && field.type !== 'file' && field.key !== walletSection(record.section).titleField && record.values[field.key]).map(field => {
                const value = record.values[field.key] ?? '';
                const display = field.options?.find(option => option.value === value)?.label ?? (field.type === 'checkbox' ? value === 'true' ? 'Yes' : 'No' : value);
                const href = field.type === 'url' ? httpUrl(value) : undefined;
                return (
                  <div key={field.key} className='min-w-0'>
                    <dt className='text-muted-foreground text-xs'>{field.label}</dt>
                    <dd className='break-words whitespace-pre-line'>
                      {href ? <a className='text-primary underline' href={href} target='_blank' rel='noopener noreferrer'>{display}</a> : display}
                    </dd>
                  </div>
                );
              })}
              {record.updatedAt && <div><dt className='text-muted-foreground text-xs'>Saved / updated</dt><dd>{displayDate(record.updatedAt)}</dd></div>}
              {record.verifiedAt && <div><dt className='text-muted-foreground text-xs'>Reviewed on</dt><dd>{displayDate(record.verifiedAt)}</dd></div>}
            </dl>
            {record.notes && <p className='text-muted-foreground text-sm whitespace-pre-line'>Admin feedback: {record.notes}</p>}
            {record.statusBasis === 'unavailable' && <p className='text-muted-foreground text-xs'>This record is saved. An individual review decision is not available for this record.</p>}
            {record.document && (
              <div className='text-sm'>
                {record.document.description && <p className='text-muted-foreground whitespace-pre-line'>{record.document.description}</p>}
                <p>{record.document.original_filename}</p>
                {record.document.verified_by && <p className='text-muted-foreground'>Reviewed by: {record.document.verified_by}</p>}
                {record.document.file_url && <a href={toAuthenticatedMediaUrl(record.document.file_url) ?? undefined} className='text-primary underline' target='_blank' rel='noopener noreferrer'>View evidence</a>}
              </div>
            )}
            {onEvidence && record.uuid && <Button type='button' size='sm' variant='outline' onClick={() => onEvidence(record)}>Attach evidence</Button>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function displayDate(value: Date | string) {
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toLocaleDateString() : 'Date unavailable';
}

function httpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function WalletRecordDialog({ section, record, onClose, onSaved }: {
  section: EditableWalletSection;
  record?: WalletRecord;
  onClose: () => void;
  onSaved: () => Promise<unknown>;
}) {
  const config = walletSection(section);
  const [values, setValues] = useState<Record<string, string>>(() => ({ ...record?.values }));
  const [error, setError] = useState('');
  const save = useMutation({
    mutationFn: () => saveWalletRecord(section, values, record?.uuid),
    onSuccess: async () => {
      await onSaved();
      toast.success(record ? 'Wallet record updated.' : 'Wallet record added.');
      onClose();
    },
    onError: cause => setError(getErrorMessage(cause, 'Unable to save this record.')),
  });
  const canConfirm = config.fields.every(field => !field.required || field.disabled || Boolean(values[field.key]?.trim()));
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!canConfirm || save.isPending) return;
    setError('');
    save.mutate();
  };
  return (
    <Dialog open onOpenChange={open => { if (!open && !save.isPending) onClose(); }}>
      <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{record ? `Edit ${config.label.toLowerCase()} record` : config.addLabel}</DialogTitle>
          <DialogDescription>{config.summary} Verification decisions are managed by admins.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <fieldset disabled={save.isPending} className='grid gap-4 sm:grid-cols-2'>
            {config.fields.map(field => (
              <WalletFormField key={field.key} field={field} value={values[field.key] ?? field.defaultValue ?? ''}
                disabled={save.isPending || Boolean(field.disabled) || (field.key === 'end_date' && values.is_current_position === 'true')}
                onChange={value => setValues(current => ({ ...current, [field.key]: value }))} />
            ))}
            {error && <p role='alert' className='text-destructive text-sm whitespace-pre-line sm:col-span-2'>{error}</p>}
            <DialogFooter className='sm:col-span-2'>
              <Button type='button' variant='outline' onClick={onClose}>Cancel</Button>
              <Button type='submit' disabled={save.isPending || !canConfirm}>{save.isPending && <Spinner />}Confirm</Button>
            </DialogFooter>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function WalletFormField({ field, value, onChange, disabled }: {
  field: WalletField;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const id = `wallet-${field.key}`;
  if (field.type === 'checkbox') return (
    <div className='flex items-center gap-2 sm:col-span-2'>
      <Checkbox id={id} checked={value === 'true'} disabled={disabled} onCheckedChange={checked => onChange(checked === true ? 'true' : 'false')} />
      <Label htmlFor={id}>{field.label}</Label>
    </div>
  );
  return (
    <div className={`space-y-2 ${field.type === 'textarea' ? 'sm:col-span-2' : ''}`}>
      <Label htmlFor={id}>{field.label}{field.required ? ' *' : ''}</Label>
      {field.type === 'select' ? (
        <Select value={value} onValueChange={next => onChange(next === '__unset' ? '' : next)} disabled={disabled}>
          <SelectTrigger id={id}><SelectValue placeholder='Select an option' /></SelectTrigger>
          <SelectContent>
            {!field.required && <SelectItem value='__unset'>Not specified</SelectItem>}
            {field.options?.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
          </SelectContent>
        </Select>
      ) : field.type === 'textarea' ? (
        <Textarea id={id} value={value} required={field.required} placeholder={field.placeholder} disabled={disabled} onChange={event => onChange(event.target.value)} />
      ) : (
        <Input id={id} type={field.type ?? 'text'} value={value} required={field.required} placeholder={field.placeholder}
          min={field.min} max={field.max} step={field.type === 'number' ? 1 : undefined} disabled={disabled}
          onChange={event => onChange(event.target.value)} />
      )}
    </div>
  );
}
