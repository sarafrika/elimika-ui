import React from 'react'
import { Edit, Trash2, Building2 } from 'lucide-react'
import { OrganisationDto } from '@/services/api/schema'
import { Button } from '@/components/ui/button'
import OrganizationDetails from './OrganizationDetails'

interface OrganizationDetailsPanelProps {
    organization: OrganisationDto | null
    onApprove: (organization: OrganisationDto) => void
    onReject: (organization: OrganisationDto) => void
    getStatusBadgeComponent: (organizationId: string) => React.ReactElement
}

export default function OrganizationDetailsPanel({
    organization,
    onApprove,
    onReject,
    getStatusBadgeComponent,
}: OrganizationDetailsPanelProps) {
    if (!organization) {
        return (
            <div className="hidden lg:flex flex-1 flex-col">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h2 className="text-lg font-medium mb-2">No Organization Selected</h2>
                        <p className="text-muted-foreground">Select an organization from the list to view details</p>
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
                    <h1 className="text-2xl font-semibold">Organization Details</h1>
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
                <div className="max-w-2xl">
                    <OrganizationDetails
                        organization={organization}
                        getStatusBadgeComponent={getStatusBadgeComponent}
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t bg-background">
                <div className="flex gap-3">
                    <Button
                        onClick={() => onApprove(organization)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Edit className="h-4 w-4 mr-2" />
                        Approve
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => onReject(organization)}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Reject
                    </Button>
                </div>
            </div>
        </div>
    )
} 