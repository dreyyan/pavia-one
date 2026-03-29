import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth";

// ? [INTERFACES]
interface PrivateRouteProps {
  role?: "admin" | "adviser";
}

const PrivateRoute = ({ role }: PrivateRouteProps) => {
  const { user, setShowTokenExpiredModal } = useAuth();
  const token = localStorage.getItem("token");

  // ! [ERROR] No token
  if (!token) {
    setShowTokenExpiredModal(true);
    return <Navigate to="/login/admin" replace />;
  }

  // ! [ERROR] No users
  if (!user) {
    return <Navigate to="/login/admin" replace />;
  }

  // ! [ERROR] Role mismatch
  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  // Allow access to nested routes
  return <Outlet />;
};

export default PrivateRoute;