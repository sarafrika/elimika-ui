'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserProfile } from '@/context/profile-context';
import { useStudent } from '@/context/student-context';
import { CertificateData, certificatePDF } from '@/lib/certificate';
import { useQuery } from '@tanstack/react-query';
import {
  Award,
  Clock,
  Download,
  ExternalLink,
  Eye,
  Medal,
  Search,
  Share2,
  Star,
  Target,
  Trophy,
  Verified,
} from 'lucide-react';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { verifyCertificateOptions } from '../../../../../services/client/@tanstack/react-query.gen';
import { CertificateErrorModal } from './certificate-error-modal';
import { CertificateSuccessModal } from './certificate-success-modal';
pdfMake.vfs = pdfFonts.vfs;


// Mock certificates data
export const CERTIFICATES_DATA = {
  student: {
    name: 'Alice Johnson',
    studentId: 'SU2024-001',
    institution: 'Springfield University',
    totalCertificates: 4,
    skillsBadges: 12,
    overallRating: 4.8,
  },
  certificates: [
    {
      id: 'CERT-2024-001',
      certificateNumber: "CERT-2024-JAV-001234",
      title: 'Data Science Fundamentals',
      issuer: 'Springfield University',
      instructor: 'Dr. Lisa Chen',
      issueDate: '2024-12-20',
      completionDate: '2024-12-18',
      courseDuration: '12 weeks',
      creditsEarned: 3,
      grade: 'A (94%)',
      type: 'Course Completion',
      category: 'Technology',
      verificationUrl: 'https://verify.springfield.edu/cert/CERT-2024-001',
      skills: ['Python', 'Data Analysis', 'Machine Learning', 'Pandas', 'Visualization'],
      description:
        'Comprehensive course covering data science fundamentals including statistical analysis, machine learning algorithms, and data visualization techniques.',
      logo: '',
      signature: 'Dr. Lisa Chen',
      accreditation: 'AACSB Accredited',
      status: 'active',
      downloadCount: 3,
      shareCount: 1,
      blockchain_verified: true,
    },
    {
      id: 'CERT-2024-002',
      certificateNumber: "CERT-2024-JAV-001234",
      title: 'Advanced React Development',
      issuer: 'Springfield University',
      instructor: 'John Smith',
      issueDate: '2024-11-15',
      completionDate: '2024-11-12',
      courseDuration: '8 weeks',
      creditsEarned: 4,
      grade: 'B+ (85%)',
      type: 'Course Completion',
      category: 'Technology',
      verificationUrl: 'https://verify.springfield.edu/cert/CERT-2024-002',
      skills: ['React', 'TypeScript', 'Redux', 'Next.js', 'Testing'],
      description:
        'Advanced React development course focusing on modern patterns, performance optimization, and enterprise-level application development.',
      logo: '',
      signature: 'John Smith',
      accreditation: 'Industry Recognized',
      status: 'active',
      downloadCount: 5,
      shareCount: 2,
      blockchain_verified: true,
    },
    {
      id: 'BADGE-2024-003',
      certificateNumber: "CERT-2024-JAV-001234",
      title: 'Digital Marketing Strategy',
      issuer: 'Springfield University',
      instructor: 'Mike Wilson',
      issueDate: '2024-08-20',
      completionDate: '2024-08-18',
      courseDuration: '6 weeks',
      creditsEarned: 3,
      grade: 'B+ (78%)',
      type: 'Professional Badge',
      category: 'Business',
      verificationUrl: 'https://verify.springfield.edu/badge/BADGE-2024-003',
      skills: ['SEO', 'Social Media Marketing', 'Content Strategy', 'Analytics'],
      description:
        'Comprehensive digital marketing course covering modern strategies, tools, and best practices for online marketing success.',
      logo: '',
      signature: 'Mike Wilson',
      accreditation: 'Google Partner Certified',
      status: 'active',
      downloadCount: 2,
      shareCount: 3,
      blockchain_verified: false,
    },
    {
      id: 'SKILL-2024-004',
      certificateNumber: "CERT-2024-JAV-001234",
      title: 'Python Programming Specialist',
      issuer: 'Tech Skills Consortium',
      instructor: 'Various Instructors',
      issueDate: '2024-09-30',
      completionDate: '2024-09-28',
      courseDuration: '4 weeks',
      creditsEarned: 2,
      grade: 'A- (88%)',
      type: 'Skill Certification',
      category: 'Technology',
      verificationUrl: 'https://verify.techskills.org/skill/SKILL-2024-004',
      skills: ['Python', 'Object-Oriented Programming', 'Data Structures', 'Algorithms'],
      description:
        'Specialized certification in Python programming demonstrating proficiency in core concepts and advanced programming techniques.',
      logo: '',
      signature: 'Tech Skills Consortium',
      accreditation: 'Industry Standard',
      status: 'active',
      downloadCount: 4,
      shareCount: 1,
      blockchain_verified: true,
    },
  ],
  inProgress: [
    {
      id: 'PROG-001',
      title: 'Full Stack Development Bootcamp',
      issuer: 'Springfield University',
      instructor: 'Sarah Martinez',
      expectedCompletion: '2025-02-15',
      progress: 65,
      type: 'Bootcamp Certificate',
      category: 'Technology',
      requirements: ['Complete 10 projects', 'Pass final assessment', '80% attendance'],
      currentPhase: 'Backend Development',
    },
    {
      id: 'PROG-002',
      title: 'Project Management Professional',
      issuer: 'Professional Institute',
      instructor: 'Robert Chen',
      expectedCompletion: '2025-03-30',
      progress: 30,
      type: 'Professional Certification',
      category: 'Business',
      requirements: ['Complete coursework', 'Pass certification exam', 'Submit capstone project'],
      currentPhase: 'Project Planning Fundamentals',
    },
  ],
};

