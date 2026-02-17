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
  placeholder = "Add notes...",
  minHeight = "60px",
}: NotesFieldProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Handle blur with relatedTarget check to avoid premature close
  // when clicking toolbar buttons inside the editor
  const handleBlur = React.useCallback(
    (e: React.FocusEvent) => {
      // Check if the new focus target is still within this component
      const relatedTarget = e.relatedTarget as Node | null;
      if (containerRef.current?.contains(relatedTarget)) {
        // Focus is still inside the editor (e.g., clicked toolbar button)
        return;
      }
      // Focus left the component - save and close
      onBlur();
      setIsEditing(false);
    },
    [onBlur]
  );

  if (isEditing) {
    return (
      <div ref={containerRef} onBlur={handleBlur}>
        <RichTextEditor
          value={notes}
          onChange={onChange}
          placeholder={placeholder}
          minHeight={minHeight}
          autoFocus
        />
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        "rounded-md px-2 py-1.5 cursor-text transition-colors border border-transparent",
        "hover:border-input hover:bg-muted/30",
        !notes && "text-muted-foreground"
      )}
      style={{ minHeight }}
    >
      {notes ? (
        <HtmlContent html={notes} />
      ) : (
        <span className="text-[13px] text-muted-foreground">{placeholder}</span>
      )}
    </div>
  );
}
