import { PublicCoursesPage } from '@/src/components/catalogue/PublicCoursesPage';
import { listPublicCatalogueCourses } from '@/src/lib/catalogue/server';

export default async function PublicCoursesRoute() {
  try {
    const { items } = await listPublicCatalogueCourses();
    return <PublicCoursesPage items={items} />;
  } catch {
    return <PublicCoursesPage items={[]} hasError />;
  }
}
