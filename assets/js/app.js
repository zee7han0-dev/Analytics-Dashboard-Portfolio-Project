/* ============================================================
   APP.JS  —  Main entry point
   - Boots all modules in the correct order
   - Kicks off the first API load
   - Wires up the refresh button
   - Sets up 60-second auto-refresh
   - Re-initialises Lucide icons after dynamic content renders
   ============================================================ */

const App = (() => {
  // ── Auto-refresh interval (ms) ─────────────────────────────
  const REFRESH_INTERVAL = 60 * 1000; // 60 seconds
  let refreshTimer = null;

  // ──────────────────────────────────────────────────────────
  // BOOT SEQUENCE
  // ──────────────────────────────────────────────────────────
  async function init() {
    // 1. Render Lucide icons (replaces data-lucide attrs)
    lucide.createIcons();

    // 2. Initial data load using default filter state
    const { days, coin } = Filters.getState();
    await API.load(days, coin);

    // 3. Re-render icons injected by api.js / ui.js
    lucide.createIcons();

    // 4. Wire up manual refresh button
    document
      .getElementById("refresh-btn")
      ?.addEventListener("click", handleRefresh);

    // 5. Start auto-refresh
    startAutoRefresh();
  }

  // ──────────────────────────────────────────────────────────
  // MANUAL REFRESH
  // ──────────────────────────────────────────────────────────
  async function handleRefresh() {
    // Reset the auto-refresh timer so it doesn't fire right
    // after a manual refresh
    stopAutoRefresh();

    const { days, coin } = Filters.getState();
    await API.load(days, coin);

    lucide.createIcons();
    startAutoRefresh();
  }

  // ──────────────────────────────────────────────────────────
  // AUTO-REFRESH
  // ──────────────────────────────────────────────────────────
  function startAutoRefresh() {
    refreshTimer = setInterval(async () => {
      const { days, coin } = Filters.getState();
      await API.load(days, coin);
      lucide.createIcons();
    }, REFRESH_INTERVAL);
  }

  function stopAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  // Pause auto-refresh when tab is hidden, resume when visible
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAutoRefresh();
    } else {
      // Immediately refresh when tab comes back into focus
      handleRefresh();
    }
  });

  // ── Public API ─────────────────────────────────────────────
  return { init };
})();

// ── Boot on DOMContentLoaded ───────────────────────────────
document.addEventListener("DOMContentLoaded", App.init);
