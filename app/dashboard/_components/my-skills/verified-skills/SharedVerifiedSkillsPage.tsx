'use client';

import { useMemo, useState } from 'react';

import { VerifiedSkillCategoryCard } from './_components/VerifiedSkillCategoryCard';
import { VerifiedSkillsSidebar } from './_components/VerifiedSkillsSidebar';
import { VerifiedSkillsTopBar } from './_components/VerifiedSkillsTopBar';
import { skillInsights, suggestedSkills, verifiedSkillCategories } from './data';
import type { ProficiencyFilter, VerifiedSkillGroup } from './types';

export function SharedVerifiedSkillsPage() {
  const [activeGroup, setActiveGroup] = useState<VerifiedSkillGroup>('All Skills');
  const [proficiencyFilter, setProficiencyFilter] = useState<ProficiencyFilter>('All Levels');

  const filteredCategories = useMemo(() => {
    return verifiedSkillCategories.filter(category => {
      const matchesGroup = activeGroup === 'All Skills' || category.group === activeGroup;
      const matchesProficiency =
        proficiencyFilter === 'All Levels' || category.level === proficiencyFilter;

      return matchesGroup && matchesProficiency;
    });
  }, [activeGroup, proficiencyFilter]);

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
                <VerifiedSkillCategoryCard key={category.id} category={category} />
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

          <VerifiedSkillsSidebar insights={skillInsights} suggestions={suggestedSkills} />
        </section>
      </div>
    </main>
  );
}
