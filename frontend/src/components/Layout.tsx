import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import ThemeToggle from "./ThemeToggle";

const link = ({ isActive }: { isActive: boolean }) =>
  `flex items-center rounded-lg px-3 py-2 text-sm font-medium ${
    isActive ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`;

const soon = ["Playground", "Quizzes", "Projects", "Ask ARSHA"];

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const out = async () => { await logout(); nav("/login"); };

  return (
    <div className="min-h-screen lg:flex">
      <aside className={`${open ? "block" : "hidden"} border-b border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:block lg:w-60 lg:border-b-0 lg:border-r`}>
        <div className="mb-6 text-xl font-bold tracking-tight text-indigo-600">ARSHAB</div>
        <nav className="space-y-1" aria-label="Main">
          <NavLink to="/" end className={link} onClick={() => setOpen(false)}>Dashboard</NavLink>
          <NavLink to="/learn" className={link} onClick={() => setOpen(false)}>Learn</NavLink>
          {soon.map((s) => (
            <div key={s} aria-disabled="true" title="Coming in a later phase"
              className="flex cursor-not-allowed items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-400">
              {s}<span className="rounded bg-slate-100 px-1.5 text-[10px] dark:bg-slate-800">Soon</span>
            </div>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <button className="rounded-lg border px-2 py-1 text-sm dark:border-slate-700 lg:hidden"
            onClick={() => setOpen(!open)} aria-label="Toggle menu">☰</button>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 dark:text-slate-300 sm:inline">{user?.name}</span>
            <ThemeToggle />
            <button onClick={out} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:border-slate-700">Log out</button>
          </div>
        </header>
        <main className="mx-auto max-w-5xl p-4 sm:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
