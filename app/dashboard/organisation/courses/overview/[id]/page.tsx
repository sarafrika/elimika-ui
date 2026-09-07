import { redirect } from 'next/navigation';

/**
 * Kept only to catch existing links and bookmarks.
 *
 * This path used to hold a copy of the instructor class-preview screen
 * (`app/dashboard/instructor/classes/overview/[id]`), keyed on a *class* uuid —
 * but the one place in the app that linked here, the branch course grid, passed
 * a *course* uuid, so the screen never resolved a class for any real visitor.
 * The course record is what those links were reaching for, and that is where the
 * uuid now goes. The class preview itself survives on the instructor route.
 */
export default async function OrganisationCourseOverviewRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/organisation/courses/${id}`);
}
