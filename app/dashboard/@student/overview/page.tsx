"use client"

import { useSession } from "next-auth/react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
  CheckCircle2,
  FileText,
  Search,
  ThumbsUp,
  GraduationCap,
  Info,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const approvalStages = [
  {
    title: "Profile Submitted",
    description: "Your profile has been submitted.",
    icon: FileText,
    tooltip: "We have received your registration details.",
  },
  {
    title: "Under Review",
    description: "Your application is being reviewed by our team.",
    icon: Search,
    tooltip: "Our team is checking your information.",
  },
  {
    title: "Approved",
    description: "Congratulations! You have been approved.",
    icon: ThumbsUp,
    tooltip: "You are approved and ready for enrollment.",
  },
  {
    title: "Enrolled",
    description: "You are now officially enrolled.",
    icon: GraduationCap,
    tooltip: "Welcome! You are now a student.",
  },
]

const currentStage = 1 // 0-based index; e.g., 1 = "Under Review"
const progressPercent = ((currentStage + 1) / approvalStages.length) * 100

export default function StudentOverviewPage() {
  const { data: session } = useSession()
  const firstGuardian = {
    firstName: "Jane",
    lastName: "Doe",
    phone: "+254700000001",
  }
  const stage = approvalStages[currentStage]

  if (!stage) {
    return <p>Invalid approval stage.</p>
  }

  const isProfileStage = Number(currentStage) === 0
  const nextStage = approvalStages[currentStage + 1]

  const editName = "John Doe"
  const editPhone = "0712345678"
  const editEmail = "john.doe@example.com"
  const editGuardian = "Jane Doe"
  const editGuardianPhone = "+254700000001"

  return (
    <div className="bg-background mx-auto flex max-h-screen min-h-screen w-full max-w-2xl flex-col items-center gap-4 overflow-y-auto px-2 py-6">
      <div className="flex flex-col justify-start gap-4">
        <p className="text-2xl font-bold">
          Welcome <span className="text-primary">{session?.user?.name}</span>
        </p>
        <span className="text-muted-foreground">
          You are logged in as a Student.
        </span>
      </div>

      {/* Section Header */}
      <div className="mb-1 w-full text-center">
        <h2 className="text-primary text-lg font-bold tracking-tight">
          Approval Process
        </h2>
        <p className="text-muted-foreground text-xs">
          Track your registration and approval progress below.
        </p>
      </div>

      {/* Horizontal Stepper/Stages Row */}
      <div className="flex w-full flex-col items-center gap-2">
        <div className="no-scrollbar flex w-full items-center justify-center gap-2 overflow-x-auto">
          {approvalStages.map((stage, idx) => {
            const StepIcon = stage.icon
            const isFirstStage = idx === 0
            return (
              <div
                key={stage.title}
                className={`group relative flex min-w-0 flex-col items-center ${isFirstStage ? "cursor-pointer" : ""}`}
                style={{ minWidth: 70 }}
                role={isFirstStage ? "button" : undefined}
                tabIndex={isFirstStage ? 0 : -1}
                aria-label={
                  isFirstStage
                    ? "View submitted profile details"
                    : stage.tooltip
                }
              >
                <div
                  className={`mb-1 flex size-8 items-center justify-center rounded-full border-2 shadow-sm transition-all duration-300 ${
                    idx < currentStage
                      ? "border-green-500 bg-green-500 text-white"
                      : idx === currentStage
                        ? "bg-primary/90 text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-muted"
                  }`}
                  tabIndex={isFirstStage ? -1 : 0} // Icon not focusable if parent is button
                  aria-label={isFirstStage ? undefined : stage.tooltip} // Tooltip on parent for first stage
                  aria-hidden={isFirstStage ? "true" : undefined}
                >
                  {idx < currentStage ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={`truncate text-[11px] font-medium ${idx === currentStage ? "text-primary" : "text-muted-foreground"}`}
                >
                  {stage.title}
                </span>
              </div>
            )
          })}
        </div>
        <div className="bg-muted relative mt-0.5 h-1 w-full rounded-full">
          <div
            className="bg-primary absolute h-1 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Current Stage Details Card */}
      <div
        className={`relative mt-2 flex w-full max-w-lg flex-col items-center justify-center gap-3 rounded-xl border bg-white/95 p-6 shadow-md transition-all duration-300`}
        style={{ minHeight: 110 }}
      >
        <div className="mb-2 flex items-center gap-3">
          <div
            className={`bg-muted/60 border-muted-200 flex items-center justify-center rounded-full border p-3`}
          >
            <stage.icon
              className={`h-6 w-6 ${currentStage > 0 ? "text-green-600" : "text-primary"}`}
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-lg leading-tight font-semibold">
              {stage.title}
              <span className="bg-primary/10 text-primary ml-1 rounded px-2 py-0.5 text-sm font-medium">
                Current
              </span>
            </div>
            <Badge
              variant={isProfileStage ? "default" : "secondary"}
              className="mt-1 w-fit px-2 py-0.5 text-sm"
            >
              {isProfileStage ? "In Progress" : "Completed"}
            </Badge>
          </div>
        </div>
        <div className="text-muted-foreground mb-2 text-base leading-tight">
          {stage.description}
        </div>
        {/* What's next section for current stage */}
        {nextStage && (
          <div className="bg-primary/5 border-primary/40 mt-1 flex items-center gap-2 rounded border-l-4 p-1">
            <Info className="text-primary h-3 w-3" />
            <span className="text-primary text-[11px] font-medium">
              What&apos;s next?
            </span>
            <span className="text-muted-foreground text-[11px]">
              {nextStage.description}
            </span>
          </div>
        )}
        <Alert className="bg-primary/5 mt-1 border-none p-2 shadow-none">
          <AlertTitle className="text-xs">
            Current Stage: {stage.title}
          </AlertTitle>
          <AlertDescription className="text-[11px]">
            {stage.description}
          </AlertDescription>
        </Alert>
      </div>
      {/* Modal for viewing submitted details */}
      <Dialog>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submitted Details</DialogTitle>
            <DialogDescription>
              Here are the details you submitted during registration.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex flex-col gap-3 text-base">
            <div className="flex justify-between">
              <span className="font-medium">Student name:</span>{" "}
              <span>{editName}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Mobile No.:</span>{" "}
              <span>{editPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Email Address:</span>{" "}
              <span>{editEmail}</span>
            </div>
            {firstGuardian && (
              <>
                <div className="flex justify-between">
                  <span className="font-medium">Guardian name:</span>{" "}
                  <span>{editGuardian}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Guardian Mobile No.:</span>{" "}
                  <span>{editGuardianPhone}</span>
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
    </div>
  )
}
