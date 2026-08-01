import StudentInstructorSearchPage from './_components/student-instructor-search-page';

type WorkspaceInstructorSearchPageProps = {
  params: Promise<{ domain: string }>;
};

export default async function StudentInstructorSearchRoute({
  params,
}: WorkspaceInstructorSearchPageProps) {
  //   const { domain } = await params;
  //   const normalizedDomain = normalizeStoredUserDomain(domain);

  return <StudentInstructorSearchPage />;
}
