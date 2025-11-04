'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Filter, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useStudent } from '../../../../context/student-context';
import useStudentClassDefinitions from '../../../../hooks/use-student-class-definition';
import EnrollCourseCard from '../../_components/enroll-course-card';

export default function MyClassesPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const student = useStudent();

  const { classDefinitions, isError, loading } = useStudentClassDefinitions(student);
  const classes = classDefinitions || [];

  // ✅ Updated filter to match new shape
  const filteredClasses = classes.filter((course: any) => {
    const title = course.classDetails?.title ?? '';
    const subtitle = course.classDetails?.subtitle ?? '';
    const subcategory = course.classDetails?.subcategory ?? '';

    const matchesSearch =
      searchQuery === '' ||
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subtitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSubcategory = selectedSubcategory === '' || subcategory === selectedSubcategory;

    return matchesSearch && matchesSubcategory;
  });

  if (loading) {
    return (
      <div className='flex flex-col gap-6 space-y-2'>
        <Skeleton className='h-[150px] w-full' />

        <div className='flex flex-row items-center justify-between gap-4'>
          <Skeleton className='h-[250px] w-2/3' />
          <Skeleton className='h-[250px] w-1/3' />
        </div>

        <Skeleton className='h-[100px] w-full' />
      </div>
    );
  }

  return (
    <div className='min-h-screen'>
      <div className='container mx-auto'>
        {/* Search and Filters */}
        <div className='mb-8'>
          <div className='mb-6 flex gap-4'>
            <div className='relative flex-1'>
              <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
              <Input
                placeholder='Search classes...'
                className='pl-10'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant='outline'>
              <Filter className='mr-2 h-4 w-4' />
              Filters
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className='mb-6'>
          <div className='flex items-center justify-between'>
            <p className='text-muted-foreground text-sm'>
              {filteredClasses.length} class{filteredClasses.length !== 1 ? 'es' : ''} found
            </p>
          </div>
        </div>

        {/* Course Grid */}
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {filteredClasses.map(({ uuid, classDetails, enrollments, course }) => (
            <EnrollCourseCard
              key={uuid}
              href={`/dashboard/my-classes/${uuid}`}
              cls={classDetails}
              enrollmentPercentage={5}
              isFull={false}
              disableEnroll={true}
              handleEnroll={() => {}}
            />
          ))}
        </div>

        {filteredClasses.length === 0 && (
          <div className='py-16 text-center'>
            <BookOpen className='text-muted-foreground mx-auto mb-4 h-16 w-16 opacity-50' />
            <h3 className='mb-2'>No classes found</h3>
            <p className='text-muted-foreground mb-4'>Try adjusting your search or filters</p>
            <Button
              variant='outline'
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedSubcategory('');
              }}
            >
              Clear filters
            </Button>
          </div>
        )}

        {/* Load More */}
        {filteredClasses.length > 0 && (
          <div className='my-12 text-center'>
            <Button variant='outline'>Load More Courses</Button>
          </div>
        )}
      </div>
    </div>
  );
}
