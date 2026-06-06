import { FileText, User } from "lucide-react";

import { RecentActivity } from "../types";

const ActivityIcon = ({ type }: { type: RecentActivity["type"] }) => {
  if (type === "completion" || type === "join") {
    return (
      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <User className="h-3.5 w-3.5 text-primary" />
      </div>
    );
  }

  return (
    <div className="w-7 h-7 rounded-full bg-primary/5 flex items-center justify-center shrink-0">
      <FileText className="h-3.5 w-3.5 text-primary" />
    </div>
  );
};

interface RecentActivityListProps {
  activities: RecentActivity[];
}

export function RecentActivityList({
  activities,
}: RecentActivityListProps) {
  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-2.5">
          <ActivityIcon type={activity.type} />

          <div className="min-w-0">
            <p className="text-sm text-foreground leading-tight">
              <span className="font-semibold">{activity.student}</span>{" "}
              {activity.action}
              {activity.course && (
                <>
                  {" "}
                  <span className="font-medium text-primary">
                    {activity.course}
                  </span>
                </>
              )}
            </p>

            <p className="text-xs text-muted-foreground mt-0.5">
              {activity.time}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}