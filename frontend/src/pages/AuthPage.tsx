import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import ThemeToggle from "../components/ThemeToggle";

export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { user, login, register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isLogin = mode === "login";

  if (user) return <Navigate to="/" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isLogin && password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setBusy(true);
    try {
      if (isLogin) await login(email, password); else await register(name, email, password);
      nav("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4" aria-label={isLogin ? "Log in" : "Sign up"}>
        <div>
          <h1 className="text-2xl font-bold text-indigo-600">ARSHAB</h1>
          <p className="text-sm text-slate-500">From zero to master with AI</p>
        </div>
        {!isLogin && (
          <label className="block text-sm">Name
            <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
          </label>
        )}
        <label className="block text-sm">Email
          <input className="input mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label className="block text-sm">Password
          <input className="input mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
            autoComplete={isLogin ? "current-password" : "new-password"} />
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button className="btn w-full" disabled={busy}>{busy ? "Please wait…" : isLogin ? "Log in" : "Create account"}</button>
        <p className="text-center text-sm text-slate-500">
          {isLogin ? <>New here? <Link className="text-indigo-600" to="/register">Create an account</Link></>
            : <>Have an account? <Link className="text-indigo-600" to="/login">Log in</Link></>}
        </p>
      </form>
    </div>
  );
}
