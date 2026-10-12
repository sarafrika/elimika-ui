'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, FileText, Upload } from 'lucide-react';
import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import LocationInput from '@/components/locationInput';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { getErrorMessage } from '@/lib/error-utils';
import { STALE_TIMES } from '@/lib/query-client';
import type { DocumentTypeOption, Onboarding, Organisation } from '@/services/client';
import {
  createOrganisationMutation,
  getCurrentUserOptions,
  getCurrentUserQueryKey,
  getOrganisationByUuidOptions,
  listDocumentTypesOptions,
  updateOrganisationMutation,
  uploadOrganisationDocumentMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { isDomainOnboardingKey, onboardingStep } from '../hooks/useDomainOnboarding';
import { requireApiData } from '../lib/user-onboarding';
import { FieldError, FormError, SavedBadge, StepBody, StepFooter } from './OnboardingFrame';

type Props = { onboarding: Onboarding | undefined; onBack: () => void; onDone: () => void };

type Details = {
  name: string;
  country: string;
  location: string;
  latitude?: number;
  longitude?: number;
};

function contextCountry(context: unknown) {
  if (typeof context !== 'object' || context === null) return undefined;
  const record = context as Record<string, unknown>;
  if (typeof record.country_name === 'string') return record.country_name;
  const country = record.country;
  if (typeof country === 'object' && country !== null && 'name' in country)
    return typeof country.name === 'string' ? country.name : undefined;
  return undefined;
}

export function OrganisationDetails({ onboarding, onBack, onDone }: Props) {
  const queryClient = useQueryClient();
  const user = useQuery({
    ...getCurrentUserOptions(),
    select: response => requireApiData(response),
    staleTime: STALE_TIMES.entity,
  });
  const [createdUuid, setCreatedUuid] = useState('');
  const orgUuid =
    createdUuid ||
    user.data?.organisation_affiliations?.find(item => item.domain_in_organisation === 'admin')
      ?.organisation_uuid ||
    '';
  const organisation = useQuery({
    ...getOrganisationByUuidOptions({ path: { uuid: orgUuid } }),
    select: response => requireApiData(response),
    enabled: Boolean(orgUuid),
    staleTime: STALE_TIMES.entity,
  });
  const [details, setDetails] = useState<Details>({ name: '', country: '', location: '' });
  const [seeded, setSeeded] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const create = useMutation(createOrganisationMutation());
  const update = useMutation(updateOrganisationMutation());
  const pending = create.isPending || update.isPending;

  useEffect(() => {
    if (seeded || !organisation.isSuccess) return;
    const org = organisation.data;
    setDetails({
      name: org.name ?? '',
      country: org.country ?? '',
      location: org.location ?? '',
      latitude: org.latitude ?? undefined,
      longitude: org.longitude ?? undefined,
    });
    setSeeded(true);
  }, [seeded, organisation.isSuccess, organisation.data]);

  const detailsDone = Boolean(onboardingStep(onboarding, 'organisation')?.complete);
  const documentsStep = onboardingStep(onboarding, 'organisation_documents');
  const refreshProgress = () =>
    queryClient.invalidateQueries({ predicate: query => isDomainOnboardingKey(query.queryKey) });

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!details.name.trim()) next.name = 'Enter the organisation name.';
    if (!details.country.trim() && !details.location.trim())
      next.location = 'Add the location of your main campus.';
    setErrors(next);
    if (pending || Object.keys(next).length) return;
    setFormError('');
    try {
      const body: Organisation = {
        ...(organisation.data ?? {}),
        name: details.name.trim(),
        active: organisation.data?.active ?? true,
        country: details.country.trim() || null,
        location: details.location.trim() || null,
        latitude: details.latitude ?? null,
        longitude: details.longitude ?? null,
      };
      if (orgUuid) {
        requireApiData(await update.mutateAsync({ path: { uuid: orgUuid }, body }));
      } else {
        const created = requireApiData(await create.mutateAsync({ body }));
        if (created.uuid) setCreatedUuid(created.uuid);
        await queryClient.invalidateQueries({ queryKey: getCurrentUserQueryKey() });
      }
      await refreshProgress();
      toast.success('Organisation saved. Now upload its documents.');
    } catch (cause) {
      setFormError(getErrorMessage(cause, 'Unable to save the organisation. Please try again.'));
    }
  };

  const documentsDone = Boolean(documentsStep?.complete);

  return (
    <div>
      <form onSubmit={event => void handleSave(event)} noValidate>
        <StepBody>
          {user.isPending || (orgUuid && organisation.isPending) ? (
            <Skeleton className='h-48 w-full' />
          ) : user.isError || organisation.isError ? (
            <EmptyState
              title='Unable to load your organisation'
              description='Please try again in a moment.'
              action={
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => void Promise.all([user.refetch(), organisation.refetch()])}
                >
                  Try again
                </Button>
              }
            />
          ) : (
            <fieldset disabled={pending} className='space-y-4'>
              <SavedBadge show={detailsDone} />
              <div className='space-y-1.5'>
                <Label htmlFor='org-name'>Organisation name</Label>
                <Input
                  id='org-name'
                  value={details.name}
                  onChange={event =>
                    setDetails(current => ({ ...current, name: event.target.value }))
                  }
                  aria-invalid={Boolean(errors.name)}
                />
                <FieldError id='org-name' message={errors.name} />
              </div>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-1.5'>
                  <Label htmlFor='org-location'>Main campus location</Label>
                  <LocationInput
                    id='org-location'
                    value={details.location}
                    onChange={value => setDetails(current => ({ ...current, location: value }))}
                    coordinates={{ latitude: details.latitude, longitude: details.longitude }}
                    onSuggest={result => {
                      const feature = result.features[0];
                      const coords = feature?.properties?.coordinates;
                      const country = contextCountry(feature?.properties?.context);
                      setDetails(current => ({
                        ...current,
                        ...(typeof coords?.latitude === 'number' &&
                        typeof coords.longitude === 'number'
                          ? { latitude: coords.latitude, longitude: coords.longitude }
                          : {}),
                        ...(country ? { country } : {}),
                      }));
                    }}
                  />
                  <FieldError id='org-location' message={errors.location} />
                </div>
                <div className='space-y-1.5'>
                  <Label htmlFor='org-country'>Country</Label>
                  <Input
                    id='org-country'
                    value={details.country}
                    onChange={event =>
                      setDetails(current => ({ ...current, country: event.target.value }))
                    }
                  />
                  <p className='text-muted-foreground text-xs'>
                    Filled in from the location you pick.
                  </p>
                </div>
              </div>
              <div className='flex justify-end'>
                <Button type='submit' variant={detailsDone ? 'outline' : 'default'}>
                  {pending && <Spinner />}
                  {orgUuid ? 'Save changes' : 'Save organisation'}
                </Button>
              </div>
            </fieldset>
          )}
        </StepBody>
        <FormError message={formError} />
      </form>
      <div className='border-border border-t'>
        <StepBody>
          <DocumentChecklist
            organisationUuid={orgUuid}
            missing={documentsStep?.missing ?? []}
            onUploaded={() => void refreshProgress()}
          />
        </StepBody>
      </div>
      <StepFooter
        onBack={onBack}
        primaryLabel='Save and continue'
        onPrimary={onDone}
        primaryDisabled={!detailsDone || !documentsDone}
      />
    </div>
  );
}

