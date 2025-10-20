'use client';

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { getCourseByUuidOptions } from '@/services/client/@tanstack/react-query.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import {
    Globe,
    MapPin,
    Monitor,
    Plus,
    Search,
    X
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';


// ✅ Zod Schema
const scheduleSchema = z.object({
    trainingMode: z.enum(['ONLINE', 'IN_PERSON', 'HYBRID'], {
        required_error: 'Training mode is required',
    }),
    trainingCity: z.string().optional(),
    trainingCountry: z.string().optional(),
    venueRequirements: z.string().optional(),

    minStudents: z
        .preprocess((val) => {
            if (val === '' || val == null) return undefined;
            return typeof val === 'number' ? val : Number(val);
        }, z.number().min(1, { message: 'Minimum must be at least 1' }))
        .optional(),

    allowOneOnOne: z.boolean().optional(),
    max_students: z.any()
}).superRefine((data, ctx) => {
    if (data.trainingMode === 'IN_PERSON' || data.trainingMode === 'HYBRID') {
        if (!data.trainingCity || data.trainingCity.trim() === '') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['trainingCity'],
                message: 'City is required for in-person or hybrid training',
            });
        }

        if (!data.trainingCountry || data.trainingCountry.trim() === '') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['trainingCountry'],
                message: 'Country is required for in-person or hybrid training',
            });
        }
    }
});


type ScheduleFormValues = z.infer<typeof scheduleSchema>;


// ✅ Mock instructors
const AVAILABLE_INSTRUCTORS = [
    {
        id: '1',
        name: 'Dr. Sarah Johnson',
        title: 'Senior Developer',
        specialties: ['React', 'TypeScript', 'Web Development'],
        avatar: '',
    },
    {
        id: '2',
        name: 'Mike Chen',
        title: 'Data Scientist',
        specialties: ['Python', 'Machine Learning', 'Data Analysis'],
        avatar: '',
    },
    {
        id: '3',
        name: 'Emily Rodriguez',
        title: 'UX Designer',
        specialties: ['UI/UX', 'Design Thinking', 'Prototyping'],
        avatar: '',
    },
];


interface ScheduleAndDeliveryProps {
    data: any;
    profile: any;
    selectedCourse: any;
    onDataChange: (data: any) => void;
}


