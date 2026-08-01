'use client';

import { Eye, Trash2 } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { generateWalletId, institutionRef } from '@/src/lib/wallet-id';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import {
  ageFromDob,
  INSTITUTION_CODE,
  rosterDisplayName,
  rosterInitials,
} from '@/src/features/organisation/groups/lib/roster';
import type { StudentGroupRosterEntry } from '@/services/client';

export type RosterTableProps = {
  entries: StudentGroupRosterEntry[];
  /** 0-based index of the first row on this page, so `#` counts across pages. */
  startIndex: number;
  onView: (entry: StudentGroupRosterEntry) => void;
  onRemove: (entry: StudentGroupRosterEntry) => void;
};

export function RosterTable({ entries, startIndex, onView, onRemove }: RosterTableProps) {
  return (
    <div className='overflow-x-auto'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-12'>#</TableHead>
            <TableHead>Student Name</TableHead>
            <TableHead>Wallet ID</TableHead>
            <TableHead>Institution Ref</TableHead>
            <TableHead>Group</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone Number</TableHead>
            <TableHead>Age</TableHead>
            <TableHead className='text-right'>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry, index) => {
            const name = rosterDisplayName(entry);
            const seed = entry.student_uuid ?? name;
            const age = ageFromDob(entry.dob);
            const avatar = toAuthenticatedMediaUrl(entry.profile_image_url);

            return (
              <TableRow key={`${entry.student_uuid}-${entry.group_uuid}`}>
                <TableCell className='text-muted-foreground'>{startIndex + index + 1}</TableCell>
                <TableCell>
                  <div className='flex items-center gap-3'>
                    <Avatar className='h-9 w-9'>
                      {avatar ? <AvatarImage src={avatar} alt='' /> : null}
                      <AvatarFallback className='bg-primary/10 text-primary text-xs font-semibold'>
                        {rosterInitials(entry)}
                      </AvatarFallback>
                    </Avatar>
                    <span className='font-medium'>{name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className='font-mono text-xs'>{generateWalletId(seed)}</span>
                </TableCell>
                <TableCell>
                  <span className='text-muted-foreground font-mono text-xs'>
                    {institutionRef(INSTITUTION_CODE, seed)}
                  </span>
                </TableCell>
                <TableCell className='text-sm'>
                  <span className='font-medium'>{entry.group_name ?? '—'}</span>
                  {entry.stream_label ? (
                    <span className='text-muted-foreground'> · {entry.stream_label}</span>
                  ) : null}
                </TableCell>
                <TableCell className='text-muted-foreground text-sm'>
                  {entry.email ?? '—'}
                </TableCell>
                <TableCell className='text-sm'>{entry.phone_number ?? '—'}</TableCell>
                <TableCell>{age ?? '—'}</TableCell>
                <TableCell>
                  <div className='flex items-center justify-end gap-1'>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='text-primary hover:text-primary h-8 w-8'
                      onClick={() => onView(entry)}
                      aria-label={`View ${name}`}
                    >
                      <Eye className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='text-destructive hover:text-destructive h-8 w-8'
                      onClick={() => onRemove(entry)}
                      aria-label={`Remove ${name} from their group`}
                      disabled={!entry.group_uuid || !entry.student_uuid}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
