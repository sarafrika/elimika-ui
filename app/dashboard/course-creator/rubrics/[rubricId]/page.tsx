import RubricManager from '../rubric-manager';

export default async function RubricDetailPage({
  params,
}: {
  params: Promise<{ rubricId: string }>;
}) {
  const { rubricId } = await params;
  return <RubricManager rubricUuid={rubricId} />;
}
