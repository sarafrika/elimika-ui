"use client"

import {useCallback, useEffect, useState} from "react"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import Image from "next/image"
import illustration from "@/assets/illustration.jpg"
import {
    AlertCircle,
    ArrowRight,
    Building2,
    Check,
    GraduationCap,
    Lightbulb,
    MailCheck,
    Loader2
} from "lucide-react"
import {signIn} from "next-auth/react"
import {toast} from "sonner"
import {
    createOrUpdateTrainingCenter,
    createOrUpdateUser,
    fetchTrainingCenters
} from "@/app/auth/create-account/actions"
import {TrainingCenter, TrainingCenterForm, User, UserAccountForm} from "@/app/auth/create-account/form"
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert"
import {Button} from "@/components/ui/button"
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card"

const USER_TYPE = {
    STUDENT: "STUDENT",
    INSTRUCTOR: "INSTRUCTOR",
    PARTNER: "PARTNER"
} as const

type UserType = keyof typeof USER_TYPE;

// Define the possible states of account creation
type AccountCreationStatus =
    | 'idle'
    | 'submitting'
    | 'success'
    | 'error';

export default function CreateAccountPage() {
    const authRealm = "sarafrika"

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [userType, setUserType] = useState<UserType>(USER_TYPE.STUDENT)
    const [step, setStep] = useState<'training_center' | 'user'>('training_center')
    const [trainingCenterUuid, setTrainingCenterUuid] = useState<string | null>(null)

    // New states for improved UX
    const [accountCreationStatus, setAccountCreationStatus] = useState<AccountCreationStatus>('idle')
    const [showSuccessDialog, setShowSuccessDialog] = useState(false)
    const [userEmail, setUserEmail] = useState<string>("")
    const [errorMessage, setErrorMessage] = useState<string>("")

    const fetchTrainingCenter = useCallback(async () => {
        try {
            const organisationSlug = "sarafrika"

            if (!organisationSlug) {
                toast.error("No default training center configured.")
                return
            }

            const parameters = new URLSearchParams({
                slug_eq: organisationSlug
            })

            const response = await fetchTrainingCenters(0, parameters.toString())

            if (!response.success) {
                toast.error(response.message)
                return
            }

            const [firstOrganisation] = response.data.content

            if (!firstOrganisation) {
                toast.error("No organisation found")
                return
            }

            if (firstOrganisation.uuid) {
                setTrainingCenterUuid(firstOrganisation.uuid)
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Something went wrong while fetching organisation. Please contact support."

            toast.error(errorMessage)
            setErrorMessage(errorMessage)
        }
    }, [])

    useEffect(() => {
        if (userType !== USER_TYPE.PARTNER) {
            fetchTrainingCenter()
        }
    }, [fetchTrainingCenter, userType])

    const onSubmitUser = async (data: User) => {
        if (!trainingCenterUuid) {
            toast.error("Training center information is missing")
            setErrorMessage("Training center information is missing")
            return
        }

        setIsSubmitting(true)
        setAccountCreationStatus('submitting')

        try {
            const userData = {
                ...data,
                organisation_uuid: trainingCenterUuid,
                type: userType
            }

            // Save email for success message
            setUserEmail(data.email)

            const response = await createOrUpdateUser(userData)

            if (response.success) {
                setAccountCreationStatus('success')
                setShowSuccessDialog(true)
                toast.success(response.message)
                return
            }

            setAccountCreationStatus('error')
            setErrorMessage(response.message)
            toast.error(response.message)
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "Something went wrong while creating your account"
            setAccountCreationStatus('error')
            setErrorMessage(errorMsg)
            toast.error(errorMsg)
        } finally {
            setIsSubmitting(false)
        }
    }

    const onSubmitTrainingCenter = async (data: TrainingCenter) => {
        setIsSubmitting(true)
        setAccountCreationStatus('submitting')

        try {
            const response = await createOrUpdateTrainingCenter(data)

            if (response.success && response.data.uuid) {
                toast.success(response.message)
                setTrainingCenterUuid(response.data.uuid)
                setStep('user')
                setAccountCreationStatus('idle')
                return
            }

            setAccountCreationStatus('error')
            setErrorMessage(response.message)
            toast.error(response.message)
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "Something went wrong while creating the Training Center"
            setAccountCreationStatus('error')
            setErrorMessage(errorMsg)
            toast.error(errorMsg)
        } finally {
            setIsSubmitting(false)
        }
    }

    const UserTypeIcon = () => {
        switch (userType) {
            case USER_TYPE.STUDENT:
                return <GraduationCap className="h-6 w-6 text-slate-800"/>
            case USER_TYPE.INSTRUCTOR:
                return <Lightbulb className="h-6 w-6 text-slate-800"/>
            case USER_TYPE.PARTNER:
                return <Building2 className="h-6 w-6 text-slate-800"/>
        }
    }

    const UserTypeTitle = () => {
        switch (userType) {
            case USER_TYPE.STUDENT:
                return "Join as a Student"
            case USER_TYPE.INSTRUCTOR:
                return "Join as an Instructor"
            case USER_TYPE.PARTNER:
                return "Register Your Training Center"
        }
    }

    const UserTypeDescription = () => {
        switch (userType) {
            case USER_TYPE.STUDENT:
                return "Access courses, track your progress, and connect with instructors"
            case USER_TYPE.INSTRUCTOR:
                return "Create courses, manage students, and share your expertise"
            case USER_TYPE.PARTNER:
                return "Register your institution and manage your instructors and courses"
        }
    }

    const renderPartnerContent = () => {
        if (step === 'training_center') {
            return (
                <TrainingCenterForm
                    authRealm={authRealm}
                    isSubmitting={isSubmitting}
                    onSubmit={onSubmitTrainingCenter}
                />
            )
        } else {
            return (
                <UserAccountForm
                    userType={USER_TYPE.PARTNER}
                    organisationUuid={trainingCenterUuid}
                    isSubmitting={isSubmitting}
                    onSubmit={onSubmitUser}
                    title="Personal Information"
                    description="Enter your details as the center administrator"
                />
            )
        }
    }

    // Success Dialog Component
    const SuccessDialog = () => (
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-500"/>
                        Account Created Successfully
                    </DialogTitle>
                    <DialogDescription>
                        We&apos;ve sent a verification email to <span className="font-medium">{userEmail}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <MailCheck className="h-4 w-4 text-blue-500"/>
                                Next Steps
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ol className="list-decimal pl-5 space-y-2 text-sm">
                                <li>Check your inbox for the verification email</li>
                                <li>Click the verification link in the email</li>
                                <li>Set your password when prompted</li>
                                <li>Log in with your email and new password</li>
                            </ol>
                        </CardContent>
                        <CardFooter className="text-xs text-gray-600">
                            Please check your spam folder if you don&apos;t see the email within a few minutes.
                        </CardFooter>
                    </Card>
                </div>

                <DialogFooter className="sm:justify-between">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setShowSuccessDialog(false)
                            // Reset form states
                            setAccountCreationStatus('idle')
                            if (userType === USER_TYPE.PARTNER) {
                                setStep('training_center')
                            }
                        }}
                    >
                        Register Another Account
                    </Button>
                    <Button
                        onClick={() => signIn("keycloak")}
                        className="gap-2"
                    >
                        Go to Login
                        <ArrowRight className="h-4 w-4"/>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

    // Error Alert Component
    const ErrorAlert = () => (
        accountCreationStatus === 'error' && (
            <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4"/>
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
        )
    );

    // Loading Overlay Component
    const LoadingOverlay = () => (
        accountCreationStatus === 'submitting' && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
                    <Loader2 className="h-8 w-8 text-primary animate-spin mb-4"/>
                    <p className="text-lg font-medium">Creating your account...</p>
                    <p className="text-sm text-gray-500">This will only take a moment</p>
                </div>
            </div>
        )
    );

    return (
        <div className="min-h-screen py-14 bg-white">
            <div className="container px-4 mx-auto max-w-7xl">
                <div className="flex flex-col lg:flex-row gap-0 rounded-xl overflow-hidden shadow-lg border">
                    {/* Form Section */}
                    <div className="w-full lg:w-3/5 p-6 md:p-8 bg-white">
                        <div className="max-w-2xl mx-auto">
                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <UserTypeIcon/>
                                    <h1 className="text-2xl font-semibold">{UserTypeTitle()}</h1>
                                </div>
                                <p className="text-gray-600 text-sm">{UserTypeDescription()}</p>
                            </div>

                            {/* Error Alert */}
                            <ErrorAlert/>

                            <Tabs
                                value={userType}
                                onValueChange={(value) => {
                                    const newUserType = value as UserType;
                                    setUserType(newUserType);

                                    if (newUserType === USER_TYPE.PARTNER) {
                                        setStep('training_center');
                                        setTrainingCenterUuid(null);
                                    } else {
                                        fetchTrainingCenter();
                                    }

                                    // Reset error state when changing tabs
                                    setAccountCreationStatus('idle')
                                    setErrorMessage("")
                                }}
                                className="mb-6"
                            >
                                <TabsList className="grid w-full grid-cols-3 mb-4 rounded-lg">
                                    <TabsTrigger
                                        value={USER_TYPE.STUDENT}
                                        className="data-[state=active]:bg-primary/10 rounded-lg data-[state=active]:text-primary"
                                    >
                                        <GraduationCap className="h-4 w-4 mr-2"/>
                                        Student
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value={USER_TYPE.INSTRUCTOR}
                                        className="data-[state=active]:bg-primary/10 rounded-lg data-[state=active]:text-primary"
                                    >
                                        <Lightbulb className="h-4 w-4 mr-2"/>
                                        Instructor
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value={USER_TYPE.PARTNER}
                                        className="data-[state=active]:bg-primary/10 rounded-lg data-[state=active]:text-primary"
                                    >
                                        <Building2 className="h-4 w-4 mr-2"/>
                                        Training Center
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value={USER_TYPE.STUDENT} key="student-tab">
                                    <UserAccountForm
                                        userType={USER_TYPE.STUDENT}
                                        organisationUuid={trainingCenterUuid}
                                        isSubmitting={isSubmitting}
                                        onSubmit={onSubmitUser}
                                        description="Enter your details to create your student account"
                                    />
                                </TabsContent>

                                <TabsContent value={USER_TYPE.INSTRUCTOR} key="instructor-tab">
                                    <UserAccountForm
                                        userType={USER_TYPE.INSTRUCTOR}
                                        organisationUuid={trainingCenterUuid}
                                        isSubmitting={isSubmitting}
                                        onSubmit={onSubmitUser}
                                        description="Enter your details to create your instructor account"
                                    />
                                </TabsContent>

                                <TabsContent value={USER_TYPE.PARTNER} key="partner-tab">
                                    {renderPartnerContent()}
                                </TabsContent>
                            </Tabs>

                            <div className="text-center text-sm text-gray-500 mt-8">
                                Already have an account?{" "}
                                <span
                                    className="text-blue-500 hover:underline cursor-pointer"
                                    onClick={() => signIn("keycloak")}
                                >
                                    Sign in
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Illustration Section */}
                    <div className="hidden lg:block w-2/5 bg-slate-800">
                        <div className="h-full flex flex-col items-center justify-center p-10 text-white">
                            <div className="mb-6">
                                <Image
                                    src={illustration}
                                    alt="Learning illustration"
                                    width={280}
                                    height={200}
                                    className="rounded-md object-cover"
                                />
                            </div>
                            <h2 className="text-xl font-medium mb-2 text-center">
                                Welcome to Elimika
                            </h2>
                            <p className="text-center text-sm mb-8 text-gray-300">
                                Join our community of learners and educators. Unlock new skills,
                                advance your career, and connect with experts from around the
                                world.
                            </p>
                            <div className="grid grid-cols-2 gap-4 w-full">
                                <div className="bg-slate-700/50 p-3 rounded-md">
                                    <h3 className="font-medium mb-0">1000+</h3>
                                    <p className="text-xs text-gray-300">Courses Available</p>
                                </div>
                                <div className="bg-slate-700/50 p-3 rounded-md">
                                    <h3 className="font-medium mb-0">50K+</h3>
                                    <p className="text-xs text-gray-300">Active Students</p>
                                </div>
                                <div className="bg-slate-700/50 p-3 rounded-md">
                                    <h3 className="font-medium mb-0">200+</h3>
                                    <p className="text-xs text-gray-300">Expert Instructors</p>
                                </div>
                                <div className="bg-slate-700/50 p-3 rounded-md">
                                    <h3 className="font-medium mb-0">95%</h3>
                                    <p className="text-xs text-gray-300">Success Rate</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Dialog */}
            <SuccessDialog/>

            {/* Loading Overlay */}
            <LoadingOverlay/>
        </div>
    )
}