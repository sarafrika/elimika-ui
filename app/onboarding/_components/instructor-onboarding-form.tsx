'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, CheckCircle, User } from 'lucide-react';
import {
  createInstructorMutation,
  getUserByUuidOptions,
  updateUserMutation,
} from '@/services/client/@tanstack/react-query.gen';
import PersonalInfoForm, { UserFormData } from '@/components/forms/personal-info';
import InstructorProfileForm, { InstructorFormData } from '@/components/forms/instructor-profile';
import HorizontalStepper, { Step } from '@/components/stepper/HorizontalStepper';
import Image from 'next/image';

interface Props {
  userUuid: string;
  initialStep: number;
  error?: string;
  success?: string;
  initialUserData?: any;
}

const steps: Step[] = [
  {
    id: 'personal',
    title: 'Personal Information',
    description: 'Basic details about you',
    icon: User,
  },
  {
    id: 'profile',
    title: 'Instructor Profile',
    description: 'Professional information',
    icon: Building2,
  },
  {
    id: 'complete',
    title: 'Complete',
    description: 'Registration successful',
    icon: CheckCircle,
  },
];

export default function InstructorOnboardingForm({
                                                   userUuid,
                                                   initialStep,
                                                   error,
                                                   success,
                                                   initialUserData,
                                                 }: Props) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(initialStep);

  const { data: userResponse, isLoading } = useQuery({
    ...getUserByUuidOptions({
      path: { uuid: userUuid },
    }),
    initialData: initialUserData ? { data: initialUserData } : undefined,
    staleTime: 5 * 60 * 1000,
  });

  // Extract the actual user data from the API response
  const userData = userResponse?.data;

  const updateUserMut = useMutation(updateUserMutation());
  const createInstructorMut = useMutation(createInstructorMutation());

  useEffect(() => {
    if (error) {
      toast.error(decodeURIComponent(error));
    }
    if (success) {
      toast.success(decodeURIComponent(success));
    }
  }, [error, success]);

  const handleUserInfoSubmit = async (data: UserFormData) => {
    try {
      const apiData = {
        ...data,
        dob: new Date(data.dob),
        active: true,
        middle_name: data.middle_name || undefined,
      };

      await updateUserMut.mutateAsync({
        path: { uuid: userUuid },
        body: apiData,
      });

      toast.success('Personal information saved!');
      setCurrentStep(1);
      router.push('/onboarding/instructor?step=1', { scroll: false });
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save personal information');
    }
  };

  const handleInstructorProfileSubmit = async (data: InstructorFormData) => {
    console.log("submitting")
    try {
      const apiData = {
        ...data,
        user_uuid: userUuid,
        bio: data.bio && data.bio.trim() !== '' ? data.bio : undefined,
        professional_headline:
          data.professional_headline && data.professional_headline.trim() !== ''
            ? data.professional_headline
            : undefined,
        website: data.website && data.website.trim() !== '' ? data.website : undefined,
      };

      console.log(`Instructor Data: \n ${JSON.stringify(apiData)}`)

      await createInstructorMut.mutateAsync({
        body: apiData,
      });

      toast.success('Registration completed successfully!');
      setCurrentStep(2);
      router.push('/onboarding/instructor?step=2&success=Registration%20completed!');

      setTimeout(() => {
        router.push('/dashboard/overview');
      }, 2000);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to complete registration');
    }
  };

  const goBack = () => {
    console.log(`Current Step ${currentStep}`)
    const newStep = Math.max(0, currentStep - 1);
    setCurrentStep(newStep);
    router.push(`/onboarding/instructor?step=${newStep}`, { scroll: false });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#1976D2]"></div>
      </div>
    );
  }

  return (
    <div className="from-background to-muted/20 min-h-screen bg-gradient-to-br p-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-foreground mb-2 text-3xl font-bold md:text-4xl">Join Elimika</h1>
          <p className="text-muted-foreground">Complete your registration to start teaching</p>
        </div>

        {/* Stepper */}
        <HorizontalStepper currentStep={currentStep} steps={steps} />

        {/* Step Content */}
        <div className="mt-8">
          {currentStep === 0 && (
            <PersonalInfoForm
              userData={userData}
              onSubmit={handleUserInfoSubmit}
              isSubmitting={updateUserMut.isPending}
            />
          )}

          {currentStep === 1 && (
            <InstructorProfileForm
              userUuid={userData?.uuid}
              onSubmit={handleInstructorProfileSubmit}
              onBack={goBack}
              isSubmitting={createInstructorMut.isPending}
            />
          )}

          {currentStep === 2 && <SuccessStep />}
        </div>

        {/* Footer Text */}
        <div className="text-center mt-12 space-y-4">
          {/* Powered by Sarafrika */}
          <div className="flex items-center justify-center gap-2 pt-8 border-t border-border/50">
            <span className="text-sm text-muted-foreground">Powered by</span>
            <div className="flex items-center gap-2">
              <Image
                src="/images/Sarafrika Logo.svg"
                alt="Sarafrika Logo"
                width={20}
                height={20}
                className="w-5 h-5"
              />
              <span className="text-sm font-semibold text-foreground">Sarafrika</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuccessStep() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/dashboard/overview');
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <CardTitle className="text-2xl">Registration Complete!</CardTitle>
        <CardDescription>
          Welcome to Elimika! Your instructor account has been created successfully.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p className="text-muted-foreground">
          You can now create courses and start teaching on our platform.
        </p>
        <Button onClick={handleGetStarted} className="bg-[#1976D2] hover:bg-[#1976D2]/90">
          Get Started
        </Button>
      </CardContent>
    </Card>
  );
}