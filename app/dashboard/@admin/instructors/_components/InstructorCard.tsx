import React from "react"
import { Trash2 } from "lucide-react"
import { Instructor } from "@/services/api/schema"

interface InstructorCardProps {
  instructor: Instructor
  isSelected: boolean
  onSelect: (instructor: Instructor) => void
  onDelete: (instructor: Instructor) => void
  getStatusBadgeComponent: (instructorId: string) => React.ReactElement
}

export default function InstructorCard({
  instructor,
  isSelected,
  onSelect,
  onDelete,
  getStatusBadgeComponent,
}: InstructorCardProps) {
  return (
    <div
      className={`hover:bg-muted/50 cursor-pointer border-b p-4 transition-colors ${isSelected ? "bg-muted" : ""}`}
      onClick={() => onSelect(instructor)}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="truncate text-sm font-medium">{instructor.full_name || "N/A"}</h3>
          </div>
          <p className="text-muted-foreground mb-1 truncate text-xs">
            {instructor.professional_headline || "Professional"}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusBadgeComponent(instructor.uuid!)}
              <span className="text-muted-foreground text-xs">
                {instructor.created_date ? new Date(instructor.created_date).toLocaleDateString() : "N/A"}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(instructor)
              }}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
