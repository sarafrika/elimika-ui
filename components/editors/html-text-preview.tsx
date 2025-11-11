'use client';

import React, { useEffect } from 'react';

interface HTMLTextPreviewProps {
  htmlContent: string;
  className?: string;
  style?: React.CSSProperties;
}

const defaultStyles = `
  .html-text-preview p {
    margin: 0 0 1em 0;
  }

  .html-text-preview h1,
  .html-text-preview h2,
  .html-text-preview h3,
  .html-text-preview h4,
  .html-text-preview h5,
  .html-text-preview h6 {
    font-weight: bold;
    margin: 1.2em 0 0.6em;
  }

  .html-text-preview ul,
  .html-text-preview ol {
    list-style-position: outside;
    padding-left: 1.5em;
    margin-bottom: 1em;
  }

  .html-text-preview li {
    margin-bottom: 0.5em;
  }

  .html-text-preview br {
    display: block;
    content: "";
    margin-bottom: 0.5em;
  }

  .html-text-preview strong {
    font-weight: bold;
  }

  .html-text-preview em {
    font-style: italic;
  }

  .html-text-preview blockquote {
    border-left: 4px solid var(--border);
    padding-left: 1em;
    margin: 1em 0;
    color: var(--muted-foreground);
    font-style: italic;
  }

  .html-text-preview a {
    color: var(--primary);
    text-decoration: underline;
  }
`;

const HTMLTextPreview: React.FC<HTMLTextPreviewProps> = ({ htmlContent, className, style }) => {
  // Inject styles only once
  useEffect(() => {
    const styleTagId = 'html-text-preview-styles';
    if (!document.getElementById(styleTagId)) {
      const styleTag = document.createElement('style');
      styleTag.id = styleTagId;
      styleTag.innerHTML = defaultStyles;
      document.head.appendChild(styleTag);
    }
  }, []);

  return (
    <div
      className={`html-text-preview ${className ?? ''}`}
      style={{
        whiteSpace: 'normal',
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default HTMLTextPreview;
