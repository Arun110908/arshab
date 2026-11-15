const BASE = import.meta.env.VITE_API_URL ?? "";

let accessToken: string | null = null;
export const setAccessToken = (t: string | null) => { accessToken = t; };

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function raw(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  return fetch(`${BASE}${path}`, { ...init, headers, credentials: "include" });
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

export interface User { id: number; email: string; name: string; role: string; }
export interface TokenOut { access_token: string; user: User; }

export async function tryRefresh(): Promise<TokenOut | null> {
  const res = await raw("/api/auth/refresh", { method: "POST" });
  if (!res.ok) return null;
  const data: TokenOut = await res.json();
  accessToken = data.access_token;
  return data;
}

/** Authenticated request; on 401 it refreshes the session once and retries. */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res = await raw(path, init);
  if (res.status === 401 && !path.startsWith("/api/auth/")) {
    try { await ensureSession(); res = await raw(path, init); } catch { /* keep the 401 */ }
  }
  return parse<T>(res);
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

export async function createGuest(): Promise<TokenOut> {
  const data = await parse<TokenOut>(await raw("/api/auth/guest", { method: "POST" }));
  accessToken = data.access_token;
  return data;
}

let pendingSession: Promise<TokenOut> | null = null;

/** Restore the saved session, or silently start a new guest session. */
export function ensureSession(): Promise<TokenOut> {
  if (!pendingSession) {
    pendingSession = (async () => (await tryRefresh()) ?? (await createGuest()))().finally(() => {
      pendingSession = null;
    });
  }
  return pendingSession;
}
