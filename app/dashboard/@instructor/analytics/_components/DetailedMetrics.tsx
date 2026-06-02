"use client";

import { Calendar, Users, Award, ClipboardList, FileCheck, BarChart2 } from "lucide-react";

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
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4 flex-1 min-w-[120px]">
      <div className="flex items-start gap-2">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 leading-tight truncate">{label}</p>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 leading-none mt-0.5">
            {value}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <span
              className={`text-xs font-semibold ${
                positive ? "text-green-500" : "text-red-500"
              }`}
            >
              {positive ? "▲" : "▼"} {change}
            </span>
            <span className="text-xs text-gray-400 truncate">vs Apr 1 – Apr 30</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DetailedMetrics() {
  const metrics: MetricCardProps[] = [
    {
      label: "No. of Programs",
      value: "8",
      change: "2",
      positive: true,
      iconBg: "bg-blue-50",
      icon: <Calendar className="w-4 h-4 text-blue-500" />,
    },
    {
      label: "No. of Instructors",
      value: "14",
      change: "1",
      positive: true,
      iconBg: "bg-blue-50",
      icon: <Users className="w-4 h-4 text-blue-400" />,
    },
    {
      label: "Active Participants",
      value: "512",
      change: "13%",
      positive: true,
      iconBg: "bg-green-50",
      icon: <Users className="w-4 h-4 text-green-500" />,
    },
    {
      label: "Assessments Conducted",
      value: "36",
      change: "20%",
      positive: true,
      iconBg: "bg-amber-50",
      icon: <ClipboardList className="w-4 h-4 text-amber-500" />,
    },
    {
      label: "Certificates Issued",
      value: "132",
      change: "18%",
      positive: true,
      iconBg: "bg-purple-50",
      icon: <Award className="w-4 h-4 text-purple-500" />,
    },
    {
      label: "Surveys Completed",
      value: "76",
      change: "10%",
      positive: true,
      iconBg: "bg-teal-50",
      icon: <FileCheck className="w-4 h-4 text-teal-500" />,
    },
  ];

  return (
    <div className="bg-gray-50 rounded-xl p-0">
      <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-3">Detailed Metrics</h3>
      <div className="flex flex-wrap gap-3">
        {metrics.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>
    </div>
  );
}
