'use client';

import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useInstructor } from '@/context/instructor-context';
import { getInstructorDocumentsOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { Award, Eye, Medal, Star, Target, Trophy, Verified } from 'lucide-react';
import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Dialog, DialogContent, DialogDescription } from '../../../../../components/ui/dialog';
import { Progress } from '../../../../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../../components/ui/tabs';
import { CERTIFICATES_DATA } from '../../../@student/certificates/_components/certificate-page';
import { CertificateCard } from './certificate-card';

interface Certificate {
  id: number;
  name: string;
  fileUrl: string;
}

export const getTypeIcon = (type: string) => {
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

export const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Technology':
      return 'bg-primary/10 text-primary';
    case 'Business':
      return 'bg-success/10 text-success';
    case 'Design':
      return 'bg-accent/10 text-accent';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export default function CertificatesPage() {
  const instructor = useInstructor();
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'profile', title: 'Profile', url: '/dashboard/profile' },
      {
        id: 'certifciates',
        title: 'Certifciates',
        url: '/dashboard/profile/certifciates',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const [activeTab, setActiveTab] = useState('verified');
  const [searchTerm, _setSearchTerm] = useState('');
  const [selectedCategory, _setSelectedCategory] = useState('all');
  const [selectedType, _setSelectedType] = useState('all');
  const [_viewMode, _setViewMode] = useState('grid');
  const [viewCertificate, setViewCertificate] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<any | null>(null);

  const { certificates, inProgress } = CERTIFICATES_DATA;

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch =
      searchTerm === '' ||
      cert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || cert.category === selectedCategory;
    const matchesType = selectedType === 'all' || cert.type === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  const handleDownload = (certificateId: string) => {
    toast.message(`Downloading certificate: ${certificateId}`);
    // Implement download functionality
  };

  const handleShare = (certificateId: string) => {
    toast.message(`Sharing certificate: ${certificateId}`);
    // Implement share functionality
  };

  const handleVerify = (verificationUrl: string) => {
    window.open(verificationUrl, '_blank');
  };

  const {
    data: documents,
    isLoading,
    isFetching,
  } = useQuery({
    ...getInstructorDocumentsOptions({ path: { instructorUuid: instructor?.uuid as string } }),
    enabled: !!instructor?.uuid,
  });
  const _loading = isLoading || isFetching;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const uploadedFile = files[0];
    const fileUrl = URL.createObjectURL(uploadedFile as any);

    const _newCertificate: Certificate = {
      id: Date.now(),
      name: uploadedFile?.name as any,
      fileUrl,
    };

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className='mx-auto space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold'>Certificates</h1>
        <p className='text-muted-foreground text-sm'>
          Upload and manage your professional certificates.
        </p>
      </div>

      <div className='rounded-md border-1 border-dashed border-border p-6 text-center transition hover:bg-muted/50 dark:hover:bg-muted/30'>
        <input
          ref={fileInputRef}
          type='file'
          accept='.pdf,.jpg,.jpeg,.png'
          onChange={handleUpload}
          className='mx-auto block text-sm text-foreground file:mr-4 file:rounded file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/15 dark:file:bg-primary/20 dark:file:text-primary dark:hover:file:bg-primary/25'
        />
        <p className='mt-2 text-sm text-muted-foreground'>Upload PDF or image files</p>
      </div>

      <div className='container mx-auto py-8'>
        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='mb-3 grid w-full grid-cols-2'>
            <TabsTrigger value='verified'>Verified Certificates</TabsTrigger>
            <TabsTrigger value='pending'>Pending</TabsTrigger>
          </TabsList>

          <TabsContent value='verified' className='space-y-6'>
            {/* Certificates Grid */}
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
              {filteredCertificates.map(certificate => {
                const TypeIcon = getTypeIcon(certificate.type);
                return (
                  <Card
                    key={certificate.id}
                    className='overflow-hidden transition-shadow hover:shadow-lg'
                  >
                    <CardHeader className='pb-2'>
                      <div className='flex items-start justify-between'>
                        <div className='flex items-start gap-3'>
                          <div className='bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg'>
                            <TypeIcon className='h-6 w-6 text-primary' />
                          </div>
                          <div>
                            <CardTitle className='text-lg'>{certificate.title}</CardTitle>
                            <p className='text-muted-foreground text-sm'>{certificate.issuer}</p>
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          {certificate.blockchain_verified && (
                            <Badge className='bg-success/10 text-success'>
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

                    <CardContent className='space-y-3'>
                      <div className='flex gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          className='flex-1'
                          onClick={() => {
                            setViewCertificate(true);
                            setSelectedCertificate(certificate);
                          }}
                        >
                          <Eye className='mr-1 h-3 w-3' />
                          View Certificate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value='pending' className='space-y-6'>
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
              {inProgress.map(program => {
                const TypeIcon = getTypeIcon(program.type);
                return (
                  <Card key={program.id}>
                    <CardHeader>
                      <div className='flex items-start gap-3'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10'>
                          <TypeIcon className='h-6 w-6 text-primary' />
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
        </Tabs>

        {viewCertificate && selectedCertificate && (
          <Dialog open={viewCertificate} onOpenChange={open => setViewCertificate(open)}>
            <DialogContent className='max-h-[90vh] max-w-5xl overflow-y-auto'>
              <DialogDescription> </DialogDescription>
              <CertificateCard
                certificate={selectedCertificate}
                studentName={instructor?.full_name as string}
                onDownload={handleDownload}
                onShare={handleShare}
                onVerify={handleVerify}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
