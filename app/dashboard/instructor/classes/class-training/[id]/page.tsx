import { redirect } from 'next/navigation';

// The old training console is retired: its notes and grading grid never saved.
// Every link still landing here opens the class workbook on the same session.
export default async function TrainingInterfacePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const schedule = typeof query.schedule === 'string' ? query.schedule : undefined;
  redirect(`/dashboard/instructor/classes/training/${id}${schedule ? `?schedule=${encodeURIComponent(schedule)}` : ''}`);
}
