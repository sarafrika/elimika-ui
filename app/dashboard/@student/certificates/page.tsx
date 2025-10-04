'use client'

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    Verified
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useUserProfile } from '../../../../context/profile-context';
import { useStudent } from '../../../../context/student-context';

// Mock certificates data
const CERTIFICATES_DATA = {
    student: {
        name: 'Alice Johnson',
        studentId: 'SU2024-001',
        institution: 'Springfield University',
        totalCertificates: 4,
        skillsBadges: 12,
        overallRating: 4.8
    },
    certificates: [
        {
            id: 'CERT-2024-001',
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
            description: 'Comprehensive course covering data science fundamentals including statistical analysis, machine learning algorithms, and data visualization techniques.',
            logo: '',
            signature: 'Dr. Lisa Chen',
            accreditation: 'AACSB Accredited',
            status: 'active',
            downloadCount: 3,
            shareCount: 1,
            blockchain_verified: true
        },
        {
            id: 'CERT-2024-002',
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
            description: 'Advanced React development course focusing on modern patterns, performance optimization, and enterprise-level application development.',
            logo: '',
            signature: 'John Smith',
            accreditation: 'Industry Recognized',
            status: 'active',
            downloadCount: 5,
            shareCount: 2,
            blockchain_verified: true
        },
        {
            id: 'BADGE-2024-003',
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
            description: 'Comprehensive digital marketing course covering modern strategies, tools, and best practices for online marketing success.',
            logo: '',
            signature: 'Mike Wilson',
            accreditation: 'Google Partner Certified',
            status: 'active',
            downloadCount: 2,
            shareCount: 3,
            blockchain_verified: false
        },
        {
            id: 'SKILL-2024-004',
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
            description: 'Specialized certification in Python programming demonstrating proficiency in core concepts and advanced programming techniques.',
            logo: '',
            signature: 'Tech Skills Consortium',
            accreditation: 'Industry Standard',
            status: 'active',
            downloadCount: 4,
            shareCount: 1,
            blockchain_verified: true
        }
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
            currentPhase: 'Backend Development'
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
            currentPhase: 'Project Planning Fundamentals'
        }
    ]
};

