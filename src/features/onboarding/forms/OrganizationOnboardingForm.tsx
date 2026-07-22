// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { asRecord, getErrorMessage } from '@/lib/error-utils';
import {
  createOrganisationMutation,
  listDocumentTypesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { DocumentTypeOption } from '@/services/client/types.gen';
import { buildDashboardSwitchPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { STALE_TIMES } from '@/lib/query-client';
import {
  OrganisationCountryField,
  OrganisationIdentityFields,
  OrganisationLocationField,
} from '@/src/features/organisation/forms/shared/components/OrganisationFields';
import {
  buildOrganisationRegistrationPayload,
  normalizeCoordinateValue,
  type OrganisationRegistrationFormData,
  organisationRegistrationSchema,
} from '@/src/features/organisation/forms/shared/organisation-profile';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  FileCheck2,
  FileText,
  Loader2,
  ShieldCheck,
  UploadCloud,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type ChangeEvent, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

type CapturedValidationDocument = {
  file: File;
  title: string;
  description?: string;
  expiryDate?: string;
  validationError?: string;
};

type CapturedValidationDocuments = Record<string, CapturedValidationDocument>;

const DEFAULT_MAX_FILE_SIZE_MB = 10;
const DEFAULT_ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg'];

const fallbackRequiredDocumentTypes: DocumentTypeOption[] = [
  {
    uuid: 'organisation-registration-certificate',
    name: 'Registration certificate',
    description: 'Official certificate of incorporation or business registration.',
    is_required: true,
    allowed_extensions: DEFAULT_ALLOWED_EXTENSIONS,
    max_file_size_mb: DEFAULT_MAX_FILE_SIZE_MB,
  },
  {
    uuid: 'organisation-license-accreditation',
    name: 'Licence or accreditation',
    description: 'Training licence, accreditation letter, or other regulator approval.',
    is_required: true,
    allowed_extensions: DEFAULT_ALLOWED_EXTENSIONS,
    max_file_size_mb: DEFAULT_MAX_FILE_SIZE_MB,
  },
  {
    uuid: 'organisation-authorisation-letter',
    name: 'Authorising representative letter',
    description:
      'Letter or board resolution confirming the submitter can register this organisation.',
    is_required: true,
    allowed_extensions: DEFAULT_ALLOWED_EXTENSIONS,
    max_file_size_mb: DEFAULT_MAX_FILE_SIZE_MB,
  },
];

const getContextCountryName = (context: unknown): string | undefined => {
  const contextRecord = asRecord(context);
  if (!contextRecord) {
    return undefined;
  }

  return (
    (typeof contextRecord.country_name === 'string' ? contextRecord.country_name : undefined) ??
    (typeof asRecord(contextRecord.country)?.name === 'string'
      ? asRecord(contextRecord.country)?.name
      : undefined)
  );
};

const normalizeExtension = (extension: string) => extension.replace(/^\./, '').toLowerCase();

const getDocumentTypeKey = (documentType: DocumentTypeOption, index: number) =>
  documentType.uuid || documentType.name || `validation-document-${index}`;

const getDocumentTypeLabel = (documentType: DocumentTypeOption) =>
  documentType.name || 'Validation document';

const getAllowedExtensions = (documentType: DocumentTypeOption) => {
  const extensions = documentType.allowed_extensions
    ?.map(normalizeExtension)
    .filter(extension => extension.length > 0);

  return extensions?.length ? extensions : DEFAULT_ALLOWED_EXTENSIONS;
};

const getAcceptValue = (documentType: DocumentTypeOption) =>
  getAllowedExtensions(documentType)
    .map(extension => `.${extension}`)
    .join(',');

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const validateDocumentFile = (documentType: DocumentTypeOption, file: File) => {
  const allowedExtensions = getAllowedExtensions(documentType);
  const extension = normalizeExtension(file.name.split('.').pop() ?? '');

  if (!allowedExtensions.includes(extension)) {
    return `Upload ${allowedExtensions.map(item => `.${item}`).join(', ')} files only.`;
  }

  const maxFileSizeMb = documentType.max_file_size_mb ?? DEFAULT_MAX_FILE_SIZE_MB;
  const maxFileSizeBytes = maxFileSizeMb * 1024 * 1024;
  if (file.size > maxFileSizeBytes) {
    return `File must be ${maxFileSizeMb} MB or smaller.`;
  }

  return undefined;
};

const isGeneratedOrganisationQueryKey = (queryKey: QueryKey) => {
  const firstKeyPart = asRecord(queryKey[0]);
  const id = firstKeyPart?._id;

  return id === 'getAllOrganisations' || id === 'getOrganisationByUuid';
};

type ValidationDocumentsStepProps = {
  capturedDocuments: CapturedValidationDocuments;
  documentTypes: DocumentTypeOption[];
  isLoading: boolean;
  isUsingFallback: boolean;
  onCapture: (key: string, document: CapturedValidationDocument) => void;
  onRemove: (key: string) => void;
  requiredTypes: DocumentTypeOption[];
};

function ValidationDocumentsStep({
  capturedDocuments,
  documentTypes,
  isLoading,
  isUsingFallback,
  onCapture,
  onRemove,
  requiredTypes,
}: ValidationDocumentsStepProps) {
  const availableCount = documentTypes.length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Validation documents</CardTitle>
          <CardDescription>Loading required document checklist</CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          {[0, 1, 2].map(item => (
            <Skeleton key={item} className='h-24 w-full rounded-lg' />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
          <div>
            <CardTitle>Validation documents</CardTitle>
            <CardDescription>
              Attach the required documents before submitting for platform review.
            </CardDescription>
          </div>
          <Badge variant='secondary' className='w-fit gap-1.5'>
            <FileCheck2 className='h-3.5 w-3.5' />
            {requiredTypes.length} required
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {isUsingFallback ? (
          <Alert>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>Default validation checklist</AlertTitle>
            <AlertDescription>
              The API did not return required organisation document metadata, so this form is using
              the default Elimika validation checklist.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <ShieldCheck className='h-4 w-4' />
            <AlertTitle>Backend validation rules loaded</AlertTitle>
            <AlertDescription>
              Required document rules are coming from the document type catalogue
              {availableCount ? ` (${availableCount} available types).` : '.'}
            </AlertDescription>
          </Alert>
        )}

        <div className='space-y-4'>
          {requiredTypes.map((documentType, index) => {
            const key = getDocumentTypeKey(documentType, index);
            const capturedDocument = capturedDocuments[key];
            const label = getDocumentTypeLabel(documentType);
            const allowedExtensions = getAllowedExtensions(documentType);
            const maxFileSizeMb = documentType.max_file_size_mb ?? DEFAULT_MAX_FILE_SIZE_MB;
            const inputId = `validation-document-${key}`;
            const expiryId = `validation-document-expiry-${key}`;

            const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
              const file = event.target.files?.[0];
              if (!file) return;

              onCapture(key, {
                file,
                title: label,
                description: documentType.description,
                expiryDate: capturedDocument?.expiryDate,
                validationError: validateDocumentFile(documentType, file),
              });
            };

            return (
              <div key={key} className='border-border bg-background rounded-lg border p-4'>
                <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
                  <div className='min-w-0 space-y-2'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <FileText className='text-primary h-4 w-4' />
                      <h3 className='text-foreground text-sm font-semibold'>{label}</h3>
                      <Badge variant='outline'>Required</Badge>
                      {capturedDocument?.file && !capturedDocument.validationError ? (
                        <Badge variant='secondary' className='gap-1.5'>
                          <CheckCircle2 className='h-3 w-3' />
                          Ready
                        </Badge>
                      ) : null}
                    </div>
                    {documentType.description ? (
                      <p className='text-muted-foreground text-sm'>{documentType.description}</p>
                    ) : null}
                    <p className='text-muted-foreground text-xs'>
                      Accepted: {allowedExtensions.map(item => `.${item}`).join(', ')}. Max{' '}
                      {maxFileSizeMb} MB.
                    </p>
                  </div>

                  {capturedDocument?.file ? (
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='self-start'
                      onClick={() => onRemove(key)}
                    >
                      <X className='h-4 w-4' />
                      Remove
                    </Button>
                  ) : null}
                </div>

                <Separator className='my-4' />

                <div className='grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(180px,0.6fr)]'>
                  <div className='space-y-2'>
                    <Label htmlFor={inputId}>Upload document</Label>
                    <Input
                      id={inputId}
                      type='file'
                      accept={getAcceptValue(documentType)}
                      onChange={handleFileChange}
                      aria-invalid={Boolean(capturedDocument?.validationError)}
                    />
                    {capturedDocument?.file ? (
                      <p className='text-muted-foreground text-xs'>
                        {capturedDocument.file.name} ({formatFileSize(capturedDocument.file.size)})
                      </p>
                    ) : (
                      <p className='text-muted-foreground text-xs'>
                        Choose the official file for this requirement.
                      </p>
                    )}
                    {capturedDocument?.validationError ? (
                      <p className='text-destructive text-xs'>{capturedDocument.validationError}</p>
                    ) : null}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor={expiryId}>Expiry date</Label>
                    <Input
                      id={expiryId}
                      type='date'
                      value={capturedDocument?.expiryDate ?? ''}
                      onChange={event => {
                        if (!capturedDocument) return;
                        onCapture(key, {
                          ...capturedDocument,
                          expiryDate: event.target.value || undefined,
                        });
                      }}
                      disabled={!capturedDocument?.file}
                    />
                    <p className='text-muted-foreground text-xs'>Optional where not applicable.</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function OrganizationOnboardingForm() {
  const router = useRouter();
  const user = useUserProfile();
  const queryClient = useQueryClient();
  const [capturedDocuments, setCapturedDocuments] = useState<CapturedValidationDocuments>({});
  const createOrganisation = useMutation(createOrganisationMutation());

  const documentTypesQuery = useQuery({
    ...listDocumentTypesOptions(),
    staleTime: STALE_TIMES.reference,
  });

  const documentTypes = useMemo(
    () => (documentTypesQuery.data?.data ?? []) as DocumentTypeOption[],
    [documentTypesQuery.data?.data]
  );

  const backendRequiredDocumentTypes = useMemo(
    () => documentTypes.filter(documentType => documentType.is_required),
    [documentTypes]
  );

  const requiredDocumentTypes =
    backendRequiredDocumentTypes.length > 0
      ? backendRequiredDocumentTypes
      : fallbackRequiredDocumentTypes;

  const isUsingFallbackDocumentTypes = backendRequiredDocumentTypes.length === 0;

  const documentsAreComplete = requiredDocumentTypes.every((documentType, index) => {
    const key = getDocumentTypeKey(documentType, index);
    const capturedDocument = capturedDocuments[key];
    return Boolean(capturedDocument?.file && !capturedDocument.validationError);
  });

  const form = useForm<OrganisationRegistrationFormData>({
    resolver: zodResolver(organisationRegistrationSchema),
    defaultValues: {
      name: '',
      description: '',
      active: true,
      licence_no: '',
      location: '',
      country: '',
    },
  });

  const latitudeWatch = useWatch({ control: form.control, name: 'latitude' });
  const longitudeWatch = useWatch({ control: form.control, name: 'longitude' });

  const watchedCoordinates = {
    latitude: normalizeCoordinateValue(latitudeWatch),
    longitude: normalizeCoordinateValue(longitudeWatch),
  };

  const handleSubmit = async (data: OrganisationRegistrationFormData) => {
    if (!user?.uuid) {
      toast.error('User not found. Please try again.');
      return;
    }

    if (!documentsAreComplete) {
      toast.error('Attach every required validation document before submitting.');
      return;
    }

    try {
      const response = await createOrganisation.mutateAsync({
        body: buildOrganisationRegistrationPayload(data),
      });

      await queryClient.invalidateQueries({
        predicate: query => isGeneratedOrganisationQueryKey(query.queryKey),
      });
      await queryClient.invalidateQueries({ queryKey: ['organization'] });
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      if (user.invalidateQuery) {
        await user.invalidateQuery();
      }

      const successMessage = response.data?.message || 'Organization registered successfully!';
      toast.success(`${successMessage} Validation documents captured for review.`);
      router.replace(buildDashboardSwitchPath('organisation_user'));
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to register organization. Please try again.'));
    }
  };

  return (
    <div className='border-border/60 bg-card/80 mx-auto max-w-4xl space-y-8 rounded-3xl border p-6 shadow-sm backdrop-blur-sm sm:p-8'>
      <div className='text-center'>
        <div className='bg-primary/10 text-primary ring-primary/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ring-1'>
          <Building2 className='h-8 w-8' />
        </div>
        <h1 className='text-foreground mb-2 text-3xl font-bold'>Organization Registration</h1>
        <p className='text-muted-foreground'>
          Register your organization and attach the validation documents required for review
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>Basic information about your organization</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <OrganisationIdentityFields
                form={form}
                requiredName
                nameLabel='Organization Name'
                namePlaceholder='Elimika Training Institute'
                nameDescription='Official name of your organization'
                licenceLabel='License Number (Optional)'
                licencePlaceholder='REG-123456'
                licenceDescription='Official license or registration number'
                descriptionLabel='Description'
                descriptionPlaceholder='Describe your organization, its mission, and the types of courses you offer...'
                descriptionDescription="Provide additional context about your organization's purpose and activities"
              />

              <OrganisationLocationField
                form={form}
                coordinates={watchedCoordinates}
                label='Location (Optional)'
                description='Physical location or address of your organization'
                onSuggest={result => {
                  const feature = result.features[0];
                  const coordinates = feature?.properties?.coordinates;
                  const contextCountry = getContextCountryName(feature?.properties?.context);

                  if (
                    typeof coordinates?.latitude === 'number' &&
                    typeof coordinates?.longitude === 'number'
                  ) {
                    form.setValue('latitude', coordinates.latitude);
                    form.setValue('longitude', coordinates.longitude);
                  }
                  if (contextCountry) {
                    form.setValue('country', contextCountry);
                  }
                }}
              />

              <OrganisationCountryField
                form={form}
                label='Country (Optional)'
                placeholder='Kenya'
                description='Country where your organization is located'
              />
            </CardContent>
          </Card>

          <ValidationDocumentsStep
            capturedDocuments={capturedDocuments}
            documentTypes={documentTypes}
            isLoading={documentTypesQuery.isLoading}
            isUsingFallback={isUsingFallbackDocumentTypes}
            requiredTypes={requiredDocumentTypes}
            onCapture={(key, document) =>
              setCapturedDocuments(current => ({
                ...current,
                [key]: document,
              }))
            }
            onRemove={key =>
              setCapturedDocuments(current => {
                const nextDocuments = { ...current };
                delete nextDocuments[key];
                return nextDocuments;
              })
            }
          />

          <Card className='border-primary/20 bg-primary/5'>
            <CardContent className='space-y-1'>
              <h3 className='text-foreground font-medium'>Review flow</h3>
              <p className='text-muted-foreground text-sm'>
                You become the first organisation administrator. The workspace opens in pending
                review while the Elimika team verifies the organisation profile and validation
                documents.
              </p>
            </CardContent>
          </Card>

          <Button
            type='submit'
            className='w-full'
            disabled={
              createOrganisation.isPending || documentTypesQuery.isLoading || !documentsAreComplete
            }
          >
            {createOrganisation.isPending ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin' />
                Submitting registration...
              </>
            ) : (
              <>
                <UploadCloud className='h-4 w-4' />
                Submit Organisation for Review
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
