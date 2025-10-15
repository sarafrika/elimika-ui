'use client'

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Link2, Plus, Trash2, Upload, Video } from 'lucide-react';
import { useState } from 'react';

interface Quiz {
    id: string;
    skillNumber: string;
    title: string;
    content: {
        type: 'video' | 'pdf' | 'file' | 'link';
        url: string;
        title: string;
    }[];
}

interface CourseQuizzesProps {
    data: any;
    onDataChange: (data: any) => void;
}

export function CourseQuizzes({ data, onDataChange }: CourseQuizzesProps) {
    const [quizzes, setQuizzes] = useState<Quiz[]>(data?.quizzes || []);

    // Get available skills from the previous step
    const availableSkills = data?.skills || [];

    const addQuiz = () => {
        const newQuiz: Quiz = {
            id: `quiz-${Date.now()}`,
            skillNumber: '',
            title: '',
            content: []
        };
        const updatedQuizzes = [...quizzes, newQuiz];
        setQuizzes(updatedQuizzes);
        onDataChange({ ...data, quizzes: updatedQuizzes });
    };

    const updateQuiz = (quizId: string, updates: Partial<Quiz>) => {
        const updatedQuizzes = quizzes.map(quiz =>
            quiz.id === quizId ? { ...quiz, ...updates } : quiz
        );
        setQuizzes(updatedQuizzes);
        onDataChange({ ...data, quizzes: updatedQuizzes });
    };

    const removeQuiz = (quizId: string) => {
        const updatedQuizzes = quizzes.filter(quiz => quiz.id !== quizId);
        setQuizzes(updatedQuizzes);
        onDataChange({ ...data, quizzes: updatedQuizzes });
    };

    const addContent = (quizId: string, type: 'video' | 'pdf' | 'file' | 'link') => {
        const quiz = quizzes.find(q => q.id === quizId);
        if (!quiz) return;

        const newContent = {
            type,
            url: '',
            title: ''
        };

        const updatedQuiz = {
            ...quiz,
            content: [...quiz.content, newContent]
        };

        updateQuiz(quizId, updatedQuiz);
    };

    const updateContent = (quizId: string, contentIndex: number, field: string, value: string) => {
        const quiz = quizzes.find(q => q.id === quizId);
        if (!quiz) return;

        const updatedContent = [...quiz.content];
        // updatedContent[contentIndex] = { ...updatedContent[contentIndex], [field]: value };

        updateQuiz(quizId, { content: updatedContent });
    };

    const removeContent = (quizId: string, contentIndex: number) => {
        const quiz = quizzes.find(q => q.id === quizId);
        if (!quiz) return;

        const updatedContent = quiz.content.filter((_, index) => index !== contentIndex);
        updateQuiz(quizId, { content: updatedContent });
    };

    const getContentIcon = (type: string) => {
        switch (type) {
            case 'video': return Video;
            case 'pdf': return FileText;
            case 'link': return Link2;
            default: return Upload;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3>Course Quizzes</h3>
                    <p className="text-sm text-muted-foreground">
                        Create quizzes for each skill to test student understanding
                    </p>
                </div>
                <Button onClick={addQuiz}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Quiz
                </Button>
            </div>

            <div className="space-y-4">
                {quizzes.map((quiz, index) => (
                    <Card key={quiz.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-base">Quiz #{index + 1}</CardTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeQuiz(quiz.id)}
                                className="text-destructive hover:text-destructive"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Associated Skill</Label>
                                    <Select
                                        value={quiz.skillNumber}
                                        onValueChange={(value) => updateQuiz(quiz.id, { skillNumber: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a skill" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableSkills.map((skill: any, skillIndex: number) => (
                                                <SelectItem key={skill.id} value={`skill-${skillIndex + 1}`}>
                                                    Skill #{skillIndex + 1}: {skill.title || 'Untitled Skill'}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Quiz Title</Label>
                                    <Input
                                        placeholder="Enter quiz title"
                                        value={quiz.title}
                                        onChange={(e) => updateQuiz(quiz.id, { title: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Quiz Content */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label>Quiz Content</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => addContent(quiz.id, 'video')}
                                        >
                                            <Video className="w-4 h-4 mr-1" />
                                            Video
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => addContent(quiz.id, 'pdf')}
                                        >
                                            <FileText className="w-4 h-4 mr-1" />
                                            PDF
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => addContent(quiz.id, 'link')}
                                        >
                                            <Link2 className="w-4 h-4 mr-1" />
                                            Link
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => addContent(quiz.id, 'file')}
                                        >
                                            <Upload className="w-4 h-4 mr-1" />
                                            File
                                        </Button>
                                    </div>
                                </div>

                                {quiz.content.length > 0 && (
                                    <div className="space-y-3">
                                        {quiz.content.map((content, contentIndex) => {
                                            const ContentIcon = getContentIcon(content.type);
                                            return (
                                                <Card key={contentIndex} className="p-4">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <ContentIcon className="w-4 h-4" />
                                                            <span className="text-sm font-medium capitalize">{content.type}</span>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeContent(quiz.id, contentIndex)}
                                                            className="text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <Input
                                                            placeholder="Content title"
                                                            value={content.title}
                                                            onChange={(e) =>
                                                                updateContent(quiz.id, contentIndex, 'title', e.target.value)
                                                            }
                                                        />
                                                        <Input
                                                            placeholder={
                                                                content.type === 'link' ? 'URL' : 'Upload file or provide URL'
                                                            }
                                                            value={content.url}
                                                            onChange={(e) =>
                                                                updateContent(quiz.id, contentIndex, 'url', e.target.value)
                                                            }
                                                        />
                                                    </div>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                )}

                                {quiz.content.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p>No quiz content added yet</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {quizzes.length === 0 && (
                <Card className="p-8 text-center">
                    <div className="text-muted-foreground">
                        <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="mb-4">No quizzes created yet</p>
                        <Button onClick={addQuiz}>Create Your First Quiz</Button>
                    </div>
                </Card>
            )}
        </div>
    );
}