import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { ensureSession, User } from "../lib/api";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // No login screen: restore the saved session or start a guest session automatically.
  useEffect(() => {
    ensureSession()
      .then((d) => setUser(d.user))
      .catch(() => setError("Could not reach the server. Please wait a minute and refresh."))
      .finally(() => setLoading(false));
  }, []);

  return <Ctx.Provider value={{ user, loading, error }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
