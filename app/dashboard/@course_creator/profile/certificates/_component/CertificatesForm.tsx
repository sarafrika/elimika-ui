'use client';

import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';

import { ProfileFormSection, ProfileFormShell } from '@/components/profile/profile-form-layout';
import { ProfileViewList, ProfileViewListItem } from '@/components/profile/profile-view-field';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useUserProfile } from '@/context/profile-context';
import { useProfileFormMode } from '@/context/profile-form-mode-context';
import useMultiMutations from '@/hooks/use-multi-mutations';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CalendarIcon, Grip, PlusCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  deleteCourseCreatorCertification,
  type CourseCreatorCertification,
} from '../../../../../../services/client';
import {
  addCourseCreatorCertificationMutation,
  getCourseCreatorCertificationsOptions,
  getCourseCreatorCertificationsQueryKey,
  updateCourseCreatorCertificationMutation,
  uploadCourseCreatorDocumentMutation,
} from '../../../../../../services/client/@tanstack/react-query.gen';
import { zCourseCreatorCertification } from '../../../../../../services/client/zod.gen';

const CertificationSchema = zCourseCreatorCertification
  .omit({
    created_date: true,
    updated_date: true,
    created_by: true,
    updated_by: true,
    is_expired: true,
  })
  .merge(
    z.object({
      issued_date: z.date().optional(),
      expiry_date: z.date().optional(),
    })
  );

const certificationsSchema = z.object({
  certifications: z.array(CertificationSchema),
});

type CertificationType = z.infer<typeof CertificationSchema>;
type CertificationsFormValues = z.infer<typeof certificationsSchema>;

