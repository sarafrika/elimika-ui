'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import Spinner from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { User } from '@/services/client';
import {
  updateUserMutation,
  uploadProfileImageMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { useOrganisation } from '@/src/features/organisation/context/organisation-context';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, LayoutPanelLeft, ShieldCheck, Wallet } from 'lucide-react';
import Link from 'next/link';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import RichTextRenderer from '../../../../../components/editors/richTextRenders';
import ManageProfileActions from '../../../profile/add-profile/components/ManageProfileActions';
import { SettingsField } from '../_components/settings-field';
import { SettingsPageHeader } from '../_components/settings-page-header';
import { SettingsToggleRow } from '../_components/settings-toggle-row';
import {
  formatDate,
  getProfileDisplayName,
  getProfileInitials,
  getSettingsVariantConfig,
  getVariantSpecificSummary,
  normalizeUserDomainValue,
  type DashboardSettingsVariant,
} from '../settings-config';

type DashboardSettingsPageProps = {
  variant: DashboardSettingsVariant;
};

const userDetailsSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required'),
  middle_name: z.string().trim().optional(),
  last_name: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().email('Enter a valid email address'),
  phone_number: z.string().trim().optional(),
});

type UserDetailsFormValues = z.infer<typeof userDetailsSchema>;

function getMutationErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null) {
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }

    if ('error' in error && typeof error.error === 'object' && error.error !== null) {
      const firstError = Object.values(error.error).find(
        value => typeof value === 'string' && value.trim().length > 0
      );
      if (typeof firstError === 'string') {
        return firstError;
      }
    }
  }

  return 'Unable to update your profile right now. Please try again.';
}

const supportCopyByVariant: Record<DashboardSettingsVariant, string> = {
  admin: 'Platform access, policies, and approvals',
  organisation: 'Organisation records and workspace controls',
  course_creator: 'Publishing, verification, and creator support',
  instructor: 'Teaching profile and class management',
  student: 'Learning account, privacy, and billing help',
};

