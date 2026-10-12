'use client';

import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useUserProfile } from '@/context/profile-context';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';

type WalletSection = { title: string; rows: { key: string; title: string; detail?: string | null }[] };

/** A compact read of what the course creator sees: the profile's wallet sections. */
export function WalletSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const instructor = useUserProfile()?.instructor;
  const sections: WalletSection[] = [
    {
      title: 'Education',
      rows: (instructor?.educations ?? []).map((row, index) => ({
        key: row.uuid ?? `education-${index}`,
        title: row.qualification,
        detail: [row.school_name, row.year_completed].filter(Boolean).join(' · '),
      })),
    },
    {
      title: 'Work experience',
      rows: (instructor?.experience ?? []).map((row, index) => ({
        key: row.uuid ?? `experience-${index}`,
        title: row.position,
        detail: row.organisation_name,
      })),
    },
    {
      title: 'Skills',
      rows: (instructor?.skills ?? []).map((row, index) => ({
        key: row.uuid ?? `skill-${index}`,
        title: row.skill_name,
        detail: row.proficiency_level ? String(row.proficiency_level).toLowerCase() : null,
      })),
    },
    {
      title: 'Memberships',
      rows: (instructor?.membership ?? []).map((row, index) => ({
        key: row.uuid ?? `membership-${index}`,
        title: row.organisation_name,
        detail: row.membership_number,
      })),
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-full overflow-y-auto sm:max-w-md'>
        <SheetHeader className='border-b'>
          <p className='text-primary text-xs font-semibold tracking-wider uppercase'>
            Shared with every application
          </p>
          <SheetTitle>Your skills wallet</SheetTitle>
          <SheetDescription>
            The course creator sees this when they open your application. Edit it from Skills
            wallet; changes apply to every application.
          </SheetDescription>
        </SheetHeader>
        <div className='space-y-5 px-4 pb-6'>
          {sections.map(section => (
            <section key={section.title} className='space-y-2'>
              <div className='flex items-center justify-between gap-2'>
                <h3 className='text-foreground text-sm font-semibold'>{section.title}</h3>
                <Badge variant='secondary'>{section.rows.length} items</Badge>
              </div>
              {section.rows.length === 0 ? (
                <p className='text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-sm'>
                  Nothing added yet.
                </p>
              ) : (
                <ul className='divide-y rounded-xl border'>
                  {section.rows.map(row => (
                    <li key={row.key} className='px-4 py-2.5 text-sm'>
                      <p className='text-foreground font-medium'>{row.title}</p>
                      {row.detail ? (
                        <p className='text-muted-foreground text-xs'>{row.detail}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
          <Button asChild variant='outline' className='w-full'>
            <Link href={dashboardUrl('instructor', 'skills-wallet')}>Open skills wallet</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
