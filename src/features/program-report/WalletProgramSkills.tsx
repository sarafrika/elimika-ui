'use client';

import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, Sparkles, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { StatCard, StatusBadge, surfaceTheme } from '@/components/data-display';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudent } from '@/context/student-context';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import { listSkillsOptions } from '@/services/client/@tanstack/react-query.gen';
import type { UserSkill } from '@/services/client/types.gen';
import { EvidenceTable } from './ProgramReportCard';
import { levelTone, sortedHistory } from './report-model';
import { percent, shortDate, useProgramReport } from './use-program-report';

/** Verified by a program's grading, rather than typed in by the learner. */
export function isProgramVerified(skill: UserSkill) {
  return (
    (skill.verification_status ?? '').toUpperCase() === 'VERIFIED' &&
    Boolean(skill.source_program_uuid)
  );
}

/** The wallet's My Skills: the learner's own skills, program-verified ones with their evidence. */
export function WalletProgramSkills() {
  const query = useQuery({ ...listSkillsOptions(), staleTime: STALE_TIMES.entity });
  const [openSkill, setOpenSkill] = useState<UserSkill | null>(null);
  if (query.isLoading)
    return (
      <div className={surfaceTheme.cardGrid}>
        <Skeleton className='h-28' />
        <Skeleton className='h-28' />
        <Skeleton className='h-28' />
      </div>
    );
  const skills = query.data?.success === false ? [] : (query.data?.data ?? []);
  const verified = skills.filter(isProgramVerified);
  const own = skills.filter(skill => !isProgramVerified(skill));

  return (
    <section className='flex flex-col gap-4' aria-label='My skills' data-testid='wallet-skills'>
      <div className={surfaceTheme.statGrid}>
        <StatCard label='Skills' value={skills.length} icon={Sparkles} />
        <StatCard label='Verified from programs' value={verified.length} icon={BadgeCheck} />
        <StatCard label='Added by you' value={own.length} icon={UserRound} tone='neutral' />
      </div>
      {skills.length === 0 ? (
        <EmptyState
          variant='compact'
          title='No skills yet'
          description='Skills you prove in a program are added here as verified.'
        />
      ) : (
        <ul className={surfaceTheme.cardGrid}>
          {[...verified, ...own].map(skill => {
            const fromProgram = isProgramVerified(skill);
            return (
              <li
                key={skill.uuid ?? skill.skill_name}
                data-testid='wallet-skill'
                className={cn(surfaceTheme.cardPadded, 'flex flex-col gap-2')}
              >
                <div className='flex items-start justify-between gap-2'>
                  <h3 className='font-semibold'>{skill.skill_name}</h3>
                  <StatusBadge
                    tone={fromProgram ? 'info' : 'neutral'}
                    label={fromProgram ? 'Verified' : 'Added by you'}
                  />
                </div>
                <span className='text-muted-foreground text-sm'>
                  {fromProgram
                    ? `Verified · from ${skill.source_program_title ?? 'a program'}${
                        skill.verified_at ? ` · ${shortDate(skill.verified_at)}` : ''
                      }`
                    : `Added ${shortDate(skill.created_date) || 'by you'} · not verified`}
                </span>
                {fromProgram && (
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='self-start'
                    aria-label={`Evidence for ${skill.skill_name}`}
                    onClick={() => setOpenSkill(skill)}
                  >
                    Evidence
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p className='text-muted-foreground text-xs'>
        Skills that are still developing stay on the program report until they reach Achieved.
      </p>
      {openSkill && <SkillEvidenceSheet skill={openSkill} onClose={() => setOpenSkill(null)} />}
    </section>
  );
}

/** Every graded piece of work behind a verified skill, read from its program report. */
function SkillEvidenceSheet({ skill, onClose }: { skill: UserSkill; onClose: () => void }) {
  const student = useStudent();
  const programUuid = skill.source_program_uuid ?? '';
  const query = useProgramReport(programUuid, student?.uuid);
  const report = query.data?.success === false ? undefined : query.data?.data;
  const match = (report?.skills ?? []).find(
    row =>
      (skill.skill_uuid && row.skill_uuid === skill.skill_uuid) ||
      row.skill_name?.trim().toLowerCase() === skill.skill_name.trim().toLowerCase()
  );
  const history = match ? sortedHistory(match) : [];

  return (
    <Sheet open onOpenChange={open => !open && onClose()}>
      <SheetContent className='w-full sm:max-w-[760px]'>
        <SheetHeader className='shrink-0 border-b pr-12'>
          <SheetTitle>{skill.skill_name} · Evidence</SheetTitle>
          <SheetDescription>
            Every graded piece of work linked to this skill. The latest one sets your level.
          </SheetDescription>
        </SheetHeader>
        <div
          className='flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5'
          data-testid='skill-evidence-sheet'
        >
          {query.isLoading ? (
            <Skeleton className='h-40 w-full' />
          ) : !match ? (
            <p className='text-muted-foreground text-sm'>
              The evidence for this skill isn&apos;t available right now.
            </p>
          ) : (
            <>
              <div
                className={cn(
                  surfaceTheme.cardMuted,
                  'flex items-center justify-between gap-3 p-4'
                )}
              >
                <div className='flex flex-col gap-1'>
                  <span className='text-muted-foreground text-xs'>Current level</span>
                  <StatusBadge
                    className='self-start'
                    tone={levelTone(match.level_name, match.counts_as_achieved)}
                    label={match.level_name ?? 'Not assessed yet'}
                  />
                  <span className='text-muted-foreground text-xs'>
                    Verified from {skill.source_program_title ?? report?.program_title}
                    {skill.verified_at ? ` on ${shortDate(skill.verified_at)}` : ''}
                  </span>
                </div>
                <span className='text-2xl font-semibold tabular-nums'>{percent(match.score)}</span>
              </div>
              {history.length > 0 ? (
                <EvidenceTable history={history} />
              ) : (
                <p className='text-muted-foreground text-sm'>No evidence yet.</p>
              )}
            </>
          )}
          <p className='text-muted-foreground text-xs'>
            History is never removed. If work is regraded, the new score replaces the old one and
            both stay listed. Once verified, the skill stays in your wallet.
          </p>
        </div>
        <SheetFooter className='shrink-0 flex-row justify-end border-t'>
          <Button asChild variant='outline'>
            <Link
              href={`/dashboard/student/programs/${encodeURIComponent(programUuid)}?tab=assessment`}
            >
              Open program report
            </Link>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
