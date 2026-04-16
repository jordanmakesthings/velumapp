// ---------------------------------------------------------------------------
// Local persistence for session logs + daily check-ins
// ---------------------------------------------------------------------------

export interface VelumSessionLog {
  id: string;
  tool: "tapping" | "bilateral" | "breathwork" | "somatic-touch";
  suds_before?: number;
  suds_after?: number;
  duration_seconds?: number;
  category?: string;
  issue?: string;
  positive_cognition?: string;
  created_at: string;
}

export interface VelumCheckin {
  id: string;
  date: string; // YYYY-MM-DD
  activation_level: number;
  sensations: string[];
  tool_recommended?: string;
  created_at: string;
}

function uuid() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

// --- Session logs ---

export function getSessionLogs(): VelumSessionLog[] {
  try { return JSON.parse(localStorage.getItem("velum_session_logs") || "[]"); }
  catch { return []; }
}

export function logSession(entry: Omit<VelumSessionLog, "id" | "created_at">): void {
  const logs = getSessionLogs();
  logs.push({ ...entry, id: uuid(), created_at: new Date().toISOString() });
  localStorage.setItem("velum_session_logs", JSON.stringify(logs));
}

// --- Daily check-ins ---

export function getCheckins(): VelumCheckin[] {
  try { return JSON.parse(localStorage.getItem("velum_checkins") || "[]"); }
  catch { return []; }
}

export function saveCheckin(entry: Omit<VelumCheckin, "id" | "created_at">): VelumCheckin {
  const checkins = getCheckins();
  const newEntry: VelumCheckin = { ...entry, id: uuid(), created_at: new Date().toISOString() };
  checkins.push(newEntry);
  localStorage.setItem("velum_checkins", JSON.stringify(checkins));
  return newEntry;
}

export function getTodayCheckin(): VelumCheckin | null {
  const today = new Date().toISOString().split("T")[0];
  return getCheckins().find((c) => c.date === today) ?? null;
}

// --- Stats helpers ---

export function getSUDSStats() {
  const logs = getSessionLogs().filter(
    (l) => l.suds_before != null && l.suds_after != null
  );
  if (logs.length === 0) return null;
  const avgReduction =
    logs.reduce((s, l) => s + ((l.suds_before ?? 0) - (l.suds_after ?? 0)), 0) / logs.length;
  const toolCounts: Record<string, number> = {};
  logs.forEach((l) => { toolCounts[l.tool] = (toolCounts[l.tool] || 0) + 1; });
  const bestTool = Object.entries(toolCounts).sort(([, a], [, b]) => b - a)[0]?.[0];
  return { count: logs.length, avgReduction: Math.round(avgReduction * 10) / 10, bestTool };
}