export default function CertificatesPage() {
    const [activeTab, setActiveTab] = useState('earned');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedType, setSelectedType] = useState('all');
    const [viewMode, setViewMode] = useState('grid'); // grid or list

    const studentData = useStudent()
    const profile = useUserProfile()

    const { student, certificates, inProgress } = CERTIFICATES_DATA;

    const filteredCertificates = certificates.filter(cert => {
        const matchesSearch = searchTerm === '' ||
            cert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cert.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCategory = selectedCategory === 'all' || cert.category === selectedCategory;
        const matchesType = selectedType === 'all' || cert.type === selectedType;

        return matchesSearch && matchesCategory && matchesType;
    });

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Course Completion': return Award;
            case 'Professional Badge': return Medal;
            case 'Skill Certification': return Star;
            case 'Bootcamp Certificate': return Trophy;
            default: return Award;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'Technology': return 'bg-blue-100 text-blue-800';
            case 'Business': return 'bg-green-100 text-green-800';
            case 'Design': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

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

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-self-end">
                <div className="text-right">
                    <p className="text-sm font-bold">{profile?.first_name} {profile?.last_name}</p>
                    <p className="text-xs text-muted-foreground">{"University or Institution"}</p>
                </div>
            </div>

            <div className="container mx-auto py-8">
                {/* Achievement Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Certificates</p>
                                    <p className="text-2xl font-bold text-primary">{student.totalCertificates}</p>
                                </div>
                                <Award className="w-8 h-8 text-primary" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Skills Badges</p>
                                    <p className="text-2xl font-bold text-yellow-600">{student.skillsBadges}</p>
                                </div>
                                <Medal className="w-8 h-8 text-yellow-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">In Progress</p>
                                    <p className="text-2xl font-bold text-blue-600">{inProgress.length}</p>
                                </div>
                                <Clock className="w-8 h-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Overall Rating</p>
                                    <div className="flex items-center gap-1">
                                        <p className="text-2xl font-bold text-orange-600">{student.overallRating}</p>
                                        <Star className="w-5 h-5 text-orange-600 fill-current" />
                                    </div>
                                </div>
                                <Star className="w-8 h-8 text-orange-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3 mb-3">
                        <TabsTrigger value="earned">Earned Certificates</TabsTrigger>
                        <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                        <TabsTrigger value="gallery">Certificate Gallery</TabsTrigger>
                    </TabsList>

                    <TabsContent value="earned" className="space-y-6">
                        {/* Filters */}
                        <div className="flex flex-wrap gap-4 items-center">
                            <div className="relative flex-1 min-w-64">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    placeholder="Search certificates or skills..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    <SelectItem value="Technology">Technology</SelectItem>
                                    <SelectItem value="Business">Business</SelectItem>
                                    <SelectItem value="Design">Design</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger className="w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="Course Completion">Course Completion</SelectItem>
                                    <SelectItem value="Professional Badge">Professional Badge</SelectItem>
                                    <SelectItem value="Skill Certification">Skill Certification</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline">
                                <Download className="w-4 h-4 mr-2" />
                                Download All
                            </Button>
                        </div>

                        {/* Certificates Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {filteredCertificates.map(certificate => {
                                const TypeIcon = getTypeIcon(certificate.type);
                                return (
                                    <Card key={certificate.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                        <CardHeader className="pb-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                                        <TypeIcon className="w-6 h-6 text-primary" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-lg">{certificate.title}</CardTitle>
                                                        <p className="text-sm text-muted-foreground">{certificate.issuer}</p>
                                                        <p className="text-xs text-muted-foreground">Instructor: {certificate.instructor}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {certificate.blockchain_verified && (
                                                        <Badge className="bg-green-100 text-green-800">
                                                            <Verified className="w-3 h-3 mr-1" />
                                                            Verified
                                                        </Badge>
                                                    )}
                                                    <Badge className={getCategoryColor(certificate.category)}>
                                                        {certificate.category}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {/* Certificate Preview */}
                                            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-lg border-2 border-dashed border-blue-200">
                                                <div className="text-center space-y-2">
                                                    <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto flex items-center justify-center">
                                                        <Award className="w-8 h-8 text-primary" />
                                                    </div>
                                                    <h3 className="font-bold text-primary">Certificate of Achievement</h3>
                                                    <p className="text-sm">This certifies that</p>
                                                    <p className="font-bold text-lg">{student.name}</p>
                                                    <p className="text-sm">has successfully completed</p>
                                                    <p className="font-bold">{certificate.title}</p>
                                                    <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
                                                        <span>Grade: {certificate.grade}</span>
                                                        <span>•</span>
                                                        <span>{certificate.creditsEarned} Credits</span>
                                                    </div>
                                                    <div className="flex items-center justify-center gap-4 text-xs">
                                                        <span>Completed: {new Date(certificate.completionDate).toLocaleDateString()}</span>
                                                        <span>•</span>
                                                        <span>Issued: {new Date(certificate.issueDate).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Certificate Details */}
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-2">Skills Covered:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {certificate.skills.map(skill => (
                                                            <Badge key={skill} variant="outline" className="text-xs">
                                                                {skill}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-muted-foreground">Duration:</span>
                                                        <p className="font-medium">{certificate.courseDuration}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Certificate ID:</span>
                                                        <p className="font-medium font-mono text-xs">{certificate.id}</p>
                                                    </div>
                                                </div>

                                                <div>
                                                    <span className="text-muted-foreground text-sm">Accreditation:</span>
                                                    <p className="font-medium text-sm">{certificate.accreditation}</p>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2 pt-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1"
                                                    onClick={() => handleDownload(certificate.id)}
                                                >
                                                    <Download className="w-3 h-3 mr-1" />
                                                    Download
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleShare(certificate.id)}
                                                >
                                                    <Share2 className="w-3 h-3 mr-1" />
                                                    Share
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleVerify(certificate.verificationUrl)}
                                                >
                                                    <ExternalLink className="w-3 h-3 mr-1" />
                                                    Verify
                                                </Button>
                                            </div>

                                            {/* Usage Statistics */}
                                            <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                                                <span>Downloaded {certificate.downloadCount} times</span>
                                                <span>Shared {certificate.shareCount} times</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {filteredCertificates.length === 0 && (
                            <div className="text-center py-12">
                                <Award className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <h3 className="mb-2">No certificates found</h3>
                                <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="in-progress" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {inProgress.map(program => {
                                const TypeIcon = getTypeIcon(program.type);
                                return (
                                    <Card key={program.id}>
                                        <CardHeader>
                                            <div className="flex items-start gap-3">
                                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <TypeIcon className="w-6 h-6 text-blue-600" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg">{program.title}</CardTitle>
                                                    <p className="text-sm text-muted-foreground">{program.issuer}</p>
                                                    <p className="text-xs text-muted-foreground">Instructor: {program.instructor}</p>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm">Progress</span>
                                                    <span className="text-sm font-medium">{program.progress}%</span>
                                                </div>
                                                <Progress value={program.progress} className="h-3" />
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Current: {program.currentPhase}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-sm text-muted-foreground mb-2">Requirements:</p>
                                                <ul className="space-y-1">
                                                    {program.requirements.map((req, index) => (
                                                        <li key={index} className="flex items-center gap-2 text-sm">
                                                            <div className="w-2 h-2 bg-muted rounded-full" />
                                                            {req}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Expected Completion:</span>
                                                <span className="font-medium">
                                                    {new Date(program.expectedCompletion).toLocaleDateString()}
                                                </span>
                                            </div>

                                            <Button className="w-full">
                                                <Target className="w-4 h-4 mr-2" />
                                                Continue Learning
                                            </Button>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </TabsContent>

                    <TabsContent value="gallery" className="space-y-6">
                        {/* Certificate Gallery - Display certificates in a more visual format */}
                        <div className="text-center mb-8">
                            <h2 className="mb-2">Certificate Gallery</h2>
                            <p className="text-muted-foreground">
                                A visual showcase of your academic achievements and professional certifications
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {certificates.map(certificate => {
                                const TypeIcon = getTypeIcon(certificate.type);
                                return (
                                    <Card key={certificate.id} className="overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
                                        <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-8">
                                            <div className="text-center space-y-3">
                                                <div className="w-20 h-20 bg-primary/20 rounded-full mx-auto flex items-center justify-center">
                                                    <TypeIcon className="w-10 h-10 text-primary" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-primary text-lg">Certificate of Achievement</h3>
                                                    <p className="text-sm text-muted-foreground">This certifies that</p>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-xl">{student.name}</p>
                                                    <p className="text-sm text-muted-foreground">has successfully completed</p>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-lg">{certificate.title}</p>
                                                    <p className="text-sm text-muted-foreground">{certificate.issuer}</p>
                                                </div>
                                                <div className="flex items-center justify-center gap-4 text-xs">
                                                    <span>Grade: {certificate.grade}</span>
                                                    <span>•</span>
                                                    <span>{certificate.creditsEarned} Credits</span>
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Completed: {new Date(certificate.completionDate).toLocaleDateString()}
                                                </div>
                                                <div className="pt-2">
                                                    <p className="text-xs font-medium">{certificate.signature}</p>
                                                    <p className="text-xs text-muted-foreground">Course Instructor</p>
                                                </div>
                                            </div>
                                        </div>
                                        <CardContent className="pt-4">
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" className="flex-1">
                                                    <Eye className="w-3 h-3 mr-1" />
                                                    View
                                                </Button>
                                                <Button variant="outline" size="sm">
                                                    <Download className="w-3 h-3" />
                                                </Button>
                                                <Button variant="outline" size="sm">
                                                    <Share2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}