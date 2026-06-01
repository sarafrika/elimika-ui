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
  Infinity,
  MapPin,
  Monitor,
  MoveRight,
  Search,
  Shield,
  Wrench
} from "lucide-react";
import { Button } from "../../../../../../components/ui/button";
import { UserDomain } from "../../../../../../lib/types";

type Props = {
  course: Course;
  creatorName: string;
  difficultyName: string | null;
  lessonCount: number;
  assessmentCount: number;
  durationLabel: string;
  onEnroll: () => void;
  handleBecomeInstructor: () => void;
  onSearchInstructor: () => void;
  activeDomain?: UserDomain | null;
};

export default function EnrollSidebar({
  course,
  creatorName,
  difficultyName,
  lessonCount,
  assessmentCount,
  durationLabel,
  onEnroll,
  handleBecomeInstructor,
  onSearchInstructor,
  activeDomain,
}: Props) {
  const priceLabel =
    typeof course.minimum_training_fee === "number" &&
      course.minimum_training_fee > 0
      ? `From Ksh ${course.minimum_training_fee.toLocaleString()}`
      : "Pricing not set";

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* ENROLL CARD */}
      <div className="rounded-xl border border-border bg-card text-card-foreground p-4 sm:p-5">

        {activeDomain === "instructor" ? (
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
              onClick={handleBecomeInstructor}
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 sm:text-base"
            >
              Become an Instructor
            </Button>
          </>
        ) : (<>
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
      <div className="rounded-xl border border-border bg-card px-6 py-2">
        <div className="flex flex-col gap-2">
          {[
            // {
            //   label: "Lecture Type",
            //   value: course.status || "Course",
            //   icon: <Globe className="h-4 w-4 text-muted-foreground" />,
            // },
            {
              label: "Creator",
              value: creatorName,
              icon: <MapPin className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Difficulty",
              value: difficultyName || "General",
              icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Start Date",
              value: course.created_date
                ? new Date(course.created_date).toLocaleDateString()
                : "TBA",
              icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "End Date",
              value: course.updated_date
                ? new Date(course.updated_date).toLocaleDateString()
                : "TBA",
              icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Class Schedule",
              value: (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {durationLabel}
                  </span>
                </div>
              ),
              icon: null,
            },
          ].map((item, i) => (
            <div
              key={i}
              className={`flex items-center justify-between gap-2 py-2 ${i !== 0 ? "border-t border-border" : ""
                }`}
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                {item.icon}
                <span className="text-sm">{item.label}</span>
              </div>

              <div className="text-right text-sm font-medium text-foreground">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COURSE INCLUDES */}
      <div className="rounded-xl border border-border bg-card shadow-sm p-4 sm:p-5">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          This course includes
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
    </div>
  );
}