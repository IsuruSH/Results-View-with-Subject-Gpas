import { decryptFromSession } from "./sessionCrypto";

const FOSMIS_LOGIN_URL = "https://paravi.ruh.ac.lk/fosmis/login.php";

/**
 * Open a FOSMIS page in a new tab, automatically authenticating the user
 * if needed. On the first call, it auto-submits a login form to FOSMIS
 * and then redirects to the target URL. Subsequent calls open the link
 * directly since the browser already has an authenticated PHPSESSID cookie.
 *
 * Credentials are read from sessionStorage (encrypted) and decrypted
 * in-memory using the per-session AES key.
 */
export async function openFosmisPage(targetUrl: string): Promise<void> {
  // If we already authenticated FOSMIS in this browser session, open directly
  if (sessionStorage.getItem("fosmis_browser_authed")) {
    window.open(targetUrl, "_blank", "noopener,noreferrer");
    return;
  }

  const uname = sessionStorage.getItem("fosmis_uname") || "";
  const enc = sessionStorage.getItem("fosmis_upwd_enc") || "";
  const iv = sessionStorage.getItem("fosmis_upwd_iv") || "";

  // No credentials available — fall back to direct open (user will see login page)
  if (!uname || !enc || !iv) {
    window.open(targetUrl, "_blank", "noopener,noreferrer");
    return;
  }

  // Decrypt password in memory
  let upwd: string;
  try {
    upwd = await decryptFromSession(enc, iv);
  } catch {
    // Decryption failed (e.g. key was lost after refresh) — fall back
    window.open(targetUrl, "_blank", "noopener,noreferrer");
    return;
  }

  // Open a new tab and write an auto-submitting login form
  const w = window.open("about:blank", "_blank");
  if (!w) {
    // Popup was blocked — fall back to direct open
    window.open(targetUrl, "_blank", "noopener,noreferrer");
    return;
  }

  // Escape HTML entities in credentials to prevent injection
  const safeUname = uname.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const safeUpwd = upwd.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

  w.document.write(
    `<!DOCTYPE html>
<html>
<head><title>Connecting to FOSMIS...</title></head>
<body style="font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc;color:#475569;">
  <div style="text-align:center;">
    <div style="width:40px;height:40px;border:3px solid #e2e8f0;border-top-color:#6366f1;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px;"></div>
    <p style="font-size:14px;">Connecting to FOSMIS...</p>
  </div>
  <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
  <form id="f" method="POST" action="${FOSMIS_LOGIN_URL}">
    <input type="hidden" name="uname" value="${safeUname}">
    <input type="hidden" name="upwd" value="${safeUpwd}">
  </form>
  <script>document.getElementById("f").submit();</script>
</body>
</html>`
  );

  // Poll to detect when the form submission navigates to FOSMIS (cross-origin).
  // Once we get a cross-origin error reading w.location.href, login is done.
  let attempts = 0;
  const poll = setInterval(() => {
    attempts++;
    try {
      // Still on about:blank or our written page — not yet navigated
      void w.location.href;
    } catch {
      // Cross-origin = FOSMIS page loaded = login complete
      clearInterval(poll);
      sessionStorage.setItem("fosmis_browser_authed", "1");
      // Small buffer for cookie to fully settle, then redirect
      setTimeout(() => {
        try {
          w.location.href = targetUrl;
        } catch {
          // If setting location fails, the tab is already at FOSMIS — acceptable
        }
      }, 300);
      return;
    }
    // Fallback: if polling takes too long (~5s), redirect anyway
    if (attempts > 25) {
      clearInterval(poll);
      sessionStorage.setItem("fosmis_browser_authed", "1");
      try {
        w.location.href = targetUrl;
      } catch {
        // already cross-origin
      }
    }
  }, 200);
}
