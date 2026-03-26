'use client';

import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Camera, Globe, Mail, MapPin, Phone, Upload, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { updateCourseCreator, updateInstructor, updateStudent } from '../../../services/client';
import { uploadProfileImageMutation } from '../../../services/client/@tanstack/react-query.gen';
import type { ProfilePageProps } from './types';

type EditableProfileDetails = {
  professional_headline: string;
  website: string;
  bio: string;
  latitude: string;
  longitude: string;
};

type EditableProfileErrors = Partial<Record<keyof EditableProfileDetails, string>>;

function ProfileHeaderSkeleton() {
  return (
    <div className='bg-card border-border rounded-2xl border p-7'>
      <div className='mb-6 flex items-start gap-6'>
        <Skeleton className='h-[90px] w-[90px] shrink-0 rounded-xl' />
        <div className='flex-1 space-y-3'>
          <Skeleton className='h-7 w-48' />
          <div className='flex gap-4'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-4 w-40' />
          </div>
          <div className='grid grid-cols-3 gap-3'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-full' />
          </div>
          <Skeleton className='h-6 w-44' />
        </div>
      </div>
      <div className='border-border flex gap-2 border-t pt-4'>
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className='h-9 w-24 rounded-lg' />
        ))}
      </div>
    </div>
  );
}

function MetaItem({ icon, value }: { icon: React.ReactNode; value?: string }) {
  if (!value) return null;
  return (
    <span className='text-muted-foreground flex items-center gap-1.5 text-sm'>
      {icon}
      <span>{value}</span>
    </span>
  );
}

function getProfileDetailsDefaults(profile: ProfilePageProps['profile']): EditableProfileDetails {
  return {
    professional_headline: profile.professional_headline ?? '',
    website: profile.website ?? '',
    bio: profile.bio ?? profile.student_profile?.bio ?? '',
    latitude:
      typeof profile.latitude === 'number' && Number.isFinite(profile.latitude)
        ? String(profile.latitude)
        : '',
    longitude:
      typeof profile.longitude === 'number' && Number.isFinite(profile.longitude)
        ? String(profile.longitude)
        : '',
  };
}

