import React from "react";
import { Course } from "../types";

interface CourseListProps {
  courses: Course[];
}

export function CourseList({ courses }: CourseListProps) {
  return (
    <div className="space-y-1">
      {courses.map((course) => (
        <div
          key={course.id}
          className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-muted transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${course.bgColor} ${course.color}`}
            >
              {course.code}
            </span>
            <span className="text-sm text-foreground truncate group-hover:text-primary transition-colors">
              {course.name}
            </span>
          </div>
          <span className="text-xs text-muted-foreground shrink-0 ml-2">
            {course.students} Students
          </span>
        </div>
      ))}
    </div>
  );
}
