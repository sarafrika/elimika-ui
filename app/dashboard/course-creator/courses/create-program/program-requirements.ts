import type { RequirementEntry } from '../../_components/training-requirement-fields';
import type { ProgramFormValues } from './program-schema';

export function programRequirementText(resource: RequirementEntry) {
  return `Name: ${resource.name.trim()}\nType: ${resource.requirement_type}\nQuantity: ${resource.quantity || '0'}\nUnit: ${resource.unit}\nDescription: ${resource.description.trim()}`;
}

export function readProgramRequirementText(text: string): RequirementEntry {
  const match =
    /^Name: ([\s\S]*?)\nType: (\w+)\nQuantity: ([^\n]+)\nUnit: ([^\n]+)\nDescription: ?([\s\S]*)$/.exec(
      text
    );
  return {
    name: match?.[1] ?? text,
    requirement_type: match?.[2] ?? 'material',
    quantity: match?.[3] ?? '0',
    unit: match?.[4] ?? 'pieces',
    description: match?.[5] ?? '',
    is_mandatory: true,
  };
}

export function requirementEntry(row: ProgramFormValues['requirements'][number]): RequirementEntry {
  return (
    row.resource ?? {
      ...readProgramRequirementText(row.requirementText),
      is_mandatory: row.isMandatory,
    }
  );
}
