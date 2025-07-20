import React from 'react'
import { X, Edit, Trash2, Building2 } from 'lucide-react'
import { Organisation as OrganisationDto } from '@/services/api/schema'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import OrganizationDetails from './OrganizationDetails'

interface OrganizationMobileModalProps {
    organization: OrganisationDto | null
    isOpen: boolean
    onClose: () => void
    onApprove: (organization: OrganisationDto) => void
    onReject: (organization: OrganisationDto) => void
    getStatusBadgeComponent: (organizationId: string) => React.ReactElement
}

export default function OrganizationMobileModal({
    organization,
    isOpen,
    onClose,
    onApprove,
    onReject,
    getStatusBadgeComponent,
}: OrganizationMobileModalProps) {
    if (!organization) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Organization Details
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    <OrganizationDetails
                        organization={organization}
                        getStatusBadgeComponent={getStatusBadgeComponent}
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                    <Button
                        onClick={() => {
                            onApprove(organization)
                            onClose()
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Edit className="h-4 w-4 mr-2" />
                        Approve
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            onReject(organization)
                            onClose()
                        }}
                        className="flex-1"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Reject
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
} 