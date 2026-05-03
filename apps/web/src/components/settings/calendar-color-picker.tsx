import * as React from "react";
import { Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Curated palette — 14 colors covering the main hue ranges Google
 * Calendar uses, plus a "Default" reset that clears the override and
 * falls back to whatever the provider returned. Hex values are
 * roughly aligned with Google's "Tomato / Tangerine / Banana / ..."
 * set so users coming from Google Calendar see familiar choices.
 */
const PALETTE: Array<{ label: string; hex: string }> = [
  { label: "Tomato", hex: "#D50000" },
  { label: "Tangerine", hex: "#F4511E" },
  { label: "Banana", hex: "#F6BF26" },
  { label: "Sage", hex: "#33B679" },
  { label: "Basil", hex: "#0B8043" },
  { label: "Peacock", hex: "#039BE5" },
  { label: "Blueberry", hex: "#3F51B5" },
  { label: "Lavender", hex: "#7986CB" },
  { label: "Grape", hex: "#8E24AA" },
  { label: "Flamingo", hex: "#E67C73" },
  { label: "Graphite", hex: "#616161" },
  { label: "Birch", hex: "#A79B8E" },
  { label: "Cobalt", hex: "#1A73E8" },
  { label: "Eucalyptus", hex: "#00897B" },
];

interface CalendarColorPickerProps {
  /** Current color (override or provider). */
  value: string | null;
  /** True while the API call is in flight — disables the trigger. */
  disabled?: boolean;
  onChange: (next: string) => void;
  /** Optional "reset to provider color" — null clears override. */
  onReset?: () => void;
}

/**
 * Compact swatch button + popover palette. Click the swatch to open
 * the picker; click any color to commit and close. Used in the
 * calendar settings row to let users override the color the
 * provider assigned (handy when two calendars happened to share the
 * same color from Google's defaults).
 */
export function CalendarColorPicker({
  value,
  disabled,
  onChange,
  onReset,
}: CalendarColorPickerProps) {
  const [open, setOpen] = React.useState(false);
  const display = value ?? "#6B7280";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label="Change calendar color"
          className={cn(
            "h-3 w-3 rounded-full border border-border/40 transition-shadow hover:ring-2 hover:ring-offset-1 hover:ring-offset-background hover:ring-border",
            disabled && "cursor-not-allowed opacity-50"
          )}
          style={{ backgroundColor: display }}
        />
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-2"
        align="start"
        side="bottom"
        sideOffset={6}
      >
        <div className="grid grid-cols-7 gap-1.5">
          {PALETTE.map((c) => {
            const isCurrent =
              !!value && value.toLowerCase() === c.hex.toLowerCase();
            return (
              <button
                key={c.hex}
                type="button"
                title={c.label}
                onClick={() => {
                  onChange(c.hex);
                  setOpen(false);
                }}
                aria-label={c.label}
                className={cn(
                  "relative h-6 w-6 rounded-full border border-border/40 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background"
                )}
                style={{ backgroundColor: c.hex }}
              >
                {isCurrent && (
                  <Check
                    className="absolute inset-0 m-auto h-3 w-3 text-white drop-shadow"
                    aria-hidden
                  />
                )}
              </button>
            );
          })}
        </div>
        {onReset && (
          <button
            type="button"
            onClick={() => {
              onReset();
              setOpen(false);
            }}
            className="mt-2 w-full rounded px-2 py-1 text-left text-xs text-muted-foreground hover:bg-muted/50"
          >
            Reset to provider color
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
