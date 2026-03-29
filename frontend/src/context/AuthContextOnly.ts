import { createContext } from "react";

// ? [INTERFACES]
interface User {
  id: number;
  name: string;
  role: "admin" | "adviser";
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;

  showTokenExpiredModal: boolean;
  setShowTokenExpiredModal: (val: boolean) => void;

  logout: () => void;

  loading: boolean; // ✅ Required so PrivateRoute can wait for auth restoration
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);