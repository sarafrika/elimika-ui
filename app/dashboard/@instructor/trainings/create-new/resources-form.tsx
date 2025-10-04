import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useCourseLessonsWithContent } from '@/hooks/use-courselessonwithcontent';
import { getResourceIcon } from '@/lib/resources-icon';
import { getCourseAssessmentsOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Eye, FileQuestion, Plus, Trash2, Upload } from 'lucide-react';
import React, { useState } from 'react';

interface ResourcesFormProps {
    onNext: () => void;
    onPrev: () => void;
    data: any
}

export function ResourcesForm({ data, onNext, onPrev }: ResourcesFormProps) {
    const searchParams = new URLSearchParams(location.search);
    const classId = searchParams.get('id');
    const qc = useQueryClient();

    const { data: cAssesssment } = useQuery({
        ...getCourseAssessmentsOptions({ path: { courseUuid: data?.course_uuid as string }, query: { pageable: {} } }),
        enabled: !!data?.course_uuid
    })

    const {
        isLoading: isAllLessonsDataLoading,
        lessons: lessonsWithContent,
        contentTypeMap,
    } = useCourseLessonsWithContent({ courseUuid: data?.course_uuid as string });

    // NEW
    const [resources, setResources] = useState([
        { id: 'r1', type: 'file' as any, name: '', url: '' }
    ]);

    const [assessments, setAssessments] = useState([
        { id: 'a1', type: 'quiz' as const, title: '', description: '' }
    ]);

    const [errors, setErrors] = useState<Record<string, string>>({});

    const addResource = () => {
        setResources([
            ...resources,
            { id: Date.now().toString(), type: 'file', name: '', url: '' }
        ]);
    };

    const updateResource = (id: string, updates: Partial<typeof resources[0]>) => {
        setResources(resources.map(r => (r.id === id ? { ...r, ...updates } : r)));
    };

    const deleteResource = (id: string) => {
        setResources(resources.filter(r => r.id !== id));
    };

    const addAssessment = () => {
        setAssessments([
            ...assessments,
            { id: Date.now().toString(), type: 'quiz', title: '', description: '' }
        ]);
    };

    const updateAssessment = (id: string, updates: Partial<typeof assessments[0]>) => {
        setAssessments(assessments.map(a => (a.id === id ? { ...a, ...updates } : a)));
    };

    const deleteAssessment = (id: string) => {
        setAssessments(assessments.filter(a => a.id !== id));
    };

    const handleFileUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const fileUrl = URL.createObjectURL(file);
            updateResource(id, { name: file.name, url: fileUrl });
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        resources.forEach((r, i) => {
            if (!r.name) newErrors[`resource-${i}-name`] = 'Resource name is required';
            if (r.type === 'link' && !r.url) newErrors[`resource-${i}-url`] = 'URL is required';
        });

        assessments.forEach((a, i) => {
            if (!a.title) newErrors[`assessment-${i}-title`] = 'Assessment title is required';
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        // if (validateForm()) onNext();
        onNext()
    };




    return (
        <div className="space-y-6">
            {/* Course Resources */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Class Resources (Auto-filled)</h3>
                <Card>
                    <CardContent className="p-4 space-y-3">
                        {isAllLessonsDataLoading && <Spinner />}

                        {lessonsWithContent?.length === 0 && (
                            <div className="flex flex-col items-center justify-center p-6 rounded-lg text-center text-muted-foreground">
                                <FileQuestion className="w-8 h-8 mb-3 text-gray-400" />
                                <h4 className="text-sm font-medium">No Class Resources</h4>
                                <p className="text-sm text-gray-500">This class doesn&apos;t have any resources/content yet.</p>
                            </div>
                        )}

                        {lessonsWithContent?.map((skill, skillIndex) => (
                            <div key={skillIndex}>
                                {skill?.content?.data?.map((c, cIndex) => {
                                    const contentTypeName = contentTypeMap[c.content_type_uuid] || 'file';

                                    return (
                                        <div key={c.uuid} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <div className="flex gap-3 items-center">
                                                {getResourceIcon(contentTypeName)}
                                                <div>
                                                    <div className="font-medium">{c.title}</div>
                                                    <div className="text-sm text-muted-foreground">{contentTypeName}</div>
                                                </div>
                                            </div>

                                            <Button variant="outline" size="sm" className="gap-2">
                                                <Eye className="w-3 h-3" />
                                                View
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Assessments Preview */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Class Assessments (Preview)</h3>
                <Card>
                    <CardContent className="p-4 space-y-3">
                        {cAssesssment?.data?.content?.length === 0 && (
                            <div className="flex flex-col items-center justify-center p-6 rounded-lg text-center text-muted-foreground">
                                <FileQuestion className="w-8 h-8 mb-3 text-gray-400" />
                                <h4 className="text-sm font-medium">No Assessment Content</h4>
                                <p className="text-sm text-gray-500">This class doesn&apos;t have any assessment yet.</p>
                            </div>
                        )}

                        {cAssesssment?.data?.content?.map((a) => (
                            <div key={a.uuid} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div className="flex gap-3 items-center">
                                    <div className="min-w-8 min-h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 text-sm font-bold">
                                            {a.assessment_type.charAt(0)}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="font-medium">{a.title}</div>
                                        <div className="text-sm text-muted-foreground">{a.description}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="gap-1"><Eye className="w-3 h-3" /> Preview</Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Additional Resources */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Additional Resources</h3>
                    <Button onClick={addResource} variant="outline" className="gap-2">
                        <Plus className="w-4 h-4" /> Add Resource
                    </Button>
                </div>

                {resources.map((r, i) => (
                    <Card key={r.id}>
                        <CardContent className="p-4 space-y-4">
                            <div className="flex justify-between">
                                <h4 className="font-medium">Resource {i + 1}</h4>
                                <Button variant="ghost" size="sm" onClick={() => deleteResource(r.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className='flex flex-col gap-1.5'>
                                    <Label>Type</Label>
                                    <Select value={r.type} onValueChange={(val) => updateResource(r.id, { type: val as any })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="file">File Upload</SelectItem>
                                            <SelectItem value="video">Video</SelectItem>
                                            <SelectItem value="link">External Link</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className='flex flex-col gap-1.5'>
                                    <Label>Name</Label>
                                    <Input
                                        value={r.name}
                                        onChange={(e) => updateResource(r.id, { name: e.target.value })}
                                        placeholder="Enter resource name"
                                    />
                                    {errors[`resource-${i}-name`] && (
                                        <p className="text-sm text-destructive">{errors[`resource-${i}-name`]}</p>
                                    )}
                                </div>
                            </div>

                            {r.type === 'file' && (
                                <div className='flex flex-col gap-1.5'>
                                    <Label>Upload File</Label>
                                    <div className="relative border-2 border-dashed rounded-lg p-4 text-center">
                                        <Upload className="mx-auto text-gray-400 w-8 h-8 mb-2" />
                                        <p className="text-sm text-gray-600">Click or drag to upload</p>
                                        <input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => handleFileUpload(r.id, e)}
                                        />
                                    </div>
                                </div>
                            )}

                            {r.type === 'link' && (
                                <div className='flex flex-col gap-1.5'>
                                    <Label>URL</Label>
                                    <Input
                                        value={r.url}
                                        onChange={(e) => updateResource(r.id, { url: e.target.value })}
                                        placeholder="https://example.com"
                                    />
                                    {errors[`resource-${i}-url`] && (
                                        <p className="text-sm text-destructive">{errors[`resource-${i}-url`]}</p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>



            {/* Additional Assessments */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Additional Assessments</h3>
                    <Button onClick={addAssessment} variant="outline" className="gap-2">
                        <Plus className="w-4 h-4" /> Add Assessment
                    </Button>
                </div>

                {assessments.map((a, i) => (
                    <Card key={a.id}>
                        <CardContent className="p-4 space-y-4">
                            <div className="flex justify-between">
                                <h4 className="font-medium">Assessment {i + 1}</h4>
                                <Button variant="ghost" size="sm" onClick={() => deleteAssessment(a.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className='flex flex-col gap-1.5'>
                                    <Label>Type</Label>
                                    <Select value={a.type} onValueChange={(val) => updateAssessment(a.id, { type: val as any })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="quiz">Quiz</SelectItem>
                                            <SelectItem value="assignment">Assignment</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className='flex flex-col gap-1.5'>
                                    <Label>Title</Label>
                                    <Input
                                        value={a.title}
                                        onChange={(e) => updateAssessment(a.id, { title: e.target.value })}
                                        placeholder="Enter assessment title"
                                    />
                                    {errors[`assessment-${i}-title`] && (
                                        <p className="text-sm text-destructive">{errors[`assessment-${i}-title`]}</p>
                                    )}
                                </div>
                            </div>

                            <div className='flex flex-col gap-1.5'>
                                <Label>Description</Label>
                                <Textarea
                                    value={a.description}
                                    onChange={(e) => updateAssessment(a.id, { description: e.target.value })}
                                    rows={2}
                                    placeholder="Describe the assessment"
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Footer */}
            <div className="flex justify-between">
                <Button variant="outline" onClick={onPrev} className="gap-2">
                    <ChevronLeft className="w-4 h-4" /> Previous
                </Button>
                <Button onClick={handleNext}>Next: Review & Publish</Button>
            </div>
        </div>
    );
}
