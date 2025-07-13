"use client"

import * as React from "react"

import type { Value } from "platejs"

import {
  BlockquotePlugin,
  BoldPlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  ItalicPlugin,
  UnderlinePlugin,
} from "@platejs/basic-nodes/react"
import { Plate, usePlateEditor } from "platejs/react"

import { BlockquoteElement } from "@/components/ui/blockquote-node"
import { Editor, EditorContainer } from "@/components/ui/editor"
import { FixedToolbar } from "@/components/ui/fixed-toolbar"
import { H1Element, H2Element, H3Element } from "@/components/ui/heading-node"
import { MarkToolbarButton } from "@/components/ui/mark-toolbar-button"
import { ToolbarButton } from "@/components/ui/toolbar"
import { serialize } from "@/hooks/serializeRichText"

interface RichTextEditorProps {
  value: Value
  onChange: (params: { value: Value; html: string }) => void
}

const initialValue: Value = []

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = usePlateEditor({
    plugins: [
      BoldPlugin,
      ItalicPlugin,
      UnderlinePlugin,
      H1Plugin.withComponent(H1Element),
      H2Plugin.withComponent(H2Element),
      H3Plugin.withComponent(H3Element),
      BlockquotePlugin.withComponent(BlockquoteElement),
    ],
    value: () => value,
  })

  return (
    <Plate
      editor={editor}
      onChange={({ value }) => {
        const html = serialize(value)
        onChange({ value, html })
      }}
    >
      <FixedToolbar className="mt-4 flex justify-start gap-1 rounded-t-lg border border-stone-300">
        <ToolbarButton onClick={() => editor?.tf?.h1?.toggle()}>H1</ToolbarButton>
        <ToolbarButton onClick={() => editor?.tf?.h2?.toggle()}>H2</ToolbarButton>
        <ToolbarButton onClick={() => editor?.tf?.h3?.toggle()}>H3</ToolbarButton>

        <ToolbarButton onClick={() => editor.tf.blockquote.toggle()}>Quote</ToolbarButton>

        <MarkToolbarButton nodeType="bold" tooltip="Bold (⌘+B)">
          B
        </MarkToolbarButton>
        <MarkToolbarButton nodeType="italic" tooltip="Italic (⌘+I)">
          I
        </MarkToolbarButton>
        <MarkToolbarButton nodeType="underline" tooltip="Underline (⌘+U)">
          U
        </MarkToolbarButton>

        <div className="flex-1" />

        <ToolbarButton
          className="px-2"
          onClick={() => {
            editor.tf.setValue(initialValue)
          }}
        >
          Reset
        </ToolbarButton>

        <ToolbarButton
          className="px-2 text-white"
          onClick={() => {
            const html = serialize(editor.children)
            console.log("Serialized HTML:", html)
            // You can also pass html to a callback prop, etc.
          }}
        >
          HTML
        </ToolbarButton>
      </FixedToolbar>

      <EditorContainer>
        <Editor placeholder="Type your amazing content here..." />
      </EditorContainer>
    </Plate>
  )
}
