'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useInstructor } from '@/context/instructor-context';
import {
  getCourseByUuidOptions,
  getInstructorDocumentsOptions,
  getUserByUuidOptions,
  submitTrainingApplicationMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Save, UserCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useParams, useRouter } from 'next/navigation';
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

type ExperienceRecord = {
  calculated_years?: number | null;
};

type StepData = Record<string, unknown> | null;

export function getTotalExperienceYears(experiences: ExperienceRecord[]): number {
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
        { id: 'dashboard', title: 'Dashboard', url: '/dashboard/instructor/overview' },
        {
          id: 'courses',
          title: 'Courses',
          url: `/dashboard/instructor/courses`,
        },
        {
          id: 'apply-to-train',
          title: `Apply To Trains`,
          url: `/dashboard/instructor/apply-to-train/${courseId}`,
        },
      ]);
    }
  }, [replaceBreadcrumbs, courseId]);

  const [currentStep, setCurrentStep] = useState(1);
  const [applicationData, setApplicationData] = useState<Record<string, unknown>>({});
  const draftKey = `apply-to-train-draft:${courseId}`;

  useEffect(() => {
    if (typeof window === 'undefined' || !courseId) return;
    const stored = window.localStorage.getItem(draftKey);
    if (!stored) return;
    try {
      setApplicationData(JSON.parse(stored));
    } catch {
      window.localStorage.removeItem(draftKey);
    }
  }, [courseId, draftKey]);

  const router = useRouter();
  const submitApplication = useMutation({
    ...submitTrainingApplicationMutation(),
    onSuccess: () => {
      if (typeof window !== 'undefined') window.localStorage.removeItem(draftKey);
      toast.success('Application submitted. The course creator will review it.');
      router.push('/dashboard/instructor/opportunities');
    },
    onError: error => {
      toast.error(
        error instanceof Error ? error.message : 'Unable to submit your training application.'
      );
    },
  });

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
  const stepData = useMemo(
    () => ({ ...instructor, ...applicationData }),
    [instructor, applicationData]
  );

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

  const handleDataChange = useCallback((incoming: StepData) => {
    if (!incoming) return;
    setApplicationData(prev => {
      const next = { ...prev, ...incoming };
      try {
        return JSON.stringify(next) === JSON.stringify(prev) ? prev : next;
      } catch {
        return next;
      }
    });
  }, []);

  const handleSaveDraft = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(draftKey, JSON.stringify(applicationData));
    toast.success('Draft saved on this device.');
  };

  const handleSubmit = () => {
    if (!instructor?.uuid) {
      toast.error('No instructor profile is active.');
      return;
    }

    const rate = (key: string) => {
      const value = Number(applicationData[key]);
      return Number.isFinite(value) ? value : null;
    };
    const privateOnline = rate('privateOnlineRate');
    const privateInperson = rate('privateInpersonRate');
    const groupOnline = rate('groupOnlineRate');
    const groupInperson = rate('groupInpersonRate');

    if (
      privateOnline === null ||
      privateInperson === null ||
      groupOnline === null ||
      groupInperson === null
    ) {
      toast.error('Add all four session rates on the Schedule & Delivery step before submitting.');
      return;
    }

    submitApplication.mutate({
      path: { courseUuid: courseId },
      body: {
        applicant_type: 'instructor',
        applicant_uuid: instructor.uuid,
        rate_card: {
          currency: ((applicationData.rateCurrency as string) || 'KES').toUpperCase(),
          private_online_rate: privateOnline,
          private_inperson_rate: privateInperson,
          group_online_rate: groupOnline,
          group_inperson_rate: groupInperson,
        },
        application_notes: (applicationData.applicationNotes as string) || undefined,
      },
    });
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
                      ? 'text-success hover:text-success'
                      : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div
                  className={`mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    step.id === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : step.id < currentStep
                        ? 'bg-success text-white'
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
                data={stepData}
                // @ts-expect-error
                skills={instructor?.skills || []}
                // @ts-expect-error
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
                <Button onClick={handleSubmit} disabled={submitApplication.isPending}>
                  {submitApplication.isPending ? 'Submitting…' : 'Submit Application'}
                </Button>
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
