import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import {
    Calendar as CalendarIcon,
    Globe,
    MapPin,
    Monitor,
    Plus,
    Search,
    User,
    X
} from 'lucide-react';
import { useState } from 'react';

interface ScheduleAndDeliveryProps {
    data: any;
    onDataChange: (data: any) => void;
}

// Mock instructor data for organizations
const AVAILABLE_INSTRUCTORS = [
    {
        id: '1',
        name: 'Dr. Sarah Johnson',
        title: 'Senior Developer',
        specialties: ['React', 'TypeScript', 'Web Development'],
        rating: 4.9,
        experience: '8 years',
        avatar: ''
    },
    {
        id: '2',
        name: 'Mike Chen',
        title: 'Data Scientist',
        specialties: ['Python', 'Machine Learning', 'Data Analysis'],
        rating: 4.8,
        experience: '6 years',
        avatar: ''
    },
    {
        id: '3',
        name: 'Emily Rodriguez',
        title: 'UX Designer',
        specialties: ['UI/UX', 'Design Thinking', 'Prototyping'],
        rating: 4.7,
        experience: '5 years',
        avatar: ''
    }
];

const TIME_ZONES = [
    'UTC-12:00 (Baker Island)',
    'UTC-11:00 (American Samoa)',
    'UTC-10:00 (Hawaii)',
    'UTC-09:00 (Alaska)',
    'UTC-08:00 (Pacific Time)',
    'UTC-07:00 (Mountain Time)',
    'UTC-06:00 (Central Time)',
    'UTC-05:00 (Eastern Time)',
    'UTC-04:00 (Atlantic Time)',
    'UTC-03:00 (Argentina)',
    'UTC-02:00 (South Georgia)',
    'UTC-01:00 (Azores)',
    'UTC+00:00 (GMT/UTC)',
    'UTC+01:00 (Central European)',
    'UTC+02:00 (Eastern European)',
    'UTC+03:00 (Moscow)',
    'UTC+04:00 (Gulf)',
    'UTC+05:00 (Pakistan)',
    'UTC+05:30 (India)',
    'UTC+06:00 (Bangladesh)',
    'UTC+07:00 (Thailand)',
    'UTC+08:00 (China)',
    'UTC+09:00 (Japan)',
    'UTC+10:00 (Australia East)',
    'UTC+11:00 (Solomon Islands)',
    'UTC+12:00 (New Zealand)'
];

