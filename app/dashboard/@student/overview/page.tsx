'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  GraduationCap,
  Info,
  Search,
  ThumbsUp,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function StudentOverviewPage() {
  // TODO: Replace this with actual data from the backend
  const isProfileComplete = false; // This will determine which view to show
  const currentStageIndex: number = 1; // Example: 1 = "Under Review", only used if profile is complete

  const approvalStages = [
    {
      title: 'Profile Submitted',
      description: 'Your profile has been submitted for review.',
      icon: FileText,
      tooltip: 'We have received your registration details.',
    },
    {
      title: 'Under Review',
      description: 'Your application is being reviewed by our team.',
      icon: Search,
      tooltip: 'Our team is checking your information.',
    },
    {
      title: 'Approved',
      description: 'Congratulations! You have been approved.',
      icon: ThumbsUp,
      tooltip: 'You are approved and ready for enrollment.',
    },
    {
      title: 'Enrolled',
      description: 'You are now officially enrolled and can start learning.',
      icon: GraduationCap,
      tooltip: 'Welcome! You are now a student.',
    },
  ];

  const { data: session } = useSession();

  // Data for when profile is complete
  const currentStage = approvalStages[currentStageIndex];
  const progressPercent = ((currentStageIndex + 1) / approvalStages.length) * 100;
  const nextStage = approvalStages[currentStageIndex + 1];

  // Mock data for submitted details dialog
  const submittedDetails = {
    name: 'John Doe',
    phone: '0712345678',
    email: 'john.doe@example.com',
    guardianName: 'Jane Doe',
    guardianPhone: '+254700000001',
    hasGuardian: true,
  };

  if (isProfileComplete && !currentStage) {
    return <p>Invalid approval stage.</p>;
  }

  return (
    <div className='mx-auto w-full max-w-4xl space-y-8 px-4 py-8'>
      {/* Welcome Header */}
      <div className='space-y-1'>
        <h1 className='text-3xl font-bold tracking-tight'>
          Welcome, <span className='text-primary'>{session?.user?.name ?? 'Student'}</span>
        </h1>
        <p className='text-muted-foreground'>
          Here&apos;s a quick overview of your <span className='text-primary'>Student</span> journey
          with us.
        </p>
      </div>

      {/* Application Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Your Application Status</CardTitle>
          <CardDescription>
            {isProfileComplete
              ? 'Track your registration and approval progress below.'
              : 'Your first step is to complete your student profile.'}
          </CardDescription>
        </CardHeader>
        <CardContent className='pt-2'>
          {isProfileComplete ? (
            currentStage && (
              <div className='space-y-6'>
                {/* Horizontal Stepper */}
                <div className='flex w-full flex-col items-center gap-2'>
                  <Dialog>
                    <div className='no-scrollbar flex w-full items-start justify-between gap-2 overflow-x-auto text-center'>
                      {approvalStages.map((stage, idx) => {
                        const isCompleted = idx < currentStageIndex;
                        const isCurrent = idx === currentStageIndex;
                        const isFirstStage = idx === 0;
                        const StepIcon = stage.icon;

                        const stepContent = (
                          <div
                            className='group relative flex min-w-0 flex-col items-center'
                            style={{ minWidth: 90 }}
                          >
                            <div
                              className={`mb-2 flex size-10 items-center justify-center rounded-full border-2 shadow-sm transition-all duration-300 ${
                                isCompleted
                                  ? 'border-green-500 bg-green-500 text-white'
                                  : isCurrent
                                    ? 'bg-primary/90 text-primary-foreground border-primary'
                                    : 'bg-muted text-muted-foreground border-muted'
                              }`}
                              aria-label={stage.tooltip}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className='h-5 w-5' />
                              ) : (
                                <StepIcon className='h-5 w-5' />
                              )}
                            </div>
                            <span
                              className={`text-xs font-medium ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}
                            >
                              {stage.title}
                            </span>
                          </div>
                        );

                        if (isFirstStage) {
                          return (
                            <DialogTrigger asChild key={stage.title}>
                              <button className='text-left'>{stepContent}</button>
                            </DialogTrigger>
                          );
                        }

                        return (
                          <div key={stage.title} className='flex-1'>
                            {stepContent}
                          </div>
                        );
                      })}
                    </div>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Submitted Details</DialogTitle>
                        <DialogDescription>
                          This is the information you provided during registration.
                        </DialogDescription>
                      </DialogHeader>
                      <div className='mt-2 space-y-3 text-sm'>
                        <div className='flex justify-between'>
                          <span className='font-medium'>Student name:</span>
                          <span>{submittedDetails.name}</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='font-medium'>Mobile No.:</span>
                          <span>{submittedDetails.phone}</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='font-medium'>Email Address:</span>
                          <span>{submittedDetails.email}</span>
                        </div>
                        {submittedDetails.hasGuardian && (
                          <>
                            <hr className='my-2' />
                            <div className='flex justify-between'>
                              <span className='font-medium'>Guardian name:</span>
                              <span>{submittedDetails.guardianName}</span>
                            </div>
                            <div className='flex justify-between'>
                              <span className='font-medium'>Guardian Mobile No.:</span>
                              <span>{submittedDetails.guardianPhone}</span>
                            </div>
                          </>
                        )}
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button>Close</Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Progress Bar */}
                  <div className='bg-muted relative mt-1 h-1.5 w-full rounded-full'>
                    <div
                      className='bg-primary absolute h-1.5 rounded-full transition-all duration-500'
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Current Stage Details */}
                <div className='bg-muted/50 flex flex-col items-center justify-center gap-3 rounded-lg p-6 text-center'>
                  <div className='flex items-center gap-3'>
                    <div
                      className={`flex items-center justify-center rounded-full border bg-white p-3 shadow-sm`}
                    >
                      <currentStage.icon
                        className={`h-7 w-7 ${currentStageIndex > 0 ? 'text-green-600' : 'text-primary'}`}
                      />
                    </div>
                    <div>
                      <div className='flex items-center gap-2 text-xl font-semibold'>
                        {currentStage.title}
                        <Badge
                          variant={
                            currentStageIndex === 0
                              ? 'destructive'
                              : currentStageIndex < approvalStages.length - 1
                                ? 'default'
                                : 'success'
                          }
                          className='ml-1'
                        >
                          {currentStageIndex === 0
                            ? 'Action Required'
                            : currentStageIndex < approvalStages.length - 1
                              ? 'In Progress'
                              : 'Completed'}
                        </Badge>
                      </div>
                      <p className='text-muted-foreground text-left text-sm'>
                        {currentStage.description}
                      </p>
                    </div>
                  </div>

                  {nextStage && (
                    <div className='border-primary/40 text-primary mt-2 flex items-center gap-2 rounded-md border-l-4 bg-white p-2 text-xs'>
                      <Info className='h-4 w-4' />
                      <span className='font-semibold'>What&apos;s next?</span>
                      <span className='text-muted-foreground'>{nextStage.description}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          ) : (
            <div className='bg-muted/40 flex flex-col items-center justify-center gap-4 rounded-lg p-8 text-center'>
              <div className='border-primary bg-primary/10 flex size-16 items-center justify-center rounded-full border-2 border-dashed'>
                <FileText className='text-primary h-8 w-8' />
              </div>
              <div className='space-y-1'>
                <h3 className='text-xl font-semibold'>Profile Update Required</h3>
                <p className='text-muted-foreground mx-auto max-w-sm'>
                  Your application can&apos;t be reviewed until your profile is complete. Please add
                  your educational background, skills, and other required information.
                </p>
              </div>
              <Button asChild className='mt-2'>
                <Link prefetch href='/dashboard/profile/general'>
                  Update Profile Now <ArrowRight className='ml-2 h-4 w-4' />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
