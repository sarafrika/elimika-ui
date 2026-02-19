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

  console.log(profile?.profile_image_url, 'profile here now?');

  const initials = profile.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className='space-y-0 p-6 font-sans'>
      <div className='bg-card border-border rounded-2xl border p-7'>
        {/* Avatar + Info Row */}
        <div className='mb-6 flex items-start gap-6'>
          {/* Avatar with Upload */}
          <div className='relative shrink-0'>
            <div className='group relative'>
              <Avatar className='ring-border h-[90px] w-[90px] rounded-xl ring-2'>
                <AvatarImage
                  src={previewUrl || profile?.profile_image_url || profile?.avatar_url}
                  alt={profile?.full_name}
                  className='object-cover'
                />
                <AvatarFallback className='bg-primary/10 text-primary rounded-xl text-lg font-semibold'>
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Upload overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className='absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 opacity-0 transition-opacity group-hover:opacity-100'
              >
                <Camera className='h-6 w-6 text-white' />
              </button>

              {profile.is_online && (
                <span className='bg-success border-card absolute -top-1 right-10 h-5 w-5 rounded-full border-2' />
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
              <div className='mt-3 flex gap-2'>
                <Button
                  size='sm'
                  onClick={handleUpload}
                  disabled={uploadProfileImageMut.isPending}
                  className='flex-1'
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
                className='mt-3 w-full'
              >
                <Camera className='mr-1.5 h-3 w-3' />
                Change Photo
              </Button>
            )}
          </div>

          {/* Name + Meta */}
          <div className='min-w-0 flex-1'>
            {/* Name row */}
            <div className='mb-2 flex items-center justify-between gap-3'>
              <h1 className='text-foreground truncate text-2xl font-bold tracking-tight'>
                {profile.full_name}
              </h1>
              {headerBadge && <div className='shrink-0'>{headerBadge}</div>}
            </div>

            {/* Secondary meta */}
            <div className='mb-3 flex flex-wrap gap-x-5 gap-y-2'>
              <MetaItem
                icon={<Briefcase className='text-muted-foreground h-4 w-4' />}
                value={profile.professional_headline}
              />
              <MetaItem
                icon={<MapPin className='text-muted-foreground h-4 w-4' />}
                value={profile.address}
              />
            </div>

            {/* Contact info */}
            <div className='mb-3 flex flex-wrap gap-x-5 gap-y-2'>
              <MetaItem
                icon={<Phone className='text-muted-foreground h-4 w-4' />}
                value={profile.phone}
              />
              <MetaItem
                icon={<Mail className='text-muted-foreground h-4 w-4' />}
                value={profile.email}
              />
              {profile.website && (
                <MetaItem
                  icon={<Globe className='text-muted-foreground h-4 w-4' />}
                  value={profile.website}
                />
              )}
            </div>

            {/* ID badge */}
            <span className='bg-muted text-muted-foreground inline-block rounded-md px-3 py-1 font-mono text-xs tracking-wider'>
              {profile.uuid}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className='border-border flex flex-wrap gap-1 border-t pt-4'>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={cn(
                'cursor-pointer rounded-full px-5 py-2 text-sm font-medium transition-all duration-150',
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

      {/* Tab Content */}
      {TabContent && (
        <div key={activeTabId} className='animate-in fade-in-0 duration-200'>
          <TabContent userUuid={profile.user_uuid} domain={'student'} sharedProfile={profile} />
        </div>
      )}
    </div>
  );
}
