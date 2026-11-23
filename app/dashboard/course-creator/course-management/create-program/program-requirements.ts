import { readProgramRequirementText } from '@/lib/program-requirements';
import type { RequirementEntry } from '../../_components/training-requirement-fields';
import type { ProgramFormValues } from './program-schema';

export { readProgramRequirementText } from '@/lib/program-requirements';
export { writeRequirementText as programRequirementText } from '@/lib/program-requirements';

export function requirementEntry(row: ProgramFormValues['requirements'][number]): RequirementEntry {
  return (
    row.resource ?? {
      ...readProgramRequirementText(row.requirementText),
      is_mandatory: row.isMandatory,
    }
  );
}
