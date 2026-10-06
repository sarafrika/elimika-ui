'use client';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useCoursesByIds } from '@/hooks/use-batched-lookups';
import { Plus, X } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { formatProgramTrainingFee } from '../program-pricing';
import type { ProgramFormValues } from '../program-schema';
import { DraftField, ProgramTextField } from './ProgramFields';
import { ProgramMediaUpload } from './ProgramMediaUpload';
import type { PendingProgramMedia, ProgramMediaKey } from '../save-program-media';

export function ProgramAssessment() {
  const { control } = useFormContext<ProgramFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: 'draft.assessments' });
  const assessments = useWatch({ control, name: 'draft.assessments' });
  const totalWeight = assessments.reduce((total, row) => total + (Number(row.weight) || 0), 0);
  return (
    <section className='space-y-4' aria-label='Program assessment'>
      <ProgramTextField
        name='passMark'
        label='Pass mark (%) (optional)'
        type='number'
        min={0}
        max={100}
        placeholder='e.g. 50'
      />
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h3 className='text-sm font-medium'>Program assessment</h3>
          <p className='text-muted-foreground mt-1 text-xs'>
            Draft assessment components and their weight toward the program award.
          </p>
        </div>
        <Button
          type='button'
          size='sm'
          variant='outline'
          onClick={() => append({ name: '', weight: '', criteria: '' })}
        >
          <Plus />
          Add component
        </Button>
      </div>
      {!fields.length && (
        <EmptyState
          variant='compact'
          title='No assessment components yet'
          description='Add a component to define its weighting and assessment criteria.'
        />
      )}
      {fields.map((row, index) => (
        <fieldset key={row.id} className='border-border grid gap-4 border p-4 md:grid-cols-2'>
          <legend className='px-1 text-sm font-medium'>Component {index + 1}</legend>
          <FormField
            control={control}
            name={`draft.assessments.${index}.name`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Component name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder='e.g. Final performance' />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`draft.assessments.${index}.weight`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight (%)</FormLabel>
                <FormControl>
                  <Input {...field} type='number' min={0} max={100} step='any' />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`draft.assessments.${index}.criteria`}
            render={({ field }) => (
              <FormItem className='md:col-span-2'>
                <FormLabel>Assessment criteria</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder='Describe what learners need to demonstrate' />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type='button'
            variant='ghost'
            className='justify-self-start'
            onClick={() => remove(index)}
            aria-label={`Remove component ${index + 1}`}
          >
            <X />
            Remove component
          </Button>
        </fieldset>
      ))}
      {fields.length > 0 && (
        <p className='text-muted-foreground text-sm' role='status'>
          Total weight: {totalWeight}%. Aim for 100% across your components.
        </p>
      )}
    </section>
  );
}

export function ProgramEvaluation() {
  const { control } = useFormContext<ProgramFormValues>();
  const courses = useWatch({ control, name: 'courses' });
  const courseIds = useMemo(() => courses.map(course => course.courseUuid), [courses]);
  const { courseMap } = useCoursesByIds(courseIds);
  return (
    <div className='space-y-4'>
      <div>
        <h3 className='text-sm font-medium'>Evaluation criteria per course</h3>
        <p className='text-muted-foreground mt-1 text-xs'>
          Draft a rubric and describe how each course contributes to the program assessment.
        </p>
      </div>
      <DraftField name='rubric' label='Program rubric' placeholder='Rubric name or reference' />
      <DraftField
        name='evaluationNotes'
        label='Evaluation guidance'
        multiline
        placeholder='Describe grading, pass criteria, and how assessment components are evaluated'
      />
      {!courses.length && (
        <EmptyState
          variant='compact'
          title='No courses selected'
          description='Add courses in the previous step to draft their evaluation criteria.'
        />
      )}
      {courses.map((course, index) => (
        <FormField
          key={course.courseUuid}
          control={control}
          name={`draft.evaluationCriteria.${course.courseUuid}`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {courseMap[course.courseUuid]?.name ?? `Course ${index + 1}`} — evaluation criteria
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ''}
                  placeholder='Assessment components, criteria, and expected standard for this course'
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </div>
  );
}

export function ProgramBranding({
  files,
  onSelect,
}: {
  files: PendingProgramMedia;
  onSelect: (key: ProgramMediaKey, file?: File) => void;
}) {
  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <h3 className='text-sm font-medium'>Program identity</h3>
        <div className='grid gap-4 md:grid-cols-2'>
          <DraftField name='brandName' label='Brand name' placeholder='e.g. Elimika Music School' />
          <DraftField
            name='tagline'
            label='Tagline'
            placeholder='One short line about the program'
          />
          <DraftField name='logoUrl' label='Logo URL' placeholder='https://…' type='url' />
          <DraftField name='coverUrl' label='Cover image URL' placeholder='https://…' type='url' />
        </div>
      </div>
      <ProgramMediaUpload files={files} onSelect={onSelect} />
    </div>
  );
}

export function ProgramPricing({
  minimumTrainingFee,
  isLoading,
  onRetry,
}: {
  minimumTrainingFee: number | undefined;
  isLoading: boolean;
  onRetry: () => void;
}) {
  const { control, trigger, getFieldState } = useFormContext<ProgramFormValues>();
  useEffect(() => {
    const field = getFieldState('draft.hourlyFee');
    if (field.isTouched || field.error) void trigger('draft.hourlyFee');
  }, [minimumTrainingFee, trigger, getFieldState]);
  return (
    <div className='space-y-4'>
      <h3 className='text-sm font-medium'>Pricing</h3>
      <div className='max-w-sm'>
        <ProgramTextField
          name='price'
          label='Program price (KES)'
          type='number'
          min={0}
          placeholder='Enter 0 for a free program'
        />
      </div>
      <p className='text-muted-foreground text-xs'>
        This is the total program price. Leave it blank for an unpriced draft, or enter 0 for free.
      </p>
      <div className='grid items-start gap-4 md:grid-cols-3'>
        <div className='space-y-2'>
          <FormField
            control={control}
            name='draft.hourlyFee'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum training fee per student per hour (KES)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type='number'
                    min={minimumTrainingFee}
                    step='0.01'
                    required
                    placeholder={
                      minimumTrainingFee === undefined ? undefined : String(minimumTrainingFee)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {isLoading ? (
            <p role='status' className='text-muted-foreground flex items-center gap-2 text-xs'>
              <Spinner /> Loading course minimum fees…
            </p>
          ) : minimumTrainingFee === undefined ? (
            <EmptyState
              variant='compact'
              title='Unable to verify course minimum fees'
              description='All selected courses must be available before the program can be saved.'
              action={
                <Button type='button' variant='outline' onClick={onRetry}>
                  Try again
                </Button>
              }
            />
          ) : (
            <p role='status' className='text-muted-foreground text-xs'>
              Combined minimum: {formatProgramTrainingFee(minimumTrainingFee)} per student per hour.
            </p>
          )}
        </div>
        <DraftField name='instructorShare' label='Instructor share (%)' type='number' />
        <DraftField name='creatorShare' label='Creator share (%)' type='number' />
      </div>
      <p className='text-muted-foreground text-xs'>
        Hourly fees and revenue shares are kept in your browser draft.
      </p>
    </div>
  );
}
