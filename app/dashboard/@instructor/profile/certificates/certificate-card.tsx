import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Download, ExternalLink, Share2, Verified } from 'lucide-react';
import { getCategoryColor, getTypeIcon } from './page';

type Certificate = {
  id: string;
  title: string;
  issuer: string;
  instructor: string;
  type: string;
  category: string;
  accreditation: string;
  grade: string;
  creditsEarned: number;
  skills: string[];
  courseDuration: string;
  blockchain_verified: boolean;
  completionDate: string;
  issueDate: string;
  verificationUrl: string;
  downloadCount: number;
  shareCount: number;
};

interface CertificateCardProps {
  certificate: Certificate;
  studentName: string;
  onDownload: (id: string) => void;
  onShare: (id: string) => void;
  onVerify: (url: string) => void;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({
  certificate,
  studentName,
  onDownload,
  onShare,
  onVerify,
}) => {
  const TypeIcon = getTypeIcon(certificate.type);

  return (
    <Card className='overflow-hidden transition-shadow hover:shadow-lg'>
      <CardHeader className='pb-4'>
        <div className='flex items-start justify-between'>
          <div className='flex items-start gap-3'>
            <div className='bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg'>
              <TypeIcon className='text-primary h-6 w-6' />
            </div>
            <div>
              <CardTitle className='text-lg'>{certificate.title}</CardTitle>
              <p className='text-muted-foreground text-sm'>{certificate.issuer}</p>
              <p className='text-muted-foreground text-xs'>Instructor: {certificate.instructor}</p>
            </div>
          </div>
        </div>
        <div className='mt-2 flex items-center gap-2'>
          {certificate.blockchain_verified && (
            <Badge className='bg-green-100 text-green-800'>
              <Verified className='mr-1 h-3 w-3' />
              Verified
            </Badge>
          )}
          <Badge className={getCategoryColor(certificate.category)}>{certificate.category}</Badge>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Certificate Preview */}
        <div className='rounded-lg border-2 border-dashed border-primary/30 bg-card p-6'>
          <div className='space-y-2 text-center'>
            <div className='bg-primary/20 mx-auto flex h-16 w-16 items-center justify-center rounded-full'>
              <Award className='text-primary h-8 w-8' />
            </div>
            <h3 className='text-primary font-bold'>Certificate of Achievement</h3>
            <p className='text-sm'>This certifies that</p>
            <p className='text-lg font-bold'>{studentName}</p>
            <p className='text-sm'>has successfully completed</p>
            <p className='font-bold'>{certificate.title}</p>
            <div className='text-muted-foreground flex items-center justify-center gap-4 pt-2 text-xs'>
              <span>Grade: {certificate.grade}</span>
              <span>•</span>
              <span>{certificate.creditsEarned} Credits</span>
            </div>
            <div className='flex items-center justify-center gap-4 text-xs'>
              <span>Completed: {new Date(certificate.completionDate).toLocaleDateString()}</span>
              <span>•</span>
              <span>Issued: {new Date(certificate.issueDate).toLocaleDateString()}</span>
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
            onClick={() => onDownload(certificate.id)}
          >
            <Download className='mr-1 h-3 w-3' />
            Download
          </Button>
          <Button variant='outline' size='sm' onClick={() => onShare(certificate.id)}>
            <Share2 className='mr-1 h-3 w-3' />
            Share
          </Button>
          <Button variant='outline' size='sm' onClick={() => onVerify(certificate.verificationUrl)}>
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
};
