'use client';

import { Plus } from 'lucide-react';
import { useRef } from 'react';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ClassMarketplaceJob } from '@/services/client/types.gen';

type Suggestion = { label: string; prompt: string };

function suggestionsFor(job: ClassMarketplaceJob, contentTitle: string | null): Suggestion[] {
  const learners = job.target_groups?.filter(Boolean) ?? [];
  const content = contentTitle || (job.program_uuid ? 'this program' : 'this course');
  return [
    {
      label: job.program_uuid ? 'Times you’ve taught this program' : 'Times you’ve taught this course',
      prompt: `I’ve taught ${content} before: `,
    },
    {
      label: learners.length ? `Experience with ${learners.join(', ').toLowerCase()}` : 'Experience with learners like these',
      prompt: learners.length
        ? `My experience teaching ${learners.join(', ').toLowerCase()}: `
        : 'My experience with learners like these: ',
    },
    job.location_type === 'ONLINE'
      ? { label: 'How you keep online sessions engaging', prompt: 'How I keep online sessions engaging: ' }
      : { label: 'How you’d run the sessions on site', prompt: 'How I’d run the sessions on site: ' },
  ];
}

export function NoteStep({
  job,
  organisationName,
  contentTitle,
  note,
  onNoteChange,
}: {
  job: ClassMarketplaceJob;
  organisationName: string;
  contentTitle: string | null;
  note: string;
  onNoteChange: (note: string) => void;
}) {
  const textarea = useRef<HTMLTextAreaElement>(null);

  const append = (prompt: string) => {
    const next = note.trim() ? `${note.trimEnd()}\n${prompt}` : prompt;
    onNoteChange(next);
    requestAnimationFrame(() => {
      const element = textarea.current;
      if (!element) return;
      element.focus();
      element.setSelectionRange(next.length, next.length);
    });
  };

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col gap-2'>
        <Label htmlFor='apply-note'>
          Note to {organisationName}
          <span className='text-muted-foreground font-normal'>(optional)</span>
        </Label>
        <Textarea
          ref={textarea}
          id='apply-note'
          value={note}
          onChange={event => onNoteChange(event.target.value)}
          placeholder='Say why you’re a good fit for this class.'
          aria-describedby='apply-note-hint'
          className='min-h-40'
        />
        <p id='apply-note-hint' className='text-muted-foreground text-xs'>
          A short note helps them decide. They see it with your profile and your approved rate.
        </p>
      </div>
      <div className='flex flex-col gap-2'>
        <p className='text-muted-foreground text-[13px] font-medium'>Things worth mentioning</p>
        <div className='flex flex-wrap gap-2'>
          {suggestionsFor(job, contentTitle).map(suggestion => (
            <button
              key={suggestion.label}
              type='button'
              onClick={() => append(suggestion.prompt)}
              className='border-border/70 bg-muted/40 text-foreground hover:bg-muted focus-visible:ring-ring/50 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] outline-none focus-visible:ring-[3px]'
            >
              <Plus aria-hidden className='size-3.5' />
              {suggestion.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
