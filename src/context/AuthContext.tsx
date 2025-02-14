import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  session: string | null;
  username: number | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(
    localStorage.getItem("username")
  );

  useEffect(() => {
    const removeSession = async () => {
      localStorage.removeItem("PHPSESSID");

      await fetch(`${import.meta.env.VITE_SERVER_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });

      setSession(null);
      setUsername(null);
    };

    // Run on every page load
    removeSession();
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/init`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error("Authentication failed");
      }

      const data = await response.json();
      const sessionId = data.sessionId;
      const formattedUsername = username.toLowerCase().startsWith("sc")
        ? username.slice(2)
        : username;

      localStorage.setItem("PHPSESSID", sessionId);
      localStorage.setItem("username", formattedUsername);
      setSession(sessionId);
      setUsername(formattedUsername);
    } catch (error) {
      throw new Error("Authentication failed");
    }
  };

  const signOut = async () => {
    try {
      await fetch(`${import.meta.env.VITE_SERVER_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
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
