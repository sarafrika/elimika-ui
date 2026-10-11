import ManageApplicantPage from './_components/ManageApplicantPage';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string | string[] }>;
}) {
  const [{ id }, { type }] = await Promise.all([params, searchParams]);
  const typeHint = type === 'organisation' || type === 'instructor' ? type : undefined;
  return <ManageApplicantPage uuid={id} typeHint={typeHint} />;
}
