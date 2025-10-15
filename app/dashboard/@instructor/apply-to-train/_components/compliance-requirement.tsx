

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    AlertTriangle,
    CheckCircle,
    Download,
    Eye,
    FileText,
    Lock,
    Shield, Upload,
    Users
} from 'lucide-react';
import { useState } from 'react';

interface ComplianceRequirementsProps {
    data: any;
    onDataChange: (data: any) => void;
}

// Compliance categories
const COMPLIANCE_AREAS = [
    {
        id: 'accreditation',
        title: 'Accreditation & Certification',
        icon: CheckCircle,
        required: true,
        description: 'Professional certifications and educational qualifications'
    },
    {
        id: 'safeguarding',
        title: 'Health & Safety / Safeguarding',
        icon: Shield,
        required: true,
        description: 'Safety policies and procedures for training environments'
    },
    {
        id: 'child_protection',
        title: 'Child Protection Policy',
        icon: Users,
        required: false,
        description: 'Required if training minors (under 18)'
    },
    {
        id: 'data_privacy',
        title: 'Data Privacy & GDPR Compliance',
        icon: Lock,
        required: true,
        description: 'Data protection and privacy compliance documentation'
    },
    {
        id: 'insurance',
        title: 'Professional Insurance',
        icon: Shield,
        required: false,
        description: 'Professional indemnity and public liability insurance'
    },
    {
        id: 'background_check',
        title: 'Background Verification',
        icon: Eye,
        required: false,
        description: 'Criminal background checks and character references'
    }
];

// Document types for each compliance area
const DOCUMENT_TYPES = {
    accreditation: [
        'Professional Certifications',
        'Educational Degrees/Diplomas',
        'Industry Certifications',
        'Training Certificates',
        'Professional Memberships'
    ],
    safeguarding: [
        'Health & Safety Policy',
        'Risk Assessment Documents',
        'Emergency Procedures',
        'Safety Training Certificates',
        'Workplace Safety Guidelines'
    ],
    child_protection: [
        'Child Protection Policy',
        'Safeguarding Training Certificate',
        'DBS/Criminal Record Check',
        'Child Safety Guidelines',
        'Incident Reporting Procedures'
    ],
    data_privacy: [
        'Data Privacy Policy',
        'GDPR Compliance Statement',
        'Data Processing Agreements',
        'Privacy Impact Assessment',
        'Data Security Measures'
    ],
    insurance: [
        'Professional Indemnity Insurance',
        'Public Liability Insurance',
        'Equipment Insurance',
        'Cyber Liability Insurance'
    ],
    background_check: [
        'Criminal Record Check',
        'Character References',
        'Employment History Verification',
        'Educational Background Check',
        'Professional References'
    ]
};

