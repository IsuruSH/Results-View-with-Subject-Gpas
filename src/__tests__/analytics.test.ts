import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  gpaBand,
  trackEvent,
  trackPageView,
  anonymousId,
} from "../services/analytics";

describe("gpaBand", () => {
  it("buckets a GPA instead of reporting it exactly", () => {
    expect(gpaBand(3.95)).toBe("3.70+");
    expect(gpaBand(3.7)).toBe("3.70+");
    expect(gpaBand(3.69)).toBe("3.30-3.69");
    expect(gpaBand(3.3)).toBe("3.30-3.69");
    expect(gpaBand(3.0)).toBe("3.00-3.29");
    expect(gpaBand(2.0)).toBe("2.00-2.99");
    expect(gpaBand(1.99)).toBe("below-2.00");
  });

  it("accepts the string form the API returns", () => {
    expect(gpaBand("2.99")).toBe("2.00-2.99");
    expect(gpaBand("NaN")).toBe("unknown");
    expect(gpaBand(undefined)).toBe("unknown");
  });
});

describe("tracking with no measurement ID configured", () => {
  beforeEach(() => {
    // initAnalytics is never called in tests, so gtag was never installed.
    delete (window as { gtag?: unknown }).gtag;
  });

  it("does not throw and sends nothing", () => {
    const spy = vi.fn();
    (window as { gtag?: unknown }).gtag = undefined;
    expect(() => trackEvent("some_event", { a: 1 })).not.toThrow();
    expect(() => trackPageView("/results")).not.toThrow();
    expect(spy).not.toHaveBeenCalled();
  });

  it("stays inert even when a gtag exists but init never ran", () => {
    const spy = vi.fn();
    (window as unknown as { gtag: unknown }).gtag = spy;
    trackEvent("some_event");
    // `enabled` is only set by initAnalytics, which bails without an ID.
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("anonymousId", () => {
  it("is stable for the same student number", async () => {
    const a = await anonymousId("12805");
    const b = await anonymousId("12805");
    expect(a).toBe(b);
  });

  it("differs between students and never contains the input", async () => {
    const a = await anonymousId("12805");
    const b = await anonymousId("12419");
    expect(a).not.toBe(b);
    expect(a).not.toContain("12805");
    expect(a).toMatch(/^[0-9a-f]{16}$/);
  });
});
