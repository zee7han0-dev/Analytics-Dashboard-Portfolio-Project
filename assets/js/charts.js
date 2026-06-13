/* ============================================================
   CHARTS.JS  —  All Chart.js visualizations
   - Line chart  : revenue over time (time-series from API)
   - Bar chart   : volume by asset (24h comparison)
   - Donut chart : portfolio split (market cap %)
   - Re-skins on theme change via 'themechange' event
   - Exposes Charts.update*() for api.js / filters.js to call
   ============================================================ */

const Charts = (() => {
  // ── Chart instances ────────────────────────────────────────
  let lineChart = null;
  let barChart = null;
  let donutChart = null;
  let analyticsLineChart = null;
  let analyticsDonutChart = null;
  let analyticsBarChart = null;

  // ── Theme-aware color palette ──────────────────────────────
  function palette() {
    const dark = document.documentElement.classList.contains("dark");
    return {
      grid: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
      tickColor: dark ? "#71717a" : "#a1a1aa",
      tooltipBg: dark ? "#18181b" : "#ffffff",
      tooltipBorder: dark ? "#3f3f46" : "#e4e4e7",
      tooltipText: dark ? "#f4f4f5" : "#18181b",
      cardBg: dark ? "#18181b" : "#ffffff",

      // Brand colors (theme-independent)
      indigo: "#6366f1",
      sky: "#38bdf8",
      violet: "#a78bfa",
      emerald: "#34d399",
      rose: "#fb7185",
      amber: "#fbbf24",
    };
  }

  // ── Shared Chart.js defaults ───────────────────────────────
  function applyGlobalDefaults() {
    const p = palette();
    Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = p.tickColor;
    Chart.defaults.plugins.tooltip.backgroundColor = p.tooltipBg;
    Chart.defaults.plugins.tooltip.borderColor = p.tooltipBorder;
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.titleColor = p.tooltipText;
    Chart.defaults.plugins.tooltip.bodyColor = p.tooltipText;
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.legend.display = false;
  }

  // ──────────────────────────────────────────────────────────
  // LINE CHART
  // ──────────────────────────────────────────────────────────
  function initLine() {
    const ctx = document.getElementById("line-chart");
    if (!ctx) return;
    const p = palette();

    lineChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Price (USD)",
            data: [],
            borderColor: p.indigo,
            backgroundColor: createGradient(ctx, p.indigo),
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: p.indigo,
            pointHoverBorderColor: "#fff",
            pointHoverBorderWidth: 2,
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                ` $${Number(ctx.parsed.y).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: p.grid, drawBorder: false },
            ticks: {
              color: p.tickColor,
              maxTicksLimit: 8,
              maxRotation: 0,
            },
            border: { display: false },
          },
          y: {
            grid: { color: p.grid, drawBorder: false },
            ticks: {
              color: p.tickColor,
              callback: (v) =>
                "$" + (v >= 1000 ? (v / 1000).toFixed(1) + "k" : v),
            },
            border: { display: false },
          },
        },
        animation: { duration: 600, easing: "easeInOutQuart" },
      },
    });
  }

  // ──────────────────────────────────────────────────────────
  // BAR CHART
  // ──────────────────────────────────────────────────────────
  function initBar() {
    const ctx = document.getElementById("bar-chart");
    if (!ctx) return;
    const p = palette();

    barChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: [],
        datasets: [
          {
            label: "24h Volume (USD)",
            data: [],
            backgroundColor: [
              p.indigo + "cc",
              p.sky + "cc",
              p.violet + "cc",
              p.emerald + "cc",
              p.rose + "cc",
              p.amber + "cc",
            ],
            borderColor: [
              p.indigo,
              p.sky,
              p.violet,
              p.emerald,
              p.rose,
              p.amber,
            ],
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` $${(ctx.parsed.y / 1e9).toFixed(2)}B`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: p.tickColor },
            border: { display: false },
          },
          y: {
            grid: { color: p.grid, drawBorder: false },
            ticks: {
              color: p.tickColor,
              callback: (v) => "$" + (v / 1e9).toFixed(0) + "B",
            },
            border: { display: false },
          },
        },
        animation: { duration: 500, easing: "easeOutQuart" },
      },
    });
  }

  // ──────────────────────────────────────────────────────────
  // DONUT CHART
  // ──────────────────────────────────────────────────────────
  function initDonut() {
    const ctx = document.getElementById("donut-chart");
    if (!ctx) return;
    const p = palette();

    donutChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: [
              p.indigo,
              p.sky,
              p.violet,
              p.emerald,
              p.rose,
              p.amber,
            ],
            borderColor: "transparent",
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "72%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.parsed.toFixed(1)}%`,
            },
          },
        },
        animation: { duration: 700, easing: "easeInOutQuart" },
      },
    });
  }
  // ──────────────────────────────────────────────────────────
  // ANALYTICS — LARGE LINE CHART
  // ──────────────────────────────────────────────────────────
  function initAnalyticsLine() {
    const ctx = document.getElementById("analytics-line-chart");
    if (!ctx) return;
    const p = palette();

    analyticsLineChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Price (USD)",
            data: [],
            borderColor: p.indigo,
            backgroundColor: createGradient(ctx, p.indigo),
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: p.indigo,
            pointHoverBorderColor: "#fff",
            pointHoverBorderWidth: 2,
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                ` $${Number(ctx.parsed.y).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: p.grid, drawBorder: false },
            ticks: { color: p.tickColor, maxTicksLimit: 10, maxRotation: 0 },
            border: { display: false },
          },
          y: {
            grid: { color: p.grid, drawBorder: false },
            ticks: {
              color: p.tickColor,
              callback: (v) =>
                "$" + (v >= 1000 ? (v / 1000).toFixed(1) + "k" : v),
            },
            border: { display: false },
          },
        },
        animation: { duration: 600, easing: "easeInOutQuart" },
      },
    });
  }

  // ──────────────────────────────────────────────────────────
  // ANALYTICS — DONUT CHART
  // ──────────────────────────────────────────────────────────
  function initAnalyticsDonut() {
    const ctx = document.getElementById("analytics-donut-chart");
    if (!ctx) return;
    const p = palette();

    analyticsDonutChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: [
              p.indigo,
              p.sky,
              p.violet,
              p.emerald,
              p.rose,
              p.amber,
            ],
            borderColor: "transparent",
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: "72%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.parsed.toFixed(1)}%`,
            },
          },
        },
        animation: { duration: 700, easing: "easeInOutQuart" },
      },
    });
  }

  // ──────────────────────────────────────────────────────────
  // ANALYTICS — BAR CHART
  // ──────────────────────────────────────────────────────────
  function initAnalyticsBar() {
    const ctx = document.getElementById("analytics-bar-chart");
    if (!ctx) return;
    const p = palette();

    analyticsBarChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: [],
        datasets: [
          {
            label: "24h Volume (USD)",
            data: [],
            backgroundColor: [
              p.indigo + "cc",
              p.sky + "cc",
              p.violet + "cc",
              p.emerald + "cc",
              p.rose + "cc",
              p.amber + "cc",
            ],
            borderColor: [
              p.indigo,
              p.sky,
              p.violet,
              p.emerald,
              p.rose,
              p.amber,
            ],
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` $${(ctx.parsed.y / 1e9).toFixed(2)}B`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: p.tickColor },
            border: { display: false },
          },
          y: {
            grid: { color: p.grid, drawBorder: false },
            ticks: {
              color: p.tickColor,
              callback: (v) => "$" + (v / 1e9).toFixed(0) + "B",
            },
            border: { display: false },
          },
        },
        animation: { duration: 500, easing: "easeOutQuart" },
      },
    });
  }

  // ──────────────────────────────────────────────────────────
  // GRADIENT helper for line chart fill
  // ──────────────────────────────────────────────────────────
  function createGradient(ctx, color) {
    const gradient = ctx.getContext("2d").createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, color + "33"); // 20% opacity at top
    gradient.addColorStop(1, color + "00"); // 0%  opacity at bottom
    return gradient;
  }

  // ──────────────────────────────────────────────────────────
  // UPDATE FUNCTIONS  (called by api.js after data loads)
  // ──────────────────────────────────────────────────────────

  /**
   * updateLine(labels[], prices[])
   * labels : ['Jan 1', 'Jan 2', ...]
   * prices : [42000, 43200, ...]
   */
  function updateLine(labels, prices) {
    if (!lineChart) return;
    lineChart.data.labels = labels;
    lineChart.data.datasets[0].data = prices;
    lineChart.update("active");

    // Reveal canvas, hide loader
    revealChart("line-chart", "line-loading");
  }

  /**
   * updateBar(labels[], volumes[])
   * labels  : ['BTC', 'ETH', ...]
   * volumes : [38000000000, ...]
   */
  function updateBar(labels, volumes) {
    if (!barChart) return;
    barChart.data.labels = labels;
    barChart.data.datasets[0].data = volumes;
    barChart.update("active");

    revealChart("bar-chart", "bar-loading");
  }

  /**
   * updateDonut(labels[], percentages[])
   * labels      : ['Bitcoin', 'Ethereum', ...]
   * percentages : [45.2, 18.7, ...]
   */
  function updateDonut(labels, percentages) {
    if (!donutChart) return;
    donutChart.data.labels = labels;
    donutChart.data.datasets[0].data = percentages;
    donutChart.update("active");

    revealChart("donut-chart", "donut-loading");
    renderDonutLegend(labels, percentages);

    // Force resize after layout fully settles
    setTimeout(() => {
      donutChart.resize();
    }, 350);
  }

  /**
   * updateAnalyticsLine(labels[], prices[])
   */
  function updateAnalyticsLine(labels, prices) {
    if (!analyticsLineChart) return;
    analyticsLineChart.data.labels = labels;
    analyticsLineChart.data.datasets[0].data = prices;
    analyticsLineChart.update("active");
    revealChart("analytics-line-chart", "analytics-line-loading");
  }

  /**
   * updateAnalyticsDonut(labels[], percentages[])
   */
  function updateAnalyticsDonut(labels, percentages) {
    if (!analyticsDonutChart) return;
    analyticsDonutChart.data.labels = labels;
    analyticsDonutChart.data.datasets[0].data = percentages;
    analyticsDonutChart.update("active");
    revealChart("analytics-donut-chart", "analytics-donut-loading");
    renderDonutLegend(labels, percentages, "analytics-donut-legend");
  }

  /**
   * updateAnalyticsBar(labels[], volumes[])
   */
  function updateAnalyticsBar(labels, volumes) {
    if (!analyticsBarChart) return;
    analyticsBarChart.data.labels = labels;
    analyticsBarChart.data.datasets[0].data = volumes;
    analyticsBarChart.update("active");
    revealChart("analytics-bar-chart", "analytics-bar-loading");
  }

  /**
   * initAnalyticsCharts — called once when Analytics view first opens
   */
  function initAnalyticsCharts() {
    if (!analyticsLineChart) initAnalyticsLine();
    if (!analyticsDonutChart) initAnalyticsDonut();
    if (!analyticsBarChart) initAnalyticsBar();
  }

  // ──────────────────────────────────────────────────────────
  // DONUT LEGEND  (custom HTML legend below chart)
  // ──────────────────────────────────────────────────────────
  function renderDonutLegend(
    labels,
    percentages,
    containerId = "donut-legend",
  ) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const p = palette();
    const colors = [p.indigo, p.sky, p.violet, p.emerald, p.rose, p.amber];

    container.innerHTML = labels
      .map(
        (label, i) => `
      <div class="flex items-center justify-between text-xs">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background:${colors[i]}"></span>
          <span class="text-zinc-400 truncate max-w-[120px]">${label}</span>
        </div>
        <span class="font-semibold text-zinc-100 dark:text-zinc-100 ml-2">${percentages[i].toFixed(1)}%</span>
      </div>
    `,
      )
      .join("");
  }

  // ──────────────────────────────────────────────────────────
  // REVEAL  — fades in canvas, hides loading overlay
  // ──────────────────────────────────────────────────────────
  function revealChart(canvasId, loadingId) {
    const canvas = document.getElementById(canvasId);
    const loading = document.getElementById(loadingId);
    if (canvas) canvas.classList.remove("opacity-0");
    if (loading) {
      loading.style.opacity = "0";
      setTimeout(() => (loading.style.display = "none"), 300);
    }
  }

  // ──────────────────────────────────────────────────────────
  // THEME RESKIN  — called when user toggles dark/light
  // ──────────────────────────────────────────────────────────
  function reskin() {
    applyGlobalDefaults();
    const p = palette();

    if (lineChart) {
      lineChart.options.scales.x.grid.color = p.grid;
      lineChart.options.scales.x.ticks.color = p.tickColor;
      lineChart.options.scales.y.grid.color = p.grid;
      lineChart.options.scales.y.ticks.color = p.tickColor;
      lineChart.update("none");
    }

    if (barChart) {
      barChart.options.scales.x.ticks.color = p.tickColor;
      barChart.options.scales.y.grid.color = p.grid;
      barChart.options.scales.y.ticks.color = p.tickColor;
      barChart.update("none");
    }

    if (analyticsLineChart) {
      analyticsLineChart.options.scales.x.grid.color = p.grid;
      analyticsLineChart.options.scales.x.ticks.color = p.tickColor;
      analyticsLineChart.options.scales.y.grid.color = p.grid;
      analyticsLineChart.options.scales.y.ticks.color = p.tickColor;
      analyticsLineChart.update("none");
    }

    if (analyticsBarChart) {
      analyticsBarChart.options.scales.x.ticks.color = p.tickColor;
      analyticsBarChart.options.scales.y.grid.color = p.grid;
      analyticsBarChart.options.scales.y.ticks.color = p.tickColor;
      analyticsBarChart.update("none");
    }

    if (analyticsDonutChart && analyticsDonutChart.data.labels.length) {
      renderDonutLegend(
        analyticsDonutChart.data.labels,
        analyticsDonutChart.data.datasets[0].data,
        "analytics-donut-legend",
      );
    }

    // Re-render donut legend with new text colors
    if (donutChart && donutChart.data.labels.length) {
      renderDonutLegend(
        donutChart.data.labels,
        donutChart.data.datasets[0].data,
      );
    }
  }

  // ──────────────────────────────────────────────────────────
  // INIT
  // ──────────────────────────────────────────────────────────
  function init() {
    applyGlobalDefaults();
    initLine();
    initBar();
    initDonut();

    // Re-skin charts when theme toggles
    document.addEventListener("themechange", reskin);
  }

  // ── Public API ─────────────────────────────────────────────
  return {
    init,
    updateLine,
    updateBar,
    updateDonut,
    initAnalyticsCharts,
    updateAnalyticsLine,
    updateAnalyticsDonut,
    updateAnalyticsBar,
  };
})();

document.addEventListener("DOMContentLoaded", Charts.init);
