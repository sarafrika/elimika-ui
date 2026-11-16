'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { Offering } from '@/components/class-form';
import { extractPage } from '@/lib/api-helpers';
import { STALE_TIMES } from '@/lib/query-client';
import type { Category } from '@/services/client';
import { getAllCategoriesOptions } from '@/services/client/@tanstack/react-query.gen';

/** No sub-category: the offering sits directly under its category. */
export const GENERAL_SUBJECT = 'general';
/** The offering's category is unknown, or not loaded yet. */
export const UNCATEGORISED = 'uncategorised';

type Placement = { offering: Offering; categoryUuid: string; subjectUuid: string };
type Option = { value: string; label: string };

/**
 * Places each approved offering under Category → Subject, where a subject is a child category.
 * Offerings in several categories appear under each of them.
 */
export function useOfferingTaxonomy(offerings: Offering[]) {
  const categoriesQuery = useQuery({
    ...getAllCategoriesOptions({ query: { pageable: { page: 0, size: 100 } } }),
    staleTime: STALE_TIMES.reference,
  });
  const all = useMemo(
    () => extractPage<Category>(categoriesQuery.data).items,
    [categoriesQuery.data]
  );

  const placements = useMemo<Placement[]>(() => {
    const byUuid = new Map(all.map(category => [category.uuid ?? '', category]));
    const byName = new Map(all.map(category => [category.name.toLowerCase(), category]));
    const place = (category: Category | undefined) => {
      if (!category?.uuid) return null;
      const parent = category.parent_uuid ? byUuid.get(category.parent_uuid) : undefined;
      return parent?.uuid
        ? { categoryUuid: parent.uuid, subjectUuid: category.uuid }
        : { categoryUuid: category.uuid, subjectUuid: GENERAL_SUBJECT };
    };

    return offerings.flatMap(offering => {
      const found =
        offering.kind === 'Program'
          ? [place(offering.categoryUuid ? byUuid.get(offering.categoryUuid) : undefined)]
          : offering.categoryNames.map(name => place(byName.get(name.toLowerCase())));
      const spots = found.filter((spot): spot is NonNullable<typeof spot> => spot !== null);
      return spots.length > 0
        ? spots.map(spot => ({ offering, ...spot }))
        : [{ offering, categoryUuid: UNCATEGORISED, subjectUuid: GENERAL_SUBJECT }];
    });
  }, [offerings, all]);

  const nameOf = (uuid: string) =>
    uuid === GENERAL_SUBJECT
      ? 'General'
      : uuid === UNCATEGORISED
        ? 'Uncategorised'
        : (all.find(category => category.uuid === uuid)?.name ?? 'Category');

  const unique = (values: string[]): Option[] =>
    Array.from(new Set(values))
      .map(value => ({ value, label: nameOf(value) }))
      .sort((a, b) => a.label.localeCompare(b.label));

  const categories = unique(placements.map(p => p.categoryUuid));
  const subjectsFor = (categoryUuid: string) =>
    unique(placements.filter(p => p.categoryUuid === categoryUuid).map(p => p.subjectUuid));
  const offeringsFor = (categoryUuid: string, subjectUuid: string) =>
    placements
      .filter(p => p.categoryUuid === categoryUuid && p.subjectUuid === subjectUuid)
      .map(p => p.offering);
  const placementOf = (value: string) => placements.find(p => p.offering.value === value);

  return {
    categories,
    subjectsFor,
    offeringsFor,
    placementOf,
    nameOf,
    allCategories: all,
    loading: categoriesQuery.isLoading,
  };
}

export type OfferingTaxonomy = ReturnType<typeof useOfferingTaxonomy>;
