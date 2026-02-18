'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import {
    addCourseCreatorEducationMutation,
    addCourseCreatorExperienceMutation,
    deleteCourseCreatorDocumentMutation,
    deleteCourseCreatorEducationMutation,
    deleteCourseCreatorExperienceMutation,
    getCourseCreatorDocumentsOptions,
    getCourseCreatorDocumentsQueryKey,
    getCourseCreatorEducationOptions,
    getCourseCreatorEducationQueryKey,
    getCourseCreatorExperienceOptions,
    getCourseCreatorExperienceQueryKey,
    getInstructorDocumentsQueryKey,
    updateCourseCreatorEducationMutation,
    updateCourseCreatorExperienceMutation,
    uploadCourseCreatorDocumentMutation
} from '../../../services/client/@tanstack/react-query.gen';

import {
    Briefcase,
    FileText,
    GraduationCap,
    Grip,
    Paperclip,
    Pencil,
    PlusCircle,
    Trash2,
    Upload,
    X,
    XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { CAREER_COLORS } from '../../../lib/color-themes';
import type { DomainTabProps, TabDefinition } from './types';

function TabShell({ children }: { children: React.ReactNode }) {
    return <div className="pt-5 space-y-4">{children}</div>;
}

function CreatorAboutTab({ sharedProfile }: DomainTabProps) {
    return (
        <TabShell>
            {sharedProfile.bio ? (
                <Card className="col-span-2">
                    <CardHeader className="pt-0">
                        <CardTitle className="text-sm font-semibold">About Me</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <p
                            className="text-muted-foreground text-sm leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: sharedProfile.bio }}
                        />
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                        <p className="text-sm text-muted-foreground">No bio added yet.</p>
                    </CardContent>
                </Card>
            )}
        </TabShell>
    );
}
const DEGREE_OPTIONS = ["Ph.D.", "Master's", "Bachelor's", "Associate's", "Diploma", "Certificate", "Other"] as const;

const edSchema = z.object({
    uuid: z.string().optional(),
    course_creator_uuid: z.string(),
    school_name: z.string().min(1, 'Institution is required'),
    qualification: z.string().min(1, 'Degree is required'),
    field_of_study: z.string().min(1, 'Field of study is required'),
    certificate_number: z.string().optional().nullable(),
    year_started: z.string().min(4, 'Start year is required'),
    year_completed: z.string().optional().nullable(),
    is_recent_qualification: z.boolean().default(false),
    full_description: z.string().optional().nullable(),
});

const educationFormSchema = z.object({ educations: z.array(edSchema) });
type EducationFormValues = z.infer<typeof educationFormSchema>;
type EdEntry = z.infer<typeof edSchema>;

interface AttachedFile {
    remote?: { name: string; url: string; size_formatted?: string };
    local?: File;
    pendingDelete?: boolean;
}

function FileUploadField({
    attachment,
    onChange,
    disabled,
}: {
    attachment: AttachedFile;
    onChange: (a: AttachedFile) => void;
    disabled: boolean;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const hasRemote = !!attachment.remote && !attachment.pendingDelete;
    const hasLocal = !!attachment.local;

    return (
        <div className="space-y-2">
            <p className="text-sm font-medium leading-none">
                Qualification document
                <span className="text-muted-foreground font-normal ml-1 text-xs">(optional)</span>
            </p>

            {attachment.remote && (
                <div className={cn(
                    'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                    attachment.pendingDelete ? 'border-destructive/30 bg-destructive/5 opacity-60' : 'border-border bg-muted/40'
                )}>
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <a
                        href={attachment.remote.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn('flex-1 truncate hover:underline', attachment.pendingDelete ? 'line-through text-muted-foreground' : 'text-foreground')}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {attachment.remote.name}
                    </a>
                    {attachment.remote.size_formatted && (
                        <span className="text-xs text-muted-foreground shrink-0">{attachment.remote.size_formatted}</span>
                    )}
                    {!disabled && (
                        attachment.pendingDelete ? (
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onChange({ ...attachment, pendingDelete: false })}>
                                <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                        ) : (
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0 hover:text-destructive" onClick={() => onChange({ ...attachment, pendingDelete: true })}>
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        )
                    )}
                </div>
            )}

            {hasLocal && (
                <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 text-sm">
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                    <span className="flex-1 truncate text-foreground">{attachment.local!.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{(attachment.local!.size / 1024).toFixed(0)} KB</span>
                    {!disabled && (
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0 hover:text-destructive" onClick={() => { onChange({ ...attachment, local: undefined }); if (inputRef.current) inputRef.current.value = ''; }}>
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>
            )}

            {!disabled && !hasLocal && (
                <>
                    <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden"
                        onChange={(e) => { const file = e.target.files?.[0]; if (file) onChange({ ...attachment, local: file, pendingDelete: false }); }}
                    />
                    <Button type="button" variant="outline" size="sm" className="gap-2 text-xs h-8" onClick={() => inputRef.current?.click()}>
                        <Paperclip className="h-3.5 w-3.5" />
                        {hasRemote ? 'Replace file' : 'Attach file'}
                    </Button>
                    <p className="text-xs text-muted-foreground">PDF, DOC, JPG or PNG · max 10 MB</p>
                </>
            )}
        </div>
    );
}

function EducationViewCard({ edu }: { edu: any }) {
    return (
        <div className="flex items-start gap-4 py-4 border-b border-border last:border-0">
            <div className="bg-primary/10 p-2 rounded-lg shrink-0 mt-0.5">
                <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground text-sm">{edu.qualification} in {edu.field_of_study}</p>
                    {edu.is_recent_qualification && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Recent</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{edu.education_level} - {edu.school_name}</p>
                {edu.full_description && <p className="text-xs text-muted-foreground pt-1">{edu.full_description}</p>}
                {/* {edu.certificate_number && <p className="text-xs text-muted-foreground/60 pt-0.5">Cert # {edu.certificate_number}</p>} */}
            </div>
        </div>
    );
}

function CreatorSkillsTab({ sharedProfile }: DomainTabProps) {
    const qc = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [attachments, setAttachments] = useState<AttachedFile[]>([]);

    const { data, isLoading } = useQuery({
        ...getCourseCreatorEducationOptions({ path: { courseCreatorUuid: sharedProfile?.uuid }, query: { pageable: {} } }),
        enabled: !!sharedProfile?.uuid,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    const serverEducations: any[] = data?.data?.content ?? [];

    const blankEntry = (): EdEntry => ({
        course_creator_uuid: sharedProfile?.uuid ?? '',
        school_name: '', qualification: '', field_of_study: '',
        certificate_number: '', year_started: '', year_completed: '',
        is_recent_qualification: false, full_description: '',
    });

    const form = useForm<EducationFormValues>({
        resolver: zodResolver(educationFormSchema),
        defaultValues: { educations: [blankEntry()] },
        mode: 'onChange',
    });

    const { fields, append, remove, replace } = useFieldArray({ control: form.control, name: 'educations' });

    const addEducationMut = useMutation(addCourseCreatorEducationMutation());
    const updateEducationMut = useMutation(updateCourseCreatorEducationMutation());
    const deleteEducationMut = useMutation(deleteCourseCreatorEducationMutation());
    const uploadDocumentMut = useMutation(uploadCourseCreatorDocumentMutation());

    const invalidateEducation = () => qc.invalidateQueries({
        queryKey: getCourseCreatorEducationQueryKey({ path: { courseCreatorUuid: sharedProfile?.uuid }, query: { pageable: {} } }),
    });

    const enterEditMode = () => {
        if (serverEducations.length > 0) {
            const mapped: EdEntry[] = serverEducations.map((ed) => ({
                uuid: ed.uuid,
                course_creator_uuid: sharedProfile?.uuid ?? '',
                school_name: ed.school_name ?? '',
                qualification: ed.qualification ?? '',
                field_of_study: ed.field_of_study ?? '',
                certificate_number: ed.certificate_number ?? '',
                year_started: ed.year_started?.toString() ?? '',
                year_completed: ed.year_completed?.toString() ?? '',
                is_recent_qualification: ed.is_recent_qualification ?? false,
                full_description: ed.full_description ?? '',
            }));
            replace(mapped);
            setAttachments(mapped.map((ed: any) =>
                ed.document_url ? { remote: { name: ed.document_name ?? 'Document', url: ed.document_url } } : {}
            ));
        } else {
            replace([blankEntry()]);
            setAttachments([{}]);
        }
        setIsEditing(true);
    };

    const cancelEdit = () => { setIsEditing(false); form.reset(); };

    const updateAttachment = (index: number, updated: AttachedFile) =>
        setAttachments((prev) => { const next = [...prev]; next[index] = updated; return next; });

    const addEntry = () => { append(blankEntry()); setAttachments((prev) => [...prev, {}]); };

    const removeEntry = async (index: number) => {
        if (!confirm('Remove this qualification?')) return;
        const edUuid = form.getValues(`educations.${index}.uuid`);
        remove(index);
        setAttachments((prev) => prev.filter((_, i) => i !== index));
        if (edUuid) {
            deleteEducationMut.mutate(
                { path: { educationUuid: edUuid, courseCreatorUuid: sharedProfile.uuid } },
                { onSuccess: () => { invalidateEducation(); toast.success('Qualification removed'); }, onError: () => toast.error('Could not remove qualification') }
            );
        }
    };

    const onSubmit = async (values: EducationFormValues) => {
        setIsSaving(true);
        try {
            for (const [i, ed] of values.educations.entries()) {
                const attachment = attachments[i];
                let educationUuid = ed.uuid;

                if (!ed.uuid) {
                    const resp = await addEducationMut.mutateAsync({ body: { ...ed, course_creator_uuid: sharedProfile?.uuid }, path: { courseCreatorUuid: sharedProfile.uuid } });
                    educationUuid = resp?.data?.uuid;
                } else {
                    await updateEducationMut.mutateAsync({ body: { ...ed, course_creator_uuid: sharedProfile?.uuid }, path: { educationUuid: ed.uuid, courseCreatorUuid: sharedProfile.uuid } });
                }

                if (attachment?.local && educationUuid) {
                    uploadDocumentMut.mutate(
                        {
                            body: { file: attachment.local },
                            path: { courseCreatorUuid: sharedProfile?.uuid },
                            query: {
                                education_uuid: educationUuid, title: ed.school_name, description: ed.field_of_study,
                                document_type_uuid: '35b49d4c-aec0-4a88-873b-5fa91342198f',// contnent type uuid for pdfs
                                experience_uuid: '', expiry_date: '', membership_uuid: ''
                            },
                        },
                        {
                            onSuccess: () => qc.invalidateQueries({ queryKey: getCourseCreatorDocumentsQueryKey({ path: { courseCreatorUuid: sharedProfile?.uuid } }) }),
                            onError: (err) => toast.error(err?.message),
                        }
                    );
                }

                if (attachment?.pendingDelete && attachment.remote && educationUuid) {
                    // TODO: await deleteEducationDocument({ path: { instructorUuid: sharedProfile.uuid, educationUuid } });
                }
            }

            invalidateEducation();
            toast.success('Education updated successfully');
            setIsEditing(false);
        } catch {
            toast.error('Something went wrong — please try again');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <TabShell>
                <Card>
                    <CardContent className="pt-5 space-y-5">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-3">
                                <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                                <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-1/3" /></div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </TabShell>
        );
    }

    if (!isEditing) {
        return (
            <TabShell>
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold">Education</CardTitle>
                            <Button type="button" variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={enterEditMode}>
                                <Pencil className="h-3.5 w-3.5" /> Edit
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {serverEducations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <GraduationCap className="h-10 w-10 text-muted-foreground/30 mb-3" />
                                <p className="text-sm text-muted-foreground">No education history added yet.</p>
                                <Button type="button" variant="link" size="sm" className="mt-1 text-xs" onClick={enterEditMode}>Add your first qualification</Button>
                            </div>
                        ) : (
                            serverEducations.map((edu) => <EducationViewCard key={edu.uuid} edu={edu} />)
                        )}
                    </CardContent>
                </Card>
            </TabShell>
        );
    }

    return (
        <TabShell>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Card>
                        <CardHeader className="pb-0">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-[15px] font-semibold">Edit Skills Profile</CardTitle>
                                <Button type="button" variant="ghost" size="sm" className="gap-1.5 h-8 text-xs text-muted-foreground" onClick={cancelEdit} disabled={isSaving}>
                                    <X className="h-3.5 w-3.5" /> Cancel
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-0 space-y-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="group relative rounded-xl border border-border bg-muted/30 transition-colors hover:bg-muted/40">
                                    <div className="space-y-5 p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-2">
                                                <Grip className="mt-1 h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 shrink-0" />
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground leading-snug">{form.watch(`educations.${index}.school_name`) || 'New Institution'}</p>
                                                    <p className="text-xs text-muted-foreground">{form.watch(`educations.${index}.qualification`) || 'Degree'} · {form.watch(`educations.${index}.field_of_study`) || 'Field of study'}</p>
                                                </div>
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 hover:bg-destructive/10 hover:text-destructive" onClick={() => removeEntry(index)} disabled={isSaving}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <FormField control={form.control} name={`educations.${index}.school_name`} render={({ field }) => (
                                                <FormItem><FormLabel>Institution</FormLabel><FormControl><Input placeholder="e.g. University of Nairobi" {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <FormField control={form.control} name={`educations.${index}.qualification`} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Degree</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl><SelectTrigger><SelectValue placeholder="Select degree" /></SelectTrigger></FormControl>
                                                        <SelectContent>{DEGREE_OPTIONS.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <FormField control={form.control} name={`educations.${index}.field_of_study`} render={({ field }) => (
                                                <FormItem><FormLabel>Field of study</FormLabel><FormControl><Input placeholder="e.g. Computer Science" {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <FormField control={form.control} name={`educations.${index}.certificate_number`} render={({ field }) => (
                                                <FormItem><FormLabel>Certificate number</FormLabel><FormControl><Input placeholder="Enter certificate number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <FormField control={form.control} name={`educations.${index}.year_started`} render={({ field }) => (
                                                <FormItem><FormLabel>Start year</FormLabel><FormControl><Input type="number" placeholder="YYYY" min={1900} max={2099} {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <FormField control={form.control} name={`educations.${index}.year_completed`} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>End year</FormLabel>
                                                    <FormControl><Input type="number" placeholder="YYYY" min={1900} max={2099} disabled={form.watch(`educations.${index}.is_recent_qualification`)} {...field} value={field.value ?? ''} /></FormControl>
                                                    <div className="mt-2">
                                                        <FormField control={form.control} name={`educations.${index}.is_recent_qualification`} render={({ field: cb }) => (
                                                            <FormItem className="flex flex-row items-center gap-2 space-y-0">
                                                                <FormControl><Checkbox checked={cb.value} onCheckedChange={cb.onChange} /></FormControl>
                                                                <FormLabel className="font-normal text-sm cursor-pointer">Currently studying here</FormLabel>
                                                            </FormItem>
                                                        )} />
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        <FormField control={form.control} name={`educations.${index}.full_description`} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Additional information</FormLabel>
                                                <FormControl><Input placeholder="e.g. Honors, GPA, thesis title…" {...field} value={field.value ?? ''} /></FormControl>
                                                <FormDescription>Add any notable achievements or specialisations.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        <div className="pt-3 border-t border-border/60">
                                            <FileUploadField attachment={attachments[index] ?? {}} onChange={(updated) => updateAttachment(index, updated)} disabled={isSaving} />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <Button type="button" variant="outline" className="w-full gap-2" onClick={addEntry} disabled={isSaving}>
                                <PlusCircle className="h-4 w-4" /> Add another qualification
                            </Button>

                            <div className="flex justify-end gap-2 pt-2 border-t border-border">
                                <Button type="button" variant="ghost" onClick={cancelEdit} disabled={isSaving}>Cancel</Button>
                                <Button type="submit" className="min-w-32" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save changes'}</Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </Form>
        </TabShell>
    );
}


function CreatorCertificatesTab({ sharedProfile }: DomainTabProps) {
    const qc = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
    const [uploadMeta, setUploadMeta] = useState({ title: '', description: '' });
    const [stagedFile, setStagedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const { data, isLoading } = useQuery({
        ...getCourseCreatorDocumentsOptions({ path: { courseCreatorUuid: sharedProfile?.uuid } }),
        enabled: !!sharedProfile?.uuid,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    const uploadDocumentMut = useMutation(uploadCourseCreatorDocumentMutation());
    const deleteDocumentMut = useMutation(deleteCourseCreatorDocumentMutation());

    const invalidateDocs = () => qc.invalidateQueries({
        queryKey: getInstructorDocumentsQueryKey({ path: { instructorUuid: sharedProfile?.uuid } }),
    });

    const handleUpload = async () => {
        if (!stagedFile || !uploadMeta.title.trim()) { toast.error('Please add a title and select a file'); return; }
        setIsUploading(true);
        uploadDocumentMut.mutate(
            {
                body: { file: stagedFile },
                path: { courseCreatorUuid: sharedProfile?.uuid },
                query: { title: uploadMeta.title, description: uploadMeta.description, document_type_uuid: '', education_uuid: '', experience_uuid: '', expiry_date: '', membership_uuid: '' },
            },
            {
                onSuccess: () => { invalidateDocs(); setStagedFile(null); setUploadMeta({ title: '', description: '' }); if (fileInputRef.current) fileInputRef.current.value = ''; toast.success('Document uploaded'); setIsUploading(false); },
                onError: (err) => { toast.error(err?.message || 'Upload failed'); setIsUploading(false); },
            }
        );
    };

    const handleDelete = (uuid: string) => {
        if (!confirm('Remove this document?')) return;
        deleteDocumentMut.mutate(
            { path: { documentUuid: uuid, courseCreatorUuid: sharedProfile?.uuid } },
            { onSuccess: () => { invalidateDocs(); toast.success('Document removed'); }, onError: () => toast.error('Could not remove document') }
        );
    };

    if (isLoading) {
        return (
            <TabShell>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}><CardContent className="pt-4 flex gap-4 items-center"><Skeleton className="w-10 h-10 rounded-full" /><div className="space-y-2 flex-1"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></CardContent></Card>
                    ))}
                </div>
            </TabShell>
        );
    }

    const docs = data?.data ?? [];

    return (
        <TabShell>
            {/* Upload panel */}
            <Card>
                <CardHeader className="pb-0">
                    <CardTitle className="text-sm font-semibold">Upload Document</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <Input placeholder="Document title" value={uploadMeta.title} onChange={(e) => setUploadMeta((p) => ({ ...p, title: e.target.value }))} />
                        <Input placeholder="Description (optional)" value={uploadMeta.description} onChange={(e) => setUploadMeta((p) => ({ ...p, description: e.target.value }))} />
                    </div>

                    {stagedFile ? (
                        <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 text-sm">
                            <FileText className="h-4 w-4 shrink-0 text-primary" />
                            <span className="flex-1 truncate text-foreground">{stagedFile.name}</span>
                            <span className="text-xs text-muted-foreground shrink-0">{(stagedFile.size / 1024).toFixed(0)} KB</span>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" onClick={() => { setStagedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    ) : (
                        <div className='flex flexx-row gap-4 items-center' >
                            <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setStagedFile(f); }} />
                            <Button type="button" variant="outline" size="sm" className="gap-2 text-xs h-8" onClick={() => fileInputRef.current?.click()}>
                                <Paperclip className="h-3.5 w-3.5" /> Select file
                            </Button>
                            <p className="text-xs text-muted-foreground">
                                PDF · max 10 MB
                                {/* PDF, DOC, JPG or PNG · max 10 MB */}
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button type="button" size="sm" className="gap-2" onClick={handleUpload} disabled={!stagedFile || !uploadMeta.title.trim() || isUploading}>
                            <Upload className="h-3.5 w-3.5" />
                            {isUploading ? 'Uploading…' : 'Upload'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Documents list */}
            {docs.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                        <FileText className="h-10 w-10 text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                        <Button type="button" variant="link" size="sm" className="mt-1 text-xs" onClick={() => fileInputRef.current?.click()}>Upload your first document</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {docs.map((cert: any) => (
                        <Card key={cert.uuid}>
                            <CardContent className="pt-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant="outline" className="border-success/60 bg-success/10 text-xs font-semibold tracking-wide uppercase">{cert.status}</Badge>
                                        {cert.is_verified && <Badge variant="secondary" className="text-xs">Verified</Badge>}
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(cert.uuid)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>

                                <div>
                                    <p className="font-semibold text-foreground text-sm">{cert.title}</p>
                                    {cert.expiry_date && <p className="text-muted-foreground/70 text-xs mt-0.5">Expiry: {cert.expiry_date}</p>}
                                </div>

                                <button
                                    type="button"
                                    className="flex flex-row items-center gap-3 w-full rounded-lg border border-border bg-muted/30 px-3 py-2 hover:bg-muted/60 transition-colors"
                                    onClick={() => setSelectedPdf(cert.file_path)}
                                >
                                    <div className="bg-destructive/5 p-2 rounded-lg shrink-0"><FileText className="w-4 h-4 text-destructive/50" /></div>
                                    <div className="flex-1 text-left min-w-0">
                                        <p className="font-medium text-sm truncate">{cert.original_filename}</p>
                                        <p className="text-xs text-muted-foreground">{cert.file_size_formatted}</p>
                                    </div>
                                </button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {selectedPdf && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
                    <div className="bg-white w-[90%] h-[90%] rounded-lg overflow-hidden relative">
                        <Button type="button" variant="outline" size="sm" className="absolute top-3 right-3 text-xs" onClick={() => setSelectedPdf(null)}>Close</Button>
                        <iframe src={selectedPdf} className="w-full h-full" title="PDF Viewer" />
                    </div>
                </div>
            )}
        </TabShell>
    );
}

const experienceSchema = z.object({
    uuid: z.string().optional(),
    instructor_uuid: z.string(),
    organization_name: z.string().min(1, 'Organisation is required'),
    position: z.string().min(1, 'Job title is required'),
    responsibilities: z.string().optional().nullable(),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().optional().nullable(),
    is_current_position: z.boolean().default(false),
});

const experienceFormSchema = z.object({ experiences: z.array(experienceSchema) });
type ExperienceFormValues = z.infer<typeof experienceFormSchema>;
type ExpEntry = z.infer<typeof experienceSchema>;

function formatDateRange(startDate?: string, endDate?: string, isCurrent?: boolean) {
    const fmt = (d?: string) => {
        if (!d) return '';
        const date = new Date(d);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    };
    return `${fmt(startDate)} – ${isCurrent ? 'Present' : fmt(endDate)}`;
}

function ExperienceViewCard({ item, color }: { item: any; color: string }) {
    return (
        <div className="relative mb-8 last:mb-0">
            <span className="absolute -left-[22px] top-1 w-3.5 h-3.5 rounded-full border-2 border-card" style={{ backgroundColor: color, boxShadow: `0 0 0 4px ${color}20` }} />
            <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color, backgroundColor: `${color}15` }}>
                    {item.employment_period || formatDateRange(item.start_date, item.end_date, item.is_current_position)}
                </span>
                {item.is_current_position && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success/70 font-medium">Current</span>
                )}
            </div>
            <p className="text-sm font-semibold text-foreground">{item.position}</p>
            <div className="flex gap-2 items-center">
                <p className="text-xs text-muted-foreground">{item.organization_name}</p>
                {item.experience_level && <><span className="text-muted-foreground">•</span><p className="text-xs text-muted-foreground">{item.experience_level}</p></>}
            </div>
            {item.formatted_duration && <p className="text-[11px] text-muted-foreground mt-1">{item.formatted_duration}</p>}
            {item.responsibilities && <p className="text-xs text-muted-foreground/80 mt-1.5 line-clamp-2">{item.responsibilities}</p>}
        </div>
    );
}

function CreatorCareerTab({ sharedProfile }: DomainTabProps) {
    const qc = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const { data, isLoading } = useQuery({
        ...getCourseCreatorExperienceOptions({ path: { courseCreatorUuid: sharedProfile?.uuid }, query: { pageable: {} } }),
        enabled: !!sharedProfile?.uuid,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    const addExperienceMut = useMutation(addCourseCreatorExperienceMutation());
    const updateExperienceMut = useMutation(updateCourseCreatorExperienceMutation());
    const deleteExperienceMut = useMutation(deleteCourseCreatorExperienceMutation());

    const invalidateExperience = () => qc.invalidateQueries({
        queryKey: getCourseCreatorExperienceQueryKey({ path: { courseCreatorUuid: sharedProfile?.uuid }, query: { pageable: {} } }),
    });

    const serverExperiences: any[] = data?.data?.content ?? [];

    const experiencesWithColor = useMemo(() => {
        if (!serverExperiences?.length) return [];

        const sorted = [...serverExperiences].sort((a, b) => {
            if (a.is_current_position && !b.is_current_position) return -1;
            if (!a.is_current_position && b.is_current_position) return 1;

            return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
        });

        return sorted.map((item, i) => ({
            ...item,
            color: CAREER_COLORS[i % CAREER_COLORS.length],
        }));
    }, [serverExperiences]);


    const blankEntry = (): ExpEntry => ({
        instructor_uuid: sharedProfile?.uuid ?? '',
        organization_name: '', position: '', responsibilities: '',
        start_date: '', end_date: '', is_current_position: false,
    });

    const toFormEntry = (exp: any): ExpEntry => ({
        uuid: exp.uuid,
        instructor_uuid: sharedProfile?.uuid ?? '',
        organization_name: exp.organization_name ?? '',
        position: exp.position ?? '',
        responsibilities: exp.responsibilities ?? '',
        start_date: exp.start_date ? new Date(exp.start_date).toISOString().slice(0, 7) : '',
        end_date: exp.end_date ? new Date(exp.end_date).toISOString().slice(0, 7) : '',
        is_current_position: exp.is_current_position ?? false,
    });

    const form = useForm<ExperienceFormValues>({
        resolver: zodResolver(experienceFormSchema),
        defaultValues: { experiences: [blankEntry()] },
        mode: 'onChange',
    });

    const { fields, append, remove, replace } = useFieldArray({ control: form.control, name: 'experiences' });

    const enterEditMode = () => {
        replace(serverExperiences.length > 0 ? serverExperiences.map(toFormEntry) : [blankEntry()]);
        setIsEditing(true);
    };

    const cancelEdit = () => { setIsEditing(false); form.reset(); };

    const removeEntry = async (index: number) => {
        if (!confirm('Remove this experience?')) return;
        const expUuid = form.getValues(`experiences.${index}.uuid`);
        remove(index);
        if (expUuid) {
            deleteExperienceMut.mutate(
                { path: { experienceUuid: expUuid, courseCreatorUuid: sharedProfile.uuid } },
                { onSuccess: () => { invalidateExperience(); toast.success('Experience removed'); }, onError: () => toast.error('Could not remove experience') }
            );
        }
    };

    const onSubmit = async (values: ExperienceFormValues) => {
        setIsSaving(true);
        try {
            for (const [i, exp] of values.experiences.entries()) {
                const body = {
                    ...exp,
                    course_creator_uuid: sharedProfile?.uuid,
                    start_date: new Date(`${exp.start_date}-01`),
                    end_date: exp.end_date ? new Date(`${exp.end_date}-01`) : undefined,
                };

                if (!exp.uuid) {
                    const resp = await addExperienceMut.mutateAsync({ body, path: { courseCreatorUuid: sharedProfile.uuid } });
                    if (resp?.data) {
                        const exps = form.getValues('experiences');
                        exps[i] = toFormEntry(resp.data);
                        form.setValue('experiences', exps);
                    }
                } else {
                    await updateExperienceMut.mutateAsync({ body, path: { experienceUuid: exp.uuid, courseCreatorUuid: sharedProfile.uuid } });
                }
            }
            invalidateExperience();
            toast.success('Career history updated successfully');
            setIsEditing(false);
        } catch {
            toast.error('Something went wrong — please try again');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <TabShell>
                <Card>
                    <CardContent className="pt-5 pl-10 space-y-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-1.5">
                                <Skeleton className="h-4 w-1/4" />
                                <Skeleton className="h-3.5 w-1/2" />
                                <Skeleton className="h-3 w-1/3" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </TabShell>
        );
    }

    if (!isEditing) {
        return (
            <TabShell>
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold">Career Timeline</CardTitle>
                            <Button type="button" variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={enterEditMode}>
                                <Pencil className="h-3.5 w-3.5" /> Edit
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {serverExperiences.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <Briefcase className="h-10 w-10 text-muted-foreground/30 mb-3" />
                                <p className="text-sm text-muted-foreground">No professional experience added yet.</p>
                                <Button type="button" variant="link" size="sm" className="mt-1 text-xs" onClick={enterEditMode}>Add your first experience</Button>
                            </div>
                        ) : (
                            <div className="relative pl-8">
                                <div className="absolute left-1.5 top-0 bottom-0 w-px bg-border" />
                                {experiencesWithColor.map((item) => <ExperienceViewCard key={item.uuid} item={item} color={item.color} />)}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabShell>
        );
    }

    return (
        <TabShell>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-semibold">Edit Career History</CardTitle>
                                <Button type="button" variant="ghost" size="sm" className="gap-1.5 h-8 text-xs text-muted-foreground" onClick={cancelEdit} disabled={isSaving}>
                                    <X className="h-3.5 w-3.5" /> Cancel
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-0 space-y-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="group relative rounded-xl border border-border bg-muted/30 transition-colors hover:bg-muted/40">
                                    <div className="space-y-5 p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-2">
                                                <Grip className="mt-1 h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 shrink-0" />
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground leading-snug">{form.watch(`experiences.${index}.organization_name`) || 'New Experience'}</p>
                                                    <p className="text-xs text-muted-foreground">{form.watch(`experiences.${index}.position`) || 'Role not set'}</p>
                                                </div>
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 hover:bg-destructive/10 hover:text-destructive" onClick={() => removeEntry(index)} disabled={isSaving}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <FormField control={form.control} name={`experiences.${index}.organization_name`} render={({ field }) => (
                                                <FormItem><FormLabel>Organisation</FormLabel><FormControl><Input placeholder="e.g. WHO" {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <FormField control={form.control} name={`experiences.${index}.position`} render={({ field }) => (
                                                <FormItem><FormLabel>Job title</FormLabel><FormControl><Input placeholder="e.g. Analyst" {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <FormField control={form.control} name={`experiences.${index}.start_date`} render={({ field }) => (
                                                <FormItem><FormLabel>Start date</FormLabel><FormControl><Input type="month" {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <FormField control={form.control} name={`experiences.${index}.end_date`} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>End date</FormLabel>
                                                    <FormControl><Input type="month" disabled={form.watch(`experiences.${index}.is_current_position`)} {...field} value={field.value ?? ''} /></FormControl>
                                                    <div className="mt-2">
                                                        <FormField control={form.control} name={`experiences.${index}.is_current_position`} render={({ field: cb }) => (
                                                            <FormItem className="flex flex-row items-center gap-2 space-y-0">
                                                                <FormControl><Checkbox checked={cb.value} onCheckedChange={cb.onChange} /></FormControl>
                                                                <FormLabel className="font-normal text-sm cursor-pointer">I currently work here</FormLabel>
                                                            </FormItem>
                                                        )} />
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        <FormField control={form.control} name={`experiences.${index}.responsibilities`} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Work description</FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder="Responsibilities, accomplishments…" className="min-h-24 resize-y" {...field} value={field.value ?? ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                </div>
                            ))}

                            <Button type="button" variant="outline" className="w-full gap-2" onClick={() => append(blankEntry())} disabled={isSaving}>
                                <PlusCircle className="h-4 w-4" /> Add another experience
                            </Button>

                            <div className="flex justify-end gap-2 pt-2 border-t border-border">
                                <Button type="button" variant="ghost" onClick={cancelEdit} disabled={isSaving}>Cancel</Button>
                                <Button type="submit" className="min-w-32" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save changes'}</Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </Form>
        </TabShell>
    );
}


function CreatorGalleryTab({ userUuid }: DomainTabProps) {
    const [items, setItems] = useState<{ id: string; label: string }[]>([]);
    const [selected, setSelected] = useState<{ id: string; label: string } | null>(null);

    useEffect(() => {
        setItems([
            {
                id: '1',
                label: 'Course Launch',
            },
            {
                id: '2',
                label: 'Workshop',
            },
            {
                id: '3',
                label: 'Webinar',
            },
            {
                id: '4',
                label: 'Keynote',
            },
            {
                id: '5',
                label: 'Demo Day',
            },
            {
                id: '6',
                label: 'Onboarding',
            },
        ]);
    }, [userUuid]);

    return (
        <TabShell>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
                {items.map((item) => (
                    <button key={item.id} onClick={() => setSelected(item)} className="relative h-40 rounded-xl overflow-hidden cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-border" style={{ background: 'bg-success/10' }}>
                        <span className="absolute bottom-3 left-3 text-xs font-semibold backdrop-blur-md px-3 py-1 rounded-full">{item.label}</span>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                    </button>
                ))}
            </div>

            {selected && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setSelected(null)}>
                    <div className="w-80 h-60 rounded-2xl flex items-center justify-center" style={{ background: "bg-success/>20" }}>
                        <span className="text-black text-xl font-bold">{selected.label}</span>
                    </div>
                </div>
            )}
        </TabShell>
    );
}

function CreatorFriendsTab({ userUuid }: DomainTabProps) {
    const [connections, setConnections] = useState<{ uuid: string; name: string; role: string; avatar_url?: string }[]>([]);

    useEffect(() => {
        setConnections([
            { uuid: '1', name: 'Alex Kim', role: 'Product Designer', avatar_url: 'https://i.pravatar.cc/60?img=11' },
            { uuid: '2', name: 'Maria Lopez', role: 'Front-end Dev', avatar_url: 'https://i.pravatar.cc/60?img=5' },
            { uuid: '3', name: 'Jake Russel', role: 'Motion Designer', avatar_url: 'https://i.pravatar.cc/60?img=12' },
            { uuid: '4', name: 'Priya Nair', role: 'UX Researcher', avatar_url: 'https://i.pravatar.cc/60?img=9' },
            { uuid: '5', name: 'Tom Chen', role: 'Brand Designer', avatar_url: 'https://i.pravatar.cc/60?img=15' },
            { uuid: '6', name: 'Sara Wells', role: 'Visual Designer', avatar_url: 'https://i.pravatar.cc/60?img=16' },
        ]);
    }, [userUuid]);

    return (
        <TabShell>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {connections.map((c) => (
                    <Card key={c.uuid}>
                        <CardContent className="pt-4 flex items-center gap-3">
                            <Avatar className="w-12 h-12 shrink-0">
                                <AvatarImage src={c.avatar_url} alt={c.name} />
                                <AvatarFallback>{c.name.split(' ').map((n) => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-foreground text-sm truncate">{c.name}</p>
                                <p className="text-muted-foreground text-xs truncate">{c.role}</p>
                            </div>
                            <Button variant="outline" size="sm" className="shrink-0 text-xs">Follow</Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </TabShell>
    );
}


// ── Tab Registry ──
export const creatorTabs: TabDefinition[] = [
    { id: 'about', label: 'About', component: CreatorAboutTab },
    { id: 'skills', label: 'Skills Card', component: CreatorSkillsTab },
    { id: 'certs', label: 'Certificates', component: CreatorCertificatesTab },
    { id: 'career', label: 'Career Pathways', component: CreatorCareerTab },
    { id: 'gallery', label: 'Gallery', component: CreatorGalleryTab },
    { id: 'friends', label: 'Connections', component: CreatorFriendsTab },
];