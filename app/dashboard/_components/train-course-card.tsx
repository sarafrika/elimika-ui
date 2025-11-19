'use client';

import RichTextRenderer from '@/components/editors/richTextRenders';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { Course } from '@/services/client';
import {
  getAllDifficultyLevelsOptions,
  getCourseCreatorByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, CheckCircle2, Clock, Heart, Pencil, Play, Share, Star, Users, XCircle } from 'lucide-react';
import Image from 'next/image';

interface TrainCourseCardProps {
  course: Course & { application?: any };
  applicationStatus?: string | null;
  applicationReviewNote?: string | null;
  handleClick: () => void;
  handleQuickApply: () => void;
  handleReapplyToTrain: () => void
}

export function TrainCourseCard({
  course,
  applicationStatus,
  applicationReviewNote,
  handleClick,
  handleQuickApply,
  handleReapplyToTrain
}: TrainCourseCardProps) {
  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const { data: creator } = useQuery(
    getCourseCreatorByUuidOptions({ path: { uuid: course?.course_creator_uuid as string } })
  );
  // @ts-ignore
  const courseCreator = creator?.data;

  const { data: difficulty } = useQuery(getAllDifficultyLevelsOptions());
  const difficultyLevels = difficulty?.data;

  const getDifficultyNameFromUUID = (uuid: string): string | undefined => {
    return difficultyLevels?.find(level => level.uuid === uuid)?.name;
  };

  const getDifficultyColor = (uuid: string) => {
    const difficultyName = getDifficultyNameFromUUID(uuid);

    switch (difficultyName?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderIcon = () => {
    switch (applicationStatus) {
      case 'approved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'revoked':
        return <XCircle className="w-4 h-4 text-rose-600" />;
      default:
        return <Pencil className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className='group cursor-pointer rounded-lg border-[1px] border-gray-400 bg-white transition-all hover:-translate-y-1 hover:shadow-lg'>
      <div className='relative'>
        {/* Course Image */}
        <div className='relative flex h-48 w-full items-center justify-center overflow-hidden rounded-t-lg bg-muted'>
          {course?.banner_url ? (
            <Image
              src={course?.banner_url}
              alt={course?.name}
              className='h-full w-full object-cover'
              width={24}
              height={24}
            />
          ) : (
            <BookOpen className='text-primary/40 h-16 w-16' />
          )}

          {/* Video indicator */}
          {course?.intro_video_url && (
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
            <Badge className={getDifficultyColor(course?.difficulty_uuid as string)}>
              {getDifficultyNameFromUUID(course?.difficulty_uuid as string)}
            </Badge>
          </div>
        </div>

        <CardContent className='p-4' onClick={handleClick}>
          {/* Category */}
          <div className='mb-2 flex items-center gap-2'>
            {course?.category_names?.map((category, index) => (
              <Badge key={index} variant='outline' className='text-xs'>
                {category}
              </Badge>
            ))}
          </div>

          {/* Title and Subtitle */}
          <h3 className='group-hover:text-primary mb-1 line-clamp-2 min-h-12 font-bold transition-colors'>
            {course?.name}
          </h3>

          <div className='text-muted-foreground mb-3 line-clamp-2 min-h-10 text-sm'>
            <RichTextRenderer htmlString={course?.description as string} />
          </div>

          {/* Instructor */}
          <div className='mb-3 flex items-center gap-2'>
            <Avatar className='min-h-9 min-w-9'>
              <AvatarImage src={course?.course_creator_uuid} />
              <AvatarFallback className='text-xs'>
                {getInitials(courseCreator?.full_name) || 'XY'}
              </AvatarFallback>
            </Avatar>
            <span className='text-muted-foreground text-sm'>
              {courseCreator?.full_name || 'Creator Name'}
            </span>
          </div>

          {/* Stats */}
          <div className='text-muted-foreground mb-4 flex items-center gap-4 text-sm'>
            <div className='flex items-center gap-1'>
              <Star className='h-4 w-4 fill-yellow-400 text-yellow-400' />
              {/* <span>{course?.rating}</span> */}
              <span>{1.2}</span>
            </div>
            <div className='flex items-center gap-1'>
              <Users className='h-4 w-4' />
              <span>{course?.class_limit}</span>
            </div>
            <div className='flex items-center gap-1'>
              <Clock className='h-4 w-4' />
              <span>{course?.total_duration_display}</span>
            </div>
          </div>

          {/* Price and Actions */}
          {course?.is_free ? (
            <div>
              <span className='text-primary font-bold'>{'Free course'}</span>
            </div>
          ) : (
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                {course?.price && (
                  <span className='text-muted-foreground text-sm line-through'>
                    KES {course?.price}
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>

        <div className="w-full flex flex-col items-start gap-3 p-4">
          {/* Action button */}
          <div className='w-full flex flex-row items-center justify-between gap-4' >
            <Button
              size="sm"
              onClick={handleQuickApply}
              disabled={!!applicationStatus && applicationStatus !== 'revoked'}
              className={`
      relative flex items-center gap-2 transition-all duration-200
      border rounded-md font-medium
      ${applicationStatus === 'pending'
                  ? 'border-yellow-400 bg-yellow-50 text-yellow-900 hover:bg-yellow-100'
                  : applicationStatus === 'approved'
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                    : applicationStatus === 'revoked'
                      ? 'border-rose-400 bg-rose-50 text-rose-900 hover:bg-rose-100'
                      : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'}
      disabled:opacity-60 disabled:cursor-not-allowed
    `}
            >
              {renderIcon()}
              {applicationStatus
                ? `${applicationStatus.charAt(0).toUpperCase()}${applicationStatus.slice(1)}`
                : 'Apply to Train'}
            </Button>

            {/* Secondary reapply button */}
            {applicationStatus === 'revoked' && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleReapplyToTrain}
                className="
        border-sky-400 text-sky-700 
        hover:bg-sky-50 hover:text-sky-900 
        transition-all duration-200
      "
              >
                <Pencil className="w-4 h-4 mr-1" />
                Reapply to Train
              </Button>
            )}

          </div>
          {/* Review note */}
          <span
            className={`
      text-xs text-center italic transition-colors duration-200
      ${applicationStatus === 'pending'
                ? 'text-yellow-800'
                : applicationStatus === 'approved'
                  ? 'text-emerald-800'
                  : applicationStatus === 'revoked'
                    ? 'text-rose-800'
                    : 'text-gray-500'}
    `}
          >
            {applicationReviewNote || 'No review note provided'}
          </span>
        </div>

      </div>
    </div>
  );
}
