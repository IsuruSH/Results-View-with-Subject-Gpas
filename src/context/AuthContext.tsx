import React, { createContext, useContext, useState } from "react";
import type { AuthContextType } from "../types";
import { login, logout } from "../services/api";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<string | null>(
    localStorage.getItem("PHPSESSID")
  );
  const [username, setUsername] = useState<string | null>(
    localStorage.getItem("username")
  );

  const signIn = async (rawUsername: string, password: string) => {
    const data = await login(rawUsername, password);
    const sessionId = data.sessionId;
    const formattedUsername = rawUsername.toLowerCase().startsWith("sc")
      ? rawUsername.slice(2)
      : rawUsername;

    localStorage.setItem("PHPSESSID", sessionId);
    localStorage.setItem("username", formattedUsername);
    setSession(sessionId);
    setUsername(formattedUsername);
  };

  const signOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      localStorage.removeItem("PHPSESSID");
      localStorage.removeItem("username");
      setSession(null);
      setUsername(null);
    }
  };

  return (
    <AuthContext.Provider value={{ session, username, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
