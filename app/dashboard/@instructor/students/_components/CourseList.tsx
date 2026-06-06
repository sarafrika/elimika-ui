import { InstructorClassWithDetails } from "../../../../../hooks/use-instructor-classes";
import { Course } from "../types";

interface CourseListProps {
  courses: Course[];
  classes: InstructorClassWithDetails[]
}

export function CourseList({ classes }: CourseListProps) {

  return (
    <div className="space-y-1">
      {classes.map((item) => (
        <div
          key={item.uuid}
          className="flex items-center justify-between py-2 px-2 rounded-sm hover:bg-muted transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {item.course?.thumbnail_url ? (
              <img
                src={item.course.thumbnail_url}
                alt={item.course?.name ?? "Course thumbnail"}
                className="w-6 h-6 rounded shrink-0 object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded shrink-0 bg-muted-foreground/40 flex items-center justify-center text-[10px] font-semibold uppercase">
                {item.title?.slice(0, 2)}
              </div>
            )}

            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                {item.title}
              </span>

              <span className="text-xs text-muted-foreground truncate group-hover:text-primary transition-colors">
                {item?.course?.name}
              </span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground shrink-0 ml-2">
            {Array.from(
              new Set(item?.enrollment?.map((e: any) => e.student_uuid).filter(Boolean))
            ).length}{" "}
            Students
          </span>
        </div>
      ))}
    </div>
  );
}
