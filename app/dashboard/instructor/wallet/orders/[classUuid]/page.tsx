import { TrainingOrderDetails } from '@/app/dashboard/_components/wallet/TrainingOrderDetails';

export default async function ClassOrderPage({
  params,
}: {
  params: Promise<{ classUuid: string }>;
}) {
  const { classUuid } = await params;
  return <TrainingOrderDetails key={classUuid} role='instructor' classUuid={classUuid} />;
}
