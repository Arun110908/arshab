import { useEffect, useState } from "react";
import { api, DashboardSummary } from "../lib/api";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

export function Bar({ percent, label }: { percent: number; label: string }) {
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}
      className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
      <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${percent}%` }} />
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<DashboardSummary>("/api/dashboard/summary").then(setData).catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <p role="alert" className="text-red-600">Could not load dashboard: {error}</p>;
  if (!data) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Overall progress" value={`${data.overall_percent}%`} />
        <Stat label="Lessons completed" value={`${data.lessons_completed} / ${data.lessons_total}`} />
        <Stat label="Learning streak" value={`${data.streak_days} day${data.streak_days === 1 ? "" : "s"}`} />
        <Stat label="Time spent" value={`${data.minutes_spent} min`} />
      </div>
      <section className="card space-y-4">
        <h2 className="font-semibold">Progress by path</h2>
        {data.paths.length === 0 && <p className="text-sm text-slate-500">No learning paths have been added yet.</p>}
        {data.paths.map((p) => (
          <div key={p.slug} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="capitalize">{p.slug}</span><span>{p.completed}/{p.total} · {p.percent}%</span>
            </div>
            <Bar percent={p.percent} label={`${p.slug} progress`} />
          </div>
        ))}
      </section>
    </div>
  );
}
