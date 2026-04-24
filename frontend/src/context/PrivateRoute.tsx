import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";

interface PrivateRouteProps {
  role?: "admin" | "adviser";
}

const PrivateRoute = ({ role }: PrivateRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        if (role === "adviser") navigate("/login/adviser", { replace: true });
        else navigate("/login/admin", { replace: true });
      }
      else if (role && user.role !== role) navigate("/", { replace: true });
    }
  }, [loading, user, role, navigate]);

  console.log("PrivateRoute render:", { user, loading, role });

  if (loading || !user || (role && user.role !== role)) {
    return <div>Loading...</div>; // Show spinner or blank while redirecting
  }

  return <Outlet />;
};

export default PrivateRoute;