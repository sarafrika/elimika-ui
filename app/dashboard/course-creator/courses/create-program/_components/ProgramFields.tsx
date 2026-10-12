'use client';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Category } from '@/services/client/types.gen';
import { useFormContext } from 'react-hook-form';
import { CourseLearningOutcomes } from '../../../_components/course-learning-outcomes';
import type { ProgramFormValues } from '../program-schema';
import { ProgramCategories } from './ProgramCategories';
import { ProgramRequirements } from './ProgramRequirements';

const PROGRAM_AWARDS = ['Certificate', 'Diploma', 'Degree', 'Postgraduate Diploma'];

type TextFieldName =
  | 'title'
  | 'programCode'
  | 'passMark'
  | 'description'
  | 'objectives'
  | 'prerequisites'
  | 'classLimit'
  | 'totalDurationHours'
  | 'totalDurationMinutes'
  | 'price';

export function ProgramTextField({
  name,
  label,
  placeholder,
  multiline,
  type = 'text',
  min,
  max,
  className,
}: {
  name: TextFieldName;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  type?: 'text' | 'number';
  min?: number;
  max?: number;
  className?: string;
}) {
  const { control } = useFormContext<ProgramFormValues>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {multiline ? (
              <Textarea {...field} rows={3} placeholder={placeholder} />
            ) : (
              <Input
                {...field}
                type={type}
                min={min}
                max={max}
                step={name === 'price' || name === 'passMark' ? 'any' : 1}
                placeholder={placeholder}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function DraftField({
  name,
  label,
  placeholder,
  type = 'text',
  multiline = false,
}: {
  name: Exclude<keyof ProgramFormValues['draft'], 'assessments' | 'evaluationCriteria'>;
  label: string;
  placeholder?: string;
  type?: 'text' | 'number' | 'url';
  multiline?: boolean;
}) {
  const { control } = useFormContext<ProgramFormValues>();
  return (
    <FormField
      control={control}
      name={`draft.${name}`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {multiline ? (
              <Textarea {...field} rows={3} placeholder={placeholder} />
            ) : (
              <Input
                {...field}
                type={type}
                min={type === 'number' ? 0 : undefined}
                placeholder={placeholder}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function ProgramSetup({ categories }: { categories: Category[] }) {
  const { control } = useFormContext<ProgramFormValues>();
  return (
    <>
      <div className='grid items-start gap-4 md:grid-cols-2 lg:grid-cols-3'>
        <ProgramTextField
          name='title'
          label='Program title'
          placeholder='e.g. Piano Course School Programs'
          className='lg:col-span-2'
        />
        <ProgramTextField
          name='programCode'
          label='Program code (optional)'
          placeholder='e.g. MUSIC-101'
        />
      </div>

      <ProgramCategories categories={categories} />
      <div className='grid items-start gap-4 md:grid-cols-2'>
        <FormField
          control={control}
          name='draft.award'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Program award</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger ref={field.ref} onBlur={field.onBlur} className='w-full'>
                    <SelectValue placeholder='Select program award' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {field.value && !PROGRAM_AWARDS.includes(field.value) && (
                    <SelectItem value={field.value}>{field.value}</SelectItem>
                  )}
                  {PROGRAM_AWARDS.map(award => (
                    <SelectItem key={award} value={award}>
                      {award}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <ProgramTextField name='classLimit' label='Class limit' type='number' min={1} />
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <ProgramTextField
          name='description'
          label='Description'
          placeholder='Describe the program'
          multiline
        />
        <ProgramTextField
          name='prerequisites'
          label='Prerequisites'
          placeholder='Knowledge needed before starting'
          multiline
        />

        <FormField
          control={control}
          name='objectives'
          render={({ field, fieldState }) => (
            <CourseLearningOutcomes
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              entity='program'
            />
          )}
        />
      </div>
      <ProgramRequirements />
    </>
  );
}
