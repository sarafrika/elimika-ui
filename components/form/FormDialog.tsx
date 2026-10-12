'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useUserProfile } from '@/context/profile-context';
import { getErrorMessage } from '@/lib/error-utils';
import { type FormEvent, useId, useState } from 'react';
import { toast } from 'sonner';

export type FormDialogValues = Record<string, string | number | boolean | File | null | undefined>;

export type FormDialogField = {
  name: string;
  label: string;
  type?: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'file' | 'checkbox' | 'email' | 'url';
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  description?: string;
  options?: readonly { value: string; label: string }[];
  min?: number;
  max?: number;
  maxLength?: number;
  accept?: string;
};

export type FormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: readonly FormDialogField[];
  initial?: FormDialogValues;
  submitLabel?: string;
  disabled?: boolean;
  onSubmit: (values: FormDialogValues, uid: string) => Promise<void>;
};

// Mount a fresh form for each opening, including after canceling an edit.
export function FormDialog(props: FormDialogProps) {
  return props.open ? <OpenFormDialog {...props} /> : null;
}

function OpenFormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  initial = {},
  submitLabel = 'Save',
  disabled,
  onSubmit,
}: FormDialogProps) {
  const profile = useUserProfile();
  const formId = useId();
  const [values, setValues] = useState<FormDialogValues>(() => ({ ...initial }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (name: string, value: FormDialogValues[string]) =>
    setValues(current => ({ ...current, [name]: value }));
  const changeOpen = (next: boolean) => {
    if (!saving) onOpenChange(next);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (saving || disabled) return;
    setError('');
    try {
      const submitted: FormDialogValues = {};
      for (const field of fields) {
        if (field.disabled) continue;
        const value = values[field.name];
        const text = typeof value === 'string' || typeof value === 'number' ? String(value) : '';
        const empty = value == null || value === '' || (typeof value === 'string' && !value.trim());
        if (field.required && (empty || (field.type === 'checkbox' && value !== true)))
          throw new Error(`${field.label} is required`);
        const maxLength = field.maxLength ?? (field.type === 'textarea' ? 2000 : 200);
        if (typeof value === 'string' && value.length > maxLength)
          throw new Error(`${field.label} is too long`);
        if (!empty && field.type === 'number') {
          const number = Number(text);
          if (
            !Number.isFinite(number) ||
            (field.min != null && number < field.min) ||
            (field.max != null && number > field.max)
          )
            throw new Error(`Enter a valid number for ${field.label}`);
        }
        if (
          !empty &&
          field.type === 'select' &&
          !field.options?.some(option => option.value === value)
        )
          throw new Error(`Choose a valid ${field.label.toLowerCase()}`);
        submitted[field.name] = value;
      }
      if (!profile?.uuid || profile.isLoading || profile.active !== true)
        throw new Error('Please sign in first');
      setSaving(true);
      await onSubmit(submitted, profile.uuid);
      onOpenChange(false);
    } catch (cause) {
      const message = getErrorMessage(cause, 'Could not save');
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent className='flex h-[90dvh] max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl'>
        <DialogHeader className='shrink-0 border-b px-6 py-4 pr-12 text-left'>
          <DialogTitle className='text-xl'>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={submit} className='flex min-h-0 flex-1 flex-col'>
          <ScrollArea className='min-h-0 flex-1'>
            <fieldset disabled={saving || disabled} className='min-w-0 space-y-3 px-6 py-6'>
              {fields.map(field => {
                const id = `${formId}-${field.name}`;
                const value = values[field.name];
                const text =
                  typeof value === 'string' || typeof value === 'number' ? String(value) : '';
                const helpId = field.description ? `${id}-help` : undefined;
                const required = field.required && !field.disabled;
                return (
                  <div key={field.name} className='space-y-1.5'>
                    {field.type === 'checkbox' ? (
                      <div className='flex items-center gap-2'>
                        <Checkbox
                          id={id}
                          checked={value === true}
                          disabled={field.disabled}
                          required={required}
                          aria-describedby={helpId}
                          onCheckedChange={checked => set(field.name, checked === true)}
                        />
                        <Label htmlFor={id}>
                          {field.label}
                          {required && ' *'}
                        </Label>
                      </div>
                    ) : (
                      <>
                        <Label htmlFor={id}>
                          {field.label}
                          {required && ' *'}
                        </Label>
                        {field.type === 'textarea' ? (
                          <Textarea
                            id={id}
                            maxLength={field.maxLength ?? 2000}
                            placeholder={field.placeholder}
                            value={text}
                            required={required}
                            disabled={field.disabled}
                            aria-describedby={helpId}
                            onChange={event => set(field.name, event.target.value)}
                          />
                        ) : field.type === 'select' ? (
                          <Select
                            value={text}
                            onValueChange={next => set(field.name, next)}
                            disabled={saving || disabled || field.disabled}
                            required={required}
                          >
                            <SelectTrigger id={id} className='w-full' aria-describedby={helpId}>
                              <SelectValue placeholder={field.placeholder ?? 'Select…'} />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options?.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : field.type === 'file' ? (
                          <Input
                            id={id}
                            type='file'
                            accept={field.accept}
                            required={required}
                            disabled={field.disabled}
                            aria-describedby={helpId}
                            onChange={event => set(field.name, event.target.files?.[0] ?? null)}
                          />
                        ) : (
                          <Input
                            id={id}
                            type={field.type ?? 'text'}
                            min={field.min}
                            max={field.max}
                            maxLength={field.maxLength ?? 200}
                            placeholder={field.placeholder}
                            value={text}
                            required={required}
                            disabled={field.disabled}
                            aria-describedby={helpId}
                            onChange={event => set(field.name, event.target.value)}
                          />
                        )}
                      </>
                    )}
                    {field.description && (
                      <p id={helpId} className='text-muted-foreground text-xs'>
                        {field.description}
                      </p>
                    )}
                  </div>
                );
              })}
              {error && (
                <p role='alert' className='text-destructive text-sm'>
                  {error}
                </p>
              )}
            </fieldset>
          </ScrollArea>
          <DialogFooter className='shrink-0 border-t px-6 py-4'>
            <Button
              type='button'
              variant='outline'
              disabled={saving}
              onClick={() => changeOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={saving || disabled || !profile?.uuid || profile.isLoading}
            >
              {saving && <Spinner />} {saving ? 'Saving…' : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
