'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Camera, Globe, Mail, MapPin, Phone, Upload, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { uploadProfileImageMutation } from '../../../services/client/@tanstack/react-query.gen';
import type { ProfilePageProps } from './types';

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

export function ProfilePage({
  tabs,
  profile,
  isLoading = false,
  headerBadge,
  defaultTab,
}: ProfilePageProps) {
  const [activeTabId, setActiveTabId] = useState(defaultTab ?? tabs[0]?.id ?? '');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const activeTab = tabs.find(t => t.id === activeTabId) ?? tabs[0];
  const TabContent = activeTab?.component;

  const uploadProfileImageMut = useMutation({
    ...uploadProfileImageMutation(),
    onSuccess: () => {
      toast.success('Profile image updated successfully');
      setSelectedImage(null);
      setPreviewUrl(null);
      // Invalidate queries to refresh profile data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to upload image');
    },
  });

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setSelectedImage(file);

    // Create preview URL
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

  return (
    <div className='space-y-0 font-sans'>
      <div className='bg-card border-border rounded-2xl border p-4 sm:p-6 lg:p-7'>
        {/* Avatar + Info Row */}
        <div className='mb-4 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-start sm:gap-6'>
          {/* Avatar with Upload */}
          <div className='relative shrink-0 self-center sm:self-auto'>
            <div className='group relative'>
              <Avatar className='ring-border h-20 w-20 rounded-xl ring-2 sm:h-[90px] sm:w-[90px]'>
                <AvatarImage
                  src={previewUrl || profile?.profile_image_url || profile?.avatar_url}
                  alt={profile?.full_name}
                  className='object-cover'
                />
                <AvatarFallback className='bg-primary/10 text-primary rounded-xl text-base font-semibold sm:text-lg'>
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Upload overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className='absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 opacity-0 transition-opacity group-hover:opacity-100'
              >
                <Camera className='h-5 w-5 text-white sm:h-6 sm:w-6' />
              </button>

              {/* Online status indicator */}
              {profile.is_online && (
                <span className='bg-success border-card absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full border-2 sm:-top-1 sm:right-10 sm:h-5 sm:w-5' />
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              onChange={handleImageSelect}
              className='hidden'
            />

            {/* Upload/Cancel buttons */}
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
                className='mt-2 w-full text-xs sm:mt-3'
              >
                <Camera className='mr-1.5 h-3 w-3' />
                Change Photo
              </Button>
            )}
          </div>

          {/* Name + Meta */}
          <div className='min-w-0 flex-1'>
            {/* ID badge */}
            <div className='flex items-center gap-4'>
              <span className='text-[14px]'>User No:</span>
              <span className='bg-muted text-muted-foreground inline-block rounded-md px-2 py-0.5 font-mono text-[12px] tracking-wider sm:px-3 sm:py-1 sm:text-xs'>
                {profile.user_no}
              </span>
            </div>

            {/* Name row */}
            <div className='mb-2 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3'>
              <h1 className='text-foreground w-full truncate text-xl font-bold tracking-tight sm:text-2xl'>
                {profile.full_name}
              </h1>
              {headerBadge && <div className='shrink-0'>{headerBadge}</div>}
            </div>

            {/* Secondary meta */}
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

            {/* Contact info */}
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

        {/* Tabs - Horizontal scroll on mobile */}
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

      {/* Tab Content */}
      {TabContent && (
        <div key={activeTabId} className='animate-in fade-in-0 duration-200'>
          <TabContent userUuid={profile.user_uuid} domain={'student'} sharedProfile={profile} />
        </div>
      )}
    </div>
  );
}
