'use client';

import {
  createOrUpdateTrainingCenter,
  createUser,
  fetchTrainingCenters,
} from '@/app/auth/create-account/_components/actions';
import {
  type TrainingCenter,
  TrainingCenterForm,
} from '@/app/auth/create-account/_components/training-center-form';
import {
  type User,
  UserAccountForm,
} from '@/app/auth/create-account/_components/user-account-form';
import illustration from '@/assets/illustration.jpg';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { UserDomain } from '@/lib/types';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Check,
  GraduationCap,
  Lightbulb,
  Loader2,
  MailCheck,
} from 'lucide-react';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

type AccountCreationStatus = 'idle' | 'submitting' | 'success' | 'error';

type CreateAccountPageClientProps = {
  authRealm: string;
};

export default function CreateAccountPageClient({ authRealm }: CreateAccountPageClientProps) {

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userDomain, setUserDomain] = useState<UserDomain>('student');
  const [step, setStep] = useState<'training_center' | 'user'>('training_center');
  const [trainingCenterUuid, setTrainingCenterUuid] = useState<string | null>(null);

  const [accountCreationStatus, setAccountCreationStatus] = useState<AccountCreationStatus>('idle');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const fetchTrainingCenter = useCallback(async () => {
    try {
      const organisationSlug = 'sarafrika';

      if (!organisationSlug) {
        toast.error('No default training center configured.');
        return;
      }

      const parameters = new URLSearchParams({
        slug_eq: organisationSlug,
      });

      const response = await fetchTrainingCenters(0, parameters.toString());

      if (!response.success) {
        toast.error(response.message);
        return;
      }

      const [firstOrganisation] = response.data.content;

      if (!firstOrganisation) {
        toast.error('No organisation found');
        return;
      }

      if (firstOrganisation.uuid) {
        setTrainingCenterUuid(firstOrganisation.uuid);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Something went wrong while fetching organisation. Please contact support.';

      toast.error(errorMessage);
      setErrorMessage(errorMessage);
    }
  }, []);

  useEffect(() => {
    if (userDomain !== 'organisation_user') {
      fetchTrainingCenter();
    }
  }, [fetchTrainingCenter, userDomain]);

  const onSubmitUser = async (data: User) => {
    if (!trainingCenterUuid) {
      toast.error('Training center information is missing');
      setErrorMessage('Training center information is missing');
      return;
    }

    setIsSubmitting(true);
    setAccountCreationStatus('submitting');

    try {
      const userData = {
        ...data,
        organisation_uuid: trainingCenterUuid,
      };

      setUserEmail(data.email);

      const response = await createUser(userData, userDomain);

      if (response.success) {
        setAccountCreationStatus('success');
        setShowSuccessDialog(true);
        toast.success(response.message);
        return;
      }

      setAccountCreationStatus('error');
      setErrorMessage(response.message);
      toast.error(response.message);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Something went wrong while creating your account';
      setAccountCreationStatus('error');
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitTrainingCenter = async (data: TrainingCenter) => {
    setIsSubmitting(true);
    setAccountCreationStatus('submitting');

    try {
      const response = await createOrUpdateTrainingCenter(data);

      if (response.success && response.data.uuid) {
        toast.success(response.message);
        setTrainingCenterUuid(response.data.uuid);
        setStep('user');
        setAccountCreationStatus('idle');
        return;
      }

      setAccountCreationStatus('error');
      setErrorMessage(response.message);
      toast.error(response.message);
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : 'Something went wrong while creating the Training Center';
      setAccountCreationStatus('error');
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const UserTypeIcon = () => {
    switch (userDomain) {
      case 'student':
        return <GraduationCap className='text-primary h-6 w-6' />;
      case 'instructor':
        return <Lightbulb className='text-primary h-6 w-6' />;
      case 'organisation_user':
        return <Building2 className='text-primary h-6 w-6' />;
    }
  };

  const UserTypeTitle = () => {
    switch (userDomain) {
      case 'student':
        return 'Join as a Student';
      case 'instructor':
        return 'Join as an Instructor';
      case 'organisation_user':
        return 'Register Your Training Center';
    }
  };

  const UserTypeDescription = () => {
    switch (userDomain) {
      case 'student':
        return 'Access courses, track your progress, and connect with instructors';
      case 'instructor':
        return 'Create courses, manage students, and share your expertise';
      case 'organisation_user':
        return 'Register your institution and manage your instructors and courses';
    }
  };

  const renderPartnerContent = () => {
    if (step === 'training_center') {
      return (
        <TrainingCenterForm
          authRealm={authRealm}
          isSubmitting={isSubmitting}
          onSubmit={onSubmitTrainingCenter}
        />
      );
    } else {
      return (
        <UserAccountForm
          organisationUuid={trainingCenterUuid}
          isSubmitting={isSubmitting}
          onSubmit={onSubmitUser}
          title='Personal Information'
          description='Enter your details as the center administrator'
        />
      );
    }
  };

  const SuccessDialog = () => (
    <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <div className='bg-primary/10 text-primary ring-primary/20 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ring-1'>
            <Check className='h-6 w-6' />
          </div>
          <DialogTitle className='text-center text-xl'>Account Created Successfully</DialogTitle>
          <DialogDescription className='text-center'>
            We&apos;ve sent a verification email to{' '}
            <span className='text-primary font-medium'>{userEmail}</span>
          </DialogDescription>
        </DialogHeader>

        <div className='py-4'>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='flex items-center gap-2 text-base'>
                <MailCheck className='text-primary h-4 w-4' />
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className='space-y-4 text-sm'>
                <li className='flex items-start'>
                  <div className='bg-primary text-primary-foreground mt-0.5 mr-2 flex h-5 w-5 items-center justify-center rounded-full text-xs'>
                    1
                  </div>
                  <div>
                    <p className='font-medium'>Check your inbox</p>
                    <p className='text-muted-foreground text-xs'>
                      Email should arrive within 5 minutes
                    </p>
                  </div>
                </li>
                <li className='flex items-start'>
                  <div className='bg-primary text-primary-foreground mt-0.5 mr-2 flex h-5 w-5 items-center justify-center rounded-full text-xs'>
                    2
                  </div>
                  <div>
                    <p className='font-medium'>Click the verification link</p>
                    <p className='text-muted-foreground text-xs'>
                      This confirms your email address
                    </p>
                  </div>
                </li>
                <li className='flex items-start'>
                  <div className='bg-primary text-primary-foreground mt-0.5 mr-2 flex h-5 w-5 items-center justify-center rounded-full text-xs'>
                    3
                  </div>
                  <div>
                    <p className='font-medium'>Set your password</p>
                    <p className='text-muted-foreground text-xs'>
                      Create a secure password when prompted
                    </p>
                  </div>
                </li>
                <li className='flex items-start'>
                  <div className='bg-primary text-primary-foreground mt-0.5 mr-2 flex h-5 w-5 items-center justify-center rounded-full text-xs'>
                    4
                  </div>
                  <div>
                    <p className='font-medium'>Log in with your credentials</p>
                    <p className='text-muted-foreground text-xs'>Use your email and new password</p>
                  </div>
                </li>
              </ol>
            </CardContent>
            <CardFooter className='mt-2 flex flex-col items-start gap-2 border-t pt-4'>
              <div className='bg-muted text-muted-foreground flex w-full items-center rounded-md p-2 text-xs'>
                <AlertCircle className='mr-2 h-3 w-3' />
                <span>Please check your spam folder if you don&apos;t see the email.</span>
              </div>
              {/*<Button className="text-xs text-primary flex items-center mt-1 hover:underline">
                <RefreshCw className="h-3 w-3 mr-1" /> Didn&apos;t receive an email? Resend in 2:00
              </Button>*/}
            </CardFooter>
          </Card>
        </div>

        <DialogFooter className='sm:justify-between'>
          <Button
            variant='outline'
            onClick={() => {
              setShowSuccessDialog(false);

              setAccountCreationStatus('idle');
              if (userDomain === 'organisation_user') {
                setStep('training_center');
              }
            }}
          >
            Register Another Account
          </Button>
          <Button
            onClick={() => signIn('keycloak')}
            className='bg-primary hover:bg-primary/90 gap-2'
          >
            Go to Login
            <ArrowRight className='h-4 w-4' />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const ErrorAlert = () =>
    accountCreationStatus === 'error' && (
      <Alert variant='destructive' className='mb-6'>
        <AlertCircle className='h-4 w-4' />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
    );

  const LoadingOverlay = () =>
    accountCreationStatus === 'submitting' && (
      <div className='bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm'>
        <div className='border-border bg-card flex flex-col items-center rounded-lg border p-6 shadow-lg'>
          <Loader2 className='text-primary mb-4 h-8 w-8 animate-spin' />
          <p className='text-foreground text-lg font-medium'>Creating your account...</p>
          <p className='text-muted-foreground text-sm'>This will only take a moment</p>
        </div>
      </div>
    );

  return (
    <div className='bg-background min-h-screen py-14'>
      <div className='container mx-auto max-w-7xl px-4'>
        <div className='border-border bg-card flex flex-col gap-0 overflow-hidden rounded-xl border shadow-lg lg:flex-row'>
          <div className='bg-card w-full p-6 md:p-8 lg:w-3/5'>
            <div className='mx-auto max-w-2xl'>
              <div className='mb-4'>
                <div className='mb-1 flex items-center gap-2'>
                  <UserTypeIcon />
                  <h1 className='text-2xl font-semibold'>{UserTypeTitle()}</h1>
                </div>
                <p className='text-muted-foreground text-sm'>{UserTypeDescription()}</p>
              </div>

              <ErrorAlert />

              <Tabs
                value={userDomain}
                onValueChange={value => {
                  const newUserDomain = value as UserDomain;
                  setUserDomain(newUserDomain);

                  if (newUserDomain === 'organisation_user') {
                    setStep('training_center');
                    setTrainingCenterUuid(null);
                  } else {
                    fetchTrainingCenter();
                  }

                  setAccountCreationStatus('idle');
                  setErrorMessage('');
                }}
                className='mb-6'
              >
                <TabsList className='mb-4 grid w-full grid-cols-3 rounded-lg'>
                  <TabsTrigger
                    value='student'
                    className='data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg'
                  >
                    <GraduationCap className='mr-2 h-4 w-4' />
                    Student
                  </TabsTrigger>
                  <TabsTrigger
                    value='instructor'
                    className='data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg'
                  >
                    <Lightbulb className='mr-2 h-4 w-4' />
                    Instructor
                  </TabsTrigger>
                  <TabsTrigger
                    value='organisation_user'
                    className='data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg'
                  >
                    <Building2 className='mr-2 h-4 w-4' />
                    Training Center
                  </TabsTrigger>
                </TabsList>

                <TabsContent value='student' key='student-tab'>
                  <UserAccountForm
                    organisationUuid={trainingCenterUuid}
                    isSubmitting={isSubmitting}
                    onSubmit={onSubmitUser}
                    description='Enter your details to create your student account'
                  />
                </TabsContent>

                <TabsContent value='instructor' key='instructor-tab'>
                  <UserAccountForm
                    organisationUuid={trainingCenterUuid}
                    isSubmitting={isSubmitting}
                    onSubmit={onSubmitUser}
                    description='Enter your details to create your instructor account'
                  />
                </TabsContent>

                <TabsContent value='organisation_user' key='organisation_user-tab'>
                  {renderPartnerContent()}
                </TabsContent>
              </Tabs>

              <div className='text-muted-foreground mt-8 text-center text-sm'>
                Already have an account?{' '}
                <span
                  className='text-primary cursor-pointer hover:underline'
                  onClick={() => signIn('keycloak')}
                >
                  Sign in
                </span>
              </div>
            </div>
          </div>

          <div className='relative hidden overflow-hidden lg:block lg:w-2/5'>
            <Image
              src={illustration}
              alt='Elimika learning illustration'
              fill
              className='object-cover'
              sizes='(max-width: 1024px) 100vw, 40vw'
              priority
            />
            <div className='absolute right-8 bottom-8 flex items-center'>
              <Image
                src='/logos/elimika/Artboard 2.svg'
                alt='Elimika logo'
                width={120}
                height={40}
                className='opacity-90 drop-shadow dark:hidden'
              />
              <Image
                src='/logos/elimika/Artboard 8.svg'
                alt='Elimika logo in white'
                width={120}
                height={40}
                className='hidden opacity-90 drop-shadow dark:block'
              />
            </div>
          </div>
        </div>
      </div>

      <SuccessDialog />

      <LoadingOverlay />
    </div>
  );
}
