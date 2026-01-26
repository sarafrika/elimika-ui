'use client';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { ClassDetails } from './page';

export const ClassInformationSection = ({
  data,
  onChange,
}: {
  data: ClassDetails;
  onChange: (updates: Partial<ClassDetails>) => void;
}) => {
  const inviteUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/class-invite?id=${data?.uuid}` : '';

  return (
    <Card className='overflow-hidden border shadow-sm'>
      <div className='bg-muted/50 border-b px-6 py-4'>
        <h3 className='text-foreground text-lg font-semibold'>Class Information</h3>
      </div>

      <Table>
        <TableBody>
          <TableRow className='border-b hover:bg-transparent'>
            <TableCell className='bg-muted/30 w-1/3 py-4 font-semibold'>Meeting Link</TableCell>
            <TableCell className='bg-card py-4'>
              <Input placeholder='Enter meeting link' />
            </TableCell>
          </TableRow>

          <TableRow className='border-b hover:bg-transparent'>
            <TableCell className='bg-muted/30 py-4 font-semibold'>Location</TableCell>
            <TableCell className='bg-card py-4'>
              <Input placeholder='Enter location' />
            </TableCell>
          </TableRow>

          <TableRow className='border-b hover:bg-transparent'>
            <TableCell className='bg-muted/30 py-4 font-semibold'>Classroom</TableCell>
            <TableCell className='bg-card py-4'>
              <Input
                value={data.location_name}
                onChange={e => onChange({ location_name: e.target.value })}
                placeholder='Enter classroom/meeting link'
              />
            </TableCell>
          </TableRow>

          <TableRow className='border-b hover:bg-transparent'>
            <TableCell className='bg-muted/30 py-4 font-semibold'>Instructor</TableCell>
            <TableCell className='bg-card py-4'>
              <Input value={data?.instructorName} placeholder='Auto-filled from profile' disabled />
            </TableCell>
          </TableRow>

          <TableRow className='border-b hover:bg-transparent'>
            <TableCell className='bg-muted/30 py-4 font-semibold'>Equipment</TableCell>
            <TableCell className='bg-card py-4'>
              <Input placeholder='List any required equipment' />
            </TableCell>
          </TableRow>

          <TableRow className='hover:bg-transparent'>
            <TableCell className='bg-muted/30 py-4 font-semibold'>
              Class Invite/Registration Link
            </TableCell>
            <TableCell className='bg-card flex items-center gap-2 py-4'>
              <Input value={inviteUrl} readOnly className='flex-1' />
              <CopyInviteButton url={inviteUrl} />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
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
    <button onClick={handleCopy} disabled={!url}>
      {copied ? <Check className='text-success h-4 w-4' /> : <Copy className='h-4 w-4' />}
    </button>
  );
};
