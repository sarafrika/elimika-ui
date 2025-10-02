import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, FileQuestion } from 'lucide-react';
import { useState } from 'react';
import HTMLTextPreview from '../../../../../components/editors/html-text-preview';
import { Button } from '../../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select';
import Spinner from '../../../../../components/ui/spinner';
import { useCourseLessonsWithContent } from '../../../../../hooks/use-courselessonwithcontent';
import { getResourceIcon } from '../../../../../lib/resources-icon';
import { getClassDefinitionOptions, getCourseLessonsOptions } from '../../../../../services/client/@tanstack/react-query.gen';
import { ClassData } from './academic-period-form';

interface ScheduleFormProps {
    data: Partial<ClassData>;
    onUpdate: (updates: Partial<ClassData>) => void;
    onNext: () => void;
    onPrev: () => void;
}

const instructors = [
    'Fetch org. instructors',
];

export function ScheduleForm({ data, onUpdate, onNext, onPrev }: ScheduleFormProps) {
    const searchParams = new URLSearchParams(location.search);
    const classId = searchParams.get('id');

    const { data: cData } = useQuery({
        ...getClassDefinitionOptions({ path: { uuid: classId as string } }),
        enabled: !!classId,
    });
    const clData = cData?.data;

    const {
        data: cLessons,
    } = useQuery({
        ...getCourseLessonsOptions({
            path: { courseUuid: clData?.course_uuid as string },
            query: { pageable: {} },
        }),
        enabled: !!clData?.course_uuid,
    });
    const {
        isLoading: isAllLessonsDataLoading,
        lessons: lessonsWithContent,
        contentTypeMap,
    } = useCourseLessonsWithContent({ courseUuid: clData?.course_uuid as string });


    const [errors, setErrors] = useState<Record<string, string>>({});


    const getAvailableTimeSlots = () => {
        if (!data.academicPeriod?.startDate || !data.academicPeriod?.endDate || !data.timetable?.selectedDays) {
            return 0;
        }

        const startDate = new Date(data.academicPeriod.startDate);
        const endDate = new Date(data.academicPeriod.endDate);
        const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const weeksCount = Math.ceil(dayCount / 7);

        return weeksCount * data.timetable.selectedDays.length;
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        // if (!schedule.instructor) {
        //     newErrors.instructor = 'Please select an instructor';
        // }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateForm()) {
            onNext();
        }
    };

    return (
        <div className="space-y-6">
            {/* Instructor Selection */}
            <div className="space-y-2">
                <Label>Assign Instructor *</Label>
                <Select value={""} onValueChange={(value) => { }}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select an instructor" />
                    </SelectTrigger>
                    <SelectContent>
                        {instructors.map((instructor) => (
                            <SelectItem key={instructor} value={instructor}>{instructor}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.instructor && <p className="text-sm text-destructive">{errors.instructor}</p>}
            </div>

            {/* Skills and Lessons */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label>Skills & Lessons</Label>
                </div>

                <div className="space-y-4">
                    {isAllLessonsDataLoading && <Spinner />}

                    {lessonsWithContent?.length === 0 &&
                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <FileQuestion className="w-10 h-10 mb-4 text-gray-400" />
                            <h3 className="text-lg font-semibold">No Lessons Found</h3>
                            <p className="text-sm mt-1">
                                There are no lessons under this course.
                            </p>
                        </div>
                    }

                    {lessonsWithContent?.map((skill, skillIndex) => (
                        <Card key={skill.lesson?.uuid}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">Skill {skillIndex + 1}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Skill Title</Label>
                                    <Input
                                        value={skill.lesson?.title}
                                        onChange={(e) => { }}
                                    />
                                    <div className='text-muted-foreground mb-1 line-clamp-2 text-sm'>
                                        <HTMLTextPreview htmlContent={skill?.lesson?.description as string} />
                                    </div>
                                </div>

                                {/* Lessons */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Contents</Label>
                                    </div>

                                    <div className="space-y-2">

                                        {skill?.content?.data?.map((c, cIndex) => {
                                            const contentTypeName = contentTypeMap[c.content_type_uuid] || 'file';

                                            return (
                                                <div key={c.uuid} className="flex">
                                                    <div className="flex flex-row gap-2 mt-2 items-center text-sm text-muted-foreground">
                                                        <p> {cIndex + 1}</p>
                                                        {getResourceIcon(contentTypeName)}

                                                        <p>
                                                            {c.title}
                                                        </p>
                                                    </div>

                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Schedule Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Schedule Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <span className="text-muted-foreground">Total Skills:</span>
                        <div className="font-medium">{cLessons?.data?.content?.length}</div>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Total Lessons:</span>
                        <div className="font-medium">0</div>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Total Hours:</span>
                        {/* <div className="font-medium">{getTotalHours().toFixed(1)}h</div> */}
                        <div className="font-medium">0 h</div>

                    </div>
                    <div>
                        <span className="text-muted-foreground">Available Slots:</span>
                        <div className="font-medium">{getAvailableTimeSlots()}</div>
                    </div>
                </div>
                {/* {getTotalLessons() > getAvailableTimeSlots() && (
                    <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded text-sm">
                        ⚠️ You have more lessons than available time slots. Consider extending the academic period or adding more days.
                    </div>
                )} */}
            </div>

            {errors.scheduling && <p className="text-sm text-destructive">{errors.scheduling}</p>}

            <div className="flex justify-between">
                <Button variant="outline" onClick={onPrev} className="gap-2">
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                </Button>
                <Button onClick={handleNext}>Next: Visibility & Enrollment</Button>
            </div>
        </div>
    );
}