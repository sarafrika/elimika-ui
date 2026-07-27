"use client";

import { Award, Calendar, ClipboardList, FileCheck, Users } from "lucide-react";
import { useInstructorAnalyticsData } from "./useInstructorAnalyticsData";

interface MetricCardProps {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
  iconBg: string;
}

function MetricCard({ label, value, change, positive, icon, iconBg }: MetricCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-3 sm:p-4 flex-1 min-w-[120px]">
      <div className="flex items-start gap-2">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground leading-tight truncate">{label}</p>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground leading-none mt-0.5">
            {value}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <span
              className={`text-xs font-semibold ${positive ? "text-success" : "text-destructive"}`}
            >
              {positive ? "▲" : "▼"} {change}
            </span>
            {/* <span className="text-xs text-muted-foreground truncate">vs Apr 1 – Apr 30</span> */}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DetailedMetrics() {
  const { metrics: metData } = useInstructorAnalyticsData();

  const metrics: MetricCardProps[] = [
    {
      label: "No. of Programs",
      value: String(metData.numberOfPrograms),
      change: "0",
      positive: true,
      iconBg: "bg-primary/10",
      icon: <Calendar className="w-4 h-4 text-primary" />,
    },
    {
      label: "No. of Instructors",
      value: String(metData.totalInstructors),
      change: "0",
      positive: true,
      iconBg: "bg-primary/10",
      icon: <Users className="w-4 h-4 text-primary" />,
    },
    {
      label: "Active Participants",
      value: String(metData.activeParticipants),
      change: "0%",
      positive: true,
      iconBg: "bg-success/10",
      icon: <Users className="w-4 h-4 text-success" />,
    },
    {
      label: "Assessments Conducted",
      value: String(metData.assessmentsConducted),
      change: "0%",
      positive: true,
      iconBg: "bg-warning/10",
      icon: <ClipboardList className="w-4 h-4 text-warning" />,
    },
    {
      label: "Certificates Issued",
      value: String(metData.certificatesIssues),
      change: "0%",
      positive: true,
      iconBg: "bg-accent/10",
      icon: <Award className="w-4 h-4 text-accent" />,
    },
    {
      label: "Surveys Completed",
      value: String(metData.surveysCompleted),
      change: "0%",
      positive: true,
      iconBg: "bg-success/10",
      icon: <FileCheck className="w-4 h-4 text-success" />,
    },
  ];

  return (
    <div className="">
      <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-3">Detailed Metrics</h3>
      <div className="flex flex-wrap gap-3">
        {metrics.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>
    </div>
  );
}