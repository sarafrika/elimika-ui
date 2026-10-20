'use client';

import DOMPurify from 'dompurify';
import type React from 'react';
import { useEffect, useState } from 'react';

interface RichTextRendererProps {
  htmlString: string;
  maxChars?: number;
  as?: React.ElementType;
}

// The marks the rich text editor produces; anything else (scripts, handlers, iframes) is dropped.
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 's', 'u', 'code', 'pre', 'blockquote', 'a',
  'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'sup', 'sub', 'mark', 'span', 'hr',
  'input', 'label', 'div',
];
const ALLOWED_ATTR = ['href', 'target', 'rel', 'class', 'style', 'type', 'checked', 'disabled', 'data-type', 'data-checked'];

/** Sanitises stored HTML in the browser; DOMPurify needs a DOM, so the server renders nothing. */
export function sanitizeRichText(html: string): string {
  return DOMPurify.sanitize(html ?? '', { ALLOWED_TAGS, ALLOWED_ATTR, ALLOW_DATA_ATTR: false });
}

const truncateHTML = (html: string, maxLength: number): string => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const text = tempDiv.textContent || tempDiv.innerText || '';

  if (text.length <= maxLength) return html;

  const truncatedText = `${text.substring(0, maxLength).trim()}...`;
  const paragraph = document.createElement('p');
  paragraph.textContent = truncatedText;
  return paragraph.outerHTML;
};

const RichTextRenderer: React.FC<RichTextRendererProps> = ({
  htmlString,
  maxChars,
  as: Tag = 'div',
}) => {
  const [content, setContent] = useState('');

  useEffect(() => {
    const safe = sanitizeRichText(htmlString);
    setContent(maxChars ? truncateHTML(safe, maxChars) : safe);
  }, [htmlString, maxChars]);

  return <Tag dangerouslySetInnerHTML={{ __html: content }} />;
};

export default RichTextRenderer;
