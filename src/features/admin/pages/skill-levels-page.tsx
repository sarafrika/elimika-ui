'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { SectionCard, SectionCardSkeleton, surfaceTheme } from '@/components/data-display';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { STALE_TIMES } from '@/lib/query-client';
import {
  listSkillLevelsOptions,
  listSkillLevelsQueryKey,
  replaceSkillLevelsMutation,
} from '@/services/client/@tanstack/react-query.gen';

type LevelRow = { key: string; name: string; min: string; achieved: boolean };

const SAMPLES = [45, 62, 74, 90];
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
  const [score, setScore] = useState(74);
  const save = useMutation({
    ...replaceSkillLevelsMutation(),
    onSuccess: () => {
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
  const update = (key: string, patch: Partial<LevelRow>) =>
    setRows(current => current.map(row => (row.key === key ? { ...row, ...patch } : row)));

  return (
    <div className={`${surfaceTheme.pageWide} py-4`}>
      <div className={surfaceTheme.pageStack}>
        <PageHeader
          eyebrow='Platform'
          title='Skill levels'
          description='The scale every programme uses to turn a learner’s skill evidence into a level. Levels marked “counts as achieved” are added to the learner’s skills wallet.'
        />
        {query.isLoading ? (
          <SectionCardSkeleton rows={4} />
        ) : (
          <div className='flex flex-wrap items-start gap-4'>
            <SectionCard title='Levels' className='min-w-0 flex-[2] basis-[520px]'>
              <div className='space-y-3' role='group' aria-label='Skill levels'>
                <div className='text-muted-foreground grid grid-cols-[1fr_8rem_10rem_auto] gap-3 text-xs font-semibold'>
                  <span>Level name</span>
                  <span>Minimum %</span>
                  <span>Counts as achieved</span>
                  <span />
                </div>
                {rows.map(row => (
                  <div
                    key={row.key}
                    data-testid='level-row'
                    className='grid grid-cols-[1fr_8rem_10rem_auto] items-center gap-3'
                  >
                    <Input
                      aria-label='Level name'
                      value={row.name}
                      onChange={event => update(row.key, { name: event.target.value })}
                    />
                    <Input
                      aria-label={`Minimum percentage for ${row.name || 'level'}`}
                      inputMode='decimal'
                      className='font-mono'
                      value={row.min}
                      onChange={event => update(row.key, { min: event.target.value })}
                    />
                    <label className='flex min-h-10 items-center gap-2 text-sm'>
                      <Checkbox
                        checked={row.achieved}
                        onCheckedChange={checked => update(row.key, { achieved: checked === true })}
                        aria-label={`${row.name || 'Level'} counts as achieved`}
                      />
                      {row.achieved ? 'Yes' : 'No'}
                    </label>
                    <Button
                      type='button'
                      variant='outline'
                      aria-label={`Remove ${row.name || 'level'}`}
                      onClick={() =>
                        setRows(current => current.filter(item => item.key !== row.key))
                      }
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
                <div className='flex flex-wrap justify-between gap-2'>
                  <div className='flex flex-wrap gap-2'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() =>
                        setRows(current => [
                          ...current,
                          { key: `new-${Date.now()}`, name: '', min: '', achieved: true },
                        ])
                      }
                    >
                      <Plus className='mr-1 size-4' /> Add level
                    </Button>
                    <Button type='button' variant='outline' onClick={() => setRows(FOUR_LEVELS)}>
                      Use 4-level proficiency scale
                    </Button>
                  </div>
                  <Button
                    type='button'
                    disabled={Boolean(problem) || save.isPending}
                    onClick={() =>
                      save.mutate({
                        body: rows.map(row => ({
                          name: row.name.trim(),
                          min_percentage: Number(row.min),
                          counts_as_achieved: row.achieved,
                        })),
                      })
                    }
                  >
                    Save levels
                  </Button>
                </div>
                <ul className='text-muted-foreground list-disc space-y-1 pl-5 text-xs'>
                  <li>One level must start at 0%, and minimums must be unique.</li>
                  <li>Achieved levels must be the top levels.</li>
                  <li>
                    Changes re-level every learner’s latest evidence. Earlier history keeps the
                    level it was given.
                  </li>
                </ul>
              </div>
            </SectionCard>
            <SectionCard title='Try an evidence score' className='min-w-[280px] flex-1'>
              <div className='space-y-3'>
                <div className='flex flex-wrap gap-2'>
                  {SAMPLES.map(sample => (
                    <Button
                      key={sample}
                      type='button'
                      size='sm'
                      variant={sample === score ? 'default' : 'outline'}
                      aria-pressed={sample === score}
                      onClick={() => setScore(sample)}
                    >
                      {sample}%
                    </Button>
                  ))}
                </div>
                <div data-testid='level-preview' className='rounded-md border p-4'>
                  <div className='text-muted-foreground text-xs'>{score}% evidence is</div>
                  <div className='text-2xl font-bold'>{hit?.name || 'No level'}</div>
                  <div className='text-muted-foreground text-sm'>
                    {hit?.achieved ? 'Counts as achieved · added to wallet' : 'Not achieved yet'}
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  );
}
