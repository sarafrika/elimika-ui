'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useInstructor } from '@/context/instructor-context';
import {
  getCourseByUuidOptions,
  getInstructorDocumentsOptions,
  getUserByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Save, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useParams } from 'next/navigation';
import { useBreadcrumb } from '../../../../../context/breadcrumb-provider';
import { ComplianceRequirements } from '../_components/compliance-requirement';
import { CourseProposal } from '../_components/course-proposal';
import { ResourcesAndRequirements } from '../_components/resources-and-requirements';
import { ReviewAndSubmit } from '../_components/review-and-submit';
import { ScheduleAndDelivery } from '../_components/schedule-and-delivery';

const STEPS = [
  // { id: 1, title: 'Profile & Skills', component: ProfileAndSkills },
  { id: 1, title: 'Course Proposal', component: CourseProposal },
  { id: 2, title: 'Schedule & Delivery', component: ScheduleAndDelivery },
  { id: 3, title: 'Resources & Requirements', component: ResourcesAndRequirements },
  { id: 4, title: 'Compliance', component: ComplianceRequirements },
  { id: 5, title: 'Review & Submit', component: ReviewAndSubmit },
];

export function getTotalExperienceYears(experiences: any[]): number {
  const totalYears = experiences.reduce((sum, exp) => {
    return sum + (exp.calculated_years ?? 0);
  }, 0);

  return Math.round(totalYears);
}

export default function ApplyToTrain() {
  const params = useParams();
  const courseId = params?.id as string;
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    if (courseId) {
      replaceBreadcrumbs([
        { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
        {
          id: 'courses',
          title: 'Courses',
          url: `/dashboard/courses`,
        },
        {
          id: 'apply-to-train',
          title: `Apply To Trains`,
          url: `/dashboard/apply-to-train/${courseId}`,
        },
      ]);
    }
  }, [replaceBreadcrumbs, courseId]);

  const [currentStep, setCurrentStep] = useState(1);

  const instructor = useInstructor();
  const { data: course } = useQuery({
    ...getCourseByUuidOptions({
      path: { uuid: courseId as string },
    }),
  });
  const selectedCourse = course?.data;

  const { data } = useQuery(
    getUserByUuidOptions({ path: { uuid: instructor?.user_uuid as string } })
  );
  const instructorProfile = data?.data || {};

  const { data: instructorCertifications } = useQuery({
    ...getInstructorDocumentsOptions({
      path: { instructorUuid: instructor?.uuid as string },
    }),
    enabled: !!instructor?.uuid,
  });

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
    // setApplicationData(prev => ({ ...prev, ...stepData }));
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
    <div className='bg-background min-h-screen rounded-xl'>
      {/* Header */}
      <div className='border-b'>
        <div className='container mx-auto px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <div className='flex items-center gap-3'>
                <UserCheck className='text-primary h-8 w-8' />
                <div>
                  <h1>Apply to Train a Course</h1>
                  <p className='text-muted-foreground text-sm'>
                    Step {currentStep} of {STEPS.length}:{' '}
                    {STEPS.find(s => s.id === currentStep)?.title}
                  </p>
                </div>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Button variant='outline' size='sm' onClick={handleSaveDraft}>
                <Save className='mr-2 h-4 w-4' />
                Save Draft
              </Button>
              {/* <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-2" />
                                Preview
                            </Button> */}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className='bg-card border-b'>
        <div className='container mx-auto px-6 py-4'>
          <Progress value={progress} className='mb-4' />
          <div className='flex justify-between text-sm'>
            {STEPS.map(step => (
              <button
                key={step.id}
                onClick={() => handleStepClick(step.id)}
                className={`flex-1 px-1 py-2 text-center transition-colors ${
                  step.id === currentStep
                    ? 'text-primary font-medium'
                    : step.id < currentStep
                      ? 'text-green-600 hover:text-green-700'
                      : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div
                  className={`mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    step.id === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : step.id < currentStep
                        ? 'bg-green-600 text-white'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.id < currentStep ? '✓' : step.id}
                </div>
                <span className='hidden md:block'>{step.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className='container mx-auto px-6 py-8'>
        <Card>
          <CardHeader>
            <CardTitle>{STEPS.find(s => s.id === currentStep)?.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {CurrentStepComponent && (
              <CurrentStepComponent
                data={instructor}
                // @ts-ignore
                skills={instructor?.skills || []}
                // @ts-ignore
                education={instructor?.educations || []}
                certifications={instructorCertifications?.data || []}
                profile={instructorProfile}
                onDataChange={handleDataChange}
                selectedCourse={selectedCourse}
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className='mt-8 flex justify-between'>
          <Button variant='outline' onClick={handlePrevious} disabled={currentStep === 1}>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Previous
          </Button>

          <div className='flex gap-2'>
            {currentStep === STEPS.length ? (
              <>
                <Button variant='outline' onClick={handleSaveDraft}>
                  Save Draft
                </Button>
                <Button onClick={handleSubmit}>Submit Application</Button>
              </>
            ) : (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className='ml-2 h-4 w-4' />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
