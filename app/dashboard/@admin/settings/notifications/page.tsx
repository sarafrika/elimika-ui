'use client';

import * as React from 'react';

import { Button } from '@ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card';
import { Input } from '@ui/input';
import { ScrollArea } from '@ui/scroll-area';
import { Skeleton } from '@ui/skeleton';
import { Separator } from '@ui/separator';

import {
  EmailTemplate,
  useAdminEmailTemplates,
  useAdminUpdateEmailTemplate,
  type UpdateEmailTemplateInput,
} from '@/services/admin/settings';
import { EmailTemplateEditor } from './_components/EmailTemplateEditor';
import { toast } from 'sonner';

export default function AdminNotificationTemplatesPage() {
  const { data: templates = [], isLoading } = useAdminEmailTemplates();
  const updateTemplate = useAdminUpdateEmailTemplate();
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');

  const visibleTemplates = React.useMemo(() => {
    if (!searchTerm) {
      return templates;
    }
    const normalized = searchTerm.toLowerCase();
    return templates.filter(template =>
      [template.name, template.description, template.category]
        .filter(Boolean)
        .some(value => value?.toLowerCase().includes(normalized))
    );
  }, [searchTerm, templates]);

  const activeTemplate: EmailTemplate | undefined = React.useMemo(() => {
    if (selectedTemplateId) {
      return templates.find(template => template.id === selectedTemplateId);
    }
    return visibleTemplates[0];
  }, [selectedTemplateId, templates, visibleTemplates]);

  React.useEffect(() => {
    if (!selectedTemplateId && visibleTemplates.length > 0) {
      setSelectedTemplateId(visibleTemplates[0]?.id ?? null);
    }
  }, [selectedTemplateId, visibleTemplates]);

  const handleSave = React.useCallback(
    async (updates: UpdateEmailTemplateInput) => {
      if (!activeTemplate) return;
      await updateTemplate.mutateAsync({
        templateId: activeTemplate.id,
        payload: updates,
      });
      toast.success('Template saved');
    },
    [activeTemplate, updateTemplate]
  );

  return (
    <div className='space-y-6'>
      <header className='space-y-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>Notification templates</h1>
        <p className='text-muted-foreground'>
          Tailor the messaging experience sent from the platform. Changes apply instantly to all new
          deliveries.
        </p>
      </header>
      <div className='grid gap-6 lg:grid-cols-[260px_1fr] xl:grid-cols-[300px_1fr]'>
        <Card className='h-full'>
          <CardHeader>
            <CardTitle className='text-base'>Templates</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className='space-y-4 pt-4'>
            <Input
              placeholder='Search templates...'
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
            />
            <ScrollArea className='h-[520px] pr-2'>
              <div className='space-y-2'>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className='h-16 w-full' />)
                ) : visibleTemplates.length > 0 ? (
                  visibleTemplates.map(template => {
                    const isActive = activeTemplate?.id === template.id;
                    return (
                      <button
                        key={template.id}
                        type='button'
                        className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                          isActive
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border hover:border-primary/40 hover:bg-muted/60'
                        }`}
                        onClick={() => setSelectedTemplateId(template.id)}
                      >
                        <div className='font-semibold'>{template.name}</div>
                        {template.description ? (
                          <p className='text-xs text-muted-foreground'>{template.description}</p>
                        ) : null}
                      </button>
                    );
                  })
                ) : (
                  <div className='flex flex-col items-center justify-center rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground'>
                    <p>No templates match your search.</p>
                    <Button
                      variant='outline'
                      size='sm'
                      className='mt-3'
                      onClick={() => setSearchTerm('')}
                    >
                      Reset search
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        <div>
          {activeTemplate ? (
            <EmailTemplateEditor
              key={activeTemplate.id}
              template={activeTemplate}
              isSaving={updateTemplate.isPending}
              onSave={handleSave}
            />
          ) : (
            <Card className='grid h-full place-items-center border-dashed'>
              <p className='text-sm text-muted-foreground'>Select a template to get started.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
