'use client'

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Eye, Save } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { getCourseByUuidOptions } from '../../../../../services/client/@tanstack/react-query.gen';
import { CourseAssessment } from './course-assesments';
import { CourseAssignments } from './course-assignmets';
import { CourseBranding } from './course-branding';
import { CourseLicensing } from './course-licensing';
import { CourseOverview } from './course-overview';
import { CourseQuizzes } from './course-quizzes';
import { CourseReview } from './course-reviews';
import { CourseSkills } from './course-skills';

const STEPS = [
    { id: 1, title: 'Course Overview', component: CourseOverview },
    { id: 2, title: 'Skills & Resources', component: CourseSkills },
    { id: 3, title: 'Course Quizzes', component: CourseQuizzes },
    { id: 4, title: 'Course Assignments', component: CourseAssignments },
    { id: 5, title: 'Course Assessment', component: CourseAssessment },
    { id: 6, title: 'Course Branding', component: CourseBranding },
    { id: 7, title: 'Course Licensing', component: CourseLicensing },
    { id: 8, title: 'Review & Publish', component: CourseReview },
];

export function CourseCreation() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const courseId = searchParams.get('id');
    const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
    const resolveId = courseId ? (courseId as string) : (createdCourseId as string);

    const { data: courseDetail, isLoading } = useQuery({
        ...getCourseByUuidOptions({ path: { uuid: resolveId as string } }),
        enabled: !!courseId,
    });
    // @ts-ignore
    const course = courseDetail?.data;

    const [currentStep, setCurrentStep] = useState(1);
    const [courseData, setCourseData] = useState(course);

    const progress = (currentStep / STEPS.length) * 100;
    const CurrentStepComponent = STEPS.find(step => step.id === currentStep)?.component;

    const handleNext = () => {
        if (currentStep < STEPS.length) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleStepClick = (stepId: number) => {
        setCurrentStep(stepId);
    };

    const handleDataChange = (stepData: any) => {
        setCourseData(prev => ({ ...prev, ...stepData }));
    };

    const handleSaveDraft = () => {
        // console.log('Saving draft...', courseData);
        // Implement save draft functionality
    };

    const handlePublish = () => {
        // console.log('Publishing course...', courseData);
        // Implement publish functionality
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b bg-card">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div>
                                <h1>Create New Course</h1>
                                <p className="text-sm text-muted-foreground">
                                    Step {currentStep} of {STEPS.length}: {STEPS.find(s => s.id === currentStep)?.title}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleSaveDraft}>
                                <Save className="w-4 h-4 mr-2" />
                                Save Draft
                            </Button>
                            <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-2" />
                                Preview
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="border-b bg-card">
                <div className="container mx-auto px-6 py-4">
                    <Progress value={progress} className="mb-4" />
                    <div className="flex justify-between text-sm">
                        {STEPS.map((step) => (
                            <button
                                key={step.id}
                                onClick={() => handleStepClick(step.id)}
                                className={`flex-1 text-center py-2 px-1 transition-colors ${step.id === currentStep
                                    ? 'text-primary font-medium'
                                    : step.id < currentStep
                                        ? 'text-green-600 hover:text-green-700'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <div className={`w-6 h-6 rounded-full mx-auto mb-1 flex items-center justify-center text-xs ${step.id === currentStep
                                    ? 'bg-primary text-primary-foreground'
                                    : step.id < currentStep
                                        ? 'bg-green-600 text-white'
                                        : 'bg-muted text-muted-foreground'
                                    }`}>
                                    {step.id < currentStep ? '✓' : step.id}
                                </div>
                                <span className="hidden md:block">{step.title}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Step Content */}
            <div className="container mx-auto px-6 py-8">
                <Card className='border-none shadow-none' >
                    <CardHeader>
                        <CardTitle>{STEPS.find(s => s.id === currentStep)?.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {CurrentStepComponent && (
                            <CurrentStepComponent
                                data={courseData}
                                onDataChange={handleDataChange}
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Navigation */}
                <div className="flex justify-between mt-8">
                    <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentStep === 1}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Previous
                    </Button>

                    <div className="flex gap-2">
                        {currentStep === STEPS.length ? (
                            <>
                                <Button variant="outline" onClick={handleSaveDraft}>
                                    Save Draft
                                </Button>
                                <Button onClick={handlePublish}>
                                    Publish Course
                                </Button>
                            </>
                        ) : (
                            <Button onClick={handleNext}>
                                Next
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}