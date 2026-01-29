import { cn } from "@/lib/utils";
import { Label } from "@/components/ui";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { HtmlContent } from "@/components/ui/html-content";

interface DescriptionFieldProps {
  description: string;
  isEditing: boolean;
  onEditingChange: (editing: boolean) => void;
  onChange: (value: string) => void;
  onBlur: () => void;
}

/**
 * Description/Notes field with label for task forms.
 * @deprecated Use NotesField instead for new implementations.
 */
export function DescriptionField({
  description,
  isEditing,
  onEditingChange,
  onChange,
  onBlur,
}: DescriptionFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        Notes
      </Label>
      {isEditing ? (
        <div onBlur={onBlur}>
          <RichTextEditor
            value={description}
            onChange={onChange}
            placeholder="Notes..."
            minHeight="100px"
          />
        </div>
      ) : (
        <div
          onClick={() => onEditingChange(true)}
          className={cn(
            "min-h-[60px] rounded-md border border-transparent px-3 py-2 cursor-text transition-colors",
            "hover:border-input hover:bg-muted/30",
            !description && "text-muted-foreground"
          )}
        >
          {description ? (
            <HtmlContent html={description} />
          ) : (
            <span className="text-sm">Notes...</span>
          )}
        </div>
      )}
    </div>
  );
}
