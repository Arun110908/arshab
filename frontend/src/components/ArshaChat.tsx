
import { useEffect, useRef, useState } from "react";
import { post } from "../lib/api";

type Message = { role: "user" | "assistant"; text: string };
type ChatResponse = {
  name: string;
  reply: string;
  interaction_id: string;
};

const HISTORY = "arshab_arsha_history_v1";
const SESSION = "arshab_arsha_interaction_v1";
const welcome: Message = {
  role: "assistant",
  text: "Hi! I'm Arsha, your AI assistant. Ask me anything in English, Tamil, or Tanglish!"
};

export default function ArshaChat() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const [interactionId, setInteractionId] = useState<string | null>(
    () => localStorage.getItem(SESSION)
  );
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY) || "[]");
      return Array.isArray(saved) && saved.length ? saved : [welcome];
    } catch {
      return [welcome];
    }
  });
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(HISTORY, JSON.stringify(messages.slice(-30)));
  }, [messages]);

  useEffect(() => {
    if (interactionId) localStorage.setItem(SESSION, interactionId);
    else localStorage.removeItem(SESSION);
  }, [interactionId]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, busy]);

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const message = draft.trim();
    if (!message || busy) return;

    setDraft("");
    setMessages(prev => [...prev, { role: "user", text: message }]);
    setBusy(true);

    try {
      const result = await post<ChatResponse>("/api/chat", {
        message,
        interaction_id: interactionId
      });
      setInteractionId(result.interaction_id || null);
      setMessages(prev => [...prev, {
        role: "assistant",
        text: result.reply
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: "assistant",
        text: error instanceof Error
          ? error.message
          : "Connection error. Please try again."
      }]);
    } finally {
      setBusy(false);
    }
  }

  function clearChat() {
    setMessages([welcome]);
    setInteractionId(null);
    localStorage.removeItem(HISTORY);
    localStorage.removeItem(SESSION);
  }

  return (
    <div className="fixed bottom-5 right-5 z-[100]">
      {open && (
        <section className="mb-3 flex h-[min(620px,75vh)] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <header className="flex items-center justify-between bg-indigo-600 px-4 py-3 text-white">
            <div>
              <div className="font-semibold">Arsha</div>
              <div className="text-xs text-indigo-100">Your All-Purpose AI Assistant</div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={clearChat}
                className="rounded-lg px-2 py-1 text-xs hover:bg-indigo-500">
                Clear
              </button>
              <button type="button" onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-1 hover:bg-indigo-500"
                aria-label="Close chat">✕</button>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-3" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {busy && <div className="text-xs text-slate-500">Arsha is thinking...</div>}
            <div ref={bottom} />
          </div>

          <form onSubmit={send}
            className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-700">
            <input value={draft} onChange={e => setDraft(e.target.value)}
              maxLength={4000} placeholder="Ask Arsha anything..."
              aria-label="Message Arsha"
              className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <button type="submit" disabled={busy || !draft.trim()}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              Send
            </button>
          </form>
        </section>
      )}

      <button type="button" onClick={() => setOpen(v => !v)}
        className="ml-auto flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-3 font-semibold text-white shadow-lg hover:bg-indigo-700"
        aria-expanded={open}>
        <span aria-hidden="true">✦</span>
        {open ? "Close Arsha" : "Ask Arsha"}
      </button>
    </div>
  );
}
