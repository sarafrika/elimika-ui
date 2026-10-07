'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Form,
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import Spinner from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm, useFormContext, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { programDraftSchema, type ProgramFormValues } from '../program-schema';
import { ProgramTextField } from './ProgramFields';

type Assessment = ProgramFormValues['draft']['assessments'][number];
type SaveAssessments = (assessments: Assessment[]) => Promise<boolean>;
const assessmentSchema = programDraftSchema.shape.assessments.removeDefault().element;
const ASSESSMENT_TYPES = [
  'exam',
  'assignment',
  'project',
  'quiz',
  'practical',
  'participation',
  'attendance',
];

export function ProgramAssessment({
  programUuid,
  onSave,
}: {
  programUuid?: string;
  onSave: SaveAssessments;
}) {
  const { control, getValues, setValue } = useFormContext<ProgramFormValues>();
  const assessments = useWatch({ control, name: 'draft.assessments' });
  const created = useMemo(() => assessments.filter(row => row.uuid), [assessments]);
  const totalWeight = Number(
    created.reduce((total, row) => total + (Number(row.weight) || 0), 0).toFixed(2)
  );
  const [sheetAssessment, setSheetAssessment] = useState<Assessment | null | undefined>(undefined);
  const [deletingUuid, setDeletingUuid] = useState<string | null>(null);

  const saveAssessment = async (assessment: Assessment) => {
    const previous = getValues('draft.assessments');
    const next = assessment.uuid
      ? previous.map(row => (row.uuid === assessment.uuid ? assessment : row))
      : [...previous, assessment];
    try {
      if (!(await onSave(next))) {
        setValue('draft.assessments', previous, { shouldDirty: true });
        return false;
      }
      setSheetAssessment(undefined);
      toast.success(assessment.uuid ? 'Assessment updated.' : 'Assessment created.');
      return true;
    } catch (error) {
      setValue('draft.assessments', previous, { shouldDirty: true });
      toast.error(error instanceof Error ? error.message : 'Unable to save assessment.');
      return false;
    }
  };
  const deleteAssessment = async (assessment: Assessment) => {
    if (!assessment.uuid || deletingUuid) return;
    const previous = getValues('draft.assessments');
    setDeletingUuid(assessment.uuid);
    try {
      if (!(await onSave(previous.filter(row => row.uuid !== assessment.uuid)))) {
        setValue('draft.assessments', previous, { shouldDirty: true });
        return;
      }
      toast.success('Assessment removed.');
    } catch (error) {
      setValue('draft.assessments', previous, { shouldDirty: true });
      toast.error(error instanceof Error ? error.message : 'Unable to remove assessment.');
    } finally {
      setDeletingUuid(null);
    }
  };

  return (
    <section className='space-y-4' aria-label='Program assessment'>
      <div className='max-w-sm'>
        <ProgramTextField
          name='passMark'
          label='Pass mark (%) (optional)'
          type='number'
          min={0}
          max={100}
          placeholder='e.g. 50'
        />
      </div>
      <Card className='gap-0 overflow-hidden py-0'>
        <div className='border-border flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4'>
          <div>
            <h3 className='text-base font-semibold'>Overall Program Assessment Structure</h3>
            <p className='text-muted-foreground mt-1 text-sm'>
              Define the assessment components and their weights (total: 100%).
            </p>
          </div>
          <Button
            type='button'
            size='sm'
            disabled={!programUuid || Boolean(deletingUuid)}
            onClick={() => setSheetAssessment(null)}
          >
            <Plus /> Add Assessment
          </Button>
        </div>
        {!created.length ? (
          <EmptyState
            variant='compact'
            title='No assessments yet'
            description='Add assessment components to define the grading structure for this program.'
            className='py-10'
          />
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='bg-muted/40 border-border border-b'>
                <tr>
                  <th className='px-5 py-3 text-left font-semibold'>Component Title</th>
                  <th className='px-5 py-3 text-left font-semibold'>Weight (%)</th>
                  <th className='px-5 py-3 text-left font-semibold'>Type</th>
                  <th className='px-5 py-3 text-right font-semibold'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-border divide-y'>
                {created.map(row => (
                  <tr key={row.uuid} className='hover:bg-muted/30'>
                    <td className='px-5 py-4'>
                      <p className='font-medium'>{row.name}</p>
                      {row.criteria && (
                        <p className='text-muted-foreground mt-1 max-w-lg text-xs whitespace-pre-wrap'>
                          {row.criteria}
                        </p>
                      )}
                    </td>
                    <td className='px-5 py-4 font-semibold'>{row.weight}%</td>
                    <td className='text-muted-foreground px-5 py-4 capitalize'>
                      {row.assessmentType}
                    </td>
                    <td className='px-5 py-4'>
                      <div className='flex justify-end gap-1'>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          aria-label={`Edit ${row.name}`}
                          disabled={Boolean(deletingUuid)}
                          onClick={() => setSheetAssessment({ ...row })}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          aria-label={`Delete ${row.name}`}
                          disabled={Boolean(deletingUuid)}
                          onClick={() => void deleteAssessment(row)}
                        >
                          {deletingUuid === row.uuid ? (
                            <Spinner />
                          ) : (
                            <Trash2 className='text-destructive' />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div
          className='bg-muted/40 border-border flex items-center justify-between border-t px-5 py-3 font-semibold'
          role='status'
        >
          <span>Total assessment weight</span>
          <span
            className={
              totalWeight === 100
                ? 'text-success'
                : totalWeight > 100
                  ? 'text-destructive'
                  : 'text-warning'
            }
          >
            {totalWeight}%
          </span>
        </div>
        {created.length > 0 && totalWeight !== 100 && (
          <p className='border-border text-muted-foreground border-t px-5 py-3 text-sm'>
            {totalWeight > 100
              ? `Total weight exceeds 100% by ${Number((totalWeight - 100).toFixed(2))}%. Please adjust.`
              : `${Number((100 - totalWeight).toFixed(2))}% remaining to allocate.`}
          </p>
        )}
      </Card>
      {sheetAssessment !== undefined && (
        <ProgramAssessmentSheet
          key={sheetAssessment?.uuid ?? 'new'}
          assessment={sheetAssessment}
          assessments={created}
          onSave={saveAssessment}
          onClose={() => setSheetAssessment(undefined)}
        />
      )}
    </section>
  );
}

function ProgramAssessmentSheet({
  assessment,
  assessments,
  onSave,
  onClose,
}: {
  assessment: Assessment | null;
  assessments: Assessment[];
  onSave: (assessment: Assessment) => Promise<boolean>;
  onClose: () => void;
}) {
  const form = useForm<Assessment>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: assessment ?? {
      name: '',
      weight: '',
      criteria: '',
      assessmentType: 'exam',
      isRequired: true,
      active: true,
    },
    mode: 'onTouched',
  });
  const weight = useWatch({ control: form.control, name: 'weight' });
  const otherWeight = assessments.reduce(
    (total, row) => (row.uuid === assessment?.uuid ? total : total + Number(row.weight)),
    0
  );
  const proposedWeight = Number((otherWeight + (Number(weight) || 0)).toFixed(2));
  const saving = form.formState.isSubmitting;
  const submit = async (values: Assessment) => {
    if (otherWeight + Number(values.weight) > 100) {
      form.setError('weight', {
        type: 'validate',
        message: `Total assessment weight cannot exceed 100%. Up to ${Number((100 - otherWeight).toFixed(2))}% is available.`,
      });
      return;
    }
    await onSave(values);
  };

  return (
    <Sheet
      open
      onOpenChange={open => {
        if (!open && !saving) onClose();
      }}
    >
      <SheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-xl'>
        <SheetHeader className='border-border border-b px-5 py-5'>
          <SheetTitle>{assessment ? 'Edit Assessment' : 'Add Assessment'}</SheetTitle>
          <SheetDescription>
            Set the assessment details and its contribution to the program grade.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            className='flex min-h-0 flex-1 flex-col'
            noValidate
            onSubmit={event => {
              event.stopPropagation();
              void form.handleSubmit(submit)(event);
            }}
          >
            <fieldset
              disabled={saving}
              className='min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5'
            >
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Component title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='e.g. Final performance' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='grid gap-4 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='assessmentType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assessment type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ASSESSMENT_TYPES.map(type => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='weight'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (%)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type='number'
                          min={0}
                          max={100}
                          step='any'
                          placeholder='e.g. 40'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name='criteria'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={4}
                        placeholder='Describe what learners need to demonstrate'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='isRequired'
                render={({ field }) => (
                  <FormItem className='flex items-center justify-between gap-4 rounded-lg border p-4'>
                    <div className='space-y-1'>
                      <FormLabel>Required assessment</FormLabel>
                      <FormDescription>Students must complete this assessment.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        name={field.name}
                        ref={field.ref}
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        onBlur={field.onBlur}
                        disabled={saving}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='active'
                render={({ field }) => (
                  <FormItem className='flex items-center justify-between gap-4 rounded-lg border p-4'>
                    <div className='space-y-1'>
                      <FormLabel>Active assessment</FormLabel>
                      <FormDescription>Enable this assessment for the program.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        name={field.name}
                        ref={field.ref}
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        onBlur={field.onBlur}
                        disabled={saving}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <p className='bg-muted/40 rounded-md p-3 text-sm' role='status'>
                Total weight after saving:{' '}
                <span
                  className={
                    proposedWeight > 100 ? 'text-destructive font-semibold' : 'font-semibold'
                  }
                >
                  {proposedWeight}%
                </span>
              </p>
            </fieldset>
            <SheetFooter className='border-border border-t px-5 py-4'>
              <Button type='button' variant='outline' disabled={saving} onClick={onClose}>
                Cancel
              </Button>
              <Button type='submit' disabled={saving}>
                {saving ? <Spinner /> : <Save />}
                {saving ? 'Saving…' : assessment ? 'Save changes' : 'Create Assessment'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
