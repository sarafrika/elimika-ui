'use client'

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
    BookOpen,
    Check,
    ClipboardList,
    ImageIcon,
    Plus,
    Trash2,
    Video,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";


/////////////////////////////////////////////////////////////////////////////
// Mock-only data for the Course Creator flow (no backend).

export type SessionRow = {
    id: string;
    no: number;
    title: string;
    topics: string;
    duration: number;
    type: string;
};

export type LessonDraft = {
    id: string;
    no: number;
    title: string;
    duration: string;
    content: string;
    activities: string[];
    assessments: string[];
};

export type AssessmentRow = {
    id: string;
    type: string;
    detail: string;
    purpose: string;
    weight: number;
    required: boolean;
};

export type GradeRow = { id: string; grade: string; min: number; max: number };

export const CATEGORIES = [
    "Music",
    "Programming & Development",
    "Business",
    "Design",
    "Sports",
    "TVET / Vocational",
];

export const COURSE_TYPES = [
    "Short course",
    "Certificate Course",
    "Diploma programme",
    "Bootcamp",
    "Professional Certificate",
];

export const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
export const LECTURE_TYPES = ["Live Lecture", "Recorded", "Hybrid", "Self-paced"];
export const CERTIFICATIONS = ["None", "Certificate of Completion", "Accredited Certificate"];
export const SESSION_TYPES = ["Live Lecture", "Workshop", "Lab", "Q&A", "Assessment"];
export const ACTIVITY_TYPES = ["Practice drill", "Guided exercise", "Discussion", "Project task"];
export const ASSESSMENT_TYPES = [
    "Quizzes",
    "Assignments",
    "Practice Activities",
    "Final Assessment",
];

export const initialSessions: SessionRow[] = [
    {
        id: "s1",
        no: 1,
        title: "Introduction to the Course",
        topics: "Overview, expectations, and learning path",
        duration: 60,
        type: "Live Lecture",
    },
];

export const initialLessons: LessonDraft[] = [
    {
        id: "l1",
        no: 1,
        title: "Getting started with the fundamentals",
        duration: "20 mins",
        content:
            "Welcome to the course. In this lesson we set up your tools and walk through how the course is structured.",
        activities: ["Warm-up drill: repeat the core pattern 10 times"],
        assessments: ["Knowledge check: 5 auto-graded questions"],
    },
];

export const initialAssessments: AssessmentRow[] = [
    {
        id: "a1",
        type: "Quizzes",
        detail: "Auto-graded quiz questions",
        purpose: "Evaluate understanding of key concepts",
        weight: 20,
        required: true,
    },
    {
        id: "a2",
        type: "Assignments",
        detail: "File upload / submission",
        purpose: "Assess practical application of knowledge",
        weight: 25,
        required: true,
    },
    {
        id: "a3",
        type: "Practice Activities",
        detail: "In-lesson practice & tasks",
        purpose: "Reinforce learning and skills practice",
        weight: 15,
        required: true,
    },
    {
        id: "a4",
        type: "Final Assessment",
        detail: "Final exam or project",
        purpose: "Evaluate overall learning achievement",
        weight: 40,
        required: true,
    },
];

export const initialGrades: GradeRow[] = [
    { id: "g1", grade: "A", min: 90, max: 100 },
    { id: "g2", grade: "B", min: 80, max: 89 },
    { id: "g3", grade: "C", min: 70, max: 79 },
    { id: "g4", grade: "D", min: 60, max: 69 },
    { id: "g5", grade: "F", min: 0, max: 59 },
];

export const uid = () => Math.random().toString(36).slice(2, 9);

/////////////////////////////////////////////////////////////////////////////


const STEPS = [
    "Course Details",
    "Lessons",
    "Practice Activities",
    "Course Assessment",
    "Review & Publish",
];

