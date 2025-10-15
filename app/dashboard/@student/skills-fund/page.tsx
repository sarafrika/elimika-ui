'use client'

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useQuery } from '@tanstack/react-query';
import {
    BookOpen,
    Calendar,
    CheckCircle,
    Clock,
    DollarSign,
    FileText,
    TrendingUp,
    Upload,
    XCircle
} from 'lucide-react';
import React, { useState } from 'react';
import { useStudent } from '../../../../context/student-context';
import { getUserByUuidOptions } from '../../../../services/client/@tanstack/react-query.gen';
import { sampleWallet, SkillsFundWalletCard } from '../../_components/skill-fund-wallet';



const skillsFundApplications: any[] = [
    {
        id: 'app-001',
        applicantId: 'student_001',
        applicantName: 'Alice Kimani',
        applicantType: 'student',
        fundType: 'scholarship',
        program: 'Full Stack Development Bootcamp',
        reason: 'I want to upskill in web development to become job-ready.',
        amount: 45000,
        currency: 'KES',
        documents: [
            {
                id: 'doc-001',
                name: 'National ID',
                type: 'identification',
                url: '/uploads/app-001/national-id.pdf',
            },
            {
                id: 'doc-002',
                name: 'Motivation Letter',
                type: 'letter',
                url: '/uploads/app-001/motivation-letter.pdf',
            },
        ],
        status: 'under-review',
        submittedAt: new Date('2025-10-01T10:00:00'),
        reviewedAt: new Date('2025-10-05T15:00:00'),
        reviewedBy: 'admin_002',
    },

    {
        id: 'app-002',
        applicantId: 'instructor_001',
        applicantName: 'Brian Otieno',
        applicantType: 'instructor',
        fundType: 'training-support',
        program: 'Instructional Design Workshop',
        reason: 'To improve my course creation and student engagement techniques.',
        amount: 20000,
        currency: 'KES',
        documents: [
            {
                id: 'doc-003',
                name: 'Workshop Registration',
                type: 'receipt',
                url: '/uploads/app-002/registration.pdf',
            },
        ],
        status: 'approved',
        submittedAt: new Date('2025-09-15T09:30:00'),
        reviewedAt: new Date('2025-09-18T11:00:00'),
        reviewedBy: 'admin_001',
        disbursedAt: new Date('2025-09-20T10:00:00'),
        linkedCourseId: 'course_099',
    },

    {
        id: 'app-003',
        applicantId: 'student_002',
        applicantName: 'David Wanjala',
        applicantType: 'student',
        fundType: 'loan',
        program: 'Data Analytics Professional Certificate',
        reason: 'I need financial support to complete my training and access better career opportunities.',
        amount: 60000,
        currency: 'KES',
        documents: [],
        status: 'draft',
    },

    {
        id: 'app-004',
        applicantId: 'student_003',
        applicantName: 'Carol Wanjiru',
        applicantType: 'student',
        fundType: 'grant',
        program: 'UI/UX Design Certification',
        reason: 'I aim to transition into product design but cannot afford the full tuition.',
        amount: 35000,
        currency: 'KES',
        documents: [
            {
                id: 'doc-004',
                name: 'Statement of Purpose',
                type: 'letter',
                url: '/uploads/app-004/sop.pdf',
            },
        ],
        status: 'rejected',
        submittedAt: new Date('2025-09-10T08:45:00'),
        reviewedAt: new Date('2025-09-12T14:00:00'),
        reviewedBy: 'admin_003',
        rejectionReason: 'Incomplete documentation and unclear learning goals.',
    },

    {
        id: 'app-005',
        applicantId: 'instructor_002',
        applicantName: 'Dr. Mercy Nduta',
        applicantType: 'instructor',
        fundType: 'grant',
        program: 'Advanced AI Mentorship Program',
        reason: 'To mentor students and contribute to the AI research community.',
        amount: 75000,
        currency: 'KES',
        documents: [
            {
                id: 'doc-005',
                name: 'Proposal',
                type: 'project-proposal',
                url: '/uploads/app-005/proposal.pdf',
            },
            {
                id: 'doc-006',
                name: 'Curriculum Vitae',
                type: 'cv',
                url: '/uploads/app-005/cv.pdf',
            },
        ],
        status: 'disbursed',
        submittedAt: new Date('2025-08-20T10:00:00'),
        reviewedAt: new Date('2025-08-22T16:30:00'),
        reviewedBy: 'admin_004',
        disbursedAt: new Date('2025-08-25T09:00:00'),
        linkedCourseId: 'course_120',
    },
];


type Props = {
    currentUser: any;
    wallet: any | null;
    setWallet: (wallet: any | null) => void;
};

