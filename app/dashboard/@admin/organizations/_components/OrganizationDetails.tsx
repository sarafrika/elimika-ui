import React from 'react'
import { Building2, Globe, Calendar, Hash, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { OrganisationDto } from '@/services/api/schema'

interface OrganizationDetailsProps {
    organization: OrganisationDto
    getStatusBadgeComponent: (organizationId: string) => React.ReactElement
}

export default function OrganizationDetails({
    organization,
    getStatusBadgeComponent,
}: OrganizationDetailsProps) {
    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'Unknown'
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="space-y-6">
            {/* Header with Organization Name and Status */}
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-blue-600" />
                    </div>
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold">{organization.name}</h2>
                        {organization.uuid && getStatusBadgeComponent(organization.uuid)}
                    </div>
                    <p className="text-muted-foreground">{organization.description || 'No description provided'}</p>
                </div>
            </div>

            <Separator />

            {/* Basic Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Basic Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Domain</p>
                                <p className="text-sm text-muted-foreground">{organization.domain}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Hash className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Code</p>
                                <p className="text-sm text-muted-foreground">{organization.code || 'Not provided'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Slug</p>
                                <p className="text-sm text-muted-foreground">{organization.slug || 'Not generated'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={`h-3 w-3 rounded-full ${organization.active ? 'bg-green-500' : 'bg-red-500'}`} />
                            <div>
                                <p className="text-sm font-medium">Status</p>
                                <p className="text-sm text-muted-foreground">{organization.active ? 'Active' : 'Inactive'}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Timestamps */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Timeline
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Created</p>
                                <p className="text-sm text-muted-foreground">{formatDate(organization.created_date)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Last Updated</p>
                                <p className="text-sm text-muted-foreground">{formatDate(organization.updated_date)}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* System Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Hash className="h-5 w-5" />
                        System Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-medium">UUID</p>
                            <p className="text-sm text-muted-foreground font-mono">{organization.uuid}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
} 