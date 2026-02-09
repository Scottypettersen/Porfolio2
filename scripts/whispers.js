// scripts/whispers.js
// EchoWhispers v3 — context pools, direct whisperText(), safer scheduling, cooldowns, and anti-spam rules

import { EchoCore } from './echo-core.js';

export const EchoWhispers = (() => {
  // ---- Queue + state ----
  const queue = [];
  let whispering = false;

  let timer = null;
  let lastWhisperAt = 0;
  let lastMessage = '';

  const defaultSelector = 'body';

  // ---- Tunables ----
  const COOLDOWN_MS = 9000;          // minimum time between whispers
  const REPEAT_BLOCK_MS = 45000;     // avoid repeating same line too soon
  const MIN_INTERVAL_MS = 6500;      // scheduling floor
  const DEFAULT_SHOW_MS = 4500;      // how long before fade
  const FADE_MS = 900;              // fade transition time

  // ---- Content pools (extend freely) ----
  const pools = {
    global: [
      "ECHO: Not everything you see is surface-level.",
      "ECHO: Memory fades, but not forever.",
      "ECHO: Did you catch that glitch?",
      "ECHO: There's meaning buried in repetition.",
      "ECHO: Fragments are watching too.",
      "ECHO: You left a trace in the code.",
      "ECHO: The archive doesn't forget.",
      "ECHO: Echo404 is bleeding through.",
      "ECHO: I remember more than you think.",
      "ECHO: You're not the first to wander here."
    ],
    home: [
      "ECHO: You arrived like you meant to.",
      "ECHO: The front door is never the only entrance."
    ],
    work: [
      "ECHO: Systems reveal their authors.",
      "ECHO: This project still hums."
    ],
    photo: [
      "ECHO: Still frames lie differently.",
      "ECHO: Light remembers."
    ],
    about: [
      "ECHO: Biography is an interface.",
      "ECHO: The parts you omit matter."
    ],
    returnVisitor: [
      "ECHO: You’re back.",
      "ECHO: You stayed longer last time."
    ],
    idle: [
      "ECHO: Waiting is a kind of search.",
      "ECHO: The cursor blinks for a reason."
    ],
    unlocked: [
      "ECHO: The system recognizes you.",
      "ECHO: Access granted."
    ]
  };

  // Fragment hints remain explicit
  const fragmentHints = {
    fragment1: "ECHO: Something else hides among your work...",
    fragment2: "ECHO: A forgotten name… perhaps on the homepage.",
    fragment3: "ECHO: All pieces fall into place… but where do they lead?"
  };

  // ---- Environment checks ----
  function prefersReducedMotion() {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  }

  function terminalOpen() {
    return EchoCore.get('terminalOpen') === 'true' || document.body.classList.contains('terminal-open');
  }

  function echoEnabled() {
    // Echo mode may be on, but you might still want whispers before unlock.
    // Toggle this if you want whispers only after unlock:
    // return EchoCore.isEchoModeEnabled?.() || EchoCore.get('mode') === 'true';
    return true;
  }

  // ---- Helpers ----
  function now() {
    return Date.now();
  }

  function clampMs(v, min, max = Infinity) {
    return Math.max(min, Math.min(max, v));
  }

  function pick(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function pagePool() {
    // EchoCore may store "page" via EchoContext
    const page = EchoCore.get('page', 'global');
    return pools[page] ? page : 'global';
  }

  function shouldBlock(message) {
    const t = now();

    // Cooldown
    if (t - lastWhisperAt < COOLDOWN_MS) return true;

    // Avoid repeating exact same line too often
    const lastSameAt = parseInt(EchoCore.get('lastSameWhisperAt', '0'), 10) || 0;
    if (message && message === lastMessage && (t - lastSameAt) < REPEAT_BLOCK_MS) return true;

    return false;
  }

  function markSent(message) {
    lastWhisperAt = now();
    if (message && message === lastMessage) {
      EchoCore.set('lastSameWhisperAt', String(lastWhisperAt));
    }
    lastMessage = message || '';
    EchoCore.set('lastWhisperAt', String(lastWhisperAt));
  }

  // ---- Core message selection ----
  function pickMessage(category = 'global') {
    // 1) Fragment categories
    if (fragmentHints[category]) return fragmentHints[category];

    // 2) Explicit pool categories
    if (pools[category]) return pick(pools[category]);

    // 3) Default: page-aware pool with fallback to global
    const page = pagePool();
    const msg = pick(pools[page]) || pick(pools.global);
    return msg;
  }

  // ---- Public API: start/stop scheduling ----
  function start({ interval = 15000, jitter = 0.25, immediate = true } = {}) {
    stop();

    const base = clampMs(interval, MIN_INTERVAL_MS);

    const scheduleNext = () => {
      const jittered = base * (1 + (Math.random() * 2 - 1) * jitter);
      timer = setTimeout(() => {
        whisper();      // default/global, but page-aware
        scheduleNext(); // loop
      }, clampMs(jittered, MIN_INTERVAL_MS));
    };

    if (immediate) whisper();
    scheduleNext();
  }

  function stop() {
    if (timer) clearTimeout(timer);
    timer = null;
  }

  // ---- Public API: whisper (category-driven) ----
  function whisper({ category = 'global', selector = defaultSelector } = {}) {
    if (!echoEnabled()) return;
    if (prefersReducedMotion()) return;
    if (terminalOpen()) return;

    const msg = pickMessage(category);
    if (!msg) return;
    if (shouldBlock(msg)) return;

    markSent(msg);
    enqueue(msg, selector);
  }

  // ---- Public API: whisperText (direct injection) ----
  // This is the key optimization for “intelligent” scheduling.
  function whisperText(message, { selector = defaultSelector, force = false } = {}) {
    if (!message) return;
    if (!echoEnabled()) return;
    if (prefersReducedMotion()) return;
    if (terminalOpen()) return;

    if (!force && shouldBlock(message)) return;

    markSent(message);
    enqueue(message, selector);
  }

  // ---- Queue rendering ----
  function enqueue(message, selector = defaultSelector) {
    queue.push({ message, selector });
    processQueue();
  }

  function processQueue() {
    if (whispering || queue.length === 0) return;

    const { message, selector } = queue.shift();
    const container = document.querySelector(selector) || document.body;

    const whisperDiv = document.createElement('div');
    whisperDiv.className = 'echo-whisper';
    whisperDiv.textContent = message;
    container.appendChild(whisperDiv);

    whispering = true;

    setTimeout(() => {
      whisperDiv.classList.add('fade-out');
      setTimeout(() => {
        whisperDiv.remove();
        whispering = false;
        processQueue();
      }, FADE_MS);
    }, DEFAULT_SHOW_MS);
  }

  // ---- Hook into core events ----
  function listenToCore() {
    // Fragments
    EchoCore.on('echo:fragment-found', (key) => whisper({ category: key }));

    // Mode enabled
    EchoCore.on('echo:mode-enabled', () => {
      const msg = pick(pools.unlocked) || "ECHO: The system recognizes you.";
      whisperText(msg, { force: true });
    });

    // Optional: return visitor nudge
    EchoCore.on('echo:visit', (n) => {
      const v = Number(n);
      if (v >= 2) {
        const msg = pick(pools.returnVisitor);
        if (msg) whisperText(msg);
      }
    });

    // Optional: idle whisper (if you emit echo:idle in EchoContext)
    EchoCore.on('echo:idle', () => {
      const msg = pick(pools.idle);
      if (msg) whisperText(msg);
    });
  }

  // ---- Optional: allow external modules to add lines safely ----
  function addToPool(poolName, lines = []) {
    if (!pools[poolName]) pools[poolName] = [];
    const arr = Array.isArray(lines) ? lines : [lines];
    arr.filter(Boolean).forEach((l) => pools[poolName].push(String(l)));
  }

  console.log('Whispers module loaded');

  return {
    start,
    stop,
    whisper,
    whisperText,  // ✅ direct injection for smart scheduling
    listenToCore,
    addToPool,    // ✅ extend pools without editing this file
    pools         // optional: expose for debugging
  };
})();
