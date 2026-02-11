const SERVER_URL = import.meta.env.VITE_SERVER_URL;

/**
 * POST /init — Authenticate with FOSMIS credentials.
 */
export async function login(
  username: string,
  password: string
): Promise<{ sessionId: string }> {
  const response = await fetch(`${SERVER_URL}/init`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
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