function normalizeOptionalString(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function parseCoordinate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function stripHtml(value?: string) {
  if (!value) return '';
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function getErrorMessage(error: any) {
  const apiError = error?.error;
  if (typeof apiError === 'string') return apiError;
  if (apiError && typeof apiError === 'object') {
    const firstMessage = Object.values(apiError).find(value => typeof value === 'string');
    if (typeof firstMessage === 'string') return firstMessage;
  }
  if (typeof error?.message === 'string') return error.message;
  return 'Failed to update profile details';
}

export function ProfilePage({
  tabs,
  profile,
  domain,
  profileSource,
  isLoading = false,
  headerBadge,
  defaultTab,
  isPublic = false,
}: ProfilePageProps) {
  const [activeTabId, setActiveTabId] = useState(defaultTab ?? tabs[0]?.id ?? '');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [detailsValues, setDetailsValues] = useState<EditableProfileDetails>(
    getProfileDetailsDefaults(profile)
  );
  const [detailsErrors, setDetailsErrors] = useState<EditableProfileErrors>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const activeTab = tabs.find(t => t.id === activeTabId) ?? tabs[0];
  const TabContent = activeTab?.component;
  const supportsExtendedDetails = domain === 'instructor' || domain === 'course_creator';
  const canEditProfileDetails =
    !isPublic &&
    ((domain === 'instructor' && Boolean(profileSource?.instructor?.uuid)) ||
      (domain === 'course_creator' && Boolean(profileSource?.courseCreator?.uuid)) ||
      (domain === 'student' && Boolean(profileSource?.student?.uuid)));

  useEffect(() => {
    setDetailsValues(getProfileDetailsDefaults(profile));
    setDetailsErrors({});
  }, [profile]);

  const uploadProfileImageMut = useMutation({
    ...uploadProfileImageMutation(),
    onSuccess: () => {
      toast.success('Profile image updated successfully');
      setSelectedImage(null);
      setPreviewUrl(null);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to upload image');
    },
  });

  const saveProfileDetailsMut = useMutation({
    mutationFn: async (values: EditableProfileDetails) => {
      const sharedUpdates = {
        bio: normalizeOptionalString(values.bio),
        professional_headline: normalizeOptionalString(values.professional_headline),
        website: normalizeOptionalString(values.website),
        latitude: parseCoordinate(values.latitude),
        longitude: parseCoordinate(values.longitude),
      };

      if (domain === 'instructor' && profileSource?.instructor?.uuid) {
        const response = await updateInstructor({
          path: { uuid: profileSource.instructor.uuid },
          body: {
            ...profileSource.instructor,
            ...sharedUpdates,
          } as any,
        });

        if (response.error) {
          throw response.error;
        }

        return;
      }

      if (domain === 'course_creator' && profileSource?.courseCreator?.uuid) {
        const response = await updateCourseCreator({
          path: { uuid: profileSource.courseCreator.uuid },
          body: {
            ...profileSource.courseCreator,
            ...sharedUpdates,
          } as any,
        });

        if (response.error) {
          throw response.error;
        }

        return;
      }

      if (domain === 'student' && profileSource?.student?.uuid) {
        const response = await updateStudent({
          path: { uuid: profileSource.student.uuid },
          body: {
            ...profileSource.student,
            bio: sharedUpdates.bio,
          } as any,
        });

        if (response.error) {
          throw response.error;
        }

        return;
      }

      throw new Error('This profile cannot be edited here.');
    },
    onSuccess: async () => {
      toast.success('Profile details updated successfully');
      setIsEditingDetails(false);
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setSelectedImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (!selectedImage) {
      toast.error('Please select an image first');
      return;
    }

    uploadProfileImageMut.mutate({
      body: { profileImage: selectedImage },
      path: { userUuid: profile?.user_uuid },
    });
  };

  const handleCancel = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDetailsChange = (field: keyof EditableProfileDetails, value: string) => {
    setDetailsValues(current => ({
      ...current,
      [field]: value,
    }));

    if (detailsErrors[field]) {
      setDetailsErrors(current => ({
        ...current,
        [field]: undefined,
      }));
    }
  };

  const validateDetails = (values: EditableProfileDetails) => {
    const nextErrors: EditableProfileErrors = {};

    if (supportsExtendedDetails && values.website.trim() && !isValidUrl(values.website.trim())) {
      nextErrors.website = 'Enter a valid website URL.';
    }

    if (supportsExtendedDetails && values.latitude.trim()) {
      const latitude = Number(values.latitude);
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
        nextErrors.latitude = 'Latitude must be between -90 and 90.';
      }
    }

    if (supportsExtendedDetails && values.longitude.trim()) {
      const longitude = Number(values.longitude);
      if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        nextErrors.longitude = 'Longitude must be between -180 and 180.';
      }
    }

    return nextErrors;
  };

  const handleSaveDetails = () => {
    const nextErrors = validateDetails(detailsValues);
    setDetailsErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    saveProfileDetailsMut.mutate(detailsValues);
  };

  if (isLoading) {
    return (
      <div className='space-y-0 p-6'>
        <ProfileHeaderSkeleton />
      </div>
    );
  }

  const initials = profile.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const bioPreview = stripHtml(profile.bio ?? profile.student_profile?.bio);
  const hasDetailSummary =
    Boolean(profile.professional_headline) ||
    Boolean(profile.website) ||
    Boolean(bioPreview) ||
    typeof profile.latitude === 'number' ||
    typeof profile.longitude === 'number';

  return (
    <div className='space-y-0 font-sans'>
      <div className='bg-card border-border rounded-2xl border p-4 sm:p-6 lg:p-7'>
        <div className='mb-4 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-start sm:gap-6'>
          <div className='relative w-24 shrink-0 self-center sm:w-[90px] sm:self-auto'>
            <div className='group relative'>
              <Avatar className='ring-border h-20 w-20 rounded-xl ring-2 sm:h-[90px] sm:w-[90px]'>
                <AvatarImage
                  src={previewUrl || profile?.profile_image_url || profile?.avatar_url}
                  alt={profile?.full_name}
                />
                <AvatarFallback className='bg-primary/10 text-primary rounded-xl text-base font-semibold sm:text-lg'>
                  {initials}
                </AvatarFallback>
              </Avatar>

              <button
                onClick={() => fileInputRef.current?.click()}
                className='absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 opacity-0 transition-opacity group-hover:opacity-100'
              >
                <Camera className='h-5 w-5 text-white sm:h-6 sm:w-6' />
              </button>

              {profile.is_online && (
                <span className='bg-success border-card absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full border-2 sm:-top-1 sm:-right-1 sm:h-5 sm:w-5' />
              )}
            </div>

            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              onChange={handleImageSelect}
              className='hidden'
            />

            {selectedImage && (
              <div className='mt-2 flex gap-2 sm:mt-3'>
                <Button
                  size='sm'
                  onClick={handleUpload}
                  disabled={uploadProfileImageMut.isPending}
                  className='flex-1 text-xs'
                >
                  {uploadProfileImageMut.isPending ? (
                    <>
                      <Upload className='mr-1.5 h-3 w-3 animate-pulse' />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className='mr-1.5 h-3 w-3' />
                      Upload
                    </>
                  )}
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={handleCancel}
                  disabled={uploadProfileImageMut.isPending}
                >
                  <X className='h-3 w-3' />
                </Button>
              </div>
            )}

            {!selectedImage && (
              <Button
                size='sm'
                variant='outline'
                onClick={() => fileInputRef.current?.click()}
                className='mt-2 min-w-fit w-full text-xs sm:mt-3'
              >
                {/* <Camera className='mr-1.5 h-3 w-3' /> */}
                Change Photo
              </Button>
            )}
          </div>

          <div className='min-w-0 flex-1'>
            <div className='flex items-center gap-4'>
              <span className='text-[14px]'>User No:</span>
              <span className='bg-muted text-muted-foreground inline-block rounded-md px-2 py-0.5 font-mono text-[12px] tracking-wider sm:px-3 sm:py-1 sm:text-xs'>
                {profile.user_no}
              </span>
            </div>

            <div className='mb-2 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3'>
              <h1 className='text-foreground w-full truncate text-xl font-bold tracking-tight sm:text-2xl'>
                {profile.full_name}
              </h1>
              {headerBadge && <div className='shrink-0'>{headerBadge}</div>}
            </div>

            <div className='mb-2 flex flex-wrap gap-x-3 gap-y-1.5 sm:mb-3 sm:gap-x-5 sm:gap-y-2'>
              <MetaItem
                icon={<Briefcase className='text-muted-foreground h-3.5 w-3.5 sm:h-4 sm:w-4' />}
                value={profile.professional_headline}
              />
              <MetaItem
                icon={<MapPin className='text-muted-foreground h-3.5 w-3.5 sm:h-4 sm:w-4' />}
                value={profile.address}
              />
            </div>

            <div className='mb-2 flex flex-wrap gap-x-3 gap-y-1.5 sm:mb-3 sm:gap-x-5 sm:gap-y-2'>
              <MetaItem
                icon={<Phone className='text-muted-foreground h-3.5 w-3.5 sm:h-4 sm:w-4' />}
                value={profile.phone}
              />
              <MetaItem
                icon={<Mail className='text-muted-foreground h-3.5 w-3.5 sm:h-4 sm:w-4' />}
                value={profile.email}
              />
              {profile.website && (
                <MetaItem
                  icon={<Globe className='text-muted-foreground h-3.5 w-3.5 sm:h-4 sm:w-4' />}
                  value={profile.website}
                />
              )}
            </div>
          </div>
        </div>

        {canEditProfileDetails && (
          <div className='flex items-end self-end justify-end sm:mb-6'>
            <div className='flex flex-col gap-3 items-end justify-end self-end max-w-fit'>
              {!isEditingDetails && (
                <Button size='sm' variant='outline' onClick={() => setIsEditingDetails(true)}>
                  Edit details
                </Button>
              )}
            </div>


            {!isEditingDetails ? (
              <div className='mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>

              </div>
            ) : (
              <div className='w-full mt-4 rounded-2xl border p-4 sm:p-5'>
                <div className='space-y-5'>
                  {supportsExtendedDetails && (
                    <div className='grid gap-5 sm:grid-cols-2'>
                      <div className='space-y-2'>
                        <label className='text-sm font-medium'>Professional headline</label>
                        <Input
                          value={detailsValues.professional_headline}
                          onChange={event =>
                            handleDetailsChange('professional_headline', event.target.value)
                          }
                          placeholder='Summarize your expertise in one line'
                        />
                        {detailsErrors.professional_headline ? (
                          <p className='text-destructive text-xs'>
                            {detailsErrors.professional_headline}
                          </p>
                        ) : null}
                      </div>

                      <div className='space-y-2'>
                        <label className='text-sm font-medium'>Website</label>
                        <Input
                          value={detailsValues.website}
                          onChange={event => handleDetailsChange('website', event.target.value)}
                          placeholder='https://yourwebsite.com'
                        />
                        {detailsErrors.website ? (
                          <p className='text-destructive text-xs'>{detailsErrors.website}</p>
                        ) : null}
                      </div>

                      <div className='space-y-2'>
                        <label className='text-sm font-medium'>Latitude</label>
                        <Input
                          type='number'
                          inputMode='decimal'
                          step='any'
                          value={detailsValues.latitude}
                          onChange={event => handleDetailsChange('latitude', event.target.value)}
                          placeholder='-1.292100'
                        />
                        <p className='text-muted-foreground text-xs'>Use a value between -90 and 90.</p>
                        {detailsErrors.latitude ? (
                          <p className='text-destructive text-xs'>{detailsErrors.latitude}</p>
                        ) : null}
                      </div>

                      <div className='space-y-2'>
                        <label className='text-sm font-medium'>Longitude</label>
                        <Input
                          type='number'
                          inputMode='decimal'
                          step='any'
                          value={detailsValues.longitude}
                          onChange={event => handleDetailsChange('longitude', event.target.value)}
                          placeholder='36.821900'
                        />
                        <p className='text-muted-foreground text-xs'>
                          Use a value between -180 and 180.
                        </p>
                        {detailsErrors.longitude ? (
                          <p className='text-destructive text-xs'>{detailsErrors.longitude}</p>
                        ) : null}
                      </div>
                    </div>
                  )}

                  <div className='w-full space-y-2'>
                    <label className='text-sm font-medium'>Bio</label>
                    {supportsExtendedDetails ? (
                      <SimpleEditor
                        value={detailsValues.bio}
                        onChange={value => handleDetailsChange('bio', value)}
                        isEditable
                        showToolbar
                      />
                    ) : (
                      <Textarea
                        value={detailsValues.bio}
                        onChange={event => handleDetailsChange('bio', event.target.value)}
                        placeholder='Tell people a little about yourself'
                        className='w-full max-w-none min-h-32 resize-y block'
                      />

                    )}
                    {detailsErrors.bio ? (
                      <p className='text-destructive text-xs'>{detailsErrors.bio}</p>
                    ) : null}
                  </div>

                  <div className='flex flex-wrap justify-end gap-2 border-t pt-4'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => {
                        setDetailsValues(getProfileDetailsDefaults(profile));
                        setDetailsErrors({});
                        setIsEditingDetails(false);
                      }}
                      disabled={saveProfileDetailsMut.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type='button'
                      onClick={handleSaveDetails}
                      disabled={saveProfileDetailsMut.isPending}
                    >
                      {saveProfileDetailsMut.isPending ? 'Saving…' : 'Save changes'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className='border-border -mx-4 overflow-x-auto border-t px-4 pt-3 sm:-mx-6 sm:px-6 sm:pt-4 lg:-mx-7 lg:px-7'>
          <div className='flex min-w-max gap-1 pb-1 sm:flex-wrap sm:pb-0'>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={cn(
                  'cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all duration-150 sm:px-5 sm:py-2 sm:text-sm',
                  activeTabId === tab.id
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {TabContent && (
        <div key={activeTabId} className='animate-in fade-in-0 duration-200'>
          <TabContent
            userUuid={profile.user_uuid}
            domain={domain ?? 'student'}
            sharedProfile={profile}
            isPublic={isPublic}
          />
        </div>
      )}
    </div>
  );
}
