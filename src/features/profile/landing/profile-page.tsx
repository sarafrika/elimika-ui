'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { parseApiDate } from '@/lib/date';
import { updateCourseCreator, updateInstructor, updateStudent, updateUser } from '@/services/client';
import { uploadProfileImageMutation } from '@/services/client/@tanstack/react-query.gen';
import type {
  CourseCreator,
  Instructor,
  Student,
  UpdateCourseCreatorData,
  UpdateInstructorData,
  UpdateStudentData,
  UpdateUserData,
  User,
} from '@/services/client/types.gen';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Upload, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  type EditableProfileDetails,
  type EditableProfileErrors,
  EditProfileDialog,
} from './components/edit-profile-dialog';
import { ProfileHero } from './components/profile-hero';
import { ProfileSidebar } from './components/profile-sidebar';
import { ProfileStatStrip } from './components/profile-stat-strip';
import type { ProfilePageProps } from './types';

function ProfileLayoutSkeleton() {
  return (
    <div className='space-y-6'>
      <Skeleton className='h-52 w-full rounded-xl' />
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className='h-[74px] w-full rounded-xl' />
        ))}
      </div>
      <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]'>
        <div className='space-y-4'>
          <Skeleton className='h-10 w-72 rounded-full' />
          <Skeleton className='h-64 w-full rounded-xl' />
        </div>
        <Skeleton className='h-64 w-full rounded-xl' />
      </div>
    </div>
  );
}

