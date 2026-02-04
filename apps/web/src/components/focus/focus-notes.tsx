import * as React from "react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface FocusNotesProps {
  notes: string;
  onChange: (notes: string) => void;
}

/**
 * Notes section for focus mode using Tiptap rich text editor
 * Clean, minimal design without section header
 */
export function FocusNotes({ notes, onChange }: FocusNotesProps) {
  return (
    <RichTextEditor
      value={notes}
      onChange={onChange}
      placeholder="Notes..."
      minHeight="150px"
      enableFileUpload={true}
    />
  );
}
