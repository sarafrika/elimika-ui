'use client';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import type { RequirementTypeEnum } from '@/services/client/types.gen';
import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext, useFormState, useWatch } from 'react-hook-form';
import { TrainingRequirementFields } from '../../../_components/training-requirement-fields';
import { programRequirementText, requirementEntry } from '../program-requirements';
import type { ProgramFormValues } from '../program-schema';

const PROVIDERS: { value: RequirementTypeEnum; label: string }[] = [
  { value: 'INSTRUCTOR', label: 'Instructor' },
  { value: 'TRAINING_CENTER', label: 'Organisation' },
  { value: 'STUDENT', label: 'Student' },
];
const HEADERS = ['Requirement Name', 'Type', 'Quantity', 'Unit', 'Mandatory', 'Description', ''];

function ProgramRequirementRow({ index, onRemove }: { index: number; onRemove: () => void }) {
  const { control, getValues, setValue } = useFormContext<ProgramFormValues>();
  const row = useWatch({ control, name: `requirements.${index}` });
  const { errors } = useFormState({ control, name: `requirements.${index}` });
  const error = errors.requirements?.[index];
  const messages = [
    error?.resource?.name?.message,
    error?.resource?.quantity?.message,
    error?.requirementText?.message,
  ].filter(Boolean);
  const entry = requirementEntry(row);
  return (
    <>
      <tr>
        <TrainingRequirementFields
          value={entry}
          instructor={row.requirementType === 'INSTRUCTOR'}
          label={`Requirement ${index + 1}`}
          nameInvalid={Boolean(error?.resource?.name || error?.requirementText)}
          quantityInvalid={Boolean(error?.resource?.quantity)}
          onChange={patch => {
            const current = getValues(`requirements.${index}`);
            const resource = { ...requirementEntry(current), ...patch };
            setValue(
              `requirements.${index}`,
              {
                ...current,
                resource,
                requirementText: programRequirementText(resource),
                isMandatory: resource.is_mandatory,
              },
              { shouldDirty: true, shouldTouch: true }
            );
          }}
        />
        <td className='px-3 py-2'>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            aria-label={`Remove ${entry.name || `requirement ${index + 1}`}`}
            onClick={onRemove}
          >
            <Trash2 className='text-destructive' />
          </Button>
        </td>
      </tr>
      {messages.length > 0 && (
        <tr>
          <td colSpan={HEADERS.length} className='text-destructive px-3 pb-2 text-xs' role='alert'>
            {messages.join('. ')}
          </td>
        </tr>
      )}
    </>
  );
}

export function ProgramRequirements() {
  const { control } = useFormContext<ProgramFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: 'requirements' });
  const addRequirement = (provider: RequirementTypeEnum) =>
    append(
      {
        requirementType: provider,
        requirementText: '',
        isMandatory: false,
        resource: {
          name: '',
          requirement_type: 'material',
          quantity: '',
          unit: 'pieces',
          description: '',
          is_mandatory: false,
        },
      },
      { shouldFocus: false }
    );

  return (
    <section className='space-y-6' aria-label='Program requirements'>
      <div className='space-y-3'>
        <h3 className='text-sm font-medium'>Requirements</h3>
        <p className='text-muted-foreground text-sm'>
          Add requirements for each provider. Your requirements are saved with the program when you
          continue.
        </p>
        <div className='flex flex-wrap gap-2'>
          {PROVIDERS.map(provider => (
            <Button
              key={provider.value}
              type='button'
              variant='outline'
              className='rounded-full'
              aria-label={`Add ${provider.label.toLowerCase()} requirement`}
              onClick={() => addRequirement(provider.value)}
            >
              <Plus /> {provider.label}
            </Button>
          ))}
        </div>
      </div>
      {PROVIDERS.map(provider => {
        const rows = fields
          .map((field, index) => ({ field, index }))
          .filter(({ field }) => field.requirementType === provider.value);
        if (!rows.length) return null;
        return (
          <div key={provider.value} className='border-border overflow-hidden rounded-lg border'>
            <div className='bg-muted/40 border-border flex items-center justify-between gap-2 border-b px-4 py-3'>
              <h4 className='text-sm font-semibold'>{provider.label} — Requirements</h4>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => addRequirement(provider.value)}
              >
                <Plus /> Add requirement
              </Button>
            </div>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm' aria-label={`${provider.label} requirements`}>
                <thead className='bg-muted/40 border-border border-b'>
                  <tr>
                    {HEADERS.map(title => (
                      <th
                        key={title}
                        className='text-muted-foreground px-3 py-2 text-left text-xs font-medium whitespace-nowrap'
                      >
                        {title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className='divide-border divide-y'>
                  {rows.map(({ field, index }) => (
                    <ProgramRequirementRow
                      key={field.id}
                      index={index}
                      onRemove={() => remove(index)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
      {!fields.length && (
        <EmptyState
          variant='compact'
          title='No requirements yet'
          description='Select a provider to add materials, equipment, facilities, or other resources.'
        />
      )}
    </section>
  );
}
