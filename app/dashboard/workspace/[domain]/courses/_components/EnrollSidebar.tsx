"use client";

import type { Course } from "@/services/client";
import {
  Award,
  BookOpen,
  Building2,
  Calendar,
  Clock,
  Download,
  FileCheck,
  Globe,
  Infinity,
  MapPin,
  Monitor,
  MoveRight,
  Search,
  Shield,
  Video,
  Wrench
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "../../../../../../components/ui/button";
import { CombinedClassDetailsData } from "../../../../../../hooks/use-class-details";
import { UserDomain } from "../../../../../../lib/types";
import { PreviewRow } from "../../../../@instructor/classes/new/_components/class-creation-preview-rail";

type Props = {
  course: Course;
  classData: CombinedClassDetailsData;
  creatorName: string;
  difficultyName: string | null;
  lessonCount: number;
  assessmentCount: number;
  durationLabel: string;
  onEnroll: () => void;
  handleBecomeInstructor: () => void;
  onSearchInstructor: () => void;
  onInviteStudents?: () => void;
  onApplyForFunding?: () => void;
  handleDeleteClass?: () => void;
  activeDomain?: UserDomain | null;
  becomeInstructorLabel?: string;
  becomeInstructorDisabled?: boolean;
  type?: "course" | "class";
};

export default function EnrollSidebar({
  course,
  classData,
  creatorName,
  difficultyName,
  lessonCount,
  assessmentCount,
  durationLabel,
  onEnroll,
  handleBecomeInstructor,
  onSearchInstructor,
  onInviteStudents,
  onApplyForFunding,
  handleDeleteClass,
  activeDomain,
  becomeInstructorLabel = "Apply to Train",
  becomeInstructorDisabled = false,
  type,
}: Props) {
  const router = useRouter()
  const priceLabel =
    typeof course.minimum_training_fee === "number" &&
      course.minimum_training_fee > 0
      ? `From Ksh ${course.minimum_training_fee.toLocaleString()}`
      : "Pricing not set";

  const totalMinutes = classData?.schedule.reduce(
    (sum, item) => sum + Number(item.duration_minutes),
    0
  );
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const totalDuration = `${hours}h${minutes ? ` ${minutes}m` : ""}`;

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* ENROLL CARD */}
      <div className="rounded-xl border border-border bg-card text-card-foreground p-4 sm:p-5">

        {type === "course" && (activeDomain === "instructor") &&
          <>
            <div className="space-y-2">
              <p className="text-md font-extrabold text-muted-foreground">
                Split Ratio
              </p>
              <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Course Creator</p>
                  <p className="font-semibold">
                    {course?.creator_share_percentage}%
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <p className="font-medium">Instructor</p>
                  <p className="font-semibold">
                    {course?.instructor_share_percentage}%
                  </p>
                </div>

                <div className="border-t pt-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-medium text-foreground">Note:</span>{" "}
                    {course?.revenue_share_notes}
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleBecomeInstructor}
              disabled={becomeInstructorDisabled}
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 sm:text-base"
            >
              {becomeInstructorLabel}
            </Button>
          </>}

        {type === "course" && (activeDomain !== "instructor") && (
          <>
            <p className="mb-1 text-sm font-medium text-muted-foreground">
              Enroll in this course
            </p>

            <p className="mb-4 text-xl font-black text-foreground sm:text-2xl lg:text-3xl">
              {priceLabel}
            </p>

            <div className="flex flex-col gap-2.5 sm:gap-3">
              <Button
                onClick={onEnroll}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 sm:text-base"
              >
                Enroll Now
                <MoveRight className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                onClick={onSearchInstructor}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-accent hover:text-accent-foreground sm:py-3 sm:text-base"
              >
                <Search className="h-4 w-4" />
                Search Instructor
              </Button>
            </div>
          </>)}


        {type === "class" && activeDomain === "instructor" && (
          <>
            <p className="mb-1 text-sm font-medium text-muted-foreground">
              Enroll students in this class
            </p>

            <p className="mb-4 text-xl font-black text-foreground sm:text-2xl lg:text-3xl">
              From Ksh {classData?.class?.training_fee}
            </p>

            <div className="flex flex-col gap-2.5 sm:gap-3">
              <Button
                onClick={onInviteStudents}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 sm:text-base"
              >
                Invite Students
              </Button>

              <Button
                type="button"
                onClick={onApplyForFunding}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-accent hover:text-accent-foreground sm:py-3 sm:text-base"
              >
                Apply for funding
              </Button>
            </div>
          </>
        )}

        <div className="mt-4 flex flex-col gap-3 pt-1">
          {[
            {
              icon: <Shield className="h-4 w-4 text-muted-foreground" />,
              text: "30-Day Money-Back Guarantee",
            },
            {
              icon: <Infinity className="h-4 w-4 text-muted-foreground" />,
              text: "Full Lifetime Access",
            },
            {
              icon: <Monitor className="h-4 w-4 text-muted-foreground" />,
              text: "Access on Mobile & Desktop",
            },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              {item.icon}
              <span className="text-sm text-muted-foreground">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* COURSE META */}
      {type === "class" && (
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-4 sm:px-5">
            <h3 className="text-md font-extrabold">Schedule Summary</h3>
          </div>

          <PreviewRow
            icon={Globe}
            label="Lecture Type"
            value={classData?.class?.location_type || "N/A"}
          />

          <PreviewRow
            icon={MapPin}
            label="Location"
            value={classData?.class?.location_name || "N/A"}
          />

          <PreviewRow
            icon={Building2}
            label="Session Format"
            value={classData?.class?.session_format || "N/A"}
          />

          <PreviewRow
            icon={Calendar}
            label="Registration Period"
            value={
              classData?.class?.registration_period_start_date &&
                classData?.class?.registration_period_end_date
                ? `${new Date(
                  classData.class.registration_period_start_date
                ).toLocaleDateString()} - ${new Date(
                  classData.class.registration_period_end_date
                ).toLocaleDateString()}`
                : classData?.class?.registration_period_start_date
                  ? `${new Date(
                    classData.class.registration_period_start_date
                  ).toLocaleDateString()} (Continuous)`
                  : "Continuous"
            }
          />

          <PreviewRow
            icon={Calendar}
            label="Start Date"
            value={
              classData?.class?.default_start_time
                ? new Date(
                  classData.class.default_start_time
                ).toLocaleDateString()
                : "TBA"
            }
          />

          <PreviewRow
            icon={Clock}
            label="Class Duration"
            value={totalDuration || "N/A"}
          />

          {classData?.class?.meeting_link && (
            <PreviewRow
              icon={Video}
              label="Meeting Link"
              value={classData.class.meeting_link}
            />
          )}

          <div className="border-t border-border p-4 sm:p-5">
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-full rounded-md"
              onClick={() => {
                router.push(
                  `/dashboard/classes/new?id=${classData?.class?.uuid}`
                )
              }}
            >
              Edit Schedule
            </Button>
          </div>
        </div>
      )}

      {/* COURSE INCLUDES */}
      <div className="rounded-xl border border-border bg-card shadow-sm p-4 sm:p-5">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          7
        </h3>

        <div className="flex flex-col gap-3">
          {[
            {
              icon: <BookOpen className="h-4 w-4 text-muted-foreground" />,
              text: `${lessonCount} Lessons`,
            },
            {
              icon: <FileCheck className="h-4 w-4 text-muted-foreground" />,
              text: `${assessmentCount} Assessments`,
            },
            {
              icon: <Wrench className="h-4 w-4 text-muted-foreground" />,
              text: "Hands-on Projects",
            },
            {
              icon: <Download className="h-4 w-4 text-muted-foreground" />,
              text: "Downloadable Resources",
            },
            {
              icon: <Infinity className="h-4 w-4 text-muted-foreground" />,
              text: "Full Lifetime Access",
            },
            {
              icon: <Award className="h-4 w-4 text-muted-foreground" />,
              text: "Certificate of Completion",
            },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              {item.icon}
              <span className="text-sm text-muted-foreground">
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>



      {type === "class" && activeDomain === "instructor" && (
        <div>
          <Button onClick={handleDeleteClass} variant="destructive" size="sm" className="w-full rounded-md h-10" >
            Delete Class
          </Button>
        </div>
      )}
    </div>
  );
}
