import React from 'react'
import { MoreVertical, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Organisation as OrganisationDto } from '@/services/api/schema'

interface OrganizationCardProps {
    organization: OrganisationDto
    isSelected: boolean
    onSelect: (organization: OrganisationDto) => void
    onDelete: (organization: OrganisationDto) => void
    getStatusBadgeComponent: (organizationId: string) => React.ReactElement
}

export default function OrganizationCard({
    organization,
    isSelected,
    onSelect,
    onDelete,
    getStatusBadgeComponent,
}: OrganizationCardProps) {
    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'Unknown'
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    return (
        <Card
            className={`m-2 p-4 cursor-pointer transition-colors hover:bg-accent/10 ${isSelected ? 'ring ring-primary bg-accent/10' : ''
                }`}
            onClick={() => onSelect(organization)}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="mb-2">
                            <h3 className="font-medium text-sm truncate mb-1">
                                {organization.name}
                            </h3>
                            <div className="flex items-center">
                                {organization.uuid && getStatusBadgeComponent(organization.uuid)}
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                            {organization.domain}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Code: {organization.code || 'N/A'}
                        </p>
                        {organization.created_date && <p className="text-xs text-muted-foreground">
                            Created: {formatDate(organization.created_date)}
                        </p>}
                    </div>
                </div>
                <div className="flex-shrink-0 ml-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation()
                                onDelete(organization)
                            }}>
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </Card>
    )
} 