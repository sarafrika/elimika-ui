import { readProgramRequirementText } from '@/lib/program-requirements';
import type { RequirementEntry } from '../../_components/training-requirement-fields';
import type { ProgramFormValues } from './program-schema';

export { readProgramRequirementText } from '@/lib/program-requirements';

export function programRequirementText(resource: RequirementEntry) {
  const description = resource.description?.trim();
  return `Name: ${resource.name.trim()}\nType: ${resource.requirement_type}\nQuantity: ${resource.quantity || '0'}\nUnit: ${resource.unit}${description ? `\nDescription: ${description}` : ''}`;
}

export function requirementEntry(row: ProgramFormValues['requirements'][number]): RequirementEntry {
  return (
    row.resource ?? {
      ...readProgramRequirementText(row.requirementText),
      is_mandatory: row.isMandatory,
    }
  );
}
