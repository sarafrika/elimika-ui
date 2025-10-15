
import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useDifficultyLevels } from '@/hooks/use-difficultyLevels';
import { getAllCoursesOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Search, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface CourseProposalProps {
    data: any;
    onDataChange: (data: any) => void;
    selectedCourse: any;
    onCourseSelect?: (course: any | null) => void;
}

const CATEGORIES = [
    'All Categories',
    'Music',
    'Violin',
    'Piano',
    'Health & Fitness',
    'Arts & Crafts',
    'Languages',
    'Testing'

];

const TARGET_AUDIENCES = [
    'K-12 Students',
    'University Students',
    'Young Professionals',
    'Mid-Career Professionals',
    'Senior Professionals',
    'Teachers/Educators',
    'Entrepreneurs',
    'Job Seekers',
    'Retirees',
    'General Public'
];

const COURSE_FORMATS = [
    'Workshop (1-3 days)',
    'Bootcamp (1-4 weeks)',
    'Short Course (1-3 months)',
    'Long-term Program (3+ months)',
    'School Curriculum Integration',
    'Online Self-Paced Module',
    'Certification Program',
    'Professional Development Series'
];

export function CourseProposal({ data, onCourseSelect, onDataChange }: CourseProposalProps) {
    const { difficultyMap } = useDifficultyLevels();

    const { data: trainCourses } = useQuery({
        ...getAllCoursesOptions({
            query: { pageable: { page: 0, size: 100 } }
        }),
    })
    // const { data: trainCourses } = useQuery({
    //     ...getCoursesByInstructorOptions({
    //         query: { pageable: { page: 0, size: 100 } }, path: { instructorUuid: data?.uuid as string }
    //     }),
    //     enabled: !!data?.uuid
    // })

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All Categories');
    const [selectedCourse, setSelectedCourse] = useState(data?.selectedCourse || null);
    const [targetAudience, setTargetAudience] = useState<string[]>(data?.targetAudience || []);

    const filteredCourses = trainCourses?.data?.content?.filter(course => {
        const matchesSearch = searchTerm === '' ||
            course?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course?.objectives?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'All Categories' ||
            course?.category_names?.includes(selectedCategory);

        return matchesSearch && matchesCategory;
    });

    const handleCourseSelect = (course: any) => {
        setSelectedCourse(course);

        // Update form data
        onDataChange({
            ...data,
            selectedCourse: course,
            category: course.category,
            subcategory: course.subcategory
        });

        // Notify parent specifically about selected course
        if (onCourseSelect) {
            onCourseSelect(course);
        }
    };


    const handleTargetAudienceChange = (audience: string, checked: boolean) => {
        let newAudience;
        if (checked) {
            newAudience = [...targetAudience, audience];
        } else {
            newAudience = targetAudience.filter(a => a !== audience);
        }
        setTargetAudience(newAudience);
        onDataChange({ ...data, targetAudience: newAudience });
    };

    const handleCourseProposal = () => {
        toast.message(selectedCourse)
        toast.message(targetAudience)
    }


    return (
        <div className="space-y-6">
            {/* Course Selection */}
            <Card>
                <CardHeader>
                    <CardTitle>Select Course to Train</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Search and Filter */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                placeholder="Search for courses..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map((category) => (
                                    <SelectItem key={category} value={category}>
                                        {category}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Selected Course Display */}
                    {selectedCourse && (
                        <Card className="border-primary/20 bg-primary/5">
                            <CardContent className="pt-4 pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <BookOpen className="w-5 h-5 text-primary mb-2" />
                                        <h4 className="text-primary">
                                            {selectedCourse.name.charAt(0).toUpperCase() + selectedCourse.name.slice(1)}
                                        </h4>
                                        <div className="text-sm text-muted-foreground mb-2">
                                            <RichTextRenderer htmlString={selectedCourse.description} maxChars={100} />
                                        </div>
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

                                            <Badge variant="outline">{selectedCourse.total_duration_display}</Badge>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedCourse(null);
                                            onDataChange({ ...data, selectedCourse: null });
                                        }}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Available Courses */}
                    {!selectedCourse && (
                        <div className="space-y-4">
                            <h4>Available Courses</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                                {filteredCourses?.map((course: any) => (
                                    <Card
                                        key={course.uuid}
                                        className="cursor-pointer hover:shadow-md transition-shadow"
                                        onClick={() => handleCourseSelect(course)}
                                    >
                                        <CardContent className="pt-6">
                                            <div className="flex items-start gap-3">
                                                <BookOpen className="w-5 h-5 text-primary mt-1" />
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-medium mb-1">
                                                        {course.name.charAt(0).toUpperCase() + course.name.slice(1)}
                                                    </h4>
                                                    <div className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                                        <RichTextRenderer htmlString={course?.description} />
                                                    </div>
                                                    <div className="flex flex-col gap-1 flex-wrap">
                                                        <div>
                                                            {course.category_names.map((category: string, index: number) => (
                                                                <Badge key={index} variant="outline" className="text-xs mr-1">
                                                                    {category}
                                                                </Badge>
                                                            ))}
                                                        </div>

                                                        <div>
                                                            {difficultyMap && course.difficulty_uuid && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    {difficultyMap[course.difficulty_uuid]}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {filteredCourses?.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>No courses found matching your criteria</p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Course Proposal Details */}
            {selectedCourse && (
                <>
                    {/* Target Audience */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Target Audience</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {TARGET_AUDIENCES.map((audience) => (
                                    <div key={audience} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={audience}
                                            checked={targetAudience.includes(audience)}
                                            onCheckedChange={(checked) => handleTargetAudienceChange(audience, checked as boolean)}
                                        />
                                        <Label htmlFor={audience} className="text-sm cursor-pointer">
                                            {audience}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Course Format */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Proposed Course Format</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Training Format</Label>
                                <Select onValueChange={(value) => onDataChange({ ...data, courseFormat: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select training format" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {COURSE_FORMATS.map((format) => (
                                            <SelectItem key={format} value={format}>
                                                {format}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="proposedDuration">Proposed Duration</Label>
                                    <Input
                                        id="proposedDuration"
                                        placeholder="e.g., 8 weeks, 40 hours"
                                        value={data?.proposedDuration || ''}
                                        onChange={(e) => onDataChange({ ...data, proposedDuration: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sessionLength">Session Length</Label>
                                    <Input
                                        id="sessionLength"
                                        placeholder="e.g., 2 hours, 90 minutes"
                                        value={data?.sessionLength || ''}
                                        onChange={(e) => onDataChange({ ...data, sessionLength: e.target.value })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Additional Proposal Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Additional Information (Optional)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="teachingApproach">Teaching Approach & Methodology</Label>
                                <Textarea
                                    id="teachingApproach"
                                    placeholder="Describe your teaching approach, methodology, and how you plan to deliver this course..."
                                    rows={4}
                                    value={data?.teachingApproach || ''}
                                    onChange={(e) => onDataChange({ ...data, teachingApproach: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="uniqueValue">What makes your approach unique?</Label>
                                <Textarea
                                    id="uniqueValue"
                                    placeholder="Explain what unique value, experience, or perspective you bring to teaching this course..."
                                    rows={3}
                                    value={data?.uniqueValue || ''}
                                    onChange={(e) => onDataChange({ ...data, uniqueValue: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="learningOutcomes">Expected Learning Outcomes</Label>
                                <Textarea
                                    id="learningOutcomes"
                                    placeholder="List the specific skills and knowledge students will gain from your training..."
                                    rows={3}
                                    value={data?.learningOutcomes || ''}
                                    onChange={(e) => onDataChange({ ...data, learningOutcomes: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="previousExperience">Previous Experience with this Subject</Label>
                                <Textarea
                                    id="previousExperience"
                                    placeholder="Describe your previous experience teaching or working in this subject area..."
                                    rows={3}
                                    value={data?.previousExperience || ''}
                                    onChange={(e) => onDataChange({ ...data, previousExperience: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className='flex justify-end'>
                        <Button onClick={handleCourseProposal}>Save Changes</Button>
                    </div>
                </>
            )}
        </div>
    );
}