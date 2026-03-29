// [IMPORT] Hooks
import React from "react";
import { useState, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContextOnly";

// [IMPORT] Components
import Modal from "../components/Modal";

// ? [TYPES & INTERFACES]
type UserRole = "admin" | "adviser";
interface User {
  id: number;
  name: string;
  role: UserRole;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // * [STATES]
  const [showTokenExpiredModal, setShowTokenExpiredModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // * [EFFECT] Sync user state with localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role") as UserRole | null;

    // sync user if token exists
    if (token && role) {
      const id = setTimeout(() => setUser({ id: 0, name: "Unknown", role }), 0);
      return () => clearTimeout(id);
    }

    // show expired modal if token missing
    if (!token && role) {
      const id = setTimeout(() => setShowTokenExpiredModal(true), 0);
      return () => clearTimeout(id);
    }
  }, []);

  // * [HANDLE] Logout
  const logout = () => {
    const role = localStorage.getItem("role");

    localStorage.removeItem("token");
    localStorage.removeItem("role");

    setUser(null);
    setShowTokenExpiredModal(false);

    navigate(`/login/${role?.toLowerCase() || "admin"}`);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        showTokenExpiredModal,
        setShowTokenExpiredModal,
        logout,
      }}
    >
      {children}

      {/* [UI] Session Expired Modal */}
      <Modal
        isOpen={showTokenExpiredModal}
        onClose={() => {}}
        title="Session Expired"
        message="Your session has expired. Please log in again."
        confirmText="Go to Login"
        type="error"
        isCancelable={false}
        closeOnBackdrop={false}
        onConfirm={logout}
      />
    </AuthContext.Provider>
  );
};