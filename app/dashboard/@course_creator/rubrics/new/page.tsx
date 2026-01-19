'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Edit2,
    PlusCircle,
    Save,
    Trash2,
    X
} from 'lucide-react';
import { useState } from 'react';
import { Card } from '../../../../../components/ui/card';
import { Label } from '../../../../../components/ui/label';

/* =======================
   Types
======================= */

type Level = {
    name: string;
    weight: number | '';
    description: string;
};

type Criterion = {
    id: number;
    name: string;
    levels: Level[];
};

type Rubric = {
    id?: number;
    title: string;
    description: string;
    level: string;
    category: string;
    course: string;
    criteria: Criterion[];
};

/* =======================
   Helpers
======================= */

const DEFAULT_LEVEL_NAMES = [
    'Excellent',
    'Good',
    'Satisfactory',
    'Needs Improvement',
];

const defaultLevels = (): Level[] =>
    DEFAULT_LEVEL_NAMES.map((name) => ({
        name,
        weight: '',
        description: '',
    }));

const createEmptyRubric = (): Rubric => ({
    title: '',
    description: '',
    level: '',
    category: '',
    course: '',
    criteria: [
        { id: 1, name: '', levels: defaultLevels() },
    ],
});

/* =======================
   Component
======================= */

const RubricManager: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'linked' | 'unlinked'>('all');

    const [rubrics, setRubrics] = useState<Rubric[]>([
        {
            id: 1,
            title: 'Essay Writing Assessment',
            description: 'Comprehensive rubric for evaluating student essays',
            level: 'High School',
            category: 'Writing',
            course: 'English 101',
            criteria: [
                {
                    id: 1,
                    name: 'Thesis Statement',
                    levels: [
                        { name: 'Excellent', weight: 25, description: 'Clear, focused, and insightful thesis that guides the entire essay.' },
                        { name: 'Good', weight: 20, description: 'Clear thesis that addresses the prompt with minor gaps in focus.' },
                        { name: 'Satisfactory', weight: 15, description: 'Thesis is present but may be vague or overly broad.' },
                        { name: 'Needs Improvement', weight: 10, description: 'Thesis is unclear, missing, or does not address the prompt.' },
                    ],
                },
                {
                    id: 2,
                    name: 'Organization',
                    levels: [
                        { name: 'Excellent', weight: 25, description: 'Ideas are logically organized with smooth transitions.' },
                        { name: 'Good', weight: 20, description: 'Clear organization with minor issues in flow.' },
                        { name: 'Satisfactory', weight: 15, description: 'Organization is inconsistent or predictable.' },
                        { name: 'Needs Improvement', weight: 10, description: 'Lacks clear structure or logical progression.' },
                    ],
                },
                {
                    id: 3,
                    name: 'Evidence & Support',
                    levels: [
                        { name: 'Excellent', weight: 25, description: 'Strong, relevant evidence effectively supports all claims.' },
                        { name: 'Good', weight: 20, description: 'Evidence supports claims with minor gaps or limited analysis.' },
                        { name: 'Satisfactory', weight: 15, description: 'Some evidence is provided but may be weak or insufficient.' },
                        { name: 'Needs Improvement', weight: 10, description: 'Little to no evidence provided to support claims.' },
                    ],
                },
                {
                    id: 4,
                    name: 'Grammar & Mechanics',
                    levels: [
                        { name: 'Excellent', weight: 25, description: 'Virtually no grammatical, spelling, or punctuation errors.' },
                        { name: 'Good', weight: 20, description: 'Few minor errors that do not affect readability.' },
                        { name: 'Satisfactory', weight: 15, description: 'Errors are noticeable but meaning is still clear.' },
                        { name: 'Needs Improvement', weight: 10, description: 'Frequent errors interfere with understanding.' },
                    ],
                },
            ],
        },

        {
            id: 2,
            title: 'Science Lab Report',
            description: 'Rubric for evaluating laboratory experiment reports',
            level: 'Middle School',
            category: 'Science',
            course: 'Physical Science',
            criteria: [
                {
                    id: 1,
                    name: 'Hypothesis',
                    levels: [
                        { name: 'Excellent', weight: 20, description: 'Hypothesis is clear, testable, and well-reasoned.' },
                        { name: 'Good', weight: 15, description: 'Hypothesis is clear but reasoning may be limited.' },
                        { name: 'Satisfactory', weight: 10, description: 'Hypothesis is present but vague or incomplete.' },
                        { name: 'Needs Improvement', weight: 5, description: 'Hypothesis is missing or not testable.' },
                    ],
                },
                {
                    id: 2,
                    name: 'Procedure',
                    levels: [
                        { name: 'Excellent', weight: 30, description: 'Procedure is detailed, logical, and easy to follow.' },
                        { name: 'Good', weight: 23, description: 'Procedure is mostly clear with minor omissions.' },
                        { name: 'Satisfactory', weight: 15, description: 'Procedure lacks clarity or important steps.' },
                        { name: 'Needs Improvement', weight: 8, description: 'Procedure is incomplete or confusing.' },
                    ],
                },
                {
                    id: 3,
                    name: 'Data Collection',
                    levels: [
                        { name: 'Excellent', weight: 30, description: 'Data is accurate, well-organized, and clearly presented.' },
                        { name: 'Good', weight: 23, description: 'Data is mostly accurate with minor organizational issues.' },
                        { name: 'Satisfactory', weight: 15, description: 'Data is recorded but lacks clarity or consistency.' },
                        { name: 'Needs Improvement', weight: 8, description: 'Data is missing, inaccurate, or poorly organized.' },
                    ],
                },
                {
                    id: 4,
                    name: 'Conclusion',
                    levels: [
                        { name: 'Excellent', weight: 20, description: 'Conclusion clearly explains results and relates to the hypothesis.' },
                        { name: 'Good', weight: 15, description: 'Conclusion explains results with minor gaps.' },
                        { name: 'Satisfactory', weight: 10, description: 'Conclusion is basic or partially inaccurate.' },
                        { name: 'Needs Improvement', weight: 5, description: 'Conclusion is missing or incorrect.' },
                    ],
                },
            ],
        },

        {
            id: 3,
            title: 'Oral Presentation',
            description: 'Rubric for evaluating student presentations',
            level: 'High School',
            category: 'Communication',
            course: 'Speech & Debate',
            criteria: [
                {
                    id: 1,
                    name: 'Content Knowledge',
                    levels: [
                        { name: 'Excellent', weight: 25, description: 'Demonstrates thorough understanding of the topic.' },
                        { name: 'Good', weight: 20, description: 'Shows solid understanding with minor inaccuracies.' },
                        { name: 'Satisfactory', weight: 15, description: 'Basic understanding of the topic is evident.' },
                        { name: 'Needs Improvement', weight: 10, description: 'Limited or incorrect understanding of the topic.' },
                    ],
                },
                {
                    id: 2,
                    name: 'Delivery',
                    levels: [
                        { name: 'Excellent', weight: 25, description: 'Confident, clear, and engaging delivery.' },
                        { name: 'Good', weight: 20, description: 'Clear delivery with minor issues in confidence or pacing.' },
                        { name: 'Satisfactory', weight: 15, description: 'Delivery is uneven or difficult to follow at times.' },
                        { name: 'Needs Improvement', weight: 10, description: 'Delivery is unclear, rushed, or disengaging.' },
                    ],
                },
                {
                    id: 3,
                    name: 'Visual Aids',
                    levels: [
                        { name: 'Excellent', weight: 25, description: 'Visuals are clear, relevant, and enhance understanding.' },
                        { name: 'Good', weight: 20, description: 'Visuals support the presentation with minor issues.' },
                        { name: 'Satisfactory', weight: 15, description: 'Visuals are present but minimally effective.' },
                        { name: 'Needs Improvement', weight: 10, description: 'Visuals are missing or distracting.' },
                    ],
                },
            ],
        },
    ]);


    const [isEditing, setIsEditing] = useState(false);
    const [currentRubric, setCurrentRubric] = useState<Rubric | null>(null);

    /* =======================
       CRUD Handlers
    ======================= */

    const handleAddNewRubric = () => {
        setCurrentRubric(createEmptyRubric());
        setIsEditing(true);
    };

    const handleEditRubric = (rubric: Rubric) => {
        setCurrentRubric(structuredClone(rubric));
        setIsEditing(true);
    };

    const handleDeleteRubric = (id?: number) => {
        if (!id) return;
        if (window.confirm('Are you sure you want to delete this rubric?')) {
            setRubrics((prev) => prev.filter((r) => r.id !== id));
        }
    };

    const handleSaveRubric = () => {
        if (!currentRubric) return;

        setRubrics((prev) => {
            if (currentRubric.id) {
                return prev.map((r) =>
                    r.id === currentRubric.id ? currentRubric : r
                );
            }
            const newId =
                prev.length > 0 ? Math.max(...prev.map((r) => r.id ?? 0)) + 1 : 1;
            return [...prev, { ...currentRubric, id: newId }];
        });

        setIsEditing(false);
        setCurrentRubric(null);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setCurrentRubric(null);
    };

    /* =======================
       Update Helpers
    ======================= */

    const updateRubricField = (
        field: keyof Omit<Rubric, 'criteria'>,
        value: string
    ) => {
        if (!currentRubric) return;
        setCurrentRubric({ ...currentRubric, [field]: value });
    };

    const updateCriteriaName = (index: number, value: string) => {
        if (!currentRubric) return;
        const criteria = [...currentRubric.criteria];
        criteria[index] = { ...criteria[index], name: value };
        setCurrentRubric({ ...currentRubric, criteria });
    };

    const updateLevel = (
        cIdx: number,
        lIdx: number,
        field: keyof Level,
        value: string | number
    ) => {
        if (!currentRubric) return;

        const criteria = currentRubric.criteria.map((c, ci) => {
            if (ci !== cIdx) return c;
            const levels = c.levels.map((l, li) =>
                li === lIdx ? { ...l, [field]: value } : l
            );
            return { ...c, levels };
        });

        setCurrentRubric({ ...currentRubric, criteria });
    };

    const updateLevelWeightForAllCriteria = (
        levelIndex: number,
        value: number | ''
    ) => {
        if (!currentRubric) return;

        const criteria = currentRubric.criteria.map((c) => ({
            ...c,
            levels: c.levels.map((l, i) =>
                i === levelIndex ? { ...l, weight: value } : l
            ),
        }));

        setCurrentRubric({ ...currentRubric, criteria });
    };

    const addCriteria = () => {
        if (!currentRubric) return;

        const newId =
            Math.max(0, ...currentRubric.criteria.map((c) => c.id)) + 1;

        setCurrentRubric({
            ...currentRubric,
            criteria: [
                ...currentRubric.criteria,
                {
                    id: newId,
                    name: '',
                    levels: currentRubric.criteria[0].levels.map((l) => ({
                        ...l,
                        description: '',
                    })),
                },
            ],
        });
    };

    const addLevel = () => {
        if (!currentRubric) return;

        const criteria = currentRubric.criteria.map((c) => ({
            ...c,
            levels: [...c.levels, { name: '', weight: '', description: '' }],
        }));

        setCurrentRubric({ ...currentRubric, criteria });
    };

    const deleteCriteria = (index: number) => {
        if (!currentRubric || currentRubric.criteria.length <= 1) return;

        setCurrentRubric({
            ...currentRubric,
            criteria: currentRubric.criteria.filter((_, i) => i !== index),
        });
    };

    /* =======================
       Render
    ======================= */

    if (isEditing && currentRubric) {
        return (
            <Card className="min-h-screen p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold">
                            {currentRubric.id ? 'Edit Rubric' : 'Create New Rubric'}
                        </h1>
                        <div className="flex gap-2">
                            <Button onClick={handleSaveRubric}>
                                <Save size={18} /> Save
                            </Button>
                            <Button variant="secondary" onClick={handleCancel}>
                                <X size={18} /> Cancel
                            </Button>
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(['title', 'description', 'level', 'category', 'course'] as const).map(
                            (field) => (
                                <div key={field} className="flex flex-col gap-1">
                                    <Label className="capitalize">{field}</Label>
                                    <Input
                                        value={currentRubric[field]}
                                        onChange={(e) => updateRubricField(field, e.target.value)}
                                    />
                                </div>
                            )
                        )}
                    </div>

                    <Button onClick={addLevel}>Add Level</Button>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full border">
                            <thead>
                                <tr>
                                    <th className="border px-4 py-2 text-left">Criteria</th>
                                    {currentRubric.criteria[0].levels.map((level, idx) => (
                                        <th key={idx} className="border px-2 py-2">
                                            <Input
                                                value={level.name}
                                                onChange={(e) =>
                                                    updateLevel(0, idx, 'name', e.target.value)
                                                }
                                            />
                                            <Input
                                                type="number"
                                                value={level.weight}
                                                onChange={(e) =>
                                                    updateLevelWeightForAllCriteria(
                                                        idx,
                                                        e.target.value === '' ? '' : Number(e.target.value)
                                                    )
                                                }
                                                className="mt-1"
                                            />
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {currentRubric.criteria.map((c, cIdx) => (
                                    <tr key={c.id}>
                                        <td className="border px-2">
                                            <div className="flex gap-2">
                                                <Input
                                                    value={c.name}
                                                    onChange={(e) =>
                                                        updateCriteriaName(cIdx, e.target.value)
                                                    }
                                                />
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => deleteCriteria(cIdx)}
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </td>
                                        {c.levels.map((l, lIdx) => (
                                            <td key={lIdx} className="border px-2">
                                                <textarea
                                                    className="w-full border rounded p-1 text-sm"
                                                    rows={3}
                                                    value={l.description}
                                                    onChange={(e) =>
                                                        updateLevel(cIdx, lIdx, 'description', e.target.value)
                                                    }
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <Button onClick={addCriteria}>Add Criteria</Button>
                </div>
            </Card>
        );
    }

    /* =======================
       List View
    ======================= */

    return (
        <div className="min-h-screen p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex gap-2">
                <Input
                    placeholder="Search rubrics..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button onClick={handleAddNewRubric}>
                    <PlusCircle className="mr-2 h-4 w-4" /> New Rubric
                </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rubrics.map((rubric) => (
                    <Card key={rubric.id} className="p-4 space-y-3">
                        <h2 className="text-lg font-bold">{rubric.title}</h2>
                        <p className="text-sm text-muted-foreground">{rubric.description}</p>

                        <div className="flex gap-2">
                            <Button onClick={() => handleEditRubric(rubric)}>
                                <Edit2 size={14} /> View
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => handleDeleteRubric(rubric.id)}
                            >
                                <Trash2 size={14} /> Delete
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default RubricManager;
