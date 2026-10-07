'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import { X } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { CourseLearningOutcomes } from '../../../_components/course-learning-outcomes';
import type { ProgramFormValues } from '../program-schema';
import { ProgramRequirements } from './ProgramRequirements';

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

export function ProgramSetup({
  categories,
  programUuid,
  onSaveRequirements,
}: {
  categories: Category[];
  programUuid?: string;
  onSaveRequirements: (requirements: ProgramFormValues['requirements']) => Promise<boolean>;
}) {
  const { control } = useFormContext<ProgramFormValues>();
  return (
    <>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
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
        <FormField
          control={control}
          name='categoryUuids'
          render={({ field }) => (
            <FormItem className='md:col-span-2'>
              <FormLabel>Categories</FormLabel>
              <Select
                value=''
                onValueChange={uuid => {
                  if (!field.value.includes(uuid)) field.onChange([...field.value, uuid]);
                }}
                disabled={
                  !categories.some(
                    category => category.uuid && !field.value.includes(category.uuid)
                  )
                }
              >
                <FormControl>
                  <SelectTrigger ref={field.ref} onBlur={field.onBlur} className='w-full'>
                    <SelectValue
                      placeholder={
                        field.value.length ? 'Add another category' : 'Select categories'
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories
                    .filter(category => category.uuid && !field.value.includes(category.uuid))
                    .map(category => (
                      <SelectItem key={category.uuid} value={category.uuid!}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {field.value.length > 0 && (
                <div className='flex flex-wrap gap-2' aria-label='Selected categories'>
                  {field.value.map((uuid, index) => {
                    const name = categories.find(category => category.uuid === uuid)?.name ?? uuid;
                    return (
                      <Badge key={uuid} variant='secondary' className='gap-1'>
                        {name}
                        {index === 0 && ' (Primary)'}
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          className='h-6 w-6'
                          aria-label={`Remove ${name}`}
                          onClick={() =>
                            field.onChange(field.value.filter(value => value !== uuid))
                          }
                        >
                          <X className='size-3' />
                        </Button>
                      </Badge>
                    );
                  })}
                </div>
              )}
              <FormDescription>
                Select one or more. The first selection is the primary category saved with the
                program.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <DraftField name='subject' label='Subject' />
        <ProgramTextField name='classLimit' label='Class limit' type='number' min={1} />
        <DraftField name='award' label='Program award' />
      </div>
      <p className='text-muted-foreground text-xs'>
        Subject and award are kept in your browser draft. Saving keeps the program in its current
        state; publish, unpublish or archive it with the actions above.
      </p>
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
      <ProgramRequirements programUuid={programUuid} onSave={onSaveRequirements} />
    </>
  );
}