export default function CertificatesSettings() {
  const { replaceBreadcrumbs } = useBreadcrumb();
  const qc = useQueryClient();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'profile', title: 'Profile', url: '/dashboard/profile' },
      {
        id: 'certificates',
        title: 'Certificates',
        url: '/dashboard/profile/certificates',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const user = useUserProfile();
  const { courseCreator, invalidateQuery } = user!;
  const { disableEditing, isEditing, requestConfirmation, isConfirming } = useProfileFormMode();

  const { data } = useQuery({
    ...getCourseCreatorCertificationsOptions({
      query: { pageable: {} },
      path: { courseCreatorUuid: courseCreator?.uuid as string },
    }),
    enabled: !!courseCreator?.uuid,
  });

  const courseCreatorCertifications = data?.data?.content || [];

  const defaultCertification: CertificationType = {
    certification_name: '',
    issuing_organization: '',
    issued_date: undefined,
    expiry_date: undefined,
    credential_id: '',
    credential_url: '',
    description: '',
    is_verified: false,
    course_creator_uuid: courseCreator?.uuid!,
  };

  const passCertification = (cert: CourseCreatorCertification) => ({
    ...cert,
    issued_date: cert.issued_date ? new Date(cert.issued_date) : undefined,
    expiry_date: cert.expiry_date ? new Date(cert.expiry_date) : undefined,
  });

  const form = useForm<CertificationsFormValues>({
    resolver: zodResolver(certificationsSchema),
    defaultValues: {
      certifications:
        courseCreatorCertifications && courseCreatorCertifications.length > 0
          ? courseCreatorCertifications.map(passCertification)
          : [defaultCertification],
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'certifications',
  });

  const uploadDocumentMut = useMutation(uploadCourseCreatorDocumentMutation())
  const handleUplod = () => {
    uploadDocumentMut.mutate({ path: { courseCreatorUuid: "" }, query: { document_type_uuid: "", education_uuid: '' } })
  }

  const addCertMutation = useMutation(addCourseCreatorCertificationMutation());
  const updateCertMutation = useMutation(updateCourseCreatorCertificationMutation());
  const { errors, submitting } = useMultiMutations([addCertMutation, updateCertMutation]);

  const saveCertifications = async (data: CertificationsFormValues) => {
    for (const [index, cert] of data.certifications.entries()) {
      const certData = {
        ...cert,
        issued_date: cert.issued_date?.toISOString(),
        expiry_date: cert.expiry_date?.toISOString(),
      };

      if (certData.uuid) {
        await updateCertMutation.mutateAsync(
          {
            path: {
              courseCreatorUuid: courseCreator?.uuid!,
              certificationUuid: certData.uuid,
            },
            body: {
              ...certData,
              issued_date: certData.issued_date ? new Date(certData.issued_date) : undefined,
              expiry_date: certData.expiry_date ? new Date(certData.expiry_date) : undefined,
            },
          },
          {
            onSuccess: () => {
              qc.invalidateQueries({
                queryKey: getCourseCreatorCertificationsQueryKey({
                  path: { courseCreatorUuid: courseCreator?.uuid as string },
                  query: { pageable: {} },
                }),
              });
            },
          }
        );
      } else {
        const resp = await addCertMutation.mutateAsync(
          {
            path: {
              courseCreatorUuid: courseCreator?.uuid!,
            },
            body: {
              ...certData,
              issued_date: certData.issued_date ? new Date(certData.issued_date) : undefined,
              expiry_date: certData.expiry_date ? new Date(certData.expiry_date) : undefined,
            },
          },
          {
            onSuccess: () => {
              qc.invalidateQueries({
                queryKey: getCourseCreatorCertificationsQueryKey({
                  path: { courseCreatorUuid: courseCreator?.uuid as string },
                  query: { pageable: {} },
                }),
              });
            },
          }
        );

        if (resp.data) {
          const certs = form.getValues('certifications');
          certs[index] = passCertification(resp.data as CourseCreatorCertification);
          form.setValue('certifications', certs);
        }
      }
    }

    await invalidateQuery?.();
    toast.success('Certifications updated successfully');
    disableEditing();
  };

  const handleSubmit = (data: CertificationsFormValues) => {
    requestConfirmation({
      title: 'Save certification updates?',
      description: 'Professional certifications help establish your credibility with learners.',
      confirmLabel: 'Save certifications',
      cancelLabel: 'Keep editing',
      onConfirm: () => saveCertifications(data),
    });
  };

  async function onDelete(index: number) {
    if (!isEditing) return;
    const shouldRemove = confirm('Are you sure you want to remove this certification?');
    if (!shouldRemove) return;

    const certUUID = form.getValues('certifications')[index]?.uuid;
    remove(index);

    if (certUUID) {
      const resp = await deleteCourseCreatorCertification({
        path: {
          courseCreatorUuid: courseCreator?.uuid!,
          certificationUuid: certUUID,
        },
      });
      if (resp.error) {
        toast.error('Unable to remove this certification right now.');
        return;
      }
    }

    await invalidateQuery?.();
    qc.invalidateQueries({
      queryKey: getCourseCreatorCertificationsQueryKey({
        path: { courseCreatorUuid: courseCreator?.uuid as string },
        query: { pageable: {} },
      }),
    });
    toast('Certification removed successfully');
  }

  const formatDateRange = (issuedDate?: string | Date, expiryDate?: string | Date) => {
    const formatDate = (date?: string | Date) => {
      if (!date) return '';
      return format(new Date(date), 'MMM yyyy');
    };

    const issued = formatDate(issuedDate);
    if (!expiryDate) return issued ? `Issued: ${issued}` : '';
    const expiry = formatDate(expiryDate);
    return `${issued} - ${expiry}`;
  };

  const domainBadges =
    user?.user_domain?.map(domain =>
      domain
        .split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    ) ?? [];

  return (
    <ProfileFormShell
      eyebrow='Course Creator'
      title='Professional certifications'
      description='Add your industry certifications and professional credentials to demonstrate expertise.'
      badges={domainBadges}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
          {errors && errors.length > 0 ? (
            <Alert variant='destructive'>
              <AlertTitle>Changes could not be saved</AlertTitle>
              <AlertDescription>
                <ul className='ml-4 list-disc space-y-1 text-sm'>
                  {errors.map((error, index) => (
                    <li key={index}>{error.message}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}

          <ProfileFormSection
            title='Certifications'
            description='Professional certifications and credentials that validate your expertise.'
            viewContent={
              <ProfileViewList emptyMessage='No certifications added yet.'>
                {courseCreatorCertifications?.map(cert => (
                  <ProfileViewListItem
                    key={cert.uuid}
                    title={cert.certification_name || 'Certification not specified'}
                    subtitle={cert.issuing_organization}
                    description={cert.description}
                    badge={cert.is_verified ? 'Verified' : undefined}
                    dateRange={formatDateRange(cert.issued_date, cert.expiry_date)}
                  >
                    {cert.credential_id && (
                      <div className='text-muted-foreground mt-2 text-xs'>
                        Credential ID: {cert.credential_id}
                      </div>
                    )}
                  </ProfileViewListItem>
                ))}
              </ProfileViewList>
            }
            footer={
              <Button
                type='submit'
                className='min-w-36'
                disabled={!isEditing || submitting || isConfirming}
              >
                {submitting || isConfirming ? (
                  <span className='flex items-center gap-2'>
                    <Spinner className='h-4 w-4' />
                    Saving…
                  </span>
                ) : (
                  'Save changes'
                )}
              </Button>
            }
          >
            <div className='space-y-4'>
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className='bg-card group hover:bg-accent/5 relative rounded-md border transition-all'
                >
                  <div className='space-y-5 p-5'>
                    <div className='flex items-start justify-between gap-4'>
                      <div className='flex items-start gap-3'>
                        <Grip className='text-muted-foreground mt-1 h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100' />
                        <div>
                          <div className='flex items-center gap-2'>
                            <h3 className='text-base font-medium'>
                              {form.watch(`certifications.${index}.certification_name`) ||
                                'New certification'}
                            </h3>
                            {form.watch(`certifications.${index}.is_verified`) && (
                              <Badge className='border-green-200 bg-green-100 text-xs text-green-700'>
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className='text-muted-foreground text-sm'>
                            {form.watch(`certifications.${index}.issuing_organization`) ||
                              'Issuer not set'}
                          </p>
                        </div>
                      </div>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='hover:bg-destructive-foreground h-8 w-8'
                        onClick={() => onDelete(index)}
                      >
                        <Trash2 className='text-destructive h-4 w-4' />
                      </Button>
                    </div>

                    <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
                      <FormField
                        control={form.control}
                        name={`certifications.${index}.certification_name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Certification name *</FormLabel>
                            <FormControl>
                              <Input placeholder='e.g. AWS Solutions Architect' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`certifications.${index}.issuing_organization`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Issuing organization *</FormLabel>
                            <FormControl>
                              <Input placeholder='e.g. Amazon Web Services' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
                      <FormField
                        control={form.control}
                        name={`certifications.${index}.credential_id`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Credential ID</FormLabel>
                            <FormControl>
                              <Input
                                placeholder='e.g. AWS-12345'
                                {...field}
                                value={field.value ?? ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`certifications.${index}.credential_url`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Verification URL</FormLabel>
                            <FormControl>
                              <Input
                                placeholder='e.g. https://verify.example.com'
                                {...field}
                                value={field.value ?? ''}
                              />
                            </FormControl>
                            <FormDescription>
                              Link where others can verify this certification
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
                      <FormField
                        control={form.control}
                        name={`certifications.${index}.issued_date`}
                        render={({ field }) => (
                          <FormItem className='flex flex-col'>
                            <FormLabel>Issue date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant='outline'
                                    className={cn(
                                      'w-full pl-3 text-left font-normal',
                                      !field.value && 'text-muted-foreground'
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, 'PPP')
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className='w-auto p-0' align='start'>
                                <Calendar
                                  mode='single'
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`certifications.${index}.expiry_date`}
                        render={({ field }) => (
                          <FormItem className='flex flex-col'>
                            <FormLabel>Expiry date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant='outline'
                                    className={cn(
                                      'w-full pl-3 text-left font-normal',
                                      !field.value && 'text-muted-foreground'
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, 'PPP')
                                    ) : (
                                      <span>No expiry</span>
                                    )}
                                    <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className='w-auto p-0' align='start'>
                                <Calendar
                                  mode='single'
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormDescription>Leave empty if no expiry</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`certifications.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder='Brief description of the certification…'
                              className='min-h-20 resize-y'
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`certifications.${index}.is_verified`}
                      render={({ field }) => (
                        <FormItem className='flex flex-row items-start space-y-0 space-x-3'>
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className='leading-none'>
                            <FormLabel>This certification is verified</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button
              type='button'
              variant='outline'
              className='flex w-full items-center justify-center gap-2'
              onClick={() => append(defaultCertification)}
              disabled={!isEditing || submitting || isConfirming}
            >
              <PlusCircle className='h-4 w-4' />
              Add another certification
            </Button>
          </ProfileFormSection>
        </form>
      </Form>
    </ProfileFormShell>
  );
}
