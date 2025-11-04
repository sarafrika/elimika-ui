'use client';

import * as React from 'react';

import { Button } from '@ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@ui/card';
import { CodeEditor } from '@ui/code-editor';
import { Input } from '@ui/input';
import { Label } from '@ui/label';
import { ScrollArea } from '@ui/scroll-area';
import { Separator } from '@ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs';

import { EmailTemplate, TemplateVariable, UpdateEmailTemplateInput } from '@/services/admin/settings';

export type EmailTemplateEditorProps = {
  template: EmailTemplate;
  isSaving?: boolean;
  onSave: (payload: UpdateEmailTemplateInput) => Promise<void> | void;
};

const renderPreview = (html: string) => ({ __html: html });

export function EmailTemplateEditor({ template, isSaving = false, onSave }: EmailTemplateEditorProps) {
  const [subject, setSubject] = React.useState(template.subject ?? '');
  const [htmlBody, setHtmlBody] = React.useState(template.body ?? '');
  const [textBody, setTextBody] = React.useState(template.textBody ?? '');
  const [activeTab, setActiveTab] = React.useState<'edit' | 'preview'>('edit');

  React.useEffect(() => {
    setSubject(template.subject ?? '');
    setHtmlBody(template.body ?? '');
    setTextBody(template.textBody ?? '');
  }, [template.id, template.subject, template.body, template.textBody]);

  const handleSave = React.useCallback(async () => {
    await onSave({
      subject,
      body: htmlBody,
      textBody,
      description: template.description,
    });
  }, [htmlBody, onSave, subject, template.description, textBody]);

  const hasVariables = (template.variables?.length ?? 0) > 0;

  return (
    <Card className='overflow-hidden'>
      <CardHeader className='space-y-1'>
        <CardTitle>{template.name}</CardTitle>
        <CardDescription>{template.description ?? 'Customize the message delivered to learners.'}</CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className='grid gap-6 lg:grid-cols-[1fr_280px]'>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='template-subject'>Subject line</Label>
            <Input
              id='template-subject'
              value={subject}
              onChange={event => setSubject(event.target.value)}
              placeholder='Welcome to Elimika'
            />
          </div>
          <Tabs value={activeTab} onValueChange={value => setActiveTab(value as 'edit' | 'preview')}>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='edit'>Editor</TabsTrigger>
              <TabsTrigger value='preview'>Preview</TabsTrigger>
            </TabsList>
            <TabsContent value='edit' className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='template-html'>HTML body</Label>
                <CodeEditor
                  id='template-html'
                  value={htmlBody}
                  onChange={setHtmlBody}
                  placeholder='<p>Hello {{learner.name}}</p>'
                  minRows={16}
                  maxRows={28}
                  aria-label='HTML email body editor'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='template-text'>Plain text fallback</Label>
                <CodeEditor
                  id='template-text'
                  value={textBody}
                  onChange={setTextBody}
                  placeholder='Hello {{learner.name}}'
                  minRows={6}
                  maxRows={16}
                  aria-label='Plain text email body editor'
                />
              </div>
            </TabsContent>
            <TabsContent value='preview'>
              <div className='rounded-md border border-border bg-muted/40 p-4'>
                <div className='mb-3 border-b border-dashed border-border pb-3 text-sm text-muted-foreground'>
                  <strong className='block text-foreground'>Subject:</strong> {subject || '—'}
                </div>
                <article
                  className='prose prose-neutral max-w-none text-sm leading-relaxed'
                  dangerouslySetInnerHTML={renderPreview(htmlBody || textBody || '<p>Nothing to preview yet.</p>')}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <aside className='space-y-4'>
          <div className='rounded-md border border-dashed border-border/60 bg-muted/40 p-4'>
            <h3 className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>Variables</h3>
            {hasVariables ? (
              <ScrollArea className='mt-3 max-h-64 pr-2'>
                <ul className='space-y-2 text-sm'>
                  {template.variables?.map((variable: TemplateVariable) => (
                    <li key={variable.key} className='rounded-md border border-border/50 bg-background px-3 py-2'>
                      <code className='font-mono text-xs text-primary'>
                        {'{{'}
                        {variable.key}
                        {'}}'}
                      </code>
                      {variable.description ? (
                        <p className='mt-1 text-xs text-muted-foreground'>{variable.description}</p>
                      ) : null}
                      {variable.sample !== undefined ? (
                        <p className='mt-1 text-xs text-muted-foreground'>Example: {String(variable.sample)}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : (
              <p className='mt-2 text-sm text-muted-foreground'>
                No template variables are defined for this notification yet. Reach out to engineering if you
                need new placeholders.
              </p>
            )}
          </div>
          <div className='rounded-md border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground'>
            <p>
              Changes go live immediately. Use staging for risky changes or clone the template if you need a
              rollback strategy.
            </p>
          </div>
        </aside>
      </CardContent>
      <Separator />
      <CardFooter className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <p className='text-xs text-muted-foreground'>
          Tip: Personalize messages with variables. Hover to view descriptions and sample values.
        </p>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save template'}
        </Button>
      </CardFooter>
    </Card>
  );
}
