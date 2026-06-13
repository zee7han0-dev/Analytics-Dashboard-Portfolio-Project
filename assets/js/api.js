/* ============================================================
   API.JS  —  CoinGecko data fetching & dashboard population
   - fetchMarketData()   : KPI cards + bar + donut charts
   - fetchPriceHistory() : line chart time-series
   - All async/await with loading states & error handling
   - Exposes API.load(range, coin) for filters.js to call
   ============================================================ */

const API = (() => {
  // ── CoinGecko base (free tier, no key needed) ──────────────
  const BASE = "https://api.coingecko.com/api/v3";

  // ── Coins we track ─────────────────────────────────────────
  const COINS = [
    "bitcoin",
    "ethereum",
    "solana",
    "cardano",
    "avalanche-2",
    "chainlink",
  ];
  const COIN_LABELS = {
    bitcoin: "BTC",
    ethereum: "ETH",
    solana: "SOL",
    cardano: "ADA",
    "avalanche-2": "AVAX",
    chainlink: "LINK",
  };

  // ── State ──────────────────────────────────────────────────
  let lastMarketData = null; // cache for filter re-renders
  let lastHistoryData = null;
  let lastHistoryDays = 90;

  // ──────────────────────────────────────────────────────────
  // FETCH HELPERS
  // ──────────────────────────────────────────────────────────

  async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
    return res.json();
  }

  // ──────────────────────────────────────────────────────────
  // FETCH MARKET DATA  (prices, volumes, market caps)
  // ──────────────────────────────────────────────────────────
  async function fetchMarketData() {
    const ids = COINS.join(",");
    const url = `${BASE}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`;
    return fetchJSON(url);
  }

  // ──────────────────────────────────────────────────────────
  // FETCH PRICE HISTORY  (for line chart)
  // coin  : 'bitcoin' | 'ethereum' | 'solana'
  // days  : 7 | 30 | 90 | 365
  // ──────────────────────────────────────────────────────────
  async function fetchPriceHistory(coin = "bitcoin", days = 90) {
    const url = `${BASE}/coins/${coin}/market_chart?vs_currency=usd&days=${days}&interval=${days <= 30 ? "daily" : "daily"}`;
    return fetchJSON(url);
  }

  // ──────────────────────────────────────────────────────────
  // POPULATE KPI CARDS
  // ──────────────────────────────────────────────────────────
  function populateCards(data) {
    // ── Revenue  = total market cap of tracked coins ──
    const totalMarketCap = data.reduce(
      (sum, c) => sum + (c.market_cap || 0),
      0,
    );
    const totalVolume = data.reduce((sum, c) => sum + (c.total_volume || 0), 0);
    const avgChange =
      data.reduce((sum, c) => sum + (c.price_change_percentage_24h || 0), 0) /
      data.length;

    setCard({
      valueId: "val-revenue",
      trendId: "trend-revenue",
      value: formatLargeNumber(totalMarketCap, "$"),
      change: avgChange,
      suffix: "vs yesterday",
    });

    // ── Active users  = mock derived from volume ──────────
    const users = Math.round(totalVolume / 85000);
    setCard({
      valueId: "val-users",
      trendId: "trend-users",
      value: formatCompact(users),
      change: avgChange * 0.6,
      suffix: "vs yesterday",
    });

    // ── Orders  = 24h total volume ────────────────────────
    setCard({
      valueId: "val-orders",
      trendId: "trend-orders",
      value: formatLargeNumber(totalVolume, "$"),
      change: data[0]?.price_change_percentage_24h || 0,
      suffix: "vs yesterday",
    });

    // ── Conversion rate  = mock ───────────────────────────
    const convRate = 2.4 + avgChange * 0.05;
    setCard({
      valueId: "val-conversion",
      trendId: "trend-conversion",
      value: convRate.toFixed(1) + "%",
      change: avgChange * 0.3,
      suffix: "vs yesterday",
    });

    // Update the last-updated subtitle
    const subtitle = document.getElementById("page-subtitle");
    if (subtitle)
      subtitle.textContent = `Updated ${new Date().toLocaleTimeString()}`;
  }

  // ──────────────────────────────────────────────────────────
  // SET CARD  — replaces skeleton with real value + trend
  // ──────────────────────────────────────────────────────────
  function setCard({ valueId, trendId, value, change, suffix }) {
    const valEl = document.getElementById(valueId);
    const trendEl = document.getElementById(trendId);
    if (!valEl || !trendEl) return;

    const up = change >= 0;
    const arrow = up ? "↑" : "↓";
    const color = up ? "text-emerald-400" : "text-rose-400";
    const bgColor = up ? "bg-emerald-500/10" : "bg-rose-500/10";

    valEl.innerHTML = `<span class="tabular-nums">${value}</span>`;

    trendEl.innerHTML = `
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${bgColor} ${color}">
        ${arrow} ${Math.abs(change).toFixed(2)}%
      </span>
      <span class="text-zinc-500 text-xs">${suffix}</span>
    `;
  }

  // ──────────────────────────────────────────────────────────
  // POPULATE LINE CHART
  // ──────────────────────────────────────────────────────────
  function populateLine(historyData, days) {
    const prices = historyData.prices; // [[timestamp, price], ...]
    if (!prices?.length) return;

    // Thin out data points for readability
    const step = Math.max(1, Math.floor(prices.length / 60));
    const sliced = prices.filter((_, i) => i % step === 0);

    const labels = sliced.map(([ts]) => formatDateLabel(ts, days));
    const values = sliced.map(([, price]) => price);

    // Badge: current price + 24h change
    const first = values[0];
    const last = values[values.length - 1];
    const pctDiff = ((last - first) / first) * 100;
    const badge = document.getElementById("line-badge");
    const sub = document.getElementById("line-subtitle");

    if (badge) {
      const up = pctDiff >= 0;
      badge.textContent = `${up ? "↑" : "↓"} ${Math.abs(pctDiff).toFixed(2)}%`;
      badge.className = badge.className.replace(/bg-\S+|text-\S+/g, "");
      badge.classList.add(
        ...(up
          ? ["bg-emerald-500/15", "text-emerald-400", "border-emerald-500/20"]
          : ["bg-rose-500/15", "text-rose-400", "border-rose-500/20"]),
      );
    }

    if (sub)
      sub.textContent = `$${last.toLocaleString("en-US", { maximumFractionDigits: 0 })} current price`;

    Charts.updateLine(labels, values);
  }

  // ──────────────────────────────────────────────────────────
  // POPULATE BAR CHART
  // ──────────────────────────────────────────────────────────
  function populateBar(data) {
    const labels = data.map((c) => COIN_LABELS[c.id] || c.symbol.toUpperCase());
    const volumes = data.map((c) => c.total_volume || 0);
    Charts.updateBar(labels, volumes);
  }

  // ──────────────────────────────────────────────────────────
  // POPULATE DONUT CHART
  // ──────────────────────────────────────────────────────────
  function populateDonut(data) {
    const totalMcap = data.reduce((sum, c) => sum + (c.market_cap || 0), 0);
    const labels = data.map((c) => c.name);
    const percents = data.map((c) => (c.market_cap / totalMcap) * 100);
    Charts.updateDonut(labels, percents);
  }

  // ──────────────────────────────────────────────────────────
  // ACTIVITY FEED
  // ──────────────────────────────────────────────────────────
  function populateActivity(data) {
    const feed = document.getElementById("activity-feed");
    if (!feed) return;

    const colors = [
      "bg-indigo-500/15 text-indigo-400",
      "bg-sky-500/15 text-sky-400",
      "bg-violet-500/15 text-violet-400",
      "bg-emerald-500/15 text-emerald-400",
      "bg-rose-500/15 text-rose-400",
      "bg-amber-500/15 text-amber-400",
    ];

    const items = data.map((coin, i) => {
      const up = (coin.price_change_percentage_24h || 0) >= 0;
      const arrow = up ? "↑" : "↓";
      const color = up ? "text-emerald-400" : "text-rose-400";
      const change = Math.abs(coin.price_change_percentage_24h || 0).toFixed(2);
      const label = COIN_LABELS[coin.id] || coin.symbol.toUpperCase();
      const mins = (i + 1) * 4;

      return `
        <li class="activity-item">
          <div class="activity-dot ${colors[i % colors.length]} text-[10px] font-bold">
            ${label.slice(0, 2)}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-zinc-200 truncate">
              ${coin.name} moved <span class="${color}">${arrow}${change}%</span>
            </p>
            <p class="text-[11px] text-zinc-500 mt-0.5">
              $${coin.current_price?.toLocaleString("en-US", { maximumFractionDigits: 2 })} &bull; ${mins}m ago
            </p>
          </div>
        </li>
      `;
    });

    feed.innerHTML = items.join("");
  }

  // ──────────────────────────────────────────────────────────
  // MAIN LOAD  — called by app.js and filters.js
  // coin : 'bitcoin' | 'ethereum' | 'solana' | 'all'
  // days : 7 | 30 | 90 | 365
  // ──────────────────────────────────────────────────────────
  async function load(days = 90, coin = "bitcoin") {
    UI.setLoading(true);

    try {
      // Fire both requests in parallel
      const [marketData, historyData] = await Promise.all([
        fetchMarketData(),
        fetchPriceHistory(coin === "all" ? "bitcoin" : coin, days),
      ]);

      lastMarketData = marketData;
      lastHistoryData = historyData;
      lastHistoryDays = days;

      // Populate everything
      populateCards(marketData);
      populateLine(historyData, days);
      populateBar(marketData);
      populateDonut(marketData);
      populateActivity(marketData);

      UI.setLoading(false);
      UI.showNotification("Data refreshed", "success");
    } catch (err) {
      console.error("[API] Load failed:", err);
      UI.setLoading(false);
      UI.showError(err.message);
    }
  }

  // ──────────────────────────────────────────────────────────
  // POPULATE ANALYTICS VIEW  (reuses cached data)
  // ──────────────────────────────────────────────────────────
  function populateAnalytics() {
    if (!lastMarketData || !lastHistoryData) return;

    // Line chart (same data as Overview)
    const prices = lastHistoryData.prices;
    if (prices?.length) {
      const step = Math.max(1, Math.floor(prices.length / 60));
      const sliced = prices.filter((_, i) => i % step === 0);
      const labels = sliced.map(([ts]) => formatDateLabel(ts, lastHistoryDays));
      const values = sliced.map(([, price]) => price);
      Charts.updateAnalyticsLine(labels, values);
    }

    // Donut chart (portfolio split, same as Overview)
    const totalMcap = lastMarketData.reduce(
      (sum, c) => sum + (c.market_cap || 0),
      0,
    );
    const donutLabels = lastMarketData.map((c) => c.name);
    const donutPercents = lastMarketData.map(
      (c) => (c.market_cap / totalMcap) * 100,
    );
    Charts.updateAnalyticsDonut(donutLabels, donutPercents);

    // Bar chart (volume by asset, same as Overview)
    const barLabels = lastMarketData.map(
      (c) => COIN_LABELS[c.id] || c.symbol.toUpperCase(),
    );
    const barVolumes = lastMarketData.map((c) => c.total_volume || 0);
    Charts.updateAnalyticsBar(barLabels, barVolumes);
  }

  // ──────────────────────────────────────────────────────────
  // RE-RENDER LINE ONLY  (when filter changes coin/range)
  // ──────────────────────────────────────────────────────────
  async function reloadLine(days, coin) {
    try {
      // Show line loading spinner again
      const loading = document.getElementById("line-loading");
      const canvas = document.getElementById("line-chart");
      if (loading) {
        loading.style.display = "flex";
        loading.style.opacity = "1";
      }
      if (canvas) canvas.classList.add("opacity-0");

      const historyData = await fetchPriceHistory(coin, days);
      populateLine(historyData, days);
    } catch (err) {
      console.error("[API] reloadLine failed:", err);
      UI.showError("Could not refresh chart data.");
    }
  }

  // ──────────────────────────────────────────────────────────
  // FORMAT HELPERS
  // ──────────────────────────────────────────────────────────

  function formatLargeNumber(n, prefix = "") {
    if (n >= 1e12) return prefix + (n / 1e12).toFixed(2) + "T";
    if (n >= 1e9) return prefix + (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return prefix + (n / 1e6).toFixed(2) + "M";
    return prefix + n.toLocaleString();
  }

  function formatCompact(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
    return String(n);
  }

  function formatDateLabel(timestamp, days) {
    const date = new Date(timestamp);
    if (days <= 7)
      return date.toLocaleDateString("en-US", { weekday: "short" });
    if (days <= 30)
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function getLastData() {
    return lastMarketData;
  }

  // ── Public API ─────────────────────────────────────────────
  return { load, reloadLine, getLastData, populateAnalytics };
})();
