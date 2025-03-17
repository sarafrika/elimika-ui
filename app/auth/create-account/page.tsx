"use client"

import { useCallback, useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import illustration from "@/assets/illustration.jpg"
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Check,
  GraduationCap,
  Lightbulb,
  Loader2,
  MailCheck,
  RefreshCw
} from "lucide-react"
import { signIn } from "next-auth/react"
import { toast } from "sonner"
import {
  createOrUpdateTrainingCenter,
  createOrUpdateUser,
  fetchTrainingCenters
} from "@/app/auth/create-account/actions"
import { User, UserAccountForm } from "@/app/auth/create-account/_components/user-account-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { TrainingCenter, TrainingCenterForm } from "@/app/auth/create-account/_components/training-center-form"
import { UserRole } from "@/context/user-role-provider"

type AccountCreationStatus =
  | "idle"
  | "submitting"
  | "success"
  | "error";

export default function CreateAccountPage() {
  const authRealm = "sarafrika"

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userRole, setUserRole] = useState<UserRole>("student")
  const [step, setStep] = useState<"training_center" | "user">("training_center")
  const [trainingCenterUuid, setTrainingCenterUuid] = useState<string | null>(null)

  const [accountCreationStatus, setAccountCreationStatus] = useState<AccountCreationStatus>("idle")
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
    if (userRole !== "organisation_user") {
      fetchTrainingCenter()
    }
  }, [fetchTrainingCenter, userRole])

  const onSubmitUser = async (data: User) => {
    if (!trainingCenterUuid) {
      toast.error("Training center information is missing")
      setErrorMessage("Training center information is missing")
      return
    }

    setIsSubmitting(true)
    setAccountCreationStatus("submitting")

    try {
      const userData = {
        ...data,
        organisation_uuid: trainingCenterUuid
      }

      setUserEmail(data.email)

      const response = await createOrUpdateUser(userData, userRole)

      if (response.success) {
        setAccountCreationStatus("success")
        setShowSuccessDialog(true)
        toast.success(response.message)
        return
      }

      setAccountCreationStatus("error")
      setErrorMessage(response.message)
      toast.error(response.message)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Something went wrong while creating your account"
      setAccountCreationStatus("error")
      setErrorMessage(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSubmitTrainingCenter = async (data: TrainingCenter) => {
    setIsSubmitting(true)
    setAccountCreationStatus("submitting")

    try {
      const response = await createOrUpdateTrainingCenter(data)

      if (response.success && response.data.uuid) {
        toast.success(response.message)
        setTrainingCenterUuid(response.data.uuid)
        setStep("user")
        setAccountCreationStatus("idle")
        return
      }

      setAccountCreationStatus("error")
      setErrorMessage(response.message)
      toast.error(response.message)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Something went wrong while creating the Training Center"
      setAccountCreationStatus("error")
      setErrorMessage(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const UserTypeIcon = () => {
    switch (userRole) {
      case "student":
        return <GraduationCap className="h-6 w-6 text-slate-800" />
      case "instructor":
        return <Lightbulb className="h-6 w-6 text-slate-800" />
      case "organisation_user":
        return <Building2 className="h-6 w-6 text-slate-800" />
    }
  }

  const UserTypeTitle = () => {
    switch (userRole) {
      case "student":
        return "Join as a Student"
      case "instructor":
        return "Join as an Instructor"
      case "organisation_user":
        return "Register Your Training Center"
    }
  }

  const UserTypeDescription = () => {
    switch (userRole) {
      case "student":
        return "Access courses, track your progress, and connect with instructors"
      case "instructor":
        return "Create courses, manage students, and share your expertise"
      case "organisation_user":
        return "Register your institution and manage your instructors and courses"
    }
  }

  const renderPartnerContent = () => {
    if (step === "training_center") {
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
          organisationUuid={trainingCenterUuid}
          isSubmitting={isSubmitting}
          onSubmit={onSubmitUser}
          title="Personal Information"
          description="Enter your details as the center administrator"
        />
      )
    }
  }

  const SuccessDialog = () => (
    <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle className="text-center text-xl">
            Account Created Successfully
          </DialogTitle>
          <DialogDescription className="text-center">
            We&apos;ve sent a verification email to <span className="font-medium text-primary">{userEmail}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MailCheck className="h-4 w-4 text-primary" />
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4 text-sm">
                <li className="flex items-start">
                  <div
                    className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center text-xs mr-2 mt-0.5">1
                  </div>
                  <div>
                    <p className="font-medium">Check your inbox</p>
                    <p className="text-gray-500 text-xs">Email should arrive within 5 minutes</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div
                    className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center text-xs mr-2 mt-0.5">2
                  </div>
                  <div>
                    <p className="font-medium">Click the verification link</p>
                    <p className="text-gray-500 text-xs">This confirms your email address</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div
                    className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center text-xs mr-2 mt-0.5">3
                  </div>
                  <div>
                    <p className="font-medium">Set your password</p>
                    <p className="text-gray-500 text-xs">Create a secure password when prompted</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div
                    className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center text-xs mr-2 mt-0.5">4
                  </div>
                  <div>
                    <p className="font-medium">Log in with your credentials</p>
                    <p className="text-gray-500 text-xs">Use your email and new password</p>
                  </div>
                </li>
              </ol>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-2 border-t pt-4 mt-2">
              <div className="flex items-center text-xs text-amber-600 bg-amber-50 p-2 rounded-md w-full">
                <AlertCircle className="h-3 w-3 mr-2" />
                <span>Please check your spam folder if you don&apos;t see the email.</span>
              </div>
              <Button className="text-xs text-primary flex items-center mt-1 hover:underline">
                <RefreshCw className="h-3 w-3 mr-1" /> Didn&apos;t receive an email? Resend in 2:00
              </Button>
            </CardFooter>
          </Card>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            onClick={() => {
              setShowSuccessDialog(false)

              setAccountCreationStatus("idle")
              if (userRole === "organisation_user") {
                setStep("training_center")
              }
            }}
          >
            Register Another Account
          </Button>
          <Button
            onClick={() => signIn("keycloak")}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            Go to Login
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const ErrorAlert = () => (
    accountCreationStatus === "error" && (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
    )
  )

  const LoadingOverlay = () => (
    accountCreationStatus === "submitting" && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <p className="text-lg font-medium">Creating your account...</p>
          <p className="text-sm text-gray-500">This will only take a moment</p>
        </div>
      </div>
    )
  )

  return (
    <div className="min-h-screen py-14 bg-white">
      <div className="container px-4 mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-0 rounded-xl overflow-hidden shadow-lg border">

          <div className="w-full lg:w-3/5 p-6 md:p-8 bg-white">
            <div className="max-w-2xl mx-auto">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <UserTypeIcon />
                  <h1 className="text-2xl font-semibold">{UserTypeTitle()}</h1>
                </div>
                <p className="text-gray-600 text-sm">{UserTypeDescription()}</p>
              </div>

              <ErrorAlert />

              <Tabs
                value={userRole}
                onValueChange={(value) => {
                  const newUserRole = value as UserRole
                  setUserRole(newUserRole)

                  if (newUserRole === "organisation_user") {
                    setStep("training_center")
                    setTrainingCenterUuid(null)
                  } else {
                    fetchTrainingCenter()
                  }

                  setAccountCreationStatus("idle")
                  setErrorMessage("")
                }}
                className="mb-6"
              >
                <TabsList className="grid w-full grid-cols-3 mb-4 rounded-lg">
                  <TabsTrigger
                    value="student"
                    className="data-[state=active]:bg-primary/10 rounded-lg data-[state=active]:text-primary"
                  >
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Student
                  </TabsTrigger>
                  <TabsTrigger
                    value="instructor"
                    className="data-[state=active]:bg-primary/10 rounded-lg data-[state=active]:text-primary"
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Instructor
                  </TabsTrigger>
                  <TabsTrigger
                    value="organisation_user"
                    className="data-[state=active]:bg-primary/10 rounded-lg data-[state=active]:text-primary"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Training Center
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="student" key="student-tab">
                  <UserAccountForm
                    organisationUuid={trainingCenterUuid}
                    isSubmitting={isSubmitting}
                    onSubmit={onSubmitUser}
                    description="Enter your details to create your student account"
                  />
                </TabsContent>

                <TabsContent value="instructor" key="instructor-tab">
                  <UserAccountForm
                    organisationUuid={trainingCenterUuid}
                    isSubmitting={isSubmitting}
                    onSubmit={onSubmitUser}
                    description="Enter your details to create your instructor account"
                  />
                </TabsContent>

                <TabsContent value="organisation_user" key="organisation_user-tab">
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

          <div className="hidden lg:block lg:w-2/5 relative overflow-hidden">
            <Image
              src={illustration}
              alt="Elimika learning illustration"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 40vw"
              priority
            />
            <div className="absolute bottom-8 right-8">
              <Image
                src="/logo.svg"
                alt="Elimika Logo"
                width={120}
                height={40}
                className="opacity-90"
              />
            </div>
          </div>
        </div>
      </div>

      <SuccessDialog />

      <LoadingOverlay />
    </div>
  )
}