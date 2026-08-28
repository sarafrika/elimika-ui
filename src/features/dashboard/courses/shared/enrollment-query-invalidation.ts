import { invalidateEnrollmentWorkflowQueries } from '@/src/features/dashboard/workflow-query-invalidation';
import type { QueryClient } from '@tanstack/react-query';

type EnrollmentSuccessInvalidationOptions = {
  cartId?: string | null;
};

export async function invalidateEnrollmentSuccessQueries(
  queryClient: QueryClient,
  _options: EnrollmentSuccessInvalidationOptions = {}
) {
  await invalidateEnrollmentWorkflowQueries(queryClient);
}
