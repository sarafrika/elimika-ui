'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { requirementTypes } from './course-creation-types';

export const REQUIREMENT_UNITS = [
  'pieces',
  'units',
  'sets',
  'bundles',
  'dozens',
  'pairs',
  'boxes',
  'kits',
  'seats',
  'license',
  'licenses',
  'copies',
  'other',
];

export type RequirementEntry = {
  name: string;
  requirement_type: string;
  quantity: string;
  unit: string;
  is_mandatory: boolean;
  description: string;
};

/** Shared entry fields for course and program resource requirements. */
export function TrainingRequirementFields({
  value,
  onChange,
  disabled,
  instructor = false,
  label = 'Requirement',
  nameInvalid,
  quantityInvalid,
}: {
  value: RequirementEntry;
  onChange: (patch: Partial<RequirementEntry>) => void;
  disabled?: boolean;
  instructor?: boolean;
  label?: string;
  nameInvalid?: boolean;
  quantityInvalid?: boolean;
}) {
  const education = value.requirement_type === 'education';
  const types = instructor ? [...requirementTypes, 'education'] : requirementTypes;
  return (
    <>
      <td className='px-3 py-2'>
        <Textarea
          disabled={disabled}
          aria-label={`${label} name`}
          aria-invalid={nameInvalid}
          placeholder='e.g., Piano room'
          value={value.name}
          onChange={event => onChange({ name: event.target.value })}
          className='min-w-[140px]'
        />
      </td>
      <td className='px-3 py-2'>
        <Select
          disabled={disabled}
          value={value.requirement_type}
          onValueChange={requirement_type =>
            onChange({
              requirement_type,
              ...(requirement_type === 'education' ? { quantity: '1', unit: 'license' } : {}),
            })
          }
        >
          <SelectTrigger aria-label={`${label} type`} className='min-w-[110px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {types.map(type => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className='px-3 py-2'>
        {education ? (
          <span className='text-muted-foreground'>1</span>
        ) : (
          <Input
            disabled={disabled}
            type='number'
            min={0}
            aria-label={`${label} quantity`}
            aria-invalid={quantityInvalid}
            value={value.quantity}
            onChange={event => onChange({ quantity: event.target.value })}
            className='w-20'
          />
        )}
      </td>
      <td className='px-3 py-2'>
        {education ? (
          <span className='text-muted-foreground'>license</span>
        ) : (
          <Select disabled={disabled} value={value.unit} onValueChange={unit => onChange({ unit })}>
            <SelectTrigger aria-label={`${label} unit`} className='min-w-[100px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REQUIREMENT_UNITS.map(unit => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </td>
      <td className='px-3 py-2'>
        <Checkbox
          disabled={disabled}
          aria-label={`${label} mandatory`}
          checked={value.is_mandatory}
          onCheckedChange={checked => onChange({ is_mandatory: checked === true })}
        />
      </td>
      <td className='px-3 py-2'>
        <Input
          disabled={disabled}
          aria-label={`${label} description`}
          placeholder='Optional'
          value={value.description}
          onChange={event => onChange({ description: event.target.value })}
          className='min-w-[160px]'
        />
      </td>
    </>
  );
}
