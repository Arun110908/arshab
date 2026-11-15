import { useAuth } from "../auth/AuthContext";
import Layout from "./Layout";

export default function ProtectedRoute() {
  const { user, loading, error } = useAuth();
  if (loading) return <div className="p-8 text-sm text-slate-500">Loading…</div>;
  if (error || !user) {
    return <div role="alert" className="p-8 text-red-600">{error || "Could not start your session."}</div>;
  }
  return <Layout />;
}
