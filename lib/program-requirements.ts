import type { ProvidedByEnum } from '@/services/client/types.gen';

/** Program requirement types identify the provider, rather than the resource type. */
export function programRequirementProvider(value: string | null | undefined): ProvidedByEnum | undefined {
  switch (value?.trim().toUpperCase()) {
    case 'TRAINING_CENTER':
      return 'organisation';
    case 'INSTRUCTOR':
      return 'instructor';
    case 'STUDENT':
      return 'student';
    default:
      return undefined;
  }
}

export function readProgramRequirementText(text: string) {
  const match =
    /^Name: ([\s\S]*?)\nType: (\w+)\nQuantity: ([^\n]+)\nUnit: ([^\n]+)(?:\nDescription: ?([\s\S]*))?$/.exec(
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

