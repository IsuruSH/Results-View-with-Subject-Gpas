import {
  getCached,
  dedupFetch,
  CACHE_KEYS,
} from "./dataCache";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

// ---------------------------------------------------------------------------
// Auth (never cached / deduped)
// ---------------------------------------------------------------------------

/**
 * POST /init — Authenticate with FOSMIS credentials.
 * Backend pre-fetches results in the same round-trip.
 */
export async function login(
  username: string,
  password: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ sessionId: string; results: any }> {
  const response = await fetch(`${SERVER_URL}/init`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, rlevel: "4", stnum: username }),
  });

  if (!response.ok) {
    // The server distinguishes a rejected password (401) from FOSMIS being
    // unreachable (503). Surface its message so a timeout doesn't read as
    // "wrong password" and send the user off to reset a working one.
    let message = "Authentication failed";
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      // non-JSON body — keep the default
    }
    throw new Error(message);
  }

  return response.json();
}

/**
 * POST /logout — End the current session.
 */
export async function logout(): Promise<void> {
  await fetch(`${SERVER_URL}/logout`, {
    method: "POST",
    credentials: "include",
  });
}

// ---------------------------------------------------------------------------
// Data endpoints — with cache + deduplication
// ---------------------------------------------------------------------------

/**
 * GET /results — Fetch student results and GPAs.
 * Uses in-memory cache + request deduplication.
 */
export async function fetchResults(
  sessionId: string,
  stnum: string,
  rlevel: string
) {
  const key = CACHE_KEYS.results(stnum, rlevel);

  // Return cached data if fresh
  const cached = getCached(key);
  if (cached) return cached;

  return dedupFetch(key, async () => {
    const response = await fetch(
      `${SERVER_URL}/results?stnum=${encodeURIComponent(stnum)}&rlevel=${encodeURIComponent(rlevel)}`,
      {
        headers: { authorization: sessionId },
        credentials: "include",
      }
    );
    if (!response.ok) throw new Error(`Results fetch failed (${response.status})`);
    const data = await response.json();
    try {
      sessionStorage.setItem("homeGpaCache", JSON.stringify(data));
    } catch {
      // ignore
    }
    return data;
  });
}

/**
 * GET /home-data — Fetch FOSMIS homepage data (student name, mentor, photo).
 */
export async function fetchHomeData(sessionId: string) {
  const key = CACHE_KEYS.homeData;
  const cached = getCached(key);
  if (cached) return cached;

  return dedupFetch(key, async () => {
    const response = await fetch(`${SERVER_URL}/home-data`, {
      headers: { authorization: sessionId },
      credentials: "include",
    });
    if (!response.ok) throw new Error(`Home data fetch failed (${response.status})`);
    return response.json();
  });
}

/**
 * GET /course-registration — Fetch parsed course registration data.
 */
export async function fetchCourseRegistration(sessionId: string) {
  const key = CACHE_KEYS.courseReg;
  const cached = getCached(key);
  if (cached) return cached;

  return dedupFetch(key, async () => {
    const response = await fetch(`${SERVER_URL}/course-registration`, {
      headers: { authorization: sessionId },
      credentials: "include",
    });
    if (!response.ok) throw new Error(`Course registration fetch failed (${response.status})`);
    return response.json();
  });
}

// ---------------------------------------------------------------------------
// GPA calculator — never cached (user-submitted data)
// ---------------------------------------------------------------------------

/**
 * POST /calculateGPA — Calculate GPA with manual + repeated subjects.
 */
export async function calculateGPA(
  sessionId: string,
  stnum: string,
  manualSubjects: { subjects: string[]; grades: string[] },
  repeatedSubjects: { subjects: string[]; grades: string[] }
) {
  const response = await fetch(`${SERVER_URL}/calculateGPA`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${sessionId}`,
    },
    credentials: "include",
    body: JSON.stringify({ stnum, manualSubjects, repeatedSubjects }),
  });
  return response.json();
}
