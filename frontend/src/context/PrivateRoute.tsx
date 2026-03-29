import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth";

interface PrivateRouteProps {
  role?: "admin" | "adviser";
}

const PrivateRoute = ({ role }: PrivateRouteProps) => {
  const { user, setShowTokenExpiredModal } = useAuth();
  const token = localStorage.getItem("token");

  if (!token || !user) {
    setShowTokenExpiredModal(true);
    return <Navigate to="/login/admin" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;