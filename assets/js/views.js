/* ============================================================
   VIEWS.JS  —  Section content swapping
   - Builds Settings and Reports views once, lazily
   - show(section) toggles visibility of #view-* containers
   - Keeps overview's charts/data untouched
   ============================================================ */

const Views = (() => {
  const BUILT = new Set(["overview"]); // tracks which views have been rendered

  // ──────────────────────────────────────────────────────────
  // SETTINGS VIEW
  // ──────────────────────────────────────────────────────────
  function buildSettings() {
    const container = document.getElementById("view-settings");
    if (!container) return;

    const user = Auth.getUser();

    container.innerHTML = `
      <div class="max-w-2xl space-y-6">

        <!-- Profile section -->
        <div class="chart-card">
          <div class="chart-card__header pb-4">
            <div>
              <h2 class="chart-card__title">Profile</h2>
              <p class="chart-card__subtitle">Update your personal information</p>
            </div>
          </div>
          <div class="px-5 pb-5 space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="settings-label">Full name</label>
                <input type="text" value="${user.name}" class="settings-input" ${user.isSignedIn ? "" : "disabled"} />
              </div>
              <div>
                <label class="settings-label">Email</label>
                <input type="email" value="${user.email}" class="settings-input" ${user.isSignedIn ? "" : "disabled"} />
              </div>
            </div>
            <div>
              <label class="settings-label">Role</label>
              <input type="text" value="${user.role}" class="settings-input" ${user.isSignedIn ? "" : "disabled"} />
            </div>
            ${!user.isSignedIn ? '<p class="text-xs text-amber-400">Sign in to edit your profile information.</p>' : ""}
            <button class="settings-save-btn" data-action="save-profile">
              Save changes
            </button>
          </div>
        </div>

        <!-- Preferences section -->
        <div class="chart-card">
          <div class="chart-card__header pb-4">
            <div>
              <h2 class="chart-card__title">Preferences</h2>
              <p class="chart-card__subtitle">Manage how Pulse notifies you</p>
            </div>
          </div>
          <div class="px-5 pb-5 space-y-1">
            ${toggleRow("Email notifications", "Get a summary of account activity by email", true)}
            ${toggleRow("Price alerts", "Notify me when watched assets move sharply", true)}
            ${toggleRow("Weekly reports", "Send a performance digest every Monday", false)}
            ${toggleRow("Two-factor authentication", "Require a code in addition to your password", false)}
          </div>
        </div>

      </div>
    `;

    // Wire up toggle switches
    container.querySelectorAll(".settings-toggle").forEach((toggle) => {
      toggle.addEventListener("click", () => {
        const active = toggle.dataset.active === "true";
        toggle.dataset.active = String(!active);
        toggle.classList.toggle("settings-toggle--on", !active);
      });
    });

    // Wire up save button
    container
      .querySelector('[data-action="save-profile"]')
      ?.addEventListener("click", () => {
        const inputs = container.querySelectorAll(".settings-input");
        const [nameInput, emailInput, roleInput] = inputs;

        Auth.setUser({
          name: nameInput.value.trim() || Auth.getUser().name,
          email: emailInput.value.trim() || Auth.getUser().email,
          role: roleInput.value.trim() || Auth.getUser().role,
        });

        UI.showNotification("Profile updated successfully", "success");
      });
  }

  function refreshSettings() {
    BUILT.delete("settings");
    const container = document.getElementById("view-settings");
    if (container && !container.classList.contains("hidden")) {
      buildSettings();
      BUILT.add("settings");
      lucide.createIcons();
    }
    // If hidden, just clear BUILT so it rebuilds next time it's opened
  }

  function toggleRow(title, desc, active) {
    return `
      <div class="settings-row">
        <div>
          <p class="settings-row__title">${title}</p>
          <p class="settings-row__desc">${desc}</p>
        </div>
        <button
          class="settings-toggle ${active ? "settings-toggle--on" : ""}"
          data-active="${active}"
        >
          <span class="settings-toggle__dot"></span>
        </button>
      </div>
    `;
  }

  // ──────────────────────────────────────────────────────────
  // REPORTS VIEW  (transaction table)
  // ──────────────────────────────────────────────────────────
  function buildReports() {
    const container = document.getElementById("view-reports");
    if (!container) return;

    const rows = [
      {
        id: "#TXN-7821",
        date: "Jun 11, 2026",
        asset: "Bitcoin",
        amount: "$2,450.00",
        status: "Completed",
      },
      {
        id: "#TXN-7820",
        date: "Jun 11, 2026",
        asset: "Ethereum",
        amount: "$890.50",
        status: "Completed",
      },
      {
        id: "#TXN-7819",
        date: "Jun 10, 2026",
        asset: "Solana",
        amount: "$320.00",
        status: "Pending",
      },
      {
        id: "#TXN-7818",
        date: "Jun 10, 2026",
        asset: "Bitcoin",
        amount: "$1,120.75",
        status: "Completed",
      },
      {
        id: "#TXN-7817",
        date: "Jun 09, 2026",
        asset: "Ethereum",
        amount: "$455.20",
        status: "Failed",
      },
      {
        id: "#TXN-7816",
        date: "Jun 09, 2026",
        asset: "Solana",
        amount: "$210.00",
        status: "Completed",
      },
      {
        id: "#TXN-7815",
        date: "Jun 08, 2026",
        asset: "Bitcoin",
        amount: "$3,800.00",
        status: "Completed",
      },
    ];

    const statusStyles = {
      Completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
      Pending: "bg-amber-500/15 text-amber-400 border-amber-500/20",
      Failed: "bg-rose-500/15 text-rose-400 border-rose-500/20",
    };

    container.innerHTML = `
      <div class="chart-card overflow-hidden">
        <div class="chart-card__header pb-4">
          <div>
            <h2 class="chart-card__title">Recent Transactions</h2>
            <p class="chart-card__subtitle">${rows.length} transactions this week</p>
          </div>
        </div>
        <div class="overflow-x-auto px-1 pb-2">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-zinc-500 uppercase tracking-wider">
                <th class="px-4 py-2.5 font-medium">Transaction</th>
                <th class="px-4 py-2.5 font-medium">Date</th>
                <th class="px-4 py-2.5 font-medium">Asset</th>
                <th class="px-4 py-2.5 font-medium">Amount</th>
                <th class="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (r) => `
                <tr class="report-row">
                  <td class="px-4 py-3 font-medium">${r.id}</td>
                  <td class="px-4 py-3 text-zinc-400">${r.date}</td>
                  <td class="px-4 py-3 text-zinc-400">${r.asset}</td>
                  <td class="px-4 py-3 text-zinc-500 dark:text-zinc-200 font-medium">${r.amount}</td>
                  <td class="px-4 py-3">
                    <span class="report-status ${statusStyles[r.status]}">${r.status}</span>
                  </td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ──────────────────────────────────────────────────────────
  // ANALYTICS VIEW
  // ──────────────────────────────────────────────────────────
  function buildAnalytics() {
    const container = document.getElementById("view-analytics");
    if (!container) return;

    container.innerHTML = `
      <div class="space-y-4">

        <!-- Big line chart -->
        <div class="chart-card">
          <div class="chart-card__header">
            <div>
              <h2 class="chart-card__title">Price Trend</h2>
              <p class="chart-card__subtitle">Detailed historical performance</p>
            </div>
          </div>
          <div class="chart-card__body h-[360px]">
            <div id="analytics-line-loading" class="chart-loading">
              <div class="flex flex-col items-center gap-2 text-zinc-500">
                <i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>
              </div>
            </div>
            <canvas id="analytics-line-chart" class="opacity-0 transition-opacity duration-500"></canvas>
          </div>
        </div>

        <!-- Donut + Bar row -->
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div class="chart-card lg:col-span-2">
            <div class="chart-card__header">
              <div>
                <h2 class="chart-card__title">Portfolio Split</h2>
                <p class="chart-card__subtitle">Asset distribution</p>
              </div>
            </div>
            <div class="chart-card__body flex items-center justify-center">
              <div id="analytics-donut-loading" class="chart-loading">
                <div class="flex flex-col items-center gap-2 text-zinc-500">
                  <i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>
                </div>
              </div>
              <canvas id="analytics-donut-chart" class="opacity-0 transition-opacity duration-500 max-w-[240px]"></canvas>
            </div>
            <div id="analytics-donut-legend" class="px-5 pb-5 grid grid-cols-1 gap-1.5 mt-2"></div>
          </div>

          <div class="chart-card lg:col-span-3">
            <div class="chart-card__header">
              <div>
                <h2 class="chart-card__title">Volume by Asset</h2>
                <p class="chart-card__subtitle">24h trading volume comparison</p>
              </div>
            </div>
            <div class="chart-card__body">
              <div id="analytics-bar-loading" class="chart-loading">
                <div class="flex flex-col items-center gap-2 text-zinc-500">
                  <i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>
                </div>
              </div>
              <canvas id="analytics-bar-chart" class="opacity-0 transition-opacity duration-500"></canvas>
            </div>
          </div>
        </div>

      </div>
    `;

    // Initialize chart instances (only once), then populate from cached data
    Charts.initAnalyticsCharts();
    API.populateAnalytics();
  }

  // ──────────────────────────────────────────────────────────
  // CUSTOMERS VIEW
  // ──────────────────────────────────────────────────────────
  function buildCustomers() {
    const container = document.getElementById("view-customers");
    if (!container) return;

    const customers = [
      {
        name: "Sarah Chen",
        email: "sarah.chen@vertex.io",
        plan: "Enterprise",
        status: "Active",
        spend: "$4,820.00",
        initials: "SC",
        color: "bg-indigo-500",
      },
      {
        name: "Marcus Lee",
        email: "marcus@brightloop.com",
        plan: "Pro",
        status: "Active",
        spend: "$1,240.00",
        initials: "ML",
        color: "bg-sky-500",
      },
      {
        name: "Aisha Khan",
        email: "aisha.khan@nimbus.dev",
        plan: "Pro",
        status: "Active",
        spend: "$980.50",
        initials: "AK",
        color: "bg-violet-500",
      },
      {
        name: "David Romero",
        email: "d.romero@flux.systems",
        plan: "Starter",
        status: "Trial",
        spend: "$0.00",
        initials: "DR",
        color: "bg-emerald-500",
      },
      {
        name: "Priya Patel",
        email: "priya@northstar.io",
        plan: "Enterprise",
        status: "Active",
        spend: "$6,150.00",
        initials: "PP",
        color: "bg-rose-500",
      },
      {
        name: "Tom Becker",
        email: "tom.becker@orbitlabs.com",
        plan: "Pro",
        status: "Inactive",
        spend: "$320.00",
        initials: "TB",
        color: "bg-amber-500",
      },
      {
        name: "Lena Fischer",
        email: "lena@meridiantech.de",
        plan: "Starter",
        status: "Active",
        spend: "$145.00",
        initials: "LF",
        color: "bg-indigo-500",
      },
      {
        name: "Carlos Mendes",
        email: "carlos@datapulse.com.br",
        plan: "Pro",
        status: "Active",
        spend: "$1,890.00",
        initials: "CM",
        color: "bg-sky-500",
      },
    ];

    const statusStyles = {
      Active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
      Trial: "bg-amber-500/15 text-amber-400 border-amber-500/20",
      Inactive: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
    };

    container.innerHTML = `
      <div class="space-y-4">

        <!-- Summary cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <div class="kpi-card">
            <div class="kpi-card__header">
              <span class="kpi-card__label">Total Customers</span>
              <div class="kpi-card__icon bg-indigo-500/10 text-indigo-400">
                <i data-lucide="users" class="w-3.5 h-3.5"></i>
              </div>
            </div>
            <div class="kpi-card__value">${customers.length}</div>
            <div class="kpi-card__trend"><span class="text-emerald-400 text-xs font-medium">+2 this month</span></div>
          </div>
          <div class="kpi-card">
            <div class="kpi-card__header">
              <span class="kpi-card__label">Active</span>
              <div class="kpi-card__icon bg-emerald-500/10 text-emerald-400">
                <i data-lucide="user-check" class="w-3.5 h-3.5"></i>
              </div>
            </div>
            <div class="kpi-card__value">${customers.filter((c) => c.status === "Active").length}</div>
            <div class="kpi-card__trend"><span class="text-zinc-500 text-xs">75% of total</span></div>
          </div>
          <div class="kpi-card">
            <div class="kpi-card__header">
              <span class="kpi-card__label">On Trial</span>
              <div class="kpi-card__icon bg-amber-500/10 text-amber-400">
                <i data-lucide="clock" class="w-3.5 h-3.5"></i>
              </div>
            </div>
            <div class="kpi-card__value">${customers.filter((c) => c.status === "Trial").length}</div>
            <div class="kpi-card__trend"><span class="text-zinc-500 text-xs">Ends in 7 days</span></div>
          </div>
          <div class="kpi-card">
            <div class="kpi-card__header">
              <span class="kpi-card__label">Total Spend</span>
              <div class="kpi-card__icon bg-violet-500/10 text-violet-400">
                <i data-lucide="dollar-sign" class="w-3.5 h-3.5"></i>
              </div>
            </div>
            <div class="kpi-card__value">$15.5k</div>
            <div class="kpi-card__trend"><span class="text-emerald-400 text-xs font-medium">+12.4%</span></div>
          </div>
        </div>

        <!-- Customer table -->
        <div class="chart-card overflow-hidden">
          <div class="chart-card__header pb-4">
            <div>
              <h2 class="chart-card__title">All Customers</h2>
              <p class="chart-card__subtitle">${customers.length} customers</p>
            </div>
          </div>
          <div class="overflow-x-auto px-1 pb-2">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-zinc-500 uppercase tracking-wider">
                  <th class="px-4 py-2.5 font-medium">Customer</th>
                  <th class="px-4 py-2.5 font-medium">Plan</th>
                  <th class="px-4 py-2.5 font-medium">Status</th>
                  <th class="px-4 py-2.5 font-medium">Total Spend</th>
                </tr>
              </thead>
              <tbody>
                ${customers
                  .map(
                    (c) => `
                  <tr class="report-row">
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full ${c.color} flex items-center justify-center text-xs font-semibold text-white shrink-0">${c.initials}</div>
                        <div class="min-w-0">
                          <p class="font-medium text-zinc-500 dark:text-zinc-100 truncate">${c.name}</p>
                          <p class="text-xs text-zinc-500 truncate">${c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-zinc-400">${c.plan}</td>
                    <td class="px-4 py-3">
                      <span class="report-status ${statusStyles[c.status]}">${c.status}</span>
                    </td>
                    <td class="px-4 py-3 text-zinc-400 dark:text-zinc-200 font-medium">${c.spend}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  }

  // ──────────────────────────────────────────────────────────
  // INTEGRATIONS VIEW
  // ──────────────────────────────────────────────────────────
  function buildIntegrations() {
    const container = document.getElementById("view-integrations");
    if (!container) return;

    const integrations = [
      {
        name: "Slack",
        desc: "Get real-time alerts in your team channels",
        icon: "message-square",
        color: "bg-violet-500/15 text-violet-400",
        connected: true,
      },
      {
        name: "Stripe",
        desc: "Sync payment and revenue data automatically",
        icon: "credit-card",
        color: "bg-indigo-500/15 text-indigo-400",
        connected: true,
      },
      {
        name: "Zapier",
        desc: "Automate workflows across 5,000+ apps",
        icon: "zap",
        color: "bg-amber-500/15 text-amber-400",
        connected: false,
      },
      {
        name: "Google Sheets",
        desc: "Export reports directly to spreadsheets",
        icon: "sheet",
        color: "bg-emerald-500/15 text-emerald-400",
        connected: false,
      },
      {
        name: "Notion",
        desc: "Push weekly summaries to your workspace",
        icon: "file-text",
        color: "bg-zinc-500/15 text-zinc-400",
        connected: false,
      },
      {
        name: "Discord",
        desc: "Send price alerts to a Discord channel",
        icon: "message-circle",
        color: "bg-sky-500/15 text-sky-400",
        connected: false,
      },
    ];

    container.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${integrations
          .map(
            (i) => `
          <div class="chart-card p-5 flex flex-col gap-3">
            <div class="flex items-start justify-between">
              <div class="kpi-card__icon ${i.color} w-9 h-9">
                <i data-lucide="${i.icon}" class="w-4 h-4"></i>
              </div>
              <button
                class="integration-toggle ${i.connected ? "integration-toggle--on" : ""}"
                data-active="${i.connected}"
                data-name="${i.name}"
              >
                <span class="settings-toggle__dot"></span>
              </button>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-zinc-500 dark:text-zinc-100">${i.name}</h3>
              <p class="text-xs text-zinc-500 mt-1 leading-relaxed">${i.desc}</p>
            </div>
            <span class="text-xs font-medium ${i.connected ? "text-emerald-400" : "text-zinc-500"}">
              ${i.connected ? "Connected" : "Not connected"}
            </span>
          </div>
        `,
          )
          .join("")}
      </div>
    `;

    // Wire up integration toggles
    container.querySelectorAll(".integration-toggle").forEach((toggle) => {
      toggle.addEventListener("click", () => {
        const active = toggle.dataset.active === "true";
        const name = toggle.dataset.name;
        toggle.dataset.active = String(!active);
        toggle.classList.toggle("integration-toggle--on", !active);

        const statusEl = toggle
          .closest(".chart-card")
          ?.querySelector("span.text-xs.font-medium");
        if (statusEl) {
          statusEl.textContent = !active ? "Connected" : "Not connected";
          statusEl.classList.toggle("text-emerald-400", !active);
          statusEl.classList.toggle("text-zinc-500", active);
        }

        UI.showNotification(
          !active ? `${name} connected successfully` : `${name} disconnected`,
          !active ? "success" : "info",
        );
      });
    });
  }

  // ──────────────────────────────────────────────────────────
  // PROFILE VIEW  (read-only)
  // ──────────────────────────────────────────────────────────
  function buildProfile() {
    const container = document.getElementById("view-profile");
    if (!container) return;

    const user = Auth.getUser();

    container.innerHTML = `
      <div class="max-w-md">
        <div class="chart-card">
          <div class="chart-card__header pb-4">
            <div>
              <h2 class="chart-card__title">Profile</h2>
              <p class="chart-card__subtitle">Your account details</p>
            </div>
          </div>
          <div class="px-5 pb-6 flex flex-col items-center text-center gap-3">
            <div class="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-xl font-semibold text-white" data-profile-initials>
              ${user.initials}
            </div>
            <div>
              <p class="text-base font-semibold text-zinc-500 dark:text-zinc-100" data-profile-name>${user.name}</p>
              <p class="text-sm text-zinc-500 mt-0.5" data-profile-role>${user.role}</p>
            </div>
            <div class="w-full pt-4 border-t border-zinc-800 space-y-3 text-left">
              <div class="flex items-center justify-between text-sm">
                <span class="text-zinc-500">Email</span>
                <span class="text-zinc-500 dark:text-zinc-100 font-medium" data-profile-email>${user.email}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-zinc-500">Role</span>
                <span class="text-zinc-500 dark:text-zinc-100 font-medium" data-profile-role-2>${user.role}</span>
              </div>
            </div>
            <p class="text-xs text-zinc-500 pt-2">
              To update your information, go to
              <button class="text-indigo-400 hover:text-indigo-300 transition-colors font-medium" data-action="go-settings">Settings</button>
            </p>
          </div>
        </div>
      </div>
    `;

    container
      .querySelector('[data-action="go-settings"]')
      ?.addEventListener("click", () => {
        document.querySelector('.nav-link[data-section="settings"]')?.click();
      });
  }

  function refreshProfile() {
    const container = document.getElementById("view-profile");
    if (!container || !BUILT.has("profile")) return;

    const user = Auth.getUser();
    container
      .querySelector("[data-profile-initials]")
      ?.replaceChildren(user.initials);
    container.querySelector("[data-profile-name]")?.replaceChildren(user.name);
    container.querySelector("[data-profile-role]")?.replaceChildren(user.role);
    container
      .querySelector("[data-profile-email]")
      ?.replaceChildren(user.email);
    container
      .querySelector("[data-profile-role-2]")
      ?.replaceChildren(user.role);
  }

  // ──────────────────────────────────────────────────────────
  // SHOW  — toggles which view container is visible
  // ──────────────────────────────────────────────────────────
  function show(section) {
    const views = {
      overview: "view-overview",
      analytics: "view-analytics",
      settings: "view-settings",
      reports: "view-reports",
      customers: "view-customers",
      integrations: "view-integrations",
      profile: "view-profile",
    };

    // Lazily build views on first visit
    if (section === "settings" && !BUILT.has("settings")) {
      buildSettings();
      BUILT.add("settings");
    }
    if (section === "reports" && !BUILT.has("reports")) {
      buildReports();
      BUILT.add("reports");
    }
    if (section === "analytics" && !BUILT.has("analytics")) {
      buildAnalytics();
      BUILT.add("analytics");
    }
    if (section === "customers" && !BUILT.has("customers")) {
      buildCustomers();
      BUILT.add("customers");
    }
    if (section === "integrations" && !BUILT.has("integrations")) {
      buildIntegrations();
      BUILT.add("integrations");
    }
    if (section === "profile" && !BUILT.has("profile")) {
      buildProfile();
      BUILT.add("profile");
    }

    // Hide all, show target
    Object.entries(views).forEach(([key, id]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.toggle("hidden", key !== section);
    });

    lucide.createIcons();
  }

  return { show, refreshProfile, refreshSettings };
})();
