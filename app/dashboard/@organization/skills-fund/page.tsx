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
import { Award, BarChart3, DollarSign, Download, Target, TrendingUp, Users } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';

const _skillsFundApplications: any[] = [
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

export const sampleSkillsFundContributions: any[] = [
  {
    id: 'c1',
    donorId: 'd123',
    donorName: 'Global Education Trust',
    donorType: 'organization',
    amount: 50000,
    currency: 'USD',
    purpose: 'Support tech bootcamps for underrepresented youth',
    targetGroup: 'students',
    date: new Date('2025-07-15'),
    status: 'completed',
    impact: {
      beneficiaries: 120,
      skillsOutcomes: ['web development', 'data analysis'],
      fundUtilization: 95,
    },
  },
  {
    id: 'c2',
    donorId: 'd456',
    donorName: 'Jane Doe',
    donorType: 'donor',
    amount: 1000,
    currency: 'USD',
    purpose: 'Scholarship for women in STEM',
    targetGroup: 'students',
    date: new Date('2025-08-10'),
    status: 'completed',
    impact: {
      beneficiaries: 3,
      skillsOutcomes: ['cybersecurity', 'AI fundamentals'],
      fundUtilization: 100,
    },
  },
  {
    id: 'c3',
    donorId: 'org789',
    donorName: 'Future Skills Foundation',
    donorType: 'organization',
    amount: 20000,
    currency: 'EUR',
    purpose: 'Upskill technical instructors in rural areas',
    targetGroup: 'instructors',
    date: new Date('2025-06-20'),
    status: 'pending',
  },
  {
    id: 'c4',
    donorId: 'd321',
    donorName: 'Ahmed Khan',
    donorType: 'donor',
    amount: 2500,
    currency: 'USD',
    purpose: 'Fund students in AI program',
    targetGroup: 'specific-program',
    targetProgramId: 'ai-prog-2025',
    date: new Date('2025-09-01'),
    status: 'completed',
    impact: {
      beneficiaries: 5,
      skillsOutcomes: ['machine learning', 'Python programming'],
      fundUtilization: 88,
    },
  },
  {
    id: 'c5',
    donorId: 'org888',
    donorName: 'Tech for All Initiative',
    donorType: 'organization',
    amount: 75000,
    currency: 'GBP',
    purpose: 'Launch inclusive coding bootcamp',
    date: new Date('2025-10-01'),
    status: 'pending',
  },
];

type Props = {
  currentUser: any;
  wallet: any | null;
  setWallet: (wallet: any | null) => void;
};

const OrganisationFundView: React.FC<Props> = ({ currentUser, wallet, setWallet }) => {
  const classes = [
    { id: 'class-001', classTitle: 'Full Stack Development Bootcamp' },
    { id: 'class-002', classTitle: 'Data Science Immersive' },
  ];

  const [showContributeModal, setShowContributeModal] = useState(false);
  const [newContribution, setNewContribution] = useState<Partial<any>>({
    currency: 'USD',
    targetGroup: 'students',
  });

  const handleSubmitContribution = () => {
    if (!newContribution.amount || !newContribution.purpose) {
      alert('Please fill in all required fields');
      return;
    }

    const _contribution: any = {
      id: `contrib-${Date.now()}`,
      donorId: currentUser.id,
      donorName: currentUser.name,
      donorType: 'organization',
      amount: newContribution.amount,
      currency: newContribution.currency || 'USD',
      purpose: newContribution.purpose,
      targetGroup: newContribution.targetGroup as any,
      targetProgramId: newContribution.targetProgramId,
      date: new Date(),
      status: 'completed',
      impact: {
        beneficiaries: 0,
        skillsOutcomes: [],
        fundUtilization: 0,
      },
    };

    setShowContributeModal(false);
    setNewContribution({
      currency: 'USD',
      targetGroup: 'students',
    });
  };

  const orgContributions = sampleSkillsFundContributions?.filter(c => c.donorId === 'd123');
  const totalContributed = orgContributions?.reduce((sum, c) => sum + c.amount, 0);
  const totalBeneficiaries = orgContributions?.reduce(
    (sum, c) => sum + (c.impact?.beneficiaries || 0),
    0
  );

  return (
    <div className='w-full space-y-6'>
      {/* Quick Stats */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
        <Card className='p-4'>
          <div className='flex items-center gap-3'>
            <div className='rounded-lg bg-blue-100 p-2'>
              <DollarSign className='h-5 w-5 text-blue-600' />
            </div>
            <div>
              <p className='text-muted-foreground text-sm'>Total Contributed</p>
              <p className='text-2xl'>${totalContributed.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className='p-4'>
          <div className='flex items-center gap-3'>
            <div className='rounded-lg bg-green-100 p-2'>
              <Users className='h-5 w-5 text-green-600' />
            </div>
            <div>
              <p className='text-muted-foreground text-sm'>Beneficiaries</p>
              <p className='text-2xl'>{totalBeneficiaries}</p>
            </div>
          </div>
        </Card>

        <Card className='p-4'>
          <div className='flex items-center gap-3'>
            <div className='rounded-lg bg-purple-100 p-2'>
              <Target className='h-5 w-5 text-purple-600' />
            </div>
            <div>
              <p className='text-muted-foreground text-sm'>Programs Supported</p>
              <p className='text-2xl'>{orgContributions.length}</p>
            </div>
          </div>
        </Card>

        <Card className='p-4'>
          <div className='flex items-center gap-3'>
            <div className='rounded-lg bg-orange-100 p-2'>
              <TrendingUp className='h-5 w-5 text-orange-600' />
            </div>
            <div>
              <p className='text-muted-foreground text-sm'>Avg. Utilization</p>
              <p className='text-2xl'>
                {orgContributions.length > 0
                  ? Math.round(
                      orgContributions.reduce(
                        (sum: any, c: any) => sum + (c.impact?.fundUtilization || 0),
                        0
                      ) / orgContributions.length
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Contribution Actions */}
      <Card className='p-6'>
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h3>Support Skills Development</h3>
            <p className='text-muted-foreground mt-1'>
              Contribute to training programs and empower learners
            </p>
          </div>
          <Button className='self-end' onClick={() => setShowContributeModal(true)} size='lg'>
            Make Contribution
          </Button>
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
          <Card className='hover:border-primary cursor-pointer border-2 p-4 transition-colors'>
            <div className='space-y-3'>
              <div className='w-fit rounded-lg bg-blue-100 p-3'>
                <Users className='h-6 w-6 text-blue-600' />
              </div>
              <div>
                <h4>Fund Students</h4>
                <p className='text-muted-foreground text-sm'>
                  Support scholarships and grants for aspiring learners
                </p>
              </div>
              <Button
                variant='outline'
                size='sm'
                className='w-full'
                onClick={() => {
                  setNewContribution({ ...newContribution, targetGroup: 'students' });
                  setShowContributeModal(true);
                }}
              >
                Contribute
              </Button>
            </div>
          </Card>

          <Card className='hover:border-primary cursor-pointer border-2 p-4 transition-colors'>
            <div className='space-y-3'>
              <div className='w-fit rounded-lg bg-green-100 p-3'>
                <Award className='h-6 w-6 text-green-600' />
              </div>
              <div>
                <h4>Support Instructors</h4>
                <p className='text-muted-foreground text-sm'>
                  Enable trainers to deliver quality programs
                </p>
              </div>
              <Button
                variant='outline'
                size='sm'
                className='w-full'
                onClick={() => {
                  setNewContribution({ ...newContribution, targetGroup: 'instructors' });
                  setShowContributeModal(true);
                }}
              >
                Contribute
              </Button>
            </div>
          </Card>

          <Card className='hover:border-primary cursor-pointer border-2 p-4 transition-colors'>
            <div className='space-y-3'>
              <div className='w-fit rounded-lg bg-purple-100 p-3'>
                <Target className='h-6 w-6 text-purple-600' />
              </div>
              <div>
                <h4>Sponsor Program</h4>
                <p className='text-muted-foreground text-sm'>
                  Fund specific courses or training initiatives
                </p>
              </div>
              <Button
                variant='outline'
                size='sm'
                className='w-full'
                onClick={() => {
                  setNewContribution({ ...newContribution, targetGroup: 'specific-program' });
                  setShowContributeModal(true);
                }}
              >
                Contribute
              </Button>
            </div>
          </Card>
        </div>
      </Card>

      {/* Impact Analytics */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <Card className='p-6'>
          <div className='mb-6 flex items-center justify-between'>
            <h3>Impact Metrics</h3>
            <Button variant='outline' size='sm'>
              <Download className='mr-2 h-4 w-4' />
              Export Report
            </Button>
          </div>

          <div className='space-y-4'>
            {orgContributions.length > 0 ? (
              orgContributions.map((contrib: any) => (
                <Card key={contrib.id} className='bg-muted p-4'>
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <h4 className='text-sm'>{contrib.purpose}</h4>
                      <Badge>{contrib.status}</Badge>
                    </div>
                    <div className='grid grid-cols-2 gap-3 text-sm'>
                      <div>
                        <p className='text-muted-foreground'>Amount</p>
                        <p>
                          {contrib.currency} ${contrib.amount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className='text-muted-foreground'>Beneficiaries</p>
                        <p>{contrib.impact?.beneficiaries || 0}</p>
                      </div>
                      <div>
                        <p className='text-muted-foreground'>Target</p>
                        <p className='capitalize'>{contrib.targetGroup}</p>
                      </div>
                      <div>
                        <p className='text-muted-foreground'>Utilization</p>
                        <p>{contrib.impact?.fundUtilization || 0}%</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className='py-12 text-center'>
                <BarChart3 className='text-muted-foreground mx-auto mb-4 h-16 w-16' />
                <p className='text-muted-foreground'>No contributions yet</p>
                <Button
                  onClick={() => setShowContributeModal(true)}
                  variant='outline'
                  className='mt-4'
                >
                  Make Your First Contribution
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card className='p-6'>
          <h3 className='mb-6'>Fund Allocation</h3>

          <div className='space-y-4'>
            <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
              <div className='mb-2 flex items-center justify-between'>
                <span>Student Scholarships</span>
                <span className='text-xl'>
                  $
                  {orgContributions
                    .filter((c: any) => c.targetGroup === 'students')
                    .reduce((sum: any, c: any) => sum + c.amount, 0)
                    .toLocaleString()}
                </span>
              </div>
              <p className='text-sm text-blue-700'>
                Supporting {orgContributions.filter(c => c.targetGroup === 'students').length}{' '}
                students
              </p>
            </div>

            <div className='rounded-lg border border-green-200 bg-green-50 p-4'>
              <div className='mb-2 flex items-center justify-between'>
                <span>Instructor Support</span>
                <span className='text-xl'>
                  $
                  {orgContributions
                    .filter((c: any) => c.targetGroup === 'instructors')
                    .reduce((sum, c) => sum + c.amount, 0)
                    .toLocaleString()}
                </span>
              </div>
              <p className='text-sm text-green-700'>
                Enabling {orgContributions.filter(c => c.targetGroup === 'instructors').length}{' '}
                training programs
              </p>
            </div>

            <div className='rounded-lg border border-purple-200 bg-purple-50 p-4'>
              <div className='mb-2 flex items-center justify-between'>
                <span>Specific Programs</span>
                <span className='text-xl'>
                  $
                  {orgContributions
                    .filter(c => c.targetGroup === 'specific-program')
                    .reduce((sum, c) => sum + c.amount, 0)
                    .toLocaleString()}
                </span>
              </div>
              <p className='text-sm text-purple-700'>
                Sponsoring{' '}
                {orgContributions.filter(c => c.targetGroup === 'specific-program').length} courses
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Contribution Modal */}
      <Dialog open={showContributeModal} onOpenChange={setShowContributeModal}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Make a Contribution</DialogTitle>
            <DialogDescription>
              Support skills development by contributing to training programs
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div>
              <Label>Target Group</Label>
              <Select
                value={newContribution.targetGroup}
                onValueChange={(value: any) =>
                  setNewContribution({ ...newContribution, targetGroup: value })
                }
              >
                <SelectTrigger className='mt-2'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='students'>Students</SelectItem>
                  <SelectItem value='instructors'>Instructors</SelectItem>
                  <SelectItem value='specific-program'>Specific Program</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newContribution.targetGroup === 'specific-program' && (
              <div>
                <Label>Select Program</Label>
                <Select
                  value={newContribution.targetProgramId}
                  onValueChange={value =>
                    setNewContribution({ ...newContribution, targetProgramId: value })
                  }
                >
                  <SelectTrigger className='mt-2'>
                    <SelectValue placeholder='Choose a program' />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id || ''}>
                        {cls.classTitle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Contribution Amount (USD)</Label>
              <Input
                type='number'
                placeholder='0.00'
                value={newContribution.amount || ''}
                onChange={e =>
                  setNewContribution({
                    ...newContribution,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
                className='mt-2'
              />
            </div>

            <div>
              <Label>Purpose / Description</Label>
              <Textarea
                placeholder='Describe the purpose and intended impact of this contribution...'
                value={newContribution.purpose || ''}
                onChange={e => setNewContribution({ ...newContribution, purpose: e.target.value })}
                className='mt-2'
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setShowContributeModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitContribution}>Confirm Contribution</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganisationFundView;
