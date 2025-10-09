'use client'

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Eye, Save, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { ComplianceRequirements } from './compliance-requirement';
import { CourseProposal } from './course-proposal';
import { ProfileAndSkills } from './profile-and-skill';
import { ResourcesAndRequirements } from './resources-and-requirements';
import { ReviewAndSubmit } from './review-and-submit';
import { ScheduleAndDelivery } from './schedule-and-delivery';

const STEPS = [
    { id: 1, title: 'Profile & Skills', component: ProfileAndSkills },
    { id: 2, title: 'Course Proposal', component: CourseProposal },
    { id: 3, title: 'Schedule & Delivery', component: ScheduleAndDelivery },
    { id: 4, title: 'Resources & Requirements', component: ResourcesAndRequirements },
    { id: 5, title: 'Compliance', component: ComplianceRequirements },
    { id: 6, title: 'Review & Submit', component: ReviewAndSubmit },
];

export function ApplyToTrain() {
    const [currentStep, setCurrentStep] = useState(1);
    const [applicationData, setApplicationData] = useState({});

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
        setApplicationData(prev => ({ ...prev, ...stepData }));
    };

    const handleSaveDraft = () => {
        // console.log('Saving draft...', applicationData);
        // Implement save draft functionality
    };

    const handleSubmit = () => {
        // console.log('Submitting application...', applicationData);
        // Implement submit functionality
    };

    return (
        <div className="min-h-screen bg-background rounded-xl">
            {/* Header */}
            <div className="border-b">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">

                            <div className="flex items-center gap-3">
                                <UserCheck className="w-8 h-8 text-primary" />
                                <div>
                                    <h1>Apply to Train a Course</h1>
                                    <p className="text-sm text-muted-foreground">
                                        Step {currentStep} of {STEPS.length}: {STEPS.find(s => s.id === currentStep)?.title}
                                    </p>
                                </div>
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
                <Card>
                    <CardHeader>
                        <CardTitle>{STEPS.find(s => s.id === currentStep)?.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {CurrentStepComponent && (
                            <CurrentStepComponent
                                data={applicationData}
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
                                <Button onClick={handleSubmit}>
                                    Submit Application
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