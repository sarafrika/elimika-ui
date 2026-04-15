import { redirect } from 'next/navigation';

export default async function LegacyInstructorConsolePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const nextSearchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(item => nextSearchParams.append(key, item));
      return;
    }

    if (value) nextSearchParams.set(key, value);
  });

  const queryString = nextSearchParams.toString();
  redirect(`/dashboard/classes/class-training/${id}${queryString ? `?${queryString}` : ''}`);
}
