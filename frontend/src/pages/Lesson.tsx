import { ReactNode, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, LessonDetail, post } from "../lib/api";

function Code({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-sm text-slate-100"><code>{code}</code></pre>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card space-y-3">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function Lesson() {
  const { id } = useParams();
  const nav = useNavigate();
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    setLesson(null);
    setError("");
    startedAt.current = Date.now();
    api<LessonDetail>(`/api/lessons/${id}`).then(setLesson).catch((e: Error) => setError(e.message));
  }, [id]);

  if (error) return <p role="alert" className="text-red-600">{error}</p>;
  if (!lesson) return <p className="text-sm text-slate-500">Loading…</p>;
  const c = lesson.content;

  const complete = async () => {
    setBusy(true);
    try {
      const seconds = Math.min(Math.round((Date.now() - startedAt.current) / 1000), 6 * 3600);
      await post(`/api/lessons/${lesson.id}/complete`, { seconds_spent: seconds });
      nav(lesson.next_lesson_id ? `/lesson/${lesson.next_lesson_id}` : `/topic/${lesson.topic_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save progress");
    } finally { setBusy(false); }
  };

  return (
    <article className="space-y-5">
      <Link to={`/topic/${lesson.topic_id}`} className="text-sm text-indigo-600">← {lesson.topic_title}</Link>
      <h1 className="text-2xl font-bold">{lesson.title}</h1>

      <Section title="Explanation"><p className="leading-relaxed">{c.explanation}</p></Section>
      <Section title="Syntax"><Code code={c.syntax} /></Section>

      <Section title="Examples">
        {c.examples.map((e) => (
          <div key={e.title} className="space-y-1">
            <div className="text-sm font-medium">{e.title}</div>
            <Code code={e.code} />
            <div className="text-xs text-slate-500">Output: <code className="font-mono">{e.output}</code></div>
          </div>
        ))}
      </Section>

      <Section title="Practice exercises">
        <ol className="list-decimal space-y-2 pl-5">
          {c.exercises.map((x) => (
            <li key={x.prompt}>
              {x.prompt}
              <details className="text-sm text-slate-500"><summary className="cursor-pointer">Hint</summary>{x.hint}</details>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Common mistakes">
        <ul className="list-disc space-y-1 pl-5">{c.common_mistakes.map((m) => <li key={m}>{m}</li>)}</ul>
      </Section>

      <Section title="Interview questions">
        {c.interview_questions.map((q) => (
          <details key={q.q}><summary className="cursor-pointer font-medium">{q.q}</summary>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{q.a}</p></details>
        ))}
      </Section>

      <Section title="Real-world use"><p>{c.real_world}</p></Section>

      <button className="btn" onClick={complete} disabled={busy}>
        {lesson.completed ? "Next" : busy ? "Saving…" : "Mark complete & continue"}
      </button>
    </article>
  );
}
