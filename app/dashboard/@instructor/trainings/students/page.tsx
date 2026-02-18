'use client';

import { getAllStudentsOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import StudentsListPage from '../../../_components/student-list-page';

export default function StudentsPage() {
  const [pageSize] = useState(20);
  const [page, setPage] = useState(0);

  const { data: studentsData } = useQuery(
    getAllStudentsOptions({
      query: { pageable: { page: 0, size: pageSize } },
    })
  );

  return (
    <div>
      <StudentsListPage studentsData={studentsData} />
    </div>
  );
}
