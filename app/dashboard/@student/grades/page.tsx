'use client'

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    AlertTriangle,
    Award,
    BarChart3,
    BookOpen,
    Calendar, CheckCircle,
    Download,
    Eye,
    FileText,
    Target,
    TrendingUp
} from 'lucide-react';
import { useState } from 'react';
import { useUserProfile } from '../../../../context/profile-context';
import { useStudent } from '../../../../context/student-context';


// Mock student grades data
const STUDENT_GRADES_DATA = {
    student: {
        name: 'Alice Johnson',
        studentId: 'SU2024-001',
        email: 'alice.j@student.springfield.edu',
        institution: 'Springfield University',
        overallGPA: 3.7,
        totalCredits: 45,
        completedCourses: 3,
        currentSemester: 'Fall 2024'
    },
    courses: [
        {
            id: '1',
            title: 'Advanced React Development',
            code: 'CS-401',
            instructor: 'John Smith',
            credits: 4,
            semester: 'Fall 2024',
            status: 'in_progress',
            overallGrade: 85,
            letterGrade: 'B+',
            progress: 78,
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
                    feedback: 'Excellent work on component structure and state management. Consider adding more error handling.',
                    status: 'graded'
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
                    status: 'graded'
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
                    status: 'pending'
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
                    status: 'graded'
                }
            ],
            attendance: 95,
            participationGrade: 88,
            nextAssignment: 'Final Project - E-commerce App'
        },
        {
            id: '2',
            title: 'Data Science Fundamentals',
            code: 'DS-301',
            instructor: 'Dr. Lisa Chen',
            credits: 3,
            semester: 'Fall 2024',
            status: 'completed',
            overallGrade: 94,
            letterGrade: 'A',
            progress: 100,
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
                    status: 'graded'
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
                    status: 'graded'
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
                    status: 'graded'
                }
            ],
            attendance: 100,
            participationGrade: 95,
            nextAssignment: null
        },
        {
            id: '3',
            title: 'Digital Marketing Strategy',
            code: 'MK-201',
            instructor: 'Mike Wilson',
            credits: 3,
            semester: 'Summer 2024',
            status: 'completed',
            overallGrade: 78,
            letterGrade: 'B+',
            progress: 100,
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
                    status: 'graded'
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
                    status: 'graded'
                }
            ],
            attendance: 92,
            participationGrade: 85,
            nextAssignment: null
        }
    ]
};

