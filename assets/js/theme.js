/* ============================================================
   THEME.JS  —  Dark / Light mode toggle
   - Reads saved preference from localStorage on page load
   - Toggles 'dark' class on <html>
   - Updates button label and icon visibility
   - Fires a custom 'themechange' event for charts.js to listen to
   ============================================================ */

const Theme = (() => {
  // ── Constants ──────────────────────────────────────────────
  const STORAGE_KEY = "pulse-theme";
  const DARK_CLASS = "dark";

  // ── DOM refs (resolved after DOMContentLoaded) ─────────────
  let html, toggleBtn, labelDark, labelLight, iconSun, iconMoon;

  // ── Current state ──────────────────────────────────────────
  let isDark = true;

  // ──────────────────────────────────────────────────────────
  // apply()  — sets the class and updates all UI chrome
  // ──────────────────────────────────────────────────────────
  function apply(dark) {
    isDark = dark;

    if (dark) {
      html.classList.add(DARK_CLASS);
    } else {
      html.classList.remove(DARK_CLASS);
    }

    // Persist
    localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");

    // Tell charts to re-skin themselves
    document.dispatchEvent(
      new CustomEvent("themechange", { detail: { dark } }),
    );
  }

  // ──────────────────────────────────────────────────────────
  // toggle()  — flips current theme
  // ──────────────────────────────────────────────────────────
  function toggle() {
    apply(!isDark);
  }

  // ──────────────────────────────────────────────────────────
  // init()  — called once on DOMContentLoaded
  // ──────────────────────────────────────────────────────────
  function init() {
    html = document.documentElement;
    toggleBtn = document.getElementById("theme-toggle");

    // Read saved preference; default to dark
    const saved = localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    isDark = saved ? saved === "dark" : prefersDark;

    // Apply immediately (no transition flash)
    apply(isDark);

    // Wire up button
    if (toggleBtn) {
      toggleBtn.addEventListener("click", toggle);
    }

    // Also respect OS-level changes while page is open
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        // Only follow OS if user hasn't manually set a preference
        if (!localStorage.getItem(STORAGE_KEY)) {
          apply(e.matches);
        }
      });
  }

  // ── Public API ─────────────────────────────────────────────
  return { init, toggle, isDark: () => isDark };
})();

// Boot as soon as DOM is ready
document.addEventListener("DOMContentLoaded", Theme.init);
