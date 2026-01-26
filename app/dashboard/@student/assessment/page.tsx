'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import clsx from 'clsx';
import {
    AlertTriangle,
    BookOpen,
    CheckCircle,
    FileText,
    GraduationCap,
    HelpCircle,
    Target,
} from 'lucide-react';
import { useState } from 'react';

type TabKey = 'assignments' | 'quizzes' | 'exams';

// Mock student grades data
const STUDENT_GRADES_DATA = {
    courses: [
        {
            id: '1',
            title: 'Advanced React Development',
            code: 'CS-401',
            instructor: 'John Smith',
            semester: 'Fall 2024',
            assignments: [
                {
                    id: '1',
                    title: 'React Fundamentals Project',
                    type: 'assignment',
                    dueDate: '2024-10-15',
                    submittedDate: '2024-10-14',
                    maxPoints: 100,
                    earnedPoints: 92,
                    grade: 'A-',
                    feedback:
                        'Excellent work on component structure and state management. Consider adding more error handling.',
                    status: 'graded',
                },
                {
                    id: '2',
                    title: 'Hooks and Context Quiz',
                    type: 'quiz',
                    dueDate: '2024-11-01',
                    submittedDate: '2024-10-30',
                    maxPoints: 50,
                    earnedPoints: 45,
                    grade: 'A',
                    feedback: 'Great understanding of React concepts.',
                    status: 'graded',
                },
                {
                    id: '3',
                    title: 'Final Project - E-commerce App',
                    type: 'project',
                    dueDate: '2024-12-15',
                    submittedDate: null,
                    maxPoints: 150,
                    earnedPoints: null,
                    grade: null,
                    feedback: null,
                    status: 'pending',
                },
                {
                    id: '4',
                    title: 'TypeScript Integration Assignment',
                    type: 'assignment',
                    dueDate: '2024-11-20',
                    submittedDate: '2024-11-19',
                    maxPoints: 75,
                    earnedPoints: 68,
                    grade: 'B+',
                    feedback: 'Good work on type definitions. Some room for improvement in advanced types.',
                    status: 'graded',
                },
            ],
        },
        {
            id: '2',
            title: 'Data Science Fundamentals',
            code: 'DS-301',
            instructor: 'Dr. Lisa Chen',
            semester: 'Fall 2024',
            assignments: [
                {
                    id: '1',
                    title: 'Python Basics Assessment',
                    type: 'quiz',
                    dueDate: '2024-09-15',
                    submittedDate: '2024-09-14',
                    maxPoints: 50,
                    earnedPoints: 48,
                    grade: 'A',
                    feedback: 'Excellent grasp of Python fundamentals.',
                    status: 'graded',
                },
                {
                    id: '2',
                    title: 'Data Analysis Project',
                    type: 'project',
                    dueDate: '2024-10-30',
                    submittedDate: '2024-10-28',
                    maxPoints: 100,
                    earnedPoints: 96,
                    grade: 'A',
                    feedback: 'Outstanding analysis and visualization. Great insights drawn from the data.',
                    status: 'graded',
                },
                {
                    id: '3',
                    title: 'Machine Learning Final',
                    type: 'exam',
                    dueDate: '2024-11-30',
                    submittedDate: '2024-11-30',
                    maxPoints: 100,
                    earnedPoints: 92,
                    grade: 'A-',
                    feedback: 'Strong performance on all sections. Minor errors in ensemble methods.',
                    status: 'graded',
                },
            ],
        },
        {
            id: '3',
            title: 'Digital Marketing Strategy',
            code: 'MK-201',
            instructor: 'Mike Wilson',
            semester: 'Summer 2024',
            assignments: [
                {
                    id: '1',
                    title: 'SEO Optimization Report',
                    type: 'assignment',
                    dueDate: '2024-07-15',
                    submittedDate: '2024-07-15',
                    maxPoints: 75,
                    earnedPoints: 68,
                    grade: 'B+',
                    feedback: 'Good analysis but could include more advanced SEO techniques.',
                    status: 'graded',
                },
                {
                    id: '2',
                    title: 'Social Media Campaign',
                    type: 'project',
                    dueDate: '2024-08-15',
                    submittedDate: '2024-08-14',
                    maxPoints: 100,
                    earnedPoints: 82,
                    grade: 'B',
                    feedback: 'Creative campaign ideas. Execution could be more detailed.',
                    status: 'graded',
                },
            ],
        },
    ],
};

