'use client';

import { getAllStudentsOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Badge } from '../../../../../components/ui/badge';
import StudentsListPage from '../../../_components/student-list-page';

const statusFilterOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active only', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

export function StudentsWorkspace() {
  const pageSize = 20
  const [page, setPage] = useState(0);

  const { data: studentsData } = useQuery(
    getAllStudentsOptions({
      query: { pageable: { page, size: pageSize, sort: ['created_date,desc'] } }
    })
  );

  return (
    <div >
      <div className='flex flex-col space-y-3 py-6'>
        <Badge
          variant='outline'
          className='border-primary/60 bg-primary/10 text-xs font-semibold tracking-wide uppercase'
        >
          Students management
        </Badge>

        {/* Description */}
        <p className='text-muted-foreground max-w-3xl text-sm leading-relaxed'>
          View, manage, and monitor all students across the platform. Access profiles,
          track enrollments, review progress, and oversee student activity to ensure
          a smooth and organized learning experience.
        </p>
      </div>

      <StudentsListPage studentsData={studentsData} />
    </div>
  );
}

