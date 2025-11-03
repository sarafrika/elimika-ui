'use client';

import { useParams } from 'next/navigation';
import { useStudent } from '../../../../../context/student-context';

export default function ClassDetailsPage() {
  const params = useParams();
  const classId = params?.id as string;
  const student = useStudent();

  return <div>Whats here</div>;
}
