'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { SystemRule, UpsertSystemRuleInput } from '@/services/admin/system-config';
import { useCreateSystemRule, useUpdateSystemRule } from '@/services/admin/system-config';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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

export type RuleFormValues = z.infer<typeof ruleFormSchema>;

const categoryOptions = [
  { label: 'Platform fee', value: 'PLATFORM_FEE' },
  { label: 'Age gate', value: 'AGE_GATE' },
  { label: 'Notifications', value: 'NOTIFICATIONS' },
];

interface RuleFormProps {
  mode: 'create' | 'edit';
  rule?: SystemRule | null;
  onCancel?: () => void;
  onSuccess?: (rule: SystemRule) => void;
}

export function RuleForm({ mode, rule, onCancel, onSuccess }: RuleFormProps) {
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
      payload: rule?.payload ? JSON.stringify(rule.payload, null, 2) : '{\n  \n}',
    },
  });

  const { mutateAsync: createRule, isPending: isCreating } = useCreateSystemRule();
  const { mutateAsync: updateRule, isPending: isUpdating } = useUpdateSystemRule();

  useEffect(() => {
    if (rule) {
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
        payload: rule.payload ? JSON.stringify(rule.payload, null, 2) : '{\n  \n}',
      });
    }
  }, [rule, form]);

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
      const created = await createRule(transformed);
      onSuccess?.(created);
    } else if (rule?.uuid) {
      const updated = await updateRule({ uuid: rule.uuid, payload: transformed });
      onSuccess?.(updated);
    }
  };

  const isEdit = mode === 'edit';
  const isSubmitting = isCreating || isUpdating;

  return (
    <Card className='border-border/60 shadow-sm'>
      <CardHeader className='space-y-2'>
        <CardTitle className='text-xl font-semibold'>
          {isEdit ? 'Edit system rule' : 'Create system rule'}
        </CardTitle>
        <CardDescription>
          {isEdit
            ? 'Update status, priority, scope, and payload for this rule.'
            : 'Define category, scope, and payload for a new rule.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
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

            <div className='flex flex-wrap justify-end gap-2'>
              {onCancel ? (
                <Button type='button' variant='ghost' onClick={onCancel}>
                  Cancel
                </Button>
              ) : null}
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create rule'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
