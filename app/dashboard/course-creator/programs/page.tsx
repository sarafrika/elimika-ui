'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const ProgramsPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/course-creator/courses');
  }, [router]);

  return null;
};

export default ProgramsPage;