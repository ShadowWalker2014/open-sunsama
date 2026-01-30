import * as React from "react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface FocusNotesProps {
  notes: string;
  onChange: (notes: string) => void;
}

/**
 * Notes section for focus mode using Tiptap rich text editor
 */
export function FocusNotes({ notes, onChange }: FocusNotesProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
      <RichTextEditor
        value={notes}
        onChange={onChange}
        placeholder="Add notes about this task..."
        minHeight="200px"
        enableFileUpload={true}
      />
    </div>
  );
}
