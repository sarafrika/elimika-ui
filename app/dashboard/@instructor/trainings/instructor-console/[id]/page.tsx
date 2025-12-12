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
    markAttendanceMutation,
} from "@/services/client/@tanstack/react-query.gen";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
    Award,
    BookOpen,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    FileText,
    ImageIcon,
    Lock,
    Maximize,
    MessageCircle,
    Pause,
    Play,
    Search,
    Settings,
    Users,
    Volume2,
    X,
    ZoomIn,
    ZoomOut,
} from "lucide-react";
import moment from "moment";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "../../../../../../components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../../../../../components/ui/collapsible";
import { Skeleton } from "../../../../../../components/ui/skeleton";
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
        ...getCourseRubricsOptions({
            path: { courseUuid: course?.uuid as string },
            query: { pageable: {} },
        }),
        enabled: !!course?.uuid,
    });

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
    const [expandedModules, setExpandedModules] = useState<string[]>([
        firstLesson?.uuid as string,
    ]);
    const [selectedLesson, setSelectedLesson] = useState<any>(firstLesson);
    const contentTypeName = contentTypeMap[selectedLesson?.content_type_uuid] || "text";

    const toggleModule = (skillId: string) => {
        setExpandedModules((prev) =>
            prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
        );
    };

    const handleLessonSelect = (lesson: any) => {
        setSelectedLesson(lesson);
        setIsPlaying(false);
    };

    const handleStartLesson = () => {
        if (!selectedLesson) {
            toast.message("Please select a lesson to start.");
            return;
        }

        const contentTypeName = contentTypeMap[selectedLesson?.content_type_uuid];

        if (contentTypeName === "video") {
            setIsPlaying(true);
        } else if (contentTypeName === "pdf" || contentTypeName === "text") {
            setIsReading(true);
        } else {
            toast.message("Lesson type not supported for viewing.");
        }
    };

    const getLessonIcon = (type: any["type"], completed: boolean, locked: boolean) => {
        if (locked) return <Lock className="h-4 w-4 text-muted-foreground" />;
        if (completed) return <CheckCircle className="h-4 w-4 text-success" />;

        switch (type) {
            case "video":
                return <Play className="h-4 w-4 text-primary" />;
            case "reading":
                return <BookOpen className="h-4 w-4 text-accent" />;
            case "quiz":
                return <FileText className="h-4 w-4 text-warning" />;
            case "assignment":
                return <Award className="h-4 w-4 text-success" />;
            default:
                return <Play className="h-4 w-4" />;
        }
    };

    if (isAllLessonsDataLoading || classIsLoading || rosterLoading) {
        return (
            <div className="flex flex-col gap-6 space-y-2 p-6">
                <Skeleton className="h-[150px] w-full" />
                <div className="flex flex-row items-center justify-between gap-4">
                    <Skeleton className="h-[450px] w-2/3" />
                    <Skeleton className="h-[450px] w-1/3" />
                </div>
                <Skeleton className="h-[100px] w-full" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Left Sidebar - Students List */}
            <aside className="w-72 border-r border-border bg-card flex flex-col">
                {/* Search Header */}
                <div className="border-b border-border p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search students..."
                            className="pl-10 bg-background"
                        />
                    </div>
                </div>

                {/* Students Count */}
                <div className="border-b border-border px-4 py-3">
                    <p className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">All Students</span>
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                            {roster?.length}
                        </span>
                    </p>
                </div>

                {/* Students Scroll Area */}
                <ScrollArea className="flex-1">
                    <div className="space-y-1 p-2">
                        {roster?.map((entry: any) => {
                            const name = entry?.user?.full_name ?? "Unknown";
                            const isActive = entry?.enrollment?.status === "ENROLLED";
                            const isSelected = selectedStudent?.user?.uuid === entry?.user?.uuid;

                            return (
                                <button
                                    key={entry?.user?.uuid}
                                    onClick={() => setSelectedStudent(entry)}
                                    className={`group relative w-full rounded-lg px-3 py-2.5 text-left transition-all duration-150 ${isSelected
                                        ? "bg-primary/10 shadow-sm"
                                        : "hover:bg-accent/50"
                                        }`}
                                >
                                    {/* Left accent bar */}
                                    <div
                                        className={`absolute left-0 top-0 h-full w-1 rounded-r transition-all ${isSelected ? "bg-primary" : "opacity-0"
                                            }`}
                                    />

                                    <div className="flex items-center justify-between gap-2 pl-1">
                                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                            {/* Avatar */}
                                            <div
                                                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${isSelected
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-primary/15 text-primary"
                                                    }`}
                                            >
                                                {name
                                                    .split(" ")
                                                    .map((n: string) => n?.[0])
                                                    .slice(0, 2)
                                                    .join("")}
                                            </div>

                                            {/* Name & Status */}
                                            <div className="flex flex-1 flex-col min-w-0">
                                                <span
                                                    className={`truncate text-sm ${isSelected ? "font-semibold text-foreground" : "font-medium"
                                                        }`}
                                                >
                                                    {name}
                                                </span>
                                                <span
                                                    className={`text-xs ${isActive ? "text-success" : "text-muted-foreground"
                                                        }`}
                                                >
                                                    {isActive ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                        </div>

                                        <ChevronRight
                                            className={`h-4 w-4 flex-shrink-0 transition-opacity ${isSelected ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-70 text-muted-foreground"
                                                }`}
                                        />
                                    </div>
                                </button>
                            );
                        })}

                        {roster?.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Users className="mb-3 h-8 w-8 opacity-40" />
                                <p className="text-xs text-muted-foreground">No enrolled students</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto px-6 py-6">
                {/* Class Header Card */}
                <Card className="mb-6 border-border bg-gradient-to-br from-card via-card to-card/80">
                    <CardHeader className="pb-4">
                        <div className="space-y-4">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground mb-2">
                                    {classData?.title}
                                </h1>
                                <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                                    {classData?.capacity_info}
                                </p>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex flex-wrap gap-2 pt-2">
                                <Button size="sm" variant="outline">
                                    Share Class
                                </Button>
                                <Button size="sm" variant="outline">
                                    View Analytics
                                </Button>
                                <Button size="sm" variant="outline">
                                    Export Roster
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Content Section */}
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    {/* Left: Course Content & Lessons */}
                    <div className="xl:col-span-2 space-y-6">
                        {!isPlaying && !isReading && (
                            <Card className="border-border">
                                <CardHeader className="pb-4">
                                    <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                                        <BookOpen className="h-5 w-5 text-primary" />
                                        Course Content
                                    </h2>
                                </CardHeader>

                                <CardContent>
                                    <ScrollArea className="h-[60vh]">
                                        <div className="space-y-2 pr-4">
                                            {lessonsWithContent?.map((skill, skillIndex) => (
                                                <Collapsible
                                                    key={skillIndex}
                                                    open={expandedModules.includes(skill?.lesson?.uuid as string)}
                                                    onOpenChange={() => toggleModule(skill?.lesson?.uuid as string)}
                                                >
                                                    <Card className="border-border/50 hover:border-border transition-colors">
                                                        <CollapsibleTrigger className="w-full">
                                                            <CardHeader className="cursor-pointer hover:bg-accent/30 transition-colors py-3">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-xs font-semibold text-primary/60 min-w-[1.5rem]">
                                                                            {String(skillIndex + 1).padStart(2, "0")}
                                                                        </span>
                                                                        <h3 className="font-medium text-foreground">
                                                                            {skill?.lesson?.title}
                                                                        </h3>
                                                                    </div>
                                                                    {expandedModules.includes(skill?.lesson?.uuid as string) ? (
                                                                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                                                    ) : (
                                                                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                                                    )}
                                                                </div>
                                                            </CardHeader>
                                                        </CollapsibleTrigger>

                                                        <CollapsibleContent>
                                                            <CardContent className="pt-0 space-y-2">
                                                                {skill?.content?.data?.map((content: any) => (
                                                                    <button
                                                                        key={content.uuid}
                                                                        onClick={() => handleLessonSelect(content)}
                                                                        className={`w-full rounded-lg border-2 border-border/50 p-3 transition-all hover:border-primary/50 hover:bg-accent/30 ${selectedLesson?.uuid === content.uuid
                                                                            ? "border-primary bg-primary/5"
                                                                            : ""
                                                                            }`}
                                                                    >
                                                                        <div className="flex items-center justify-between gap-3">
                                                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                                {getLessonIcon("", false, false)}
                                                                                <div className="text-left min-w-0">
                                                                                    <p className="text-sm font-medium text-foreground truncate">
                                                                                        {content.title}
                                                                                    </p>
                                                                                    <p className="text-xs text-muted-foreground capitalize">
                                                                                        {content.type}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                            <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                            </CardContent>
                                                        </CollapsibleContent>
                                                    </Card>
                                                </Collapsible>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        )}

                        {/* Lesson Preview Card */}
                        {selectedLesson && !isPlaying && !isReading && (
                            <Card className="border-border overflow-hidden">
                                <div className="aspect-video w-full bg-muted relative group overflow-hidden">
                                    {course?.thumbnail_url ? (
                                        <img
                                            src={course.thumbnail_url}
                                            alt={classData?.title}
                                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-muted-foreground">
                                            <ImageIcon className="h-12 w-12 opacity-40" />
                                        </div>
                                    )}
                                </div>

                                <CardContent className="pt-6 space-y-4">
                                    <div className="space-y-1">
                                        <h2 className="text-xl font-semibold text-foreground">
                                            {selectedLesson?.title}
                                        </h2>
                                        {selectedLesson?.subtitle && (
                                            <p className="text-sm text-muted-foreground">{selectedLesson.subtitle}</p>
                                        )}
                                    </div>

                                    <Button onClick={handleStartLesson} className="w-full gap-2 py-6 text-base">
                                        <Play className="h-5 w-5" />
                                        Begin Class
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* Video Player */}
                        {isPlaying && contentTypeName === "video" && (
                            <Card className="border-border overflow-hidden">
                                <div className="relative bg-black">
                                    <button
                                        onClick={() => setIsPlaying(false)}
                                        className="absolute right-3 top-3 z-50 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>

                                    <div className="aspect-video flex items-center justify-center">
                                        <Play className="h-20 w-20 opacity-50 text-white" />
                                    </div>

                                    {/* Video Controls */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                                        <div className="flex items-center gap-4">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-white hover:bg-white/20"
                                            >
                                                <Pause className="h-5 w-5" />
                                            </Button>
                                            <span className="text-xs text-white/80">3:15 / 9:00</span>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-white hover:bg-white/20"
                                            >
                                                <Volume2 className="h-5 w-5" />
                                            </Button>
                                            <div className="flex-1" />
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-white hover:bg-white/20"
                                            >
                                                <Settings className="h-5 w-5" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-white hover:bg-white/20"
                                            >
                                                <Maximize className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Reading Mode */}
                        {isReading && (contentTypeName === "pdf" || contentTypeName === "text") && (
                            <Card className="border-border overflow-hidden flex flex-col">
                                <CardHeader className="border-b border-border bg-accent/20 py-3">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h2 className="text-sm font-semibold text-foreground">
                                                {selectedLesson?.title}
                                            </h2>
                                            <p className="text-xs text-muted-foreground">
                                                {selectedLesson?.description}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setIsReading(false)}
                                            className="gap-1"
                                        >
                                            <X className="h-4 w-4" />
                                            Close
                                        </Button>
                                    </div>

                                    {/* Zoom Controls */}
                                    <div className="flex gap-2 mt-3">
                                        <Button size="sm" variant="outline">
                                            <ZoomIn className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" variant="outline">
                                            <ZoomOut className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" variant="outline">
                                            <Settings className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>

                                <ScrollArea className="flex-1">
                                    <div className="prose prose-sm dark:prose-invert max-w-none p-6">
                                        {contentTypeName === "text" && (
                                            <div dangerouslySetInnerHTML={{ __html: selectedLesson?.content_text }} />
                                        )}

                                        {contentTypeName === "pdf" && (
                                            <div className="flex flex-col items-center gap-4">
                                                <p className="italic text-muted-foreground text-sm">
                                                    PDF content viewer
                                                </p>
                                                <PDFViewer file={selectedLesson?.content_text} />
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </Card>
                        )}
                    </div>

                    {/* Right: Student Details Panel */}
                    {selectedStudent && (
                        <div className="xl:col-span-1">
                            <Card className="border-border sticky top-6 overflow-hidden flex flex-col max-h-[calc(100vh-10rem)]">
                                {/* Header */}
                                <CardHeader className="border-b border-border bg-accent/10 py-3">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h3 className="font-semibold text-foreground">
                                                {selectedStudent?.user?.full_name}
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                Graded: <span className="font-semibold text-foreground">20/50</span>
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setSelectedStudent(null)}
                                            className="h-8 w-8 p-0"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>

                                <ScrollArea className="flex-1">
                                    <CardContent className="space-y-6 pt-4">
                                        {/* Submission Section */}
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-semibold text-foreground">Submission</h4>

                                            <div className="space-y-3 bg-accent/5 rounded-lg p-3">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Due Date</span>
                                                    <span className="font-medium text-foreground">02/10/2024</span>
                                                </div>

                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Grade</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="e.g. 80"
                                                        className="mt-1.5 text-sm bg-background"
                                                        value={grade === "" ? "" : grade}
                                                        onChange={(e) =>
                                                            setGrade(e.target.value === "" ? "" : Number(e.target.value))
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <Separator className="bg-border/50" />

                                        {/* Status Section */}
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-semibold text-foreground">Status</h4>
                                            <RadioGroup
                                                value={status}
                                                onValueChange={(value) =>
                                                    setStatus(value as "Submitted" | "Excused" | "Missing")
                                                }
                                                className="space-y-2"
                                            >
                                                {[
                                                    { value: "Submitted", label: "Submitted" },
                                                    { value: "Excused", label: "Excused" },
                                                    { value: "Missing", label: "Missing" },
                                                ].map((item) => (
                                                    <div key={item.value} className="flex items-center space-x-2">
                                                        <RadioGroupItem value={item.value} id={item.value.toLowerCase()} />
                                                        <Label
                                                            htmlFor={item.value.toLowerCase()}
                                                            className="text-sm cursor-pointer font-normal"
                                                        >
                                                            {item.label}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        </div>

                                        <Separator className="bg-border/50" />

                                        {/* Actions */}
                                        <div className="space-y-2">
                                            <Button className="w-full">Save Grade</Button>
                                            <Button variant="outline" className="w-full">
                                                Toggle Present
                                            </Button>
                                        </div>

                                        <Separator className="bg-border/50" />

                                        {/* Submission Details */}
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-semibold text-foreground">
                                                Submission Details
                                            </h4>

                                            <div className="space-y-2 text-sm bg-accent/5 rounded-lg p-3">
                                                <div>
                                                    <span className="text-muted-foreground">Word Count:</span>
                                                    <span className="ml-2 font-medium text-foreground">500</span>
                                                </div>

                                                <div className="pt-2 space-y-2 border-t border-border">
                                                    <p className="text-xs font-semibold text-foreground">Files Uploaded</p>
                                                    {uploadedFiles.length === 0 ? (
                                                        <p className="text-xs text-muted-foreground">No files yet</p>
                                                    ) : (
                                                        <ul className="space-y-1">
                                                            {uploadedFiles.map((file, i) => (
                                                                <li
                                                                    key={i}
                                                                    className="flex items-center gap-2 text-primary text-xs hover:underline cursor-pointer"
                                                                >
                                                                    <FileText className="h-3 w-3" />
                                                                    <span className="truncate">{file}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <Label className="text-xs text-muted-foreground">Upload File</Label>
                                                <Input
                                                    type="file"
                                                    multiple
                                                    onChange={handleFileUpload}
                                                    className="mt-1.5 text-xs bg-background"
                                                />
                                            </div>

                                            <Button
                                                variant="link"
                                                className="h-auto px-0 gap-2 text-primary text-xs font-medium"
                                            >
                                                <MessageCircle className="h-3 w-3" /> View Comments (50)
                                            </Button>
                                        </div>
                                    </CardContent>
                                </ScrollArea>
                            </Card>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
// ...existing code...