'use client';

import { CustomPagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAllCategoriesOptions, getAllTrainingProgramsOptions, getPublishedCoursesOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Filter, Layers, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Badge } from '../../../../components/ui/badge';
import { CourseCard } from '../../_components/course-card';

export default function MyCoursesPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const size = 20;
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    ...getPublishedCoursesOptions({ query: { pageable: { page, size } } }),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const { data: programsData } = useQuery({
    ...getAllTrainingProgramsOptions({ query: { pageable: {} } }),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })

  const courses = data?.data?.content || [];
  const programs = programsData?.data?.content || [];

  const paginationMetadata = data?.data?.metadata;
  const programPaginationMetadata = programsData?.data?.metadata

  const { data: apiCat } = useQuery({
    ...getAllCategoriesOptions({ query: { pageable: {} } }),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })

  const apiCategories = apiCat?.data?.content || [];

  const CATEGORIES = [
    { name: 'All', displayName: 'All Categories' },
    ...apiCategories,
  ];

  const currentCategory = CATEGORIES.find(cat => cat.name === selectedCategory);

  const filteredCourses = courses?.filter((course: any) => {
    const matchesSearch =
      searchQuery === '' ||
      course?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course?.description?.toLowerCase().includes(searchQuery.toLowerCase());
    // course?.subtitle?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' ||
      course?.category_names?.some(
        (cat: string) => cat.toLowerCase() === currentCategory?.name.toLowerCase()
      );


    return matchesSearch && matchesCategory;
  });

  const filteredPrograms = programs?.filter((program: any) => {
    const matchesSearch =
      searchQuery === '' ||
      program?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program?.description?.toLowerCase().includes(searchQuery.toLowerCase());
    // course?.subtitle?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' ||
      program?.category_names?.some(
        (cat: string) => cat.toLowerCase() === currentCategory?.name.toLowerCase()
      );


    return matchesSearch && matchesCategory;
  });

  const [activeTab, setActiveTab] = useState<'courses' | 'programs'>('courses');


  // Reset filters when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'courses' | 'programs');
    setSearchQuery('');
    // setStatusFilter('all');
  };

  if (isLoading) {
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
      <div className='container mx-auto py-2'>
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className='w-full'>
          <TabsList className='mb-2 grid w-full max-w-md grid-cols-2'>
            <TabsTrigger value='courses' className='flex items-center gap-2'>
              <BookOpen className='h-4 w-4' />
              Courses
              {filteredCourses.length > 0 && (
                <Badge variant='secondary' className='ml-1'>
                  {filteredCourses.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value='programs' className='flex items-center gap-2'>
              <Layers className='h-4 w-4' />
              Programs
              {filteredPrograms.length > 0 && (
                <Badge variant='secondary' className='ml-1'>
                  {filteredPrograms.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Search and Filters */}
          <div className='mb-8'>
            <div className='mb-6 flex gap-4'>
              <div className='relative flex-1'>
                <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
                <Input
                  placeholder='Search courses...'
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

            {/* Category Tabs */}
            <div className='scrollbar-hidden w-auto overflow-hidden overflow-x-auto lg:max-w-5xl 2xl:max-w-[110rem]'>
              <Tabs
                value={selectedCategory}
                onValueChange={val => {
                  setSelectedCategory(val);
                }}
              >
                <TabsList className='scrollbar-hidden mb-4 flex space-x-2 overflow-x-auto px-1'>
                  {CATEGORIES.map(category => (
                    <TabsTrigger
                      key={category.name}
                      value={category.name}
                      className='flex flex-shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 hover:text-black data-[state=active]:bg-white data-[state=active]:text-black dark:hover:bg-gray-700 dark:hover:text-white  dark:data-[state=active]:text-white'
                    >
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Results */}
          <div className='mb-6'>
            <div className='flex items-center justify-between'>
              <h2>
                {selectedCategory === 'all' ? 'All Courses' : currentCategory?.name}
              </h2>
              <p className='text-muted-foreground text-sm'>
                {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>

          <TabsContent value='courses' className='mt-0'>
            {/* Course Grid */}
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'>
              {filteredCourses.map(course => (
                <CourseCard
                  key={course.uuid}
                  course={course as any}
                  isStudentView={true}
                  handleEnroll={() =>
                    router.push(`/dashboard/browse-courses/available-classes/${course.uuid}`)
                  }
                  handleSearchInstructor={() =>
                    router.push(`/dashboard/browse-courses/instructor?courseId=${course.uuid}`)
                  }
                  handleClick={() => router.push(`/dashboard/browse-courses/${course.uuid}`)}
                />
              ))}
            </div>

            {filteredCourses.length === 0 && (
              <div className='py-16 text-center'>
                <BookOpen className='text-muted-foreground mx-auto mb-4 h-16 w-16 opacity-50' />
                <h3 className='mb-2'>No courses found</h3>
                <p className='text-muted-foreground mb-4'>Try adjusting your search or filters</p>
                <Button
                  variant='outline'
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}

            {/* Load More */}
            {filteredCourses.length > 0 && (
              <div className='my-12 text-center'>
                <Button variant='outline'>Load More Courses</Button>
              </div>
            )}

            {/* @ts-ignore */}
            {paginationMetadata?.totalPages >= 1 && (
              <CustomPagination
                totalPages={paginationMetadata?.totalPages as number}
                onPageChange={page => {
                  setPage(page - 1);
                }}
              />
            )}
          </TabsContent>

          <TabsContent value='programs' className='mt-0'>
            {/* Course Grid */}
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'>
              {filteredPrograms.map(program => (
                <CourseCard
                  key={program.uuid}
                  course={program as any}
                  isStudentView={true}
                  handleEnroll={() =>
                    router.push(`/dashboard/browse-courses/available-programs/${program.uuid}`)
                  }
                  handleSearchInstructor={() =>
                    router.push(`/dashboard/browse-courses/instructor?courseId=${program.uuid}`)
                  }
                  handleClick={() => router.push(`/dashboard/browse-courses/${program.uuid}`)}
                />
              ))}
            </div>

            {filteredPrograms.length === 0 && (
              <div className='py-16 text-center'>
                <BookOpen className='text-muted-foreground mx-auto mb-4 h-16 w-16 opacity-50' />
                <h3 className='mb-2'>No courses found</h3>
                <p className='text-muted-foreground mb-4'>Try adjusting your search or filters</p>
                <Button
                  variant='outline'
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}

            {/* Load More */}
            {filteredPrograms.length > 0 && (
              <div className='my-12 text-center'>
                <Button variant='outline'>Load More Programs</Button>
              </div>
            )}

            {/* @ts-ignore */}
            {programPaginationMetadata?.totalPages >= 1 && (
              <CustomPagination
                totalPages={programPaginationMetadata?.totalPages as number}
                onPageChange={page => {
                  setPage(page - 1);
                }}
              />
            )}

          </TabsContent>



        </Tabs>






      </div>
    </div>
  );
}
