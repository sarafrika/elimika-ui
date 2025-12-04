'use client';

import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useCreateSystemRule, useSystemRule, useUpdateSystemRule, type SystemRule } from '@/services/admin/system-config';
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Code2,
  Eye,
  Loader2,
  Minus,
  Pencil,
  Plus,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';

const categoryOptions = [
  { value: 'PLATFORM_FEE', label: 'Platform fee' },
  { value: 'AGE_GATE', label: 'Age gate' },
  { value: 'ENROLLMENT_GUARD', label: 'Enrollment guard' },
  { value: 'CUSTOM', label: 'Custom' },
];

const statusOptions = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const scopeOptions = [
  { value: 'GLOBAL', label: 'Global (default)' },
  { value: 'TENANT', label: 'Tenant' },
  { value: 'REGION', label: 'Region' },
  { value: 'DEMOGRAPHIC', label: 'Demographic' },
  { value: 'SEGMENT', label: 'Segment' },
];

const valueTypeOptions = [
  { value: 'JSON', label: 'JSON' },
  { value: 'DECIMAL', label: 'Decimal' },
  { value: 'INTEGER', label: 'Integer' },
  { value: 'BOOLEAN', label: 'Boolean' },
  { value: 'STRING', label: 'String' },
];

const ruleFormSchema = z
  .object({
    category: z.enum(['PLATFORM_FEE', 'AGE_GATE', 'ENROLLMENT_GUARD', 'CUSTOM']),
    key: z.string().min(1, 'Required').max(128, 'Max 128 characters'),
    status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']),
    scope: z.enum(['GLOBAL', 'TENANT', 'REGION', 'DEMOGRAPHIC', 'SEGMENT']),
    scopeReference: z.string().max(128, 'Max 128 characters').optional(),
    priority: z.coerce.number().int().optional(),
    valueType: z.enum(['JSON', 'DECIMAL', 'INTEGER', 'BOOLEAN', 'STRING']),
    valuePayload: z
      .string()
      .min(2, 'Provide a value payload')
      .refine(value => {
        try {
          JSON.parse(value);
          return true;
        } catch {
          return false;
        }
      }, 'Payload must be valid JSON'),
    conditions: z
      .string()
      .optional()
      .refine(
        value => {
          if (!value || !value.trim()) return true;
          try {
            JSON.parse(value);
            return true;
          } catch {
            return false;
          }
        },
        { message: 'Conditions must be valid JSON' }
      ),
    effectiveFrom: z.string().optional(),
    effectiveTo: z.string().optional(),
  })
  .refine(
    values => values.scope === 'GLOBAL' || Boolean(values.scopeReference?.trim()),
    {
      message: 'Provide a scope reference for non-global rules',
      path: ['scopeReference'],
    }
  );

type RuleFormValues = z.infer<typeof ruleFormSchema>;

interface RuleDrawerProps {
  open: boolean;
  mode: 'create' | 'edit';
  ruleId?: string | null;
  initialRule?: SystemRule | null;
  onClose: () => void;
  onSaved?: () => void;
}

const getInitialValues = (rule?: SystemRule | null): RuleFormValues => {
  const valuePayload =
    rule?.valuePayload && Object.keys(rule.valuePayload).length > 0
      ? JSON.stringify(rule.valuePayload, null, 2)
      : '{\n  \n}';

  const conditions =
    rule?.conditions && Object.keys(rule.conditions).length > 0
      ? JSON.stringify(rule.conditions, null, 2)
      : '';

  return {
    category: (rule?.category as RuleFormValues['category']) ?? 'PLATFORM_FEE',
    key: rule?.key ?? '',
    status: (rule?.status as RuleFormValues['status']) ?? 'DRAFT',
    scope: (rule?.scope as RuleFormValues['scope']) ?? 'GLOBAL',
    scopeReference: rule?.scopeReference ?? '',
    priority: rule?.priority ?? undefined,
    valueType: (rule?.valueType as RuleFormValues['valueType']) ?? 'JSON',
    valuePayload,
    conditions,
    effectiveFrom: formatForInput(rule?.effectiveFrom),
    effectiveTo: formatForInput(rule?.effectiveTo),
  };
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Not set';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return format(parsed, 'MMM d, yyyy HH:mm');
};

