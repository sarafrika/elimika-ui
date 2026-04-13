'use client';

import RichTextRenderer from '@/components/editors/richTextRenders';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Course, TrainingProgram } from '@/services/client';
import {
  getAllDifficultyLevelsOptions,
  getCourseCreatorByUuidOptions,
  getCourseEnrollmentsOptions,
  getUserByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { isAuthenticatedMediaUrl, toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Heart, Play, Share, Star, Users } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface CourseCardProps {
  course: Course | TrainingProgram;
  handleClick: () => void;
  handleEnroll: () => void;
  handleSearchInstructor: () => void;
  isStudentView: boolean;
}

export function CourseCard({
  course,
  handleClick,
  isStudentView,
  handleEnroll,
  handleSearchInstructor,
}: CourseCardProps) {
  const _router = useRouter();
  const courseName = 'name' in course ? course.name : course.title;
  const courseCategories = 'category_names' in course ? course.category_names : undefined;
  const difficultyUuid = 'difficulty_uuid' in course ? course.difficulty_uuid : undefined;
  const introVideoUrl = 'intro_video_url' in course ? course.intro_video_url : undefined;
  const bannerUrl = 'banner_url' in course ? course.banner_url : undefined;
  const resolvedBannerUrl = toAuthenticatedMediaUrl(bannerUrl);
  const classLimit = 'class_limit' in course ? course.class_limit : undefined;
  const totalDurationDisplay =
    'total_duration_display' in course ? course.total_duration_display : undefined;

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const { data: courseCreator } = useQuery({
    ...getCourseCreatorByUuidOptions({ path: { uuid: course?.course_creator_uuid as string } }),
    enabled: !!course?.course_creator_uuid,
  });

  const { data: courseCreatorUser } = useQuery({
    ...getUserByUuidOptions({ path: { uuid: courseCreator?.data?.user_uuid as string } }),
    enabled: !!courseCreator?.data?.user_uuid,
  });
  const creatorName = courseCreatorUser?.data?.full_name || courseCreator?.data?.full_name || '';
  const creatorImageUrl = courseCreatorUser?.data?.profile_image_url ?? '';

  const { data } = useQuery({
    ...getCourseEnrollmentsOptions({
      path: { courseUuid: course?.uuid as string },
    }),
    enabled: !!course?.uuid,
  })
  const enrollments = data?.data?.content || [];
  console.log(enrollments, 'enrollments data');

  const { data: difficulty } = useQuery(getAllDifficultyLevelsOptions());
  const difficultyLevels = difficulty?.data;

  const getDifficultyNameFromUUID = (uuid: string): string | undefined => {
    return difficultyLevels?.find(level => level.uuid === uuid)?.name;
  };

  const getDifficultyColor = (uuid: string) => {
    const difficultyName = getDifficultyNameFromUUID(uuid);

    switch (difficultyName?.toLowerCase()) {
      case 'beginner':
        return 'bg-success/10 text-success';
      case 'intermediate':
        return 'bg-warning/10 text-warning';
      case 'advanced':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card
      className='group border-border max-w-[360px] cursor-pointer rounded-lg border-[1px] p-0 transition-all hover:-translate-y-1 hover:shadow-lg'
      onClick={handleClick}
    >
      <div className='relative'>
        {/* Course Image */}
        <div className='bg-muted relative flex h-48 w-full items-center justify-center overflow-hidden rounded-t-lg'>
          {resolvedBannerUrl ? (
            <Image
              src={resolvedBannerUrl}
              alt={courseName || 'banner'}
              className='h-full w-full object-cover transition-transform duration-700 group-hover:scale-110'
              width={400}
              height={208}
              unoptimized={isAuthenticatedMediaUrl(resolvedBannerUrl)}
            />
          ) : (
            <BookOpen className='text-primary/40 h-16 w-16' />
          )}

          {/* Video indicator */}
          {introVideoUrl && (
            <div className='absolute top-3 left-3 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-xs text-white'>
              <Play className='h-3 w-3' />
              Video
            </div>
          )}

          {/* Actions */}
          <div className='absolute top-3 right-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100'>
            <Button
              size='sm'
              variant='secondary'
              className='h-8 w-8 p-0'
              onClick={e => {
                e.stopPropagation();
              }}
            >
              <Heart className='h-4 w-4' />
            </Button>
            <Button
              size='sm'
              variant='secondary'
              className='h-8 w-8 p-0'
              onClick={e => {
                e.stopPropagation();
              }}
            >
              <Share className='h-4 w-4' />
            </Button>
          </div>

          {/* Difficulty Badge */}
          <div className='absolute bottom-3 left-3'>
            <Badge className={getDifficultyColor(difficultyUuid as string)}>
              {getDifficultyNameFromUUID(difficultyUuid as string)}
            </Badge>
          </div>
        </div>

        <CardContent className='p-4'>
          {/* Category */}
          <div className='mb-2 flex items-center gap-2'>
            {courseCategories?.map((category, index) => (
              <Badge key={index} variant='outline' className='text-xs'>
                {category}
              </Badge>
            ))}
          </div>

          {/* Title and Subtitle */}
          <h3 className='group-hover:text-primary mb-1 line-clamp-2 min-h-12 font-bold transition-colors'>
            {courseName}
          </h3>

          <div className='text-muted-foreground mb-3 line-clamp-2 text-sm'>
            <RichTextRenderer htmlString={course?.description ?? ''} />
          </div>

          {/* Course Creator */}
          <div className='mb-3 flex items-center gap-2'>
            <Avatar className='min-h-9 min-w-9'>
              <AvatarImage
                src={creatorImageUrl}
                alt={creatorName}
                className='h-full w-full object-cover'
              />
              <AvatarFallback className='text-xs'>{getInitials(creatorName) || 'XY'}</AvatarFallback>
            </Avatar>
            <span className='text-muted-foreground text-sm'>{creatorName}</span>
          </div>

          {/* Stats */}
          <div className='text-muted-foreground mb-4 flex items-center gap-4 text-sm'>
            <div className='flex items-center gap-1'>
              <Star className='h-4 w-4 fill-yellow-400 text-yellow-400' />
              {/* <span>{course?.rating}</span> */}
              {/* <span>{1.2}</span> */}
            </div>
            <div className='flex items-center gap-1'>
              <Users className='h-4 w-4' />
              <span>{enrollments.length} enrollments</span>
            </div>
          </div>

          <div className='flex items-end justify-between gap-2 self-end pt-4'>
            {isStudentView ? (
              <>
                <Button
                  onClick={e => {
                    e.stopPropagation();
                    handleSearchInstructor();
                    // router.push(`/dashboard/all-courses/instructor/123`);
                  }}
                  size='sm'
                  variant='outline'
                >
                  Search Instructor
                </Button>
                <Button
                  size='sm'
                  onClick={e => {
                    e.stopPropagation();
                    handleEnroll();
                    // router.push(`/dashboard/all-courses/enroll/${course.uuid}`);
                  }}
                >
                  Enroll
                </Button>
              </>
            ) : (
              <Button
                size='sm'
                variant='outline'
                onClick={e => {
                  e.stopPropagation();
                  handleClick();
                }}
              >
                View details
              </Button>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
