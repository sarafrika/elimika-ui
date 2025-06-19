import React from 'react'
import { MapPin, User, Globe, Award, Briefcase, GraduationCap } from 'lucide-react'
import { Instructor } from '@/services/api/schema'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface InstructorDetailsProps {
    instructor: Instructor
    getStatusBadgeComponent: (instructorId: string) => React.ReactElement
    className?: string
}

export default function InstructorDetails({
    instructor,
    getStatusBadgeComponent,
    className = ""
}: InstructorDetailsProps) {
    return (
        <div className={`space-y-6 ${className}`}>
            {/* Profile Header */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex flex-col space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <CardTitle className="text-2xl font-bold">{instructor.full_name || 'N/A'}</CardTitle>
                                <p className="text-muted-foreground text-lg">{instructor.professional_headline || 'Professional'}</p>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    {instructor.formattedLocation || 'Location not specified'}
                                </p>
                            </div>
                            <div className="text-right space-y-2">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Instructor ID:</p>
                                    <p className="text-sm font-mono">{instructor.uuid?.slice(0, 8) || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Status:</p>
                                    {getStatusBadgeComponent(instructor.uuid!)}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Phone:</p>
                                <p className="text-sm">Not available</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Email:</p>
                                <p className="text-sm">Not available</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Profile Complete:</p>
                                <p className="text-sm">{instructor.profileComplete ? 'Yes' : 'No'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Credentials:</p>
                                <p className="text-sm">{instructor.totalProfessionalCredentials || 0}</p>
                            </div>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Information */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Personal Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Gender</p>
                                <p className="text-sm">Not specified</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Date of birth</p>
                                <p className="text-sm">Not specified</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Nationality</p>
                                <p className="text-sm">Not specified</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Religion</p>
                                <p className="text-sm">Not specified</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Languages</p>
                                <p className="text-sm">Not specified</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Marital status</p>
                                <p className="text-sm">Not specified</p>
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Permanent address</p>
                            <p className="text-sm">{instructor.formattedLocation || 'Address not specified'}</p>
                        </div>
                        {instructor.website && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Website</p>
                                <a
                                    href={instructor.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                >
                                    <Globe className="h-3 w-3" />
                                    {instructor.website}
                                </a>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Education Information */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <GraduationCap className="h-5 w-5" />
                            Education Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {instructor.certifications && instructor.certifications.length > 0 ? (
                            instructor.certifications.map((cert, index) => (
                                <div key={index} className="space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">Certificate</p>
                                            <p className="text-sm text-muted-foreground">{cert.issued_by || 'Institution not specified'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium">
                                                {cert.issued_date ? new Date(cert.issued_date).getFullYear() : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    {cert.certificate_url && (
                                        <a
                                            href={cert.certificate_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 hover:underline"
                                        >
                                            View Certificate
                                        </a>
                                    )}
                                    {index < instructor.certifications!.length - 1 && <Separator />}
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">No education information available</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Professional Bodies */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Professional Bodies
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {instructor.professional_bodies && instructor.professional_bodies.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {instructor.professional_bodies.map((body, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                    {body.body_name || 'N/A'}
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No professional bodies information provided</p>
                    )}
                </CardContent>
            </Card>

            {/* Training Experience */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        Training Experience
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {instructor.training_experiences && instructor.training_experiences.length > 0 ? (
                        instructor.training_experiences.map((exp, index) => (
                            <div key={index} className="space-y-2">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{exp.job_title || 'Position not specified'}</p>
                                        <p className="text-sm text-muted-foreground font-medium">{exp.organisation_name || 'Organization not specified'}</p>
                                        {exp.work_description && (
                                            <p className="text-sm text-muted-foreground mt-1">{exp.work_description}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium">
                                            {exp.start_date ? new Date(exp.start_date).getFullYear() : 'N/A'} - {exp.end_date ? new Date(exp.end_date).getFullYear() : 'Present'}
                                        </p>
                                    </div>
                                </div>
                                {index < instructor.training_experiences!.length - 1 && <Separator />}
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">No training experience information provided</p>
                    )}
                </CardContent>
            </Card>

            {/* Biography */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-lg font-semibold">Biography</CardTitle>
                </CardHeader>
                <CardContent>
                    {instructor.bio ? (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {instructor.bio}
                        </p>
                    ) : (
                        <p className="text-sm text-muted-foreground">No biography information provided</p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
} 