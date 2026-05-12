'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import RichTextRenderer from '../../../../../components/editors/richTextRenders';

type SettingsFieldProps = {
  label: string;
  value: string;
  helperText?: string;
  multiline?: boolean;
  className?: string;
};

export function SettingsField({
  label,
  value,
  helperText,
  multiline = false,
  className,
}: SettingsFieldProps) {
  const isHtml = /<[^>]+>/g.test(value);

  return (
    <div className={cn('space-y-2', className)}>
      <Label className='text-[0.82rem] font-medium text-foreground/90'>
        {label}
      </Label>

      {multiline ? (
        isHtml ? (
          <div className='border-border/70 bg-background/70 min-h-24 rounded-md border p-3 text-sm'>
            <RichTextRenderer htmlString={value} />
          </div>
        ) : (
          <Textarea
            value={value}
            readOnly
            rows={4}
            className='border-border/70 bg-background/70 min-h-24 rounded-md text-sm shadow-none'
          />
        )
      ) : (
        <Input
          value={value}
          readOnly
          className='border-border/70 bg-background/70 h-11 rounded-md text-sm shadow-none'
        />
      )}

      {helperText ? (
        <div className='text-muted-foreground text-xs'>
          <RichTextRenderer htmlString={helperText} />
        </div>
      ) : null}
    </div>
  );
}
