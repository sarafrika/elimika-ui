'use client'

import RichTextRenderer from '@/components/editors/richTextRenders';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { useInstructorInfo } from '@/hooks/use-instructor-info';
import { Course } from '@/services/client';
import { getAllDifficultyLevelsOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import {
    BookOpen,
    Clock, Heart,
    Play,
    Share,
    Star,
    Users
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface CourseCardProps {
    course: Course;
    handleClick: () => void;
}

export function CourseCard({ course, handleClick }: CourseCardProps) {
    const router = useRouter()

    const getInitials = (name: string) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const { instructorInfo } = useInstructorInfo({ instructorUuid: course?.instructor_uuid as string })
    // @ts-ignore
    const instructor = instructorInfo?.data

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


    return (
        <div className="group border-[1px] border-gray-400 rounded-lg bg-white cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1" onClick={handleClick}>
            <div className="relative">
                {/* Course Image */}
                <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                    {course?.banner_url ? (
                        <Image
                            src={course?.banner_url}
                            alt={course?.name}
                            className="w-full h-full object-cover"
                            width={24}
                            height={24}
                        />
                    ) : (
                        <BookOpen className="w-16 h-16 text-primary/40" />
                    )}

                    {/* Video indicator */}
                    {course?.intro_video_url && (
                        <div className="absolute top-3 left-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                            <Play className="w-3 h-3" />
                            Video
                        </div>
                    )}

                    {/* Actions */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            size="sm"
                            variant="secondary"
                            className="w-8 h-8 p-0"
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                        >
                            <Heart className="w-4 h-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            className="w-8 h-8 p-0"
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                        >
                            <Share className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Difficulty Badge */}
                    <div className="absolute bottom-3 left-3">
                        <Badge className={getDifficultyColor(course?.difficulty_uuid as string)}>
                            {getDifficultyNameFromUUID(course?.difficulty_uuid as string)}
                        </Badge>
                    </div>
                </div>

                <CardContent className="p-4">
                    {/* Category */}
                    <div className="flex items-center gap-2 mb-2">
                        {course?.category_names?.map((category, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                                {category}
                            </Badge>
                        ))}
                    </div>

                    {/* Title and Subtitle */}
                    <h3 className="font-bold mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                        {course?.name}
                    </h3>
                    <div className='text-sm text-muted-foreground mb-3 line-clamp-2' >
                        <RichTextRenderer htmlString={course?.description as string} />
                    </div>


                    {/* Instructor */}
                    <div className="flex items-center gap-2 mb-3 bg-blue-200">
                        <Avatar className="w-6 h-6">
                            <AvatarImage src={course?.instructor_uuid} />
                            <AvatarFallback className="text-xs">
                                {getInitials(instructor?.full_name) || "XY"}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">{instructor?.full_name || "Creator Name"}</span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            {/* <span>{course?.rating}</span> */}
                            <span>{1.2}</span>

                        </div>
                        <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{course?.class_limit}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{course?.total_duration_display}</span>
                        </div>
                    </div>

                    {/* Price and Actions */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-primary">
                                {course?.price}
                            </span>
                            {course?.price && (
                                <span className="text-sm text-muted-foreground line-through">
                                    {course?.price}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between gap-2 pt-4">
                        <Button onClick={() => router.push(`/dashboard/browse-courses/instructor/123`)} size="sm" variant="outline">
                            Search Instructor
                        </Button>
                        <Button size="sm">
                            Enroll
                        </Button>
                    </div>
                </CardContent>
            </div>
        </div>
    );
}