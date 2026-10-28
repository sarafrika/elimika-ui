'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Layers, Plus, ShieldCheck, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { SectionCardSkeleton, StatCard, surfaceTheme } from '@/components/data-display';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Spinner from '@/components/ui/spinner';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import {
  listSkillLevelsOptions,
  listSkillLevelsQueryKey,
  replaceSkillLevelsMutation,
} from '@/services/client/@tanstack/react-query.gen';

type LevelRow = { key: string; name: string; min: string; achieved: boolean };

const SAMPLES = [40, 64, 72, 85];
const GRID = 'grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-2.5';
const FOUR_LEVELS: LevelRow[] = [
  { key: 'foundation', name: 'Foundation', min: '0', achieved: false },
  { key: 'developing', name: 'Developing', min: '50', achieved: false },
  { key: 'proficient', name: 'Proficient', min: '70', achieved: true },
  { key: 'advanced', name: 'Advanced', min: '85', achieved: true },
];

/** Problems with the scale, or null when it can be saved. Mirrors the server's rules. */
function scaleProblem(rows: LevelRow[]): string | null {
  if (rows.length === 0) return 'The scale needs at least one level.';
  if (rows.some(row => !row.name.trim())) return 'Every level needs a name.';
  const mins = rows.map(row => Number(row.min));
  if (
    rows.some(
      row =>
        row.min.trim() === '' ||
        !Number.isFinite(Number(row.min)) ||
        Number(row.min) < 0 ||
        Number(row.min) > 100
    )
  )
    return 'Minimums must be between 0 and 100.';
  if (!mins.includes(0)) return 'The lowest level must start at 0%.';
  if (new Set(mins).size !== mins.length) return 'Two levels share the same minimum.';
  const names = rows.map(row => row.name.trim().toLowerCase());
  if (new Set(names).size !== names.length) return 'Level names must be unique.';
  const sorted = [...rows].sort((a, b) => Number(a.min) - Number(b.min));
  const firstAchieved = sorted.findIndex(row => row.achieved);
  if (firstAchieved < 0) return 'Mark at least one level as counting as achieved.';
  if (sorted.slice(firstAchieved).some(row => !row.achieved))
    return 'Achieved levels must be the top levels.';
  return null;
}

