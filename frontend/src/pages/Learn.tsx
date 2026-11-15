import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, LearningPath } from "../lib/api";
import { Bar } from "./Dashboard";

export default function Learn() {
  const [paths, setPaths] = useState<LearningPath[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<LearningPath[]>("/api/paths").then(setPaths).catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <p role="alert" className="text-red-600">Could not load courses: {error}</p>;
  if (!paths) return <p className="text-sm text-slate-500">Loading…</p>;
  if (paths.length === 0) return <p className="text-sm text-slate-500">No courses have been published yet.</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Learn</h1>
      {paths.map((p) => (
        <section key={p.slug} className="space-y-3">
          <h2 className="text-lg font-semibold">{p.title}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {p.topics.map((t) => {
              const pct = t.lessons_total ? Math.round((100 * t.lessons_done) / t.lessons_total) : 0;
              return (
                <Link to={`/topic/${t.id}`} key={t.id} className={`card block space-y-2 hover:border-indigo-500 ${t.locked ? "opacity-60" : ""}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{t.title}</span>
                    <span className="text-xs text-slate-500">{t.locked ? "🔒 Locked" : `Level ${t.level}`}</span>
                  </div>
                  <Bar percent={pct} label={`${t.title} progress`} />
                  <div className="text-xs text-slate-500">{t.lessons_done}/{t.lessons_total} lessons</div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
