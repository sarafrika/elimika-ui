'use client';

import { CalendarDays, Mail, Phone } from 'lucide-react';
import type { ReactNode } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { formatDateOnly } from '@/lib/date';
import { generateWalletId, institutionRef } from '@/src/lib/wallet-id';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import {
  ageFromDob,
  INSTITUTION_CODE,
  rosterDisplayName,
  rosterInitials,
} from '@/src/features/organisation/groups/lib/roster';
import type { StudentGroupRosterEntry } from '@/services/client';

export type StudentDetailSheetProps = {
  entry: StudentGroupRosterEntry | null;
  onClose: () => void;
};

/**
 * Read-only student detail. House convention: read-only detail lives in a right
 * Sheet — this screen deliberately does not edit the student's profile.
 */
export function StudentDetailSheet({ entry, onClose }: StudentDetailSheetProps) {
  return (
    <Sheet open={Boolean(entry)} onOpenChange={open => !open && onClose()}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-md'>
        {entry ? <StudentDetail entry={entry} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function StudentDetail({ entry }: { entry: StudentGroupRosterEntry }) {
  const name = rosterDisplayName(entry);
  const seed = entry.student_uuid ?? name;
  const age = ageFromDob(entry.dob);
  const avatar = toAuthenticatedMediaUrl(entry.profile_image_url);

  return (
    <>
      <SheetHeader>
        <SheetTitle>Student details</SheetTitle>
        <SheetDescription>
          {entry.tier ?? 'No level'}
          {entry.stream_label ? ` · ${entry.stream_label}` : ''}
        </SheetDescription>
      </SheetHeader>

      <div className='space-y-6 px-4 pb-6'>
        <div className='flex items-center gap-4'>
          <Avatar className='h-16 w-16'>
            {avatar ? <AvatarImage src={avatar} alt='' /> : null}
            <AvatarFallback className='bg-primary/10 text-primary font-semibold'>
              {rosterInitials(entry)}
            </AvatarFallback>
          </Avatar>
          <div className='min-w-0'>
            <p className='truncate text-lg font-semibold'>{name}</p>
            <p className='text-muted-foreground text-sm'>
              {age === null ? 'Age not on record' : `Age ${age}`}
            </p>
          </div>
        </div>

        <dl className='space-y-3 text-sm'>
          <Field label='Group'>
            <div className='flex flex-wrap items-center gap-2'>
              <span className='font-medium'>{entry.group_name ?? 'Unassigned'}</span>
              {entry.stream_label ? (
                <Badge variant='outline' className='text-[10px]'>
                  {entry.stream_label}
                </Badge>
              ) : null}
            </div>
          </Field>
          <Field label='Wallet ID'>
            <span className='font-mono text-xs'>{generateWalletId(seed)}</span>
          </Field>
          <Field label='Institution Ref'>
            <span className='font-mono text-xs'>{institutionRef(INSTITUTION_CODE, seed)}</span>
          </Field>
          <Field label='Email'>
            <span className='flex items-center gap-2'>
              <Mail className='text-muted-foreground h-4 w-4' aria-hidden />
              {entry.email ?? '—'}
            </span>
          </Field>
          <Field label='Phone number'>
            <span className='flex items-center gap-2'>
              <Phone className='text-muted-foreground h-4 w-4' aria-hidden />
              {entry.phone_number ?? '—'}
            </span>
          </Field>
          <Field label='Date of birth'>{formatDateOnly(entry.dob)}</Field>
          <Field label='Joined group'>
            <span className='flex items-center gap-2'>
              <CalendarDays className='text-muted-foreground h-4 w-4' aria-hidden />
              {formatDateOnly(entry.joined_date)}
            </span>
          </Field>
        </dl>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className='space-y-0.5'>
      <dt className='text-muted-foreground text-xs'>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
