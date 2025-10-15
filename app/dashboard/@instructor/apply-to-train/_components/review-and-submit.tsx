import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    AlertTriangle,
    BookOpen,
    Building,
    Calendar,
    CheckCircle,
    Eye,
    Info,
    Monitor,
    Save,
    Send,
    Shield,
    User
} from 'lucide-react';
import { useState } from 'react';
import RichTextRenderer from '../../../../../components/editors/richTextRenders';
import { useDifficultyLevels } from '../../../../../hooks/use-difficultyLevels';
import { getTotalExperienceYears } from './apply-to-train';

interface ReviewAndSubmitProps {
    data: any;
    profile: any;
    selectedCourse: any;
}

export function ReviewAndSubmit({ data, profile, selectedCourse }: ReviewAndSubmitProps) {
    const { difficultyMap } = useDifficultyLevels()
    const totalExperienceYears = getTotalExperienceYears(data?.experience || []);

    const [finalConfirmations, setFinalConfirmations] = useState<string[]>(data?.finalConfirmations || []);
    const [showPreview, setShowPreview] = useState(false);

    const handleConfirmationChange = (confirmationId: string, checked: boolean) => {
        const updated = checked
            ? [...finalConfirmations, confirmationId]
            : finalConfirmations.filter(id => id !== confirmationId);

        setFinalConfirmations(updated);
        // console.log(finalConfirmations, "final comfirmations")
    };

    const getCompletionStatus = () => {
        const requiredFields = [
            data?.full_name || data?.organizationName,
            profile?.email || data?.organizationEmail,
            selectedCourse,
            data?.trainingMode,
            finalConfirmations.includes('accuracy'),
            finalConfirmations.includes('terms')
        ];

        const completed = requiredFields.filter(Boolean).length;
        const total = requiredFields.length;

        return { completed, total, percentage: Math.round((completed / total) * 100) };
    };

    const status = getCompletionStatus();
    const isReadyToSubmit = status.percentage === 100;

    const formatDate = (dateArray: Date[]) => {
        if (!dateArray || dateArray.length === 0) return 'Not specified';
        return dateArray.map(date => new Date(date).toLocaleDateString()).join(', ');
    };

    return (
        <div className="space-y-6">
            {/* Application Status */}
            <Card className={isReadyToSubmit ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                        {isReadyToSubmit ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                            <AlertTriangle className="w-6 h-6 text-yellow-600" />
                        )}
                        <div>
                            <h4 className={isReadyToSubmit ? 'text-green-800' : 'text-yellow-800'}>
                                Application {isReadyToSubmit ? 'Ready for Submission' : 'Incomplete'}
                            </h4>
                            <p className={`text-sm ${isReadyToSubmit ? 'text-green-600' : 'text-yellow-600'}`}>
                                {status.completed} of {status.total} required sections completed ({status.percentage}%)
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Application Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Application Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Applicant Information */}
                    <div>
                        <h4 className="flex items-center gap-2 mb-3">
                            {profile.user_domain?.includes('organisation') ? (
                                <Building className="w-4 h-4" />
                            ) : (
                                <User className="w-4 h-4" />
                            )}
                            Applicant Information
                        </h4>
                        <div className="bg-muted/20 p-4 rounded-lg">
                            {profile.user_domain?.includes('organisation') ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 border rounded-lg flex items-center justify-center bg-background">
                                            <Building className="w-6 h-6 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <h4>{data?.organizationName || 'Organization Name'}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {data?.organizationType || 'Organization Type'} • {data?.contactName || 'Contact Name'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Email:</span>
                                            <p>{data?.organizationEmail || 'Not provided'}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Registration:</span>
                                            <p>{data?.registrationNumber || 'Not provided'}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="w-12 h-12">
                                            <AvatarImage src={profile?.profile_image_url} />
                                            <AvatarFallback>
                                                <User className="w-6 h-6" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h4>{data?.full_name || 'Full Name'}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {totalExperienceYears || "0"} years experience
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Email:</span>
                                            <p>{profile?.email || 'Not provided'}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Phone:</span>
                                            <p>{profile?.phone_number || 'Not provided'}</p>
                                        </div>
                                    </div>

                                    {data?.skills && data.skills.length > 0 && (
                                        <div className="mt-3">
                                            <span className="text-muted-foreground text-sm">Skills:</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {data.skills.slice(0, 5).map((skill: string) => (
                                                    <Badge key={skill} variant="outline" className="text-xs">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                                {data.skills.length > 5 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{data.skills.length - 5} more
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Course Information */}
                    <div>
                        <h4 className="flex items-center gap-2 mb-3">
                            <BookOpen className="w-4 h-4" />
                            Course Proposal
                        </h4>
                        <div className="bg-muted/20 p-4 rounded-lg">
                            {selectedCourse ? (
                                <div>
                                    <h4>{selectedCourse.name}</h4>

                                    <div className="text-sm text-muted-foreground mb-2">
                                        <RichTextRenderer htmlString={selectedCourse.description} maxChars={150} /> </div>

                                    <div className="flex gap-2 flex-wrap">
                                        <div>
                                            {selectedCourse.category_names.map((category: string, index: number) => (
                                                <Badge key={index} variant="outline" className="text-xs mr-1">
                                                    {category}
                                                </Badge>
                                            ))}
                                        </div>
                                        <div>
                                            {difficultyMap && selectedCourse.difficulty_uuid && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {difficultyMap[selectedCourse.difficulty_uuid]}
                                                </Badge>
                                            )}
                                        </div>

                                    </div>
                                    {/* {targetAudience && targetAudience.length > 0 && (
                                        <div className="mt-3">
                                            <span className="text-sm text-muted-foreground">Target Audience:</span>
                                            <p className="text-sm">{targetAudience.join(', ')}</p>
                                        </div>
                                    )} */}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No course selected</p>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Training Details */}
                    <div className='bg-red-100'>
                        <h4 className="flex items-center gap-2 mb-3">
                            <Calendar className="w-4 h-4" />
                            Training Schedule & Delivery
                        </h4>
                        <div className="bg-muted/20 p-4 rounded-lg space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Training Mode:</span>
                                    <p className="capitalize">{data?.trainingMode || 'Not specified'}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Class Size:</span>
                                    <p>
                                        {data?.minStudents && data?.maxStudents
                                            ? `${data.minStudents}-${data.maxStudents} students`
                                            : 'Not specified'
                                        }
                                    </p>
                                </div>
                                {(data?.trainingMode === 'in-person' || data?.trainingMode === 'hybrid') && (
                                    <div>
                                        <span className="text-muted-foreground">Location:</span>
                                        <p>
                                            {data?.trainingCity && data?.trainingCountry
                                                ? `${data.trainingCity}, ${data.trainingCountry}`
                                                : 'Not specified'
                                            }
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <span className="text-muted-foreground">Lead Time:</span>
                                    <p>{data?.minLeadTime || 'Not specified'}</p>
                                </div>
                            </div>
                            {data?.availableDates && data.availableDates.length > 0 && (
                                <div>
                                    <span className="text-sm text-muted-foreground">Available Dates:</span>
                                    <p className="text-sm">{formatDate(data.availableDates)}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Resources Summary */}
                    <div className='bg-red-100'>
                        <h4 className="flex items-center gap-2 mb-3">
                            <Monitor className="w-4 h-4" />
                            Resources & Support
                        </h4>
                        <div className="bg-muted/20 p-4 rounded-lg space-y-2 text-sm">
                            {data?.selectedEquipment && data.selectedEquipment.length > 0 && (
                                <div>
                                    <span className="text-muted-foreground">Equipment Required:</span>
                                    <p>{data.selectedEquipment.length} items selected</p>
                                </div>
                            )}
                            {data?.selectedSoftware && data.selectedSoftware.length > 0 && (
                                <div>
                                    <span className="text-muted-foreground">Software Platforms:</span>
                                    <p>{data.selectedSoftware.map((s: any) => s.name).join(', ')}</p>
                                </div>
                            )}
                            {data?.supportNeeded && data.supportNeeded.length > 0 && (
                                <div>
                                    <span className="text-muted-foreground">Support Needed:</span>
                                    <p className="capitalize">{data.supportNeeded.join(', ')}</p>
                                </div>
                            )}
                            {data?.costEstimate && (
                                <div>
                                    <span className="text-muted-foreground">Estimated Cost:</span>
                                    <p className="capitalize">{data.costEstimate}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Compliance Status */}
                    <div className='bg-red-100'>
                        <h4 className="flex items-center gap-2 mb-3">
                            <Shield className="w-4 h-4" />
                            Compliance Status
                        </h4>
                        <div className="bg-muted/20 p-4 rounded-lg">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Documents Uploaded:</span>
                                    <p>
                                        {data?.uploadedDocs
                                            ? Object.values(data.uploadedDocs).flat().length
                                            : 0
                                        } files
                                    </p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Compliance Agreements:</span>
                                    <p>
                                        {data?.complianceAgreements?.length || 0} of 4 completed
                                    </p>
                                </div>
                            </div>
                            {data?.gdprCompliant && (
                                <div className="mt-2 flex items-center gap-2 text-sm">
                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                    <span>GDPR Compliant</span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Preview Toggle */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        Application Preview
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPreview(!showPreview)}
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            {showPreview ? 'Hide' : 'Show'} Preview
                        </Button>
                    </CardTitle>
                </CardHeader>
                {showPreview && (
                    <CardContent>
                        <div className="border rounded-lg p-4 bg-background">
                            <div className="text-center mb-4">
                                <h3>Trainer Application</h3>
                                <p className="text-sm text-muted-foreground">
                                    Application ID: APP-{Date.now().toString().slice(-8).toUpperCase()}
                                </p>
                            </div>

                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between">
                                    <span>Course:</span>
                                    <span className="font-medium">{selectedCourse?.name || 'Not selected'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Applicant:</span>
                                    <span className="font-medium">
                                        {data?.full_name || data?.organizationName || 'Not provided'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Training Mode:</span>
                                    <span className="font-medium capitalize">{data?.trainingMode || 'Not specified'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Status:</span>
                                    <Badge variant={isReadyToSubmit ? 'default' : 'secondary'}>
                                        {isReadyToSubmit ? 'Ready for Review' : 'Draft'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Final Confirmations */}
            <Card>
                <CardHeader>
                    <CardTitle>Final Confirmations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[
                        {
                            id: 'accuracy',
                            text: 'I confirm that all information provided in this application is accurate and complete.',
                            required: true
                        },
                        {
                            id: 'terms',
                            text: 'I accept the license terms of use and conditions for training delivery.',
                            required: true
                        },
                        {
                            id: 'updates',
                            text: 'I agree to notify of any changes to my qualifications or circumstances.',
                            required: false
                        },
                        {
                            id: 'communication',
                            text: 'I consent to receive communication regarding this application and future training opportunities.',
                            required: false
                        }
                    ].map((confirmation) => (
                        <div key={confirmation.id} className="flex items-start space-x-3">
                            <Checkbox
                                id={confirmation.id}
                                checked={finalConfirmations.includes(confirmation.id)}
                                onCheckedChange={(checked) => handleConfirmationChange(confirmation.id, checked as boolean)}
                                className="mt-1"
                            />
                            <Label htmlFor={confirmation.id} className="text-sm cursor-pointer leading-relaxed">
                                {confirmation.text}
                                {confirmation.required && <span className="text-destructive ml-1">*</span>}
                            </Label>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Submission Information */}
            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    <strong>Next Steps:</strong> After submission, your application will be reviewed by our team.
                    You will receive a confirmation email and updates on the review status. The review process
                    typically takes 3-5 business days.
                </AlertDescription>
            </Alert>

            {/* Missing Requirements */}
            {!isReadyToSubmit && (
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Missing Requirements:</strong> Please complete all required fields and confirmations
                        before submitting your application.
                        <ul className="list-disc list-inside mt-2 text-sm">
                            {!data?.selectedCourse && <li>Select a course to train</li>}
                            {!finalConfirmations.includes('accuracy') && <li>Confirm information accuracy</li>}
                            {!finalConfirmations.includes('terms') && <li>Accept terms and conditions</li>}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 pt-6">
                <Button variant="outline" size="lg">
                    <Save className="w-4 h-4 mr-2" />
                    Save as Draft
                </Button>
                <Button
                    size="lg"
                    disabled={!isReadyToSubmit}
                    className={isReadyToSubmit ? '' : 'opacity-50'}
                >
                    <Send className="w-4 h-4 mr-2" />
                    Submit Application
                </Button>
            </div>
        </div>
    );
}