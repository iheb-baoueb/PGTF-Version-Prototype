import { createContext, useContext, useState, ReactNode } from "react";

interface AuthContextValue {
  isLoggedIn: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const CREDENTIALS = { username: "admin", password: "pgtf2026" };

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const login = (username: string, password: string): boolean => {
    if (
      username.trim() === CREDENTIALS.username &&
      password === CREDENTIALS.password
    ) {
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  const logout = () => setIsLoggedIn(false);

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
