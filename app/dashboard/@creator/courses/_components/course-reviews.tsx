'use client'

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    AlertCircle,
    BookOpen,
    CheckCircle,
    DollarSign,
    Users,
    Video
} from 'lucide-react';
import Image from 'next/image';

interface CourseReviewProps {
    data: any;
    onDataChange: (data: any) => void;
}

export function CourseReview({ data }: CourseReviewProps) {
    const getCompletionStatus = () => {
        const required = ['title', 'category', 'description'];
        const completed = required.filter(field => data[field]?.trim());
        return {
            completed: completed.length,
            total: required.length,
            percentage: Math.round((completed.length / required.length) * 100)
        };
    };

    const status = getCompletionStatus();

    return (
        <div className="space-y-6">
            <div>
                <h3>Review & Publish</h3>
                <p className="text-sm text-muted-foreground">
                    Review your course details before publishing
                </p>
            </div>

            {/* Completion Status */}
            <Card className={status.percentage === 100 ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                        {status.percentage === 100 ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                            <AlertCircle className="w-6 h-6 text-yellow-600" />
                        )}
                        <div>
                            <h4 className={status.percentage === 100 ? 'text-green-800' : 'text-yellow-800'}>
                                Course {status.percentage === 100 ? 'Ready to Publish' : 'Incomplete'}
                            </h4>
                            <p className={`text-sm ${status.percentage === 100 ? 'text-green-600' : 'text-yellow-600'}`}>
                                {status.completed} of {status.total} required fields completed ({status.percentage}%)
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Course Preview Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Course Preview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 p-4 border rounded-lg">
                        {/* Course Image */}
                        <div className="w-32 h-20 bg-muted rounded flex items-center justify-center">
                            {data?.coverImage ? (
                                <Image
                                    width={24}
                                    height={24}
                                    src={data.coverImage.url}
                                    alt="Course cover"
                                    className="w-full h-full object-cover rounded"
                                />
                            ) : (
                                <BookOpen className="w-8 h-8 text-muted-foreground" />
                            )}
                        </div>

                        {/* Course Info */}
                        <div className="flex-1">
                            <h4>{data?.title || 'Course Title'}</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                                {data?.subtitle || 'Course subtitle'}
                            </p>

                            <div className="flex items-center gap-4 mb-2">
                                <span className="text-sm">Course Author</span>
                                <Badge variant="outline">{data?.difficulty || 'Beginner'}</Badge>
                                <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    <span className="text-sm">0 enrolled</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button size="sm" variant="outline">Search Instructor</Button>
                                <Button size="sm">Enroll for Classes</Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Course Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Course Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Overview */}
                    <div>
                        <h4 className="flex items-center gap-2 mb-3">
                            <BookOpen className="w-4 h-4" />
                            Course Overview
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">Title:</span>
                                <p>{data?.title || 'Not set'}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Category:</span>
                                <p>{data?.category || 'Not set'}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Difficulty:</span>
                                <p>{data?.difficulty || 'Not set'}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Target Audience:</span>
                                <p>{data?.targetAudience?.join(', ') || 'Not set'}</p>
                            </div>
                        </div>
                        {data?.description && (
                            <div className="mt-3">
                                <span className="text-muted-foreground">Description:</span>
                                <p className="text-sm">{data.description}</p>
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Requirements */}
                    <div>
                        <h4 className="flex items-center gap-2 mb-3">
                            <AlertCircle className="w-4 h-4" />
                            Requirements
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div>
                                <span className="text-muted-foreground">Prerequisites:</span>
                                <p>{data?.prerequisites?.join(', ') || 'None'}</p>
                            </div>
                            {data?.equipment && (
                                <div>
                                    <span className="text-muted-foreground">Equipment:</span>
                                    <p>{data.equipment}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Content */}
                    <div>
                        <h4 className="flex items-center gap-2 mb-3">
                            <Video className="w-4 h-4" />
                            Course Content
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="text-center p-3 bg-muted/20 rounded">
                                <div className="text-xl font-bold">{data?.skills?.length || 0}</div>
                                <div className="text-muted-foreground">Skills</div>
                            </div>
                            <div className="text-center p-3 bg-muted/20 rounded">
                                <div className="text-xl font-bold">{data?.quizzes?.length || 0}</div>
                                <div className="text-muted-foreground">Quizzes</div>
                            </div>
                            <div className="text-center p-3 bg-muted/20 rounded">
                                <div className="text-xl font-bold">{data?.assignments?.length || 0}</div>
                                <div className="text-muted-foreground">Assignments</div>
                            </div>
                            <div className="text-center p-3 bg-muted/20 rounded">
                                <div className="text-xl font-bold">{data?.rubrics?.length || 0}</div>
                                <div className="text-muted-foreground">Assessments</div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Pricing & Access */}
                    <div>
                        <h4 className="flex items-center gap-2 mb-3">
                            <DollarSign className="w-4 h-4" />
                            Pricing & Access
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">Course Type:</span>
                                <p className="capitalize">{data?.courseType || 'Not set'}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Access Period:</span>
                                <p>{data?.accessPeriod || 'Not set'}</p>
                            </div>
                            {data?.courseType === 'paid' && (
                                <>
                                    <div>
                                        <span className="text-muted-foreground">Pricing Model:</span>
                                        <p className="capitalize">{data?.priceType?.replace('-', ' ') || 'Not set'}</p>
                                    </div>
                                    {data?.fixedPrice && (
                                        <div>
                                            <span className="text-muted-foreground">Price:</span>
                                            <p>{data.fixedPrice} {data?.currency?.toUpperCase() || 'USD'}</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Skills Preview */}
            {data?.skills?.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Skills Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {data.skills.map((skill: any, index: number) => (
                                <div key={skill.id} className="flex items-center justify-between p-3 border rounded">
                                    <div>
                                        <h4>Skill #{index + 1}: {skill.title || 'Untitled'}</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {skill.resources?.length || 0} resources
                                        </p>
                                    </div>
                                    <Badge variant="outline">
                                        {skill.description ? 'Complete' : 'Incomplete'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Missing Information */}
            {status.percentage < 100 && (
                <Card className="border-yellow-200">
                    <CardHeader>
                        <CardTitle className="text-yellow-800">Missing Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {!data?.title && (
                                <div className="flex items-center gap-2 text-sm text-yellow-700">
                                    <AlertCircle className="w-4 h-4" />
                                    Course title is required
                                </div>
                            )}
                            {!data?.category && (
                                <div className="flex items-center gap-2 text-sm text-yellow-700">
                                    <AlertCircle className="w-4 h-4" />
                                    Course category is required
                                </div>
                            )}
                            {!data?.description && (
                                <div className="flex items-center gap-2 text-sm text-yellow-700">
                                    <AlertCircle className="w-4 h-4" />
                                    Course description is required
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}