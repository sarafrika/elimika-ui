import React from 'react'
import { Phone, Mail, MapPin, Building2, User } from 'lucide-react'
import { Instructor } from '@/api-client/models/Instructor'
import { Badge } from '@/components/ui/badge'

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
        <div className={`space-y-8 ${className}`}>
            {/* Basic Info */}
            <div>
                <h2 className="text-xl font-semibold mb-2">{instructor.full_name || 'N/A'}</h2>
                <p className="text-muted-foreground mb-1">{instructor.professional_headline || 'Professional'}</p>
                <p className="text-sm text-muted-foreground">{instructor.formattedLocation || 'Location not specified'}</p>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-3">Contact Information</h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>Phone not available</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>Email not available</span>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-3">Status Information</h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {getStatusBadgeComponent(instructor.uuid!)}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>Profile Complete: {instructor.profileComplete ? 'Yes' : 'No'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Address */}
            <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-3">Address</h3>
                <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{instructor.formattedLocation || 'Address not specified'}</span>
                </div>
            </div>

            {/* Professional Details */}
            <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-3">Professional Details</h3>
                <div className="space-y-3">
                    <div>
                        <p className="font-medium text-sm">Website</p>
                        <p className="text-sm text-muted-foreground">{instructor.website || 'Not specified'}</p>
                    </div>
                    <div>
                        <p className="font-medium text-sm">Total Credentials</p>
                        <p className="text-sm text-muted-foreground">{instructor.totalProfessionalCredentials || 0} credentials</p>
                    </div>
                </div>
            </div>

            {/* Biography */}
            {instructor.bio && (
                <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-3">Biography</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {instructor.bio}
                    </p>
                </div>
            )}

            {/* Professional Bodies */}
            {instructor.professional_bodies && instructor.professional_bodies.length > 0 && (
                <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-3">Professional Bodies</h3>
                    <div className="flex flex-wrap gap-2">
                        {instructor.professional_bodies.map((body, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                                {body.body_name || 'N/A'}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* Certifications */}
            {instructor.certifications && instructor.certifications.length > 0 && (
                <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-3">Certifications</h3>
                    <div className="space-y-3">
                        {instructor.certifications.map((cert, index) => (
                            <div key={index} className="border rounded-lg p-3">
                                <p className="font-medium text-sm">Certificate</p>
                                <p className="text-xs text-muted-foreground">Issued by: {cert.issued_by || 'N/A'}</p>
                                <p className="text-xs text-muted-foreground">
                                    Issued: {cert.issued_date ? new Date(cert.issued_date).toLocaleDateString() : 'N/A'}
                                </p>
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
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Training Experiences */}
            {instructor.training_experiences && instructor.training_experiences.length > 0 && (
                <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-3">Training Experience</h3>
                    <div className="space-y-3">
                        {instructor.training_experiences.map((exp, index) => (
                            <div key={index} className="border rounded-lg p-3">
                                <p className="font-medium text-sm">{exp.job_title || 'N/A'}</p>
                                <p className="text-sm text-muted-foreground font-medium">{exp.organisation_name || 'N/A'}</p>
                                <p className="text-xs text-muted-foreground mt-1">{exp.work_description || 'N/A'}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {exp.start_date ? new Date(exp.start_date).toLocaleDateString() : 'N/A'} - {exp.end_date ? new Date(exp.end_date).toLocaleDateString() : 'Present'}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
} 