export default function StudentGrades() {
    const [selectedCourse, setSelectedCourse] = useState<string>('all');
    const [selectedSemester, setSelectedSemester] = useState<string>('all');
    const [activeTab, setActiveTab] = useState('overview');

    const studentData = useStudent()
    const profile = useUserProfile()

    const { student, courses } = STUDENT_GRADES_DATA;

    const filteredCourses = courses.filter(course => {
        const courseMatch = selectedCourse === 'all' || course.id === selectedCourse;
        const semesterMatch = selectedSemester === 'all' || course.semester === selectedSemester;
        return courseMatch && semesterMatch;
    });

    const getGradeColor = (grade: number) => {
        if (grade >= 90) return 'text-green-600';
        if (grade >= 80) return 'text-blue-600';
        if (grade >= 70) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'graded': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getAssignmentIcon = (type: string) => {
        switch (type) {
            case 'assignment': return FileText;
            case 'quiz': return CheckCircle;
            case 'project': return Target;
            case 'exam': return BookOpen;
            default: return FileText;
        }
    };

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-self-end">
                <div className="text-right">
                    <p className="text-sm font-bold">{profile?.first_name} {profile?.last_name}</p>
                    <p className="text-xs text-muted-foreground">ID: {studentData?.uuid}</p>
                </div>
            </div>

            <div className="container mx-auto py-8">
                {/* Academic Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Overall GPA</p>
                                    <p className={`text-2xl font-bold ${getGradeColor(student.overallGPA * 25)}`}>
                                        {student.overallGPA}
                                    </p>
                                </div>
                                <BarChart3 className="w-8 h-8 text-primary" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Credits</p>
                                    <p className="text-2xl font-bold">{student.totalCredits}</p>
                                </div>
                                <BookOpen className="w-8 h-8 text-primary" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Completed Courses</p>
                                    <p className="text-2xl font-bold text-green-600">{student.completedCourses}</p>
                                </div>
                                <Award className="w-8 h-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Current Semester</p>
                                    <p className="text-lg font-bold">{student.currentSemester}</p>
                                </div>
                                <Calendar className="w-8 h-8 text-primary" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex gap-4 mb-6">
                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                        <SelectTrigger className="w-64">
                            <SelectValue placeholder="Filter by course" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Courses</SelectItem>
                            {courses.map(course => (
                                <SelectItem key={course.id} value={course.id}>
                                    {course.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Filter by semester" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Semesters</SelectItem>
                            <SelectItem value="Fall 2024">Fall 2024</SelectItem>
                            <SelectItem value="Summer 2024">Summer 2024</SelectItem>
                            <SelectItem value="Spring 2024">Spring 2024</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export Transcript
                    </Button>
                </div>

                {/* Main Content */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3 mt-4 mb-2">
                        <TabsTrigger value="overview">Course Overview</TabsTrigger>
                        <TabsTrigger value="assignments">Assignments & Grades</TabsTrigger>
                        <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredCourses.map(course => (
                                <Card key={course.id} className="overflow-hidden">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="text-base">{course.title}</CardTitle>
                                                <p className="text-sm text-muted-foreground">
                                                    {course.code} • {course.instructor}
                                                </p>
                                            </div>
                                            <Badge className={getStatusColor(course.status)}>
                                                {course.status.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm">Overall Grade</span>
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-bold ${getGradeColor(course.overallGrade)}`}>
                                                        {course.overallGrade}%
                                                    </span>
                                                    <Badge variant="outline">{course.letterGrade}</Badge>
                                                </div>
                                            </div>
                                            <Progress value={course.overallGrade} className="h-2" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">Progress:</span>
                                                <p className="font-medium">{course.progress}%</p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Credits:</span>
                                                <p className="font-medium">{course.credits}</p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Attendance:</span>
                                                <p className="font-medium">{course.attendance}%</p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Participation:</span>
                                                <p className="font-medium">{course.participationGrade}%</p>
                                            </div>
                                        </div>

                                        {course.nextAssignment && (
                                            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                                                <p className="text-sm font-medium text-blue-800">Next Assignment:</p>
                                                <p className="text-sm text-blue-600">{course.nextAssignment}</p>
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" className="flex-1">
                                                <Eye className="w-3 h-3 mr-1" />
                                                View Details
                                            </Button>
                                            <Button variant="outline" size="sm">
                                                <Download className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="assignments" className="space-y-6">
                        {filteredCourses.map(course => (
                            <Card key={course.id}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg">{course.title}</CardTitle>
                                            <p className="text-sm text-muted-foreground">
                                                {course.code} • Overall Grade:
                                                <span className={`ml-1 font-bold ${getGradeColor(course.overallGrade)}`}>
                                                    {course.overallGrade}% ({course.letterGrade})
                                                </span>
                                            </p>
                                        </div>
                                        <Badge className={getStatusColor(course.status)}>
                                            {course.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {course.assignments.map(assignment => {
                                            const AssignmentIcon = getAssignmentIcon(assignment.type);
                                            const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date() && !assignment.submittedDate;

                                            return (
                                                <div key={assignment.id} className="border rounded-lg p-4 space-y-3">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-start gap-3">
                                                            <AssignmentIcon className="w-5 h-5 mt-1 text-primary" />
                                                            <div>
                                                                <h4 className="font-medium">{assignment.title}</h4>
                                                                <p className="text-sm text-muted-foreground capitalize">
                                                                    {assignment.type} • Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                                                </p>
                                                                {assignment.submittedDate && (
                                                                    <p className="text-sm text-muted-foreground">
                                                                        Submitted: {new Date(assignment.submittedDate).toLocaleDateString()}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            {assignment.earnedPoints !== null ? (
                                                                <>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`font-bold ${getGradeColor((assignment.earnedPoints / assignment.maxPoints) * 100)}`}>
                                                                            {assignment.earnedPoints}/{assignment.maxPoints}
                                                                        </span>
                                                                        <Badge variant="outline">{assignment.grade}</Badge>
                                                                    </div>
                                                                    <Badge className={getStatusColor(assignment.status)}>
                                                                        {assignment.status}
                                                                    </Badge>
                                                                </>
                                                            ) : (
                                                                <Badge className={getStatusColor(isOverdue ? 'overdue' : 'pending')}>
                                                                    {isOverdue ? 'Overdue' : 'Pending'}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {assignment.feedback && (
                                                        <div className="bg-muted/20 p-3 rounded">
                                                            <p className="text-sm"><strong>Feedback:</strong> {assignment.feedback}</p>
                                                        </div>
                                                    )}

                                                    {isOverdue && (
                                                        <div className="flex items-center gap-2 text-red-600">
                                                            <AlertTriangle className="w-4 h-4" />
                                                            <span className="text-sm">This assignment is overdue</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </TabsContent>

                    <TabsContent value="analytics" className="space-y-6">
                        {/* Performance Analytics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5" />
                                        Grade Trends
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {courses.map(course => (
                                            <div key={course.id} className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span>{course.title}</span>
                                                    <span className={`font-medium ${getGradeColor(course.overallGrade)}`}>
                                                        {course.overallGrade}%
                                                    </span>
                                                </div>
                                                <Progress value={course.overallGrade} className="h-2" />
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5" />
                                        Performance Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm">Average Grade</span>
                                            <span className="font-bold text-lg">
                                                {Math.round(courses.reduce((sum, c) => sum + c.overallGrade, 0) / courses.length)}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm">Highest Grade</span>
                                            <span className="font-bold text-green-600">
                                                {Math.max(...courses.map(c => c.overallGrade))}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm">Average Attendance</span>
                                            <span className="font-bold">
                                                {Math.round(courses.reduce((sum, c) => sum + c.attendance, 0) / courses.length)}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm">Completed Assignments</span>
                                            <span className="font-bold">
                                                {courses.reduce((sum, c) => sum + c.assignments.filter(a => a.status === 'graded').length, 0)}/
                                                {courses.reduce((sum, c) => sum + c.assignments.length, 0)}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Detailed Course Analytics */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Course Performance Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {courses.map(course => (
                                        <div key={course.id} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="font-medium">{course.title}</h4>
                                                <Badge className={getStatusColor(course.status)}>
                                                    {course.status.replace('_', ' ')}
                                                </Badge>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="text-center">
                                                    <p className="text-2xl font-bold text-primary">{course.overallGrade}%</p>
                                                    <p className="text-sm text-muted-foreground">Overall Grade</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-2xl font-bold">{course.attendance}%</p>
                                                    <p className="text-sm text-muted-foreground">Attendance</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-2xl font-bold">{course.participationGrade}%</p>
                                                    <p className="text-sm text-muted-foreground">Participation</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-2xl font-bold">{course.assignments.filter(a => a.status === 'graded').length}</p>
                                                    <p className="text-sm text-muted-foreground">Completed</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}