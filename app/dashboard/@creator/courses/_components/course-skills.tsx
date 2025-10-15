'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, GripVertical, Link2, Plus, Trash2, Upload, Video } from 'lucide-react';
import { useState } from 'react';

import {
    closestCenter,
    DndContext,
    DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Skill {
    id: string;
    title: string;
    description: string;
    resources: Resource[];
}

interface Resource {
    id: string;
    type: 'video' | 'pdf' | 'file' | 'link';
    title: string;
    url?: string;
    description?: string;
}

interface CourseSkillsProps {
    data: any;
    onDataChange: (data: any) => void;
}

// Sortable wrapper for each Skill card
function SortableSkill({ skill, children }: { skill: Skill; children: React.ReactNode }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: skill.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </div>
    );
}

export function CourseSkills({ data, onDataChange }: CourseSkillsProps) {
    const [skills, setSkills] = useState<Skill[]>(data?.skills || []);
    const sensors = useSensors(useSensor(PointerSensor));

    const addSkill = () => {
        const newSkill: Skill = {
            id: `skill-${Date.now()}`,
            title: '',
            description: '',
            resources: [],
        };
        const updatedSkills = [...skills, newSkill];
        setSkills(updatedSkills);
        onDataChange({ ...data, skills: updatedSkills });
    };

    const updateSkill = (skillId: string, updates: Partial<Skill>) => {
        const updatedSkills = skills.map((skill) =>
            skill.id === skillId ? { ...skill, ...updates } : skill
        );
        setSkills(updatedSkills);
        onDataChange({ ...data, skills: updatedSkills });
    };

    const removeSkill = (skillId: string) => {
        const updatedSkills = skills.filter((skill) => skill.id !== skillId);
        setSkills(updatedSkills);
        onDataChange({ ...data, skills: updatedSkills });
    };

    const addResource = (skillId: string, type: Resource['type']) => {
        const newResource: Resource = {
            id: `resource-${Date.now()}`,
            type,
            title: '',
            url: '',
            description: '',
        };

        const updatedSkills = skills.map((skill) =>
            skill.id === skillId
                ? { ...skill, resources: [...skill.resources, newResource] }
                : skill
        );
        setSkills(updatedSkills);
        onDataChange({ ...data, skills: updatedSkills });
    };

    const updateResource = (
        skillId: string,
        resourceId: string,
        updates: Partial<Resource>
    ) => {
        const updatedSkills = skills.map((skill) =>
            skill.id === skillId
                ? {
                    ...skill,
                    resources: skill.resources.map((resource) =>
                        resource.id === resourceId ? { ...resource, ...updates } : resource
                    ),
                }
                : skill
        );
        setSkills(updatedSkills);
        onDataChange({ ...data, skills: updatedSkills });
    };

    const removeResource = (skillId: string, resourceId: string) => {
        const updatedSkills = skills.map((skill) =>
            skill.id === skillId
                ? {
                    ...skill,
                    resources: skill.resources.filter((r) => r.id !== resourceId),
                }
                : skill
        );
        setSkills(updatedSkills);
        onDataChange({ ...data, skills: updatedSkills });
    };

    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = skills.findIndex((s) => s.id === active.id);
        const newIndex = skills.findIndex((s) => s.id === over.id);

        const reordered = arrayMove(skills, oldIndex, newIndex);
        setSkills(reordered);
        onDataChange({ ...data, skills: reordered });
    };

    const getResourceIcon = (type: Resource['type']) => {
        switch (type) {
            case 'video':
                return Video;
            case 'pdf':
                return FileText;
            case 'link':
                return Link2;
            default:
                return Upload;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3>Course Skills & Resources</h3>
                    <p className="text-sm text-muted-foreground">
                        Add skills and learning materials for your course
                    </p>
                </div>
                <Button onClick={addSkill}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Skill
                </Button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={skills.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                    {skills.map((skill, index) => (
                        <SortableSkill key={skill.id} skill={skill}>
                            <Card className="relative mb-4">
                                <CardHeader className="flex flex-row items-center space-y-0">
                                    <div className="mr-2 cursor-grab">
                                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-base">Skill #{index + 1}</CardTitle>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeSkill(skill.id)}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Skill Title</Label>
                                            <Input
                                                placeholder="Enter skill title"
                                                value={skill.title}
                                                onChange={(e) =>
                                                    updateSkill(skill.id, { title: e.target.value })
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Textarea
                                            placeholder="Describe what students will learn in this skill..."
                                            value={skill.description}
                                            onChange={(e) =>
                                                updateSkill(skill.id, { description: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <Label>Resources</Label>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => addResource(skill.id, 'video')}
                                                >
                                                    <Video className="w-4 h-4 mr-1" />
                                                    Video
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => addResource(skill.id, 'pdf')}
                                                >
                                                    <FileText className="w-4 h-4 mr-1" />
                                                    PDF
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => addResource(skill.id, 'link')}
                                                >
                                                    <Link2 className="w-4 h-4 mr-1" />
                                                    Link
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => addResource(skill.id, 'file')}
                                                >
                                                    <Upload className="w-4 h-4 mr-1" />
                                                    File
                                                </Button>
                                            </div>
                                        </div>

                                        {skill.resources.length > 0 && (
                                            <div className="space-y-3">
                                                {skill.resources.map((resource) => {
                                                    const ResourceIcon = getResourceIcon(resource.type);
                                                    return (
                                                        <Card key={resource.id} className="p-4">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <ResourceIcon className="w-4 h-4" />
                                                                    <Badge variant="outline">{resource.type}</Badge>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        removeResource(skill.id, resource.id)
                                                                    }
                                                                    className="text-destructive hover:text-destructive"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                <Input
                                                                    placeholder="Resource title"
                                                                    value={resource.title}
                                                                    onChange={(e) =>
                                                                        updateResource(skill.id, resource.id, {
                                                                            title: e.target.value,
                                                                        })
                                                                    }
                                                                />
                                                                <Input
                                                                    placeholder={
                                                                        resource.type === 'link'
                                                                            ? 'URL'
                                                                            : 'Upload file or provide URL'
                                                                    }
                                                                    value={resource.url}
                                                                    onChange={(e) =>
                                                                        updateResource(skill.id, resource.id, {
                                                                            url: e.target.value,
                                                                        })
                                                                    }
                                                                />
                                                            </div>
                                                            <Textarea
                                                                placeholder="Resource description (optional)"
                                                                className="mt-3"
                                                                value={resource.description}
                                                                onChange={(e) =>
                                                                    updateResource(skill.id, resource.id, {
                                                                        description: e.target.value,
                                                                    })
                                                                }
                                                            />
                                                        </Card>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </SortableSkill>
                    ))}
                </SortableContext>
            </DndContext>

            {skills.length === 0 && (
                <Card className="p-8 text-center">
                    <div className="text-muted-foreground">
                        <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="mb-4">No skills added yet</p>
                        <Button onClick={addSkill}>Add Your First Skill</Button>
                    </div>
                </Card>
            )}
        </div>
    );
}
