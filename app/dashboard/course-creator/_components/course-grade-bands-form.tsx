'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getGradeBandsOptions,
  getGradeBandsQueryKey,
  replaceGradeBandsMutation,
} from '@/services/client/@tanstack/react-query.gen';

type BandRow = { key: string; name: string; min: string };

// The colour bands in the school's Term 2 workbook (28–30, 24–27, 18–23, 12–17, 0–11 of 30) as lower bounds.
const WORKBOOK_BANDS: Array<[string, string]> = [
  ['Distinction', '93.33'],
  ['Merit', '80'],
  ['Pass', '60'],
  ['Fail', '40'],
  ['No Effort', '0'],
];
const SAMPLE_SCORES = [30, 27.5, 21, 11.5];
const LESSON_MAX = 30;

let rowSeq = 0;
const row = (name = '', min = ''): BandRow => ({ key: `band-${rowSeq++}`, name, min });

/** Validation messages for the rows, or an empty list when they can be saved. */
export function bandProblems(rows: BandRow[]): string[] {
  const problems: string[] = [];
  const names = new Set<string>();
  const mins = new Set<number>();
  for (const r of rows) {
    const name = r.name.trim().toLowerCase();
    const min = Number(r.min);
    if (!name) problems.push('Every band needs a label');
    if (r.min.trim() === '' || Number.isNaN(min) || min < 0 || min > 100)
      problems.push(`${r.name || 'A band'} needs a minimum between 0 and 100`);
    if (name && names.has(name)) problems.push(`Two bands are called ${r.name.trim()}`);
    if (!Number.isNaN(min) && r.min.trim() !== '' && mins.has(min)) problems.push(`Two bands start at ${min}%`);
    names.add(name);
    if (!Number.isNaN(min)) mins.add(min);
  }
  return [...new Set(problems)];
}

/** The band a percentage earns: the highest minimum it reaches. */
export function bandForPercentage(rows: BandRow[], pct: number) {
  return (
    [...rows]
      .filter(r => r.name.trim() && r.min.trim() !== '' && !Number.isNaN(Number(r.min)))
      .sort((a, b) => Number(b.min) - Number(a.min))
      .find(r => pct >= Number(r.min))?.name ?? null
  );
}