const StudentFundView: React.FC<Props> = ({
    currentUser,
    wallet,
    setWallet,
}) => {

    const studentData = useStudent()
    const { data } = useQuery({
        ...getUserByUuidOptions({ path: { uuid: studentData?.user_uuid as string } }),
        enabled: !!studentData?.user_uuid
    })
    const student = data?.data;

    const studentApplications = skillsFundApplications;
    const classes = [
        { id: 'class-1', classTitle: 'Full Stack Development Bootcamp' },
        { id: 'class-2', classTitle: 'Data Science with Python' },
        { id: 'class-3', classTitle: 'Digital Marketing Essentials' },
        { id: 'class-4', classTitle: 'Cybersecurity Fundamentals' },
        { id: 'class-5', classTitle: 'Cloud Computing with AWS' },
    ];

    const [showApplicationModal, setShowApplicationModal] = useState(false);
    const [newApplication, setNewApplication] = useState<Partial<any>>({
        fundType: 'scholarship',
        currency: 'USD',
        documents: [],
    });

    const availableFunds = [
        {
            id: 'fund-1',
            type: 'scholarship',
            name: 'Skills Development Scholarship',
            description: 'Full or partial tuition coverage for accredited courses',
            maxAmount: 5000,
            eligibility: ['Students', 'Beginners'],
            deadline: new Date(2025, 11, 31),
        },
        {
            id: 'fund-2',
            type: 'grant',
            name: 'Tech Skills Grant',
            description: 'Support for technology and programming courses',
            maxAmount: 3000,
            eligibility: ['Students', 'Career Changers'],
            deadline: new Date(2025, 10, 30),
        },
        {
            id: 'fund-3',
            type: 'loan',
            name: 'Education Microloan',
            description: 'Low-interest loans for skills training',
            maxAmount: 2000,
            eligibility: ['Students', 'Professionals'],
            deadline: new Date(2026, 0, 15),
        },
    ];

    const handleSubmitApplication = () => {
        if (!newApplication.program || !newApplication.reason || !newApplication.amount) {
            alert('Please fill in all required fields');
            return;
        }

        const application: any = {
            id: `app-${Date.now()}`,
            applicantId: currentUser.id,
            applicantName: currentUser.name,
            applicantType: 'student',
            fundType: newApplication.fundType as any,
            program: newApplication.program,
            reason: newApplication.reason,
            amount: newApplication.amount,
            currency: newApplication.currency || 'USD',
            documents: newApplication.documents || [],
            status: 'submitted',
            submittedAt: new Date(),
        };

        // setApplications([...applications, application]);
        setShowApplicationModal(false);
        setNewApplication({
            fundType: 'scholarship',
            currency: 'USD',
            documents: [],
        });
    };

    const getStatusIcon = (status: any['status']) => {
        switch (status) {
            case 'approved':
            case 'disbursed':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'rejected':
                return <XCircle className="w-5 h-5 text-red-600" />;
            case 'under-review':
            case 'submitted':
                return <Clock className="w-5 h-5 text-yellow-600" />;
            default:
                return <FileText className="w-5 h-5 text-gray-600" />;
        }
    };

    const getStatusColor = (status: any['status']) => {
        switch (status) {
            case 'approved':
            case 'disbursed':
                return 'bg-green-600';
            case 'rejected':
                return 'bg-red-600';
            case 'under-review':
            case 'submitted':
                return 'bg-yellow-600';
            default:
                return 'bg-gray-600';
        }
    };

    return (
        <div className="space-y-6">
            <SkillsFundWalletCard
                wallet={sampleWallet}
                user={student}
                role='Student'
            />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Applications</p>
                            <p className="text-2xl">{studentApplications?.length}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Approved</p>
                            <p className="text-2xl">
                                {
                                    studentApplications.filter((a) => a.status === 'approved' || a.status === 'disbursed')
                                        .length
                                }
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Clock className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Pending</p>
                            <p className="text-2xl">
                                {
                                    studentApplications.filter(
                                        (a) => a.status === 'submitted' || a.status === 'under-review'
                                    ).length
                                }
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <DollarSign className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Funded</p>
                            <p className="text-2xl">
                                $
                                {studentApplications
                                    .filter((a) => a.status === 'disbursed')
                                    .reduce((sum, a) => sum + a.amount, 0)
                                    .toLocaleString()}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Available Funds */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3>Available Funding Options</h3>
                    <Button onClick={() => setShowApplicationModal(true)}>
                        Apply for Funding
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {availableFunds.map((fund) => (
                        <Card key={fund.id} className="p-4 border-2 hover:border-primary transition-colors">
                            <div className="space-y-3">
                                <div>
                                    <Badge variant="secondary">{fund.type}</Badge>
                                    <h4 className="mt-2">{fund.name}</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {fund.description}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Max Amount</span>
                                        <span>${fund.maxAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Calendar className="w-3 h-3" />
                                        <span>
                                            Deadline: {fund.deadline.toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => {
                                        setNewApplication({ ...newApplication, fundType: fund.type as any });
                                        setShowApplicationModal(true);
                                    }}
                                >
                                    Apply Now
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </Card>

            {/* My Applications */}
            <Card className="p-6">
                <h3 className="mb-6">My Applications</h3>

                {studentApplications.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No applications yet</p>
                        <Button
                            onClick={() => setShowApplicationModal(true)}
                            variant="outline"
                            className="mt-4"
                        >
                            Submit Your First Application
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {studentApplications.map((application) => (
                            <Card key={application.id} className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4 flex-1">
                                        {getStatusIcon(application.status)}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4>{application.program}</h4>
                                                <Badge className={getStatusColor(application.status)}>
                                                    {application.status.replace('-', ' ')}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                {application.reason}
                                            </p>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="text-muted-foreground">
                                                    Amount: {application.currency} ${application.amount.toLocaleString()}
                                                </span>
                                                <span className="text-muted-foreground">
                                                    Type: {application.fundType}
                                                </span>
                                                {application.submittedAt && (
                                                    <span className="text-muted-foreground">
                                                        Submitted: {application.submittedAt.toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Tracker */}
                                {application.status !== 'draft' && (
                                    <div className="mt-4 pt-4 border-t">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm">Application Progress</span>
                                            <span className="text-sm text-muted-foreground">
                                                {application.status === 'submitted' && '25%'}
                                                {application.status === 'under-review' && '50%'}
                                                {application.status === 'approved' && '75%'}
                                                {application.status === 'disbursed' && '100%'}
                                                {application.status === 'rejected' && 'Rejected'}
                                            </span>
                                        </div>
                                        <Progress
                                            value={
                                                application.status === 'submitted'
                                                    ? 25
                                                    : application.status === 'under-review'
                                                        ? 50
                                                        : application.status === 'approved'
                                                            ? 75
                                                            : application.status === 'disbursed'
                                                                ? 100
                                                                : 0
                                            }
                                        />
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </Card>

            {/* Fund Usage Tracker */}
            {wallet && wallet.transactions.length > 0 && (
                <Card className="p-6">
                    <h3 className="mb-6">Fund Usage History</h3>
                    <div className="space-y-3">
                        {wallet.transactions.slice(0, 10).map((txn: any) => (
                            <div
                                key={txn.id}
                                className="flex items-center justify-between p-3 bg-muted rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`p-2 rounded-lg ${txn.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                                            }`}
                                    >
                                        {txn.type === 'credit' ? (
                                            <TrendingUp className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <BookOpen className="w-4 h-4 text-red-600" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm">{txn.description}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {txn.date.toLocaleDateString()} • {txn.category}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p
                                        className={`${txn.type === 'credit' ? 'text-green-600' : 'text-red-600'
                                            }`}
                                    >
                                        {txn.type === 'credit' ? '+' : '-'}${txn.amount}
                                    </p>
                                    <Badge variant={txn.status === 'completed' ? 'default' : 'secondary'}>
                                        {txn.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Application Modal */}
            <Dialog open={showApplicationModal} onOpenChange={setShowApplicationModal}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Apply for Funding</DialogTitle>
                        <DialogDescription>
                            Fill in the application form to request funding for your skills development
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label>Fund Type</Label>
                            <Select
                                value={newApplication.fundType}
                                onValueChange={(value: any) =>
                                    setNewApplication({ ...newApplication, fundType: value })
                                }
                            >
                                <SelectTrigger className="mt-2">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="scholarship">Scholarship</SelectItem>
                                    <SelectItem value="grant">Grant</SelectItem>
                                    <SelectItem value="loan">Loan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Program / Course</Label>
                            <Select
                                value={newApplication.program}
                                onValueChange={(value) =>
                                    setNewApplication({ ...newApplication, program: value })
                                }
                            >
                                <SelectTrigger className="mt-2">
                                    <SelectValue placeholder="Select a course" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map((cls) => (
                                        <SelectItem key={cls.id} value={cls.classTitle}>
                                            {cls.classTitle}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Amount Requested (USD)</Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={newApplication.amount || ''}
                                onChange={(e) =>
                                    setNewApplication({
                                        ...newApplication,
                                        amount: parseFloat(e.target.value) || 0,
                                    })
                                }
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <Label>Reason for Application</Label>
                            <Textarea
                                placeholder="Explain why you need this funding and how it will help your career development..."
                                value={newApplication.reason || ''}
                                onChange={(e) =>
                                    setNewApplication({ ...newApplication, reason: e.target.value })
                                }
                                className="mt-2"
                                rows={4}
                            />
                        </div>

                        <div>
                            <Label>Supporting Documents (Optional)</Label>
                            <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center">
                                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    Click to upload or drag and drop
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    PDF, DOC, or images (max 5MB)
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowApplicationModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmitApplication}>Submit Application</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default StudentFundView
