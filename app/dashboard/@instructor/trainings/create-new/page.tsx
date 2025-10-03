'use client';

import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Progress } from '../../../../../components/ui/progress';
import { getClassDefinitionOptions } from '../../../../../services/client/@tanstack/react-query.gen';
import { AcademicPeriodForm, ClassData } from './academic-period-form';
import ClassDetailsForm from './class-details-form';
import { ResourcesForm } from './resources-form';
import { ReviewPublishForm } from './review-class-form';
import { ScheduleForm } from './schedule-form';
import { TimetableForm } from './time-table-form';
import { VisibilityForm } from './visibility-form';

const steps = [
    { id: 'details', title: 'Class Details', description: 'Basic information about your class' },
    { id: 'period', title: 'Academic Period', description: 'Start and end dates' },
    { id: 'timetable', title: 'Timetable', description: 'Days, times, and schedule' },
    { id: 'schedule', title: 'Schedule', description: 'Skills, lessons, and instructor' },
    { id: 'visibility', title: 'Visibility & Enrollment', description: 'Pricing and enrollment settings' },
    { id: 'resources', title: 'Resources', description: 'Materials and assessments' },
    { id: 'review', title: 'Review & Publish', description: 'Final review and publish' }
];


export default function ClassCreationPage() {
    const searchParams = useSearchParams();
    const classId = searchParams.get('id');
    const [createdClassId, setCreatedClassId] = useState<string | null>(null);
    const resolveId = classId ? (classId as string) : (createdClassId as string);

    const { data, isLoading } = useQuery({
        ...getClassDefinitionOptions({ path: { uuid: classId as string } }),
        enabled: !!classId,
    });
    const clData = data?.data;

    const [currentStep, setCurrentStep] = useState(0);
    const [classData, setClassData] = useState<Partial<ClassData>>({
        courseTitle: '',
        classTitle: '',
        subtitle: '',
        category: '',
        targetAudience: [],
        description: '',
        academicPeriod: {
            startDate: new Date(),
            endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        },
        registrationPeriod: {
            startDate: new Date(),
        },
        timetable: {
            selectedDays: [],
            timeSlots: [],
            duration: '60',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            classType: 'online'
        },
        schedule: {
            instructor: '',
            skills: []
        },
        visibility: {
            publicity: 'public',
            enrollmentLimit: 20,
            price: 0,
            isFree: true
        },
        resources: [],
        assessments: [],
        status: 'draft'
    });

    const updateClassData = (updates: Partial<ClassData>) => {
        setClassData(prev => ({ ...prev, ...updates }));
    };

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const progress = ((currentStep + 1) / steps.length) * 100;

    const handleComplete = (status: 'draft' | 'published') => {
        const finalClassData = {
            ...classData,
            status
        } as ClassData;

    };

    const renderStepContent = () => {
        switch (steps[currentStep]?.id) {
            case 'details':
                return (
                    <ClassDetailsForm
                        isLoading={isLoading}
                        handleNextStep={nextStep}
                        classData={clData}
                    />
                );
            case 'period':
                return (
                    <AcademicPeriodForm
                        classId={resolveId as string}
                        onNext={nextStep}
                        onPrev={prevStep}
                    />
                );
            case 'timetable':
                return (
                    <TimetableForm
                        data={{}}
                        classId={resolveId as string}
                        onNext={nextStep}
                        onPrev={prevStep}
                        onUpdate={() => { }}
                    />
                );
            case 'schedule':
                return (
                    <ScheduleForm
                        data={classData}
                        onUpdate={updateClassData}
                        onNext={nextStep}
                        onPrev={prevStep}
                    />);
            case 'visibility':
                return (
                    <VisibilityForm
                        data={clData as any}
                        onUpdate={updateClassData}
                        onNext={nextStep}
                        onPrev={prevStep}
                    />
                );
            case 'resources':
                return (
                    <ResourcesForm
                        onNext={() => {
                            nextStep();
                        }}
                        onPrev={prevStep}
                        data={clData}
                    />
                );
            case 'review':
                return (
                    <ReviewPublishForm
                        data={classData as ClassData}
                        onComplete={handleComplete}
                        onPrev={prevStep}
                    />);
            default:
                return null;
        }
    };


    return (
        <Card className='container mx-auto p-6 pb-16'>
            <div className='mb-2 block lg:flex lg:items-start lg:space-x-4'>
                <div className='w-full'>
                    <h3 className='text-2xl leading-none font-semibold tracking-tight'>
                        Basic Class Training Information
                    </h3>
                    <p className='text-muted-foreground mt-1 text-sm'>
                        This section provides an overview of the fundamental aspects of the training classes
                        offered. It includes essential details such as the course objectives, the target
                        audience, prerequisites (if any), and the expected outcomes upon completion. The
                        training sessions are designed to equip participants with the foundational knowledge and
                        practical skills necessary for advancing in their respective fields. Whether you are a
                        beginner or looking to refresh your skills, this class offers a structured curriculum to
                        support your learning journey.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <p className="text-muted-foreground">Step {currentStep + 1} of {steps.length}</p>
                </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                    {steps.map((step, index) => (
                        <div key={step.id} className={`text-center ${index === currentStep ? 'text-foreground font-medium' : ''}`}>
                            <div className="hidden md:block">{step.title}</div>
                            <div className="md:hidden">{index + 1}</div>
                        </div>
                    ))}
                </div>
            </div>

            <main className='mt-2 px-2' >
                {renderStepContent()}
            </main>
        </Card>
    );
}
