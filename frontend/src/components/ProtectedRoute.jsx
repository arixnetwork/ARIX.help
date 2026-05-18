import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]" data-testid="auth-loading">
        <div className="font-mono text-xs tracking-mono text-zinc-500">LOADING…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
