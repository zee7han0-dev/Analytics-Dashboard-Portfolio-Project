/* ============================================================
   AUTH.JS  —  Shared mock user state + sign in/out
   - Guest by default, persisted via localStorage
   - signIn(name, email) / signOut()
   - setUser() for Settings-form edits (only when signed in)
   ============================================================ */

const Auth = (() => {
  const STORAGE_KEY = "pulse_user";

  const GUEST = {
    name: "Guest",
    email: "",
    role: "",
    isSignedIn: false,
  };

  let currentUser = loadFromStorage() || { ...GUEST };

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
    } catch {
      /* ignore storage errors */
    }
  }

  function getInitials(name) {
    return name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function getUser() {
    return { ...currentUser, initials: getInitials(currentUser.name) };
  }

  // ──────────────────────────────────────────────────────────
  // SIGN IN  — sets name/email, marks signed in
  // ──────────────────────────────────────────────────────────
  function signIn(name, email) {
    currentUser = {
      name: name.trim() || "User",
      email: email.trim(),
      role: "Member",
      isSignedIn: true,
    };
    saveToStorage();
    refreshUI();
  }

  // ──────────────────────────────────────────────────────────
  // SIGN OUT  — resets to Guest
  // ──────────────────────────────────────────────────────────
  function signOut() {
    currentUser = { ...GUEST };
    saveToStorage();
    refreshUI();
  }

  // ──────────────────────────────────────────────────────────
  // SET USER  — for Settings form edits (only while signed in)
  // ──────────────────────────────────────────────────────────
  function setUser(partial) {
    if (!currentUser.isSignedIn) return; // guests can't edit
    currentUser = { ...currentUser, ...partial };
    saveToStorage();
    refreshUI();
  }

  // ──────────────────────────────────────────────────────────
  // REFRESH ALL UI LOCATIONS
  // ──────────────────────────────────────────────────────────
  function refreshUI() {
    const user = getUser();

    document
      .querySelectorAll("[data-user-name]")
      .forEach((el) => (el.textContent = user.name));
    document
      .querySelectorAll("[data-user-role]")
      .forEach((el) => (el.textContent = user.role));
    document
      .querySelectorAll("[data-user-email]")
      .forEach((el) => (el.textContent = user.email));
    document
      .querySelectorAll("[data-user-initials]")
      .forEach((el) => (el.textContent = user.initials));

    // Toggle Sign in / Sign out label + icon in dropdown
    const authLabel = document.querySelector("[data-auth-label]");
    const authIcon = document.querySelector("[data-auth-icon]");
    const authItem = document.querySelector("[data-auth-item]");
    if (authLabel)
      authLabel.textContent = user.isSignedIn ? "Sign out" : "Sign in";
    if (authIcon)
      authIcon.setAttribute(
        "data-lucide",
        user.isSignedIn ? "log-out" : "log-in",
      );
    if (authItem) {
      authItem.classList.toggle("text-red-400", user.isSignedIn);
      authItem.classList.toggle("hover:bg-red-500/10", user.isSignedIn);
      authItem.classList.toggle("hover:text-red-400", user.isSignedIn);
    }

    if (typeof lucide !== "undefined") lucide.createIcons();

    if (typeof Views !== "undefined" && Views.refreshProfile) {
      Views.refreshProfile();
    }
    if (typeof Views !== "undefined" && Views.refreshSettings) {
      Views.refreshSettings();
    }
  }

  function init() {
    refreshUI();
  }

  return { getUser, setUser, signIn, signOut, init };
})();

document.addEventListener("DOMContentLoaded", Auth.init);