export function DashboardSettingsPage({ variant }: DashboardSettingsPageProps) {
  const qc = useQueryClient();
  const profile = useUserProfile();
  const organisation = useOrganisation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const updateUser = useMutation(updateUserMutation());
  const uploadProfileImage = useMutation(uploadProfileImageMutation());
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<UserDetailsFormValues>({
    resolver: zodResolver(userDetailsSchema),
    defaultValues: {
      first_name: profile?.first_name ?? '',
      middle_name: profile?.middle_name ?? '',
      last_name: profile?.last_name ?? '',
      email: profile?.email ?? '',
      phone_number: profile?.phone_number ?? '',
    },
  });

  const profileFormSnapshot = [
    profile?.uuid ?? '',
    profile?.first_name ?? '',
    profile?.middle_name ?? '',
    profile?.last_name ?? '',
    profile?.email ?? '',
    profile?.phone_number ?? '',
  ].join('|');

  useEffect(() => {
    if (isEditing) {
      return;
    }

    form.reset({
      first_name: profile?.first_name ?? '',
      middle_name: profile?.middle_name ?? '',
      last_name: profile?.last_name ?? '',
      email: profile?.email ?? '',
      phone_number: profile?.phone_number ?? '',
    });
  }, [form, isEditing, profileFormSnapshot]);

  const profileImage = profile?.profile_image_url ?? '';

  const profileName = getProfileDisplayName(profile);
  const profileInitials = getProfileInitials(profileName);
  const config = useMemo(
    () => getSettingsVariantConfig(variant, profile, organisation),
    [variant, profile, organisation]
  );
  const summaryItems = useMemo(
    () => getVariantSpecificSummary(variant, profile, organisation),
    [variant, profile, organisation]
  );

  const [toggles, setToggles] = useState(() => ({
    profileVisibility: true,
    emailAlerts: true,
    // phoneAlerts: Boolean(profile?.phone_number),
    phoneAlerts: false,
    dataSharing: variant !== 'student',
    twoFactor: variant === 'admin',
  }));

  const roleLabel = String(normalizeUserDomainValue(profile?.user_domain) ?? variant).replace(
    /_/g,
    ' '
  );
  const supportCopy = supportCopyByVariant[variant];
  const joinedDate = formatDate(profile?.created_date ?? null);
  const openProfileImagePicker = () => {
    fileInputRef.current?.click();
  };

  const handleProfileImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!profile?.uuid) {
      toast.error('User profile is not available yet.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Profile images must be smaller than 5MB.');
      return;
    }

    try {
      await uploadProfileImage.mutateAsync({
        path: { userUuid: profile.uuid },
        body: { profileImage: file },
      });
      toast.success('Profile photo updated');
      await qc.invalidateQueries({ queryKey: ['profile'] });
    } catch (error) {
      toast.error(getMutationErrorMessage(error));
    } finally {
      event.target.value = '';
    }
  };

  const handleStartEditing = () => {
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    form.reset({
      first_name: profile?.first_name ?? '',
      middle_name: profile?.middle_name ?? '',
      last_name: profile?.last_name ?? '',
      email: profile?.email ?? '',
      phone_number: profile?.phone_number ?? '',
    });
    setIsEditing(false);
  };

  const handleSaveProfile = async (values: UserDetailsFormValues) => {
    if (!profile?.uuid) {
      toast.error('User profile is not available yet.');
      return;
    }

    const dob =
      profile.dob instanceof Date ? profile.dob : profile.dob ? new Date(profile.dob) : null;

    if (!dob || Number.isNaN(dob.getTime())) {
      toast.error('We could not determine your date of birth.');
      return;
    }

    try {
      await updateUser.mutateAsync({
        path: { uuid: profile.uuid },
        body: {
          ...(profile as User),
          first_name: values.first_name.trim(),
          middle_name: values.middle_name?.trim() || undefined,
          last_name: values.last_name.trim(),
          email: values.email.trim(),
          phone_number: values.phone_number?.trim() || undefined,
          dob,
        },
      });

      toast.success('Profile updated successfully');
      setIsEditing(false);
      await qc.invalidateQueries({ queryKey: ['profile'] });
    } catch (error) {
      toast.error(getMutationErrorMessage(error));
    }
  };

  const { isSubmitting } = form.formState;

  const visibleFields = [
    {
      label: 'Full name',
      value: profileName,
      helperText: 'Primary display name from your current profile.',
    },
    {
      label: 'Email',
      value: profile?.email ?? 'Not set',
      helperText: 'Used for sign in and system notifications.',
    },
    {
      label: 'Phone number',
      value: profile?.phone_number ?? 'Not set',
      helperText: 'Shown for contact and recovery purposes.',
    },
    {
      label: 'Username',
      value: profile?.username ?? 'Not set',
      helperText: 'Your unique login handle.',
    },
  ];

  const roleFields: Record<DashboardSettingsVariant, { label: string; value: string }[]> = {
    admin: [
      { label: 'User domain', value: roleLabel },
      { label: 'Account status', value: profile?.active ? 'Active' : 'Inactive' },
      { label: 'User ID', value: profile?.uuid ?? 'Not set' },
      { label: 'Joined', value: joinedDate },
    ],
    student: [
      { label: 'Student profile', value: profile?.student?.full_name ?? profileName },
      { label: 'Guardian contact', value: profile?.student?.first_guardian_mobile ?? 'Not set' },
      { label: 'Demographic tag', value: profile?.student?.demographic_tag ?? 'Not set' },
      { label: 'Joined', value: joinedDate },
    ],
    instructor: [
      {
        label: 'Professional headline',
        value: profile?.instructor?.professional_headline ?? 'Not set',
      },
      { label: 'Website', value: profile?.instructor?.website ?? 'Not set' },
      { label: 'Verification', value: profile?.instructor?.admin_verified ? 'Verified' : 'Pending' },
      { label: 'Joined', value: joinedDate },
    ],
    organisation: [
      { label: 'Organisation', value: organisation?.name ?? 'Not set' },
      { label: 'Licence number', value: organisation?.licence_no ?? 'Not set' },
      { label: 'Address', value: organisation?.location ?? 'Not set' },
      { label: 'Joined', value: formatDate(organisation?.created_date ?? null) },
    ],
    course_creator: [
      { label: 'Headline', value: profile?.courseCreator?.professional_headline ?? 'Not set' },
      { label: 'Website', value: profile?.courseCreator?.website ?? 'Not set' },
      { label: 'Verification', value: profile?.courseCreator?.admin_verified ? 'Verified' : 'Pending' },
      { label: 'Joined', value: joinedDate },
    ],
  };

  const descriptionByVariant: Record<DashboardSettingsVariant, string> = {
    admin:
      'Keep your administrator profile and platform permissions current with the details below.',
    student:
      profile?.student?.bio ??
      'Manage your learner profile, guardian contacts, and account communication preferences.',
    instructor:
      profile?.instructor?.bio ??
      'Keep your instructor identity, expertise, and contact details aligned with your active classes.',
    organisation:
      organisation?.description ??
      'Update your organisation profile so branches, users, and approvals stay in sync.',
    course_creator:
      profile?.courseCreator?.bio ??
      'Keep your creator profile ready for publishing, collaboration, and verification.',
  };

  const accessActionHref = variant === 'admin' ? '/dashboard/system-config' : config.supportHref;

  return (
    <div className='mb-8 w-full max-w-[1500px] overflow-x-clip px-2 py-3 sm:px-3 sm:py-4 lg:px-4'>
      <div className='space-y-4 sm:space-y-5'>
        <SettingsPageHeader
          title={config.title}
          subtitle={config.subtitle}
          profileName={profileName}
          profileImage={profileImage}
          initials={profileInitials}
        />

        <Tabs defaultValue='profile' className='space-y-4'>
          <TabsList className='bg-card/80 border-border/70 h-auto w-full flex-wrap justify-start rounded-[16px] border p-1.5'>
            {config.tabs.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className='min-h-10 flex-1 rounded-[12px] px-4 py-2.5 text-[0.8rem] font-medium sm:flex-none sm:text-sm'
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value='profile' className='mt-0'>
            <div className='grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.72fr)_minmax(320px,0.88fr)]'>
              <Card className='rounded-[20px] border-border/70 p-0 shadow-sm'>
                <CardHeader className='border-border/60 border-b px-4 py-4 sm:px-5'>
                  <div className='flex flex-wrap items-start justify-between gap-4'>
                    <div className='min-w-0 space-y-1'>
                      <CardTitle className='text-base font-semibold sm:text-lg'>
                        {variant === 'organisation' ? 'Organisation Profile' : 'Profile Details'}
                      </CardTitle>
                      <div className='text-muted-foreground text-sm leading-6 sm:text-md' >
                        <RichTextRenderer htmlString={descriptionByVariant[variant]} />
                      </div>
                    </div>
                    <Badge
                      variant='outline'
                      className='rounded-md px-3 py-1 text-[10px] uppercase tracking-[0.16em]'
                    >
                      {roleLabel}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className='space-y-5 px-4 py-5 sm:px-5'>
                  <div className='flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between'>
                    <div className='flex min-w-0 items-center gap-4'>
                      <Avatar className='size-20 border border-border/70 sm:size-24'>
                        <AvatarImage src={profileImage} alt={profileName} />
                        <AvatarFallback className='bg-primary/10 text-primary text-xl font-semibold'>
                          {profileInitials}
                        </AvatarFallback>
                      </Avatar>

                      <div className='min-w-0 space-y-1'>
                        <h2 className='text-foreground truncate text-xl font-semibold sm:text-2xl'>
                          {profileName}
                        </h2>
                        <p className='text-muted-foreground truncate text-sm sm:text-base'>
                          {profile?.courseCreator?.professional_headline ??
                            profile?.instructor?.professional_headline ??
                            organisation?.description ??
                            'Community dashboard member'}
                        </p>
                        <div className='flex flex-wrap gap-2 pt-1'>
                          <Badge variant='secondary' className='rounded-md px-3 py-1 text-xs'>
                            {roleLabel}
                          </Badge>
                          <Badge variant='outline' className='rounded-md px-3 py-1 text-xs'>
                            Joined {joinedDate}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className='flex flex-wrap gap-2'>
                      <Button
                        type='button'
                        variant='outline'
                        className='h-10 rounded-md px-4 text-sm font-medium shadow-sm'
                        onClick={handleStartEditing}
                        disabled={isEditing || !profile?.uuid}
                      >
                        Edit details
                      </Button>
                      <Button
                        type='button'
                        variant='outline'
                        className='h-10 rounded-md px-4 text-sm font-medium shadow-sm'
                        onClick={openProfileImagePicker}
                        disabled={!profile?.uuid || uploadProfileImage.isPending}
                      >
                        {uploadProfileImage.isPending ? 'Uploading...' : 'Upload New'}
                      </Button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type='file'
                      accept='image/*'
                      className='hidden'
                      onChange={handleProfileImageUpload}
                    />
                  </div>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSaveProfile)} className='space-y-5'>
                      <div className='space-y-4'>
                        <div className='grid gap-4 sm:grid-cols-2'>
                          {isEditing ? (
                            <>
                              <FormField
                                control={form.control}
                                name='first_name'
                                render={({ field }) => (
                                  <FormItem className='space-y-2'>
                                    <FormLabel>First name</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder='First name'
                                        {...field}
                                        className='border-border/70 bg-background/70 h-11 rounded-md text-sm shadow-none'
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name='middle_name'
                                render={({ field }) => (
                                  <FormItem className='space-y-2'>
                                    <FormLabel>Middle name</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder='Middle name'
                                        {...field}
                                        className='border-border/70 bg-background/70 h-11 rounded-md text-sm shadow-none'
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name='last_name'
                                render={({ field }) => (
                                  <FormItem className='space-y-2'>
                                    <FormLabel>Last name</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder='Last name'
                                        {...field}
                                        className='border-border/70 bg-background/70 h-11 rounded-md text-sm shadow-none'
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name='email'
                                render={({ field }) => (
                                  <FormItem className='space-y-2'>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder='Email address'
                                        type='email'
                                        {...field}
                                        className='border-border/70 bg-background/70 h-11 rounded-md text-sm shadow-none'
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </>
                          ) : (
                            <>
                              <SettingsField
                                label='First name'
                                value={form.getValues('first_name') || 'Not set'}
                                helperText='Primary display name from your current profile.'
                              />
                              <SettingsField
                                label='Middle name'
                                value={form.getValues('middle_name') || 'Not set'}
                                helperText='Optional middle name or initial.'
                              />
                              <SettingsField
                                label='Last name'
                                value={form.getValues('last_name') || 'Not set'}
                                helperText='Family name shown in your account.'
                              />
                              <SettingsField
                                label='Email'
                                value={form.getValues('email') || 'Not set'}
                                helperText='Used for sign in and system notifications.'
                              />
                            </>
                          )}
                        </div>

                        {isEditing ? (
                          <FormField
                            control={form.control}
                            name='phone_number'
                            render={({ field }) => (
                              <FormItem className='space-y-2 sm:max-w-[calc(50%-0.5rem)]'>
                                <FormLabel>Phone number</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder='Phone number'
                                    {...field}
                                    className='border-border/70 bg-background/70 h-11 rounded-md text-sm shadow-none'
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : (
                          <div className='sm:max-w-[calc(50%-0.5rem)]'>
                            <SettingsField
                              label='Phone number'
                              value={form.getValues('phone_number') || 'Not set'}
                              helperText='Shown for contact and recovery purposes.'
                            />
                          </div>
                        )}
                      </div>

                      <SettingsField
                        label='Username'
                        value={profile?.username ?? 'Not set'}
                        helperText='Your unique login handle.'
                      />

                      <div className='grid gap-4 sm:grid-cols-2'>
                        {roleFields[variant].map(field => (
                          <SettingsField key={field.label} label={field.label} value={field.value} />
                        ))}
                      </div>

                      <SettingsField
                        label={
                          variant === 'organisation' ? 'Organisation description' : 'Bio / description'
                        }
                        value={
                          variant === 'organisation'
                            ? organisation?.description ?? 'Not set'
                            : profile?.student?.bio ??
                            profile?.instructor?.bio ??
                            profile?.courseCreator?.bio ??
                            profile?.full_name ??
                            'Not set'
                        }
                        multiline
                      />

                      <div className='flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-end'>
                        <Button
                          type='button'
                          variant='outline'
                          className='h-10 min-w-[140px] rounded-md px-4 text-sm'
                          onClick={handleCancelEditing}
                          disabled={!isEditing}
                        >
                          Cancel
                        </Button>

                        <Button
                          type='submit'
                          className='h-10 min-w-[140px] rounded-md px-4 text-sm'
                          disabled={!isEditing || updateUser.isPending || isSubmitting}
                        >
                          {updateUser.isPending || isSubmitting ? (
                            <span className='flex items-center gap-2'>
                              <Spinner className='h-4 w-4' />
                              Saving...
                            </span>
                          ) : (
                            'Save Changes'
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>

                </CardContent>
              </Card>

              <div className='flex min-w-0 flex-col gap-4'>
                <Card className='rounded-[20px] border-border/70 p-0 shadow-sm'>
                  <CardHeader className='border-border/60 border-b px-4 py-4 sm:px-5'>
                    <CardTitle className='flex items-center gap-2 text-base font-semibold sm:text-lg'>
                      <Wallet className='text-primary size-4 sm:size-5' />
                      {variant === 'admin' ? 'Wallet Rules & Limits' : 'Account Access'}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className='space-y-4 px-4 py-5 sm:px-5'>
                    <div className='flex items-center justify-between gap-4 rounded-[16px] border border-border/70 p-4'>
                      <div className='min-w-0'>
                        <p className='text-sm font-semibold text-foreground'>Current status</p>
                        <p className='text-muted-foreground text-xs sm:text-sm'>
                          {profile?.active
                            ? 'Your account is active and ready to use.'
                            : 'Your account is currently inactive.'}
                        </p>
                      </div>
                      <Badge
                        variant={profile?.active ? 'success' : 'secondary'}
                        className='rounded-md px-3 py-1 text-xs'
                      >
                        {profile?.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className='grid gap-3'>
                      {summaryItems.map(item => (
                        <div
                          key={item.label}
                          className='flex items-start justify-between gap-4 rounded-[16px] border border-border/70 px-4 py-3.5'
                        >
                          <div className='min-w-0'>
                            <p className='text-[0.78rem] font-medium text-muted-foreground sm:text-sm'>
                              {item.label}
                            </p>
                            <p className='text-sm font-semibold text-foreground sm:text-base'>
                              {item.value}
                            </p>
                          </div>
                          <ChevronRight className='text-muted-foreground mt-0.5 size-4 shrink-0' />
                        </div>
                      ))}
                    </div>

                    <Separator className='bg-border/70' />

                    <div className='space-y-3'>
                      <SettingsToggleRow
                        title='Email updates'
                        description='Receive inbox updates for activity, approvals, and account changes.'
                        enabled={toggles.emailAlerts}
                        onToggle={next => setToggles(prev => ({ ...prev, emailAlerts: next }))}
                      />
                      <SettingsToggleRow
                        title='Phone alerts'
                        description='Allow SMS or phone-based reminders when your profile includes a mobile number.'
                        enabled={toggles.phoneAlerts}
                        onToggle={next => setToggles(prev => ({ ...prev, phoneAlerts: next }))}
                      />
                      <SettingsToggleRow
                        title='Profile visibility'
                        description='Show this account in internal directories and collaboration lists.'
                        enabled={toggles.profileVisibility}
                        onToggle={next => setToggles(prev => ({ ...prev, profileVisibility: next }))}
                      />
                      <SettingsToggleRow
                        title='Data sharing'
                        description='Share profile details with connected workspace tools and approved collaborators.'
                        enabled={toggles.dataSharing}
                        onToggle={next => setToggles(prev => ({ ...prev, dataSharing: next }))}
                      />
                      <SettingsToggleRow
                        title='Two-factor authentication'
                        description='Add an extra login step for stronger account protection.'
                        enabled={toggles.twoFactor}
                        badgeLabel='Security'
                        onToggle={next => setToggles(prev => ({ ...prev, twoFactor: next }))}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className='rounded-[20px] border-border/70 p-0 shadow-sm'>
                  <CardHeader className='border-border/60 border-b px-4 py-4 sm:px-5'>
                    <CardTitle className='flex items-center gap-2 text-base font-semibold sm:text-lg'>
                      <ShieldCheck className='text-primary size-4 sm:size-5' />
                      {variant === 'admin' || variant === 'organisation'
                        ? 'Roles & Permissions'
                        : 'Quick Links'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3 px-4 py-5 sm:px-5'>
                    {config.accessItems.map(item => (
                      <div
                        key={item.title}
                        className='flex items-start justify-between gap-4 rounded-[16px] border border-border/70 px-4 py-3.5'
                      >
                        <div className='min-w-0'>
                          <p className='text-sm font-semibold text-foreground'>{item.title}</p>
                          <p className='text-muted-foreground text-xs leading-5 sm:text-sm'>
                            {item.description}
                          </p>
                        </div>
                        {item.href ? (
                          <Button asChild size='icon' variant='ghost' className='shrink-0 rounded-md'>
                            <Link href={item.href}>
                              <ChevronRight className='size-4' />
                            </Link>
                          </Button>
                        ) : (
                          <LayoutPanelLeft className='text-muted-foreground mt-1 size-4 shrink-0' />
                        )}
                      </div>
                    ))}

                    <Button
                      asChild
                      variant='outline'
                      className='mt-2 h-10 w-full rounded-md border-dashed text-sm font-medium'
                    >
                      <Link href={accessActionHref}>
                        Open {variant === 'admin' ? 'system config' : 'help center'}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value='access' className='mt-0'>
            <Card className='rounded-[20px] border-border/70 p-0 shadow-sm'>
              <CardHeader className='border-border/60 border-b px-4 py-4 sm:px-5'>
                <CardTitle className='text-base font-semibold sm:text-lg'>
                  Access
                </CardTitle>
              </CardHeader>

              <CardContent className='px-4 py-5 sm:px-5'>
                <div className='flex min-h-[320px] items-center justify-center rounded-[16px] border border-dashed border-border/70 bg-muted/20'>
                  <p className='text-sm text-muted-foreground'>
                    No access settings available yet.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='support' className='mt-0'>
            <div className='grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]'>
              <Card className='rounded-[20px] border-border/70 p-0 shadow-sm'>
                <CardHeader className='border-border/60 border-b px-4 py-4 sm:px-5'>
                  <CardTitle className='text-base font-semibold sm:text-lg'>Support details</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4 px-4 py-5 sm:px-5'>
                  <SettingsField
                    label='Support focus'
                    value={supportCopy}
                    helperText='This helps direct the right team to the right issue faster.'
                  />
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <SettingsField label='Joined on' value={joinedDate} />
                    <SettingsField label='Role' value={roleLabel} />
                  </div>
                </CardContent>
              </Card>

              <div className='flex flex-col gap-4'>
                <Card className='rounded-[20px] border-border/70 p-0 shadow-sm'>
                  <CardHeader className='border-border/60 border-b px-4 py-4 sm:px-5'>
                    <CardTitle className='text-base font-semibold sm:text-lg'>Security snapshot</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3 px-4 py-5 sm:px-5'>
                    <div className='flex items-center justify-between rounded-[16px] border border-border/70 px-4 py-3'>
                      <div>
                        <p className='text-sm font-semibold text-foreground'>Two-factor auth</p>
                        <p className='text-muted-foreground text-xs sm:text-sm'>
                          Recommended for all accounts.
                        </p>
                      </div>
                      <Switch
                        checked={toggles.twoFactor}
                        onCheckedChange={next => setToggles(prev => ({ ...prev, twoFactor: next }))}
                      />
                    </div>
                    <div className='flex items-center justify-between rounded-[16px] border border-border/70 px-4 py-3'>
                      <div>
                        <p className='text-sm font-semibold text-foreground'>Email updates</p>
                        <p className='text-muted-foreground text-xs sm:text-sm'>
                          Stay informed on account changes.
                        </p>
                      </div>
                      <Switch
                        checked={toggles.emailAlerts}
                        onCheckedChange={next => setToggles(prev => ({ ...prev, emailAlerts: next }))}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className='rounded-[20px] border-border/70 p-0 shadow-sm'>
                  <CardHeader className='border-border/60 border-b px-4 py-4 sm:px-5'>
                    <CardTitle className='text-base font-semibold sm:text-lg'>
                      Support widget preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='px-4 py-5 sm:px-5'>
                    <div className='rounded-[18px] border border-dashed border-border/70 p-4'>
                      <p className='text-sm font-semibold text-foreground'>Need Help?</p>
                      <p className='text-muted-foreground mt-1 text-sm leading-6'>
                        The sidebar widget mirrors this support entry point so help is always close at hand.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value='advanced-settings' className='mt-0'>
            <>
              <div className='grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]'>
                <Card className='rounded-[20px] border-border/70 p-0 shadow-sm'>
                  <CardHeader className='border-border/60 border-b px-4 py-4 sm:px-5'>
                    <CardTitle className='text-base font-semibold sm:text-lg'>
                      Advanced preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4 px-4 py-5 sm:px-5'>
                    <div className='grid gap-4 sm:grid-cols-2'>
                      <SettingsField
                        label='Default timezone'
                        value='Africa/Lagos'
                        helperText='Used for scheduled actions and time-based notifications.'
                      />
                      <SettingsField
                        label='Language'
                        value='English'
                        helperText='Controls the interface language for this profile.'
                      />
                    </div>

                    <div className='grid gap-3'>
                      <SettingsToggleRow
                        title='Weekly digest'
                        description='Receive a weekly summary of activity and important updates.'
                        enabled
                        onToggle={() => undefined}
                      />
                      <SettingsToggleRow
                        title='Preview mode'
                        description='Keep draft changes visible only to you until you publish them.'
                        enabled={variant !== 'student'}
                        onToggle={() => undefined}
                      />
                      <SettingsToggleRow
                        title='Data export reminders'
                        description='Show reminders when account exports or compliance actions are available.'
                        enabled={variant === 'admin' || variant === 'organisation'}
                        onToggle={() => undefined}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className='flex min-w-0 flex-col gap-4'>
                  <Card className='rounded-[20px] border-border/70 p-0 shadow-sm'>
                    <CardHeader className='border-border/60 border-b px-4 py-4 sm:px-5'>
                      <CardTitle className='text-base font-semibold sm:text-lg'>
                        Session controls
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3 px-4 py-5 sm:px-5'>
                      <SettingsField
                        label='Last active'
                        value={formatDate(profile?.updated_date ?? null)}
                        helperText='Most recent account activity recorded on this profile.'
                      />
                      <SettingsField
                        label='Account source'
                        value={variant === 'organisation' ? 'Organisation workspace' : 'User profile'}
                        helperText='Shows where these settings are being managed from.'
                      />
                      <SettingsField
                        label='Support route'
                        value={config.supportHref}
                        helperText='Where advanced issues should be routed from this tab.'
                      />
                    </CardContent>
                  </Card>

                  <Card className='rounded-[20px] border-border/70 p-0 shadow-sm'>
                    <CardHeader className='border-border/60 border-b px-4 py-4 sm:px-5'>
                      <CardTitle className='text-base font-semibold sm:text-lg'>
                        Recovery actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3 px-4 py-5 sm:px-5'>
                      <Button variant='outline' className='h-10 w-full rounded-md border-dashed text-sm'>
                        Reset advanced preferences
                      </Button>
                      <Button variant='outline' className='h-10 w-full rounded-md text-sm'>
                        View account activity
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Card className='rounded-[20px] border-border/70 mt-6 overflow-hidden p-6 shadow-sm'>
                <ManageProfileActions />
              </Card>
            </>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
