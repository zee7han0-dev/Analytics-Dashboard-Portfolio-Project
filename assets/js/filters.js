/* ============================================================
   FILTERS.JS  —  Date range & category filter logic
   - Wires up date range buttons (7D / 30D / 90D / 1Y)
   - Wires up category select (All / BTC / ETH / SOL)
   - Calls API.reloadLine() on change — no full page reload
   - Keeps filter state in sync with the UI
   ============================================================ */

const Filters = (() => {
  // ── Filter state ───────────────────────────────────────────
  const state = {
    days: 90,
    coin: "bitcoin",
  };

  // ── Coin name → CoinGecko ID map ───────────────────────────
  const COIN_MAP = {
    all: "bitcoin",
    bitcoin: "bitcoin",
    ethereum: "ethereum",
    solana: "solana",
  };

  // ──────────────────────────────────────────────────────────
  // DATE RANGE BUTTONS
  // ──────────────────────────────────────────────────────────
  function initDateButtons() {
    const buttons = document.querySelectorAll(".filter-date-btn");

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const range = parseInt(btn.dataset.range, 10);
        if (range === state.days) return; // no change

        // Update active state
        buttons.forEach((b) => b.classList.remove("filter-date-btn--active"));
        btn.classList.add("filter-date-btn--active");

        state.days = range;
        API.reloadLine(state.days, state.coin);
      });
    });
  }

  // ──────────────────────────────────────────────────────────
  // CATEGORY SELECT
  // ──────────────────────────────────────────────────────────
  function initCategorySelect() {
    const select = document.getElementById("category-filter");
    if (!select) return;

    select.addEventListener("change", () => {
      const value = select.value;
      state.coin = COIN_MAP[value] || "bitcoin";
      API.reloadLine(state.days, state.coin);
    });
  }

  // ──────────────────────────────────────────────────────────
  // GET STATE  (read by app.js on initial load)
  // ──────────────────────────────────────────────────────────
  function getState() {
    return { ...state };
  }

  // ──────────────────────────────────────────────────────────
  // INIT
  // ──────────────────────────────────────────────────────────
  function init() {
    initDateButtons();
    initCategorySelect();
  }

  // ── Public API ─────────────────────────────────────────────
  return { init, getState };
})();

document.addEventListener("DOMContentLoaded", Filters.init);
