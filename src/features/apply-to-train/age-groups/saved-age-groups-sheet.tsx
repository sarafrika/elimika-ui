'use client';

import { Bookmark, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { SectionError } from '@/components/data/async-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';
import { type AgeScope, bandFits } from './model';
import { type SavedAgeGroupView, useAgeGroupPresets } from './use-saved-age-groups';

type SavedAgeGroupsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: AgeScope;
  itemNoun: string;
  /** Names already in the application, so a pick is marked as added. */
  usedNames: string[];
  onPick: (saved: SavedAgeGroupView) => void;
};

/** Saved age groups by owner: the instructor's own first, then each organisation's. */
export function SavedAgeGroupsSheet({
  open,
  onOpenChange,
  scope,
  itemNoun,
  usedNames,
  onPick,
}: SavedAgeGroupsSheetProps) {
  const { presets, query } = useAgeGroupPresets(open);
  const sections = useMemo(() => {
    const byOwner = new Map<string, { title: string; mine: boolean; rows: SavedAgeGroupView[] }>();
    for (const preset of presets) {
      const mine = preset.owner_type === 'instructor';
      const key = mine ? 'mine' : (preset.owner_uuid ?? preset.owner_name ?? 'organisation');
      const section = byOwner.get(key) ?? {
        title: mine ? 'My age groups' : (preset.owner_name ?? 'Organisation'),
        mine,
        rows: [],
      };
      section.rows.push(preset);
      byOwner.set(key, section);
    }
    return [...byOwner.values()].sort((a, b) => Number(b.mine) - Number(a.mine));
  }, [presets]);
  const used = new Set(usedNames.map(name => name.trim().toLowerCase()));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-full overflow-y-auto sm:max-w-md'>
        <SheetHeader className='border-b'>
          <p className='text-primary text-xs font-semibold tracking-wider uppercase'>
            Saved age groups
          </p>
          <SheetTitle>Add from saved</SheetTitle>
          <SheetDescription>
            Picking one copies its name and ages into this application, at 1 h a lesson. Changes
            here never touch the saved group.
          </SheetDescription>
        </SheetHeader>

        <div className='space-y-6 px-4 pb-6'>
          {query.error ? (
            <SectionError
              title='Couldn’t load your saved age groups'
              error={query.error}
              onRetry={() => void query.refetch()}
            />
          ) : query.isLoading ? (
            <div className='space-y-2'>
              {[0, 1, 2].map(row => (
                <Skeleton key={row} className='h-14 w-full rounded-xl' />
              ))}
            </div>
          ) : sections.length === 0 ? (
            <EmptyState
              variant='compact'
              icon={Bookmark}
              title='No saved age groups yet'
              description='Save a group from its card, or set them up in Settings.'
              action={
                <Button asChild variant='outline' size='sm'>
                  <Link href={dashboardUrl('instructor', 'settings?tab=age-groups')}>
                    Open settings
                  </Link>
                </Button>
              }
            />
          ) : (
            sections.map(section => (
              <section key={section.title} className='space-y-2'>
                <h3 className='text-foreground text-sm font-semibold'>{section.title}</h3>
                <ul className='space-y-2'>
                  {section.rows.map(row => {
                    const fits = bandFits(row.min_age ?? 0, row.max_age ?? 0, scope);
                    const added = used.has((row.name ?? '').trim().toLowerCase());
                    return (
                      <li
                        key={row.uuid ?? `${row.name}-${row.min_age}`}
                        className='flex items-center gap-3 rounded-xl border px-4 py-3'
                      >
                        <div className='min-w-0 flex-1'>
                          <p className='text-foreground truncate font-medium'>{row.name}</p>
                          <p className='text-muted-foreground text-sm'>
                            Ages {row.min_age}–{row.max_age}
                          </p>
                          {fits ? null : (
                            <p className='text-warning mt-1 flex items-center gap-1 text-xs font-medium'>
                              <TriangleAlert aria-hidden className='size-3' />
                              Outside this {itemNoun}’s ages; adjust after adding
                            </p>
                          )}
                        </div>
                        {added ? (
                          <Badge variant='outline'>Added</Badge>
                        ) : (
                          <Button type='button' size='sm' onClick={() => onPick(row)}>
                            Add
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
