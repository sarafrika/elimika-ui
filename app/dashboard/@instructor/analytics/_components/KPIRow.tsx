"use client";

import { Calendar, CheckCircle, Users, Clock } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string;
  sub?: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
  iconBg: string;
}

function KPICard({ label, value, sub, change, positive, icon, iconBg }: KPICardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4 flex-1 min-w-[140px]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-gray-500 leading-tight">{label}</p>
          <div className="flex items-baseline gap-1 mt-1 flex-wrap">
            <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-none">
              {value}
            </span>
            {sub && (
              <span className="text-sm sm:text-base text-gray-500 font-medium">{sub}</span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-1.5">
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
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export function KPIRow() {
  const kpis: KPICardProps[] = [
    {
      label: "Total Sessions",
      value: "48",
      change: "12%",
      positive: true,
      iconBg: "bg-blue-50",
      icon: <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />,
    },
    {
      label: "Sessions Completed",
      value: "32",
      sub: "(67%)",
      change: "8%",
      positive: true,
      iconBg: "bg-green-50",
      icon: <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />,
    },
    {
      label: "Participants Trained",
      value: "612",
      change: "15%",
      positive: true,
      iconBg: "bg-orange-50",
      icon: <Users className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />,
    },
    {
      label: "Completion Rate",
      value: "84%",
      change: "6%",
      positive: true,
      iconBg: "bg-purple-50",
      icon: (
        <svg viewBox="0 0 36 36" className="w-4 h-4 sm:w-5 sm:h-5">
          <circle cx="18" cy="18" r="15" fill="none" stroke="#e9d5ff" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke="#a855f7"
            strokeWidth="3"
            strokeDasharray="79 20"
            strokeLinecap="round"
            transform="rotate(-90 18 18)"
          />
        </svg>
      ),
    },
    {
      label: "Average Satisfaction",
      value: "4.6",
      sub: "/5",
      change: "0.3",
      positive: true,
      iconBg: "bg-red-50",
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 fill-none stroke-red-400 stroke-2">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ),
    },
    {
      label: "Training Hours Delivered",
      value: "1,248",
      change: "18%",
      positive: true,
      iconBg: "bg-gray-100",
      icon: <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />,
    },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {kpis.map((kpi) => (
        <KPICard key={kpi.label} {...kpi} />
      ))}
    </div>
  );
}