export function CourseGradeBandsForm({ courseUuid }: { courseUuid: string }) {
  const client = useQueryClient();
  const query = useQuery({
    ...getGradeBandsOptions({ path: { courseUuid } }),
    enabled: Boolean(courseUuid),
    staleTime: STALE_TIMES.entity,
  });
  const saved = query.data?.success === false ? undefined : query.data?.data;
  const [rows, setRows] = useState<BandRow[] | null>(null);
  const [score, setScore] = useState(27.5);
  const save = useMutation(replaceGradeBandsMutation());

  useEffect(() => {
    if (saved && rows === null) setRows(saved.map(band => row(band.name, String(band.min_percentage))));
  }, [saved, rows]);

  const current = rows ?? [];
  const problems = useMemo(() => bandProblems(current), [current]);
  const pct = Math.round((score / LESSON_MAX) * 10000) / 100;
  const earned = bandForPercentage(current, pct);

  const update = (key: string, patch: Partial<BandRow>) =>
    setRows(current.map(r => (r.key === key ? { ...r, ...patch } : r)));

  async function submit() {
    if (problems.length) return;
    const body = current.map((r, index) => ({
      name: r.name.trim(),
      min_percentage: Number(r.min),
      display_order: index,
    }));
    const result = await save.mutateAsync({ path: { courseUuid }, body });
    if (result?.success === false) {
      toast.error(result.message || 'Unable to save the grade bands');
      return;
    }
    await client.invalidateQueries({ queryKey: getGradeBandsQueryKey({ path: { courseUuid } }) });
    toast.success('Grade bands saved');
  }

  if (!courseUuid) return null;
  if (query.isLoading) return <Skeleton className='h-48 w-full' />;

  return (
    <section className='bg-card flex flex-col gap-4 rounded-xl border p-6' aria-labelledby='grade-bands-title'>
      <div>
        <h3 id='grade-bands-title' className='font-semibold'>
          Grade bands
        </h3>
        <p className='text-muted-foreground text-sm'>
          The label a learner earns once their final grade reaches each minimum. Only you, the course author,
          can change these.
        </p>
      </div>

      <div className='flex flex-wrap items-start gap-6'>
        <div className='flex min-w-0 flex-[2_1_480px] flex-col gap-2'>
          <div className='text-muted-foreground grid grid-cols-[1fr_1fr_90px_auto] gap-2 text-xs font-semibold'>
            <span>Label</span>
            <span>Minimum %</span>
            <span>Out of 30</span>
            <span />
          </div>
          {current.map(r => (
            <div key={r.key} className='grid grid-cols-[1fr_1fr_90px_auto] items-center gap-2' data-testid='band-row'>
              <Input aria-label='Band label' value={r.name} onChange={e => update(r.key, { name: e.target.value })} />
              <Input
                aria-label={`Minimum percentage for ${r.name || 'band'}`}
                type='number'
                min={0}
                max={100}
                step='any'
                className='font-mono'
                value={r.min}
                onChange={e => update(r.key, { min: e.target.value })}
              />
              <span className='text-muted-foreground font-mono text-sm'>
                {r.min.trim() !== '' && !Number.isNaN(Number(r.min))
                  ? `≥ ${(Math.round(Number(r.min) * LESSON_MAX) / 100).toFixed(1)}`
                  : '—'}
              </span>
              <Button
                type='button'
                variant='outline'
                size='icon'
                aria-label={`Remove ${r.name || 'band'}`}
                onClick={() => setRows(current.filter(x => x.key !== r.key))}
              >
                <Trash2 className='size-4' />
              </Button>
            </div>
          ))}
          {!current.length && <p className='text-muted-foreground text-sm'>No bands: learners see no grade label.</p>}
          {problems.length > 0 && (
            <ul className='text-destructive list-disc pl-5 text-sm' role='alert'>
              {problems.map(problem => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          )}
          <div className='flex flex-wrap justify-between gap-2'>
            <div className='flex flex-wrap gap-2'>
              <Button type='button' variant='outline' onClick={() => setRows([...current, row()])}>
                <Plus className='mr-1 size-4' />
                Add band
              </Button>
              <Button
                type='button'
                variant='outline'
                onClick={() => setRows(WORKBOOK_BANDS.map(([name, min]) => row(name, min)))}
              >
                Use the school&apos;s workbook bands
              </Button>
            </div>
            <Button type='button' disabled={save.isPending || problems.length > 0} onClick={() => void submit()}>
              {save.isPending && <Spinner className='size-4' />}
              Save bands
            </Button>
          </div>
        </div>

        <div className='flex flex-[1_1_260px] flex-col gap-3 rounded-xl border p-4'>
          <h4 className='text-sm font-semibold'>Try a score</h4>
          <Label className='text-muted-foreground text-xs'>Average lesson mark out of 30</Label>
          <div className='flex flex-wrap gap-2'>
            {SAMPLE_SCORES.map(value => (
              <Button
                key={value}
                type='button'
                size='sm'
                variant={value === score ? 'default' : 'outline'}
                onClick={() => setScore(value)}
              >
                {value}
              </Button>
            ))}
          </div>
          <div className='rounded-xl border p-3' data-testid='band-preview'>
            <p className='text-muted-foreground text-xs'>{pct.toFixed(2)}% earns</p>
            <p className='text-2xl font-bold'>{earned ?? 'No label'}</p>
          </div>
          <p className='text-muted-foreground text-xs'>
            Minimums are lower bounds, so a decimal such as 27.5 never falls between bands.
          </p>
          {earned && <Badge variant='success'>{earned}</Badge>}
        </div>
      </div>
    </section>
  );
}
