import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  showTokenExpiredModal: boolean;
  setShowTokenExpiredModal: (val: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [showTokenExpiredModal, setShowTokenExpiredModal] = useState(false);
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setShowTokenExpiredModal(false);
    navigate("/"); // redirect to login or home
  };

  return (
    <AuthContext.Provider value={{ showTokenExpiredModal, setShowTokenExpiredModal, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};