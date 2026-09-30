'use client';

import { useFieldArray, useFormContext } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
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
import type { ProgramFormValues } from '../program-schema';

type TextFieldName =
  | 'title'
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
                step={name === 'price' ? 'any' : 1}
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
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <ProgramTextField
          name='title'
          label='Program title'
          placeholder='e.g. Piano Course School Programs'
          className='lg:col-span-2'
        />
        <DraftField name='programCode' label='Program code' placeholder='e.g. MUSIC-101' />
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
        Program code, subject, and award are kept in your browser draft. Saving keeps the program
        in its current state; publish, unpublish or archive it with the actions above.
      </p>
      <div className='grid gap-4 md:grid-cols-2'>
        <ProgramTextField
          name='description'
          label='Description'
          placeholder='Describe the program'
          multiline
        />
        <ProgramTextField
          name='objectives'
          label='Expected outcomes'
          placeholder='What learners will achieve'
          multiline
        />
        <ProgramTextField
          name='prerequisites'
          label='Prerequisites'
          placeholder='Knowledge needed before starting'
          multiline
        />
        <Requirements />
      </div>
      <div className='grid max-w-lg gap-4 sm:grid-cols-2'>
        <ProgramTextField
          name='totalDurationHours'
          label='Total duration (hours)'
          type='number'
          min={0}
        />
        <ProgramTextField
          name='totalDurationMinutes'
          label='Additional minutes'
          type='number'
          min={0}
          max={59}
        />
      </div>
    </>
  );
}

function Requirements() {
  const { control } = useFormContext<ProgramFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: 'requirements' });
  return (
    <section className='space-y-3' aria-label='Requirements'>
      <div className='flex items-center justify-between gap-2'>
        <h3 className='text-sm font-medium'>Requirements</h3>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() =>
            append({ requirementText: '', requirementType: 'STUDENT', isMandatory: true })
          }
        >
          <Plus />
          Add requirement
        </Button>
      </div>
      {!fields.length && (
        <EmptyState
          variant='compact'
          title='No requirements yet'
          description='Add materials, equipment, or access required.'
        />
      )}
      {fields.map((row, index) => (
        <div key={row.id} className='border-border space-y-3 border p-3'>
          <div className='flex items-start gap-2'>
            <FormField
              control={control}
              name={`requirements.${index}.requirementText`}
              render={({ field }) => (
                <FormItem className='flex-1'>
                  <FormLabel className='sr-only'>Requirement {index + 1}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder='Materials, equipment or access required'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type='button'
              variant='ghost'
              size='icon'
              aria-label={`Remove requirement ${index + 1}`}
              onClick={() => remove(index)}
            >
              <X />
            </Button>
          </div>
          <div className='flex flex-wrap items-end gap-4'>
            <FormField
              control={control}
              name={`requirements.${index}.requirementType`}
              render={({ field }) => (
                <FormItem className='min-w-36 flex-1'>
                  <FormLabel>Required from</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className='w-full'>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='STUDENT'>Student</SelectItem>
                      <SelectItem value='INSTRUCTOR'>Instructor</SelectItem>
                      <SelectItem value='TRAINING_CENTER'>Training center</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`requirements.${index}.isMandatory`}
              render={({ field }) => (
                <FormItem className='flex items-center gap-2 pb-2'>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={checked => field.onChange(checked === true)}
                    />
                  </FormControl>
                  <FormLabel>Mandatory</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      ))}
    </section>
  );
}
