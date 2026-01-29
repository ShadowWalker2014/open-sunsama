import * as React from "react";
import { cn } from "@/lib/utils";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { HtmlContent } from "@/components/ui/html-content";

interface NotesFieldProps {
  notes: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

/**
 * Simple Notes field for Sunsama-style task modal.
 * Click to edit, shows HTML content when not editing.
 */
export function NotesField({ notes, onChange, onBlur }: NotesFieldProps) {
  const [isEditing, setIsEditing] = React.useState(false);

  if (isEditing) {
    return (
      <div onBlur={() => { onBlur(); setIsEditing(false); }}>
        <RichTextEditor
          value={notes}
          onChange={onChange}
          placeholder="Notes..."
          minHeight="80px"
        />
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        "min-h-[60px] rounded-md px-0 py-2 cursor-text transition-colors",
        !notes && "text-muted-foreground"
      )}
    >
      {notes ? (
        <HtmlContent html={notes} />
      ) : (
        <span className="text-sm text-muted-foreground">Notes...</span>
      )}
    </div>
  );
}