export function ScheduleAndDelivery({
    data,
    profile,
    selectedCourse,
    onDataChange,
}: ScheduleAndDeliveryProps) {
    const { data: courseDetails } = useQuery({
        ...getCourseByUuidOptions({ path: { uuid: selectedCourse?.uuid as string } }),
        enabled: !!selectedCourse?.uuid,
    });

    const form = useForm<ScheduleFormValues>({
        resolver: zodResolver(scheduleSchema),
        defaultValues: {
            trainingMode: data?.trainingMode || '',
            trainingCity: data?.trainingCity || '',
            trainingCountry: data?.trainingCountry || '',
            venueRequirements: data?.venueRequirements || '',
            minStudents: data?.minStudents || '',
            allowOneOnOne: data?.allowOneOnOne || false,
            max_students: courseDetails?.data?.class_limit ?? ""
        },
    });

    const [leadTrainer, setLeadTrainer] = useState<any>(data?.leadTrainer || null);
    const [supportTrainers, setSupportTrainers] = useState<any[]>(data?.supportTrainers || []);
    const [showInstructorSearch, setShowInstructorSearch] = useState(false);

    const handleLeadTrainerSelect = (instructor: any) => {
        setLeadTrainer(instructor);
        onDataChange({ ...data, leadTrainer: instructor });
        setShowInstructorSearch(false);
    };

    const removeSupportTrainer = (id: string) => {
        const newList = supportTrainers.filter(t => t.id !== id);
        setSupportTrainers(newList);
        onDataChange({ ...data, supportTrainers: newList });
    };

    const onSubmit = (values: ScheduleFormValues) => {
        onDataChange({ ...data, ...values });
        console.log('✅ Submitted:', values);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {profile.user_domain?.includes('organisation') && (
                    <div>
                        {/* Lead Trainer */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Lead Trainer</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {leadTrainer ? (
                                    <Card className="border-primary/20 bg-primary/5">
                                        <CardContent className="pt-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={leadTrainer.avatar} />
                                                        <AvatarFallback>
                                                            {leadTrainer.name.split(' ').map((n: string) => n[0]).join('')}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <h4>{leadTrainer.name}</h4>
                                                        <p className="text-sm text-muted-foreground">{leadTrainer.title}</p>
                                                        <div className="flex gap-1 mt-1">
                                                            {leadTrainer.specialties.map((s: string) => (
                                                                <Badge key={s} variant="outline" className="text-xs">
                                                                    {s}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setLeadTrainer(null);
                                                        onDataChange({ ...data, leadTrainer: null });
                                                    }}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => setShowInstructorSearch(!showInstructorSearch)}
                                            >
                                                <Search className="w-4 h-4 mr-2" />
                                                Search Existing Instructors
                                            </Button>
                                            <Button variant="outline">
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add New Instructor
                                            </Button>
                                        </div>

                                        {showInstructorSearch && (
                                            <div className="space-y-3">
                                                <h4>Available Instructors</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {AVAILABLE_INSTRUCTORS.map((instructor) => (
                                                        <Card
                                                            key={instructor.id}
                                                            className="cursor-pointer hover:shadow-md transition-shadow"
                                                            onClick={() => handleLeadTrainerSelect(instructor)}
                                                        >
                                                            <CardContent className="pt-4">
                                                                <div className="flex items-center gap-3">
                                                                    <Avatar className="w-10 h-10">
                                                                        <AvatarImage src={instructor.avatar} />
                                                                        <AvatarFallback>
                                                                            {instructor.name.split(' ').map(n => n[0]).join('')}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <h4 className="text-sm font-medium">{instructor.name}</h4>
                                                                        <p className="text-xs text-muted-foreground">{instructor.title}</p>
                                                                    </div>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Training Mode */}
                <Card>
                    <CardHeader>
                        <CardTitle>Training Mode</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FormField
                            control={form.control}
                            name="trainingMode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <RadioGroup value={field.value} onValueChange={field.onChange}>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {[
                                                    { id: 'ONLINE', label: 'ONLINE', icon: Globe, desc: 'Virtual training' },
                                                    { id: 'IN_PERSON', label: 'PERSON', icon: MapPin, desc: 'Physical location' },
                                                    { id: 'HYBRID', label: 'HYBRID', icon: Monitor, desc: 'Online + In-person' },
                                                ].map(({ id, label, icon: Icon, desc }) => (
                                                    <div key={id} className="flex items-center space-x-2 p-4 border rounded-lg">
                                                        <RadioGroupItem value={id} id={id} />
                                                        <Label htmlFor={id} className="flex items-center gap-3 cursor-pointer">
                                                            <Icon className="w-5 h-5" />
                                                            <div>
                                                                <p className="font-medium">{label}</p>
                                                                <p className="text-sm text-muted-foreground">{desc}</p>
                                                            </div>
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Location Details */}
                {['IN_PERSON', 'HYBRID'].includes(form.watch('trainingMode')) && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Training Location</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="trainingCity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>City/Region</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter city" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="trainingCountry"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Country</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter country" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="venueRequirements"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Venue Requirements</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                rows={3}
                                                placeholder="Describe venue requirements..."
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Class Size & Enrollment */}
                <Card>
                    <CardHeader>
                        <CardTitle>Class Size & Enrollment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="minStudents"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Minimum Students</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="5" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div>
                                <Label>Maximum Students</Label>
                                <div className="border border-input rounded-md px-3 py-2 text-sm bg-muted/30">
                                    {courseDetails?.data?.class_limit || '—'}
                                </div>
                            </div>
                            <div>
                                <Label>Optimal Class Size</Label>
                                <div className="border border-input rounded-md px-3 py-2 text-sm bg-muted/30">
                                    {courseDetails?.data?.class_limit || '—'}
                                </div>
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="allowOneOnOne"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-2">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <FormLabel>I can provide one-on-one training sessions</FormLabel>
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit">Save Changes</Button>
                </div>
            </form>
        </Form>
    );
}
