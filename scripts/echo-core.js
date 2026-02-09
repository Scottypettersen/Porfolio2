// scripts/echo-core.js
// EchoCore v2 — safer storage, better events, aliases, and QoL utilities

export const EchoCore = (() => {
  // --- Config ---
  const FRAGMENTS = ['fragment1', 'fragment2', 'fragment3'];
  const PREFIX = 'echo.';
  const listeners = new Map(); // eventName -> Set(callback)

  // --- Storage helpers ---
  const keyOf = (k) => `${PREFIX}${k}`;

  function get(key, fallback = null) {
    try {
      const v = localStorage.getItem(keyOf(key));
      return v === null ? fallback : v;
    } catch {
      return fallback;
    }
  }

  function getBool(key, fallback = false) {
    const v = get(key, null);
    if (v === null) return fallback;
    return v === 'true' || v === true;
  }

  function set(key, value = 'true') {
    // Normalize booleans into "true"/"false" strings for consistent reads
    const normalized =
      typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value);

    try {
      localStorage.setItem(keyOf(key), normalized);
    } catch {
      // storage may be blocked; still emit so runtime works
    }

    emit(`echo:${key}:changed`, normalized);
    emit(key, normalized); // backwards compat with your older code style
    return normalized;
  }

  function unset(key) {
    try {
      localStorage.removeItem(keyOf(key));
    } catch {}
    emit(`echo:${key}:changed`, null);
    emit(key, null);
  }

  // --- Events ---
  function on(eventName, callback) {
    if (!listeners.has(eventName)) listeners.set(eventName, new Set());
    listeners.get(eventName).add(callback);
    // return unsubscribe
    return () => off(eventName, callback);
  }

  function off(eventName, callback) {
    const set = listeners.get(eventName);
    if (!set) return;
    set.delete(callback);
    if (set.size === 0) listeners.delete(eventName);
  }

  function emit(eventName, payload) {
    const set = listeners.get(eventName);
    if (!set) return;
    // guard against callbacks mutating listeners mid-emit
    [...set].forEach((cb) => {
      try {
        cb(payload);
      } catch (err) {
        // Don’t let one bad listener break everything
        console.error(`[EchoCore] listener error for "${eventName}"`, err);
      }
    });
  }

  // --- State / Mode ---
  function hasAllFragments() {
    return FRAGMENTS.every((k) => getBool(k, false));
  }

  function isEchoModeEnabled() {
    return getBool('mode', false);
  }

  function enableEchoMode({ hard = false } = {}) {
    set('mode', true);
    document.body.classList.add('echo-mode');
    if (hard) document.body.classList.add('echo-hard');
    emit('echo:mode-enabled', { hard });
  }

  function disableEchoMode() {
    set('mode', false);
    document.body.classList.remove('echo-mode', 'echo-hard');
    emit('echo:mode-disabled');
  }

  function syncBodyClass() {
    // Keeps DOM in sync on page load / reload
    if (isEchoModeEnabled()) document.body.classList.add('echo-mode');
    else document.body.classList.remove('echo-mode');

    if (getBool('terminalOpen', false)) document.body.classList.add('terminal-open');
    else document.body.classList.remove('terminal-open');
  }

  // --- Fragments ---
  function discoverFragment(key, { sourceEl = null } = {}) {
    if (!FRAGMENTS.includes(key)) return false;

    if (!getBool(key, false)) {
      set(key, true);

      const el =
        sourceEl ||
        document.querySelector(`[data-echo="${key}"]`) ||
        null;

      if (el) el.classList.add('echo-found');

      emit('echo:fragment-found', key);

      if (hasAllFragments()) enableEchoMode();
      return true;
    }

    return false;
  }

  function initFragmentTracking({
    selector = '[data-echo]',
    interceptNavigation = true,
    navDelayMs = 900, // shorter feels snappier
    allowPdf = true
  } = {}) {
    document.querySelectorAll(selector).forEach((el) => {
      const key = el.dataset.echo;
      if (!FRAGMENTS.includes(key)) return;

      // Mark already-found fragments on load
      if (getBool(key, false)) el.classList.add('echo-found');

      el.addEventListener('click', (e) => {
        const href = el.getAttribute('href');

        // if already found, don’t intercept
        if (getBool(key, false)) return;

        // Discover fragment
        const found = discoverFragment(key, { sourceEl: el });
        if (!found) return;

        emit('echo:fragment-clicked', { key, href });

        // Optional navigation intercept
        if (!interceptNavigation) return;

        if (href) {
          const isPdf = href.toLowerCase().endsWith('.pdf');
          if (isPdf && !allowPdf) {
            e.preventDefault();
            return;
          }

          // If it’s a normal link, delay briefly so the UX can “acknowledge” the find
          if (!isPdf) {
            e.preventDefault();
            setTimeout(() => (window.location.href = href), navDelayMs);
          }
        }
      });
    });
  }

  // --- QoL / Utilities ---
  function initPreferences() {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    set('reducedMotion', !!reduced);
    emit('echo:preferences', { reducedMotion: !!reduced });
  }

  function resetAll() {
    // Clear known keys safely
    unset('mode');
    unset('terminalOpen');
    unset('reducedMotion');
    FRAGMENTS.forEach((k) => unset(k));
    disableEchoMode();
    emit('echo:reset');
  }

  // Backwards-compat aliases (so old modules don’t break)
  const isEnabled = isEchoModeEnabled;
  const enableMode = enableEchoMode;

  return {
    // storage
    get,
    getBool,
    set,
    unset,

    // fragments + mode
    FRAGMENTS,
    hasAllFragments,
    isEchoModeEnabled,
    enableEchoMode,
    disableEchoMode,
    discoverFragment,
    initFragmentTracking,

    // runtime sync + prefs
    syncBodyClass,
    initPreferences,
    resetAll,

    // events
    on,
    off,
    emit,

    // compat
    isEnabled,
    enableMode,
  };
})();
