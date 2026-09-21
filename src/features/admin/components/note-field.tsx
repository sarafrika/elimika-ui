'use client';

import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor-lazy';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface NoteFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Shown under the field, e.g. where the note ends up. */
  helper?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

/**
 * Every note, reason and piece of feedback an admin types uses the rich text editor,
 * so a decision can carry structure — a list of what was checked, a link to the source.
 */
export function NoteField({
  id,
  label,
  value,
  onChange,
  helper,
  error,
  required,
  className,
}: NoteFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? (
        <Label htmlFor={id} className='text-sm font-semibold'>
          {label}
          {required ? <span className='text-destructive ml-0.5'>*</span> : null}
        </Label>
      ) : null}
      <div
        id={id}
        className={cn(
          'border-input overflow-hidden rounded-md border',
          error && 'border-destructive'
        )}
      >
        <SimpleEditor value={value} onChange={onChange} />
      </div>
      {error ? <p className='text-destructive text-xs'>{error}</p> : null}
      {!error && helper ? <p className='text-muted-foreground text-xs'>{helper}</p> : null}
    </div>
  );
}

/** Strips the editor's markup so a note can be length-checked and quoted as text. */
export function noteToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6])>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}
