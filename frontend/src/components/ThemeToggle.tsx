import { useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch { /* storage blocked */ }
    setDark(next);
  };
  return (
    <button onClick={toggle} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:border-slate-700"
      aria-label="Toggle dark mode">
      {dark ? "☀ Light" : "☾ Dark"}
    </button>
  );
}
