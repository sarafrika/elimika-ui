'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Plus, Target, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Outcome = { id: number; text: string };

function readOutcomes(value: string): string[] {
  if (!/<[a-z][\s\S]*>/i.test(value)) return value.split('\n').filter(Boolean);

  const document = new DOMParser().parseFromString(value, 'text/html');
  document.querySelectorAll('br').forEach(element => element.replaceWith('\n'));
  document.querySelectorAll('li, p, div, h1, h2, h3, h4, h5, h6').forEach(element => {
    element.append('\n');
  });
  return (document.body.textContent ?? '')
    .split('\n')
    .map(text => text.trim())
    .filter(Boolean);
}

function writeOutcomes(outcomes: Outcome[]): string {
  const items = outcomes.filter(outcome => outcome.text.trim());
  if (!items.length) return '';
  return `<ul>${items
    .map(({ text }) => {
      const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<li>${escaped}</li>`;
    })
    .join('')}</ul>`;
}

export function CourseLearningOutcomes({
  value,
  onChange,
  onBlur,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
}) {
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const nextId = useRef(0);
  const lastValue = useRef<string | null>(null);

  useEffect(() => {
    if (value === lastValue.current) return;
    lastValue.current = value;
    setOutcomes(readOutcomes(value).map(text => ({ id: nextId.current++, text })));
  }, [value]);

  const update = (next: Outcome[]) => {
    setOutcomes(next);
    const serialized = writeOutcomes(next);
    lastValue.current = serialized;
    onChange(serialized);
  };

  return (
    <Card>
      <CardHeader className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-2'>
          <Target className='text-primary h-4 w-4 shrink-0' />
          <div className='space-y-1'>
            <CardTitle className='text-base'>Learning outcomes</CardTitle>
            <CardDescription>What learners can do by the end of the course.</CardDescription>
          </div>
        </div>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => {
            const outcome = { id: nextId.current++, text: '' };
            setOutcomes(previous => [...previous, outcome]);
          }}
        >
          <Plus className='h-4 w-4' />
          Add outcome
        </Button>
      </CardHeader>
      <CardContent className='flex flex-col gap-2'>
        {outcomes.length === 0 && (
          <EmptyState variant='compact' title='No outcomes yet.' className='py-5' />
        )}
        {outcomes.map((outcome, index) => (
          <div key={outcome.id} className='flex items-center gap-2'>
            <span className='bg-primary/10 text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold'>
              {index + 1}
            </span>
            <Input
              value={outcome.text}
              aria-label={`Outcome ${index + 1}`}
              aria-invalid={!!error}
              aria-describedby={error ? 'course-outcomes-error' : undefined}
              placeholder='Learners will be able to…'
              onBlur={onBlur}
              onChange={event =>
                update(
                  outcomes.map(row =>
                    row.id === outcome.id ? { ...row, text: event.target.value } : row
                  )
                )
              }
            />
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='shrink-0'
              aria-label={`Remove outcome ${index + 1}`}
              onClick={() => update(outcomes.filter(row => row.id !== outcome.id))}
            >
              <Trash2 className='text-destructive h-4 w-4' />
            </Button>
          </div>
        ))}
        {error && (
          <p id='course-outcomes-error' className='text-destructive text-sm' role='alert'>
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
