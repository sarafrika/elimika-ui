'use client';

import { CustomPagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAllCoursesOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Filter, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CourseCard } from '../../_components/course-card';

const CATEGORIES = [
  { id: 'all', name: 'All Categories', icon: '📚', subcategories: [] },
  {
    id: 'technology',
    name: 'Technology',
    icon: '💻',
    subcategories: [
      'Web Development',
      'Data Science',
      'AI & Machine Learning',
      'Mobile Development',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    icon: '💼',
    subcategories: ['Marketing', 'Finance', 'Management', 'Entrepreneurship'],
  },
  {
    id: 'design',
    name: 'Design',
    icon: '🎨',
    subcategories: ['UI/UX Design', 'Graphic Design', 'Web Design', 'Motion Graphics'],
  },
  {
    id: 'health',
    name: 'Health & Fitness',
    icon: '💪',
    subcategories: ['Nutrition', 'Yoga', 'Fitness Training', 'Mental Health'],
  },
  {
    id: 'arts',
    name: 'Arts & Crafts',
    icon: '🎭',
    subcategories: ['Painting', 'Photography', 'Music', 'Writing'],
  },
  {
    id: 'languages',
    name: 'Languages',
    icon: '🌍',
    subcategories: ['English', 'Spanish', 'French', 'Mandarin'],
  },
  {
    id: 'science',
    name: 'Science',
    icon: '🔬',
    subcategories: ['Physics', 'Chemistry', 'Biology', 'Astronomy'],
  },
  {
    id: 'personal-development',
    name: 'Personal Development',
    icon: '🌱',
    subcategories: ['Productivity', 'Mindfulness', 'Leadership', 'Career Growth'],
  },
  {
    id: 'finance',
    name: 'Finance',
    icon: '💰',
    subcategories: ['Investing', 'Personal Finance', 'Cryptocurrency', 'Real Estate'],
  },
  {
    id: 'gaming',
    name: 'Gaming',
    icon: '🎮',
    subcategories: ['Game Design', 'Esports', 'Streaming', 'Game Reviews'],
  },
  {
    id: 'education',
    name: 'Education',
    icon: '🏫',
    subcategories: ['Teaching', 'E-learning', 'Language Learning', 'Educational Technology'],
  },
  {
    id: 'travel',
    name: 'Travel',
    icon: '✈️',
    subcategories: ['Adventure', 'Budget Travel', 'Luxury Travel', 'Travel Tips'],
  },
];

export default function MyCoursesPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const size = 20;
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery(
    getAllCoursesOptions({ query: { pageable: { page, size } } })
  );
  const courses = data?.data?.content || [];
  const paginationMetadata = data?.data?.metadata;

  const currentCategory = CATEGORIES.find(cat => cat.id === selectedCategory);

  const filteredCourses = courses?.filter((course: any) => {
    const matchesSearch =
      searchQuery === '' ||
      course?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course?.description?.toLowerCase().includes(searchQuery.toLowerCase());
    // course?.subtitle?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' ||
      course?.category?.toLowerCase() === currentCategory?.name.toLowerCase();

    const matchesSubcategory =
      selectedSubcategory === '' || course?.subcategory === selectedSubcategory;

    return matchesSearch && matchesCategory && matchesSubcategory;
  });

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
          <div className='scrollbar-hidden w-auto lg:max-w-5xl 2xl:max-w-7xl overflow-hidden overflow-x-auto'>
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className='scrollbar-hidden mb-4 flex overflow-x-auto'>
                {CATEGORIES.map(category => (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className='flex-shrink-0 text-xs'
                  >
                    <span className='mr-1'>{category.icon}</span>
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Subcategories */}
              {currentCategory && currentCategory.subcategories.length > 0 && (
                <div className='mb-6 flex flex-wrap gap-2'>
                  <Button
                    variant={selectedSubcategory === '' ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setSelectedSubcategory('')}
                  >
                    All {currentCategory.name}
                  </Button>
                  {currentCategory.subcategories.map(sub => (
                    <Button
                      key={sub}
                      variant={selectedSubcategory === sub ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setSelectedSubcategory(sub)}
                    >
                      {sub}
                    </Button>
                  ))}
                </div>
              )}
            </Tabs>
          </div>
        </div>

        {/* Results */}
        <div className='mb-6'>
          <div className='flex items-center justify-between'>
            <h2>
              {selectedCategory === 'all' ? 'All Courses' : currentCategory?.name}
              {selectedSubcategory && ` - ${selectedSubcategory}`}
            </h2>
            <p className='text-muted-foreground text-sm'>
              {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>

        {/* Course Grid */}
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {filteredCourses.map(course => (
            <CourseCard
              key={course.uuid}
              course={course as any}
              isStudentView={true}
              handleEnroll={() => router.push(`/dashboard/browse-courses/enroll/${course.uuid}`)}
              handleSearchInstructor={() => router.push(`/dashboard/browse-courses/instructor`)}
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
                setSelectedSubcategory('');
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
      </div>
    </div>
  );
}
