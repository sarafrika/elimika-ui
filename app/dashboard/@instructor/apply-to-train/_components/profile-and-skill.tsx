import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Building, Upload, User, X } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface ProfileAndSkillsProps {
    data: any;
    onDataChange: (data: any) => void;
}

export function ProfileAndSkills({ data, onDataChange }: ProfileAndSkillsProps) {
    const [profileType, setProfileType] = useState(data?.profileType || 'instructor');
    const [skills, setSkills] = useState<string[]>(data?.skills || []);
    const [certifications, setCertifications] = useState<string[]>(data?.certifications || []);

    const handleProfileTypeChange = (type: string) => {
        setProfileType(type);
        onDataChange({ ...data, profileType: type });
    };

    const addSkill = (skill: string) => {
        if (skill && !skills.includes(skill)) {
            const newSkills = [...skills, skill];
            setSkills(newSkills);
            onDataChange({ ...data, skills: newSkills });
        }
    };

    const removeSkill = (skill: string) => {
        const newSkills = skills.filter(s => s !== skill);
        setSkills(newSkills);
        onDataChange({ ...data, skills: newSkills });
    };

    const addCertification = (cert: string) => {
        if (cert && !certifications.includes(cert)) {
            const newCerts = [...certifications, cert];
            setCertifications(newCerts);
            onDataChange({ ...data, certifications: newCerts });
        }
    };

    const removeCertification = (cert: string) => {
        const newCerts = certifications.filter(c => c !== cert);
        setCertifications(newCerts);
        onDataChange({ ...data, certifications: newCerts });
    };

    return (
        <div className="space-y-6">
            {/* Profile Type Selection */}
            <Card>
                <CardHeader>
                    <CardTitle>Application Type</CardTitle>
                </CardHeader>
                <CardContent>
                    <RadioGroup
                        value={profileType}
                        onValueChange={handleProfileTypeChange}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        <div className="flex items-center space-x-2 p-4 border rounded-lg">
                            <RadioGroupItem value="instructor" id="instructor" />
                            <Label htmlFor="instructor" className="flex items-center gap-3 cursor-pointer">
                                <User className="w-5 h-5" />
                                <div>
                                    <p className="font-medium">Individual Instructor</p>
                                    <p className="text-sm text-muted-foreground">Apply as an independent trainer</p>
                                </div>
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-4 border rounded-lg">
                            <RadioGroupItem value="organization" id="organization" />
                            <Label htmlFor="organization" className="flex items-center gap-3 cursor-pointer">
                                <Building className="w-5 h-5" />
                                <div>
                                    <p className="font-medium">Organization</p>
                                    <p className="text-sm text-muted-foreground">Apply on behalf of an organization</p>
                                </div>
                            </Label>
                        </div>
                    </RadioGroup>
                </CardContent>
            </Card>

            <Tabs value={profileType} className="space-y-6">
                <TabsContent value="instructor" className="space-y-6">
                    {/* Instructor Profile */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Instructor Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Profile Picture */}
                            <div className="flex items-center gap-6">
                                <Avatar className="w-24 h-24">
                                    <AvatarImage src={data?.profilePicture} />
                                    <AvatarFallback>
                                        <User className="w-12 h-12" />
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <Label>Profile Picture</Label>
                                    <div className="flex gap-2 mt-2">
                                        <Button variant="outline" size="sm">
                                            <Upload className="w-4 h-4 mr-2" />
                                            Upload Photo
                                        </Button>
                                        {data?.profilePicture && (
                                            <Button variant="outline" size="sm">Remove</Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Basic Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name *</Label>
                                    <Input
                                        id="fullName"
                                        placeholder="Enter your full name"
                                        value={data?.fullName || ''}
                                        onChange={(e) => onDataChange({ ...data, fullName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="your.email@example.com"
                                        value={data?.email || ''}
                                        onChange={(e) => onDataChange({ ...data, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        placeholder="+1 (555) 123-4567"
                                        value={data?.phone || ''}
                                        onChange={(e) => onDataChange({ ...data, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="experienceYears">Years of Teaching Experience</Label>
                                    <Select onValueChange={(value) => onDataChange({ ...data, experienceYears: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select experience level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0-1">0-1 years</SelectItem>
                                            <SelectItem value="1-3">1-3 years</SelectItem>
                                            <SelectItem value="3-5">3-5 years</SelectItem>
                                            <SelectItem value="5-10">5-10 years</SelectItem>
                                            <SelectItem value="10+">10+ years</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Education & Qualifications */}
                            <div className="space-y-2">
                                <Label htmlFor="education">Education & Qualifications</Label>
                                <Textarea
                                    id="education"
                                    placeholder="Describe your educational background, degrees, and relevant qualifications..."
                                    rows={4}
                                    value={data?.education || ''}
                                    onChange={(e) => onDataChange({ ...data, education: e.target.value })}
                                />
                            </div>

                            {/* Skills */}
                            <div className="space-y-3">
                                <Label>Technical Skills & Expertise</Label>
                                <div className="flex flex-wrap gap-2">
                                    {skills.map((skill) => (
                                        <Badge key={skill} variant="secondary">
                                            {skill}
                                            <button
                                                onClick={() => removeSkill(skill)}
                                                className="ml-2 hover:text-destructive"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                                <Input
                                    placeholder="Add a skill and press Enter"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            addSkill((e.target as HTMLInputElement).value);
                                            (e.target as HTMLInputElement).value = '';
                                        }
                                    }}
                                />
                            </div>

                            {/* Certifications */}
                            <div className="space-y-3">
                                <Label>Professional Certifications</Label>
                                <div className="flex flex-wrap gap-2">
                                    {certifications.map((cert) => (
                                        <Badge key={cert} variant="outline">
                                            {cert}
                                            <button
                                                onClick={() => removeCertification(cert)}
                                                className="ml-2 hover:text-destructive"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                                <Input
                                    placeholder="Add a certification and press Enter"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            addCertification((e.target as HTMLInputElement).value);
                                            (e.target as HTMLInputElement).value = '';
                                        }
                                    }}
                                />
                            </div>

                            {/* CV/Portfolio Upload */}
                            <div className="space-y-2">
                                <Label>CV / Portfolio</Label>
                                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                    <p className="text-sm mb-2">Upload your CV or portfolio</p>
                                    <p className="text-xs text-muted-foreground mb-4">PDF, DOC, or DOCX (max 10MB)</p>
                                    <Button variant="outline">
                                        Choose File
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="organization" className="space-y-6">
                    {/* Organization Profile */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Organization Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Organization Logo */}
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 border rounded-lg flex items-center justify-center bg-muted">
                                    {data?.organizationLogo ? (
                                        <Image src={data.organizationLogo} alt="Logo" width={24} height={24} className="w-full h-full object-cover rounded-lg" />
                                    ) : (
                                        <Building className="w-12 h-12 text-muted-foreground" />
                                    )}
                                </div>
                                <div>
                                    <Label>Organization Logo</Label>
                                    <div className="flex gap-2 mt-2">
                                        <Button variant="outline" size="sm">
                                            <Upload className="w-4 h-4 mr-2" />
                                            Upload Logo
                                        </Button>
                                        {data?.organizationLogo && (
                                            <Button variant="outline" size="sm">Remove</Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Organization Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="orgName">Organization Name *</Label>
                                    <Input
                                        id="orgName"
                                        placeholder="Enter organization name"
                                        value={data?.organizationName || ''}
                                        onChange={(e) => onDataChange({ ...data, organizationName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="orgType">Type of Organization</Label>
                                    <Select onValueChange={(value) => onDataChange({ ...data, organizationType: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select organization type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="school">School</SelectItem>
                                            <SelectItem value="university">University</SelectItem>
                                            <SelectItem value="ngo">NGO</SelectItem>
                                            <SelectItem value="private">Private Company</SelectItem>
                                            <SelectItem value="training">Training Institute</SelectItem>
                                            <SelectItem value="government">Government Agency</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="regNumber">Registration/Accreditation Number</Label>
                                    <Input
                                        id="regNumber"
                                        placeholder="Enter registration number"
                                        value={data?.registrationNumber || ''}
                                        onChange={(e) => onDataChange({ ...data, registrationNumber: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="orgEmail">Organization Email</Label>
                                    <Input
                                        id="orgEmail"
                                        type="email"
                                        placeholder="contact@organization.com"
                                        value={data?.organizationEmail || ''}
                                        onChange={(e) => onDataChange({ ...data, organizationEmail: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Contact Person */}
                            <div className="space-y-4">
                                <h4>Primary Contact Person</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="contactName">Contact Name *</Label>
                                        <Input
                                            id="contactName"
                                            placeholder="Full name of contact person"
                                            value={data?.contactName || ''}
                                            onChange={(e) => onDataChange({ ...data, contactName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contactRole">Role/Position</Label>
                                        <Input
                                            id="contactRole"
                                            placeholder="e.g., Director, Manager"
                                            value={data?.contactRole || ''}
                                            onChange={(e) => onDataChange({ ...data, contactRole: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contactEmail">Contact Email</Label>
                                        <Input
                                            id="contactEmail"
                                            type="email"
                                            placeholder="contact.person@organization.com"
                                            value={data?.contactEmail || ''}
                                            onChange={(e) => onDataChange({ ...data, contactEmail: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contactPhone">Contact Phone</Label>
                                        <Input
                                            id="contactPhone"
                                            placeholder="+1 (555) 123-4567"
                                            value={data?.contactPhone || ''}
                                            onChange={(e) => onDataChange({ ...data, contactPhone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Organization Description */}
                            <div className="space-y-2">
                                <Label htmlFor="orgDescription">Organization Description</Label>
                                <Textarea
                                    id="orgDescription"
                                    placeholder="Describe your organization, its mission, and relevant experience in training/education..."
                                    rows={4}
                                    value={data?.organizationDescription || ''}
                                    onChange={(e) => onDataChange({ ...data, organizationDescription: e.target.value })}
                                />
                            </div>

                            {/* Supporting Documents */}
                            <div className="space-y-2">
                                <Label>Supporting Documents</Label>
                                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                    <p className="text-sm mb-2">Upload registration certificates, accreditation documents</p>
                                    <p className="text-xs text-muted-foreground mb-4">PDF files (max 10MB each)</p>
                                    <Button variant="outline">
                                        Upload Documents
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}