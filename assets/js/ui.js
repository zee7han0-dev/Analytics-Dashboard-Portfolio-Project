/* ============================================================
   UI.JS  —  UI helpers, micro-interactions & notifications
   - setLoading()       : refresh button spin + global state
   - showNotification() : toast messages (success / error / info)
   - showError()        : error state on cards
   - Notifications panel toggle & population
   - User dropdown toggle
   - Search filtering
   - Export chart data as CSV
   ============================================================ */

const UI = (() => {
  // ── State ──────────────────────────────────────────────────
  let toastTimer = null;
  const notifications = [
    {
      id: 1,
      text: "Bitcoin crossed $70K resistance",
      time: "2m ago",
      read: false,
      type: "up",
    },
    {
      id: 2,
      text: "Portfolio up 3.2% today",
      time: "14m ago",
      read: false,
      type: "up",
    },
    {
      id: 3,
      text: "Solana volume spike detected",
      time: "1h ago",
      read: true,
      type: "info",
    },
    {
      id: 4,
      text: "Ethereum gas fees normalized",
      time: "3h ago",
      read: true,
      type: "info",
    },
  ];

  // ──────────────────────────────────────────────────────────
  // LOADING STATE  (refresh button)
  // ──────────────────────────────────────────────────────────
  function setLoading(state) {
    const btn = document.getElementById("refresh-btn");
    const icon = document.getElementById("refresh-icon");
    if (!btn || !icon) return;

    if (state) {
      icon.classList.add("animate-spin");
      btn.disabled = true;
      btn.classList.add("opacity-50", "cursor-not-allowed");
    } else {
      icon.classList.remove("animate-spin");
      btn.disabled = false;
      btn.classList.remove("opacity-50", "cursor-not-allowed");

      // Brief "done" flash
      icon.classList.add("spin-once");
      setTimeout(() => icon.classList.remove("spin-once"), 600);
    }
  }

  // ──────────────────────────────────────────────────────────
  // TOAST NOTIFICATIONS
  // ──────────────────────────────────────────────────────────
  function showNotification(message, type = "info") {
    // Remove existing toast if any
    const existing = document.getElementById("toast");
    if (existing) existing.remove();
    if (toastTimer) clearTimeout(toastTimer);

    const colors = {
      success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
      error: "border-rose-500/30    bg-rose-500/10    text-rose-300",
      info: "border-indigo-500/30  bg-indigo-500/10  text-indigo-300",
    };

    const icons = {
      success: "check-circle",
      error: "alert-circle",
      info: "info",
    };

    const toast = document.createElement("div");
    toast.id = "toast";
    toast.className = `
      fixed bottom-6 right-6 z-50
      flex items-center gap-2.5
      px-4 py-3 rounded-xl
      border text-sm font-medium
      shadow-xl backdrop-blur-sm
      transition-all duration-300 translate-y-2 opacity-0
      ${colors[type] || colors.info}
    `;
    toast.innerHTML = `
      <i data-lucide="${icons[type] || "info"}" class="w-4 h-4 shrink-0"></i>
      <span>${message}</span>
    `;

    document.body.appendChild(toast);
    lucide.createIcons();

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove("translate-y-2", "opacity-0");
    });

    // Auto-dismiss after 3s
    toastTimer = setTimeout(() => {
      toast.classList.add("translate-y-2", "opacity-0");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ──────────────────────────────────────────────────────────
  // ERROR STATE
  // ──────────────────────────────────────────────────────────
  function showError(message = "Failed to load data") {
    showNotification(message, "error");

    // Put error state in KPI cards
    ["val-revenue", "val-users", "val-orders", "val-conversion"].forEach(
      (id) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<span class="text-zinc-500 text-base">—</span>';
      },
    );

    [
      "trend-revenue",
      "trend-users",
      "trend-orders",
      "trend-conversion",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el)
        el.innerHTML =
          '<span class="text-xs text-rose-400">Failed to load</span>';
    });
  }

  // ──────────────────────────────────────────────────────────
  // NOTIFICATIONS PANEL
  // ──────────────────────────────────────────────────────────
  function renderNotifications() {
    const list = document.getElementById("notif-list");
    if (!list) return;

    const typeColors = {
      up: "bg-emerald-500/15 text-emerald-400",
      down: "bg-rose-500/15    text-rose-400",
      info: "bg-indigo-500/15  text-indigo-400",
    };
    const typeIcons = {
      up: "trending-up",
      down: "trending-down",
      info: "info",
    };

    list.innerHTML = notifications
      .map(
        (n) => `
      <li class="notif-item ${n.read ? "" : "notif-item--unread"}" data-id="${n.id}">
        <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${typeColors[n.type] || typeColors.info}">
          <i data-lucide="${typeIcons[n.type] || "info"}" class="w-3.5 h-3.5"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-medium text-zinc-200 leading-snug">${n.text}</p>
          <p class="text-[11px] text-zinc-500 mt-0.5">${n.time}</p>
        </div>
        ${!n.read ? '<span class="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1"></span>' : ""}
      </li>
    `,
      )
      .join("");

    lucide.createIcons();
  }

  function toggleNotifPanel() {
    const panel = document.getElementById("notif-panel");
    if (!panel) return;
    const isHidden = panel.classList.contains("hidden");

    // Close other dropdowns first
    closeAllDropdowns();

    if (isHidden) {
      panel.classList.remove("hidden");
      renderNotifications();
    } else {
      panel.classList.add("hidden");
    }
  }

  function markAllRead() {
    notifications.forEach((n) => (n.read = true));
    // Hide badge
    const badge = document.getElementById("notif-badge");
    if (badge) badge.classList.add("hidden");
    renderNotifications();
    showNotification("All notifications marked as read", "success");
  }

  // ──────────────────────────────────────────────────────────
  // USER DROPDOWN
  // ──────────────────────────────────────────────────────────
  function toggleUserDropdown() {
    const dropdown = document.getElementById("user-dropdown");
    if (!dropdown) return;
    const isHidden = dropdown.classList.contains("hidden");

    closeAllDropdowns();

    if (isHidden) {
      dropdown.classList.remove("hidden");
      lucide.createIcons();
    } else {
      dropdown.classList.add("hidden");
    }
  }

  // ──────────────────────────────────────────────────────────
  // CLOSE ALL DROPDOWNS  (click-outside helper)
  // ──────────────────────────────────────────────────────────
  function closeAllDropdowns() {
    document.getElementById("notif-panel")?.classList.add("hidden");
    document.getElementById("user-dropdown")?.classList.add("hidden");
  }

  // ──────────────────────────────────────────────────────────
  // SIGN-IN MODAL
  // ──────────────────────────────────────────────────────────
  function openSignInModal() {
    const modal = document.getElementById("signin-modal");
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.classList.add("flex");

    const nameInput = document.getElementById("signin-name");
    const emailInput = document.getElementById("signin-email");
    if (nameInput) nameInput.value = "";
    if (emailInput) emailInput.value = "";
    nameInput?.focus();
  }

  function closeSignInModal() {
    const modal = document.getElementById("signin-modal");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }

  // ──────────────────────────────────────────────────────────
  // MOBILE SIDEBAR
  // ──────────────────────────────────────────────────────────
  function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (!sidebar || !overlay) return;

    const isOpen = !sidebar.classList.contains("-translate-x-full");

    if (isOpen) {
      sidebar.classList.add("-translate-x-full");
      overlay.classList.add("hidden");
    } else {
      sidebar.classList.remove("-translate-x-full");
      overlay.classList.remove("hidden");
    }
  }

  // ──────────────────────────────────────────────────────────
  // SEARCH  (filters activity feed & highlights nav)
  // ──────────────────────────────────────────────────────────
  function handleSearch(query) {
    const q = query.toLowerCase().trim();

    // Highlight matching nav links
    document.querySelectorAll(".nav-link").forEach((link) => {
      const text = link.textContent.toLowerCase();
      if (q && text.includes(q)) {
        link.classList.add("ring-1", "ring-indigo-500/50");
      } else {
        link.classList.remove("ring-1", "ring-indigo-500/50");
      }
    });

    // Filter Recent Activity feed
    const items = document.querySelectorAll(
      "#activity-feed > li[data-activity]",
    );
    items.forEach((item) => {
      const text = item.textContent.toLowerCase();
      item.classList.toggle("hidden", q !== "" && !text.includes(q));
    });
  }

  function clearSearch() {
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("ring-1", "ring-indigo-500/50");
    });
    document
      .querySelectorAll("#activity-feed > li[data-activity]")
      .forEach((item) => {
        item.classList.remove("hidden");
      });
  }

  // ──────────────────────────────────────────────────────────
  // EXPORT  — downloads chart data as CSV
  // ──────────────────────────────────────────────────────────
  function exportCSV() {
    const lineCanvas = document.getElementById("line-chart");
    const chart = lineCanvas ? Chart.getChart(lineCanvas) : null;

    if (!chart) {
      showNotification("No data to export yet", "info");
      return;
    }

    const labels = chart.data.labels;
    const values = chart.data.datasets[0].data;

    if (!labels?.length) {
      showNotification("No data to export yet", "info");
      return;
    }

    const rows = [
      "Date,Price (USD)",
      ...labels.map((l, i) => `${l},${values[i]}`),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `pulse-export-${Date.now()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);

    showNotification("CSV exported successfully", "success");
  }

  // ──────────────────────────────────────────────────────────
  // NAV ACTIVE STATE
  // ──────────────────────────────────────────────────────────
  const ACTIVE_SECTIONS = [
    "overview",
    "analytics",
    "settings",
    "reports",
    "customers",
    "integrations",
    "profile",
  ]; // these have real views

  function setActiveNav(section) {
    document.querySelectorAll(".nav-link").forEach((link) => {
      if (link.dataset.section === section) {
        link.classList.add("nav-link--active");
      } else {
        link.classList.remove("nav-link--active");
      }
    });

    // Update page title
    const title = document.getElementById("page-title");
    if (title) {
      title.textContent = section.charAt(0).toUpperCase() + section.slice(1);
    }

    if (ACTIVE_SECTIONS.includes(section)) {
      // Switch to the real view
      Views.show(section);
    } else {
      // Show toast for unbuilt sections
      showNotification(
        `${section.charAt(0).toUpperCase() + section.slice(1)} — coming soon`,
        "info",
      );
      // Revert active state back to overview
      setTimeout(() => setActiveNav("overview"), 1500);
    }
  }

  // ──────────────────────────────────────────────────────────
  // INIT  — wires all event listeners
  // ──────────────────────────────────────────────────────────
  function init() {
    // Notifications button
    document.getElementById("notif-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleNotifPanel();
    });

    // Mark all read
    document
      .getElementById("notif-clear")
      ?.addEventListener("click", markAllRead);

    // User menu
    document.getElementById("user-menu-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleUserDropdown();
    });

    // Mobile sidebar toggle
    document
      .getElementById("sidebar-toggle")
      ?.addEventListener("click", toggleSidebar);

    // Sidebar overlay click to close
    document
      .getElementById("sidebar-overlay")
      ?.addEventListener("click", toggleSidebar);

    // Export button
    document.getElementById("export-btn")?.addEventListener("click", exportCSV);

    // Profile dropdown actions
    document
      .querySelectorAll("#user-dropdown .dropdown-item")
      .forEach((item) => {
        item.addEventListener("click", (e) => {
          e.preventDefault();

          if (item.dataset.action === "view-profile") {
            closeAllDropdowns();
            setActiveNav("profile");
            return;
          }

          if (item.dataset.action === "auth-toggle") {
            closeAllDropdowns();
            if (Auth.getUser().isSignedIn) {
              Auth.signOut();
              showNotification("Signed out successfully", "info");
            } else {
              openSignInModal();
            }
            return;
          }

          const label = item.textContent.trim();

          if (label === "Settings") {
            closeAllDropdowns();
            document
              .querySelector('.nav-link[data-section="settings"]')
              ?.click();
            return;
          }

          const messages = {
            Billing: "Billing portal will open in a new tab",
          };

          showNotification(messages[label] || `${label} clicked`, "success");
          closeAllDropdowns();
        });
      });

    // Sign-in modal wiring
    document
      .getElementById("signin-cancel")
      ?.addEventListener("click", closeSignInModal);
    document.getElementById("signin-submit")?.addEventListener("click", () => {
      const name = document.getElementById("signin-name")?.value.trim();
      const email = document.getElementById("signin-email")?.value.trim();

      if (!name) {
        showNotification("Please enter a name", "error");
        return;
      }

      Auth.signIn(name, email);
      closeSignInModal();
      showNotification(`Welcome, ${name}!`, "success");
    });

    // Close modal on backdrop click
    document.getElementById("signin-modal")?.addEventListener("click", (e) => {
      if (e.target.id === "signin-modal") closeSignInModal();
    });

    // Search input
    const searchInput = document.getElementById("global-search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) =>
        handleSearch(e.target.value),
      );
      searchInput.addEventListener("blur", () => clearSearch());

      // ⌘K / Ctrl+K focus shortcut
      document.addEventListener("keydown", (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "k") {
          e.preventDefault();
          searchInput.focus();
          searchInput.select();
        }
        // Escape closes dropdowns and modal
        if (e.key === "Escape") {
          closeAllDropdowns();
          closeSignInModal();
          searchInput.blur();
        }
      });
    }

    // Click outside closes all dropdowns
    document.addEventListener("click", (e) => {
      const panel = document.getElementById("notif-panel");
      const dropdown = document.getElementById("user-dropdown");
      const notifBtn = document.getElementById("notif-btn");
      const userBtn = document.getElementById("user-menu-btn");

      if (panel && !panel.contains(e.target) && !notifBtn?.contains(e.target)) {
        panel.classList.add("hidden");
      }
      if (
        dropdown &&
        !dropdown.contains(e.target) &&
        !userBtn?.contains(e.target)
      ) {
        dropdown.classList.add("hidden");
      }
    });

    // Nav link clicks
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const section = link.dataset.section;
        if (section) setActiveNav(section);

        // Close sidebar on mobile after nav
        if (window.innerWidth < 1024) toggleSidebar();
      });
    });
  }

  // ── Public API ─────────────────────────────────────────────
  return {
    init,
    setLoading,
    showNotification,
    showError,
  };
})();

document.addEventListener("DOMContentLoaded", UI.init);
