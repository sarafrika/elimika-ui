'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import Spinner from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useFieldArray, useForm, useFormContext, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { programDraftSchema, type ProgramFormValues } from '../program-schema';
import { ProgramTextField } from './ProgramFields';

type Assessment = ProgramFormValues['draft']['assessments'][number];
type SaveAssessments = (assessments: Assessment[]) => Promise<boolean>;
type SaveAssessmentBatchResult = { success: boolean; assessments: Assessment[] };
const assessmentBatchSchema = programDraftSchema.pick({ assessments: true }).extend({
  assessments: programDraftSchema.shape.assessments.removeDefault().min(1, 'Add an assessment row'),
});

function newAssessment(): Assessment {
  return {
    name: '',
    weight: '',
    criteria: '',
    assessmentType: 'exam',
    isRequired: true,
    active: true,
  };
}
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
  const [editorAssessment, setEditorAssessment] = useState<Assessment | null | undefined>(
    undefined
  );
  const [deletingUuid, setDeletingUuid] = useState<string | null>(null);

  const saveAssessments = async (batch: Assessment[]): Promise<SaveAssessmentBatchResult> => {
    const previous = getValues('draft.assessments');
    const updates = new Map(batch.flatMap(row => (row.uuid ? [[row.uuid, row] as const] : [])));
    const next = [
      ...previous.map(row => (row.uuid ? (updates.get(row.uuid) ?? row) : row)),
      ...batch.filter(row => !row.uuid),
    ];
    let newRowIndex = previous.length;
    const batchRows = batch.map(row => ({
      row,
      index: row.uuid ? next.findIndex(item => item.uuid === row.uuid) : newRowIndex++,
    }));
    let success = false;
    try {
      success = await onSave(next);
      if (success) {
        setEditorAssessment(undefined);
        toast.success(editorAssessment ? 'Assessment updated.' : 'Assessments created.');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save assessments.');
    }
    // The save hook assigns UUIDs after each successful create. Retain those IDs
    // if a later row fails so retrying the batch cannot create them again.
    const current = getValues('draft.assessments');
    const savedBatch = batchRows.map(({ row, index }) => ({
      ...row,
      uuid: current[index]?.uuid ?? row.uuid,
    }));
    if (!success) {
      setValue(
        'draft.assessments',
        [...previous, ...current.slice(previous.length).filter(row => row.uuid)],
        { shouldDirty: true }
      );
    }
    return { success, assessments: savedBatch };
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
          {editorAssessment === undefined && (
            <Button
              type='button'
              size='sm'
              disabled={!programUuid || Boolean(deletingUuid)}
              onClick={() => setEditorAssessment(null)}
            >
              <Plus /> Add Assessments
            </Button>
          )}
        </div>
        {editorAssessment !== undefined ? (
          <ProgramAssessmentEditor
            key={editorAssessment?.uuid ?? 'new'}
            assessment={editorAssessment}
            assessments={created}
            onSave={saveAssessments}
            onClose={() => setEditorAssessment(undefined)}
          />
        ) : !created.length ? (
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
                          onClick={() => setEditorAssessment({ ...row })}
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
        {editorAssessment === undefined && (
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
        )}
        {editorAssessment === undefined && created.length > 0 && totalWeight !== 100 && (
          <p className='border-border text-muted-foreground border-t px-5 py-3 text-sm'>
            {totalWeight > 100
              ? `Total weight exceeds 100% by ${Number((totalWeight - 100).toFixed(2))}%. Please adjust.`
              : `${Number((100 - totalWeight).toFixed(2))}% remaining to allocate.`}
          </p>
        )}
      </Card>
    </section>
  );
}

function ProgramAssessmentEditor({
  assessment,
  assessments,
  onSave,
  onClose,
}: {
  assessment: Assessment | null;
  assessments: Assessment[];
  onSave: (assessments: Assessment[]) => Promise<SaveAssessmentBatchResult>;
  onClose: () => void;
}) {
  const form = useForm<{ assessments: Assessment[] }>({
    resolver: zodResolver(assessmentBatchSchema),
    defaultValues: { assessments: [assessment ?? newAssessment()] },
    mode: 'onTouched',
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'assessments' });
  const drafts = useWatch({ control: form.control, name: 'assessments' });
  const draftUuids = new Set(drafts.flatMap(row => (row.uuid ? [row.uuid] : [])));
  const otherWeight = assessments.reduce(
    (total, row) => (row.uuid && draftUuids.has(row.uuid) ? total : total + Number(row.weight)),
    0
  );
  const draftWeight = drafts.reduce((total, row) => total + (Number(row.weight) || 0), 0);
  const proposedWeight = Number((otherWeight + draftWeight).toFixed(2));
  const saving = form.formState.isSubmitting;
  const submit = async (values: { assessments: Assessment[] }) => {
    form.clearErrors('root');
    const total =
      otherWeight + values.assessments.reduce((sum, row) => sum + Number(row.weight), 0);
    if (total > 100) {
      form.setError('root.weight', {
        type: 'validate',
        message: `Total assessment weight cannot exceed 100%. Up to ${Number((100 - otherWeight).toFixed(2))}% is available for these components.`,
      });
      return;
    }
    const result = await onSave(values.assessments);
    if (!result.success) {
      result.assessments.forEach((row, index) => {
        if (row.uuid) form.setValue(`assessments.${index}.uuid`, row.uuid);
      });
      form.setError('root.save', {
        type: 'server',
        message:
          'Unable to save all assessments. Any saved components have been kept. Retry to save the remaining changes.',
      });
    }
  };

  return (
    <CardContent className='flex flex-col gap-3 px-5 py-5'>
      <div className='space-y-1'>
        <h4 className='text-foreground text-sm font-semibold'>
          {assessment ? 'Edit assessment' : 'Add assessments'}
        </h4>
        <p className='text-muted-foreground text-xs'>
          Enter one or more assessment components and their weights, then save them together.
        </p>
      </div>
      <Form {...form}>
        <fieldset
          disabled={saving}
          className='flex min-w-0 flex-col gap-3'
          onKeyDown={event => {
            if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
              event.preventDefault();
              event.stopPropagation();
              if (!saving) void form.handleSubmit(submit)();
            }
          }}
        >
          {fields.map((row, index) => (
            <fieldset
              key={row.id}
              disabled={!assessment && Boolean(drafts[index]?.uuid)}
              className='border-border grid min-w-0 gap-3 rounded-md border p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_110px]'
            >
              <legend className='text-muted-foreground px-1 text-xs'>Assessment {index + 1}</legend>
              <FormField
                control={form.control}
                name={`assessments.${index}.name`}
                render={({ field }) => (
                  <FormItem className='min-w-0'>
                    <FormLabel>Component title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='e.g. Final performance' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`assessments.${index}.assessmentType`}
                render={({ field }) => (
                  <FormItem className='min-w-0'>
                    <FormLabel>Assessment type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={saving || (!assessment && Boolean(drafts[index]?.uuid))}
                    >
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Select type' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {field.value && !ASSESSMENT_TYPES.includes(field.value) && (
                          <SelectItem value={field.value}>{field.value}</SelectItem>
                        )}
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
                name={`assessments.${index}.weight`}
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
              <FormField
                control={form.control}
                name={`assessments.${index}.criteria`}
                render={({ field }) => (
                  <FormItem className='sm:col-span-3'>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={2}
                        placeholder='Describe what learners need to demonstrate'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='grid gap-3 sm:col-span-3 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name={`assessments.${index}.isRequired`}
                  render={({ field }) => (
                    <FormItem className='flex items-center justify-between gap-3 rounded-md border p-3'>
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
                          disabled={saving || (!assessment && Boolean(drafts[index]?.uuid))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`assessments.${index}.active`}
                  render={({ field }) => (
                    <FormItem className='flex items-center justify-between gap-3 rounded-md border p-3'>
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
                          disabled={saving || (!assessment && Boolean(drafts[index]?.uuid))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              {!assessment && (
                <div className='flex flex-wrap items-center justify-between gap-2 sm:col-span-3'>
                  {drafts[index]?.uuid ? (
                    <p className='text-muted-foreground text-xs'>
                      Saved. This component will be kept when you retry or close the editor.
                    </p>
                  ) : (
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      aria-label={`Remove assessment ${index + 1}`}
                      disabled={saving || fields.length === 1}
                      onClick={() => {
                        remove(index);
                        form.clearErrors('root');
                      }}
                    >
                      <Trash2 className='text-destructive' /> Remove
                    </Button>
                  )}
                </div>
              )}
            </fieldset>
          ))}
          <div
            className='border-border bg-muted/40 flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm'
            role='status'
          >
            <span className='text-muted-foreground'>Total program weight after saving</span>
            <span
              className={
                proposedWeight > 100
                  ? 'text-destructive font-semibold'
                  : proposedWeight === 100
                    ? 'text-success font-semibold'
                    : 'text-warning font-semibold'
              }
            >
              {proposedWeight}%
            </span>
          </div>
          {(form.formState.errors.root?.weight || form.formState.errors.root?.save) && (
            <p role='alert' className='text-destructive text-sm'>
              {form.formState.errors.root.weight?.message ??
                form.formState.errors.root.save?.message}
            </p>
          )}
          <div className='flex flex-wrap items-center justify-between gap-2'>
            {!assessment && (
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={saving}
                onClick={() => {
                  append(newAssessment());
                  form.clearErrors('root');
                }}
              >
                <Plus /> Add another assessment
              </Button>
            )}
            <div className='ml-auto flex items-center gap-2'>
              <Button type='button' variant='outline' size='sm' disabled={saving} onClick={onClose}>
                Cancel
              </Button>
              <Button
                type='button'
                size='sm'
                disabled={saving}
                onClick={() => void form.handleSubmit(submit)()}
              >
                {saving ? <Spinner /> : <Save />}
                {saving ? 'Saving…' : assessment ? 'Save changes' : 'Add all assessments'}
              </Button>
            </div>
          </div>
        </fieldset>
      </Form>
    </CardContent>
  );
}
