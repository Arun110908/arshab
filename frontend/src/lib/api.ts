const BASE = import.meta.env.VITE_API_URL ?? "";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = await res.json();
      msg = typeof body.detail === "string" ? body.detail : "Please check your input";
    } catch { /* non-JSON error body */ }
    throw new ApiError(res.status, msg);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  return parse<T>(await fetch(`${BASE}${path}`, { ...init, headers }));
}

export const post = <T>(path: string, body?: unknown) =>
  api<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

export interface PathTopic { id: number; title: string; level: number; locked: boolean; lessons_total: number; lessons_done: number; }
export interface LearningPath { slug: string; title: string; topics: PathTopic[]; }
export interface DashboardSummary {
  lessons_completed: number; lessons_total: number; overall_percent: number;
  paths: { slug: string; total: number; completed: number; percent: number }[];
  streak_days: number; minutes_spent: number;
}
export interface TopicDetail {
  id: number; title: string; level: number; path: string; locked: boolean; requires: string[];
  lessons: { id: number; title: string; completed: boolean }[];
}
export interface LessonContent {
  language: string; explanation: string; syntax: string;
  examples: { title: string; code: string; output: string }[];
  exercises: { prompt: string; hint: string }[];
  common_mistakes: string[];
  interview_questions: { q: string; a: string }[];
  real_world: string;
}
export interface LessonDetail {
  id: number; title: string; topic_id: number; topic_title: string; completed: boolean;
  next_lesson_id: number | null; content: LessonContent;
}
