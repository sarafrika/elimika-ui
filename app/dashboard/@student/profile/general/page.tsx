import Spinner from '@/components/ui/spinner';
import StudentProfileGeneralForm from './_components/StudentProfileForm';

import { auth } from '../../../../../services/auth';
import { SearchResponse, searchStudents, Student, User } from '../../../../../services/client';

export default async function StudentProfileGeneralPage() {
  // const user = useUser();
  // const student = useStudent();
  const session = await auth();
  const user = session!.user as User;

  let student: Student;
  const searchResponse = await searchStudents({
    query: {
      searchParams: {
        user_uuid_eq: user.uuid!
      }
    },
    next: {
      revalidate: session!.decoded.exp
    }
  });

  // Work around
  const searchResult = searchResponse.data as SearchResponse;
  console.log(searchResult.data!.content);

  if (searchResult.data && searchResult.data.content && searchResult.data.content.length > 0) {
    student = searchResult.data!.content![0] as unknown as Student;
  }

  return (
    <>{user && student! ? <StudentProfileGeneralForm {...{ user, student }} /> : <Spinner />}</>
  );
}
