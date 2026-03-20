// AuthProvider.tsx
import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContextOnly";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // [STATES]
  const [showTokenExpiredModal, setShowTokenExpiredModal] = useState(false);
  const navigate = useNavigate();

  // [HANDLE] Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setShowTokenExpiredModal(false);
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ showTokenExpiredModal, setShowTokenExpiredModal, logout }}>
      {children}

      {/* [UI] Session Expired Modal */}
      {showTokenExpiredModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 text-center space-y-4 shadow-lg">
            <h2 className="text-lg font-bold">Session Expired</h2>
            <p>Your session has expired. Please log in again.</p>
            <button
              onClick={logout}
              className="px-4 py-2 bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-600)] text-white rounded-md font-medium"
            >
              Go to Login
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};