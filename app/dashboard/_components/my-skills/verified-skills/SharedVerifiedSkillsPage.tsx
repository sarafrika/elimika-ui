'use client';

import { useEffect, useMemo, useState } from 'react';

import { CredentialDetailGrid } from '@/components/profile-credentials/_components/CredentialDetailGrid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useBreadcrumb } from '@/context/breadcrumb-provider';

import { VerifiedSkillCategoryCard } from './_components/VerifiedSkillCategoryCard';
import { VerifiedSkillsSidebar } from './_components/VerifiedSkillsSidebar';
import { VerifiedSkillsTopBar } from './_components/VerifiedSkillsTopBar';
import { useVerifiedSkillsContent } from './live-data';
import type { ProficiencyFilter, VerifiedSkillCategory, VerifiedSkillGroup, VerifiedSkillsRole } from './types';

type SharedVerifiedSkillsPageProps = {
  role?: VerifiedSkillsRole;
};

export function SharedVerifiedSkillsPage({ role }: SharedVerifiedSkillsPageProps) {
  const { replaceBreadcrumbs } = useBreadcrumb();
  const { categories, insights, suggestions } = useVerifiedSkillsContent(role);
  const [activeGroup, setActiveGroup] = useState<VerifiedSkillGroup>('All Skills');
  const [proficiencyFilter, setProficiencyFilter] = useState<ProficiencyFilter>('All Levels');
  const [selectedCategory, setSelectedCategory] = useState<VerifiedSkillCategory | null>(null);

  const filteredCategories = useMemo(() => {
    return categories.filter(category => {
      const matchesGroup = activeGroup === 'All Skills' || category.group === activeGroup;
      const matchesProficiency =
        proficiencyFilter === 'All Levels' || category.level === proficiencyFilter;

      return matchesGroup && matchesProficiency;
    });
  }, [activeGroup, categories, proficiencyFilter]);

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard' },
      { id: 'my-skills', title: 'My Skills', url: '/dashboard/my-skills' },
      {
        id: 'verified-skills',
        title: 'Verified Skills',
        url: '/dashboard/my-skills/verified-skills',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const report = useMemo(() => {
    const verifiedRecords = filteredCategories.reduce(
      (total, category) => total + category.records.length,
      0
    );
    const averageScore = filteredCategories.length
      ? Math.round(
          filteredCategories.reduce((total, category) => total + category.score, 0) /
            filteredCategories.length
        )
      : 0;

    return {
      verifiedRecords,
      categories: filteredCategories.length,
      averageScore,
    };
  }, [filteredCategories]);

  const selectedCategoryRecords = selectedCategory?.records ?? [];

  return (
    <main className='bg-background min-h-screen px-3 py-3 sm:px-4 lg:px-5'>
      <div className='mx-auto grid w-full max-w-[1180px] gap-4'>
        <VerifiedSkillsTopBar
          activeGroup={activeGroup}
          proficiencyFilter={proficiencyFilter}
          onGroupChange={setActiveGroup}
          onProficiencyFilterChange={setProficiencyFilter}
        />

        <section className='grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]'>
          <div className='grid items-start gap-4'>
            {filteredCategories.length > 0 ? (
              filteredCategories.map(category => (
                <VerifiedSkillCategoryCard
                  key={category.id}
                  category={category}
                  onOpenDetails={categoryItem => setSelectedCategory(categoryItem)}
                />
              ))
            ) : (
              <div className='border-border/60 bg-card rounded-lg border border-dashed p-8 text-center shadow-sm'>
                <h2 className='text-foreground text-sm font-semibold sm:text-base'>
                  No verified skills match these filters
                </h2>
                <p className='text-muted-foreground mt-2 text-xs sm:text-sm'>
                  Try another skill type or proficiency level.
                </p>
              </div>
            )}
          </div>

          <VerifiedSkillsSidebar insights={insights} suggestions={suggestions} report={report} />
        </section>
      </div>

      <Sheet
        open={!!selectedCategory}
        onOpenChange={open => {
          if (!open) setSelectedCategory(null);
        }}
      >
        <SheetContent side='right' className='flex w-full flex-col overflow-y-auto p-0 sm:max-w-[760px]'>
          {selectedCategory ? (
            <>
              <SheetHeader className='border-border/70 border-b px-6 py-5 text-left'>
                <SheetTitle className='text-2xl'>{selectedCategory.title}</SheetTitle>
                <SheetDescription>
                  Verified records and linked evidence that shape this skill group.
                </SheetDescription>
              </SheetHeader>

              <div className='space-y-5 px-6 py-5'>
                <Card className='rounded-[18px] border bg-card p-4 shadow-sm'>
                  <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
                    <StatBox label='Group' value={selectedCategory.group} />
                    <StatBox label='Level' value={selectedCategory.level} />
                    <StatBox label='Records' value={`${selectedCategory.records.length}`} />
                    <StatBox label='Average' value={`${selectedCategory.score}%`} />
                  </div>
                </Card>

                <div className='space-y-3'>
                  <div className='flex items-center justify-between gap-3'>
                    <div>
                      <h3 className='text-foreground text-lg font-semibold'>Credential details</h3>
                      <p className='text-muted-foreground text-sm'>
                        Records are listed in the order they were obtained.
                      </p>
                    </div>
                    <Badge variant='outline' className='rounded-lg px-3 py-1'>
                      {selectedCategory.records.length} item{selectedCategory.records.length === 1 ? '' : 's'}
                    </Badge>
                  </div>

                  <div className='space-y-3'>
                    {selectedCategoryRecords.map(record => (
                      <Card key={record.id} className='rounded-[16px] border bg-card p-4 shadow-sm'>
                        <div className='flex flex-wrap items-start justify-between gap-3'>
                          <div className='space-y-1'>
                            <h4 className='text-foreground font-semibold'>{record.title}</h4>
                            <p className='text-muted-foreground text-sm'>
                              {record.issuer}
                              {record.documentLabel ? ` • ${record.documentLabel}` : ''}
                            </p>
                          </div>
                          <Badge
                            variant='outline'
                            className='rounded-lg px-3 py-1 text-xs'
                          >
                            {record.status}
                          </Badge>
                        </div>

                        <div className='mt-4 grid gap-3'>
                          <div className='grid gap-3 text-sm sm:grid-cols-2'>
                            <DetailRow label='Credential' value={record.documentLabel} />
                            <DetailRow
                              label='Kind'
                              value={record.recordKind ? capitalize(record.recordKind) : 'Verified record'}
                            />
                          </div>

                          {record.recordSummary ? (
                            <div className='rounded-xl border bg-muted/20 px-3 py-2.5'>
                              <p className='text-muted-foreground text-xs uppercase tracking-wide'>
                                Summary
                              </p>
                              <p className='text-foreground mt-1 text-sm leading-6'>
                                {record.recordSummary}
                              </p>
                            </div>
                          ) : null}

                          {record.details && record.details.length > 0 ? (
                            <CredentialDetailGrid details={record.details} />
                          ) : null}

                          <div className='flex flex-wrap items-center gap-3'>
                            {record.documentUrl ? (
                              <Button asChild variant='outline' className='rounded-xl px-4'>
                                <a href={record.documentUrl} target='_blank' rel='noreferrer'>
                                  Open file
                                </a>
                              </Button>
                            ) : null}
                            <span className='text-muted-foreground text-xs'>
                              {record.timestamp ? new Date(record.timestamp).toLocaleDateString() : 'Recently'}
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <Separator />
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </main>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-xl border bg-muted/20 px-3 py-2.5'>
      <p className='text-muted-foreground text-xs uppercase tracking-wide'>{label}</p>
      <p className='text-foreground mt-1 text-sm font-medium'>{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-xl border bg-muted/20 px-3 py-2.5'>
      <p className='text-muted-foreground text-xs uppercase tracking-wide'>{label}</p>
      <p className='text-foreground mt-1 text-sm font-medium'>{value}</p>
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
