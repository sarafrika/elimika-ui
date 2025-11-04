'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

const monospaceClassName =
  'font-mono text-sm leading-6 tracking-tight bg-background border border-border rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

type BaseProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minRows?: number;
  maxRows?: number;
  readOnly?: boolean;
  label?: string;
};

type CodeEditorProps = BaseProps & {
  language?: string;
  'aria-label'?: string;
};

export const CodeEditor = React.forwardRef<HTMLTextAreaElement, CodeEditorProps>(
  (
    {
      value,
      onChange,
      placeholder,
      className,
      minRows = 12,
      maxRows = 24,
      readOnly = false,
      language,
      ...props
    },
    ref
  ) => {
    const textAreaRef = React.useRef<HTMLTextAreaElement | null>(null);

    React.useImperativeHandle(ref, () => textAreaRef.current as HTMLTextAreaElement);

    const [rows, setRows] = React.useState(minRows);

    React.useEffect(() => {
      const lineCount = value.split('\n').length;
      const next = Math.min(Math.max(lineCount + 2, minRows), maxRows);
      setRows(next);
    }, [maxRows, minRows, value]);

    return (
      <textarea
        ref={textAreaRef}
        value={value}
        readOnly={readOnly}
        onChange={event => onChange(event.target.value)}
        rows={rows}
        spellCheck={false}
        placeholder={placeholder}
        aria-multiline='true'
        data-language={language}
        className={cn(
          monospaceClassName,
          'w-full resize-y whitespace-pre text-left tab-8 transition-colors',
          readOnly && 'opacity-75',
          className
        )}
        {...props}
      />
    );
  }
);

CodeEditor.displayName = 'CodeEditor';
