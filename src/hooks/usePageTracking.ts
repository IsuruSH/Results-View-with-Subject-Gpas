import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "../services/analytics";

/**
 * Send a GA page view on every route change.
 *
 * Needed because GA's automatic page_view fires once per document load, and
 * this is a single-page app — without this, every route after the first is
 * invisible in the reports.
 *
 * The ref guards against React StrictMode's double-invoked effects in
 * development, which would otherwise double-count the first view.
 */
export function usePageTracking(): void {
  const location = useLocation();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname + location.search;
    if (lastPath.current === path) return;
    lastPath.current = path;
    trackPageView(path);
  }, [location]);
}
