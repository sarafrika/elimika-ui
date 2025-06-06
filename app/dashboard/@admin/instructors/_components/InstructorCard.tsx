import React from 'react'
import { Trash2 } from 'lucide-react'
import { Instructor } from '@/api-client/models/Instructor'
import { Badge } from '@/components/ui/badge'

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
            className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${isSelected ? 'bg-muted' : ''
                }`}
            onClick={() => onSelect(instructor)}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm truncate">
                            {instructor.full_name || 'N/A'}
                        </h3>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mb-1">
                        {instructor.professional_headline || 'Professional'}
                    </p>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {getStatusBadgeComponent(instructor.uuid!)}
                            <span className="text-xs text-muted-foreground">
                                {instructor.created_date ? new Date(instructor.created_date).toLocaleDateString() : 'N/A'}
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