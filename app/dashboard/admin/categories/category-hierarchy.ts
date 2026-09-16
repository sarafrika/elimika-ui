import type { Category } from '@/services/client';

export function categoryPath(category: Category, categories: Map<string, Category>): string {
  const names: string[] = [];
  const visited = new Set<string>();
  let current: Category | undefined = category;

  while (current) {
    if (current.uuid) {
      if (visited.has(current.uuid)) break;
      visited.add(current.uuid);
    }
    const parent = current.parent_uuid ? categories.get(current.parent_uuid) : undefined;
    // Prefer current names and relationships over a potentially stale stored path.
    // Keep the API path as a fallback when an ancestor is outside the loaded page.
    if (current.parent_uuid && !parent && current.category_path) {
      names.unshift(current.category_path);
      break;
    }
    names.unshift(current.name);
    if (!current.parent_uuid) break;
    if (!parent) names.unshift('Unknown parent');
    current = parent;
  }

  return names.join(' > ');
}

export function canBeParent(
  category: Category,
  editingUuid: string | undefined,
  categories: Map<string, Category>
): boolean {
  const visited = new Set<string>();
  let current: Category | undefined = category;

  while (current?.uuid) {
    if (current.uuid === editingUuid || visited.has(current.uuid)) return false;
    visited.add(current.uuid);
    current = current.parent_uuid ? categories.get(current.parent_uuid) : undefined;
  }

  return Boolean(category.uuid);
}
