import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function NervousSystemScore() {
  const { user } = useAuth();

  const { data: progress = [] } = useQuery({
    queryKey: ["stressProgress7d", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const dateStr = sevenDaysAgo.toISOString().split("T")[0];
      const { data } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("completed", true)
        .gte("completed_date", dateStr)
        .order("completed_date");
      return data || [];
    },
    enabled: !!user,
  });

  const stressSessions = useMemo(
    () => progress.filter((p: any) => p.stress_before != null && p.stress_after != null),
    [progress]
  );

  const avgBefore = useMemo(() => {
    if (stressSessions.length === 0) return null;
    return Math.round(stressSessions.reduce((s: number, p: any) => s + p.stress_before, 0) / stressSessions.length * 10) / 10;
  }, [stressSessions]);

  const avgAfter = useMemo(() => {
    if (stressSessions.length === 0) return null;
    return Math.round(stressSessions.reduce((s: number, p: any) => s + p.stress_after, 0) / stressSessions.length * 10) / 10;
  }, [stressSessions]);

  const avgRelief = useMemo(() => {
    if (avgBefore == null || avgAfter == null) return null;
    return Math.round((avgAfter - avgBefore) * 10) / 10;
  }, [avgBefore, avgAfter]);

  const weeklyReductionPct = useMemo(() => {
    if (stressSessions.length === 0 || avgBefore === null || avgBefore === 0) return null;
    return Math.round(((avgBefore! - avgAfter!) / avgBefore!) * 100);
  }, [stressSessions, avgBefore, avgAfter]);

  // Build 7-day chart data (Sun-Sat of current week)
  const chartData = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    return DAY_LABELS.map((label, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const daySessions = stressSessions.filter((p: any) => p.completed_date === dateStr);
      const before = daySessions.length > 0
        ? Math.round(daySessions.reduce((s: number, p: any) => s + p.stress_before, 0) / daySessions.length * 10) / 10
        : null;
      const after = daySessions.length > 0
        ? Math.round(daySessions.reduce((s: number, p: any) => s + p.stress_after, 0) / daySessions.length * 10) / 10
        : null;
      return { day: label, before, after };
    });
  }, [stressSessions]);

  if (stressSessions.length === 0) return null;

  return (
    <div className="mb-8">
      {/* This Week headline */}
      <div className="rounded-xl p-5 mb-3" style={{ background: "hsl(156 51% 12%)" }}>
        <p className="text-[10px] tracking-[3px] uppercase mb-2" style={{ color: "hsl(42 53% 54%)", fontFamily: "var(--font-sans)" }}>
          THIS WEEK
        </p>
        <p className="text-lg leading-snug" style={{ fontFamily: "var(--font-serif)", color: "hsl(40 24% 93%)" }}>
          You reduced stress by{" "}
          <span style={{ color: "hsl(42 53% 54%)" }}>{weeklyReductionPct ?? 0}%</span>{" "}
          in the last 7 days.
        </p>
      </div>

      {/* Section label */}
      <p className="text-[10px] tracking-[3px] uppercase mb-3" style={{ color: "hsl(156 13% 49%)", fontFamily: "var(--font-sans)" }}>
        NERVOUS SYSTEM SCORE
      </p>

      {/* Three stat cards */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="rounded-xl p-4 text-center" style={{ background: "hsl(156 51% 12%)" }}>
          <p className="text-2xl mb-1" style={{ fontFamily: "var(--font-serif)", color: "hsl(40 24% 93%)" }}>
            {avgBefore ?? "—"}
          </p>
          <p className="text-[10px] tracking-wider uppercase" style={{ color: "hsl(156 13% 49%)", fontFamily: "var(--font-sans)" }}>
            Avg stress in
          </p>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ background: "hsl(156 51% 12%)" }}>
          <p className="text-2xl mb-1" style={{ fontFamily: "var(--font-serif)", color: "hsl(156 13% 49%)" }}>
            {avgAfter ?? "—"}
          </p>
          <p className="text-[10px] tracking-wider uppercase" style={{ color: "hsl(156 13% 49%)", fontFamily: "var(--font-sans)" }}>
            Avg stress out
          </p>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ background: "hsl(156 51% 12%)" }}>
          <p className="text-2xl mb-1" style={{ fontFamily: "var(--font-serif)", color: "hsl(42 53% 54%)" }}>
            {avgRelief ?? "—"}
          </p>
          <p className="text-[10px] tracking-wider uppercase" style={{ color: "hsl(156 13% 49%)", fontFamily: "var(--font-sans)" }}>
            Avg relief
          </p>
        </div>
      </div>

      {/* 7-Day chart */}
      <div className="rounded-xl p-5" style={{ background: "hsl(156 51% 12%)" }}>
        <p className="text-[10px] tracking-[3px] uppercase mb-4" style={{ color: "hsl(156 13% 49%)", fontFamily: "var(--font-sans)" }}>
          7-DAY CALM SCORE
        </p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(156,13%,49%)" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: "hsl(156,13%,49%)" }} axisLine={false} tickLine={false} width={20} />
              <Tooltip
                contentStyle={{
                  background: "hsl(156,51%,12%)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  borderRadius: "10px",
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="before"
                stroke="hsl(156,13%,49%)"
                strokeWidth={1.5}
                strokeDasharray="5 3"
                dot={{ r: 3 }}
                name="Before session"
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="after"
                stroke="hsl(42,53%,54%)"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="After session"
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-6 mt-3">
          <div className="flex items-center gap-2">
            <div className="w-6 border-t border-dashed" style={{ borderColor: "hsl(156,13%,49%)" }} />
            <span className="text-[10px]" style={{ color: "hsl(156,13%,49%)", fontFamily: "var(--font-sans)" }}>Before session</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 border-t-2" style={{ borderColor: "hsl(42,53%,54%)" }} />
            <span className="text-[10px]" style={{ color: "hsl(156,13%,49%)", fontFamily: "var(--font-sans)" }}>After session</span>
          </div>
        </div>
      </div>
    </div>
  );
}
