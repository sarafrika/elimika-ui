"use client";

import { ArrowRight, CheckCircle, GraduationCap, Users } from "lucide-react";
import { useState } from "react";

import { courses, recentActivities } from "../data";
import { CourseList } from "./CourseList";
import { OverviewStats } from "./OverviewStats";
import { RecentActivityList } from "./RecentActivityList";

const stats = [
  {
    value: 125,
    label: "Total Students",
    icon: <Users className="h-5 w-5" />,
  },
  {
    value: 78,
    label: "Enrolled",
    icon: <GraduationCap className="h-5 w-5" />,
    highlight: true,
  },
  {
    value: 32,
    label: "Graduated",
    icon: <CheckCircle className="h-5 w-5" />,
  },
];

export function OverviewSidebar() {
  const [showAllCourses, setShowAllCourses] = useState(false);

  return (
    <aside className="w-full xl:w-80 shrink-0 space-y-5">
      {/* Overview */}
      <section className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h2 className="text-base font-semibold text-foreground">
          Overview
        </h2>
        <OverviewStats stats={stats} />
      </section>

      {/* Courses You Teach */}
      <section className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            Courses You Teach
          </h2>

          <button
            onClick={() => setShowAllCourses(!showAllCourses)}
            className="text-xs font-medium text-primary cursor-pointer p-2 rounded-sm hover:bg-primary/5"
          >
            View all
          </button>
        </div>

        <CourseList courses={courses} />

        <button className="w-full flex items-center justify-between text-sm text-primary font-medium cursor-pointer p-2 rounded-sm hover:bg-primary/5">
          View all courses
          <ArrowRight className="h-4 w-4" />
        </button>
      </section>

      {/* Recent Activity */}
      <section className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            Recent Activity
          </h2>

          <button className="text-xs font-medium text-primary cursor-pointer p-2 rounded-sm hover:bg-primary/5">
            View all
          </button>
        </div>

        <RecentActivityList activities={recentActivities} />
      </section>
    </aside>
  );
}