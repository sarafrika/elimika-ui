import React from 'react'
import { Edit, Trash2, User } from 'lucide-react'
import { Instructor } from '@/services/api/schema'
import { Button } from '@/components/ui/button'
import InstructorDetails from './InstructorDetails'

interface InstructorDetailsPanelProps {
    instructor: Instructor | null
    onApprove: (instructor: Instructor) => void
    onReject: (instructor: Instructor) => void
    getStatusBadgeComponent: (instructorId: string) => React.ReactElement
}

export default function InstructorDetailsPanel({
    instructor,
    onApprove,
    onReject,
    getStatusBadgeComponent,
}: InstructorDetailsPanelProps) {
    if (!instructor) {
        return (
            <div className="hidden lg:flex flex-1 flex-col">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h2 className="text-lg font-medium mb-2">No Instructor Selected</h2>
                        <p className="text-muted-foreground">Select an instructor from the list to view details</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="hidden lg:flex flex-1 flex-col">
            {/* Header */}
            <div className="p-6 border-b bg-background">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Instructor Details</h1>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <InstructorDetails
                    instructor={instructor}
                    getStatusBadgeComponent={getStatusBadgeComponent}
                />
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t bg-background">
                <div className="flex gap-3">
                    <Button
                        onClick={() => onApprove(instructor)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Edit className="h-4 w-4 mr-2" />
                        Approve
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => onReject(instructor)}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Reject
                    </Button>
                </div>
            </div>
        </div>
    )
} 