import { PublicCoursesPage } from '@/src/features/catalogue/components/PublicCoursesPage';
import { listPublicCatalogueCourses } from '@/src/features/catalogue/server';

export default async function PublicCoursesRoute() {
  try {
    const { items } = await listPublicCatalogueCourses();
    return <PublicCoursesPage items={items} />;
  } catch {
    return <PublicCoursesPage items={[]} hasError />;
  }
}
