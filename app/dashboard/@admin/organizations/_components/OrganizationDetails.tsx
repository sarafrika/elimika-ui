import React from 'react'
import { Building2, Globe, Hash, Phone, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Organisation as OrganisationDto } from '@/services/api/schema'

interface OrganizationDetailsProps {
    organization: OrganisationDto
    getStatusBadgeComponent: (organizationId: string) => React.ReactElement
}

export default function OrganizationDetails({
    organization,
    getStatusBadgeComponent,
}: OrganizationDetailsProps) {
    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'Not specified'
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    return (
        <div className="space-y-6">
            {/* Profile Header */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex flex-col space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <CardTitle className="text-2xl font-bold">{organization.name}</CardTitle>
                                <p className="text-muted-foreground text-lg">{organization.description || 'No description provided'}</p>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Globe className="h-4 w-4" />
                                    {organization.domain}
                                </p>
                            </div>
                            <div className="text-right space-y-2">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Organization ID:</p>
                                    <p className="text-sm font-mono">{organization.uuid?.slice(0, 8) || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Status:</p>
                                    {organization.uuid && getStatusBadgeComponent(organization.uuid)}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Domain:</p>
                                <p className="text-sm">{organization.domain}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Code:</p>
                                <p className="text-sm">{organization.code || 'Not provided'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Active Status:</p>
                                <p className="text-sm">{organization.active ? 'Active' : 'Inactive'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Slug:</p>
                                <p className="text-sm">{organization.name || 'Not generated'}</p>
                            </div>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Organization Information */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Organization Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Organization Name</p>
                                <p className="text-sm">{organization.name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Organization Code</p>
                                <p className="text-sm">{organization.code || 'Not specified'}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Domain</p>
                                <p className="text-sm">{organization.domain}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">URL Slug</p>
                                <p className="text-sm">{organization.name || 'Not generated'}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Active Status</p>
                                <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${organization.active ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <p className="text-sm">{organization.active ? 'Active' : 'Inactive'}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Type</p>
                                <p className="text-sm">Training Organization</p>
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Description</p>
                            <p className="text-sm">{organization.description || 'No description provided'}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Phone className="h-5 w-5" />
                            Contact Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                                <p className="text-sm">Not provided</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                                <p className="text-sm">Not provided</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Website</p>
                                <p className="text-sm">Not provided</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Fax Number</p>
                                <p className="text-sm">Not provided</p>
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Physical Address</p>
                            <p className="text-sm">Address not provided</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Postal Address</p>
                            <p className="text-sm">Postal address not provided</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
} 