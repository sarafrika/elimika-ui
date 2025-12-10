"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useBreadcrumb } from "@/context/breadcrumb-provider";
import { useClassRoster } from "@/hooks/use-class-roster";
import { useCourseLessonsWithContent } from "@/hooks/use-courselessonwithcontent";
import {
    getClassDefinitionOptions,
    getCourseByUuidOptions,
    getCourseRubricsOptions,
    getInstructorCalendarOptions,
    markAttendanceMutation
} from "@/services/client/@tanstack/react-query.gen";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Award, BookOpen, CheckCircle, ChevronDown, ChevronRight, ChevronUp, FileText, ImageIcon, Lock, Maximize, MessageCircle, Pause, Play, Search, Settings, Users, Volume2, X, ZoomIn, ZoomOut } from "lucide-react";
import moment from "moment";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "../../../../../../components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../../../../../components/ui/collapsible";
import PDFViewer from "../../../../@student/_components/pdf-viewer";

const localizer = momentLocalizer(moment);

export default function ClassPreviewPage() {
    const router = useRouter();
    const params = useParams();
    const classId = params?.id as string;
    const { replaceBreadcrumbs } = useBreadcrumb();

    useEffect(() => {
        if (!classId) return;

        replaceBreadcrumbs([
            { id: "dashboard", title: "Dashboard", url: "/dashboard/overview" },
            {
                id: "trainings",
                title: "Training Classes",
                url: "/dashboard/trainings",
            },
            {
                id: "instructor-console",
                title: "Training Dashboard",
                url: `/dashboard/trainings/instructor-console/${classId}`,
                isLast: true,
            },
        ]);
    }, [replaceBreadcrumbs, classId]);

    const { data, isLoading: classIsLoading } = useQuery({
        ...getClassDefinitionOptions({ path: { uuid: classId as string } }),
        enabled: !!classId,
    });
    const classData = data?.data;

    const { data: courseDetail } = useQuery({
        ...getCourseByUuidOptions({ path: { uuid: classData?.course_uuid as string } }),
        enabled: !!classData?.course_uuid,
    });
    const course = courseDetail?.data;

    const { data: courseRubrics } = useQuery({
        ...getCourseRubricsOptions({ path: { courseUuid: course?.uuid as string }, query: { pageable: {} } }
        ),
        enabled: !!course?.uuid
    })

    const {
        isLoading: isAllLessonsDataLoading,
        lessons: lessonsWithContent,
        contentTypeMap,
    } = useCourseLessonsWithContent({ courseUuid: classData?.course_uuid as string });

    const [registrationLink] = useState(
        `https://elimika.sarafrika.com/trainings/${classData?.uuid}/register`
    );
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) { }
    };

    const shareToSocial = (platform: string) => {
        const url = encodeURIComponent(registrationLink);
        const text = encodeURIComponent(`Check out this class: ${classData?.title}`);

        const urls = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
            twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
            whatsapp: `https://wa.me/?text=${text}%20${url}`,
            email: `mailto:?subject=${encodeURIComponent(classData?.title as string)}&body=${text}%20${url}`,
        };

        if (urls[platform as keyof typeof urls]) {
            window.open(urls[platform as keyof typeof urls], "_blank", "width=600,height=400");
        }
    };

    // --- UI state for the 3-column page
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [grade, setGrade] = useState<number | "">("");
    const [status, setStatus] = useState<"Submitted" | "Excused" | "Missing">("Submitted");
    const [attendance, setAttendance] = useState<Record<string, boolean>>({});
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const [showQR, setShowQR] = useState(false);

    const markAttendance = useMutation(markAttendanceMutation());
    const { roster, isLoading: rosterLoading } = useClassRoster(classId);


    const { data: classSchedule } = useQuery({
        ...getInstructorCalendarOptions({
            path: { instructorUuid: classData?.default_instructor_uuid as string },
            query: { start_date: "2025-09-11" as any, end_date: "2026-11-11" as any },
        }),
        enabled: !!classData?.default_instructor_uuid,
    });

    // activity / rubric / performance (you can replace with your fetched ones)
    const activityLog = [
        { name: "Dianne Russel", action: "Checked in via QR", time: "8:35 AM" },
        { name: "Jacob Jones", action: "Submitted Assignment 2", time: "9:15 AM" },
        { name: "Leslie Alexander", action: "Downloaded Lecture Slides", time: "10:02 AM" },
    ];

    const rubric = [
        { criteria: "Attendance", weight: "20%", description: "Consistency and punctuality" },
        { criteria: "Participation", weight: "25%", description: "Engagement during sessions" },
        { criteria: "Assignments", weight: "35%", description: "Completion and quality" },
        { criteria: "Exam", weight: "20%", description: "Final test performance" },
    ];

    const performance = [
        { name: "Dianne Russel", participation: 95, score: 88, progress: 92 },
        { name: "Jacob Jones", participation: 78, score: 70, progress: 75 },
        { name: "Leslie Alexander", participation: 85, score: 90, progress: 88 },
    ];

    const toggleAttendance = (studentName: string) => {
        setAttendance((prev) => ({ ...prev, [studentName]: !prev[studentName] }));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const names = Array.from(e.target.files).map((f) => f.name);
            setUploadedFiles((prev) => [...prev, ...names]);
        }
    };

    const handleSaveGrade = () => { };

    const [isReading, setIsReading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const firstLesson = lessonsWithContent?.[0]?.lesson;
    const [expandedModules, setExpandedModules] = useState<string[]>([firstLesson?.uuid as string]);
    const [selectedLesson, setSelectedLesson] = useState<any>(firstLesson);
    const contentTypeName = contentTypeMap[selectedLesson?.content_type_uuid] || 'text';

    const toggleModule = (skillId: string) => {
        setExpandedModules(prev =>
            prev.includes(skillId)
                ? prev.filter(id => id !== skillId)
                : [...prev, skillId]
        );
    };

    const handleLessonSelect = (lesson: any) => {
        setSelectedLesson(lesson);
        setIsPlaying(false);
    };

    const handleStartLesson = () => {
        if (!selectedLesson) {
            toast.message('Please select a lesson to start.');
            return;
        }

        const contentTypeName = contentTypeMap[selectedLesson?.content_type_uuid];

        if (contentTypeName === 'video') {
            setIsPlaying(true);
        } else if (contentTypeName === 'pdf' || contentTypeName === 'text') {
            setIsReading(true);
        } else {
            toast.message('Lesson type not supported for viewing.');
        }
    }

    const getLessonIcon = (type: any['type'], completed: boolean, locked: boolean) => {
        if (locked) return <Lock className="w-4 h-4 text-muted-foreground" />;
        if (completed) return <CheckCircle className="w-4 h-4 text-green-600" />;

        switch (type) {
            case 'video':
                return <Play className="w-4 h-4 text-primary" />;
            case 'reading':
                return <BookOpen className="w-4 h-4 text-accent" />;
            case 'quiz':
                return <FileText className="w-4 h-4 text-warning" />;
            case 'assignment':
                return <Award className="w-4 h-4 text-success" />;
            default:
                return <Play className="w-4 h-4" />;
        }
    };

    // if (isAllLessonsDataLoading || classIsLoading || rosterLoading) {
    //     return (
    //         <div className="flex flex-col gap-6 space-y-2 p-6">
    //             <Skeleton className="h-[150px] w-full" />
    //             <div className="flex flex-row items-center justify-between gap-4">
    //                 <Skeleton className="h-[450px] w-2/3" />
    //                 <Skeleton className="h-[450px] w-1/3" />
    //             </div>
    //             <Skeleton className="h-[100px] w-full" />
    //         </div>
    //     );
    // }

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <aside className="w-72 bg-card border-r">
                <div className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search Student"
                            className="pl-10"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-6 p-4">
                    <span className="font-medium text-foreground">All students</span>
                    <span className="text-muted-foreground">{roster?.length}</span>
                </div>

                <ScrollArea className="flex-1 px-2 py-1 h-[calc(100vh-80px)]">
                    {roster?.map((entry: any, idx: number) => {
                        const name = entry?.user?.full_name ?? "Unknown"
                        const isActive = entry?.enrollment?.status === "ENROLLED"
                        const isSelected = selectedStudent?.user?.uuid === entry?.user?.uuid

                        return (
                            <div
                                key={entry?.user?.uuid}
                                onClick={() => {
                                    setSelectedStudent(entry)
                                }}
                                className={`
              group cursor-pointer rounded-md mb-1 px-3 py-2
              flex items-center justify-between h-auto
              transition-all duration-150 text-sm
              ${isSelected
                                        ? "bg-secondary/80 shadow-sm"
                                        : "hover:bg-accent/60"}
              relative
            `}
                            >

                                {/* Left highlight bar */}
                                <div
                                    className={`
                  absolute left-0 top-0 h-full w-1 rounded-r
                  transition-all duration-200
                  ${isSelected ? "bg-primary opacity-90" : "opacity-0 group-hover:opacity-50 bg-primary/60"}
                `}
                                />

                                {/* Content */}
                                <div className="flex items-center gap-3 pl-1">
                                    {/* Avatar */}
                                    <div className={`
                    w-9 h-9 rounded-full grid place-items-center text-xs font-medium
                    transition-colors
                    ${isSelected
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-primary/15 text-primary"
                                        }
                `}>
                                        {name
                                            ?.split(" ")
                                            .map((n: string) => n?.[0])
                                            .slice(0, 2)
                                            .join("")}
                                    </div>

                                    {/* Name & status */}
                                    <div className="flex flex-col text-left">
                                        <span className={`text-sm ${isSelected ? "font-semibold" : ""}`}>
                                            {name}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {isActive ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                </div>

                                <ChevronRight
                                    className={`
                    h-4 w-4 text-muted-foreground transition-opacity
                    ${isSelected ? "opacity-100" : "opacity-40 group-hover:opacity-70"}
                `}
                                />
                            </div>
                        )
                    })}

                    {roster?.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                            <Users className="h-8 w-8 mb-3 opacity-70" />
                            <p className="text-sm">No enrolled students</p>
                        </div>
                    )}
                </ScrollArea>
            </aside>

            <main className="flex-1 overflow-y-auto px-4 py-6">
                <div className="bg-card rounded-xl shadow-sm border p-6">
                    <div className="flex items-start justify-between gap-6 mb-6">
                        <div className="flex-1">
                            <h1 className="text-2xl font-semibold">
                                {classData?.title}
                            </h1>
                            <p className="text-foreground/80 leading-7 text-sm mb-6">
                                {classData?.capacity_info}
                            </p>
                        </div>
                    </div>

                    {!isPlaying && !isReading && <CardContent>
                        <ScrollArea className="min-h-auto pb-10 pr-4">
                            <span>Course Content</span>

                            <div className="space-y-3">
                                {lessonsWithContent?.map((skill, skillIndex) => (
                                    <Collapsible
                                        key={skillIndex}
                                        open={expandedModules.includes(skill?.lesson?.uuid as string)}
                                        onOpenChange={() => toggleModule(skill?.lesson?.uuid as string)}
                                    >
                                        <Card className="border-2 py-2.5">
                                            <CollapsibleTrigger className="w-full">
                                                <CardHeader className="cursor-pointer hover:bg-muted transition-colors py-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className='flex flex-row gap-2 items-center'>
                                                            <h3 className="font-medium text-left">{skillIndex + 1}.</h3>                                    <h3 className="font-medium text-left">{skill?.lesson?.title}</h3>
                                                        </div>
                                                        {expandedModules.includes(skill?.lesson?.uuid as string) ? (
                                                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                                        ) : (
                                                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                </CardHeader>
                                            </CollapsibleTrigger>

                                            <CollapsibleContent>
                                                <CardContent className="pt-0">
                                                    <div className="space-y-2">
                                                        {skill?.content?.data?.map((content: any) => (
                                                            <button
                                                                key={content.uuid}
                                                                onClick={() => handleLessonSelect(content)}
                                                                // disabled={content.locked}
                                                                disabled={false}
                                                                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all border-2 border-muted`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    {/* {getLessonIcon(lesson.type, lesson.completed, lesson.locked)} */}
                                                                    {getLessonIcon("", false, true)}

                                                                    <div className="text-left">
                                                                        <p className="font-medium">{content.title}</p>
                                                                        <p className="text-sm text-muted-foreground capitalize">
                                                                            {content.type}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {/* 
                                                            <div className="flex items-center gap-3">
                                                          {lesson.locked ? (
                                                            <Clock className="w-4 h-4 text-muted-foreground" />
                                                          ) : lesson.completed ? (
                                                            <CheckCircle className="w-5 h-5 text-success" />
                                                          ) : (
                                                            <span className="text-sm text-muted-foreground">{lesson.duration}</span>
                                                          )}
                                                        </div> */}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </CollapsibleContent>
                                        </Card>
                                    </Collapsible>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>}


                    {/* Secondary content */}
                    {selectedLesson &&
                        <div className="rounded-lg flex flex-col items-center justify-center">
                            {!isPlaying && !isReading && (
                                <Card className="w-full max-w-md p-6 flex flex-col items-center gap-6 shadow-lg rounded-xl">

                                    {/* Thumbnail */}
                                    <div className="w-full h-40 rounded-lg overflow-hidden bg-muted">
                                        {course?.thumbnail_url ? (
                                            <img
                                                src={course.thumbnail_url}
                                                alt={classData?.title}
                                                className="w-auto h-auto"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                <ImageIcon className="w-10 h-10 opacity-60" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Title */}
                                    <div className="text-center space-y-1">
                                        <h2 className="text-xl font-semibold">{selectedLesson?.title}</h2>
                                        {selectedLesson?.subtitle && (
                                            <p className="text-sm text-muted-foreground">{selectedLesson.subtitle}</p>
                                        )}
                                    </div>

                                    {/* CTA Button */}
                                    <Button
                                        onClick={handleStartLesson}
                                        className="w-full gap-2 py-6 text-lg"
                                        size="lg"
                                    >
                                        <Play className="w-5 h-5" />
                                        Begin Class
                                    </Button>

                                </Card>
                            )}


                            {/* Video Player Section (shown when video is playing) */}
                            {isPlaying && contentTypeName === "video" && (
                                <div className="w-full flex flex-col items-center mt-6">
                                    <div className="w-full max-w-5xl relative">
                                        <div className="aspect-video bg-black relative rounded-lg overflow-hidden shadow-lg">

                                            {/* Close Button */}
                                            <button
                                                onClick={() => setIsPlaying(false)}
                                                className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full z-50"
                                            >
                                                ✕
                                            </button>

                                            {/* Video placeholder */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Play className="w-20 h-20 text-white opacity-50" />
                                            </div>

                                            {/* Controls */}
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-4">
                                                <div className="flex items-center gap-4">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-white hover:bg-white/20"
                                                        onClick={() => setIsPlaying(false)}
                                                    >
                                                        <Pause className="w-5 h-5" />
                                                    </Button>

                                                    <span className="text-white text-sm">3:15 / 9:00</span>

                                                    <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                                                        <Volume2 className="w-5 h-5" />
                                                    </Button>

                                                    <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                                                        <Settings className="w-5 h-5" />
                                                    </Button>

                                                    <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                                                        <Maximize className="w-5 h-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}


                            {/* Reading Mode Section (shown when reading) */}
                            {isReading && (contentTypeName === "pdf" || contentTypeName === "text") && (
                                <Card className="">
                                    {/* Top Bar */}
                                    <div className="flex flex-col items-center p-4 border-b">
                                        <div className="flex items-center gap-4">
                                            {/* Left controls */}
                                            <div className="flex items-center gap-3">
                                                <Button size="sm" variant="ghost">
                                                    <ZoomIn className="w-5 h-5" />
                                                </Button>
                                                <Button size="sm" variant="ghost">
                                                    <ZoomOut className="w-5 h-5" />
                                                </Button>
                                                <Button size="sm" variant="ghost">
                                                    <Settings className="w-5 h-5" />
                                                </Button>
                                            </div>

                                            {/* Close button */}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setIsReading(false)}
                                            >
                                                Close
                                            </Button>
                                        </div>

                                        {/* Title + optional description */}
                                        <div className="flex flex-col items-start text-start">
                                            <h2 className="text-sm font-semibold">
                                                {selectedLesson?.title}
                                            </h2>
                                            <p className="text-xs">
                                                {selectedLesson?.description}
                                            </p>
                                        </div>
                                    </div>


                                    {/* Content Scroll Area */}
                                    <div className="flex-1 overflow-y-auto p-6">
                                        <div className="max-w-4xl mx-auto prose prose-gray">
                                            {contentTypeName === "text" && (
                                                <div dangerouslySetInnerHTML={{ __html: selectedLesson?.content_text }} />
                                            )}

                                            {contentTypeName === "pdf" && (
                                                <div className="flex flex-col items-center">
                                                    <p className="italic">Cannot display pdf contents at the moment</p>

                                                    <PDFViewer file={selectedLesson?.content_text} />

                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bottom Progress Bar (similar to video) */}
                                    <div className="p-2 border-t">
                                        {/* <Progress value={readingProgress} className="w-full h-1" /> */}
                                    </div>
                                </Card>
                            )}
                        </div>}
                </div>
            </main>

            {selectedStudent && <aside className="w-80 bg-card border-l p-6 overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-end mb-4">
                    <Button onClick={() => setSelectedStudent(null)} >
                        <X />
                    </Button>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">
                        Graded: <span className="font-semibold text-foreground">20/50</span>
                    </p>

                    <Button variant="link" className="text-sm h-auto px-0 font-medium">
                        View Rubric
                    </Button>
                </div>

                {/* Submission Card */}
                <div className="mb-6">
                    <p className="text-muted-foreground text-sm mb-2">Submission</p>

                    {/* Due Date */}
                    <div className="mb-3 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Due Date</span>
                            <span className="font-medium text-foreground">02/10/2024</span>
                        </div>
                    </div>

                    {/* Grade Input */}
                    <div className="mb-4">
                        <Label className="text-sm text-muted-foreground">Grade</Label>
                        <Input
                            type="number"
                            placeholder="e.g. 80"
                            className="mt-1 text-sm"
                            value={grade === "" ? "" : grade}
                            onChange={(e) =>
                                setGrade(e.target.value === "" ? "" : Number(e.target.value))
                            }
                        />
                    </div>

                    {/* Status */}
                    <div className="mb-4">
                        <p className="text-muted-foreground text-sm mb-2">Status</p>

                        <RadioGroup
                            value={status}
                            onValueChange={(value) =>
                                setStatus(value as "Submitted" | "Excused" | "Missing")
                            }
                            className="flex items-center gap-4"
                        >
                            {/* Submitted */}
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Submitted" id="submitted" />
                                <Label htmlFor="submitted" className="text-sm">
                                    Submitted
                                </Label>
                            </div>

                            {/* Excused */}
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Excused" id="excused" />
                                <Label htmlFor="excused" className="text-sm">
                                    Excused
                                </Label>
                            </div>

                            {/* Missing */}
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Missing" id="missing" />
                                <Label htmlFor="missing" className="text-sm">
                                    Missing
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Save + Toggle Buttons */}
                    <div className="flex items-center gap-2">
                        <Button>Save Grade</Button>
                        <Button variant="outline">Toggle Present</Button>
                    </div>
                </div>

                <Separator className="my-4" />

                {/* Submission Details */}
                <div>
                    <p className="text-muted-foreground text-sm mb-2">Submission Details</p>

                    <p className="text-sm text-foreground mb-3">
                        <span className="font-medium">Word Count:</span> 500 Words
                    </p>

                    <div className="mb-3">
                        <p className="text-foreground font-medium text-sm mb-2">Files Uploaded</p>

                        <ul className="text-sm space-y-2">
                            {uploadedFiles.length === 0 && (
                                <li className="text-muted-foreground">No files uploaded yet</li>
                            )}

                            {uploadedFiles.map((file, i) => (
                                <li
                                    key={i}
                                    className="flex items-center gap-2 text-primary cursor-pointer hover:underline"
                                >
                                    <FileText className="w-4 h-4" /> {file}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="mb-4">
                        <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                            Upload file
                        </Label>

                        <Input type="file" multiple onChange={handleFileUpload} className="text-sm" />
                    </div>

                    <Button variant="link" className="mt-3 flex items-center gap-2 text-primary text-sm font-medium">
                        <MessageCircle className="w-4 h-4" /> View Comments (50)
                    </Button>
                </div>
            </aside>}

        </div>
    );
}
