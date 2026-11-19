import type { ClassDefinition, ClassDefinitionResponse } from '@/services/client';
import { type ClassFilters, matchesClassFilters } from './class-filters';

export type ClassShareScope = {
  kind: 'organisation' | 'instructor';
  uuid: string;
};

export function parseClassShareScope(
  read: (key: string) => string | null
): ClassShareScope | undefined {
  const organisation = read('organisation');
  if (organisation) return { kind: 'organisation', uuid: organisation };
  const instructor = read('instructor');
  if (instructor) return { kind: 'instructor', uuid: instructor };
  return undefined;
}

/** A share link always identifies one owner, independently of listing filters. */
export function classSharePath(scope: ClassShareScope) {
  return `/class-invite?${new URLSearchParams({ [scope.kind]: scope.uuid })}`;
}

export function belongsToClassShare(
  definition: Pick<ClassDefinition, 'organisation_uuid' | 'default_instructor_uuid'>,
  scope: ClassShareScope
) {
  return scope.kind === 'organisation'
    ? definition.organisation_uuid === scope.uuid
    : definition.default_instructor_uuid === scope.uuid;
}

/** Owner endpoints return complete lists, so filter before UI pagination. */
export function matchesClassShare(
  row: ClassDefinitionResponse,
  scope: ClassShareScope,
  filters: ClassFilters,
  search: string
) {
  const definition = row.class_definition;
  if (!definition || !belongsToClassShare(definition, scope)) return false;
  if (!matchesClassFilters(definition, filters, { includeInactive: true })) return false;
  const term = search.trim().toLocaleLowerCase();
  return (
    !term ||
    [
      definition.title,
      definition.description,
      definition.location_name,
      row.course_title,
      row.program_title,
    ].some(value => value?.toLocaleLowerCase().includes(term))
  );
}
