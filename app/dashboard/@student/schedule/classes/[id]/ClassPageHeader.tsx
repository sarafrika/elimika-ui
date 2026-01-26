import { Button } from '@/components/ui/button';
import { BarChart3, Clock, ImageOff, Star, User } from 'lucide-react';
import Image from 'next/image';

interface ClassPageHeaderProps {
    thumbnailUrl?: string;
    title: string;
    description: string;
    duration: string;
    difficulty: string;
    instructorName: string;
    onRateInstructor: () => void;
}

export function ClassPageHeader({
    thumbnailUrl,
    title,
    description,
    duration,
    difficulty,
    instructorName,
    onRateInstructor,
}: ClassPageHeaderProps) {
    return (
        <div className="border-b bg-background">
            <div className="mx-auto max-w-7xl py-4 px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                    {/* Thumbnail */}
                    <div className="relative h-32 w-32 sm:h-48 sm:w-48 overflow-hidden rounded-lg border flex-shrink-0">
                        {thumbnailUrl ? (
                            <Image
                                src={thumbnailUrl}
                                alt={`${title} thumbnail`}
                                fill
                                className="object-cover"
                                priority
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-muted">
                                <ImageOff className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 w-full">
                        <h1 className="mb-2 text-2xl sm:text-3xl font-medium">
                            {title}
                        </h1>
                        <p className="text-muted-foreground mb-4 text-sm sm:text-base line-clamp-2">
                            {description}
                        </p>

                        {/* Meta Information */}
                        <div className="text-muted-foreground flex items-center flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm">
                            {/* Duration */}
                            <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span>{duration}</span>
                            </div>

                            {/* Difficulty */}
                            <div className="flex items-center gap-2">
                                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span>{difficulty}</span>
                            </div>

                            {/* Instructor */}
                            <div className="flex items-center gap-2">
                                <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span>{instructorName}</span>
                            </div>

                            {/* Rate Instructor Button */}
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={onRateInstructor}
                            >
                                <Star className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="hidden sm:inline">Rate Instructor</span>
                                <span className="sm:hidden">Rate</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}