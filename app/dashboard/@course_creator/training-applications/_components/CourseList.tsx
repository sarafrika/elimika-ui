import { Skeleton } from '@/components/ui/skeleton';
import type { Course } from '@/services/client';
import CourseCard from './CourseCard';
import CourseFilters from './CourseFilters';

interface CreatorsListProps {
  courses: Course[];
  selectedCourse: Course | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  onCourseSelect: (course: Course) => void;
  onCourseDelete: (course: Course) => void;
  isLoading: boolean;
}

export default function CourseList({
  courses,
  selectedCourse,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  sortOrder,
  setSortOrder,
  onCourseSelect,
  onCourseDelete,
  isLoading,
}: CreatorsListProps) {
  return (
    <div className='bg-background flex w-full flex-col border-b lg:w-80 lg:border-r lg:border-b-0'>
      {/* Search and Filters Header */}
      <CourseFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />

      {/* Course List */}
      <div className='flex-1 overflow-y-auto'>
        {isLoading ? (
          <div className='flex flex-col gap-3'>
            <Skeleton className='h-[100px] w-full px-4' />
            <Skeleton className='h-[100px] w-full px-4' />
            <Skeleton className='h-[100px] w-full px-4' />
            <Skeleton className='h-[100px] w-full px-4' />
            <Skeleton className='h-[100px] w-full px-4' />
          </div>
        ) : (
          courses.map(course => (
              <CourseCard
                key={course.uuid}
                course={course}
                isSelected={selectedCourse?.uuid === course.uuid}
                onSelect={onCourseSelect}
                onDelete={onCourseDelete}
              />
            ))
        )}
      </div>
    </div>
  );
}
