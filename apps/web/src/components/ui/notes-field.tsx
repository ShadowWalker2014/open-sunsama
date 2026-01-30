import * as React from "react";
import { cn } from "@/lib/utils";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { HtmlContent } from "@/components/ui/html-content";

interface NotesFieldProps {
  notes: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  placeholder?: string;
  minHeight?: string;
}

/**
 * Rich notes field with click-to-edit functionality.
 * Shows rendered HTML content when not editing, Tiptap editor when editing.
 * Used by both task modal and time block editor for consistent UX.
 */
export function NotesField({ 
  notes, 
  onChange, 
  onBlur,
  placeholder = "Notes...",
  minHeight = "60px",
}: NotesFieldProps) {
  const [isEditing, setIsEditing] = React.useState(false);

  if (isEditing) {
    return (
      <div onBlur={() => { onBlur(); setIsEditing(false); }}>
        <RichTextEditor
          value={notes}
          onChange={onChange}
          placeholder={placeholder}
          minHeight="80px"
        />
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        "rounded-md px-0 py-2 cursor-text transition-colors",
        !notes && "text-muted-foreground"
      )}
      style={{ minHeight }}
    >
      {notes ? (
        <HtmlContent html={notes} />
      ) : (
        <span className="text-sm text-muted-foreground">{placeholder}</span>
      )}
    </div>
  );
}
