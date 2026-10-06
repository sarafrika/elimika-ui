type CatalogFilterItem = {
  kind: 'course' | 'program';
  minimumRate?: number;
};

export function matchesCatalogContentType(item: CatalogFilterItem, contentType: string) {
  return (
    contentType === 'all-courses' ||
    (contentType === 'programs' && item.kind === 'program') ||
    (contentType === 'short-courses' && item.kind === 'course')
  );
}

export function matchesCatalogPrice(item: CatalogFilterItem, price: string) {
  const paid = (item.minimumRate ?? 0) > 0;
  return price === 'all' || (price === 'paid' ? paid : !paid);
}

export function catalogPriceOptions(items: readonly CatalogFilterItem[]) {
  const paid = items.filter(item => matchesCatalogPrice(item, 'paid')).length;
  return [
    { value: 'free', label: 'Free', count: items.length - paid },
    { value: 'paid', label: 'Paid', count: paid },
  ];
}

export function catalogResultCount(
  items: readonly CatalogFilterItem[],
  serverCourseTotal?: number
) {
  return serverCourseTotal === undefined
    ? items.length
    : serverCourseTotal + items.filter(item => item.kind === 'program').length;
}
