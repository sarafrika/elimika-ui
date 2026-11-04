import { PayoutBatchPage } from '@/src/features/admin/pages/payout-batch-page';

export default async function AdminPayoutBatchRoute({
  params,
}: {
  params: Promise<{ batchUuid: string }>;
}) {
  const { batchUuid } = await params;
  return <PayoutBatchPage batchUuid={batchUuid} />;
}
