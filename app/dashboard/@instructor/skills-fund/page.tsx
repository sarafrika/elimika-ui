'use client';

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
import { Textarea } from '@/components/ui/textarea';
import { Award, CheckCircle, FileText, LockIcon, Unlock, Upload, Users } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { useInstructor } from '../../../../context/instructor-context';
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
    reason:
      'I need financial support to complete my training and access better career opportunities.',
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

const InstructorFundView: React.FC<Props> = ({ currentUser, wallet, setWallet }) => {
  const instructor = useInstructor();
  const instructorApplications = skillsFundApplications;

  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [newApplication, setNewApplication] = useState<Partial<any>>({
    fundType: 'training-support',
    currency: 'USD',
    documents: [],
  });

  const trainingOpportunities = [
    {
      id: 'opp-1',
      title: 'Workshop Facilitation Grant',
      description: 'Funding for conducting skills development workshops',
      maxAmount: 3000,
      requirements: ['Training Proposal', 'Participant Count', 'Outcomes Plan'],
    },
    {
      id: 'opp-2',
      title: 'Mentorship Program Support',
      description: 'Support for long-term mentorship initiatives',
      maxAmount: 5000,
      requirements: ['Mentorship Plan', 'Track Record', 'Impact Metrics'],
    },
    {
      id: 'opp-3',
      title: 'Course Development Fund',
      description: 'Funding to create and deliver new courses',
      maxAmount: 2500,
      requirements: ['Course Curriculum', 'Target Audience', 'Learning Outcomes'],
    },
  ];

  const handleSubmitApplication = () => {
    if (!newApplication.program || !newApplication.reason || !newApplication.amount) {
      alert('Please fill in all required fields');
      return;
    }

    const _application: any = {
      id: `app-${Date.now()}`,
      applicantId: currentUser.id,
      applicantName: currentUser.name,
      applicantType: 'instructor',
      fundType: 'training-support',
      program: newApplication.program,
      reason: newApplication.reason,
      amount: newApplication.amount,
      currency: newApplication.currency || 'USD',
      documents: newApplication.documents || [],
      status: 'submitted',
      submittedAt: new Date(),
    };

    setShowApplicationModal(false);
    setNewApplication({
      fundType: 'training-support',
      currency: 'USD',
      documents: [],
    });
  };

  const _handleUnlockFunds = (applicationId: string) => {
    // Simulate unlocking funds after course completion
    if (wallet) {
      const application = instructorApplications?.find(a => a.id === applicationId);
      if (application && application.status === 'disbursed') {
        const updatedWallet: any = {
          ...wallet,
          balance: wallet.balance + application.amount / 2, // Unlock 50% per class
          lockedBalance: (wallet.lockedBalance || 0) - application.amount / 2,
          transactions: [
            ...wallet.transactions,
            {
              id: `txn-unlock-${Date.now()}`,
              type: 'credit',
              amount: application.amount / 2,
              description: `Funds unlocked for completing ${application.program}`,
              category: 'grant',
              date: new Date(),
              status: 'completed',
              relatedId: applicationId,
            },
          ],
        };
        setWallet(updatedWallet);
      }
    }
  };

  return (
    <div className='w-full space-y-6'>
      <SkillsFundWalletCard wallet={sampleWallet} user={instructor} />

      {/* Quick Stats */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
        <Card className='p-4'>
          <div className='flex items-center gap-3'>
            <div className='rounded-lg bg-blue-100 p-2'>
              <Award className='h-5 w-5 text-blue-600' />
            </div>
            <div>
              <p className='text-muted-foreground text-sm'>Applications</p>
              <p className='text-2xl'>{instructorApplications.length}</p>
            </div>
          </div>
        </Card>

        <Card className='p-4'>
          <div className='flex items-center gap-3'>
            <div className='rounded-lg bg-green-100 p-2'>
              <CheckCircle className='h-5 w-5 text-green-600' />
            </div>
            <div>
              <p className='text-muted-foreground text-sm'>Approved</p>
              <p className='text-2xl'>
                {
                  instructorApplications.filter(
                    a => a.status === 'approved' || a.status === 'disbursed'
                  ).length
                }
              </p>
            </div>
          </div>
        </Card>

        <Card className='p-4'>
          <div className='flex items-center gap-3'>
            <div className='rounded-lg bg-orange-100 p-2'>
              <LockIcon className='h-5 w-5 text-orange-600' />
            </div>
            <div>
              <p className='text-muted-foreground text-sm'>Locked Funds</p>
              <p className='text-2xl'>${wallet?.lockedBalance?.toFixed(0) || 0}</p>
            </div>
          </div>
        </Card>

        <Card className='p-4'>
          <div className='flex items-center gap-3'>
            <div className='rounded-lg bg-purple-100 p-2'>
              <Users className='h-5 w-5 text-purple-600' />
            </div>
            <div>
              <p className='text-muted-foreground text-sm'>Students Trained</p>
              <p className='text-2xl'>0</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Available Opportunities */}
      <Card className='p-6'>
        <div className='mb-6 flex items-center justify-between'>
          <h3>Training Fund Opportunities</h3>
          <Button onClick={() => setShowApplicationModal(true)}>Apply for Funding</Button>
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
          {trainingOpportunities.map(opp => (
            <Card key={opp.id} className='hover:border-primary border-2 p-4 transition-colors'>
              <div className='space-y-3'>
                <div>
                  <h4>{opp.title}</h4>
                  <p className='text-muted-foreground mt-1 text-sm'>{opp.description}</p>
                </div>

                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground text-sm'>Max Funding</span>
                    <span>${opp.maxAmount.toLocaleString()}</span>
                  </div>
                  <div>
                    <p className='text-muted-foreground mb-1 text-xs'>Requirements:</p>
                    {opp.requirements.map((req, idx) => (
                      <Badge key={idx} variant='outline' className='mr-1 mb-1 text-xs'>
                        {req}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  variant='outline'
                  size='sm'
                  className='w-full'
                  onClick={() => setShowApplicationModal(true)}
                >
                  Apply
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Fund History & Reporting */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* My Applications */}
        <Card className='p-6'>
          <h3 className='mb-4'>My Applications</h3>

          {instructorApplications.length === 0 ? (
            <div className='py-12 text-center'>
              <Award className='text-muted-foreground mx-auto mb-4 h-16 w-16' />
              <p className='text-muted-foreground'>No applications yet</p>
              <Button
                onClick={() => setShowApplicationModal(true)}
                variant='outline'
                className='mt-4'
              >
                Apply for Training Fund
              </Button>
            </div>
          ) : (
            <div className='space-y-3'>
              {instructorApplications.map(application => (
                <Card key={application.id} className='bg-muted p-4'>
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <h4 className='text-sm'>{application.program}</h4>
                      <Badge
                        className={
                          application.status === 'disbursed'
                            ? 'bg-green-600'
                            : application.status === 'approved'
                              ? 'bg-blue-600'
                              : 'bg-yellow-600'
                        }
                      >
                        {application.status}
                      </Badge>
                    </div>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>Amount</span>
                      <span>
                        {application.currency} ${application.amount.toLocaleString()}
                      </span>
                    </div>
                    {application.status === 'disbursed' && (
                      <Button
                        size='sm'
                        variant='outline'
                        className='w-full gap-2'
                        onClick={() => setShowReportModal(true)}
                      >
                        <FileText className='h-4 w-4' />
                        Submit Training Report
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* Locked vs Available Funds */}
        <Card className='p-6'>
          <h3 className='mb-4'>Fund Status</h3>

          <div className='space-y-4'>
            <div className='rounded-lg border border-green-200 bg-green-50 p-4'>
              <div className='mb-2 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Unlock className='h-5 w-5 text-green-600' />
                  <span>Available Balance</span>
                </div>
                <span className='text-xl text-green-700'>
                  ${sampleWallet?.balance.toFixed(2) || '0.00'}
                </span>
              </div>
              <p className='text-sm text-green-700'>Ready to withdraw or use for expenses</p>
            </div>

            <div className='rounded-lg border border-orange-200 bg-orange-50 p-4'>
              <div className='mb-2 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <LockIcon className='h-5 w-5 text-orange-600' />
                  <span>Locked Funds</span>
                </div>
                <span className='text-xl text-orange-700'>
                  ${sampleWallet?.lockedBalance?.toFixed(2) || '0.00'}
                </span>
              </div>
              <p className='text-sm text-orange-700'>Unlocks upon completing each class session</p>
            </div>

            <div className='border-t pt-4'>
              <h4 className='mb-3'>How It Works</h4>
              <ul className='text-muted-foreground space-y-2 text-sm'>
                <li className='flex items-start gap-2'>
                  <CheckCircle className='mt-0.5 h-4 w-4 text-green-600' />
                  <span>Apply for training facilitation funds</span>
                </li>
                <li className='flex items-start gap-2'>
                  <CheckCircle className='mt-0.5 h-4 w-4 text-green-600' />
                  <span>Funds are disbursed but locked in your wallet</span>
                </li>
                <li className='flex items-start gap-2'>
                  <CheckCircle className='mt-0.5 h-4 w-4 text-green-600' />
                  <span>Complete classes and submit reports</span>
                </li>
                <li className='flex items-start gap-2'>
                  <CheckCircle className='mt-0.5 h-4 w-4 text-green-600' />
                  <span>Funds unlock progressively for each completed session</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Application Modal */}
      <Dialog open={showApplicationModal} onOpenChange={setShowApplicationModal}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Apply for Training Support</DialogTitle>
            <DialogDescription>
              Submit your training proposal to receive funding support
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div>
              <Label>Training Program Title</Label>
              <Input
                placeholder='e.g., Advanced React Workshop'
                value={newApplication.program || ''}
                onChange={e => setNewApplication({ ...newApplication, program: e.target.value })}
                className='mt-2'
              />
            </div>

            <div>
              <Label>Amount Requested (USD)</Label>
              <Input
                type='number'
                placeholder='0.00'
                value={newApplication.amount || ''}
                onChange={e =>
                  setNewApplication({
                    ...newApplication,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
                className='mt-2'
              />
            </div>

            <div>
              <Label>Training Proposal</Label>
              <Textarea
                placeholder='Describe your training program, target audience, learning outcomes, and expected impact...'
                value={newApplication.reason || ''}
                onChange={e => setNewApplication({ ...newApplication, reason: e.target.value })}
                className='mt-2'
                rows={5}
              />
            </div>

            <div>
              <Label>Supporting Documents</Label>
              <div className='border-border mt-2 rounded-lg border-2 border-dashed p-6 text-center'>
                <Upload className='text-muted-foreground mx-auto mb-2 h-8 w-8' />
                <p className='text-muted-foreground text-sm'>
                  Upload curriculum, credentials, and participant list
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setShowApplicationModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitApplication}>Submit Application</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Training Report Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Submit Training Report</DialogTitle>
            <DialogDescription>
              Report on attendance, outcomes, and assessments to unlock funds
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div>
              <Label>Attendance Summary</Label>
              <Input placeholder='e.g., 25 out of 30 students attended' className='mt-2' />
            </div>

            <div>
              <Label>Learning Outcomes Achieved</Label>
              <Textarea
                placeholder='Describe the skills learned and competencies achieved...'
                className='mt-2'
                rows={4}
              />
            </div>

            <div>
              <Label>Assessment Results</Label>
              <Input placeholder='e.g., Average score: 85%' className='mt-2' />
            </div>

            <div>
              <Label>Supporting Documents (Receipts, Photos, Certificates)</Label>
              <div className='border-border mt-2 rounded-lg border-2 border-dashed p-6 text-center'>
                <Upload className='text-muted-foreground mx-auto mb-2 h-8 w-8' />
                <p className='text-muted-foreground text-sm'>
                  Upload attendance sheets, receipts, and completion certificates
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setShowReportModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowReportModal(false)}>Submit Report & Unlock Funds</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InstructorFundView;
