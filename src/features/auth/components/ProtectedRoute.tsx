import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export function EmployeeRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "employee") return <Navigate to="/admin" replace />;
  return <Outlet />;
}
