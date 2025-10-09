'use client'

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Eye, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface AssessmentRubric {
    id: string;
    title: string;
    description: string;
    type: 'assignment' | 'exam' | 'attendance' | 'audition' | 'competition' | 'performance' | 'project' | 'quiz' | 'reading';
    visibility: 'private' | 'public';
    criteria: RubricCriteria[];
}

interface RubricCriteria {
    id: string;
    name: string;
    description: string;
    levels: RubricLevel[];
}

interface RubricLevel {
    id: string;
    name: string;
    description: string;
    points: number;
}

interface CourseAssessmentProps {
    data: any;
    onDataChange: (data: any) => void;
}

export function CourseAssessment({ data, onDataChange }: CourseAssessmentProps) {
    const [rubrics, setRubrics] = useState<AssessmentRubric[]>(data?.rubrics || []);
    const [activeTab, setActiveTab] = useState('create');

    const rubricTypes = [
        { value: 'assignment', label: 'Assignment' },
        { value: 'exam', label: 'Exam' },
        { value: 'attendance', label: 'Class Attendance' },
        { value: 'audition', label: 'Auditions' },
        { value: 'competition', label: 'Competition' },
        { value: 'performance', label: 'Performance' },
        { value: 'project', label: 'Project' },
        { value: 'quiz', label: 'Quiz' },
        { value: 'reading', label: 'Reading' }
    ];

    const addRubric = () => {
        const newRubric: AssessmentRubric = {
            id: `rubric-${Date.now()}`,
            title: '',
            description: '',
            type: 'assignment',
            visibility: 'private',
            criteria: []
        };
        const updatedRubrics = [...rubrics, newRubric];
        setRubrics(updatedRubrics);
        onDataChange({ ...data, rubrics: updatedRubrics });
    };

    const updateRubric = (rubricId: string, updates: Partial<AssessmentRubric>) => {
        const updatedRubrics = rubrics.map(rubric =>
            rubric.id === rubricId ? { ...rubric, ...updates } : rubric
        );
        setRubrics(updatedRubrics);
        onDataChange({ ...data, rubrics: updatedRubrics });
    };

    const removeRubric = (rubricId: string) => {
        const updatedRubrics = rubrics.filter(rubric => rubric.id !== rubricId);
        setRubrics(updatedRubrics);
        onDataChange({ ...data, rubrics: updatedRubrics });
    };

    const addCriteria = (rubricId: string) => {
        const newCriteria: RubricCriteria = {
            id: `criteria-${Date.now()}`,
            name: '',
            description: '',
            levels: [
                { id: `level-${Date.now()}-1`, name: 'Excellent', description: '', points: 4 },
                { id: `level-${Date.now()}-2`, name: 'Good', description: '', points: 3 },
                { id: `level-${Date.now()}-3`, name: 'Satisfactory', description: '', points: 2 },
                { id: `level-${Date.now()}-4`, name: 'Needs Improvement', description: '', points: 1 }
            ]
        };

        const rubric = rubrics.find(r => r.id === rubricId);
        if (rubric) {
            updateRubric(rubricId, {
                criteria: [...rubric.criteria, newCriteria]
            });
        }
    };

    const updateCriteria = (rubricId: string, criteriaId: string, updates: Partial<RubricCriteria>) => {
        const rubric = rubrics.find(r => r.id === rubricId);
        if (!rubric) return;

        const updatedCriteria = rubric.criteria.map(criteria =>
            criteria.id === criteriaId ? { ...criteria, ...updates } : criteria
        );

        updateRubric(rubricId, { criteria: updatedCriteria });
    };

    const removeCriteria = (rubricId: string, criteriaId: string) => {
        const rubric = rubrics.find(r => r.id === rubricId);
        if (!rubric) return;

        const updatedCriteria = rubric.criteria.filter(criteria => criteria.id !== criteriaId);
        updateRubric(rubricId, { criteria: updatedCriteria });
    };

    const updateLevel = (rubricId: string, criteriaId: string, levelId: string, updates: Partial<RubricLevel>) => {
        const rubric = rubrics.find(r => r.id === rubricId);
        if (!rubric) return;

        const updatedCriteria = rubric.criteria.map(criteria => {
            if (criteria.id === criteriaId) {
                return {
                    ...criteria,
                    levels: criteria.levels.map(level =>
                        level.id === levelId ? { ...level, ...updates } : level
                    )
                };
            }
            return criteria;
        });

        updateRubric(rubricId, { criteria: updatedCriteria });
    };

    // Sample rubrics for gallery
    const sampleRubrics = [
        {
            id: 'sample-1',
            title: 'Project Assessment Rubric',
            type: 'project',
            description: 'Comprehensive project evaluation criteria'
        },
        {
            id: 'sample-2',
            title: 'Presentation Rubric',
            type: 'performance',
            description: 'Evaluate student presentations and public speaking'
        },
        {
            id: 'sample-3',
            title: 'Written Assignment Rubric',
            type: 'assignment',
            description: 'Assess written work quality and content'
        }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h3>Course Assessment</h3>
                <p className="text-sm text-muted-foreground">
                    Create assessment rubrics to evaluate student performance
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="create">Create Rubric</TabsTrigger>
                    <TabsTrigger value="build">Build Rubric</TabsTrigger>
                    <TabsTrigger value="gallery">Rubric Gallery</TabsTrigger>
                </TabsList>

                <TabsContent value="create" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <Label>Assessment Rubrics</Label>
                        <Button onClick={addRubric}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Rubric
                        </Button>
                    </div>

                    {rubrics.map((rubric, index) => (
                        <Card key={rubric.id}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-base">Rubric #{index + 1}</CardTitle>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setActiveTab('build')}
                                    >
                                        <Eye className="w-4 h-4 mr-1" />
                                        Build
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeRubric(rubric.id)}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Rubric Title</Label>
                                        <Input
                                            placeholder="Enter rubric title"
                                            value={rubric.title}
                                            onChange={(e) => updateRubric(rubric.id, { title: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Rubric Type</Label>
                                        <Select
                                            value={rubric.type}
                                            onValueChange={(value: any) => updateRubric(rubric.id, { type: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {rubricTypes.map(type => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        placeholder="Describe the assessment rubric..."
                                        value={rubric.description}
                                        onChange={(e) => updateRubric(rubric.id, { description: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Visibility</Label>
                                    <RadioGroup
                                        value={rubric.visibility}
                                        onValueChange={(value: 'private' | 'public') => updateRubric(rubric.id, { visibility: value })}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="private" id={`private-${rubric.id}`} />
                                            <Label htmlFor={`private-${rubric.id}`}>Private Assessment</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="public" id={`public-${rubric.id}`} />
                                            <Label htmlFor={`public-${rubric.id}`}>Public Assessment</Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {rubrics.length === 0 && (
                        <Card className="p-8 text-center">
                            <div className="text-muted-foreground">
                                <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p className="mb-4">No assessment rubrics created yet</p>
                                <Button onClick={addRubric}>Create Your First Rubric</Button>
                            </div>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="build" className="space-y-4">
                    <div>
                        <h4>Build Rubric</h4>
                        <p className="text-sm text-muted-foreground">
                            Define assessment criteria and performance levels
                        </p>
                    </div>

                    {rubrics.length > 0 ? (
                        <div className="space-y-4">
                            {rubrics.map((rubric) => (
                                <Card key={rubric.id}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            {rubric.title || 'Untitled Rubric'}
                                            <Button
                                                onClick={() => addCriteria(rubric.id)}
                                                size="sm"
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add Criteria
                                            </Button>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {rubric.criteria.map((criteria) => (
                                            <Card key={criteria.id} className="p-4">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex-1 space-y-2">
                                                        <Input
                                                            placeholder="Criteria name"
                                                            value={criteria.name}
                                                            onChange={(e) =>
                                                                updateCriteria(rubric.id, criteria.id, { name: e.target.value })
                                                            }
                                                        />
                                                        <Input
                                                            placeholder="Criteria description"
                                                            value={criteria.description}
                                                            onChange={(e) =>
                                                                updateCriteria(rubric.id, criteria.id, { description: e.target.value })
                                                            }
                                                        />
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeCriteria(rubric.id, criteria.id)}
                                                        className="text-destructive hover:text-destructive ml-2"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                    {criteria.levels.map((level) => (
                                                        <div key={level.id} className="space-y-2 p-3 border rounded">
                                                            <Input
                                                                placeholder="Level name"
                                                                value={level.name}
                                                                onChange={(e) =>
                                                                    updateLevel(rubric.id, criteria.id, level.id, { name: e.target.value })
                                                                }
                                                            />
                                                            <Input
                                                                type="number"
                                                                placeholder="Points"
                                                                value={level.points}
                                                                onChange={(e) =>
                                                                    updateLevel(rubric.id, criteria.id, level.id, { points: parseInt(e.target.value) || 0 })
                                                                }
                                                            />
                                                            <Textarea
                                                                placeholder="Level description"
                                                                rows={2}
                                                                value={level.description}
                                                                onChange={(e) =>
                                                                    updateLevel(rubric.id, criteria.id, level.id, { description: e.target.value })
                                                                }
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </Card>
                                        ))}

                                        {rubric.criteria.length === 0 && (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <p>No criteria defined yet</p>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => addCriteria(rubric.id)}
                                                    className="mt-2"
                                                >
                                                    Add First Criteria
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="p-8 text-center">
                            <div className="text-muted-foreground">
                                <p>No rubrics available to build</p>
                                <Button onClick={() => setActiveTab('create')} className="mt-2">
                                    Create a Rubric First
                                </Button>
                            </div>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="gallery" className="space-y-4">
                    <div>
                        <h4>Rubric Gallery</h4>
                        <p className="text-sm text-muted-foreground">
                            Choose from pre-built rubric templates
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sampleRubrics.map((sample) => (
                            <Card key={sample.id} className="cursor-pointer hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <h4 className="mb-2">{sample.title}</h4>
                                    <p className="text-sm text-muted-foreground mb-3">{sample.description}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded capitalize">
                                            {sample.type}
                                        </span>
                                        <Button size="sm">Use Template</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}