const formatForInput = (value?: string | null) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return format(parsed, "yyyy-MM-dd'T'HH:mm");
};

const splitDateTime = (value?: string | null) => {
  if (!value) return { date: '', time: '' };
  const [date, time] = value.split('T');
  return { date: date ?? '', time: (time ?? '').slice(0, 5) };
};

export function RuleDrawer({ open, mode, ruleId, initialRule, onClose, onSaved }: RuleDrawerProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isEdit = mode === 'edit';

  const { data: fetchedRule, isLoading: isRuleLoading } = useSystemRule(
    isEdit ? ruleId ?? null : null,
    { enabled: isEdit && Boolean(ruleId) && open }
  );

  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleFormSchema),
    mode: 'onChange',
    defaultValues: getInitialValues(initialRule),
  });

  const { mutateAsync: createRule, isPending: isCreating } = useCreateSystemRule();
  const { mutateAsync: updateRule, isPending: isUpdating } = useUpdateSystemRule();

  const isSubmitting = isCreating || isUpdating;

  useEffect(() => {
    if (open && (fetchedRule || initialRule)) {
      form.reset(getInitialValues(fetchedRule ?? initialRule));
      setErrorMessage(null);
    }
  }, [fetchedRule, form, initialRule, open]);

  const watchAll = form.watch();

  const handlePrettyPrint = (field: 'valuePayload' | 'conditions') => {
    const raw = form.getValues(field);
    if (!raw || !raw.trim()) return;
    try {
      const parsed = JSON.parse(raw);
      form.setValue(field, JSON.stringify(parsed, null, 2), { shouldDirty: true, shouldValidate: true });
    } catch {
      toast.error('Unable to format invalid JSON');
    }
  };

  const handleSubmit = async (values: RuleFormValues) => {
    setErrorMessage(null);

    const parsePriority = (input: RuleFormValues['priority']) => {
      if (input === null || input === undefined || input === '') return undefined;
      const numeric = typeof input === 'number' ? input : Number(input);
      return Number.isFinite(numeric) ? numeric : undefined;
    };

    const toIsoDateTime = (value?: string | null) => {
      if (!value) return undefined;
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
    };

    const payload = {
      category: values.category,
      key: values.key.trim(),
      status: values.status,
      scope: values.scope,
      scopeReference: values.scope === 'GLOBAL' ? undefined : values.scopeReference?.trim() || undefined,
      priority: parsePriority(values.priority),
      valueType: values.valueType,
      valuePayload: JSON.parse(values.valuePayload),
      conditions: values.conditions?.trim() ? JSON.parse(values.conditions) : undefined,
      effectiveFrom: toIsoDateTime(values.effectiveFrom),
      effectiveTo: toIsoDateTime(values.effectiveTo),
    };

    try {
      if (isEdit && ruleId) {
        await updateRule({ uuid: ruleId, body: payload });
        toast.success('Rule updated');
      } else {
        await createRule(payload);
        toast.success('Rule created');
      }
      onSaved?.();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save rule';
      setErrorMessage(message);
      toast.error(message);
    }
  };

  const handleInvalid = () => {
    const firstError = Object.keys(form.formState.errors)[0];
    if (firstError) {
      const el = document.querySelector(`[name="${firstError}"]`);
      if (el instanceof HTMLElement) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      const hasUnsavedChanges = form.formState.isDirty && !isSubmitting;
      if (hasUnsavedChanges) {
        const confirmed = window.confirm('Discard unsaved changes?');
        if (!confirmed) return;
      }
      onClose();
    }
  };

  const timeline = useMemo(
    () => ({
      from: formatDate(watchAll.effectiveFrom),
      to: formatDate(watchAll.effectiveTo),
    }),
    [watchAll.effectiveFrom, watchAll.effectiveTo]
  );

  const summaryItems = [
    { label: 'Category', value: categoryOptions.find(item => item.value === watchAll.category)?.label },
    { label: 'Key', value: watchAll.key || 'Not set' },
    { label: 'Scope', value: watchAll.scope },
    {
      label: 'Reference',
      value: watchAll.scope === 'GLOBAL' ? 'Global' : watchAll.scopeReference || '—',
    },
    { label: 'Status', value: watchAll.status },
    { label: 'Priority', value: watchAll.priority ?? 'Not set' },
  ];

  const disableSave = !form.formState.isValid || isSubmitting;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side='right'
        className='w-full max-w-6xl overflow-y-auto border-l bg-background p-0 sm:max-w-5xl'
      >
        <SheetHeader className='sticky top-0 z-10 border-b bg-gradient-to-r from-background to-muted/20 px-6 py-5 shadow-sm backdrop-blur'>
          <div className='flex items-center gap-3'>
            <div className='rounded-lg bg-primary/10 p-2'>
              <SlidersHorizontal className='h-5 w-5 text-primary' />
            </div>
            <div className='flex-1'>
              <SheetTitle className='text-xl font-semibold text-foreground'>
                {isEdit ? 'Edit system rule' : 'Create new system rule'}
              </SheetTitle>
              <SheetDescription className='mt-1'>
                Configure category, scope, payload, and effective window. Changes take effect after save.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className='grid gap-6 px-6 py-6 lg:grid-cols-[1.6fr_1fr]'>
          {/* Form Section - Submission Layer */}
          <div className='space-y-6'>
            <div className='rounded-lg border border-primary/20 bg-primary/5 p-4'>
              <div className='flex items-center gap-2'>
                <Pencil className='h-4 w-4 text-primary' />
                <h3 className='text-sm font-semibold text-foreground'>Rule Configuration</h3>
              </div>
              <p className='mt-1 text-xs text-muted-foreground'>
                Fill in the details below to configure your system rule
              </p>
            </div>

            {errorMessage ? (
              <Alert variant='destructive' className='shadow-sm'>
                <AlertCircle className='h-4 w-4' />
                <AlertTitle>Save failed</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            {isEdit && isRuleLoading ? (
              <div className='space-y-4'>
                <div className='h-10 w-2/3 rounded-lg bg-muted animate-pulse' />
                <div className='h-20 rounded-lg bg-muted animate-pulse' />
                <div className='h-40 rounded-lg bg-muted animate-pulse' />
              </div>
            ) : (
              <Form {...form}>
                <form
                  className='space-y-6'
                  onSubmit={form.handleSubmit(handleSubmit, handleInvalid)}
                >
                  <div className='grid gap-4 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='category'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={value => field.onChange(value)}
                            disabled={isSubmitting}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='Select category' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categoryOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>Choose the platform policy grouping.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='key'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Key</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='e.g. platform_fee.global.default'
                              maxLength={128}
                              disabled={isSubmitting}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Unique identifier (max 128 characters).</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='status'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <div className='grid grid-cols-3 gap-2'>
                            {statusOptions.map(option => (
                              <Button
                                key={option.value}
                                type='button'
                                variant={field.value === option.value ? 'default' : 'outline'}
                                size='sm'
                                className='justify-start'
                                onClick={() => field.onChange(option.value)}
                                disabled={isSubmitting}
                              >
                                {option.label}
                              </Button>
                            ))}
                          </div>
                          <FormDescription>Draft before activation; inactive disables the rule.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='priority'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <div className='flex items-center gap-2'>
                            <Button
                              type='button'
                              variant='outline'
                              size='icon'
                              onClick={() => field.onChange(Math.max(Number(field.value ?? 0) - 1, 0))}
                              disabled={isSubmitting}
                              aria-label='Decrease priority'
                            >
                              <Minus className='h-4 w-4' />
                            </Button>
                            <FormControl>
                              <Input
                                type='number'
                                min={0}
                                placeholder='0'
                                value={field.value ?? ''}
                                onChange={event => {
                                  const raw = event.target.value;
                                  if (raw === '') {
                                    field.onChange(undefined);
                                    return;
                                  }
                                  const numeric = Number(raw);
                                  field.onChange(Number.isNaN(numeric) ? raw : numeric);
                                }}
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <Button
                              type='button'
                              variant='outline'
                              size='icon'
                              onClick={() => field.onChange(Number(field.value ?? 0) + 1)}
                              disabled={isSubmitting}
                              aria-label='Increase priority'
                            >
                              <Plus className='h-4 w-4' />
                            </Button>
                          </div>
                          <FormDescription>Lower numbers can be treated as higher priority.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='scope'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Scope</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={value => field.onChange(value)}
                            disabled={isSubmitting}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='Select scope' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {scopeOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>Where the rule applies across the platform.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchAll.scope !== 'GLOBAL' ? (
                      <FormField
                        control={form.control}
                        name='scopeReference'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Scope reference</FormLabel>
                            <FormControl>
                              <Input
                                placeholder='Tenant UUID, ISO country code, or segment id'
                                maxLength={128}
                                disabled={isSubmitting}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : null}

                    <FormField
                      control={form.control}
                      name='effectiveFrom'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Effective from</FormLabel>
                          <FormControl>
                            <div className='grid gap-2 sm:grid-cols-[1fr_0.9fr]'>
                              <Input
                                type='date'
                                value={splitDateTime(field.value).date}
                                onChange={event => {
                                  const { time } = splitDateTime(field.value);
                                  const date = event.target.value;
                                  field.onChange(date && time ? `${date}T${time}` : date ? `${date}T00:00` : '');
                                }}
                                disabled={isSubmitting}
                              />
                              <Input
                                type='time'
                                step='60'
                                value={splitDateTime(field.value).time}
                                onChange={event => {
                                  const { date } = splitDateTime(field.value);
                                  const time = event.target.value;
                                  field.onChange(date && time ? `${date}T${time}` : date ? `${date}T00:00` : '');
                                }}
                                disabled={isSubmitting}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='effectiveTo'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Effective to</FormLabel>
                          <FormControl>
                            <div className='grid gap-2 sm:grid-cols-[1fr_0.9fr]'>
                              <Input
                                type='date'
                                value={splitDateTime(field.value).date}
                                onChange={event => {
                                  const { time } = splitDateTime(field.value);
                                  const date = event.target.value;
                                  field.onChange(date && time ? `${date}T${time}` : date ? `${date}T00:00` : '');
                                }}
                                disabled={isSubmitting}
                              />
                              <Input
                                type='time'
                                step='60'
                                value={splitDateTime(field.value).time}
                                onChange={event => {
                                  const { date } = splitDateTime(field.value);
                                  const time = event.target.value;
                                  field.onChange(date && time ? `${date}T${time}` : date ? `${date}T00:00` : '');
                                }}
                                disabled={isSubmitting}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div className='space-y-1'>
                        <p className='text-sm font-semibold'>Value</p>
                        <p className='text-muted-foreground text-xs'>
                          Declare how the rule payload should be interpreted.
                        </p>
                      </div>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        className='gap-2'
                        onClick={() => handlePrettyPrint('valuePayload')}
                        disabled={isSubmitting}
                      >
                        <Sparkles className='h-4 w-4' />
                        Pretty print
                      </Button>
                    </div>

                    <div className='grid gap-4 md:grid-cols-[180px_1fr]'>
                      <FormField
                        control={form.control}
                        name='valueType'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Value type</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={value => field.onChange(value)}
                              disabled={isSubmitting}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder='Select type' />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {valueTypeOptions.map(option => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name='valuePayload'
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                rows={8}
                                className='font-mono text-sm'
                                placeholder='{}'
                                disabled={isSubmitting}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>JSON payload describing the rule value.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant='ghost' type='button' className='w-full justify-between px-0'>
                        <div className='flex items-center gap-2 text-sm font-semibold'>
                          <Code2 className='h-4 w-4' />
                          Conditions (optional)
                        </div>
                        <Eye className='h-4 w-4 text-muted-foreground' />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className='mt-3 space-y-3'>
                      <FormField
                        control={form.control}
                        name='conditions'
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                rows={6}
                                className='font-mono text-sm'
                                placeholder='Leave empty for unconditional rule'
                                disabled={isSubmitting}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Conditional logic in JSON. Empty means always apply.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        className='gap-2'
                        onClick={() => handlePrettyPrint('conditions')}
                        disabled={isSubmitting}
                      >
                        <Sparkles className='h-4 w-4' />
                        Pretty print conditions
                      </Button>
                    </CollapsibleContent>
                  </Collapsible>

                  <SheetFooter className='sticky bottom-0 left-0 right-0 mt-6 border-t bg-background/95 px-0 py-4 backdrop-blur'>
                    <div className='flex flex-wrap items-center justify-between gap-3'>
                      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                        <CalendarClock className='h-4 w-4' />
                        <span>
                          {timeline.from} <ArrowRight className='mx-1 inline h-3 w-3 align-middle' /> {timeline.to}
                        </span>
                      </div>
                      <div className='flex gap-2'>
                        <Button type='button' variant='outline' onClick={onClose} disabled={isSubmitting}>
                          Cancel
                        </Button>
                        <Button type='submit' disabled={disableSave}>
                          {isSubmitting ? (
                            <span className='flex items-center gap-2'>
                              <Loader2 className='h-4 w-4 animate-spin' />
                              Saving…
                            </span>
                          ) : (
                            'Save rule'
                          )}
                        </Button>
                      </div>
                    </div>
                  </SheetFooter>
                </form>
              </Form>
            )}
          </div>

          {/* Presentation Section - Live Preview */}
          <div className='space-y-4'>
            <div className='rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-background p-4 shadow-md'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Eye className='h-4 w-4 text-primary' />
                  <div>
                    <p className='text-sm font-semibold text-foreground'>Rule Summary</p>
                    <p className='text-xs text-muted-foreground'>Live preview as you edit</p>
                  </div>
                </div>
                <Badge variant='outline' className='rounded-full'>
                  {watchAll.status}
                </Badge>
              </div>
              <Separator className='my-4' />
              <div className='grid gap-2.5 text-sm'>
                {summaryItems.map(item => (
                  <div key={item.label} className='flex items-center justify-between gap-3 rounded-md bg-background/60 px-2 py-1.5'>
                    <span className='text-xs font-medium text-muted-foreground'>{item.label}</span>
                    <span className='text-right text-sm font-semibold text-foreground'>{item.value || '—'}</span>
                  </div>
                ))}
              </div>
              <div className='mt-3 rounded-lg border border-dashed border-border/80 p-3'>
                <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                  <CalendarClock className='h-4 w-4' />
                  Effective window
                </div>
                <div className='mt-2 flex items-center gap-2 text-sm'>
                  <Badge variant='outline'>{timeline.from}</Badge>
                  <ArrowRight className='h-4 w-4 text-muted-foreground' />
                  <Badge variant='outline'>{timeline.to}</Badge>
                </div>
              </div>
            </div>

            <div className='rounded-lg border bg-card p-4 shadow-sm'>
              <div className='flex items-center gap-2'>
                <Code2 className='h-4 w-4 text-primary' />
                <p className='text-sm font-semibold text-foreground'>Payload Preview</p>
              </div>
              <p className='mt-1 text-xs text-muted-foreground'>JSON value structure</p>
              <ScrollArea className='mt-3 h-48 rounded-lg border border-dashed border-border/70 bg-muted/40 p-3 shadow-inner'>
                <pre className='whitespace-pre-wrap break-all font-mono text-xs text-foreground'>
                  {watchAll.valuePayload || '{}'}
                </pre>
              </ScrollArea>
            </div>

            <div className='rounded-lg border bg-card p-4 shadow-sm'>
              <div className='flex items-center gap-2'>
                <CheckCircle2 className='h-4 w-4 text-green' />
                <p className='text-sm font-semibold text-foreground'>Conditions</p>
              </div>
              <p className='mt-1 text-xs text-muted-foreground'>Optional rule constraints</p>
              <ScrollArea className='mt-3 h-32 rounded-lg border border-dashed border-border/70 bg-muted/30 p-3 shadow-inner'>
                <pre className='whitespace-pre-wrap break-all font-mono text-xs text-muted-foreground'>
                  {watchAll.conditions?.trim() ? watchAll.conditions : 'No conditions. Rule always applies.'}
                </pre>
              </ScrollArea>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
