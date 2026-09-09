'use client';

/**
 * Step 2 — the rooms and labs the applicant would teach in.
 *
 * Only asked of applicants who deliver in person or hybrid. A virtual-only
 * applicant has no room to describe and was previously blocked here.
 *
 * A count control seeds the rows, each row is named (required), optionally
 * photographed, and the order is meaningful: the first row is the primary
 * space. Reordering is offered twice — drag for a mouse, the up/down arrows for
 * everyone else — because a drag handle alone is not an affordance a keyboard
 * or a touch screen can reach.
 *
 * The photo is held as an object URL and never uploaded: there is no classroom
 * media endpoint on the application, and inventing one would post a file
 * nothing reads. The progress bar exists so the picker behaves like the upload
 * it will one day be; the revoke on unmount is what keeps that honest.
 */

import { Camera, ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from 'lucide-react';
import { type Dispatch, useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

import {
  type ApplyAction,
  type ApplyState,
  type Classroom,
  MAX_CLASSROOMS,
  requiresClassroom,
} from './apply-model';

const MAX_PHOTO_MB = 5;
const MAX_PHOTO_BYTES = MAX_PHOTO_MB * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function StepClassrooms({
  state,
  dispatch,
}: {
  state: ApplyState;
  dispatch: Dispatch<ApplyAction>;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  // The control is a string of its own so a half-typed "" or "1" is not
  // immediately clamped back to the last valid count under the caret.
  const [countInput, setCountInput] = useState<string>(String(state.classroomCount));

  useEffect(() => {
    setCountInput(String(state.classroomCount));
  }, [state.classroomCount]);

  if (!requiresClassroom(state.methods)) {
    return (
      <div className='bg-muted/30 text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm'>
        You are only offering virtual sessions, so there is no room to describe. Add an in-person or
        hybrid method on the previous step if you also teach on site.
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='max-w-xs space-y-2'>
        <Label htmlFor='count'>How many classrooms/labs do you have for this course?</Label>
        <Input
          id='count'
          type='number'
          min={0}
          max={MAX_CLASSROOMS}
          value={countInput}
          onChange={event => {
            const raw = event.target.value;
            setCountInput(raw);
            if (raw === '') return;
            const parsed = Number.parseInt(raw, 10);
            if (Number.isFinite(parsed)) dispatch({ type: 'classroomCount', count: parsed });
          }}
          onBlur={() => {
            if (countInput === '' || !Number.isFinite(Number.parseInt(countInput, 10))) {
              setCountInput(String(state.classroomCount));
            }
          }}
        />
      </div>

      {state.classrooms.length > 1 && (
        <p className='text-muted-foreground text-xs'>
          Drag rows or use the arrows to set your preferred order — the first row is your primary
          space.
        </p>
      )}

      <div className='space-y-3'>
        {state.classrooms.map((classroom, index) => (
          <ClassroomRow
            key={classroom.id}
            index={index}
            total={state.classrooms.length}
            classroom={classroom}
            isDragging={dragId === classroom.id}
            isDragOver={dragOverId === classroom.id && dragId !== classroom.id}
            onChange={patch => dispatch({ type: 'classroom', id: classroom.id, patch })}
            onRemove={() => dispatch({ type: 'removeClassroom', id: classroom.id })}
            onMoveUp={() => dispatch({ type: 'moveClassroom', id: classroom.id, direction: 'up' })}
            onMoveDown={() =>
              dispatch({ type: 'moveClassroom', id: classroom.id, direction: 'down' })
            }
            onDragStart={() => setDragId(classroom.id)}
            onDragEnd={() => {
              setDragId(null);
              setDragOverId(null);
            }}
            onDragOver={() => setDragOverId(classroom.id)}
            onDrop={() => {
              if (dragId && dragId !== classroom.id)
                dispatch({ type: 'reorderClassrooms', fromId: dragId, toId: classroom.id });
              setDragId(null);
              setDragOverId(null);
            }}
          />
        ))}
      </div>

      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={() => dispatch({ type: 'addClassroom' })}
      >
        <Plus className='mr-2 h-4 w-4' /> Add classroom
      </Button>
    </div>
  );
}

function ClassroomRow({
  index,
  total,
  classroom,
  isDragging,
  isDragOver,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  index: number;
  total: number;
  classroom: Classroom;
  isDragging: boolean;
  isDragOver: boolean;
  onChange: (patch: Partial<Classroom>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: () => void;
  onDrop: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const previousUrl = useRef<string | undefined>(classroom.photoUrl);
  const progressTimer = useRef<number | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previousUrl.current?.startsWith('blob:')) URL.revokeObjectURL(previousUrl.current);
      if (progressTimer.current) window.clearInterval(progressTimer.current);
    };
  }, []);

  const clearFileInput = () => {
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFile = (file: File | null) => {
    setError(null);
    if (progressTimer.current) {
      window.clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
    if (!file) {
      if (previousUrl.current?.startsWith('blob:')) URL.revokeObjectURL(previousUrl.current);
      previousUrl.current = undefined;
      setProgress(null);
      onChange({ photoUrl: undefined });
      return;
    }
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setError('Unsupported file type. Use JPG, PNG, WEBP, or GIF.');
      setProgress(null);
      clearFileInput();
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      setError(`File is ${mb}MB. Maximum allowed is ${MAX_PHOTO_MB}MB.`);
      setProgress(null);
      clearFileInput();
      return;
    }
    setProgress(0);
    progressTimer.current = window.setInterval(() => {
      setProgress(previous => {
        const next = (previous ?? 0) + Math.random() * 18 + 8;
        if (next >= 100) {
          if (progressTimer.current) {
            window.clearInterval(progressTimer.current);
            progressTimer.current = null;
          }
          if (previousUrl.current?.startsWith('blob:')) URL.revokeObjectURL(previousUrl.current);
          const url = URL.createObjectURL(file);
          previousUrl.current = url;
          onChange({ photoUrl: url });
          window.setTimeout(() => setProgress(null), 250);
          return 100;
        }
        return next;
      });
    }, 120);
  };

  const uploading = progress !== null && progress < 100;

  return (
    <div
      draggable
      onDragStart={event => {
        onDragStart();
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', classroom.id);
      }}
      onDragEnd={onDragEnd}
      onDragOver={event => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        onDragOver();
      }}
      onDrop={event => {
        event.preventDefault();
        onDrop();
      }}
      className={cn(
        'bg-card grid gap-3 rounded-md border p-3 transition-all sm:grid-cols-[auto_96px_1fr_auto] sm:items-start',
        isDragging && 'opacity-50',
        isDragOver && 'border-primary ring-primary/40 ring-2'
      )}
    >
      <div className='flex items-center gap-1 sm:flex-col sm:items-center sm:gap-0.5'>
        <span
          className='text-muted-foreground cursor-grab active:cursor-grabbing'
          aria-hidden
          title='Drag to reorder'
        >
          <GripVertical className='h-4 w-4' />
        </span>
        <Badge variant='secondary' className='h-5 min-w-[1.5rem] justify-center px-1.5 text-[10px]'>
          {index + 1}
        </Badge>
        <div className='ml-auto flex gap-0.5 sm:ml-0 sm:flex-col'>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='h-6 w-6'
            onClick={onMoveUp}
            disabled={index === 0}
            aria-label={`Move classroom ${index + 1} up`}
          >
            <ChevronUp className='h-4 w-4' />
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='h-6 w-6'
            onClick={onMoveDown}
            disabled={index === total - 1}
            aria-label={`Move classroom ${index + 1} down`}
          >
            <ChevronDown className='h-4 w-4' />
          </Button>
        </div>
      </div>

      <div className='space-y-1'>
        <button
          type='button'
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className={cn(
            'group text-muted-foreground hover:bg-muted relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-md border border-dashed transition-colors',
            classroom.photoUrl && !uploading && 'border-border border-solid',
            error && 'border-destructive text-destructive',
            uploading && 'cursor-progress'
          )}
          aria-label={
            uploading
              ? `Uploading, ${Math.round(progress ?? 0)}%`
              : classroom.photoUrl
                ? 'Replace classroom photo'
                : 'Upload classroom photo'
          }
        >
          {classroom.photoUrl && !uploading ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={classroom.photoUrl}
                alt={classroom.name || `Classroom ${index + 1}`}
                className='h-full w-full object-cover'
              />
              <span className='bg-foreground/60 text-background absolute inset-x-0 bottom-0 py-0.5 text-center text-[10px] font-medium tracking-wide uppercase opacity-0 transition-opacity group-hover:opacity-100'>
                Replace
              </span>
            </>
          ) : uploading ? (
            <div className='text-foreground flex w-full flex-col items-center gap-1 px-2'>
              <span className='text-[10px] font-medium tracking-wide uppercase'>
                {Math.round(progress ?? 0)}%
              </span>
              <div
                className='bg-muted h-1.5 w-full overflow-hidden rounded-full'
                role='progressbar'
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress ?? 0)}
              >
                <div
                  className='bg-primary h-full transition-all'
                  style={{ width: `${progress ?? 0}%` }}
                />
              </div>
            </div>
          ) : (
            <span className='flex flex-col items-center gap-1'>
              <Camera className='h-5 w-5' />
              <span className='text-[10px] font-medium tracking-wide uppercase'>Add photo</span>
            </span>
          )}
        </button>
        {classroom.photoUrl && !uploading && !error && (
          <button
            type='button'
            onClick={() => handleFile(null)}
            className='text-muted-foreground hover:text-foreground w-24 text-center text-[11px] underline-offset-2 hover:underline'
          >
            Remove
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type='file'
        accept='image/jpeg,image/png,image/webp,image/gif'
        className='hidden'
        onChange={event => {
          const file = event.target.files?.[0] ?? null;
          handleFile(file);
          if (fileRef.current && !file) fileRef.current.value = '';
        }}
      />

      <div className='space-y-1'>
        <Label htmlFor={`room-${classroom.id}`} className='text-muted-foreground text-xs'>
          Classroom #{index + 1} name <span className='text-destructive'>*</span>
        </Label>
        <Input
          id={`room-${classroom.id}`}
          value={classroom.name}
          onChange={event => onChange({ name: event.target.value })}
          placeholder='e.g. Room 12A / Lab B'
          required
          aria-invalid={!classroom.name.trim()}
          className={cn(
            !classroom.name.trim() && 'border-destructive focus-visible:ring-destructive/40'
          )}
        />
        {!classroom.name.trim() ? (
          <p className='text-destructive text-[11px]'>Classroom name is required.</p>
        ) : (
          <p className='text-muted-foreground text-[11px]'>
            Photo is optional. Max {MAX_PHOTO_MB}MB · JPG, PNG, WEBP, GIF.
          </p>
        )}
        {error && (
          <p role='alert' className='text-destructive text-[11px] font-medium'>
            {error}
          </p>
        )}
        {uploading && (
          <p aria-live='polite' className='text-muted-foreground text-[11px]'>
            Uploading photo… {Math.round(progress ?? 0)}%
          </p>
        )}
      </div>

      <Button
        type='button'
        variant='ghost'
        size='icon'
        onClick={onRemove}
        aria-label='Remove classroom'
        className='justify-self-end'
      >
        <Trash2 className='text-muted-foreground h-4 w-4' />
      </Button>
    </div>
  );
}
