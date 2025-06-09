// scripts/echo-core.js

export const EchoCore = (() => {
  const FRAGMENTS = ['fragment1', 'fragment2', 'fragment3'];
  const listeners = {};

  const localKey = key => `echo.${key}`;

  function get(key) {
    return localStorage.getItem(localKey(key));
  }

  function set(key, value = true) {
    localStorage.setItem(localKey(key), value);
    emit(key, value);
  }

  function hasAllFragments() {
    return FRAGMENTS.every(key => get(key));
  }

  function isEchoModeEnabled() {
    return get('mode') === 'true';
  }

  function enableEchoMode() {
    set('mode', 'true');
    document.body.classList.add('echo-mode');
    emit('echo:mode-enabled');
  }

  function discoverFragment(key) {
    if (!FRAGMENTS.includes(key)) return;

    if (!get(key)) {
      set(key);
      const el = document.querySelector(`[data-echo="${key}"]`);
      if (el) el.classList.add('echo-found');

      emit('echo:fragment-found', key);

      if (hasAllFragments()) enableEchoMode();
    }
  }

  function initFragmentTracking() {
    document.querySelectorAll('[data-echo]').forEach(el => {
      const key = el.dataset.echo;
      if (!FRAGMENTS.includes(key)) return;

      el.addEventListener('click', e => {
        const href = el.getAttribute('href');

        if (!get(key)) {
          e.preventDefault();
          discoverFragment(key);

          if (href && !href.endsWith('.pdf')) {
            setTimeout(() => (window.location.href = href), 1500);
          }
        }
      });
    });
  }

  function on(eventName, callback) {
    if (!listeners[eventName]) listeners[eventName] = [];
    listeners[eventName].push(callback);
  }

  function emit(eventName, payload) {
    if (listeners[eventName]) {
      listeners[eventName].forEach(cb => cb(payload));
    }
  }

  return {
    get,
    set,
    hasAllFragments,
    isEchoModeEnabled,
    enableEchoMode,
    discoverFragment,
    initFragmentTracking,
    on,
    emit,
  };
})();