export function ComplianceRequirements({ data, onDataChange }: ComplianceRequirementsProps) {
    const [uploadedDocs, setUploadedDocs] = useState<Record<string, any[]>>(data?.uploadedDocs || {});
    const [complianceAgreements, setComplianceAgreements] = useState<string[]>(data?.complianceAgreements || []);

    const handleDocumentUpload = (area: string, docType: string) => {
        // Simulate file upload
        const newDoc = {
            id: `${area}-${Date.now()}`,
            type: docType,
            filename: `${docType.toLowerCase().replace(/\s+/g, '_')}.pdf`,
            uploadDate: new Date().toISOString(),
            status: 'uploaded'
        };

        const updatedDocs = {
            ...uploadedDocs,
            [area]: [...(uploadedDocs[area] || []), newDoc]
        };

        setUploadedDocs(updatedDocs);
        onDataChange({ ...data, uploadedDocs: updatedDocs });
    };

    const removeDocument = (area: string, docId: string) => {
        const updatedDocs = {
            ...uploadedDocs,
            [area]: (uploadedDocs[area] || []).filter(doc => doc.id !== docId)
        };

        setUploadedDocs(updatedDocs);
        onDataChange({ ...data, uploadedDocs: updatedDocs });
    };

    const handleComplianceAgreement = (agreementId: string, checked: boolean) => {
        const updatedAgreements = checked
            ? [...complianceAgreements, agreementId]
            : complianceAgreements.filter(id => id !== agreementId);

        setComplianceAgreements(updatedAgreements);
        onDataChange({ ...data, complianceAgreements: updatedAgreements });
    };

    const getComplianceStatus = (areaId: string) => {
        const area = COMPLIANCE_AREAS.find(a => a.id === areaId);
        const docs = uploadedDocs[areaId] || [];

        if (area?.required && docs.length === 0) return 'required';
        if (docs.length > 0) return 'completed';
        return 'optional';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-600';
            case 'required': return 'text-red-600';
            case 'optional': return 'text-yellow-600';
            default: return 'text-muted-foreground';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return CheckCircle;
            case 'required': return AlertTriangle;
            case 'optional': return FileText;
            default: return FileText;
        }
    };

    return (
        <div className="space-y-6">
            {/* Compliance Overview */}
            <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                    Please ensure all required compliance documents are provided. This helps maintain training quality
                    and ensures legal compliance for educational activities.
                </AlertDescription>
            </Alert>

            {/* Compliance Areas */}
            {COMPLIANCE_AREAS.map((area) => {
                const AreaIcon = area.icon;
                const status = getComplianceStatus(area.id);
                const StatusIcon = getStatusIcon(status);
                const docs = uploadedDocs[area.id] || [];

                return (
                    <Card key={area.id} className={area.required && status === 'required' ? 'border-red-200' : ''}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-3">
                                    <AreaIcon className="w-5 h-5" />
                                    {area.title}
                                    {area.required && (
                                        <Badge variant="destructive" className="text-xs">
                                            Required
                                        </Badge>
                                    )}
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <StatusIcon className={`w-4 h-4 ${getStatusColor(status)}`} />
                                    <span className={`text-sm capitalize ${getStatusColor(status)}`}>
                                        {status}
                                    </span>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{area.description}</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Document Types */}
                            <div className="space-y-3">
                                <Label>Document Types</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {DOCUMENT_TYPES[area.id as keyof typeof DOCUMENT_TYPES]?.map((docType) => (
                                        <div key={docType} className="flex items-center justify-between p-3 border rounded">
                                            <span className="text-sm">{docType}</span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDocumentUpload(area.id, docType)}
                                            >
                                                <Upload className="w-3 h-3 mr-1" />
                                                Upload
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Uploaded Documents */}
                            {docs.length > 0 && (
                                <div className="space-y-3">
                                    <Label>Uploaded Documents</Label>
                                    <div className="space-y-2">
                                        {docs.map((doc) => (
                                            <div key={doc.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="w-4 h-4 text-green-600" />
                                                    <div>
                                                        <p className="text-sm font-medium">{doc.type}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {doc.filename} • {new Date(doc.uploadDate).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="sm">
                                                        <Download className="w-3 h-3" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeDocument(area.id, doc.id)}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <AlertTriangle className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Area-specific fields */}
                            {area.id === 'accreditation' && (
                                <div className="space-y-2">
                                    <Label htmlFor="accreditationDetails">Accreditation Details</Label>
                                    <Textarea
                                        id="accreditationDetails"
                                        placeholder="List your relevant qualifications, certifications, and professional memberships..."
                                        rows={3}
                                        value={data?.accreditationDetails || ''}
                                        onChange={(e) => onDataChange({ ...data, accreditationDetails: e.target.value })}
                                    />
                                </div>
                            )}

                            {area.id === 'data_privacy' && (
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="dataHandling">Data Handling Practices</Label>
                                        <Textarea
                                            id="dataHandling"
                                            placeholder="Describe how you handle student data, privacy protection measures, and GDPR compliance..."
                                            rows={3}
                                            value={data?.dataHandling || ''}
                                            onChange={(e) => onDataChange({ ...data, dataHandling: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="gdprCompliant"
                                            checked={data?.gdprCompliant || false}
                                            onCheckedChange={(checked) => onDataChange({ ...data, gdprCompliant: checked })}
                                        />
                                        <Label htmlFor="gdprCompliant" className="text-sm">
                                            I confirm compliance with GDPR and local data protection regulations
                                        </Label>
                                    </div>
                                </div>
                            )}

                            {area.id === 'insurance' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                                        <Input
                                            id="insuranceProvider"
                                            placeholder="Insurance company name"
                                            value={data?.insuranceProvider || ''}
                                            onChange={(e) => onDataChange({ ...data, insuranceProvider: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="policyNumber">Policy Number</Label>
                                        <Input
                                            id="policyNumber"
                                            placeholder="Policy reference number"
                                            value={data?.policyNumber || ''}
                                            onChange={(e) => onDataChange({ ...data, policyNumber: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="coverageAmount">Coverage Amount</Label>
                                        <Input
                                            id="coverageAmount"
                                            placeholder="e.g., £1,000,000"
                                            value={data?.coverageAmount || ''}
                                            onChange={(e) => onDataChange({ ...data, coverageAmount: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="expiryDate">Policy Expiry Date</Label>
                                        <Input
                                            id="expiryDate"
                                            type="date"
                                            value={data?.insuranceExpiry || ''}
                                            onChange={(e) => onDataChange({ ...data, insuranceExpiry: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}

            {/* Additional Compliance Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Additional Compliance Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="additionalCertifications">Additional Certifications or Licenses</Label>
                        <Textarea
                            id="additionalCertifications"
                            placeholder="List any other relevant certifications, licenses, or compliance documentation..."
                            rows={3}
                            value={data?.additionalCertifications || ''}
                            onChange={(e) => onDataChange({ ...data, additionalCertifications: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="complianceNotes">Compliance Notes</Label>
                        <Textarea
                            id="complianceNotes"
                            placeholder="Any additional information regarding compliance requirements or special circumstances..."
                            rows={3}
                            value={data?.complianceNotes || ''}
                            onChange={(e) => onDataChange({ ...data, complianceNotes: e.target.value })}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Compliance Declarations */}
            <Card>
                <CardHeader>
                    <CardTitle>Compliance Declarations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[
                        {
                            id: 'accuracy',
                            text: 'I declare that all information provided is accurate and complete to the best of my knowledge.'
                        },
                        {
                            id: 'updates',
                            text: 'I commit to keeping all compliance documentation current and notifying of any changes.'
                        },
                        {
                            id: 'standards',
                            text: 'I agree to maintain professional standards and comply with all applicable regulations during training delivery.'
                        },
                        {
                            id: 'cooperation',
                            text: 'I agree to cooperate with any compliance audits or verification processes as required.'
                        }
                    ].map((declaration) => (
                        <div key={declaration.id} className="flex items-start space-x-3">
                            <Checkbox
                                id={declaration.id}
                                checked={complianceAgreements.includes(declaration.id)}
                                onCheckedChange={(checked) => handleComplianceAgreement(declaration.id, checked as boolean)}
                                className="mt-1"
                            />
                            <Label htmlFor={declaration.id} className="text-sm cursor-pointer leading-relaxed">
                                {declaration.text}
                            </Label>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Compliance Summary */}
            <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4>Compliance Status</h4>
                            <p className="text-sm text-muted-foreground">
                                {COMPLIANCE_AREAS.filter(area => getComplianceStatus(area.id) === 'completed').length} of{' '}
                                {COMPLIANCE_AREAS.filter(area => area.required).length} required areas completed
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-2">
                                {COMPLIANCE_AREAS.filter(area => area.required).every(area => getComplianceStatus(area.id) === 'completed') ? (
                                    <>
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <span className="text-green-600 font-medium">Ready for Review</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                        <span className="text-yellow-600 font-medium">Pending Documents</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}