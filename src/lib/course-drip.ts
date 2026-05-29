// Course drip day calculator.
//
// Rule: new lessons unlock at 3am Pacific Time every day. So Day N is "the
// number of 3am-PT rollovers that have passed since enrollment, plus 1."
//
// Example: a user who enrolls at 9pm Monday PT lands on Day 1. At 3am Tuesday
// PT (6 hours later) Day 2 unlocks. At 3am Wednesday PT Day 3 unlocks. And so on.
//
// This matches user mental model ("I wake up to today's lesson") and gives
// every user globally the SAME unlock moment — which keeps the email send
// time (3am PT in Loops) lined up with the in-app drop.
//
// Handles DST automatically by reading the local hour in the America/Los_Angeles
// IANA timezone via Intl.DateTimeFormat. No date-fns-tz needed.

const UNLOCK_HOUR_PT = 3;
const TZ = "America/Los_Angeles";

/**
 * Returns the "anchor day" (an integer like a Julian day number) for a
 * given moment, where the day boundary is 3am Pacific Time. Anything before
 * 3am PT counts as the previous day.
 *
 * Two moments on the same "anchor day" return the same number; consecutive
 * anchor days differ by 1. Subtraction gives the number of 3am-PT
 * boundaries between them.
 */
function anchorDayPT(d: Date): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parseInt(parts.find(p => p.type === t)?.value ?? "0");
  const Y = get("year");
  const M = get("month");
  const D = get("day");
  const H = get("hour");
  // The 24-hour clock in en-CA returns "00".."23"; before 3am means we're
  // still on the previous anchor day.
  const dayMs = Date.UTC(Y, M - 1, D);
  return Math.floor(dayMs / 86400000) - (H < UNLOCK_HOUR_PT ? 1 : 0);
}

/**
 * How many drip days a user is into a course, given their enrollment time.
 * Day 1 = enrollment day. Day 2 = first lesson available after the next 3am PT.
 * Always >= 1 (an enrollment in the future would still report 1).
 */
export function currentDripDay(enrolledAt: Date | string, now: Date = new Date()): number {
  const enrolled = typeof enrolledAt === "string" ? new Date(enrolledAt) : enrolledAt;
  const diff = anchorDayPT(now) - anchorDayPT(enrolled);
  return Math.max(1, diff + 1);
}

/**
 * Computes the moment a given drip day unlocks for a user — useful for
 * "Unlocks in N hours" countdowns or scheduling push notifications.
 */
export function dripDayUnlocksAt(enrolledAt: Date | string, dayIndex: number): Date {
  const enrolled = typeof enrolledAt === "string" ? new Date(enrolledAt) : enrolledAt;
  // Day 1 unlocks at enrollment. Day N (N>=2) unlocks at 3am PT on the
  // (enrollment-anchor-day + (N-1))th day.
  if (dayIndex <= 1) return enrolled;
  const targetAnchor = anchorDayPT(enrolled) + (dayIndex - 1);
  // anchorDay is days-since-epoch in UTC; reconstruct the 3am-PT moment.
  // 3am PT = 10am UTC during PST (UTC-7 in DST: 3am PT = 11am UTC; the Date
  // ctor below produces a UTC time, but we want "3am at this location" which
  // requires going through the formatted local time. Simplest cross-DST safe
  // method: format the target date as Y/M/D and ask Date to parse it with
  // the IANA tz via a known offset trick.
  const utcMs = targetAnchor * 86400000;
  const utcMidnight = new Date(utcMs);
  // 3am PT could be 10am or 11am UTC depending on DST; figure out which by
  // checking what the offset is on that date.
  const probe = new Date(utcMs + 11 * 3600 * 1000); // 11am UTC
  const offsetParts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, hour: "2-digit", hour12: false,
  }).formatToParts(probe);
  const probeHour = parseInt(offsetParts.find(p => p.type === "hour")?.value ?? "0");
  // probeHour is the local hour at 11am UTC; e.g., 3 in DST (PDT UTC-8 makes
  // 11am UTC = 3am PT) or 4 in standard (PST UTC-7 wait that's wrong direction)
  // Let's just bake it: if probeHour === UNLOCK_HOUR_PT then 11am UTC is 3am PT
  // (PDT). Otherwise add an hour offset to land on 3am PT (PST).
  const utcHour = probeHour === UNLOCK_HOUR_PT ? 11 : 10;
  return new Date(utcMs + utcHour * 3600 * 1000);
  // utcMidnight is unused but kept above for clarity.
  void utcMidnight;
}
