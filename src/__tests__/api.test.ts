import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// The SERVER_URL is resolved from .env at import time by Vite.
// In test mode with vitest, .env is loaded so it will be http://localhost:4000.
// We read it dynamically to keep tests env-agnostic.
let SERVER_URL: string;
let login: typeof import("../services/api").login;
let logout: typeof import("../services/api").logout;
let fetchResults: typeof import("../services/api").fetchResults;
let calculateGPA: typeof import("../services/api").calculateGPA;

beforeEach(async () => {
  mockFetch.mockReset();
  // Dynamic import to ensure the module picks up the env
  const api = await import("../services/api");
  login = api.login;
  logout = api.logout;
  fetchResults = api.fetchResults;
  calculateGPA = api.calculateGPA;
  SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";
});

describe("login", () => {
  it("sends POST to /init with credentials", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ sessionId: "abc123" }),
    });

    const result = await login("sc12345", "password");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe(`${SERVER_URL}/init`);
    expect(opts.method).toBe("POST");
    expect(JSON.parse(opts.body)).toEqual({
      username: "sc12345",
      password: "password",
    });
    expect(result.sessionId).toBe("abc123");
  });

  it("throws on failed authentication", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    await expect(login("bad", "creds")).rejects.toThrow(
      "Authentication failed"
    );
  });
});

describe("logout", () => {
  it("sends POST to /logout", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await logout();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe(`${SERVER_URL}/logout`);
    expect(opts.method).toBe("POST");
  });
});

describe("fetchResults", () => {
  it("sends GET to /results with auth header", async () => {
    const mockData = { data: "<html>", gpa: "3.50" };
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockData),
    });

    const result = await fetchResults("session123", "12345", "4");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/results?stnum=12345&rlevel=4");
    expect(opts.headers.authorization).toBe("session123");
    expect(result.gpa).toBe("3.50");
  });
});

describe("calculateGPA", () => {
  it("sends POST to /calculateGPA with all data", async () => {
    const mockData = { gpa: "3.70" };
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockData),
    });

    const result = await calculateGPA(
      "session123",
      "12345",
      { subjects: ["AMT1232"], grades: ["A+"] },
      { subjects: [], grades: [] }
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/calculateGPA");
    expect(opts.method).toBe("POST");
    expect(opts.headers.authorization).toBe("Bearer session123");
    expect(result.gpa).toBe("3.70");
  });
});
