/**
 * Organisation dashboard shares the refined-neutral admin foundation. Re-exported
 * from a local barrel so org pages import from `../_components/ui`.
 *
 * As part of the Lovable redesign, the page header is overridden here to the
 * Lovable `PageHeader` (teal accent bar) — the explicit named re-export wins over
 * the `export *` of the same name, so every org page picks it up with no edits.
 * Other admin primitives (SectionCard, StatCard, AdminTable, StatusBadge…) are
 * still re-exported and used while individual pages are migrated.
 */
export * from '@/app/dashboard/@admin/_components/ui';
export { PageHeader as AdminPageHeader } from '@/components/dashboard';
