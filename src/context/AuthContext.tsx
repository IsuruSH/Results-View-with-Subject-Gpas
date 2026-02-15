import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import type { AuthContextType, GpaResults } from "../types";
import { login, logout } from "../services/api";
import {
  clearCache,
  setCached,
  CACHE_KEYS,
  setProfileImage,
  clearProfileImage,
  getProfileImage,
} from "../services/dataCache";
import {
  encryptForSession,
  clearSessionKey,
} from "../utils/sessionCrypto";

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
    // Encrypt password before storing (key lives only in memory)
    encryptForSession(password).then(({ ciphertext, iv }) => {
      sessionStorage.setItem("fosmis_upwd_enc", ciphertext);
      sessionStorage.setItem("fosmis_upwd_iv", iv);
    });

    // Pre-cache profile image URL
    const imgUrl = getProfileImage(formattedUsername);
    if (imgUrl) setProfileImage(formattedUsername, imgUrl);

    // Store pre-fetched results in both ref (for immediate consume) and
    // in the centralized cache (for cross-page sharing)
    if (data.results) {
      initialResultsRef.current = data.results;
      setCached(CACHE_KEYS.results(formattedUsername, "4"), data.results);
      // Also seed the sessionStorage cache for Home page GPA card
      try {
        sessionStorage.setItem("homeGpaCache", JSON.stringify(data.results));
      } catch {
        // ignore
      }
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
      sessionStorage.removeItem("fosmis_upwd_enc");
      sessionStorage.removeItem("fosmis_upwd_iv");
      sessionStorage.removeItem("fosmis_browser_authed");
      sessionStorage.removeItem("homeGpaCache");
      clearSessionKey();
      clearCache();
      clearProfileImage();
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
