/**
 * Google Analytics 4.
 *
 * Two rules this module exists to enforce:
 *
 *  1. **No personal data ever reaches Google.** Student numbers, names,
 *     mentor details, subject codes tied to a person and passwords are all
 *     personal data, and sending them would breach Google's own Analytics
 *     terms as well as the students' trust. Events here carry counts,
 *     categories and coarse buckets only. If a per-user metric is ever
 *     needed, send an opaque hash via `setAnalyticsUser`, never the raw
 *     student number.
 *
 *  2. **It is inert unless configured.** With no VITE_GA_MEASUREMENT_ID the
 *     script is never loaded and every call is a no-op, so local development
 *     and tests do not pollute production reporting.
 */

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as
  | string
  | undefined;

/** Analytics is deliberately off in dev unless explicitly switched on. */
const FORCE_IN_DEV = import.meta.env.VITE_GA_DEBUG === "true";

type GtagArgs =
  | ["js", Date]
  | ["config", string, Record<string, unknown>?]
  | ["event", string, Record<string, unknown>?]
  | ["set", Record<string, unknown>];

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: GtagArgs) => void;
  }
}

let enabled = false;

function canRun(): boolean {
  return enabled && typeof window !== "undefined" && !!window.gtag;
}

/**
 * Load gtag.js and configure the property. Safe to call more than once.
 *
 * Page views are sent manually: this is a single-page app, so GA's automatic
 * page_view only ever fires once, on the initial load, and every subsequent
 * route would be invisible.
 */
export function initAnalytics(): void {
  if (enabled || typeof window === "undefined") return;
  if (!MEASUREMENT_ID) return;
  if (import.meta.env.DEV && !FORCE_IN_DEV) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
    MEASUREMENT_ID
  )}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  // gtag must push `arguments` itself — a rest-array shim breaks the SDK.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  } as unknown as typeof window.gtag;

  window.gtag!("js", new Date());
  window.gtag!("config", MEASUREMENT_ID, {
    send_page_view: false,
    anonymize_ip: true,
  });

  enabled = true;
}

/** Record a route change as a page view. */
export function trackPageView(path: string, title?: string): void {
  if (!canRun()) return;
  window.gtag!("event", "page_view", {
    page_path: path,
    page_title: title ?? document.title,
    page_location: window.location.origin + path,
  });
}

/**
 * Record a behaviour event.
 *
 * `params` must contain no personal data — see the note at the top of this
 * file. Values are counts, labels and buckets.
 */
export function trackEvent(
  name: string,
  params: Record<string, string | number | boolean> = {}
): void {
  if (!canRun()) return;
  window.gtag!("event", name, params);
}

/**
 * Attach an opaque identifier so GA can count returning users without ever
 * learning who they are. Pass an already-hashed value — see `anonymousId`.
 */
export function setAnalyticsUser(opaqueId: string | null): void {
  if (!canRun()) return;
  window.gtag!("set", { user_id: opaqueId ?? undefined });
}

/**
 * Derive a stable, non-reversible id from a student number, so repeat visits
 * can be counted without the number itself leaving the browser.
 *
 * SHA-256 truncated to 16 hex characters. Not a secret-grade KDF — the input
 * space is small enough to brute force — so this is a de-identifier for
 * Google's benefit, not an anonymiser that would survive a determined
 * attacker. That is why it is opt-in and off by default.
 */
export async function anonymousId(studentNumber: string): Promise<string> {
  const data = new TextEncoder().encode(`resultview:${studentNumber}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ---------------------------------------------------------------------------
// Named events
//
// Everything the app reports goes through one of these, so the event names
// and their parameters stay consistent — GA has no schema, and a typo makes a
// permanent second event in the reports.
// ---------------------------------------------------------------------------

/** Coarse GPA band, so distribution can be charted without exposing a GPA. */
export function gpaBand(gpa: number | string | undefined): string {
  const n = typeof gpa === "string" ? parseFloat(gpa) : gpa;
  if (n === undefined || n === null || isNaN(n)) return "unknown";
  if (n >= 3.7) return "3.70+";
  if (n >= 3.3) return "3.30-3.69";
  if (n >= 3.0) return "3.00-3.29";
  if (n >= 2.0) return "2.00-2.99";
  return "below-2.00";
}

export const analytics = {
  // --- Authentication ---
  loginSubmitted: () => trackEvent("login_submitted"),
  loginSucceeded: (prefetched: boolean) =>
    trackEvent("login_succeeded", { results_prefetched: prefetched }),
  loginFailed: (reason: "invalid_credentials" | "unreachable" | "error") =>
    trackEvent("login_failed", { reason }),
  signedOut: () => trackEvent("sign_out"),

  // --- Results ---
  resultsViewed: (params: {
    band: string;
    subjects: number;
    repeats: number;
  }) => trackEvent("results_viewed", params),
  resultsRefreshed: (rlevel: string) =>
    trackEvent("results_refreshed", { rlevel }),
  levelFilterChanged: (rlevel: string) =>
    trackEvent("level_filter_changed", { rlevel }),

  // --- Analytics widgets ---
  trendModeChanged: (mode: "level" | "semester") =>
    trackEvent("trend_mode_changed", { mode }),
  analyticsTabOpened: (tab: string) =>
    trackEvent("analytics_tab_opened", { tab }),
  gpaCalculated: (params: { manual_subjects: number; repeats: number }) =>
    trackEvent("gpa_calculated", params),
  whatIfRun: (subjects: number) => trackEvent("what_if_run", { subjects }),
  targetPlanned: (target: string) => trackEvent("target_planned", { target }),

  // --- Repeat planner ---
  repeatPlannerUsed: (action: "recommended" | "all" | "clear" | "toggle") =>
    trackEvent("repeat_planner_used", { action }),
  repeatGradeChanged: () => trackEvent("repeat_grade_changed"),

  // --- Other pages ---
  coursesViewed: (params: { registered: number; registration_open: boolean }) =>
    trackEvent("courses_viewed", params),
  guideViewed: (program: string) => trackEvent("guide_viewed", { program }),

  // --- Exports and outbound ---
  exported: (format: "excel" | "pdf") => trackEvent("export", { format }),
  fosmisLinkOpened: (destination: string) =>
    trackEvent("fosmis_link_opened", { destination }),

  // --- Failures worth counting ---
  apiError: (endpoint: string, status: number | string) =>
    trackEvent("api_error", { endpoint, status: String(status) }),
};
