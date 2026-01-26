'use client';

import { BookOpen, CheckCircle, Clock, PlusCircle, Star, TrendingUp, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '../../../../components/ui/button';

const elimikaDesignSystem = {
    components: {
        pageContainer: "container mx-auto px-4 py-6 max-w-7xl"
    }
};

const MySkillsPage = () => {
    const router = useRouter()
    // Mock data - replace with actual data from your backend
    const [overallProgress] = useState(65);
    const [topSkills] = useState([
        { name: 'Web Development', level: 'Advanced', icon: '💻', color: 'bg-blue-500' },
        { name: 'Data Analysis', level: 'Intermediate', icon: '📊', color: 'bg-green-500' },
        { name: 'UI/UX Design', level: 'Intermediate', icon: '🎨', color: 'bg-purple-500' }
    ]);

    const [courses] = useState([
        {
            id: 1,
            title: 'Full Stack Web Development',
            status: 'complete',
            progress: 100,
            grade: 'A',
            completedDate: '2024-01-15',
            category: 'Development'
        },
        {
            id: 2,
            title: 'Advanced React & Next.js',
            status: 'incomplete',
            progress: 68,
            grade: null,
            completedDate: null,
            category: 'Development'
        },
        {
            id: 3,
            title: 'Python for Data Science',
            status: 'passed',
            progress: 100,
            grade: 'B+',
            completedDate: '2024-02-20',
            category: 'Data Science'
        },
        {
            id: 4,
            title: 'Introduction to Machine Learning',
            status: 'incomplete',
            progress: 45,
            grade: null,
            completedDate: null,
            category: 'Data Science'
        },
        {
            id: 5,
            title: 'Digital Marketing Fundamentals',
            status: 'failed',
            progress: 100,
            grade: 'F',
            completedDate: '2024-03-10',
            category: 'Marketing'
        },
        {
            id: 6,
            title: 'UI/UX Design Principles',
            status: 'incomplete',
            progress: 30,
            grade: null,
            completedDate: null,
            category: 'Design'
        }
    ]);

    const getStatusBadge = (status: any) => {
        const badges = {
            complete: { text: 'Completed', bg: 'bg-blue-100', text_color: 'text-blue-800', icon: CheckCircle },
            passed: { text: 'Passed', bg: 'bg-green-100', text_color: 'text-green-800', icon: CheckCircle },
            failed: { text: 'Failed', bg: 'bg-red-100', text_color: 'text-destructive', icon: XCircle },
            incomplete: { text: 'In Progress', bg: 'bg-yellow-100', text_color: 'text-yellow-800', icon: Clock }
        };
        // @ts-ignore
        return badges[status] || badges.incomplete;
    };

    const getGradeColor = (grade: any) => {
        if (!grade) return 'text-muted-foreground';
        if (grade.startsWith('A')) return 'text-green-600';
        if (grade.startsWith('B')) return 'text-blue-600';
        if (grade.startsWith('C')) return 'text-yellow-600';
        if (grade.startsWith('D')) return 'text-orange-600';
        return 'text-destructive';
    };

    const stats = {
        total: courses.length,
        completed: courses.filter(c => c.status === 'complete' || c.status === 'passed').length,
        inProgress: courses.filter(c => c.status === 'incomplete').length,
        failed: courses.filter(c => c.status === 'failed').length
    };

    return (
        <div className={elimikaDesignSystem.components.pageContainer}>
            {/* Header */}
            <section className='mb-6'>
                <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">My Skills</h1>
                        <p className="text-sm text-muted-foreground">
                            Review, track, and develop your skills. Add new competencies, monitor your progress, and showcase your expertise.
                        </p>
                    </div>
                    <Button onClick={() => router.push('/dashboard/browse-courses')} size={"default"} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm">
                        <PlusCircle className="w-5 h-5" />
                        Add New Skill
                    </Button>
                </div>
            </section>

            <div className="my-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 rounded-md shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <p className="font-medium">🚧 This page is under construction.</p>
                    <p className="text-sm text-yellow-900">Mock data is being used for this template</p>
                </div>
            </div>

            {/* Hero Section - Skills Snapshot */}
            <section className="mb-8">
                <div className="bg-muted rounded-xl p-6 shadow-sm border border-input">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-6 h-6 text-primary" />
                        <h2 className="text-xl font-bold text-foreground">My Skills Snapshot</h2>
                    </div>

                    {/* Overall Progress */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-foreground">Overall Skills Progress</span>
                            <span className="text-2xl font-bold text-primary">{overallProgress}%</span>
                        </div>
                        <div className="w-full bg-background rounded-full h-3 overflow-hidden border border-input">
                            <div
                                className="bg-primary h-3 rounded-full transition-all duration-500"
                                style={{ width: `${overallProgress}%` }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Skills Verified</p>
                    </div>

                    {/* Top 3 Skills Badges */}
                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            Top Skills
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {topSkills.map((skill, index) => (
                                <div key={index} className="bg-card rounded-lg p-4 shadow-sm border border-input hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className={`${skill.color} w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm`}>
                                            {skill.icon}
                                        </div>
                                        <span className="text-xs font-medium px-2 py-1 bg-muted text-muted-foreground rounded-full">
                                            #{index + 1}
                                        </span>
                                    </div>
                                    <h4 className="font-semibold text-foreground text-sm mb-1">{skill.name}</h4>
                                    <p className="text-xs text-muted-foreground">{skill.level}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Stats */}
            <section className="mb-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-card rounded-lg p-4 shadow-sm border border-input">
                        <div className="flex items-center gap-2 mb-1">
                            <BookOpen className="w-4 h-4 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Total Courses</p>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                    </div>
                    <div className="bg-card rounded-lg p-4 shadow-sm border border-input">
                        <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <p className="text-xs text-muted-foreground">Completed</p>
                        </div>
                        <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                    </div>
                    <div className="bg-card rounded-lg p-4 shadow-sm border border-input">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-yellow-500" />
                            <p className="text-xs text-muted-foreground">In Progress</p>
                        </div>
                        <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
                    </div>
                    <div className="bg-card rounded-lg p-4 shadow-sm border border-input">
                        <div className="flex items-center gap-2 mb-1">
                            <XCircle className="w-4 h-4 text-destructive" />
                            <p className="text-xs text-muted-foreground">Failed</p>
                        </div>
                        <p className="text-2xl font-bold text-destructive">{stats.failed}</p>
                    </div>
                </div>
            </section>

            {/* Enrolled Courses List */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Enrolled Courses
                    </h2>
                </div>

                <div className="space-y-4">
                    {courses.map((course) => {
                        const statusInfo = getStatusBadge(course.status);
                        const StatusIcon = statusInfo.icon;

                        return (
                            <div key={course.id} className="bg-card rounded-lg p-5 shadow-sm border border-input hover:shadow-md transition-shadow">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-3 mb-2">
                                            <div className="mt-1">
                                                <StatusIcon className={`w-5 h-5 ${statusInfo.text_color}`} />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-foreground mb-1">{course.title}</h3>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.bg} ${statusInfo.text_color} font-medium`}>
                                                        {statusInfo.text}
                                                    </span>
                                                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                                                        {course.category}
                                                    </span>
                                                    {course.grade && (
                                                        <span className={`text-xs px-2 py-1 rounded-full bg-muted font-semibold ${getGradeColor(course.grade)}`}>
                                                            Grade: {course.grade}
                                                        </span>
                                                    )}
                                                    {course.completedDate && (
                                                        <span className="text-xs text-muted-foreground">
                                                            Completed: {new Date(course.completedDate).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mt-3">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs text-muted-foreground">Progress</span>
                                                <span className="text-xs font-semibold text-foreground">{course.progress}%</span>
                                            </div>
                                            <div className="w-full bg-background rounded-full h-2 overflow-hidden border border-input">
                                                <div
                                                    className={`h-2 rounded-full transition-all duration-500 ${course.status === 'complete' || course.status === 'passed'
                                                        ? 'bg-success'
                                                        : course.status === 'failed'
                                                            ? 'bg-destructive'
                                                            : 'bg-yellow-500'
                                                        }`}
                                                    style={{ width: `${course.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="sm:ml-4">
                                        <button className="w-full sm:w-auto px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm font-medium border border-input">
                                            View Course
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {courses.length === 0 && (
                    <div className="bg-muted rounded-lg p-8 text-center border border-input">
                        <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No courses enrolled yet</h3>
                        <p className="text-muted-foreground mb-4">Start your learning journey by enrolling in a course</p>
                        <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">
                            Browse Courses
                        </button>
                    </div>
                )}
            </section>

            <section className='mb-20' />
        </div>
    );
};

export default MySkillsPage;