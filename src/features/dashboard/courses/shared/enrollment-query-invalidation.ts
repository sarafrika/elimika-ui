import { getCartQueryKey } from '@/services/client/@tanstack/react-query.gen';
import type { QueryClient } from '@tanstack/react-query';

const enrollmentQueryIds = [
  'getEnrollmentOverviewForStudent',
  'getCourseEnrollmentsForStudent',
  'getClassEnrollmentsForStudent',
  'getScheduledInstanceEnrollmentsForStudent',
  'getStudentSchedule',
  'getStudentCertificates',
  'getStudentDashboard',
  'getEnrollmentsForClass',
  'getClassDefinition',
  'getPublishedCourses',
  'getCourseRecommendations',
] as const;

type EnrollmentSuccessInvalidationOptions = {
  cartId?: string | null;
};

export async function invalidateEnrollmentSuccessQueries(
  queryClient: QueryClient,
  options: EnrollmentSuccessInvalidationOptions = {}
) {
  const invalidations = enrollmentQueryIds.map(_id =>
    queryClient.invalidateQueries({ queryKey: [{ _id }] })
  );

  invalidations.push(queryClient.invalidateQueries({ queryKey: ['notifications'] }));

  if (options.cartId) {
    invalidations.push(
      queryClient.invalidateQueries({
        queryKey: getCartQueryKey({ path: { cartId: options.cartId } }),
      })
    );
  }

  await Promise.all(invalidations);
}
