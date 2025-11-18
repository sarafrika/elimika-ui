import type React from 'react';

interface RichTextRendererProps {
  htmlString: string;
  maxChars?: number;
  as?: React.ElementType;
}

const truncateHTML = (html: string, maxLength: number): string => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const text = tempDiv.textContent || tempDiv.innerText || '';

  if (text.length <= maxLength) return html;

  const truncatedText = `${text.substring(0, maxLength).trim()}...`;
  return `<p>${truncatedText}</p>`;
};

const RichTextRenderer: React.FC<RichTextRendererProps> = ({
  htmlString,
  maxChars,
  as: Tag = 'div',
}) => {
  const content = maxChars ? truncateHTML(htmlString, maxChars) : htmlString;

  return <Tag dangerouslySetInnerHTML={{ __html: content }} />;
};

export default RichTextRenderer;

// Example Usage
//   <RichTextRenderer htmlString={exampleHtml} /> -- render entire html
//   <RichTextRenderer htmlString={exampleHtml} maxChars={80} /> -- truncate text at character
//   <RichTextRenderer htmlString={exampleHtml} maxChars={50} as="section" />
