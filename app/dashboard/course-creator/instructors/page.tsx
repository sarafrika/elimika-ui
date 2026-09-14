import InstructorDirectory from './_components/InstructorDirectory';

export default async function InstructorsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  return (
    <InstructorDirectory initialType={type === 'organisation' ? 'organisation' : 'instructor'} />
  );
}