export default function CertificatesPage() {
  const [activeTab, setActiveTab] = useState('earned');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  const studentData = useStudent();
  const profile = useUserProfile();

  const [openSuccessModal, setOpenSuccessModal] = useState(false);
  const [openErrorModal, setOpenErrorModal] = useState(false);
  const [verifyCertificateNumber, setVerifyCertificateNumber] = useState<string | null>(null)

  const { data, isError, isSuccess } = useQuery({
    ...verifyCertificateOptions({
      path: { certificateNumber: verifyCertificateNumber as string },
    }),
    enabled: !!verifyCertificateNumber,
  });

  useEffect(() => {
    if (isSuccess) {
      if (data?.success) setOpenSuccessModal(true);
      else setOpenErrorModal(true);
    }
    if (isError) setOpenErrorModal(true);
  }, [isSuccess, isError, data]);


  const { student, certificates, inProgress } = CERTIFICATES_DATA;

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch =
      searchTerm === '' ||
      cert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || cert.category === selectedCategory;
    const matchesType = selectedType === 'all' || cert.type === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Course Completion':
        return Award;
      case 'Professional Badge':
        return Medal;
      case 'Skill Certification':
        return Star;
      case 'Bootcamp Certificate':
        return Trophy;
      default:
        return Award;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Technology':
        return 'bg-blue-100 text-blue-800';
      case 'Business':
        return 'bg-green-100 text-green-800';
      case 'Design':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownloadCertificate = (cert: CertificateData) => {
    const doc = certificatePDF(cert);
    const pdf = pdfMake.createPdf(doc);
    pdf.download(
      `Elimika-${cert.id ? cert.id + "-" : ""}${new Date().getTime()}.pdf`
    );
  };

  const handleShare = (certificateId: string) => {
    toast.message(`Sharing certificate: ${certificateId}`);
    // Implement share functionality
  };

  const handleVerify = (certificateNumber: string) => {
    setVerifyCertificateNumber(certificateNumber)
  };

  return (
    <div className='min-h-screen'>
      {/* Header */}
      <div className='flex items-center justify-self-end'>
        <div className='text-right'>
          <p className='text-sm font-bold'>
            {profile?.first_name} {profile?.last_name}
          </p>
          <p className='text-muted-foreground text-xs'>Enrolled University or Institution</p>
        </div>
      </div>

      <div className='container mx-auto py-8'>
        {/* Achievement Summary */}
        <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-4'>
          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-muted-foreground text-sm'>Total Certificates</p>
                  <p className='text-primary text-2xl font-bold'>{student.totalCertificates}</p>
                </div>
                <Award className='text-primary h-8 w-8' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-muted-foreground text-sm'>Skills Badges</p>
                  <p className='text-2xl font-bold text-yellow-600'>{student.skillsBadges}</p>
                </div>
                <Medal className='h-8 w-8 text-yellow-600' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-muted-foreground text-sm'>In Progress</p>
                  <p className='text-2xl font-bold text-blue-600'>{inProgress.length}</p>
                </div>
                <Clock className='h-8 w-8 text-blue-600' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-muted-foreground text-sm'>Overall Rating</p>
                  <div className='flex items-center gap-1'>
                    <p className='text-2xl font-bold text-orange-600'>{student.overallRating}</p>
                    <Star className='h-5 w-5 fill-current text-orange-600' />
                  </div>
                </div>
                <Star className='h-8 w-8 text-orange-600' />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='mb-3 grid w-full grid-cols-2'>
            <TabsTrigger value='earned'>Earned Certificates</TabsTrigger>
            <TabsTrigger value='in-progress'>In Progress</TabsTrigger>
            {/* <TabsTrigger value='gallery'>Certificate Gallery</TabsTrigger> */}
          </TabsList>

          <TabsContent value='earned' className='space-y-6'>
            {/* Filters */}
            <div className='flex flex-wrap items-center gap-4'>
              <div className='relative min-w-64 flex-1'>
                <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
                <Input
                  placeholder='Search certificates or skills...'
                  className='pl-10'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className='w-48'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Categories</SelectItem>
                  <SelectItem value='Technology'>Technology</SelectItem>
                  <SelectItem value='Business'>Business</SelectItem>
                  <SelectItem value='Design'>Design</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className='w-48'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Types</SelectItem>
                  <SelectItem value='Course Completion'>Course Completion</SelectItem>
                  <SelectItem value='Professional Badge'>Professional Badge</SelectItem>
                  <SelectItem value='Skill Certification'>Skill Certification</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Certificates Grid */}
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
              {filteredCertificates.map(certificate => {
                const TypeIcon = getTypeIcon(certificate.type);
                return (
                  <Card
                    key={certificate.id}
                    className='overflow-hidden transition-shadow hover:shadow-lg'
                  >
                    <CardHeader className='pb-4'>
                      <div className='flex items-start justify-between'>
                        <div className='flex items-start gap-3'>
                          <div className='bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg'>
                            <TypeIcon className='text-primary h-6 w-6' />
                          </div>
                          <div>
                            <CardTitle className='text-lg'>{certificate.title}</CardTitle>
                            <p className='text-muted-foreground text-sm'>{certificate.issuer}</p>
                            <p className='text-muted-foreground text-xs'>
                              Instructor: {certificate.instructor}
                            </p>
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          {certificate.blockchain_verified && (
                            <Badge className='bg-green-100 text-green-800'>
                              <Verified className='mr-1 h-3 w-3' />
                              Verified
                            </Badge>
                          )}
                          <Badge className={getCategoryColor(certificate.category)}>
                            {certificate.category}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      {/* Certificate Preview */}
                      <div className='rounded-lg border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-100 p-6'>
                        <div className='space-y-2 text-center'>
                          <div className='bg-primary/20 mx-auto flex h-16 w-16 items-center justify-center rounded-full'>
                            <Award className='text-primary h-8 w-8' />
                          </div>
                          <h3 className='text-primary font-bold'>Certificate of Achievement</h3>
                          <p className='text-sm'>This certifies that</p>
                          <p className='text-lg font-bold'>{student.name}</p>
                          <p className='text-sm'>has successfully completed</p>
                          <p className='font-bold'>{certificate.title}</p>
                          <div className='text-muted-foreground flex items-center justify-center gap-4 pt-2 text-xs'>
                            <span>Grade: {certificate.grade}</span>
                            <span>•</span>
                            <span>{certificate.creditsEarned} Credits</span>
                          </div>
                          <div className='flex items-center justify-center gap-4 text-xs'>
                            <span>
                              Completed: {new Date(certificate.completionDate).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <span>
                              Issued: {new Date(certificate.issueDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Certificate Details */}
                      <div className='space-y-3'>
                        <div>
                          <p className='text-muted-foreground mb-2 text-sm'>Skills Covered:</p>
                          <div className='flex flex-wrap gap-1'>
                            {certificate.skills.map(skill => (
                              <Badge key={skill} variant='outline' className='text-xs'>
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className='grid grid-cols-2 gap-4 text-sm'>
                          <div>
                            <span className='text-muted-foreground'>Duration:</span>
                            <p className='font-medium'>{certificate.courseDuration}</p>
                          </div>
                          <div>
                            <span className='text-muted-foreground'>Certificate ID:</span>
                            <p className='font-mono text-xs font-medium'>{certificate.id}</p>
                          </div>
                        </div>

                        <div>
                          <span className='text-muted-foreground text-sm'>Accreditation:</span>
                          <p className='text-sm font-medium'>{certificate.accreditation}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className='flex gap-2 pt-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          className='flex-1'
                          onClick={() => handleDownloadCertificate(certificate as any)}
                        >
                          <Download className='mr-1 h-3 w-3' />
                          Download
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleShare(certificate.id)}
                        >
                          <Share2 className='mr-1 h-3 w-3' />
                          Share
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleVerify(certificate.certificateNumber)}
                        >
                          <ExternalLink className='mr-1 h-3 w-3' />
                          Verify
                        </Button>
                      </div>

                      {/* Usage Statistics */}
                      <div className='text-muted-foreground flex justify-between border-t pt-2 text-xs'>
                        <span>Downloaded {certificate.downloadCount} times</span>
                        <span>Shared {certificate.shareCount} times</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredCertificates.length === 0 && (
              <div className='py-12 text-center'>
                <Award className='text-muted-foreground mx-auto mb-4 h-16 w-16 opacity-50' />
                <h3 className='mb-2'>No certificates found</h3>
                <p className='text-muted-foreground'>
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value='in-progress' className='space-y-6'>
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
              {inProgress.map(program => {
                const TypeIcon = getTypeIcon(program.type);
                return (
                  <Card key={program.id}>
                    <CardHeader>
                      <div className='flex items-start gap-3'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100'>
                          <TypeIcon className='h-6 w-6 text-blue-600' />
                        </div>
                        <div>
                          <CardTitle className='text-lg'>{program.title}</CardTitle>
                          <p className='text-muted-foreground text-sm'>{program.issuer}</p>
                          <p className='text-muted-foreground text-xs'>
                            Instructor: {program.instructor}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div>
                        <div className='mb-2 flex items-center justify-between'>
                          <span className='text-sm'>Progress</span>
                          <span className='text-sm font-medium'>{program.progress}%</span>
                        </div>
                        <Progress value={program.progress} className='h-3' />
                        <p className='text-muted-foreground mt-1 text-xs'>
                          Current: {program.currentPhase}
                        </p>
                      </div>

                      <div>
                        <p className='text-muted-foreground mb-2 text-sm'>Requirements:</p>
                        <ul className='space-y-1'>
                          {program.requirements.map((req, index) => (
                            <li key={index} className='flex items-center gap-2 text-sm'>
                              <div className='bg-muted h-2 w-2 rounded-full' />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className='flex justify-between text-sm'>
                        <span className='text-muted-foreground'>Expected Completion:</span>
                        <span className='font-medium'>
                          {new Date(program.expectedCompletion).toLocaleDateString()}
                        </span>
                      </div>

                      <Button className='w-full'>
                        <Target className='mr-2 h-4 w-4' />
                        Continue Learning
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value='gallery' className='space-y-6'>
            {/* Certificate Gallery - Display certificates in a more visual format */}
            <div className='mb-8 text-center'>
              <h2 className='mb-2'>Certificate Gallery</h2>
              <p className='text-muted-foreground'>
                A visual showcase of your academic achievements and professional certifications
              </p>
            </div>

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3'>
              {certificates.map(certificate => {
                const TypeIcon = getTypeIcon(certificate.type);
                return (
                  <Card
                    key={certificate.id}
                    className='overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl'
                  >
                    <div className='from-primary/5 to-primary/10 bg-gradient-to-br p-8'>
                      <div className='space-y-3 text-center'>
                        <div className='bg-primary/20 mx-auto flex h-20 w-20 items-center justify-center rounded-full'>
                          <TypeIcon className='text-primary h-10 w-10' />
                        </div>
                        <div>
                          <h3 className='text-primary text-lg font-bold'>
                            Certificate of Achievement
                          </h3>
                          <p className='text-muted-foreground text-sm'>This certifies that</p>
                        </div>
                        <div>
                          <p className='text-xl font-bold'>{student.name}</p>
                          <p className='text-muted-foreground text-sm'>
                            has successfully completed
                          </p>
                        </div>
                        <div>
                          <p className='text-lg font-bold'>{certificate.title}</p>
                          <p className='text-muted-foreground text-sm'>{certificate.issuer}</p>
                        </div>
                        <div className='flex items-center justify-center gap-4 text-xs'>
                          <span>Grade: {certificate.grade}</span>
                          <span>•</span>
                          <span>{certificate.creditsEarned} Credits</span>
                        </div>
                        <div className='text-muted-foreground text-xs'>
                          Completed: {new Date(certificate.completionDate).toLocaleDateString()}
                        </div>
                        <div className='pt-2'>
                          <p className='text-xs font-medium'>{certificate.signature}</p>
                          <p className='text-muted-foreground text-xs'>Course Instructor</p>
                        </div>
                      </div>
                    </div>
                    <CardContent className='pt-4'>
                      <div className='flex gap-2'>
                        <Button variant='outline' size='sm' className='flex-1'>
                          <Eye className='mr-1 h-3 w-3' />
                          View
                        </Button>
                        <Button onClick={() => handleDownloadCertificate(certificate as any)} variant='outline' size='sm'>
                          <Download className='h-3 w-3' />
                        </Button>
                        <Button variant='outline' size='sm'>
                          <Share2 className='h-3 w-3' />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        <CertificateSuccessModal
          open={openSuccessModal}
          onOpenChange={setOpenSuccessModal}
          data={data}
        />
        <CertificateErrorModal
          open={openErrorModal}
          onOpenChange={setOpenErrorModal}
          message={data?.message}
        />
      </div>
    </div>
  );
}
