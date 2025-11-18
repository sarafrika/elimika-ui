'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { SystemRule, UpsertSystemRuleInput } from '@/services/admin/system-config';
import { useCreateSystemRule, useUpdateSystemRule } from '@/services/admin/system-config';
import { useEffect } from 'react';

const ruleFormSchema = z.object({
  category: z.string().min(1, 'Select a category'),
  key: z.string().min(1, 'Provide a rule key'),
  status: z.enum(['ACTIVE', 'DRAFT', 'DISABLED']),
  priority: z
    .union([z.string(), z.number()])
    .optional()
    .transform(value => {
      if (value === undefined || value === null || value === '') {
        return undefined;
      }
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    }),
  scope_type: z.string().optional(),
  scope_reference: z.string().optional(),
  description: z.string().optional(),
  effective_from: z.string().optional(),
  effective_to: z.string().optional(),
  payload: z
    .string()
    .optional()
    .refine(value => {
      if (!value || !value.trim()) {
        return true;
      }
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    }, 'Payload must be valid JSON'),
});

type RuleFormValues = z.infer<typeof ruleFormSchema>;

const categoryOptions = [
  { label: 'Platform fee', value: 'PLATFORM_FEE' },
  { label: 'Age gate', value: 'AGE_GATE' },
  { label: 'Notifications', value: 'NOTIFICATIONS' },
];

interface RuleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  rule: SystemRule | null;
}

export function RuleFormDialog({ open, onOpenChange, mode, rule }: RuleFormDialogProps) {
  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
      category: rule?.category ?? 'PLATFORM_FEE',
      key: rule?.key ?? '',
      status: (rule?.status as RuleFormValues['status']) ?? 'ACTIVE',
      priority: rule?.priority ?? undefined,
      scope_type: rule?.scope_type ?? '',
      scope_reference: rule?.scope_reference ?? '',
      description: rule?.description ?? '',
      effective_from: rule?.effective_from ?? '',
      effective_to: rule?.effective_to ?? '',
      payload: rule?.payload ? JSON.stringify(rule.payload, null, 2) : '',
    },
  });

  const { mutateAsync: createRule, isPending: isCreating } = useCreateSystemRule();
  const { mutateAsync: updateRule, isPending: isUpdating } = useUpdateSystemRule();

  useEffect(() => {
    if (rule && open) {
      form.reset({
        category: rule.category,
        key: rule.key,
        status: (rule.status as RuleFormValues['status']) ?? 'ACTIVE',
        priority: rule.priority ?? undefined,
        scope_type: rule.scope_type ?? '',
        scope_reference: rule.scope_reference ?? '',
        description: rule.description ?? '',
        effective_from: rule.effective_from ?? '',
        effective_to: rule.effective_to ?? '',
        payload: rule.payload ? JSON.stringify(rule.payload, null, 2) : '',
      });
    } else if (open && mode === 'create') {
      form.reset({
        category: 'PLATFORM_FEE',
        key: '',
        status: 'ACTIVE',
        priority: undefined,
        scope_type: '',
        scope_reference: '',
        description: '',
        effective_from: '',
        effective_to: '',
        payload: '{\n  \n}',
      });
    }
  }, [rule, open, mode, form]);

  const handleSubmit = async (values: RuleFormValues) => {
    const transformed: UpsertSystemRuleInput = {
      category: values.category,
      key: values.key,
      status: values.status,
      priority: values.priority ?? null,
      scope_type: values.scope_type || null,
      scope_reference: values.scope_reference || null,
      description: values.description || null,
      effective_from: values.effective_from || null,
      effective_to: values.effective_to || null,
      payload: values.payload?.trim() ? JSON.parse(values.payload) : {},
    };

    if (mode === 'create') {
      await createRule(transformed);
    } else if (rule?.uuid) {
      await updateRule({ uuid: rule.uuid, payload: transformed });
    }

    onOpenChange(false);
  };

  const isEdit = mode === 'edit';
  const isSubmitting = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit system rule' : 'Create system rule'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update mutable fields such as status, priority, and payload. Category and key are immutable.'
              : 'Define the category, scope, and payload for the new rule before enabling it.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
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
                      disabled={isEdit}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select a category' />
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='key'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rule key</FormLabel>
                    <FormControl>
                      <Input placeholder='eg. platform_fee.global.default' disabled={isEdit} {...field} />
                    </FormControl>
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
                    <Select value={field.value} onValueChange={value => field.onChange(value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select status' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='ACTIVE'>Active</SelectItem>
                        <SelectItem value='DRAFT'>Draft</SelectItem>
                        <SelectItem value='DISABLED'>Disabled</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <FormControl>
                      <Input type='number' placeholder='Optional priority' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='scope_type'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scope type</FormLabel>
                    <FormControl>
                      <Input placeholder='platform | organisation | course' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='scope_reference'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scope reference</FormLabel>
                    <FormControl>
                      <Input placeholder='Optional identifier' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='effective_from'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starts at</FormLabel>
                    <FormControl>
                      <Input type='datetime-local' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='effective_to'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ends at</FormLabel>
                    <FormControl>
                      <Input type='datetime-local' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder='Optional helper text' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='payload'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payload JSON</FormLabel>
                  <FormControl>
                    <Textarea rows={8} className='font-mono text-sm' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex justify-end gap-2'>
              <Button type='button' variant='ghost' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create rule'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