export default function CreateCoursePage() {
    const [step, setStep] = useState(0);

    // Step 1 — basic info
    const [title, setTitle] = useState("");
    const [code, setCode] = useState("");
    const [category, setCategory] = useState("");
    const [courseType, setCourseType] = useState("");
    const [difficulty, setDifficulty] = useState("");
    const [lectureType, setLectureType] = useState("");
    const [audience, setAudience] = useState("");
    const [duration, setDuration] = useState("");
    const [prerequisites, setPrerequisites] = useState("");
    const [classLimit, setClassLimit] = useState("");
    const [price, setPrice] = useState("");
    const [certification, setCertification] = useState("");
    const [governingBody, setGoverningBody] = useState("");
    const [description, setDescription] = useState("");
    const [objectives, setObjectives] = useState<string[]>(["", "", ""]);
    const [outcomes, setOutcomes] = useState<string[]>(["", "", ""]);
    const [requirements, setRequirements] = useState("");
    const [sessions, setSessions] = useState<SessionRow[]>(initialSessions);
    const [publishStatus, setPublishStatus] = useState("draft");
    const [scheduleDate, setScheduleDate] = useState("");
    const [scheduleTime, setScheduleTime] = useState("");

    // Step 2/3 — lessons + activities
    const [lessons, setLessons] = useState<LessonDraft[]>(initialLessons);

    // Step 4 — assessment
    const [assessments, setAssessments] = useState<AssessmentRow[]>(initialAssessments);
    const [grades, setGrades] = useState<GradeRow[]>(initialGrades);
    const [gradingSystem, setGradingSystem] = useState("Percentage");
    const [passMark, setPassMark] = useState(60);
    const [feedbackVisibility, setFeedbackVisibility] = useState("After each assessment");
    const [detailedFeedback, setDetailedFeedback] = useState(true);
    const [showAnswers, setShowAnswers] = useState(true);
    const [instructorFeedback, setInstructorFeedback] = useState(true);
    const [maxAttempts, setMaxAttempts] = useState(2);
    const [resultVisibility, setResultVisibility] = useState("Immediately after submission");
    const [evaluationNotes, setEvaluationNotes] = useState("");

    const totalWeight = assessments.reduce((s, a) => s + (Number(a.weight) || 0), 0);
    const totalActivities = lessons.reduce((s, l) => s + l.activities.length, 0);
    const totalTasks = lessons.reduce((s, l) => s + l.assessments.length, 0);

    const stepError = useMemo(() => {
        if (step === 0) {
            if (!title.trim()) return "Add a course title to continue.";
            if (!category) return "Select a category / department.";
            if (!courseType) return "Select a course type.";
            if (!description.trim()) return "Add a course description.";
            return null;
        }
        if (step === 1) {
            if (lessons.length === 0) return "Add at least one lesson.";
            if (lessons.some((l) => !l.title.trim())) return "Every lesson needs a title.";
            return null;
        }
        if (step === 3 && totalWeight !== 100) {
            return `Assessment weightage must total 100% (currently ${totalWeight}%).`;
        }
        return null;
    }, [step, title, category, courseType, description, lessons, totalWeight]);

    const next = () => {
        if (stepError) {
            toast.error(stepError);
            return;
        }
        setStep((s) => Math.min(s + 1, STEPS.length - 1));
    };

    const saveDraft = () =>
        toast.success("Saved as draft", {
            description: title.trim() ? title : "Untitled course",
        });

    return (
        <div className="space-y-6 pb-24 py-6">
            <PageHeader
                eyebrow="Course Creator"
                title="Create New Course"
                description="Build a high-quality course and empower students to learn new skills."
                action={
                    <Button variant="outline" onClick={saveDraft}>
                        Save as Draft
                    </Button>
                }
            />

            <Stepper step={step} onStep={setStep} />

            {step === 0 && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Course Title *" className="sm:col-span-2">
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                                        placeholder="Enter a clear and compelling course title"
                                    />
                                    <Counter value={title.length} max={100} />
                                </Field>
                                <Field label="Course Code">
                                    <Input
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.slice(0, 20))}
                                        placeholder="e.g. CS101"
                                    />
                                </Field>
                                <Field label="Category / Department *">
                                    <Picker value={category} onChange={setCategory} options={CATEGORIES} placeholder="Select category" />
                                </Field>
                                <Field label="Course Type *">
                                    <Picker value={courseType} onChange={setCourseType} options={COURSE_TYPES} placeholder="Select course type" />
                                </Field>
                                <Field label="Difficulty Level">
                                    <Picker value={difficulty} onChange={setDifficulty} options={DIFFICULTIES} placeholder="Select difficulty" />
                                </Field>
                                <Field label="Lecture Type">
                                    <Picker value={lectureType} onChange={setLectureType} options={LECTURE_TYPES} placeholder="Select lecture type" />
                                </Field>
                                <Field label="Target Audience (Student Profile)" className="sm:col-span-2">
                                    <Textarea
                                        rows={2}
                                        value={audience}
                                        onChange={(e) => setAudience(e.target.value.slice(0, 200))}
                                        placeholder="Describe your ideal student"
                                    />
                                    <Counter value={audience.length} max={200} />
                                </Field>
                                <Field label="Course Duration">
                                    <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 8 weeks / 40 hours" />
                                </Field>
                                <Field label="Prerequisites (if any)">
                                    <Input value={prerequisites} onChange={(e) => setPrerequisites(e.target.value)} placeholder="Enter prerequisites" />
                                </Field>
                                <Field label="Class Limit">
                                    <Input
                                        type="number"
                                        min={0}
                                        value={classLimit}
                                        onChange={(e) => setClassLimit(e.target.value)}
                                        placeholder="Maximum number of students"
                                    />
                                </Field>
                                <Field label="Course Minimum Price (KES)">
                                    <Input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Enter amount" />
                                </Field>
                                <Field label="Certification">
                                    <Picker value={certification} onChange={setCertification} options={CERTIFICATIONS} placeholder="Select certification" />
                                </Field>
                                <Field label="Governing Body (Accrediting Authority)">
                                    <Input
                                        value={governingBody}
                                        onChange={(e) => setGoverningBody(e.target.value)}
                                        placeholder="Enter governing body name (if any)"
                                    />
                                </Field>
                            </div>

                            <div className="space-y-4">
                                <Field label="Course Thumbnail">
                                    <UploadBox
                                        icon={<ImageIcon className="h-5 w-5" />}
                                        hint="Recommended size 1280×720 (16:9). JPG, PNG or WEBP (max 2MB)."
                                    />
                                </Field>
                                <Field label="Preview Video">
                                    <UploadBox icon={<Video className="h-5 w-5" />} hint="MP4, MOV or WEBM (max 100MB)." />
                                    <p className="py-2 text-center text-xs text-muted-foreground">or</p>
                                    <Input placeholder="Enter YouTube or Vimeo link" />
                                    <p className="mt-1 text-xs text-muted-foreground">Link will be embedded as preview.</p>
                                </Field>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Course Description *</CardTitle>
                            <CardDescription>
                                What will students learn and why is this course important?
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                rows={6}
                                value={description}
                                onChange={(e) => setDescription(e.target.value.slice(0, 5000))}
                                placeholder="Write a detailed description of your course…"
                            />
                            <Counter value={description.length} max={5000} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Objectives &amp; Outcomes</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2">
                            <ListEditor
                                label="Course Objectives"
                                hint="List the key objectives of this course."
                                items={objectives}
                                onChange={setObjectives}
                                placeholder="Enter objective"
                            />
                            <ListEditor
                                label="Course Outcomes (CLOs)"
                                hint="Define what learners will be able to do by the end."
                                items={outcomes}
                                onChange={setOutcomes}
                                placeholder="Enter outcome"
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Requirements</CardTitle>
                            <CardDescription>
                                Knowledge, skills, tools or resources students need before taking this course.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                rows={4}
                                value={requirements}
                                onChange={(e) => setRequirements(e.target.value.slice(0, 1000))}
                                placeholder="Enter student requirements"
                            />
                            <Counter value={requirements.length} max={1000} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Training Structure (Per Session)</CardTitle>
                            <CardDescription>
                                Define the structure of your training. You can edit or add sessions later.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="overflow-x-auto rounded-lg border">
                                <Table className="min-w-[720px]">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-20">Session</TableHead>
                                            <TableHead>Session Title</TableHead>
                                            <TableHead>Topics / Key Points</TableHead>
                                            <TableHead className="w-32">Duration (mins)</TableHead>
                                            <TableHead className="w-44">Type</TableHead>
                                            <TableHead className="w-12" />
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sessions.map((s, i) => (
                                            <TableRow key={s.id}>
                                                <TableCell className="font-mono text-sm">{i + 1}</TableCell>
                                                <TableCell>
                                                    <Input
                                                        value={s.title}
                                                        onChange={(e) =>
                                                            setSessions((rows) =>
                                                                rows.map((r) => (r.id === s.id ? { ...r, title: e.target.value } : r)),
                                                            )
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        value={s.topics}
                                                        onChange={(e) =>
                                                            setSessions((rows) =>
                                                                rows.map((r) => (r.id === s.id ? { ...r, topics: e.target.value } : r)),
                                                            )
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        value={s.duration}
                                                        onChange={(e) =>
                                                            setSessions((rows) =>
                                                                rows.map((r) =>
                                                                    r.id === s.id ? { ...r, duration: Number(e.target.value) || 0 } : r,
                                                                ),
                                                            )
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Picker
                                                        value={s.type}
                                                        onChange={(v) =>
                                                            setSessions((rows) => rows.map((r) => (r.id === s.id ? { ...r, type: v } : r)))
                                                        }
                                                        options={SESSION_TYPES}
                                                        placeholder="Type"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label="Remove session"
                                                        onClick={() => setSessions((rows) => rows.filter((r) => r.id !== s.id))}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setSessions((rows) => [
                                        ...rows,
                                        {
                                            id: uid(),
                                            no: rows.length + 1,
                                            title: "",
                                            topics: "",
                                            duration: 60,
                                            type: "Live Lecture",
                                        },
                                    ])
                                }
                            >
                                <Plus className="mr-1 h-4 w-4" /> Add Session
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Publish Status</CardTitle>
                            <CardDescription>Choose the status of your course.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <RadioGroup
                                value={publishStatus}
                                onValueChange={setPublishStatus}
                                className="grid gap-3 md:grid-cols-3"
                            >
                                {[
                                    { v: "draft", t: "Draft", d: "Save as draft and continue editing later." },
                                    { v: "published", t: "Published", d: "Make this course live and visible to students." },
                                    { v: "scheduled", t: "Scheduled", d: "Publish at a specific date and time." },
                                ].map((o) => (
                                    <Label
                                        key={o.v}
                                        htmlFor={`pub-${o.v}`}
                                        className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 has-[button[data-state=checked]]:border-primary has-[button[data-state=checked]]:bg-primary/5"
                                    >
                                        <RadioGroupItem id={`pub-${o.v}`} value={o.v} className="mt-1" />
                                        <span>
                                            <span className="block text-sm font-medium">{o.t}</span>
                                            <span className="block text-xs text-muted-foreground">{o.d}</span>
                                        </span>
                                    </Label>
                                ))}
                            </RadioGroup>
                            {publishStatus === "scheduled" && (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field label="Schedule date">
                                        <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
                                    </Field>
                                    <Field label="Schedule time">
                                        <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
                                    </Field>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {step === 1 && (
                <LessonsStep lessons={lessons} setLessons={setLessons} />
            )}

            {step === 2 && (
                <ActivitiesStep lessons={lessons} setLessons={setLessons} />
            )}

            {step === 3 && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="flex-row items-start justify-between gap-4">
                            <div>
                                <CardTitle className="text-base">Course Assessment Structure</CardTitle>
                                <CardDescription>
                                    Define how learners will be assessed and how their performance is evaluated.
                                </CardDescription>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                    setAssessments((rows) => [
                                        ...rows,
                                        {
                                            id: uid(),
                                            type: "Quizzes",
                                            detail: "",
                                            purpose: "",
                                            weight: 0,
                                            required: false,
                                        },
                                    ])
                                }
                            >
                                <Plus className="mr-1 h-4 w-4" /> Add Assessment
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto rounded-lg border">
                                <Table className="min-w-[760px]">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-52">Assessment Type</TableHead>
                                            <TableHead>Purpose</TableHead>
                                            <TableHead className="w-32">Weightage</TableHead>
                                            <TableHead className="w-24">Required</TableHead>
                                            <TableHead className="w-12" />
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {assessments.map((a) => (
                                            <TableRow key={a.id}>
                                                <TableCell className="space-y-1">
                                                    <Picker
                                                        value={a.type}
                                                        onChange={(v) =>
                                                            setAssessments((rows) => rows.map((r) => (r.id === a.id ? { ...r, type: v } : r)))
                                                        }
                                                        options={ASSESSMENT_TYPES}
                                                        placeholder="Type"
                                                    />
                                                    <Input
                                                        value={a.detail}
                                                        placeholder="Short detail"
                                                        onChange={(e) =>
                                                            setAssessments((rows) =>
                                                                rows.map((r) => (r.id === a.id ? { ...r, detail: e.target.value } : r)),
                                                            )
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        value={a.purpose}
                                                        onChange={(e) =>
                                                            setAssessments((rows) =>
                                                                rows.map((r) => (r.id === a.id ? { ...r, purpose: e.target.value } : r)),
                                                            )
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            max={100}
                                                            value={a.weight}
                                                            onChange={(e) =>
                                                                setAssessments((rows) =>
                                                                    rows.map((r) =>
                                                                        r.id === a.id ? { ...r, weight: Number(e.target.value) || 0 } : r,
                                                                    ),
                                                                )
                                                            }
                                                        />
                                                        <span className="text-sm text-muted-foreground">%</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={a.required}
                                                        onCheckedChange={(c) =>
                                                            setAssessments((rows) =>
                                                                rows.map((r) => (r.id === a.id ? { ...r, required: c === true } : r)),
                                                            )
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label="Remove assessment"
                                                        onClick={() => setAssessments((rows) => rows.filter((r) => r.id !== a.id))}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow>
                                            <TableCell className="font-semibold">Total Weightage</TableCell>
                                            <TableCell />
                                            <TableCell
                                                className={
                                                    totalWeight === 100 ? "font-semibold text-primary" : "font-semibold text-destructive"
                                                }
                                            >
                                                {totalWeight}%
                                            </TableCell>
                                            <TableCell colSpan={2} />
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Evaluation</CardTitle>
                            <CardDescription>
                                Define how assessments are scored, graded, and feedback is provided.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Grading System">
                                    <Picker
                                        value={gradingSystem}
                                        onChange={setGradingSystem}
                                        options={["Percentage", "Letter grade", "Pass / Fail", "Points"]}
                                        placeholder="Select grading method"
                                    />
                                </Field>
                                <Field label="Passing Criteria (minimum score %)">
                                    <Input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={passMark}
                                        onChange={(e) => setPassMark(Number(e.target.value) || 0)}
                                    />
                                </Field>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium">Grade Breakdown (Optional)</p>
                                    <p className="text-xs text-muted-foreground">Define grade ranges and labels.</p>
                                </div>
                                <div className="overflow-x-auto rounded-lg border">
                                    <Table className="min-w-[520px]">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-28">Grade</TableHead>
                                                <TableHead>Min Score (%)</TableHead>
                                                <TableHead>Max Score (%)</TableHead>
                                                <TableHead className="w-12" />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {grades.map((g) => (
                                                <TableRow key={g.id}>
                                                    <TableCell>
                                                        <Input
                                                            value={g.grade}
                                                            onChange={(e) =>
                                                                setGrades((rows) =>
                                                                    rows.map((r) => (r.id === g.id ? { ...r, grade: e.target.value } : r)),
                                                                )
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            value={g.min}
                                                            onChange={(e) =>
                                                                setGrades((rows) =>
                                                                    rows.map((r) => (r.id === g.id ? { ...r, min: Number(e.target.value) || 0 } : r)),
                                                                )
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            value={g.max}
                                                            onChange={(e) =>
                                                                setGrades((rows) =>
                                                                    rows.map((r) => (r.id === g.id ? { ...r, max: Number(e.target.value) || 0 } : r)),
                                                                )
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            aria-label="Remove grade"
                                                            onClick={() => setGrades((rows) => rows.filter((r) => r.id !== g.id))}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setGrades((rows) => [...rows, { id: uid(), grade: "", min: 0, max: 0 }])}
                                >
                                    <Plus className="mr-1 h-4 w-4" /> Add Grade
                                </Button>
                            </div>

                            <Separator />

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Feedback Visibility">
                                    <Picker
                                        value={feedbackVisibility}
                                        onChange={setFeedbackVisibility}
                                        options={["After each assessment", "After course completion", "Manual release"]}
                                        placeholder="Select"
                                    />
                                </Field>
                                <Field label="Result Visibility">
                                    <Picker
                                        value={resultVisibility}
                                        onChange={setResultVisibility}
                                        options={[
                                            "Immediately after submission",
                                            "After grading",
                                            "At the end of the course",
                                        ]}
                                        placeholder="Select"
                                    />
                                </Field>
                                <Field label="Maximum Attempts">
                                    <Input
                                        type="number"
                                        min={1}
                                        value={maxAttempts}
                                        onChange={(e) => setMaxAttempts(Number(e.target.value) || 1)}
                                    />
                                </Field>
                            </div>

                            <div className="space-y-3">
                                <ToggleRow
                                    label="Detailed Feedback"
                                    hint="Show detailed feedback to learners"
                                    checked={detailedFeedback}
                                    onChange={setDetailedFeedback}
                                />
                                <ToggleRow
                                    label="Correct Answers"
                                    hint="Show correct answers after submission"
                                    checked={showAnswers}
                                    onChange={setShowAnswers}
                                />
                                <ToggleRow
                                    label="Feedback for Instructors"
                                    hint="Allow instructors to provide manual feedback"
                                    checked={instructorFeedback}
                                    onChange={setInstructorFeedback}
                                />
                            </div>

                            <Field label="Evaluation Notes (Optional)">
                                <Textarea
                                    rows={3}
                                    value={evaluationNotes}
                                    onChange={(e) => setEvaluationNotes(e.target.value.slice(0, 500))}
                                    placeholder="Add any additional instructions or notes for instructors."
                                />
                                <Counter value={evaluationNotes.length} max={500} />
                            </Field>
                        </CardContent>
                    </Card>
                </div>
            )}

            {step === 4 && (
                <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Course Preview</CardTitle>
                            <CardDescription>Review your course as students will see it.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="rounded-xl border bg-muted/40 p-5">
                                <div className="flex flex-wrap items-center gap-2">
                                    {courseType && <Badge>{courseType}</Badge>}
                                    {difficulty && <Badge variant="secondary">{difficulty}</Badge>}
                                </div>
                                <h2 className="mt-3 text-xl font-bold">{title || "Untitled course"}</h2>
                                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                                    {description || "No description added yet."}
                                </p>
                                <p className="mt-4 text-sm font-semibold">
                                    {price ? `From KES ${Number(price).toLocaleString()}` : "Price not set"}
                                </p>
                            </div>

                            <SummaryList
                                title="What You'll Learn"
                                items={outcomes.filter((o) => o.trim())}
                                empty="No outcomes added yet."
                            />
                            <SummaryList
                                title="Course Objectives"
                                items={objectives.filter((o) => o.trim())}
                                empty="No objectives added yet."
                            />

                            <div>
                                <p className="mb-2 text-sm font-semibold">Curriculum Overview</p>
                                <ul className="divide-y rounded-lg border text-sm">
                                    {lessons.map((l, i) => (
                                        <li key={l.id} className="flex items-center justify-between px-4 py-2.5">
                                            <span>
                                                {i + 1}. {l.title || "Untitled lesson"}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {l.activities.length} activities · {l.assessments.length} tasks
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="h-fit lg:sticky lg:top-20">
                        <CardHeader>
                            <CardTitle className="text-base">Course Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <SummaryRow label="Category" value={category || "—"} />
                            <SummaryRow label="Course code" value={code || "—"} />
                            <SummaryRow label="Duration" value={duration || "—"} />
                            <SummaryRow label="Lecture type" value={lectureType || "—"} />
                            <SummaryRow label="Certification" value={certification || "—"} />
                            <SummaryRow label="Sessions" value={String(sessions.length)} />
                            <SummaryRow label="Lessons" value={String(lessons.length)} />
                            <SummaryRow label="Practice activities" value={String(totalActivities)} />
                            <SummaryRow label="Assessment tasks" value={String(totalTasks)} />
                            <SummaryRow label="Assessment weight" value={`${totalWeight}%`} />
                            <SummaryRow label="Pass mark" value={`${passMark}%`} />
                            <SummaryRow label="Status" value={publishStatus} />
                            <Separator className="my-3" />
                            <Button
                                className="w-full"
                                onClick={() =>
                                    toast.success(
                                        publishStatus === "published" ? "Course published" : "Course saved",
                                        { description: `${title || "Untitled course"} · mock data only` },
                                    )
                                }
                            >
                                <Check className="mr-1 h-4 w-4" />
                                {publishStatus === "published" ? "Publish course" : "Save course"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
                <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
                    Back
                </Button>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={saveDraft}>
                        Save as Draft
                    </Button>
                    {step < STEPS.length - 1 && <Button onClick={next}>Next: {STEPS[step + 1]}</Button>}
                </div>
            </div>
        </div>
    );
}

function Stepper({ step, onStep }: { step: number; onStep: (n: number) => void }) {
    return (
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <ol className="flex min-w-max items-center gap-3">
                {STEPS.map((s, i) => (
                    <li key={s} className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => onStep(i)}
                            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${i === step
                                ? "border-primary bg-primary text-primary-foreground"
                                : i < step
                                    ? "border-primary/40 text-primary"
                                    : "text-muted-foreground"
                                }`}
                        >
                            <span
                                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${i === step ? "bg-primary-foreground/20" : "bg-muted"
                                    }`}
                            >
                                {i < step ? <Check className="h-3 w-3" /> : i + 1}
                            </span>
                            {s}
                        </button>
                        {i < STEPS.length - 1 && <span className="h-px w-6 bg-border" />}
                    </li>
                ))}
            </ol>
        </div>
    );
}

function LessonsStep({
    lessons,
    setLessons,
}: {
    lessons: LessonDraft[];
    setLessons: React.Dispatch<React.SetStateAction<LessonDraft[]>>;
}) {
    const patch = (id: string, p: Partial<LessonDraft>) =>
        setLessons((rows) => rows.map((r) => (r.id === id ? { ...r, ...p } : r)));

    return (
        <div className="space-y-4">
            {lessons.map((l, i) => (
                <Card key={l.id}>
                    <CardHeader className="flex-row items-start justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <BookOpen className="h-4 w-4 text-primary" /> Lesson {i + 1}
                            </CardTitle>
                            <CardDescription>Add engaging content for effective learning.</CardDescription>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Remove lesson"
                            onClick={() => setLessons((rows) => rows.filter((r) => r.id !== l.id))}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                            <Field label="Lesson Title *">
                                <Input
                                    value={l.title}
                                    onChange={(e) => patch(l.id, { title: e.target.value.slice(0, 150) })}
                                    placeholder="Enter a clear and engaging lesson title"
                                />
                            </Field>
                            <Field label="Duration (optional)">
                                <Input
                                    value={l.duration}
                                    onChange={(e) => patch(l.id, { duration: e.target.value })}
                                    placeholder="e.g. 20 mins"
                                />
                            </Field>
                        </div>
                        <Field label="Lesson Content">
                            <Textarea
                                rows={5}
                                value={l.content}
                                onChange={(e) => patch(l.id, { content: e.target.value.slice(0, 10000) })}
                                placeholder="Write or paste your lesson content here…"
                            />
                            <Counter value={l.content.length} max={10000} />
                        </Field>
                        <div className="flex flex-wrap gap-2">
                            {["Image", "Video", "Audio", "File", "Embed"].map((k) => (
                                <Button
                                    key={k}
                                    size="sm"
                                    variant="outline"
                                    onClick={() => toast.info(`${k} upload is mocked in this prototype.`)}
                                >
                                    <Plus className="mr-1 h-3.5 w-3.5" /> {k}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}
            <Button
                variant="outline"
                onClick={() =>
                    setLessons((rows) => [
                        ...rows,
                        {
                            id: uid(),
                            no: rows.length + 1,
                            title: "",
                            duration: "",
                            content: "",
                            activities: [],
                            assessments: [],
                        },
                    ])
                }
            >
                <Plus className="mr-1 h-4 w-4" /> Add Lesson
            </Button>
        </div>
    );
}

function ActivitiesStep({
    lessons,
    setLessons,
}: {
    lessons: LessonDraft[];
    setLessons: React.Dispatch<React.SetStateAction<LessonDraft[]>>;
}) {
    const add = (id: string, key: "activities" | "assessments", value: string) =>
        setLessons((rows) => rows.map((r) => (r.id === id ? { ...r, [key]: [...r[key], value] } : r)));

    const remove = (id: string, key: "activities" | "assessments", index: number) =>
        setLessons((rows) =>
            rows.map((r) => (r.id === id ? { ...r, [key]: r[key].filter((_, i) => i !== index) } : r)),
        );

    return (
        <div className="space-y-4">
            {lessons.map((l, i) => (
                <Card key={l.id}>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Lesson {i + 1}: {l.title || "Untitled lesson"}
                        </CardTitle>
                        <CardDescription>
                            Add activities that help learners practise, plus tasks to evaluate understanding.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2">
                        <ItemColumn
                            title="Practice Activities"
                            empty="No practice activities added yet."
                            items={l.activities}
                            onAdd={(v) => add(l.id, "activities", v)}
                            onRemove={(idx) => remove(l.id, "activities", idx)}
                            suggestions={ACTIVITY_TYPES}
                        />
                        <ItemColumn
                            title="Assessment Tasks"
                            empty="No assessment tasks added yet."
                            items={l.assessments}
                            onAdd={(v) => add(l.id, "assessments", v)}
                            onRemove={(idx) => remove(l.id, "assessments", idx)}
                            suggestions={["Quiz", "Assignment", "Reflection", "Peer review"]}
                        />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function ItemColumn({
    title,
    empty,
    items,
    onAdd,
    onRemove,
    suggestions,
}: {
    title: string;
    empty: string;
    items: string[];
    onAdd: (v: string) => void;
    onRemove: (i: number) => void;
    suggestions: string[];
}) {
    const [value, setValue] = useState("");
    return (
        <div className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-semibold">{title}</p>
            {items.length === 0 ? (
                <div className="flex flex-col items-center gap-1 rounded-md border border-dashed py-6 text-center">
                    <ClipboardList className="h-5 w-5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{empty}</p>
                </div>
            ) : (
                <ul className="space-y-2">
                    {items.map((it, i) => (
                        <li key={i} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                            <span>{it}</span>
                            <Button variant="ghost" size="icon" aria-label="Remove item" onClick={() => onRemove(i)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
            <div className="flex gap-2">
                <Input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={`Add ${title.toLowerCase()}`}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && value.trim()) {
                            onAdd(value.trim());
                            setValue("");
                        }
                    }}
                />
                <Button
                    variant="outline"
                    onClick={() => {
                        if (!value.trim()) return;
                        onAdd(value.trim());
                        setValue("");
                    }}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => onAdd(s)}
                        className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary"
                    >
                        + {s}
                    </button>
                ))}
            </div>
        </div>
    );
}

function Field({
    label,
    children,
    className,
}: {
    label: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`space-y-1.5 ${className ?? ""}`}>
            <Label className="text-xs font-medium">{label}</Label>
            {children}
        </div>
    );
}

function Counter({ value, max }: { value: number; max: number }) {
    return (
        <p className="text-right text-[11px] text-muted-foreground">
            {value}/{max}
        </p>
    );
}

function Picker({
    value,
    onChange,
    options,
    placeholder,
}: {
    value: string;
    onChange: (v: string) => void;
    options: string[];
    placeholder: string;
}) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {options.map((o) => (
                    <SelectItem key={o} value={o}>
                        {o}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

function UploadBox({ icon, hint }: { icon: React.ReactNode; hint: string }) {
    return (
        <button
            type="button"
            onClick={() => toast.info("Upload is mocked in this prototype.")}
            className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center hover:border-primary"
        >
            <span className="text-primary">{icon}</span>
            <span className="text-sm font-medium">Click to upload or drag and drop</span>
            <span className="text-xs text-muted-foreground">{hint}</span>
        </button>
    );
}

function ListEditor({
    label,
    hint,
    items,
    onChange,
    placeholder,
}: {
    label: string;
    hint: string;
    items: string[];
    onChange: (v: string[]) => void;
    placeholder: string;
}) {
    return (
        <div className="space-y-3">
            <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{hint}</p>
            </div>
            {items.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                    <span className="w-6 text-xs text-muted-foreground">{i + 1}</span>
                    <Input
                        value={v}
                        placeholder={placeholder}
                        onChange={(e) => onChange(items.map((it, idx) => (idx === i ? e.target.value : it)))}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remove"
                        onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => onChange([...items, ""])}>
                <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
        </div>
    );
}

function ToggleRow({
    label,
    hint,
    checked,
    onChange,
}: {
    label: string;
    hint: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{hint}</p>
            </div>
            <Switch checked={checked} onCheckedChange={onChange} />
        </div>
    );
}

function SummaryList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
    return (
        <div>
            <p className="mb-2 text-sm font-semibold">{title}</p>
            {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">{empty}</p>
            ) : (
                <ul className="space-y-1.5">
                    {items.map((it, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            {it}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium capitalize">{value}</span>
        </div>
    );
}
