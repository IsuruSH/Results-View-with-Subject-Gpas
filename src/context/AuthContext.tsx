import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import type { AuthContextType, GpaResults } from "../types";
import { login, logout } from "../services/api";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<string | null>(
    localStorage.getItem("PHPSESSID")
  );
  const [username, setUsername] = useState<string | null>(
    localStorage.getItem("username")
  );

  // Ref-based cache: avoids triggering re-renders / effect loops when consumed.
  const initialResultsRef = useRef<GpaResults | null>(null);

  /** Read and consume. First call returns cached data, subsequent calls return null. */
  const consumeInitialResults = useCallback((): GpaResults | null => {
    const data = initialResultsRef.current;
    initialResultsRef.current = null;
    return data;
  }, []);

  const signIn = async (rawUsername: string, password: string) => {
    const data = await login(rawUsername, password);
    const sessionId = data.sessionId;
    const formattedUsername = rawUsername.toLowerCase().startsWith("sc")
      ? rawUsername.slice(2)
      : rawUsername;

    localStorage.setItem("PHPSESSID", sessionId);
    localStorage.setItem("username", formattedUsername);

    // Store credentials so useFosmisSession can auto-login in the browser
    sessionStorage.setItem("fosmis_uname", rawUsername);
    sessionStorage.setItem("fosmis_upwd", password);

    // Store pre-fetched results for the Results page to pick up instantly
    if (data.results) {
      initialResultsRef.current = data.results;
    }

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
      sessionStorage.removeItem("fosmis_uname");
      sessionStorage.removeItem("fosmis_upwd");
      sessionStorage.removeItem("fosmis_browser_authed");
      setSession(null);
      setUsername(null);
      initialResultsRef.current = null;
    }
  };

  return (
    <AuthContext.Provider
      value={{ session, username, consumeInitialResults, signIn, signOut }}
    >
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
