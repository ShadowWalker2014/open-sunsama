import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Button, Input } from "@/components/ui";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const TIMEZONES = Array.from(
  new Set(["UTC", ...Intl.supportedValuesOf("timeZone")])
);

interface TimezoneSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
}

export function TimezoneSelector({
  value,
  onChange,
  disabled = false,
  id = "timezone",
}: TimezoneSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const searchRef = React.useRef<HTMLInputElement>(null);
  const filteredTimezones = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return TIMEZONES;
    return TIMEZONES.filter((timezone) =>
      timezone.toLowerCase().includes(normalizedQuery)
    );
  }, [query]);

  React.useEffect(() => {
    if (open) searchRef.current?.focus();
    else setQuery("");
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-controls="timezone-options"
          aria-label="Timezone"
          disabled={disabled}
          className="h-10 w-full justify-between px-3 font-normal"
        >
          <span className="truncate">{value || "Select a timezone"}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) min-w-72 p-2"
        align="start"
      >
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search timezones..."
            role="combobox"
            aria-controls="timezone-options"
            aria-expanded={open}
            aria-label="Search timezones"
            className="h-9 pl-9"
          />
        </div>
        <div
          id="timezone-options"
          role="listbox"
          aria-label="Timezones"
          className="mt-2 max-h-64 overflow-y-auto"
        >
          {filteredTimezones.length > 0 ? (
            filteredTimezones.map((timezone) => (
              <button
                key={timezone}
                type="button"
                role="option"
                aria-selected={timezone === value}
                onClick={() => {
                  onChange(timezone);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm outline-hidden hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                  timezone === value && "bg-accent/50"
                )}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    timezone === value ? "opacity-100" : "opacity-0"
                  )}
                />
                {timezone}
              </button>
            ))
          ) : (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">
              No timezone found.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
