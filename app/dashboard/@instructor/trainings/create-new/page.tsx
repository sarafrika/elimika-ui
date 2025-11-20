'use client';

import { Card } from '@/components/ui/card';
import {
  getClassDefinitionOptions,
  getClassRecurrencePatternOptions,
  getCourseByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import { useBreadcrumb } from '../../../../../context/breadcrumb-provider';
import { AcademicPeriodForm, type ClassData } from './academic-period-form';
import ClassDetailsForm from './class-details-form';
import { ResourcesForm } from './resources-form';
import { ReviewPublishForm } from './review-class-form';
import { ScheduleForm } from './schedule-form';
import { TimetableForm } from './time-table-form';
import { VisibilityForm } from './visibility-form';

const steps = [
  { id: 'timetable', title: 'Timetable', description: 'Days, times, and schedule' },
  { id: 'details', title: 'Class Details', description: 'Basic information about your class' },
  { id: 'period', title: 'Academic Period', description: 'Start and end dates' },
  { id: 'schedule', title: 'Schedule', description: 'Skills, lessons, and instructor' },
  {
    id: 'visibility',
    title: 'Visibility & Enrollment',
    description: 'Pricing and enrollment settings',
  },
  { id: 'resources', title: 'Resources', description: 'Materials and assessments' },
  { id: 'review', title: 'Review & Publish', description: 'Final review and publish' },
];

export default function ClassCreationPage() {
  const searchParams = useSearchParams();
  const classId = searchParams.get('id');
  const [createdClassId, _setCreatedClassId] = useState<string | null>(null);
  const resolveId = classId ? (classId as string) : (createdClassId as string);

  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      {
        id: 'trainings',
        title: 'Trainings',
        url: `/dashboard/trainings`,
      },
      {
        id: 'create-class',
        title: `Create new class`,
        url: `/dashboard/trainings/create-new`,
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const { data, isLoading: isClassLoading } = useQuery({
    ...getClassDefinitionOptions({ path: { uuid: classId as string } }),
    enabled: !!classId,
  });

  const { data: courseData, isLoading: isCourseLoading } = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: data?.data?.course_uuid as string } }),
    enabled: !!data?.data?.course_uuid,
  });

  const { data: recurrenceData, isLoading: isRecurrenceLoading } = useQuery({
    ...getClassRecurrencePatternOptions({
      path: { uuid: data?.data?.recurrence_pattern_uuid as string },
    }),
    enabled: !!data?.data?.recurrence_pattern_uuid,
  });

  const isLoading = isClassLoading || isCourseLoading || isRecurrenceLoading;

  const combinedData = data?.data
    ? {
      ...data.data,
      course: courseData?.data || null,
      recurrence: recurrenceData?.data || null,
    }
    : null;

  const [currentStep, setCurrentStep] = useState(0);

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

  const _progress = ((currentStep + 1) / steps.length) * 100;

  const handleComplete = (status: 'draft' | 'published') => {
    const _finalClassData = {
      status,
    } as ClassData;
  };

  const [_createRecurrenceData, _setCreateRecurrenceData] = useState<any>(null);

  const [scheduleSummary, setScheduleSummary] = useState({
    totalSkills: 0,
    totalLessons: 0,
    totalHours: 0,
    remainingMinutes: 0,
  });

  const handleSummaryChange = useCallback((summary: {
    totalSkills: number;
    totalLessons: number;
    totalHours: number;
    remainingMinutes: number;
  }) => {
    setScheduleSummary(summary);
  }, []);

  const [combinedRecurrenceData, setCombinedRecurrenceData] = useState<{
    response?: any;
    payload?: any;
  }>({});

  const renderStepContent = () => {
    switch (steps[currentStep]?.id) {
      case 'timetable':
        return (
          <TimetableForm
            data={combinedData}
            classId={resolveId as string}
            onNext={({ response, payload }) => {
              setCombinedRecurrenceData({ response, payload });
              nextStep();
            }}
            onPrev={prevStep}
          />
        );
      case 'details':
        return (
          <ClassDetailsForm
            isLoading={isLoading}
            handleNextStep={nextStep}
            onPrev={prevStep}
            classData={combinedData}
            combinedRecurrenceData={combinedRecurrenceData}
          />
        );
      case 'period':
        return (
          <AcademicPeriodForm
            classId={resolveId as string}
            onNext={nextStep}
            onPrev={prevStep}
            classData={combinedData}
          />
        );
      case 'schedule':
        return (
          <ScheduleForm
            data={combinedData}
            onNext={nextStep}
            onPrev={prevStep}
            onSummaryChange={handleSummaryChange} // 👈 pass down callback
          />
        );
      case 'visibility':
        return (
          <VisibilityForm
            data={combinedData as any}
            onUpdate={() => { }}
            onNext={nextStep}
            onPrev={prevStep}
            scheduleSummary={scheduleSummary}
          />
        );
      case 'resources':
        return (
          <ResourcesForm
            onNext={() => {
              nextStep();
            }}
            onPrev={prevStep}
            data={combinedData}
          />
        );
      case 'review':
        return (
          <ReviewPublishForm
            data={combinedData as any}
            onComplete={handleComplete}
            onPrev={prevStep}
            scheduleSummary={scheduleSummary}
          />
        );
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

      <div className='flex items-center gap-4'>
        <div className='flex-1'>
          <p className='text-muted-foreground'>
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="w-full pt-0 pb-4">
        <div className="relative flex items-center w-full">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {/* Step Circle */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all
              ${index === currentStep
                      ? 'border-primary bg-primary text-white'
                      : index < currentStep
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted-foreground/30 text-muted-foreground/50'
                    }`}
                >
                  {index + 1}
                </div>
              </div>

              {/* Connector Line (between steps) */}
              {index < steps.length - 1 && (
                <div
                  className={`absolute top-1/2 left-[calc((100%/${steps.length})*${index + 0.5})] w-[calc(100%/${steps.length})] h-[2px] -translate-y-1/2 transition-all
              ${index < currentStep
                      ? 'bg-primary'
                      : 'bg-muted-foreground/20'
                    }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Labels */}
        <div className="flex justify-between w-full mt-3 text-xs md:text-sm text-muted-foreground">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex-1 text-center ${index === currentStep ? 'text-primary font-medium' : ''
                }`}
            >
              {step.title}
            </div>
          ))}
        </div>
      </div>

      <main className='mt-2 px-2'>{renderStepContent()}</main>
    </Card>
  );
}
