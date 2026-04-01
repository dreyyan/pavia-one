import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth";

interface PrivateRouteProps {
  role?: "admin" | "adviser";
}

const PrivateRoute = ({ role }: PrivateRouteProps) => {
  const { user, loading } = useAuth();

  console.log("PrivateRoute render:", { user, loading, role });

  if (loading) return null;
  if (!user) return <Navigate to="/login/admin" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;

  return <Outlet />;
};

export default PrivateRoute;