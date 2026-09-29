/** The longest duration a task can plan or log: one full day. */
export const MAX_DURATION_MINS = 24 * 60;

/**
 * Reads a typed duration into minutes: "45", "45m" or "45 min" (minutes),
 * "1:15" (hours:minutes), "1.5h", "2h", "1h30", "1h 30m" or a bare decimal
 * like "1.5" (hours). Returns null for anything else, for zero, for minutes
 * past 59 in "h:mm", and for more than a day.
 */
export function parseDuration(input: string): number | null {
  const s = input.trim().toLowerCase().replace(/\s+/g, "");
  if (!s) return null;
  let mins: number | null = null;
  let m: RegExpMatchArray | null;
  if ((m = s.match(/^(\d{1,2}):(\d{2})$/))) {
    if (Number(m[2]) > 59) return null;
    mins = Number(m[1]) * 60 + Number(m[2]);
  } else if (
    (m = s.match(/^(\d+(?:\.\d+)?)(?:h|hr|hrs|hour|hours)(?:(\d+)(?:m|min|mins)?)?$/))
  ) {
    if (m[2] !== undefined && Number(m[2]) > 59) return null;
    mins = Math.round(Number(m[1]) * 60) + Number(m[2] ?? 0);
  } else if ((m = s.match(/^(\d+)(?:m|min|mins|minutes?)?$/))) {
    mins = Number(m[1]);
  } else if ((m = s.match(/^(\d*\.\d+)$/))) {
    mins = Math.round(Number(m[1]) * 60);
  }
  if (mins === null || mins <= 0 || mins > MAX_DURATION_MINS) return null;
  return mins;
}

/** "0", "00", "0:00" and friends: an explicit request to clear the time. */
export function isZeroDuration(input: string): boolean {
  return /^\s*0+(?::0{1,2})?\s*$/.test(input);
}

/** 90 → "1 hr 30 min", 45 → "45 min", 120 → "2 hr". */
export function describeDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (!h) return `${m} min`;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}