function getProfileDetailsDefaults(profile: ProfilePageProps['profile']): EditableProfileDetails {
  const [fallbackFirstName = '', ...remainingNames] = (profile.full_name ?? '')
    .split(' ')
    .filter(Boolean);

  return {
    first_name: fallbackFirstName,
    last_name: remainingNames.join(' '),
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

function getEditableProfileDetails(
  profile: ProfilePageProps['profile'],
  profileSource?: ProfilePageProps['profileSource']
): EditableProfileDetails {
  const defaults = getProfileDetailsDefaults(profile);

  return {
    ...defaults,
    first_name:
      typeof profileSource?.first_name === 'string'
        ? profileSource.first_name
        : defaults.first_name,
    last_name:
      typeof profileSource?.last_name === 'string' ? profileSource.last_name : defaults.last_name,
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

function stripHtml(value?: string | null) {
  if (!value) return '';
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

type ErrorWithDetails = {
  message?: string;
  error?: Record<string, unknown> | string;
};

function getErrorMessage(error: unknown) {
  const typedError = error && typeof error === 'object' ? (error as ErrorWithDetails) : null;
  const apiError = typedError?.error;
  if (typeof apiError === 'string') return apiError;
  if (apiError && typeof apiError === 'object') {
    const firstMessage = Object.values(apiError).find(value => typeof value === 'string');
    if (typeof firstMessage === 'string') return firstMessage;
  }
  if (typeof typedError?.message === 'string') return typedError.message;
  return 'Failed to update profile details';
}

/**
 * Shared profile layout. Every domain profile page (student / instructor /
 * course creator) composes this and feeds it its own tabs, stat tiles and
 * sidebar cards as props — the layout itself stays domain-agnostic.
 */
export function ProfilePage({
  tabs,
  profile,
  domain,
  profileSource,
  isLoading = false,
  headerBadge,
  defaultTab,
  isPublic = false,
  stats = [],
  sidebar,
}: ProfilePageProps) {
  const [activeTabId, setActiveTabId] = useState(defaultTab ?? tabs[0]?.id ?? '');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [displayFullName, setDisplayFullName] = useState(profile.full_name ?? '');
  const [detailsValues, setDetailsValues] = useState<EditableProfileDetails>(
    getEditableProfileDetails(profile, profileSource)
  );
  const [detailsErrors, setDetailsErrors] = useState<EditableProfileErrors>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const supportsExtendedDetails = domain === 'instructor' || domain === 'course_creator';
  const canEditProfileDetails =
    !isPublic &&
    ((domain === 'instructor' && Boolean(profileSource?.instructor?.uuid)) ||
      (domain === 'course_creator' && Boolean(profileSource?.courseCreator?.uuid)) ||
      (domain === 'student' && Boolean(profileSource?.student?.uuid)));
  // The upload endpoint targets the *viewed* user's uuid, so a public viewer must
  // never be offered the control — nor be able to fire the handler.
  const canManagePhoto = !isPublic;
  const canViewLocation = !isPublic;

  useEffect(() => {
    setDetailsValues(getEditableProfileDetails(profile, profileSource));
    setDetailsErrors({});
    setDisplayFullName(profile.full_name ?? '');
  }, [profile, profileSource]);

  const uploadProfileImageMut = useMutation({
    ...uploadProfileImageMutation(),
    onSuccess: () => {
      toast.success('Profile image updated successfully');
      setSelectedImage(null);
      setPreviewUrl(null);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: error => {
      toast.error(getErrorMessage(error) || 'Failed to upload image');
    },
  });

  const saveProfileDetailsMut = useMutation({
    mutationFn: async (values: EditableProfileDetails) => {
      const firstName = values.first_name.trim();
      const lastName = values.last_name.trim();
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

      if (profile.user_uuid) {
        // `first_name` / `last_name` are required on the wire; validation already
        // rejects blanks, so fall back to the source value rather than sending
        // `undefined` and blanking the record.
        const userBody: UpdateUserData['body'] = {
          ...(profileSource as User),
          ...(firstName ? { first_name: firstName } : {}),
          ...(lastName ? { last_name: lastName } : {}),
          full_name: fullName || undefined,
        };

        const userResponse = await updateUser({
          path: { uuid: profile.user_uuid },
          body: userBody,
        });

        if (userResponse.error) {
          throw userResponse.error;
        }
      }

      const sharedUpdates = {
        bio: normalizeOptionalString(values.bio),
        professional_headline: normalizeOptionalString(values.professional_headline),
        website: normalizeOptionalString(values.website),
        latitude: parseCoordinate(values.latitude),
        longitude: parseCoordinate(values.longitude),
      };

      if (domain === 'instructor' && profileSource?.instructor?.uuid) {
        const body: UpdateInstructorData['body'] = {
          ...(profileSource.instructor as Instructor),
          ...sharedUpdates,
        };
        const response = await updateInstructor({
          path: { uuid: profileSource.instructor.uuid },
          body,
        });

        if (response.error) {
          throw response.error;
        }

        return;
      }

      if (domain === 'course_creator' && profileSource?.courseCreator?.uuid) {
        const body: UpdateCourseCreatorData['body'] = {
          ...(profileSource.courseCreator as CourseCreator),
          ...sharedUpdates,
        };
        const response = await updateCourseCreator({
          path: { uuid: profileSource.courseCreator.uuid },
          body,
        });

        if (response.error) {
          throw response.error;
        }

        return;
      }

      if (domain === 'student' && profileSource?.student?.uuid) {
        const body: UpdateStudentData['body'] = {
          ...(profileSource.student as Student),
          bio: sharedUpdates.bio,
        };
        const response = await updateStudent({
          path: { uuid: profileSource.student.uuid },
          body,
        });

        if (response.error) {
          throw response.error;
        }

        return;
      }

      throw new Error('This profile cannot be edited here.');
    },
    onSuccess: async (_data, values) => {
      const fullName = [values.first_name.trim(), values.last_name.trim()]
        .filter(Boolean)
        .join(' ');
      setDisplayFullName(fullName || profile.full_name || '');
      toast.success('Profile details updated successfully');
      setIsEditingDetails(false);
      await queryClient.invalidateQueries({
        queryKey: profileSource?.email ? ['profile', profileSource.email] : ['profile'],
      });
    },
    onError: (error: unknown) => {
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
    if (!canManagePhoto) return;

    if (!selectedImage) {
      toast.error('Please select an image first');
      return;
    }

    uploadProfileImageMut.mutate({
      body: { profileImage: selectedImage },
      path: { userUuid: profile.user_uuid },
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

    if (!values.first_name.trim()) {
      nextErrors.first_name = 'First name is required.';
    }

    if (!values.last_name.trim()) {
      nextErrors.last_name = 'Last name is required.';
    }

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

  const closeEditDialog = (open: boolean) => {
    setIsEditingDetails(open);
    if (!open) {
      setDetailsValues(getEditableProfileDetails(profile, profileSource));
      setDetailsErrors({});
    }
  };

  if (isLoading) {
    return (
      <div className='p-6'>
        <ProfileLayoutSkeleton />
      </div>
    );
  }

  const initials = displayFullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const bioPreview = stripHtml(profile.bio ?? profile.student_profile?.bio);
  const memberSince = parseApiDate(profile.created_date)?.format('MMM YYYY');
  const activeTab = tabs.find(tab => tab.id === activeTabId) ?? tabs[0];
  const currentTabId = activeTab?.id ?? '';

  return (
    <div className='space-y-6 font-sans'>
      <ProfileHero
        name={displayFullName}
        initials={initials}
        avatarUrl={previewUrl || profile.profile_image_url || profile.avatar_url}
        headline={profile.professional_headline}
        isOnline={profile.is_online}
        badge={headerBadge}
        location={canViewLocation ? profile.address : undefined}
        email={profile.email}
        phone={profile.phone}
        website={profile.website}
        userNo={profile.user_no}
        avatarOverlay={
          canManagePhoto ? (
            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              className='absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60 opacity-0 transition-opacity group-hover:opacity-100'
            >
              <Camera className='text-primary-foreground h-6 w-6' />
              <span className='sr-only'>Change photo</span>
            </button>
          ) : null
        }
        avatarActions={
          canManagePhoto ? (
            <>
              <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                onChange={handleImageSelect}
                className='hidden'
              />

              {selectedImage ? (
                <div className='mt-3 flex gap-2'>
                  <Button
                    size='sm'
                    variant='secondary'
                    onClick={handleUpload}
                    disabled={uploadProfileImageMut.isPending}
                    className='flex-1 text-xs'
                  >
                    <Upload
                      className={
                        uploadProfileImageMut.isPending
                          ? 'mr-1.5 h-3 w-3 animate-pulse'
                          : 'mr-1.5 h-3 w-3'
                      }
                    />
                    {uploadProfileImageMut.isPending ? 'Uploading...' : 'Upload'}
                  </Button>
                  <Button
                    size='sm'
                    variant='secondary'
                    onClick={handleCancel}
                    disabled={uploadProfileImageMut.isPending}
                  >
                    <X className='h-3 w-3' />
                    <span className='sr-only'>Discard selected photo</span>
                  </Button>
                </div>
              ) : (
                <Button
                  size='sm'
                  variant='secondary'
                  onClick={() => fileInputRef.current?.click()}
                  className='mt-3 w-full min-w-fit text-xs'
                >
                  Change photo
                </Button>
              )}
            </>
          ) : null
        }
        actions={
          canEditProfileDetails ? (
            <Button size='sm' variant='secondary' onClick={() => setIsEditingDetails(true)}>
              Edit details
            </Button>
          ) : null
        }
      />

      <ProfileStatStrip stats={stats} />

      <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]'>
        <div className='min-w-0'>
          {tabs.length > 0 ? (
            <Tabs value={currentTabId} onValueChange={setActiveTabId}>
              <TabsList className='bg-muted/50 flex h-auto flex-wrap gap-1 rounded-full p-1'>
                {tabs.map(tab => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className='data-[state=active]:bg-background data-[state=active]:text-primary rounded-full data-[state=active]:shadow-sm'
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {tabs.map(({ id, component: TabComponent }) => (
                <TabsContent key={id} value={id} className='animate-in fade-in-0 duration-200'>
                  <TabComponent
                    userUuid={profile.user_uuid}
                    domain={domain ?? 'student'}
                    sharedProfile={profile}
                    isPublic={isPublic}
                  />
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <Card>
              <CardContent className='text-muted-foreground py-10 text-center text-sm'>
                No profile sections are available for this account yet.
              </CardContent>
            </Card>
          )}
        </div>

        <ProfileSidebar
          headline={profile.professional_headline}
          website={profile.website}
          location={canViewLocation ? profile.address : undefined}
          bio={bioPreview}
          memberSince={memberSince}
        >
          {sidebar}
        </ProfileSidebar>
      </div>

      {canEditProfileDetails && (
        <EditProfileDialog
          open={isEditingDetails}
          onOpenChange={closeEditDialog}
          values={detailsValues}
          errors={detailsErrors}
          onChange={handleDetailsChange}
          onSubmit={handleSaveDetails}
          isSaving={saveProfileDetailsMut.isPending}
          supportsExtendedDetails={supportsExtendedDetails}
        />
      )}
    </div>
  );
}
