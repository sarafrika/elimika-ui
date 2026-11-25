'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/lib/error-utils';
import { STALE_TIMES } from '@/lib/query-client';
import {
  listAchievementsOptions,
  listCertificationsOptions,
  listCompetenciesOptions,
  listExperienceOptions,
  listPortfolioOptions,
  listSkillsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { type FormEvent, useId, useState } from 'react';
import {
  WALLET_SECTIONS,
  type WalletField,
  type WalletSectionKey,
} from '../lib/registration-steps';
import {
  removeRegistrationWalletEntry,
  saveRegistrationWalletEntry,
} from '../lib/registration-wallet';

type SavedEntry = { uuid?: string; title: string; status?: string };
function entries<T>(
  response: { error?: unknown; success?: boolean; data?: T[]; message?: string },
  map: (item: T) => SavedEntry
): SavedEntry[] {
  if (response.error || response.success === false)
    throw new Error(response.message || 'Unable to load wallet entries.');
  return (response.data ?? []).map(map);
}

function WalletFieldInput({
  field,
  value,
  onChange,
}: {
  field: WalletField;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className={field.type === 'textarea' ? 'space-y-2 sm:col-span-2' : 'space-y-2'}>
      <Label htmlFor={id}>
        {field.label}
        {field.required ? ' *' : ''}
      </Label>
      {field.type === 'select' ? (
        <Select value={value} onValueChange={onChange} required={field.required}>
          <SelectTrigger id={id} className='w-full'>
            <SelectValue placeholder='Select' />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map(option => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.type === 'textarea' ? (
        <Textarea
          id={id}
          rows={3}
          value={value}
          placeholder={field.placeholder}
          required={field.required}
          onChange={event => onChange(event.target.value)}
        />
      ) : (
        <Input
          id={id}
          type={field.type === 'date' ? 'date' : field.key === 'link' ? 'url' : 'text'}
          value={value}
          placeholder={field.placeholder}
          required={field.required}
          onChange={event => onChange(event.target.value)}
        />
      )}
    </div>
  );
}

export function RegistrationSkillsWallet({
  active,
  onBack,
  onContinue,
  editing = false,
}: {
  active: boolean;
  editing?: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [tab, setTab] = useState('skills');
  const [drafts, setDrafts] = useState<Partial<Record<WalletSectionKey, Record<string, string>>>>(
    {}
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const queries = [
    useQuery({
      ...listSkillsOptions(),
      enabled: active,
      staleTime: STALE_TIMES.entity,
      select: response =>
        entries(response, item => ({
          uuid: item.uuid,
          title: item.skill_name,
          status: item.verification_status,
        })),
    }),
    useQuery({
      ...listPortfolioOptions(),
      enabled: active && tab === 'portfolio',
      staleTime: STALE_TIMES.entity,
      select: response => entries(response, item => ({ uuid: item.uuid, title: item.title })),
    }),
    useQuery({
      ...listCertificationsOptions(),
      enabled: active && (tab === 'credentials' || tab === 'verification'),
      staleTime: STALE_TIMES.entity,
      select: response =>
        entries(response, item => ({
          uuid: item.uuid,
          title: item.certification_name,
          status: item.verification_status,
        })),
    }),
    useQuery({
      ...listCompetenciesOptions(),
      enabled: active && (tab === 'competencies' || tab === 'verification'),
      staleTime: STALE_TIMES.entity,
      select: response =>
        entries(response, item => ({
          uuid: item.uuid,
          title: item.competency,
          status: item.verification_status,
        })),
    }),
    useQuery({
      ...listExperienceOptions(),
      enabled: active && tab === 'experience',
      staleTime: STALE_TIMES.entity,
      select: response => entries(response, item => ({ uuid: item.uuid, title: item.position })),
    }),
    useQuery({
      ...listAchievementsOptions(),
      enabled: active && tab === 'achievements',
      staleTime: STALE_TIMES.entity,
      select: response => entries(response, item => ({ uuid: item.uuid, title: item.title })),
    }),
  ] as const;
  const skillQuery = queries[0];
  const hasSkill = !skillQuery.isError && (skillQuery.data?.length ?? 0) > 0;
  const hasDrafts = Object.values(drafts).some(Boolean);

  const save = async (event: FormEvent<HTMLFormElement>, section: WalletSectionKey) => {
    event.preventDefault();
    if (pending || !drafts[section]) return;
    const definition = WALLET_SECTIONS.find(item => item.key === section);
    const values = drafts[section];
    if (definition?.fields.some(field => field.required && !values[field.key]?.trim())) {
      setError('Complete the required fields before saving.');
      return;
    }
    if (values.startDate && values.endDate && values.endDate < values.startDate) {
      setError('The end date must be on or after the start date.');
      return;
    }
    setPending(true);
    setError('');
    try {
      await saveRegistrationWalletEntry(section, values);
      setDrafts(current => {
        const next = { ...current };
        delete next[section];
        return next;
      });
      await queryClient.invalidateQueries({ queryKey: walletQueryKey(section) });
    } catch (failure) {
      setError(getErrorMessage(failure, 'Unable to save this entry. Please try again.'));
    } finally {
      setPending(false);
    }
  };

  const remove = async (section: WalletSectionKey, uuid: string) => {
    if (pending) return;
    setPending(true);
    setError('');
    try {
      await removeRegistrationWalletEntry(section, uuid);
      await queryClient.invalidateQueries({ queryKey: walletQueryKey(section) });
    } catch (failure) {
      setError(getErrorMessage(failure, 'Unable to remove this entry. Please try again.'));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className='space-y-4'>
      <Button
        type='button'
        variant='link'
        className='h-auto px-0 py-1 has-[>svg]:px-0'
        disabled={pending}
        onClick={onBack}
      >
        <ArrowLeft className='size-4' aria-hidden='true' />
        {editing ? 'Back to application' : 'Back to interests'}
      </Button>
      <Card className='w-full'>
        <CardHeader>
          <CardTitle>
            <h1>{editing ? 'Edit your skills wallet' : 'Build your skills wallet'}</h1>
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-5'>
          <p className='text-muted-foreground text-sm leading-6'>
            {editing
              ? 'Update your skills, portfolio work, credentials and other evidence below. Save each entry to update your skills wallet.'
              : 'Your skills wallet supports your application review. Save at least one skill before continuing. Add portfolio work, credentials and other evidence to strengthen your application.'}
          </p>
          <Tabs
            value={tab}
            onValueChange={value => {
              setTab(value);
              setError('');
            }}
          >
            <TabsList className='flex h-auto w-full flex-wrap justify-start gap-1'>
              {WALLET_SECTIONS.map((section, index) => (
                <TabsTrigger
                  key={section.key}
                  value={section.key}
                  className='gap-1.5 text-xs'
                  disabled={pending}
                >
                  {section.label}
                  {queries[index]?.data?.length ? (
                    <span className='bg-primary/15 text-primary rounded-full px-1.5 text-xs'>
                      {queries[index]?.data?.length}
                    </span>
                  ) : null}
                </TabsTrigger>
              ))}
              <TabsTrigger value='verification' disabled={pending} className='text-xs'>
                Verification
              </TabsTrigger>
            </TabsList>
            {WALLET_SECTIONS.map((section, index) => {
              const query = queries[index];
              const draft = drafts[section.key];
              return (
                <TabsContent key={section.key} value={section.key} className='mt-5 space-y-4'>
                  <p className='text-muted-foreground text-sm'>{section.summary}</p>
                  {query?.isLoading ? (
                    <Skeleton className='h-24 w-full' />
                  ) : query?.isError ? (
                    <EmptyState
                      title='Unable to load wallet entries'
                      action={
                        <Button variant='outline' onClick={() => void query.refetch()}>
                          Try again
                        </Button>
                      }
                    />
                  ) : (
                    <>
                      {query?.data?.length === 0 && !draft ? (
                        <EmptyState variant='compact' title='Nothing added yet.' />
                      ) : null}
                      {query?.data?.map(item => (
                        <div
                          key={item.uuid}
                          className='border-border flex items-center justify-between gap-3 rounded-md border p-4'
                        >
                          <div>
                            <p className='text-foreground text-sm font-semibold'>{item.title}</p>
                            <p className='text-muted-foreground text-xs'>
                              {item.status || 'Saved to your wallet'}
                            </p>
                          </div>
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            disabled={pending || !item.uuid}
                            aria-label={`Remove ${item.title}`}
                            onClick={() => item.uuid && void remove(section.key, item.uuid)}
                          >
                            <Trash2 className='size-4' />
                          </Button>
                        </div>
                      ))}
                    </>
                  )}
                  {draft ? (
                    <form
                      onSubmit={event => void save(event, section.key)}
                      className='border-border space-y-4 rounded-md border p-4'
                    >
                      <fieldset disabled={pending} className='grid gap-4 sm:grid-cols-2'>
                        <legend className='sr-only'>{section.addLabel}</legend>
                        {section.fields.map(field => (
                          <WalletFieldInput
                            key={field.key}
                            field={field}
                            value={draft[field.key] ?? ''}
                            onChange={value =>
                              setDrafts(current => ({
                                ...current,
                                [section.key]: { ...current[section.key], [field.key]: value },
                              }))
                            }
                          />
                        ))}
                      </fieldset>
                      <div className='flex gap-2'>
                        <Button type='submit' disabled={pending}>
                          {pending ? <Spinner className='size-4' /> : null}Save entry
                        </Button>
                        <Button
                          type='button'
                          variant='outline'
                          disabled={pending}
                          onClick={() =>
                            setDrafts(current => {
                              const next = { ...current };
                              delete next[section.key];
                              return next;
                            })
                          }
                        >
                          Cancel entry
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      disabled={pending || query?.isError || query?.isLoading}
                      onClick={() => setDrafts(current => ({ ...current, [section.key]: {} }))}
                    >
                      <Plus className='size-4' />
                      {section.addLabel}
                    </Button>
                  )}
                </TabsContent>
              );
            })}
            <TabsContent value='verification' className='mt-5 space-y-4'>
              <p className='text-muted-foreground text-sm'>
                Verification is managed by the review team. New skills and credentials remain
                pending until reviewed.
              </p>
              {[queries[0], queries[2], queries[3]].map((query, index) => (
                <div key={['skills', 'credentials', 'competencies'][index]} className='space-y-2'>
                  {query.isLoading ? (
                    <Skeleton className='h-16 w-full' />
                  ) : query.isError ? (
                    <EmptyState
                      title='Unable to load verification'
                      action={
                        <Button variant='outline' onClick={() => void query.refetch()}>
                          Try again
                        </Button>
                      }
                    />
                  ) : (
                    query.data?.map(item => (
                      <div
                        key={item.uuid}
                        className='border-border flex justify-between gap-4 rounded-md border p-3 text-sm'
                      >
                        <span>{item.title}</span>
                        <span className='text-muted-foreground'>{item.status || 'PENDING'}</span>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </TabsContent>
          </Tabs>
          {error ? (
            <p role='alert' className='text-destructive text-sm'>
              {error}
            </p>
          ) : null}
          <p className='text-muted-foreground text-sm' aria-live='polite'>
            {hasDrafts
              ? 'Save or cancel unfinished entries before continuing.'
              : editing
                ? 'Saved entries are available for your application review.'
                : hasSkill
                  ? 'Your skills wallet is ready. Continue to your registration details.'
                  : 'Add and save at least one skill to continue.'}
          </p>
          <div className='flex justify-end gap-3'>
            <Button
              type='button'
              disabled={pending || skillQuery.isFetching || (!editing && !hasSkill) || hasDrafts}
              onClick={onContinue}
            >
              {editing ? 'Return to application' : 'Continue to registration'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function walletQueryKey(section: WalletSectionKey) {
  switch (section) {
    case 'skills':
      return listSkillsOptions().queryKey;
    case 'portfolio':
      return listPortfolioOptions().queryKey;
    case 'credentials':
      return listCertificationsOptions().queryKey;
    case 'competencies':
      return listCompetenciesOptions().queryKey;
    case 'experience':
      return listExperienceOptions().queryKey;
    case 'achievements':
      return listAchievementsOptions().queryKey;
    case 'verification':
      return listSkillsOptions().queryKey;
  }
}
