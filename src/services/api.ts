const SERVER_URL = import.meta.env.VITE_SERVER_URL;

/**
 * POST /init — Authenticate with FOSMIS credentials.
 * Also sends rlevel + stnum so the backend can pre-fetch results in the
 * same round-trip, saving ~500 ms on initial load.
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
    throw new Error("Authentication failed");
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

/**
 * GET /results — Fetch student results and GPAs.
 */
export async function fetchResults(
  sessionId: string,
  stnum: string,
  rlevel: string
) {
  const response = await fetch(
    `${SERVER_URL}/results?stnum=${encodeURIComponent(stnum)}&rlevel=${encodeURIComponent(rlevel)}`,
    {
      headers: { authorization: sessionId },
      credentials: "include",
    }
  );
  return response.json();
}

/**
 * GET /home-data — Fetch FOSMIS homepage data (mentor, notices, etc.).
 */
export async function fetchHomeData(sessionId: string) {
  const response = await fetch(`${SERVER_URL}/home-data`, {
    headers: { authorization: sessionId },
    credentials: "include",
  });
  return response.json();
}

/**
 * GET /course-registration — Fetch parsed course registration data.
 */
export async function fetchCourseRegistration(sessionId: string) {
  const response = await fetch(`${SERVER_URL}/course-registration`, {
    headers: { authorization: sessionId },
    credentials: "include",
  });
  return response.json();
}

/**
 * GET /notices — Fetch structured notices from FOSMIS notice board.
 */
export async function fetchNotices(sessionId: string) {
  const response = await fetch(`${SERVER_URL}/notices`, {
    headers: { authorization: sessionId },
    credentials: "include",
  });
  return response.json();
}

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
