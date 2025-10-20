const DOMAIN_STYLES: Record<string, string> = {
  student: 'border-blue-200 bg-blue-50 text-blue-700',
  instructor: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  course_creator: 'border-sky-200 bg-sky-50 text-sky-700',
  organisation: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  organisation_user: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  admin: 'border-red-200 bg-red-50 text-red-700',
};

export function formatDomainLabel(domain: string) {
  return domain
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function domainBadgeClass(domain: string) {
  return DOMAIN_STYLES[domain] ?? 'border-slate-200 bg-slate-50 text-slate-700';
}
