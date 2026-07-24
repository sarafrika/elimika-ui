'use client';

import { useQuery } from '@tanstack/react-query';

import { CourseRail, CourseRailSkeleton, type CourseRailItem } from '@/components/dashboard';
import { useOrganisation } from '@/context/organisation-context';
import type { ClassDefinition } from '@/services/client/types.gen';
import { getClassDefinitionsForOrganisationOptions } from '@/services/client/@tanstack/react-query.gen';

const prettify = (value?: string | null) =>
  value
    ? value
        .toString()
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase())
    : undefined;

/**
 * Container for the "Active classes" rail on the overview. Reuses the org class
 * definitions endpoint and maps each definition into a presentational rail item.
 */
export function OverviewCourseRail() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const classesQuery = useQuery({
    ...getClassDefinitionsForOrganisationOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });

  if (classesQuery.isLoading) {
    return <CourseRailSkeleton />;
  }

  const definitions = ((classesQuery.data?.data ?? []) as Array<{ class_definition?: ClassDefinition }>)
    .map(item => item.class_definition)
    .filter((item): item is ClassDefinition => Boolean(item?.uuid));

  const items: CourseRailItem[] = definitions.slice(0, 12).map(definition => ({
    id: definition.uuid as string,
    name: definition.title,
    category: prettify(definition.class_visibility),
    metaLeft: prettify(definition.session_format),
    metaRight: definition.is_active ? 'Active' : 'Inactive',
    href: '/dashboard/classes',
  }));

  return <CourseRail title='Active classes' items={items} viewAllHref='/dashboard/classes' />;
}
