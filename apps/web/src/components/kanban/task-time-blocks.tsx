import { format } from "date-fns";
import { Clock } from "lucide-react";
import type { TimeBlock } from "@chronoflow/types";
import { formatDuration } from "@/lib/utils";
import { Label, Badge } from "@/components/ui";

interface TimeBlockItemProps {
  timeBlock: TimeBlock;
}

export function TimeBlockItem({ timeBlock }: TimeBlockItemProps) {
  const startTime = new Date(timeBlock.startTime);
  const endTime = new Date(timeBlock.endTime);
  const durationMins = Math.round(
    (endTime.getTime() - startTime.getTime()) / 60000
  );

  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
      <div>
        <p className="text-sm font-medium">
          {format(startTime, "EEE, MMM d")}
        </p>
        <p className="text-xs text-muted-foreground">
          {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
        </p>
      </div>
      <Badge variant="secondary">{formatDuration(durationMins)}</Badge>
    </div>
  );
}

interface TimeBlocksListProps {
  timeBlocks: TimeBlock[] | undefined;
}

export function TimeBlocksList({ timeBlocks }: TimeBlocksListProps) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-muted-foreground">
        <Clock className="h-4 w-4" />
        Time Blocks
      </Label>
      {timeBlocks && timeBlocks.length > 0 ? (
        <div className="space-y-2">
          {timeBlocks.map((block) => (
            <TimeBlockItem key={block.id} timeBlock={block} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No time blocks scheduled for this task.
        </p>
      )}
    </div>
  );
}
