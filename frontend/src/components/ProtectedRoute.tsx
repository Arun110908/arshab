import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Layout from "./Layout";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-sm text-slate-500">Loading…</div>;
  return user ? <Layout /> : <Navigate to="/login" replace />;
}
