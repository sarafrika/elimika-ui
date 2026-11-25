// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import { WatchedText } from '@/components/form/watched-value';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { localDate } from '@/lib/date';
import { asRecord, getErrorMessage } from '@/lib/error-utils';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import {
  createOrganisationMutation,
  getCurrentAccountStatusQueryKey,
  getDomainOnboardingQueryKey,
  getOrganisationDocumentsOptions,
  getOrganisationDocumentsQueryKey,
  listDocumentTypesOptions,
  requestOrganisationVerificationMutation,
  updateOrganisationMutation,
  uploadOrganisationDocumentMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { DocumentTypeOption } from '@/services/client/types.gen';
import { useRefreshSessionIdentity } from '@/src/features/auth/use-refresh-session-identity';
import { ApplicationSubmissionDate } from '@/src/features/onboarding/components/ApplicationSubmissionDate';
import { useApplicationDraft } from '@/src/features/onboarding/hooks/use-application-draft';
import { acceptedProfileUuid } from '@/src/features/onboarding/lib/application-draft';
import { awaitingApprovalPath } from '@/src/features/onboarding/lib/application-review';
import {
  ORGANISATION_CAPABILITIES,
  ORGANISATION_CATEGORIES,
} from '@/src/features/onboarding/lib/organisation-onboarding';
import { requireApiData, requireApiSuccess } from '@/src/features/onboarding/lib/user-onboarding';
import {
  OrganisationCountryField,
  OrganisationLocationField,
} from '@/src/features/organisation/forms/shared/components/OrganisationFields';
import {
  buildOrganisationRegistrationPayload,
  normalizeCoordinateValue,
  type OrganisationRegistrationFormData,
  organisationRegistrationSchema,
} from '@/src/features/organisation/forms/shared/organisation-profile';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { UserInfoCard } from '@/src/features/profile/forms/shared/components/UserInfoCard';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  type QueryKey,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  FileCheck2,
  FileText,
  Paperclip,
  UploadCloud,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ChangeEvent, type DragEvent, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

type ReviewDocumentType = DocumentTypeOption & {
  reviewKey?: string;
  matchTitle?: boolean;
};

const PAYOUT_DOCUMENT_KEY = 'organisation-payout-details';
const PAYOUT_DOCUMENT_TITLE = 'Payout details';

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

const getDocumentTypeKey = (documentType: ReviewDocumentType, index: number) =>
  documentType.reviewKey ||
  documentType.uuid ||
  documentType.name ||
  documentType.description ||
  `validation-document-${index}`;

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

type ValidationDocumentRowProps = {
  capturedDocument?: CapturedValidationDocument;
  documentKey: string;
  documentType: DocumentTypeOption;
  onCapture: (key: string, document: CapturedValidationDocument) => void;
  onRemove: (key: string) => void;
};

/** The file input is uncontrolled, so anything that clears the captured document must
 *  also blank `fileInputRef` — otherwise the field keeps showing a removed filename and
 *  re-picking that same file fires no change event, stranding the user. */
function ValidationDocumentRow({
  capturedDocument,
  documentKey,
  documentType,
  onCapture,
  onRemove,
}: ValidationDocumentRowProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const label = getDocumentTypeLabel(documentType);
  const allowedExtensions = getAllowedExtensions(documentType);
  const maxFileSizeMb = documentType.max_file_size_mb ?? DEFAULT_MAX_FILE_SIZE_MB;
  const inputId = `validation-document-${documentKey}`;
  const expiryId = `validation-document-expiry-${documentKey}`;
  const acceptedCopy = `Accepted: ${allowedExtensions.map(item => `.${item}`).join(', ')}. Max ${maxFileSizeMb} MB.`;
  const hasValidationError = Boolean(capturedDocument?.validationError);

  const captureFile = (file: File | null | undefined) => {
    if (!file) return;

    onCapture(documentKey, {
      file,
      title: label,
      description: documentType.description,
      expiryDate: capturedDocument?.expiryDate,
      validationError: validateDocumentFile(documentType, file),
    });
  };

  const clearFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /** Blanking before the picker opens keeps every selection a value change, so
   *  re-picking the file already attached still fires `change` and re-validates. */
  const openFilePicker = () => {
    clearFileInput();
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    clearFileInput();
    onRemove(documentKey);
  };

  const dragHandlers = {
    onDragOver: (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(true);
    },
    onDragLeave: () => setIsDragging(false),
    onDrop: (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      captureFile(event.dataTransfer.files?.[0]);
    },
  };

  return (
    <div className='border-border bg-background rounded-lg border p-4'>
      <div className='min-w-0 space-y-2'>
        <div className='flex flex-wrap items-center gap-2'>
          <FileText className='text-primary h-4 w-4' />
          <h3 className='text-foreground text-sm font-semibold'>{label}</h3>
          <Badge variant='outline'>
            {documentType.is_required ? 'Required' : 'Supporting evidence'}
          </Badge>
          {capturedDocument?.file && !hasValidationError ? (
            <Badge variant='secondary' className='gap-1.5'>
              <CheckCircle2 className='h-3 w-3' />
              Ready
            </Badge>
          ) : null}
        </div>
        {documentType.description ? (
          <p className='text-muted-foreground text-sm'>{documentType.description}</p>
        ) : null}
      </div>

      <Separator className='my-4' />

      <div className='grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(180px,0.6fr)]'>
        <div className='space-y-2'>
          <Label htmlFor={inputId}>
            Attach document
            {documentType.is_required ? <span className='text-destructive'> *</span> : null}
          </Label>

          <Input
            ref={fileInputRef}
            id={inputId}
            type='file'
            className='hidden'
            accept={getAcceptValue(documentType)}
            aria-invalid={hasValidationError}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              captureFile(event.target.files?.[0])
            }
          />

          {capturedDocument?.file ? (
            <div
              {...dragHandlers}
              className={cn(
                'flex flex-wrap items-center gap-3 rounded-lg border p-3',
                hasValidationError ? 'border-destructive' : 'border-border',
                isDragging ? 'border-primary bg-primary/5' : 'bg-muted/40'
              )}
            >
              <Paperclip className='text-primary h-4 w-4 shrink-0' />
              <div className='min-w-0 flex-1'>
                <p className='text-foreground truncate text-sm font-medium'>
                  {capturedDocument.file.name}
                </p>
                <p className='text-muted-foreground text-xs'>
                  {formatFileSize(capturedDocument.file.size)}
                </p>
              </div>
              <Button type='button' variant='outline' size='sm' onClick={openFilePicker}>
                Replace
              </Button>
              <Button type='button' variant='ghost' size='sm' onClick={handleRemove}>
                <X className='h-4 w-4' />
                Remove
              </Button>
            </div>
          ) : (
            <div
              role='button'
              tabIndex={0}
              aria-describedby={`${inputId}-hint`}
              onClick={openFilePicker}
              onKeyDown={event => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                openFilePicker();
              }}
              {...dragHandlers}
              className={cn(
                'focus-visible:ring-ring/50 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors outline-none focus-visible:ring-[3px]',
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-muted/40 hover:bg-muted'
              )}
            >
              <UploadCloud className='text-primary h-6 w-6' />
              <p className='text-foreground text-sm font-medium'>Choose a file</p>
              <p className='text-muted-foreground text-xs'>
                Drag and drop here, or click to browse.
              </p>
            </div>
          )}

          <p id={`${inputId}-hint`} className='text-muted-foreground text-xs'>
            {acceptedCopy}
          </p>

          {capturedDocument?.validationError ? (
            <p className='text-destructive text-xs'>{capturedDocument.validationError}</p>
          ) : null}
        </div>

        <div className='space-y-2'>
          {documentType.requires_expiry ? (
            <>
              <Label htmlFor={expiryId}>Expiry date</Label>
              <Input
                id={expiryId}
                type='date'
                min={String(localDate(new Date()))}
                value={capturedDocument?.expiryDate ?? ''}
                onChange={event => {
                  if (!capturedDocument) return;
                  onCapture(documentKey, {
                    ...capturedDocument,
                    expiryDate: event.target.value || undefined,
                  });
                }}
                disabled={!capturedDocument?.file}
              />
              <p className='text-muted-foreground text-xs'>
                Required: select an expiry date today or later.
              </p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

type ValidationDocumentsStepProps = {
  capturedDocuments: CapturedValidationDocuments;
  isLoading: boolean;
  documentTypesQueryError: boolean;
  onRetryDocumentTypes: () => void;
  onCapture: (key: string, document: CapturedValidationDocument) => void;
  onRemove: (key: string) => void;
  requiredTypes: DocumentTypeOption[];
};

function ValidationDocumentsStep({
  capturedDocuments,
  isLoading,
  documentTypesQueryError,
  onRetryDocumentTypes,
  onCapture,
  onRemove,
  requiredTypes,
}: ValidationDocumentsStepProps) {
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
            <CardTitle>Verification checklist</CardTitle>
            <CardDescription>
              Attach the required documents before submitting for platform review.
            </CardDescription>
          </div>
          <Badge variant='secondary' className='w-fit gap-1.5'>
            <FileCheck2 className='h-3.5 w-3.5' />
            {requiredTypes.filter(type => type.is_required).length} required
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {documentTypesQueryError ? (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>Could not load the document checklist</AlertTitle>
            <AlertDescription className='flex flex-col items-start gap-2'>
              <span>
                We could not reach the document catalogue, so we cannot tell you what to attach.
                Everything else on this form still works.
              </span>
              <Button type='button' variant='outline' size='sm' onClick={onRetryDocumentTypes}>
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {!documentTypesQueryError && requiredTypes.length === 0 ? (
          <p className='text-muted-foreground text-sm'>
            There are no outstanding documents in this checklist.
          </p>
        ) : null}
        <div className='space-y-4'>
          {requiredTypes.map((documentType, index) => {
            const key = getDocumentTypeKey(documentType, index);

            return (
              <ValidationDocumentRow
                key={key}
                capturedDocument={capturedDocuments[key]}
                documentKey={key}
                documentType={documentType}
                onCapture={onCapture}
                onRemove={onRemove}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function OrganizationOnboardingForm({ initialStep = 1 }: { initialStep?: 1 | 2 | 3 }) {
  const router = useRouter();
  const refreshSessionIdentity = useRefreshSessionIdentity();
  const user = useUserProfile();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(initialStep);
  const [capturedDocuments, setCapturedDocuments] = useState<CapturedValidationDocuments>({});
  const requestVerification = useMutation(requestOrganisationVerificationMutation());
  const createOrganisation = useMutation(createOrganisationMutation());
  const updateOrganisation = useMutation(updateOrganisationMutation());
  const uploadOrganisationDocument = useMutation(uploadOrganisationDocumentMutation());

  const documentTypesQuery = useQuery({
    ...listDocumentTypesOptions({ query: { applies_to: 'ORGANISATION' } }),
    staleTime: STALE_TIMES.reference,
    select: response => requireApiData(response),
  });

  const documentTypes = useMemo(() => documentTypesQuery.data ?? [], [documentTypesQuery.data]);

  const form = useForm<OrganisationRegistrationFormData>({
    resolver: zodResolver(organisationRegistrationSchema),
    defaultValues: {
      name: '',
      category: '',
      capabilities: [],
      is_representative: false,
      description: '',
      active: true,
      licence_no: '',
      location: '',
      country: '',
    },
  });

  const capabilities = useWatch({ control: form.control, name: 'capabilities' }) ?? [];
  const needsPayout = capabilities.includes('train') || capabilities.includes('fund');
  const payoutDocumentType = useMemo<ReviewDocumentType>(() => {
    const payoutType = documentTypes.find(type =>
      /bank|payout|paybill|m[- ]?pesa/i.test(`${type.name ?? ''} ${type.description ?? ''}`)
    );
    const supportingType = documentTypes.find(type =>
      /other|supporting|additional/i.test(type.name ?? '')
    );
    return {
      ...(payoutType ?? supportingType),
      reviewKey: PAYOUT_DOCUMENT_KEY,
      matchTitle: !payoutType,
      name: PAYOUT_DOCUMENT_TITLE,
      description: 'Bank or M-Pesa paybill in the organisation’s name.',
      is_required: Boolean(needsPayout || payoutType?.is_required),
    };
  }, [documentTypes, needsPayout]);
  const reviewDocumentTypes = useMemo<ReviewDocumentType[]>(
    () => [
      ...documentTypes
        .filter(type => !(type.uuid === payoutDocumentType.uuid && !payoutDocumentType.matchTitle))
        .map(documentType => {
          const name = `${documentType.name ?? ''} ${documentType.description ?? ''}`.toLowerCase();
          const registrationOrRepresentative =
            /incorporation|registration|representative|authority|board resolution|identity/.test(
              name
            );
          return {
            ...documentType,
            is_required: Boolean(documentType.is_required || registrationOrRepresentative),
          };
        }),
      payoutDocumentType,
    ],
    [documentTypes, payoutDocumentType]
  );
  const requiredDocumentTypes = useMemo(
    () => reviewDocumentTypes.filter(documentType => documentType.is_required),
    [reviewDocumentTypes]
  );

  const application = useApplicationDraft({
    userUuid: user?.uuid,
    role: 'organisation',
    form,
    schema: organisationRegistrationSchema,
  });
  const [savedDocuments] = useQueries({
    queries: application.profileUuid
      ? [
        {
          ...getOrganisationDocumentsOptions({ path: { uuid: application.profileUuid } }),
          enabled: !!user?.uuid,
          staleTime: STALE_TIMES.entity,
          select: response => requireApiData(response),
          retry: false,
        },
      ]
      : [],
  });
  const validSavedDocuments = useMemo(
    () =>
      (savedDocuments?.data ?? []).filter(
        document =>
          document.status !== 'Rejected' &&
          document.status !== 'Expired' &&
          (!document.expiry_date ||
            String(localDate(document.expiry_date)) >= String(localDate(new Date())))
      ),
    [savedDocuments?.data]
  );
  const uploadedTypeIds = useMemo(
    () => new Set(validSavedDocuments.map(document => document.document_type_uuid).filter(Boolean)),
    [validSavedDocuments]
  );
  const isDocumentUploaded = (documentType: ReviewDocumentType) =>
    documentType.matchTitle
      ? validSavedDocuments.some(
        document =>
          document.document_type_uuid === documentType.uuid &&
          document.title === documentType.name
      )
      : uploadedTypeIds.has(documentType.uuid);
  const capturedDocumentReady = (documentType: ReviewDocumentType, index: number) => {
    const document = capturedDocuments[getDocumentTypeKey(documentType, index)];
    return Boolean(
      documentType.uuid &&
      document?.file &&
      !document.validationError &&
      (!documentType.requires_expiry ||
        (document.expiryDate && document.expiryDate >= String(localDate(new Date()))))
    );
  };
  const invalidCapturedDocuments = reviewDocumentTypes.some(
    (documentType, index) =>
      capturedDocuments[getDocumentTypeKey(documentType, index)] &&
      !capturedDocumentReady(documentType, index)
  );
  const documentsAreComplete =
    !invalidCapturedDocuments &&
    requiredDocumentTypes.every(
      (documentType, index) =>
        capturedDocumentReady(documentType, index) || isDocumentUploaded(documentType)
    );

  const latitudeWatch = useWatch({ control: form.control, name: 'latitude' });
  const longitudeWatch = useWatch({ control: form.control, name: 'longitude' });

  const watchedCoordinates = {
    latitude: normalizeCoordinateValue(latitudeWatch),
    longitude: normalizeCoordinateValue(longitudeWatch),
  };

  /** Uploads every captured file and returns the labels of the ones that did not make it,
   *  so the caller can tell the truth about a partial success instead of a blanket one. */
  const uploadCapturedDocuments = async (organisationUuid: string) => {
    const failedLabels: string[] = [];

    for (const [index, documentType] of reviewDocumentTypes.entries()) {
      const key = getDocumentTypeKey(documentType, index);
      const capturedDocument = capturedDocuments[key];

      if (!capturedDocument?.file || capturedDocument.validationError || !documentType.uuid) {
        continue;
      }

      try {
        const response = await uploadOrganisationDocument.mutateAsync({
          body: { file: capturedDocument.file },
          path: { uuid: organisationUuid },
          query: {
            document_type_uuid: documentType.uuid,
            title: capturedDocument.title,
            description: capturedDocument.description,
            // The date input already holds YYYY-MM-DD, which is what the LocalDate
            // parameter wants. Passing a Date here would widen it to a datetime and 400.
            expiry_date: capturedDocument.expiryDate
              ? localDate(capturedDocument.expiryDate)
              : undefined,
          },
        });
        requireApiSuccess(response);
        setCapturedDocuments(current => {
          const next = { ...current };
          delete next[key];
          return next;
        });
      } catch (_error) {
        failedLabels.push(getDocumentTypeLabel(documentType));
      }
    }

    return failedLabels;
  };

  const handleSubmit = async (data: OrganisationRegistrationFormData) => {
    if (
      application.isLoading ||
      application.isError ||
      savedDocuments?.isLoading ||
      savedDocuments?.isError
    ) {
      toast.error('Your saved application could not be loaded. Refresh to try again.');
      return;
    }
    if (!user?.uuid) {
      toast.error('User not found. Please try again.');
      return;
    }

    if (step !== 3) return;
    if (!(await validateStepOne())) {
      setStep(1);
      return;
    }
    if (!validateCapabilities()) {
      setStep(2);
      return;
    }
    if (documentTypesQuery.isError || documentTypesQuery.isPending || !documentTypes.length) {
      toast.error('Load the verification checklist before submitting.');
      return;
    }
    if (
      (payoutDocumentType.is_required || capturedDocuments[PAYOUT_DOCUMENT_KEY]) &&
      !payoutDocumentType.uuid
    ) {
      toast.error(
        'Payout document uploads need a payout or supporting document type configured. Contact support to continue.'
      );
      return;
    }
    if (invalidCapturedDocuments) {
      toast.error(
        'Replace invalid files and complete the required expiry dates before submitting.'
      );
      return;
    }
    if (!documentsAreComplete) {
      toast.error('Attach every required validation document before submitting.');
      return;
    }

    try {
      const body = buildOrganisationRegistrationPayload(data);
      const response = application.profileUuid
        ? await updateOrganisation.mutateAsync({ path: { uuid: application.profileUuid }, body })
        : await createOrganisation.mutateAsync({ body });
      requireApiSuccess(response);
      const organisationUuid = acceptedProfileUuid({ data: response }) ?? application.profileUuid;
      if (!organisationUuid)
        throw new Error('The organisation could not be saved. Please try again.');
      application.save(data, organisationUuid);
      const failedLabels = await uploadCapturedDocuments(organisationUuid);

      await queryClient.invalidateQueries({
        predicate: query => isGeneratedOrganisationQueryKey(query.queryKey),
      });
      await queryClient.invalidateQueries({ queryKey: ['organization'] });
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      if (user.invalidateQuery) {
        await user.invalidateQuery();
      }

      await queryClient.invalidateQueries({
        queryKey: getOrganisationDocumentsQueryKey({ path: { uuid: organisationUuid } }),
      });
      if (failedLabels.length) {
        toast.error(
          `Could not upload ${failedLabels.join(', ')}. Your details are saved. Retry the remaining uploads to submit for review.`
        );
        return;
      }
      const verification = await requestVerification.mutateAsync({
        path: { uuid: organisationUuid },
      });
      requireApiSuccess(verification);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getCurrentAccountStatusQueryKey() }),
        queryClient.invalidateQueries({
          queryKey: getDomainOnboardingQueryKey({ path: { domain: 'organisation_user' } }),
        }),
      ]);
      await refreshSessionIdentity();
      toast.success('Your organisation application has been submitted for review.');
      router.replace(awaitingApprovalPath('organisation_user'));
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to register organization. Please try again.'));
    }
  };

  const validateStepOne = async () => {
    const valid = await form.trigger([
      'name',
      'licence_no',
      'location',
      'description',
      'country',
      'latitude',
      'longitude',
    ]);
    const categoryValid = ORGANISATION_CATEGORIES.some(
      category => category === form.getValues('category')
    );
    if (!categoryValid)
      form.setError('category', { message: 'Select your organisation category.' });
    if (!form.getValues('is_representative'))
      form.setError('is_representative', {
        message: 'Confirm that you are an authorised representative.',
      });
    return valid && categoryValid && form.getValues('is_representative');
  };
  const validateCapabilities = () => {
    if (!form.getValues('capabilities').length) {
      form.setError('capabilities', { message: 'Select at least one activity.' });
      return false;
    }
    return true;
  };
  const busy =
    form.formState.isSubmitting ||
    createOrganisation.isPending ||
    updateOrganisation.isPending ||
    uploadOrganisationDocument.isPending ||
    requestVerification.isPending;
  const unavailable =
    application.isLoading ||
    application.isError ||
    savedDocuments?.isLoading ||
    savedDocuments?.isError;

  return (
    <div className='border-border/60 bg-card/80 mx-auto w-full max-w-4xl space-y-8 rounded-3xl border p-6 shadow-sm backdrop-blur-sm sm:p-8'>
      <ApplicationSubmissionDate
        submittedAt={application.submittedAt}
        isLoading={application.isLoading || savedDocuments?.isLoading}
        isError={application.isError || savedDocuments?.isError}
      />
      <div className='text-center'>
        <div className='bg-primary/10 text-primary ring-primary/20 mx-auto mb-4 flex size-16 items-center justify-center rounded-full ring-1'>
          <Building2 className='size-8' />
        </div>
        <h1 className='text-foreground mb-2 text-3xl font-bold'>Organisation registration</h1>
        <p className='text-muted-foreground'>
          Tell us about your organisation and submit its documents for review.
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={event => {
            if (step !== 3) {
              event.preventDefault();
              if (step === 1)
                void validateStepOne().then(valid => {
                  if (valid) setStep(2);
                });
              else if (validateCapabilities()) setStep(3);
              return;
            }
            void form.handleSubmit(handleSubmit)(event);
          }}
          className='space-y-6'
        >
          <fieldset disabled={busy || unavailable} className='min-w-0 space-y-6'>
            <div hidden={step !== 1} className='space-y-6'>
              <UserInfoCard user={user} />
              <Card>
                <CardHeader>
                  <CardTitle>Organisation information</CardTitle>
                  <CardDescription>Basic information about your organisation</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='name'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Registered organisation name *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder='Elimika Training Institute'
                              autoComplete='organization'
                            />
                          </FormControl>
                          <FormDescription>Official name of your organisation</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='licence_no'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License number (optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder='REG-123456' />
                          </FormControl>
                          <FormDescription>Official license or registration number</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='category'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organisation category *</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={value => {
                              field.onChange(value);
                              form.clearErrors('category');
                            }}
                          >
                            <FormControl>
                              <SelectTrigger className='w-full'>
                                <SelectValue placeholder='Select a category' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ORGANISATION_CATEGORIES.map(category => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <OrganisationCountryField
                      form={form}
                      label='Country of registration (optional)'
                      placeholder='Select country'
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name='description'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={4}
                            placeholder='Describe your organisation, its mission, and its activities...'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <OrganisationLocationField
                    form={form}
                    coordinates={watchedCoordinates}
                    label='Location (optional)'
                    description='Physical location or address of your organisation'
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
                      if (contextCountry) form.setValue('country', contextCountry);
                    }}
                  />

                  <FormField
                    control={form.control}
                    name='is_representative'
                    render={({ field }) => (
                      <FormItem className='bg-muted/60 rounded-lg p-4'>
                        <div className='flex items-start gap-3'>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={checked => {
                                field.onChange(checked === true);
                                form.clearErrors('is_representative');
                              }}
                              className='mt-0.5'
                            />
                          </FormControl>
                          <FormLabel className='text-sm leading-6'>
                            I am an authorised representative of this organisation. Joining as staff
                            does not make you its legal owner.
                          </FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
            <div hidden={step !== 2}>
              <Card>
                <CardHeader>
                  <CardTitle>
                    What will{' '}
                    <WatchedText control={form.control} name='name' fallback='your organisation' />{' '}
                    do on Sarafrika?
                  </CardTitle>
                  <CardDescription>
                    Organisation category describes what you are. Select the activities you want to
                    offer; access is subject to review.
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <FormField
                    control={form.control}
                    name='capabilities'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select at least one activity *</FormLabel>
                        <div className='grid gap-3 sm:grid-cols-2'>
                          {ORGANISATION_CAPABILITIES.map(capability => {
                            const selected = field.value.includes(capability.id);
                            return (
                              <Button
                                key={capability.id}
                                type='button'
                                variant='outline'
                                aria-pressed={selected}
                                className={cn(
                                  'text-foreground hover:bg-muted/50 hover:text-foreground h-auto min-h-24 justify-start gap-3 p-4 text-left whitespace-normal transition-colors',
                                  selected && 'border-primary bg-primary/5 hover:bg-primary/10'
                                )}
                                onClick={() => {
                                  field.onChange(
                                    selected
                                      ? field.value.filter(value => value !== capability.id)
                                      : [...field.value, capability.id]
                                  );
                                  form.clearErrors('capabilities');
                                }}
                              >
                                <span className='bg-primary/10 text-primary grid size-10 shrink-0 place-items-center rounded-lg'>
                                  {capability.code}
                                </span>
                                <span className='flex-1'>
                                  <span className='block font-semibold'>{capability.title}</span>
                                  <span className='text-muted-foreground block text-sm font-normal'>
                                    {capability.description}
                                  </span>
                                </span>
                                {selected ? (
                                  <Check className='text-primary size-4 shrink-0' />
                                ) : null}
                              </Button>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {capabilities.includes('hire') ? (
                    <p className='bg-primary/5 text-primary rounded-lg p-3 text-sm'>
                      Hiring uses the Eneza employer experience with your Sarafrika identity.
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </div>
            <div hidden={step !== 3} className='space-y-6'>
              <Card>
                <CardHeader>
                  <CardTitle>Evidence to prepare</CardTitle>
                  <CardDescription>
                    Attach the applicable evidence using the document upload controls below.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className='text-foreground list-disc space-y-3 pl-5 text-sm'>
                    <li>
                      <strong>Registration details:</strong> Certificate of incorporation or
                      registration.
                    </li>
                    <li>
                      <strong>Authorised representative:</strong> ID and letter of authority or
                      board resolution.
                    </li>
                    {needsPayout ? (
                      <li>
                        <strong>Payout details:</strong> Bank or M-Pesa paybill in the
                        organisation’s name.
                      </li>
                    ) : null}
                  </ul>
                </CardContent>
              </Card>
              {uploadedTypeIds.size > 0 ? (
                <Alert>
                  <FileCheck2 className='size-4' />
                  <AlertTitle>Previously uploaded documents retained</AlertTitle>
                  <AlertDescription>
                    Only missing, rejected or expired documents need to be uploaded again.
                  </AlertDescription>
                </Alert>
              ) : null}
              {!documentTypesQuery.isPending &&
                !documentTypesQuery.isError &&
                !documentTypes.length ? (
                <Alert variant='destructive'>
                  <AlertTitle>Verification checklist unavailable</AlertTitle>
                  <AlertDescription>
                    No organisation document types are configured. Contact support before
                    submitting.
                  </AlertDescription>
                </Alert>
              ) : null}
              <ValidationDocumentsStep
                capturedDocuments={capturedDocuments}
                isLoading={documentTypesQuery.isPending}
                documentTypesQueryError={documentTypesQuery.isError}
                onRetryDocumentTypes={() => documentTypesQuery.refetch()}
                requiredTypes={reviewDocumentTypes.filter(
                  documentType =>
                    documentType.reviewKey !== PAYOUT_DOCUMENT_KEY &&
                    !isDocumentUploaded(documentType)
                )}
                onCapture={(key, document) =>
                  setCapturedDocuments(current => ({ ...current, [key]: document }))
                }
                onRemove={key =>
                  setCapturedDocuments(current => {
                    const next = { ...current };
                    delete next[key];
                    return next;
                  })
                }
              />
              <Card>
                <CardHeader>
                  <CardTitle>Payout details</CardTitle>
                  <CardDescription>
                    Bank or M-Pesa paybill in the organisation’s name.
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {documentTypesQuery.isPending ? (
                    <Skeleton className='h-40 w-full' />
                  ) : isDocumentUploaded(payoutDocumentType) ? (
                    <p className='text-success flex items-center gap-2 text-sm'>
                      <FileCheck2 className='size-4' /> Your previously uploaded payout details are
                      attached to this application.
                    </p>
                  ) : (
                    <ValidationDocumentRow
                      documentKey={PAYOUT_DOCUMENT_KEY}
                      documentType={payoutDocumentType}
                      capturedDocument={capturedDocuments[PAYOUT_DOCUMENT_KEY]}
                      onCapture={(key, document) =>
                        setCapturedDocuments(current => ({ ...current, [key]: document }))
                      }
                      onRemove={key =>
                        setCapturedDocuments(current => {
                          const next = { ...current };
                          delete next[key];
                          return next;
                        })
                      }
                    />
                  )}
                  {!documentTypesQuery.isPending && !payoutDocumentType.uuid ? (
                    <p role='alert' className='text-destructive text-sm'>
                      Payout uploads are unavailable until a payout or supporting document type is
                      configured. Contact support to continue.
                    </p>
                  ) : null}
                </CardContent>
              </Card>
              {requiredDocumentTypes.some(type => type.requires_expiry) ? (
                <p className='text-muted-foreground text-sm'>
                  Documents that expire must include a current expiry date before submission.
                </p>
              ) : null}
              <p className='text-muted-foreground text-sm'>
                After submission, your application stays on the awaiting approval page while the
                team verifies your information and documents. Your workspace opens after approval.
              </p>
            </div>
            <div className='flex justify-between gap-3'>
              {step > 1 ? (
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    setStep(current => (current === 3 ? 2 : 1));
                  }}
                >
                  <ArrowLeft className='size-4' /> Back
                </Button>
              ) : (
                <Button asChild variant='outline'>
                  <Link href='/onboarding'>
                    <ArrowLeft className='size-4' /> Profile selection
                  </Link>
                </Button>
              )}
              {step < 3 ? (
                <Button
                  type='button'
                  onClick={async () => {
                    if (step === 1 ? await validateStepOne() : validateCapabilities())
                      setStep(current => (current === 1 ? 2 : 3));
                  }}
                >
                  Continue <ArrowRight className='size-4' />
                </Button>
              ) : (
                <Button
                  type='submit'
                  disabled={
                    busy ||
                    documentTypesQuery.isPending ||
                    documentTypesQuery.isError ||
                    !documentTypes.length ||
                    !documentsAreComplete
                  }
                >
                  {busy ? <Spinner /> : <UploadCloud className='size-4' />}
                  {busy ? 'Submitting for review...' : 'Submit for review'}
                </Button>
              )}
            </div>
          </fieldset>
        </form>
      </Form>
    </div>
  );
}
