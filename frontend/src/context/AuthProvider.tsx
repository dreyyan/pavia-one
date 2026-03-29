import React, { useState, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContextOnly";
import Modal from "../components/Modal";

type UserRole = "admin" | "adviser";

interface User {
  id: number;
  name: string;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  showTokenExpiredModal: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    showTokenExpiredModal: false,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const roleRaw = localStorage.getItem("role");
    const role: UserRole | null =
      roleRaw === "admin" || roleRaw === "adviser" ? (roleRaw as UserRole) : null;

    if (token && role) {
      // ✅ Single setState call — no cascading renders, no race condition
      setAuthState({
        user: { id: 0, name: "Unknown", role },
        loading: false,
        showTokenExpiredModal: false,
      });
    } else if (!token && role) {
      setAuthState({
        user: null,
        loading: false,
        showTokenExpiredModal: true,
      });
    } else {
      setAuthState({
        user: null,
        loading: false,
        showTokenExpiredModal: false,
      });
    }
  }, []);

  const logout = () => {
    const role = localStorage.getItem("role");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setAuthState({ user: null, loading: false, showTokenExpiredModal: false });
    navigate(`/login/${role?.toLowerCase() || "admin"}`);
  };

  const setUser = (user: User | null) =>
    setAuthState((prev) => ({ ...prev, user }));

  const setShowTokenExpiredModal = (showTokenExpiredModal: boolean) =>
    setAuthState((prev) => ({ ...prev, showTokenExpiredModal }));

  return (
    <AuthContext.Provider
      value={{
        user: authState.user,
        setUser,
        showTokenExpiredModal: authState.showTokenExpiredModal,
        setShowTokenExpiredModal,
        logout,
        loading: authState.loading,
      }}
    >
      {children}
      <Modal
        isOpen={authState.showTokenExpiredModal}
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