export default function AssessmentPage() {
    const [activeTab, setActiveTab] = useState<TabKey>('assignments');

    // Categorize assessments by type
    const allAssessments = STUDENT_GRADES_DATA.courses.flatMap(course =>
        course.assignments.map(assignment => ({
            ...assignment,
            courseName: course.title,
            courseCode: course.code,
            instructor: course.instructor,
            semester: course.semester,
        }))
    );

    const assignments = allAssessments.filter(
        a => a.type === 'assignment' || a.type === 'project'
    );
    const quizzes = allAssessments.filter(a => a.type === 'quiz');
    const exams = allAssessments.filter(a => a.type === 'exam');

    const tabs = [
        {
            key: 'assignments' as TabKey,
            label: 'Assignments',
            icon: FileText,
            count: assignments.length,
        },
        {
            key: 'quizzes' as TabKey,
            label: 'Quizzes',
            icon: HelpCircle,
            count: quizzes.length,
        },
        {
            key: 'exams' as TabKey,
            label: 'Exams',
            icon: GraduationCap,
            count: exams.length,
        },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'graded':
                return 'bg-success/10 text-success';
            case 'pending':
                return 'bg-warning/10 text-warning';
            case 'overdue':
                return 'bg-destructive/10 text-destructive';
            default:
                return 'bg-muted text-muted-foreground';
        }
    };

    const getGradeColor = (percentage: number) => {
        if (percentage >= 90) return 'text-success';
        if (percentage >= 80) return 'text-primary';
        if (percentage >= 70) return 'text-warning';
        return 'text-destructive';
    };

    const getAssignmentIcon = (type: string) => {
        switch (type) {
            case 'assignment':
                return FileText;
            case 'quiz':
                return CheckCircle;
            case 'project':
                return Target;
            case 'exam':
                return BookOpen;
            default:
                return FileText;
        }
    };

    const renderAssessmentCard = (assessment: any) => {
        const AssessmentIcon = getAssignmentIcon(assessment.type);
        const isOverdue =
            assessment.dueDate &&
            new Date(assessment.dueDate) < new Date() &&
            !assessment.submittedDate;

        const percentage = assessment.earnedPoints
            ? (assessment.earnedPoints / assessment.maxPoints) * 100
            : 0;

        return (
            <Card key={`${assessment.courseCode}-${assessment.id}`} className="hover:shadow-md transition-shadow">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                            <AssessmentIcon className="text-primary mt-1 h-5 w-5 flex-shrink-0" />
                            <div className="flex-1">
                                <CardTitle className="text-base mb-1">{assessment.title}</CardTitle>
                                <p className="text-muted-foreground text-sm">
                                    {assessment.courseName} ({assessment.courseCode})
                                </p>
                                <p className="text-muted-foreground text-xs mt-1">
                                    {assessment.instructor} • {assessment.semester}
                                </p>
                            </div>
                        </div>
                        <Badge className={getStatusColor(isOverdue ? 'overdue' : assessment.status)}>
                            {isOverdue ? 'Overdue' : assessment.status}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground">Due Date:</span>
                            <p className="font-medium">{new Date(assessment.dueDate).toLocaleDateString()}</p>
                        </div>
                        {assessment.submittedDate && (
                            <div>
                                <span className="text-muted-foreground">Submitted:</span>
                                <p className="font-medium">
                                    {new Date(assessment.submittedDate).toLocaleDateString()}
                                </p>
                            </div>
                        )}
                    </div>

                    {assessment.earnedPoints !== null && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Score</span>
                                <div className="flex items-center gap-2">
                                    <span className={`font-bold ${getGradeColor(percentage)}`}>
                                        {assessment.earnedPoints}/{assessment.maxPoints}
                                    </span>
                                    <Badge variant="outline">{assessment.grade}</Badge>
                                </div>
                            </div>
                            <Progress value={percentage} className="h-2" />
                        </div>
                    )}

                    {assessment.feedback && (
                        <div className="bg-muted/50 rounded-md p-3">
                            <p className="text-sm">
                                <strong className="text-muted-foreground">Feedback:</strong>{' '}
                                {assessment.feedback}
                            </p>
                        </div>
                    )}

                    {isOverdue && (
                        <div className="text-destructive flex items-center gap-2 text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            <span>This assessment is overdue</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    const getCurrentAssessments = () => {
        switch (activeTab) {
            case 'assignments':
                return assignments;
            case 'quizzes':
                return quizzes;
            case 'exams':
                return exams;
            default:
                return [];
        }
    };

    const currentAssessments = getCurrentAssessments();

    return (
        <div className="container">
            <div className="flex flex-col md:flex-row gap-6">
                {/* LEFT MENU (desktop) / TOP MENU (mobile) */}
                <div className="md:w-64 border border-border rounded-md">
                    <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible p-4">
                        {tabs.map(({ key, label, count, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={clsx(
                                    'flex items-center justify-between gap-3 rounded-md px-4 py-3 text-sm whitespace-nowrap transition',
                                    activeTab === key
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-muted'
                                )}
                            >
                                <span className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    {label}
                                </span>
                                <span className="text-xs opacity-80">({count})</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* CONTENT */}
                <div className="flex-1">
                    {currentAssessments.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {currentAssessments.map(renderAssessmentCard)}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <p className="text-muted-foreground">
                                    No {activeTab} found
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}