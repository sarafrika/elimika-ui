import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import { Editor } from 'react-draft-wysiwyg';
import React, { useState } from 'react';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { EditorState, ContentState, convertToRaw } from 'draft-js';

interface RichTextEditorProps {
  initialContent?: string;
  onChange?: (html: string) => void;
  readOnly?: boolean;
}

const WysiwygRichTextEditor: React.FC<RichTextEditorProps> = ({
  initialContent = '',
  onChange,
  readOnly = false,
}) => {
  const [editorState, setEditorState] = useState(() => {
    if (initialContent) {
      const contentBlock = htmlToDraft(initialContent);
      const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
      return EditorState.createWithContent(contentState);
    }
    return EditorState.createEmpty();
  });

  const handleEditorStateChange = (state: EditorState) => {
    setEditorState(state);
    const html = draftToHtml(convertToRaw(state.getCurrentContent()));
    onChange?.(html);
  };

  return (
    <div>
      <Editor
        editorState={editorState}
        wrapperClassName='rte-wrapper'
        editorClassName='rte-editor'
        toolbarClassName='rte-toolbar'
        onEditorStateChange={handleEditorStateChange}
        readOnly={readOnly}
        toolbarHidden={readOnly}
        // toolbar={{
        //   options: ["inline", "list", "link"],
        //   inline: { options: ["bold", "italic"] },
        //   list: { options: ["unordered", "ordered"] },
        //   link: { options: ["link"] },
        // }}
      />
    </div>
  );
};

export default WysiwygRichTextEditor;