export function ScheduleAndDelivery({ data, onDataChange }: ScheduleAndDeliveryProps) {
    const [leadTrainer, setLeadTrainer] = useState(data?.leadTrainer || null);
    const [supportTrainers, setSupportTrainers] = useState<any[]>(data?.supportTrainers || []);
    const [trainingMode, setTrainingMode] = useState(data?.trainingMode || '');
    const [availableDates, setAvailableDates] = useState<Date[]>(data?.availableDates || []);
    const [showInstructorSearch, setShowInstructorSearch] = useState(false);

    const handleLeadTrainerSelect = (instructor: any) => {
        setLeadTrainer(instructor);
        onDataChange({ ...data, leadTrainer: instructor });
        setShowInstructorSearch(false);
    };

    const addSupportTrainer = (instructor: any) => {
        if (!supportTrainers.find(t => t.id === instructor.id)) {
            const newTrainers = [...supportTrainers, instructor];
            setSupportTrainers(newTrainers);
            onDataChange({ ...data, supportTrainers: newTrainers });
        }
    };

    const removeSupportTrainer = (instructorId: string) => {
        const newTrainers = supportTrainers.filter(t => t.id !== instructorId);
        setSupportTrainers(newTrainers);
        onDataChange({ ...data, supportTrainers: newTrainers });
    };

    const handleTrainingModeChange = (mode: string) => {
        setTrainingMode(mode);
        onDataChange({ ...data, trainingMode: mode });
    };

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            const newDates = availableDates.includes(date)
                ? availableDates.filter(d => d.getTime() !== date.getTime())
                : [...availableDates, date];
            setAvailableDates(newDates);
            onDataChange({ ...data, availableDates: newDates });
        }
    };

    return (
        <div className="space-y-6">
            {/* Lead Trainer */}
            <Card>
                <CardHeader>
                    <CardTitle>Lead Trainer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {data?.profileType === 'organization' ? (
                        <>
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
                                                        {leadTrainer.specialties.slice(0, 3).map((specialty: string) => (
                                                            <Badge key={specialty} variant="outline" className="text-xs">
                                                                {specialty}
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
                                                                    <div className="flex gap-1 mt-1">
                                                                        {instructor.specialties.slice(0, 2).map((specialty) => (
                                                                            <Badge key={specialty} variant="outline" className="text-xs">
                                                                                {specialty}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
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
                        </>
                    ) : (
                        <div className="p-4 bg-muted/20 rounded-lg">
                            <div className="flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" />
                                <span>You will be the lead trainer for this course</span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Support Trainers */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Support Trainers/Staff (Optional)</CardTitle>
                        {data?.profileType === 'organization' && (
                            <Button variant="outline" size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Support Trainer
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {supportTrainers.length > 0 ? (
                        <div className="space-y-3">
                            {supportTrainers.map((trainer) => (
                                <div key={trainer.id} className="flex items-center justify-between p-3 border rounded">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="w-8 h-8">
                                            <AvatarImage src={trainer.avatar} />
                                            <AvatarFallback>
                                                {trainer.name.split(' ').map((n: string) => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">{trainer.name}</p>
                                            <p className="text-xs text-muted-foreground">{trainer.title}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeSupportTrainer(trainer.id)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No support trainers added</p>
                    )}
                </CardContent>
            </Card>

            {/* Training Mode */}
            <Card>
                <CardHeader>
                    <CardTitle>Training Mode</CardTitle>
                </CardHeader>
                <CardContent>
                    <RadioGroup value={trainingMode} onValueChange={handleTrainingModeChange}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center space-x-2 p-4 border rounded-lg">
                                <RadioGroupItem value="online" id="online" />
                                <Label htmlFor="online" className="flex items-center gap-3 cursor-pointer">
                                    <Globe className="w-5 h-5" />
                                    <div>
                                        <p className="font-medium">Online</p>
                                        <p className="text-sm text-muted-foreground">Virtual training sessions</p>
                                    </div>
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2 p-4 border rounded-lg">
                                <RadioGroupItem value="in-person" id="in-person" />
                                <Label htmlFor="in-person" className="flex items-center gap-3 cursor-pointer">
                                    <MapPin className="w-5 h-5" />
                                    <div>
                                        <p className="font-medium">In-Person</p>
                                        <p className="text-sm text-muted-foreground">Physical location training</p>
                                    </div>
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2 p-4 border rounded-lg">
                                <RadioGroupItem value="hybrid" id="hybrid" />
                                <Label htmlFor="hybrid" className="flex items-center gap-3 cursor-pointer">
                                    <Monitor className="w-5 h-5" />
                                    <div>
                                        <p className="font-medium">Hybrid</p>
                                        <p className="text-sm text-muted-foreground">Mix of online and in-person</p>
                                    </div>
                                </Label>
                            </div>
                        </div>
                    </RadioGroup>
                </CardContent>
            </Card>

            {/* Location Details */}
            {(trainingMode === 'in-person' || trainingMode === 'hybrid') && (
                <Card>
                    <CardHeader>
                        <CardTitle>Training Location</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">City/Region</Label>
                                <Input
                                    id="city"
                                    placeholder="Enter city or region"
                                    value={data?.trainingCity || ''}
                                    onChange={(e) => onDataChange({ ...data, trainingCity: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country">Country</Label>
                                <Input
                                    id="country"
                                    placeholder="Enter country"
                                    value={data?.trainingCountry || ''}
                                    onChange={(e) => onDataChange({ ...data, trainingCountry: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="venueRequirements">Venue Requirements</Label>
                            <Textarea
                                id="venueRequirements"
                                placeholder="Describe your venue requirements (capacity, equipment, accessibility, etc.)"
                                rows={3}
                                value={data?.venueRequirements || ''}
                                onChange={(e) => onDataChange({ ...data, venueRequirements: e.target.value })}
                            />
                        </div>
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
                        <div className="space-y-2">
                            <Label htmlFor="minStudents">Minimum Students</Label>
                            <Input
                                id="minStudents"
                                type="number"
                                placeholder="5"
                                value={data?.minStudents || ''}
                                onChange={(e) => onDataChange({ ...data, minStudents: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maxStudents">Maximum Students</Label>
                            <Input
                                id="maxStudents"
                                type="number"
                                placeholder="25"
                                value={data?.maxStudents || ''}
                                onChange={(e) => onDataChange({ ...data, maxStudents: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="optimalSize">Optimal Class Size</Label>
                            <Input
                                id="optimalSize"
                                type="number"
                                placeholder="15"
                                value={data?.optimalSize || ''}
                                onChange={(e) => onDataChange({ ...data, optimalSize: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="oneOnOne"
                            checked={data?.allowOneOnOne || false}
                            onCheckedChange={(checked) => onDataChange({ ...data, allowOneOnOne: checked })}
                        />
                        <Label htmlFor="oneOnOne">
                            I can provide one-on-one training sessions
                        </Label>
                    </div>
                </CardContent>
            </Card>

            {/* Availability */}
            <Card>
                <CardHeader>
                    <CardTitle>Availability</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Time Zone */}
                    <div className="space-y-2">
                        <Label>Time Zone</Label>
                        <Select onValueChange={(value) => onDataChange({ ...data, timeZone: value })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select your time zone" />
                            </SelectTrigger>
                            <SelectContent>
                                {TIME_ZONES.map((tz) => (
                                    <SelectItem key={tz} value={tz}>
                                        {tz}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Available Dates */}
                    <div className="space-y-2">
                        <Label>Preferred Training Dates</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start">
                                            <CalendarIcon className="w-4 h-4 mr-2" />
                                            Select available dates
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="multiple"
                                            selected={availableDates}
                                            // onSelect={handleDateSelect}
                                            onSelect={() => { }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div>
                                <Label className="text-sm">Selected Dates:</Label>
                                <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                                    {availableDates.length > 0 ? (
                                        availableDates.map((date, index) => (
                                            <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted/20 rounded">
                                                <span>{format(date, 'PPP')}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDateSelect(date)}
                                                >
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No dates selected</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Weekly Availability */}
                    <div className="space-y-2">
                        <Label>Weekly Availability</Label>
                        <Textarea
                            placeholder="Describe your weekly availability (e.g., Weekdays 9 AM - 5 PM, Weekends 10 AM - 4 PM)"
                            rows={3}
                            value={data?.weeklyAvailability || ''}
                            onChange={(e) => onDataChange({ ...data, weeklyAvailability: e.target.value })}
                        />
                    </div>

                    {/* Lead Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="minLeadTime">Minimum Lead Time</Label>
                            <Select onValueChange={(value) => onDataChange({ ...data, minLeadTime: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="How much notice do you need?" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1-week">1 week</SelectItem>
                                    <SelectItem value="2-weeks">2 weeks</SelectItem>
                                    <SelectItem value="1-month">1 month</SelectItem>
                                    <SelectItem value="2-months">2 months</SelectItem>
                                    <SelectItem value="3-months">3+ months</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="flexibility">Schedule Flexibility</Label>
                            <Select onValueChange={(value) => onDataChange({ ...data, scheduleFlexibility: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="How flexible is your schedule?" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="very-flexible">Very flexible</SelectItem>
                                    <SelectItem value="moderately-flexible">Moderately flexible</SelectItem>
                                    <SelectItem value="limited-flexibility">Limited flexibility</SelectItem>
                                    <SelectItem value="fixed-schedule">Fixed schedule only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}