export function SkillLevelsPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ ...listSkillLevelsOptions(), staleTime: STALE_TIMES.reference });
  const [rows, setRows] = useState<LevelRow[]>([]);
  const [score, setScore] = useState(64);
  const [confirming, setConfirming] = useState(false);
  const [saved, setSaved] = useState(false);
  const save = useMutation({
    ...replaceSkillLevelsMutation(),
    onSuccess: () => {
      setSaved(true);
      toast.success('Skill levels saved');
      void queryClient.invalidateQueries({ queryKey: listSkillLevelsQueryKey() });
    },
    onError: cause =>
      toast.error(cause instanceof Error ? cause.message : 'Unable to save skill levels'),
  });

  useEffect(() => {
    const levels = query.data?.data;
    if (levels)
      setRows(
        levels.map(level => ({
          key: level.uuid ?? level.name,
          name: level.name,
          min: String(Number(level.min_percentage)),
          achieved: level.counts_as_achieved,
        }))
      );
  }, [query.data]);

  const problem = scaleProblem(rows);
  const sorted = useMemo(() => [...rows].sort((a, b) => Number(a.min) - Number(b.min)), [rows]);
  const hit = [...sorted].reverse().find(row => score >= Number(row.min));
  const achievedMins = rows.filter(row => row.achieved).map(row => Number(row.min) || 0);
  const achievedFrom = achievedMins.length ? Math.min(...achievedMins) : undefined;
  const edit = (next: (current: LevelRow[]) => LevelRow[]) => {
    setRows(next);
    setSaved(false);
    setConfirming(false);
  };
  const update = (key: string, patch: Partial<LevelRow>) =>
    edit(current => current.map(row => (row.key === key ? { ...row, ...patch } : row)));

  return (
    <div className={`${surfaceTheme.pageWide} py-4`}>
      <div className={surfaceTheme.pageStack}>
        <PageHeader
          eyebrow='Platform'
          title='Skill levels'
          description='One scale for every program. A learner’s latest evidence score for a skill decides their level.'
        />
        {query.isLoading ? (
          <SectionCardSkeleton rows={4} />
        ) : (
          <>
            <div className='grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3.5'>
              <StatCard label='Levels' value={rows.length} icon={Layers} />
              <StatCard
                label='Achieved from'
                value={
                  <span className='font-mono'>
                    {achievedFrom === undefined ? '—' : `${achievedFrom}%`}
                  </span>
                }
                icon={ShieldCheck}
              />
              <StatCard label='Uses this scale' value='Every program' icon={Sparkles} />
            </div>
            <div className='flex flex-wrap items-start gap-3.5'>
              <section
                aria-label='Skill levels'
                className='bg-card flex min-w-0 flex-[2_1_560px] flex-col gap-3 rounded-2xl border p-5'
              >
                <div className={cn(GRID, 'text-muted-foreground text-xs font-semibold')}>
                  <span>Level name</span>
                  <span>Minimum %</span>
                  <span>Counts as achieved</span>
                  <span />
                </div>
                {rows.map(row => (
                  <div key={row.key} data-testid='level-row' className={cn(GRID, 'items-center')}>
                    <Input
                      aria-label='Level name'
                      className='h-11'
                      value={row.name}
                      onChange={event => update(row.key, { name: event.target.value })}
                    />
                    <Input
                      aria-label={`Minimum percentage for ${row.name || 'level'}`}
                      inputMode='decimal'
                      className='h-11 font-mono'
                      value={row.min}
                      onChange={event => update(row.key, { min: event.target.value })}
                    />
                    <Select
                      value={row.achieved ? 'yes' : 'no'}
                      onValueChange={value => update(row.key, { achieved: value === 'yes' })}
                    >
                      <SelectTrigger
                        className='h-11 w-full'
                        aria-label={`Counts as achieved for ${row.name || 'level'}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='yes'>Yes</SelectItem>
                        <SelectItem value='no'>No</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type='button'
                      variant='outline'
                      className='justify-self-end'
                      aria-label={`Remove ${row.name || 'level'}`}
                      onClick={() => edit(current => current.filter(item => item.key !== row.key))}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                {problem && (
                  <p role='alert' className='text-warning text-sm'>
                    {problem}
                  </p>
                )}
                <div className='flex flex-wrap justify-between gap-2.5 border-t pt-3'>
                  <div className='flex flex-wrap gap-2'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() =>
                        edit(current => [
                          ...current,
                          { key: `new-${Date.now()}`, name: '', min: '', achieved: true },
                        ])
                      }
                    >
                      <Plus className='mr-1 size-4' /> Add level
                    </Button>
                    <Button type='button' variant='outline' onClick={() => edit(() => FOUR_LEVELS)}>
                      Use 4-level proficiency scale
                    </Button>
                  </div>
                  <Button
                    type='button'
                    disabled={Boolean(problem) || save.isPending || confirming}
                    onClick={() => {
                      setSaved(false);
                      setConfirming(true);
                    }}
                  >
                    Save levels
                  </Button>
                </div>
                <p className='text-muted-foreground text-xs'>
                  Saving re-levels every learner’s current skill levels on every program. Past
                  evidence keeps the level it had when it was graded.
                </p>

                {confirming && !problem && (
                  <div
                    role='alert'
                    className='border-warning/40 bg-warning/10 flex flex-col gap-2.5 rounded-xl border px-3.5 py-3'
                  >
                    <strong className='text-warning text-sm'>Re-level every learner?</strong>
                    <span className='text-warning text-sm leading-relaxed'>
                      {achievedFrom === undefined
                        ? ''
                        : `Achieved will start at ${achievedFrom}%. `}
                      Every learner on every program gets a new current level from their latest
                      evidence, so some may move down a level and see a different result on their
                      report. Verified skills already in learners’ Skills Wallets stay there.
                    </span>
                    <div className='flex flex-wrap justify-end gap-2'>
                      <Button type='button' variant='outline' onClick={() => setConfirming(false)}>
                        Go back and check
                      </Button>
                      <Button
                        type='button'
                        className='bg-warning hover:bg-warning/90 text-warning-foreground'
                        disabled={save.isPending}
                        onClick={() =>
                          save.mutate(
                            {
                              body: rows.map(row => ({
                                name: row.name.trim(),
                                min_percentage: Number(row.min),
                                counts_as_achieved: row.achieved,
                              })),
                            },
                            { onSettled: () => setConfirming(false) }
                          )
                        }
                      >
                        {save.isPending && <Spinner />}
                        Yes, save and re-level
                      </Button>
                    </div>
                  </div>
                )}
                {saved && (
                  <p
                    role='status'
                    className='bg-primary/10 text-primary rounded-[10px] px-3.5 py-2.5 text-sm'
                  >
                    Levels saved. Current levels are being updated for every learner.
                  </p>
                )}
              </section>

              <section
                aria-label='Try an evidence score'
                className='bg-card flex min-w-[280px] flex-[1_1_300px] flex-col gap-3 rounded-2xl border p-5'
              >
                <h2 className='text-base font-semibold'>Try an evidence score</h2>
                <span className='text-muted-foreground text-sm'>Evidence score in %</span>
                <div role='group' aria-label='Sample score' className='flex flex-wrap gap-2'>
                  {SAMPLES.map(sample => (
                    <Button
                      key={sample}
                      type='button'
                      variant={sample === score ? 'default' : 'outline'}
                      className='rounded-full font-mono'
                      aria-pressed={sample === score}
                      onClick={() => setScore(sample)}
                    >
                      {sample}%
                    </Button>
                  ))}
                </div>
                <div data-testid='level-preview' className='rounded-xl border p-3.5'>
                  <div className='text-muted-foreground text-xs'>{score}% lands on</div>
                  <div className='text-[26px] font-bold'>{hit?.name || 'No level'}</div>
                  <div className='text-muted-foreground text-sm'>
                    {hit?.achieved
                      ? 'Counts as achieved. The skill goes into the learner’s Skills Wallet as verified.'
                      : 'Does not count as achieved yet.'}
                  </div>
                </div>
                <p className='text-muted-foreground text-xs'>
                  Rules: exactly one level starts at 0%, minimums are all different, and the levels
                  that count as achieved are the top ones.
                </p>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
