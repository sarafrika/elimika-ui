'use client'

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Link2, Plus, Trash2, Upload, Video } from 'lucide-react';
import { useState } from 'react';

interface Assignment {
    id: string;
    skillNumber: string;
    title: string;
    content: {
        type: 'video' | 'pdf' | 'file' | 'link';
        url: string;
        title: string;
    }[];
}

interface CourseAssignmentsProps {
    data: any;
    onDataChange: (data: any) => void;
}

export function CourseAssignments({ data, onDataChange }: CourseAssignmentsProps) {
    const [assignments, setAssignments] = useState<Assignment[]>(data?.assignments || []);

    // Get available skills from the previous step
    const availableSkills = data?.skills || [];

    const addAssignment = () => {
        const newAssignment: Assignment = {
            id: `assignment-${Date.now()}`,
            skillNumber: '',
            title: '',
            content: []
        };
        const updatedAssignments = [...assignments, newAssignment];
        setAssignments(updatedAssignments);
        onDataChange({ ...data, assignments: updatedAssignments });
    };

    const updateAssignment = (assignmentId: string, updates: Partial<Assignment>) => {
        const updatedAssignments = assignments.map(assignment =>
            assignment.id === assignmentId ? { ...assignment, ...updates } : assignment
        );
        setAssignments(updatedAssignments);
        onDataChange({ ...data, assignments: updatedAssignments });
    };

    const removeAssignment = (assignmentId: string) => {
        const updatedAssignments = assignments.filter(assignment => assignment.id !== assignmentId);
        setAssignments(updatedAssignments);
        onDataChange({ ...data, assignments: updatedAssignments });
    };

    const addContent = (assignmentId: string, type: 'video' | 'pdf' | 'file' | 'link') => {
        const assignment = assignments.find(a => a.id === assignmentId);
        if (!assignment) return;

        const newContent = {
            type,
            url: '',
            title: ''
        };

        const updatedAssignment = {
            ...assignment,
            content: [...assignment.content, newContent]
        };

        updateAssignment(assignmentId, updatedAssignment);
    };

    const updateContent = (assignmentId: string, contentIndex: number, field: string, value: string) => {
        const assignment = assignments.find(a => a.id === assignmentId);
        if (!assignment) return;

        const updatedContent = [...assignment.content];
        // updatedContent[contentIndex] = { ...updatedContent[contentIndex], [field]: value };

        updateAssignment(assignmentId, { content: updatedContent });
    };

    const removeContent = (assignmentId: string, contentIndex: number) => {
        const assignment = assignments.find(a => a.id === assignmentId);
        if (!assignment) return;

        const updatedContent = assignment.content.filter((_, index) => index !== contentIndex);
        updateAssignment(assignmentId, { content: updatedContent });
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
                    <h3>Course Assignments</h3>
                    <p className="text-sm text-muted-foreground">
                        Create assignments for each skill to reinforce learning through practice
                    </p>
                </div>
                <Button onClick={addAssignment}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Assignment
                </Button>
            </div>

            <div className="space-y-4">
                {assignments.map((assignment, index) => (
                    <Card key={assignment.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-base">Assignment #{index + 1}</CardTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAssignment(assignment.id)}
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
                                        value={assignment.skillNumber}
                                        onValueChange={(value) => updateAssignment(assignment.id, { skillNumber: value })}
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
                                    <Label>Assignment Title</Label>
                                    <Input
                                        placeholder="Enter assignment title"
                                        value={assignment.title}
                                        onChange={(e) => updateAssignment(assignment.id, { title: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Assignment Content */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label>Assignment Content</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => addContent(assignment.id, 'video')}
                                        >
                                            <Video className="w-4 h-4 mr-1" />
                                            Video
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => addContent(assignment.id, 'pdf')}
                                        >
                                            <FileText className="w-4 h-4 mr-1" />
                                            PDF
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => addContent(assignment.id, 'link')}
                                        >
                                            <Link2 className="w-4 h-4 mr-1" />
                                            Link
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => addContent(assignment.id, 'file')}
                                        >
                                            <Upload className="w-4 h-4 mr-1" />
                                            File
                                        </Button>
                                    </div>
                                </div>

                                {assignment.content.length > 0 && (
                                    <div className="space-y-3">
                                        {assignment.content.map((content, contentIndex) => {
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
                                                            onClick={() => removeContent(assignment.id, contentIndex)}
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
                                                                updateContent(assignment.id, contentIndex, 'title', e.target.value)
                                                            }
                                                        />
                                                        <Input
                                                            placeholder={
                                                                content.type === 'link' ? 'URL' : 'Upload file or provide URL'
                                                            }
                                                            value={content.url}
                                                            onChange={(e) =>
                                                                updateContent(assignment.id, contentIndex, 'url', e.target.value)
                                                            }
                                                        />
                                                    </div>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                )}

                                {assignment.content.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p>No assignment content added yet</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {assignments.length === 0 && (
                <Card className="p-8 text-center">
                    <div className="text-muted-foreground">
                        <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="mb-4">No assignments created yet</p>
                        <Button onClick={addAssignment}>Create Your First Assignment</Button>
                    </div>
                </Card>
            )}
        </div>
    );
}