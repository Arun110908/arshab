import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { post, setAccessToken, tryRefresh, TokenOut, User } from "../lib/api";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore the session from the httpOnly refresh cookie on page load.
  useEffect(() => {
    tryRefresh()
      .then((d) => setUser(d?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const apply = (d: TokenOut) => { setAccessToken(d.access_token); setUser(d.user); };

  const login = useCallback(async (email: string, password: string) => {
    apply(await post<TokenOut>("/api/auth/login", { email, password }));
  }, []);
  const register = useCallback(async (name: string, email: string, password: string) => {
    apply(await post<TokenOut>("/api/auth/register", { name, email, password }));
  }, []);
  const logout = useCallback(async () => {
    try { await post("/api/auth/logout"); } finally { setAccessToken(null); setUser(null); }
  }, []);

  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
