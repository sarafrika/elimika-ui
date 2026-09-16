import type { Category } from '@/services/client';

export function categoryAncestors(category: Category, byId: ReadonlyMap<string, Category>) {
  const ancestors: Category[] = [];
  const visited = new Set<Category>();
  let current: Category | undefined = category;
  while (current && !visited.has(current)) {
    visited.add(current);
    ancestors.unshift(current);
    current = current.parent_uuid ? byId.get(current.parent_uuid) : undefined;
  }
  return ancestors;
}

export function buildCategoryTabOptions(categories: readonly Category[]) {
  const byId = new Map(categories.map(category => [category.uuid ?? category.name, category]));
  return categories
    .filter(category => !category.parent_uuid)
    .map(root => ({
      value: root.uuid ?? root.name,
      label: root.name,
      subjects: categories
        .flatMap(category => {
          if (!category.parent_uuid) return [];
          const ancestors = categoryAncestors(category, byId);
          if (ancestors[0] !== root) return [];
          return [
            {
              value: category.uuid ?? category.name,
              label: ancestors
                .slice(1)
                .map(ancestor => ancestor.name)
                .join(' > '),
            },
          ];
        })
        .sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Match a category or any descendant, preferring UUIDs over ambiguous names. */
export function matchesCategoryFilter(
  item: { categoryUuids?: readonly string[]; categoryLabels: readonly string[] },
  selected: string,
  categories: readonly Category[],
  byId: ReadonlyMap<string, Category>
) {
  const assigned = item.categoryUuids?.length
    ? item.categoryUuids.flatMap(uuid => {
        const category = byId.get(uuid);
        return category ? [category] : [];
      })
    : categories.filter(category => item.categoryLabels.includes(category.name));
  return (
    item.categoryUuids?.includes(selected) ||
    assigned.some(category =>
      categoryAncestors(category, byId).some(
        ancestor => (ancestor.uuid ?? ancestor.name) === selected
      )
    )
  );
}
