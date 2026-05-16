'use client';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { normalizeLocationType, requiresPhysicalLocation } from '@/lib/location-types';
import { Check, Copy } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { ClassDetails } from './page';

export const ClassInformationSection = ({
  data,
  onChange,
}: {
  data: ClassDetails;
  onChange: (updates: Partial<ClassDetails>) => void;
}) => {
  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const locationType = normalizeLocationType(data.location_type);
  const showPhysicalLocation = requiresPhysicalLocation(locationType);
  const showMeetingLink = locationType === 'ONLINE' || locationType === 'HYBRID';

  const inviteUrl = originUrl ? `${originUrl}/class-invite?id=${data?.uuid}` : '';

  const registrationUrl = originUrl
    ? data?.course_uuid
      ? `${originUrl}/dashboard/courses/available-classes/${data.course_uuid}/enroll?id=${data.uuid}`
      : data?.program_uuid
        ? `${originUrl}/dashboard/courses/available-programs/${data.program_uuid}/enroll?id=${data.uuid}`
        : ''
    : '';

  return (
    <Card className='overflow-hidden border pt-0 shadow-sm'>
      <div className='bg-muted/50 border-b px-4 py-4 sm:px-6'>
        <h3 className='text-foreground text-lg font-semibold'>Class Information</h3>
      </div>

      <div className='divide-y'>
        {showPhysicalLocation ? (
          <FieldRow label='Class Location'>
            <Input
              value={data.location_name}
              onChange={e => onChange({ location_name: e.target.value })}
              placeholder='Enter Class Location or Room Name'
            />
          </FieldRow>
        ) : null}

        <FieldRow label='Instructor'>
          <Input value={data?.instructorName} placeholder='Auto-filled from profile' disabled />
        </FieldRow>

        {showMeetingLink ? (
          <FieldRow label='Meeting Link'>
            <Input
              value={data.meeting_link}
              onChange={e => onChange({ meeting_link: e.target.value })}
              placeholder='Enter meeting link'
            />
          </FieldRow>
        ) : null}

        <FieldRow label='Class Invite Link'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
            <Input value={inviteUrl} readOnly className='min-w-0 flex-1' />
            <CopyInviteButton url={inviteUrl} />
          </div>
        </FieldRow>

        <FieldRow label='Class Registration Link'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
            <Input value={registrationUrl} readOnly className='min-w-0 flex-1' />
            <CopyInviteButton url={registrationUrl} />
          </div>
        </FieldRow>
      </div>
    </Card>
  );
};

const FieldRow = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => {
  return (
    <div className='grid gap-3 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(150px,0.8fr)_minmax(0,2.2fr)] lg:items-center lg:gap-4'>
      <div className='bg-muted/30 rounded-md px-3 py-2 text-sm font-semibold lg:bg-transparent lg:p-0'>
        {label}
      </div>
      <div className='min-w-0'>{children}</div>
    </div>
  );
};

const CopyInviteButton = ({ url }: { url?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!url) return;

    await navigator.clipboard.writeText(url);
    setCopied(true);

    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type='button'
      onClick={handleCopy}
      disabled={!url}
      className='inline-flex h-10 w-full items-center justify-center rounded-md border border-border bg-card px-3 text-foreground transition hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-10 sm:shrink-0'
      aria-label='Copy link'
    >
      {copied ? <Check className='text-success h-4 w-4' /> : <Copy className='h-4 w-4' />}
    </button>
  );
};
