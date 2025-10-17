'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useDifficultyLevels } from '@/hooks/use-difficultyLevels';
import { BookOpen } from 'lucide-react';
import { toast } from 'sonner';

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
    'General Public',
];

const COURSE_FORMATS = [
    'Workshop (1-3 days)',
    'Bootcamp (1-4 weeks)',
    'Short Course (1-3 months)',
    'Long-term Program (3+ months)',
    'School Curriculum Integration',
    'Online Self-Paced Module',
    'Certification Program',
    'Professional Development Series',
];

interface CourseProposalProps {
    data: any;
    onDataChange: (applicationData: any) => void;
    selectedCourse: any;
}

const courseProposalSchema = z.object({
    targetAudience: z.array(z.string()).min(1, 'Select at least one audience'),
    courseFormat: z.string().nonempty('Please select a format'),
    proposedDuration: z.string().nonempty('Required'),
    sessionLength: z.string().nonempty('Required'),
    teachingApproach: z.string().optional(),
    uniqueValue: z.string().optional(),
    learningOutcomes: z.string().optional(),
    previousExperience: z.string().optional(),
});

type CourseProposalFormValues = z.infer<typeof courseProposalSchema>;

export function CourseProposal({ data, selectedCourse, onDataChange }: CourseProposalProps) {
    const { difficultyMap } = useDifficultyLevels();

    const form = useForm<CourseProposalFormValues>({
        resolver: zodResolver(courseProposalSchema),
        defaultValues: {
            targetAudience: data?.targetAudience || [],
            courseFormat: data?.courseFormat || '',
            proposedDuration: data?.proposedDuration || '',
            sessionLength: data?.sessionLength || '',
            teachingApproach: data?.teachingApproach || '',
            uniqueValue: data?.uniqueValue || '',
            learningOutcomes: data?.learningOutcomes || '',
            previousExperience: data?.previousExperience || '',
        },
    });

    // Sync form state with external `onDataChange`
    useEffect(() => {
        const subscription = form.watch((value) => {
            onDataChange(value);
        });
        return () => subscription.unsubscribe();
    }, [form.watch, onDataChange]);

    const onSubmit = (values: CourseProposalFormValues) => {
        toast.success('Course proposal saved');
        console.log(values);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardContent className="space-y-6">
                        {selectedCourse && (
                            <Card className="border-primary/20 bg-primary/5">
                                <CardContent className="pt-4 pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <BookOpen className="w-5 h-5 text-primary mb-2" />
                                            <h4 className="text-primary capitalize">
                                                {selectedCourse.name}
                                            </h4>
                                            <div className="text-sm text-muted-foreground mb-2">
                                                <RichTextRenderer htmlString={selectedCourse.description} maxChars={100} />
                                            </div>
                                            <div className="flex gap-2 flex-wrap">
                                                {selectedCourse.category_names.map((category: string, index: number) => (
                                                    <Badge key={index} variant="outline" className="text-xs mr-1">
                                                        {category}
                                                    </Badge>
                                                ))}
                                                {difficultyMap && selectedCourse.difficulty_uuid && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {difficultyMap[selectedCourse.difficulty_uuid]}
                                                    </Badge>
                                                )}
                                                <Badge variant="outline">{selectedCourse.total_duration_display}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </CardContent>
                </Card>

                {selectedCourse && (
                    <>
                        {/* Target Audience */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Target Audience</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <FormField
                                    control={form.control}
                                    name="targetAudience"
                                    render={() => (
                                        <FormItem>
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                {TARGET_AUDIENCES.map((audience) => (
                                                    <FormField
                                                        key={audience}
                                                        control={form.control}
                                                        name="targetAudience"
                                                        render={({ field }) => {
                                                            const isChecked = field.value?.includes(audience);
                                                            const handleChange = (checked: boolean) => {
                                                                const newAudience = checked
                                                                    ? [...field.value, audience]
                                                                    : field.value.filter((a: string) => a !== audience);
                                                                field.onChange(newAudience);
                                                            };

                                                            return (
                                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                                    <FormControl>
                                                                        <Checkbox
                                                                            checked={isChecked}
                                                                            onCheckedChange={handleChange}
                                                                        />
                                                                    </FormControl>
                                                                    <FormLabel className="text-sm font-normal cursor-pointer">
                                                                        {audience}
                                                                    </FormLabel>
                                                                </FormItem>
                                                            );
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {/* Course Format & Duration */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Proposed Course Format</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="courseFormat"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Training Format</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select training format" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {COURSE_FORMATS.map((format) => (
                                                        <SelectItem key={format} value={format}>
                                                            {format}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="proposedDuration"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Proposed Duration</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., 8 weeks, 40 hours" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="sessionLength"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Session Length</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., 2 hours, 90 minutes" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Additional Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Additional Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[
                                    { name: 'teachingApproach', label: 'Teaching Approach & Methodology' },
                                    { name: 'uniqueValue', label: 'What makes your approach unique?' },
                                    { name: 'learningOutcomes', label: 'Expected Learning Outcomes' },
                                    { name: 'previousExperience', label: 'Previous Experience with this Subject' },
                                ].map(({ name, label }) => (
                                    <FormField
                                        key={name}
                                        control={form.control}
                                        name={name as keyof CourseProposalFormValues}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{label}</FormLabel>
                                                <FormControl>
                                                    <Textarea rows={3} {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </CardContent>
                        </Card>

                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <Button type="submit">Save Changes</Button>
                        </div>
                    </>
                )}
            </form>
        </Form>
    );
}
