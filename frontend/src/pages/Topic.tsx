import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, TopicDetail } from "../lib/api";

export default function Topic() {
  const { id } = useParams();
  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setTopic(null);
    api<TopicDetail>(`/api/topics/${id}`).then(setTopic).catch((e: Error) => setError(e.message));
  }, [id]);

  if (error) return <p role="alert" className="text-red-600">{error}</p>;
  if (!topic) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="space-y-4">
      <Link to="/learn" className="text-sm text-indigo-600">← All courses</Link>
      <h1 className="text-2xl font-bold">{topic.title}</h1>
      {topic.locked && (
        <p className="card text-sm">🔒 Finish these first: <b>{topic.requires.join(", ")}</b></p>
      )}
      <ol className="space-y-2">
        {topic.lessons.map((l, i) => (
          <li key={l.id}>
            {topic.locked ? (
              <div className="card opacity-60">{i + 1}. {l.title}</div>
            ) : (
              <Link to={`/lesson/${l.id}`} className="card flex items-center justify-between hover:border-indigo-500">
                <span>{i + 1}. {l.title}</span>
                <span className="text-xs text-slate-500">{l.completed ? "✓ Done" : "Start"}</span>
              </Link>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