function DocumentChecklist({
  organisationUuid,
  missing,
  onUploaded,
}: {
  organisationUuid: string;
  missing: string[];
  onUploaded: () => void;
}) {
  const types = useQuery({
    ...listDocumentTypesOptions({ query: { applies_to: 'ORGANISATION' } }),
    select: response => requireApiData(response),
    enabled: Boolean(organisationUuid),
    staleTime: STALE_TIMES.reference,
  });
  const required = (types.data ?? []).filter(type => type.is_required);
  const uploaded = required.filter(type => !missing.includes(type.name ?? '')).length;

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap items-baseline justify-between gap-2'>
        <p className='text-foreground text-[15px] font-semibold'>Registration documents</p>
        {organisationUuid && types.isSuccess && (
          <span className='text-muted-foreground text-xs'>
            {uploaded} of {required.length} uploaded · PDF or image
          </span>
        )}
      </div>
      {!organisationUuid ? (
        <p className='text-muted-foreground text-sm'>
          Save the organisation first, then upload its documents here.
        </p>
      ) : types.isPending ? (
        <Skeleton className='h-24 w-full' />
      ) : types.isError ? (
        <EmptyState
          title='Unable to load the document checklist'
          description={getErrorMessage(types.error, 'Please try again.')}
          action={
            <Button type='button' variant='outline' onClick={() => void types.refetch()}>
              Try again
            </Button>
          }
        />
      ) : (
        <ul className='divide-border divide-y'>
          {required.map(type => (
            <DocumentRow
              key={type.uuid}
              type={type}
              organisationUuid={organisationUuid}
              done={!missing.includes(type.name ?? '')}
              onUploaded={onUploaded}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function DocumentRow({
  type,
  organisationUuid,
  done,
  onUploaded,
}: {
  type: DocumentTypeOption;
  organisationUuid: string;
  done: boolean;
  onUploaded: () => void;
}) {
  const upload = useMutation(uploadOrganisationDocumentMutation());
  const label = type.description || type.name || 'Document';
  const accept = (type.allowed_extensions ?? ['pdf', 'png', 'jpg', 'jpeg'])
    .map(extension => `.${extension.replace(/^\./, '')}`)
    .join(',');
  const maxMb = type.max_file_size_mb ?? 10;

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !type.uuid) return;
    if (file.size > maxMb * 1024 * 1024) {
      toast.error(`${label} must be ${maxMb} MB or smaller.`);
      return;
    }
    try {
      requireApiData(
        await upload.mutateAsync({
          body: { file },
          path: { uuid: organisationUuid },
          query: { document_type_uuid: type.uuid, title: label },
        })
      );
      toast.success(`${label} uploaded.`);
      onUploaded();
    } catch (cause) {
      toast.error(getErrorMessage(cause, `Unable to upload ${label}. Please try again.`));
    }
  };

  const inputId = `doc-${type.uuid}`;
  return (
    <li className='flex flex-wrap items-center gap-3 py-3'>
      <span className='border-border bg-muted/40 text-muted-foreground grid size-9 place-items-center rounded-lg border'>
        <FileText className='size-4' />
      </span>
      <div className='min-w-0 flex-1'>
        <p className='text-foreground text-sm font-semibold'>{label}</p>
        <p className='text-muted-foreground text-xs'>
          {done ? 'Uploaded' : `Required · up to ${maxMb} MB`}
        </p>
      </div>
      {done ? (
        <span className='bg-success/10 text-success inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-semibold'>
          <CheckCircle2 className='size-3.5' />
          Uploaded
        </span>
      ) : (
        <Button asChild variant='outline' size='sm' disabled={upload.isPending}>
          <label htmlFor={inputId} className='cursor-pointer'>
            {upload.isPending ? <Spinner /> : <Upload className='size-4' />}
            Upload
            <input
              id={inputId}
              type='file'
              accept={accept}
              className='sr-only'
              onChange={event => void handleFile(event)}
            />
          </label>
        </Button>
      )}
    </li>
  );
}
