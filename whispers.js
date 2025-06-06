console.log("✅ whispers.js loaded");

// === ECHO MEMORY CORE ===
const echo = {
  get: key => localStorage.getItem(`echo.${key}`),
  set: (key, val = true) => localStorage.setItem(`echo.${key}`, val),
  hasAllFragments: () => ['fragment1', 'fragment2', 'fragment3'].every(f => echo.get(f)),
  enableMode: () => {
    echo.set('mode');
    document.body.classList.add('echo-mode');
  }
};

// === GLOBAL WHISPER LOGIC ===
const globalWhispers = [
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
];

function whisper(message = "ECHO: ...") {
  const w = document.createElement('div');
  w.className = 'echo-whisper';
  w.innerText = message;
  Object.assign(w.style, {
    position: 'fixed',
    bottom: '6rem',
    left: '50%',
    transform: 'translateX(-50%) translateY(20px)',
    background: 'rgba(0,0,0,0.9)',
    color: '#FF6B00',
    fontFamily: 'monospace',
    fontSize: '0.95rem',
    padding: '0.75rem 1.25rem',
    borderRadius: '10px',
    zIndex: '10000',
    opacity: '0',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
    pointerEvents: 'none',
    maxWidth: '90vw',
    textAlign: 'center'
  });
  document.body.appendChild(w);
  requestAnimationFrame(() => {
    w.style.opacity = '1';
    w.style.transform = 'translateX(-50%) translateY(0)';
  });
  setTimeout(() => {
    w.style.opacity = '0';
    w.style.transform = 'translateX(-50%) translateY(-10px)';
    setTimeout(() => w.remove(), 400);
  }, 7000);
}

function whisperOnFragment(key) {
  const whispers = {
    fragment1: "ECHO: Something else hides among your work...",
    fragment2: "ECHO: A forgotten name… perhaps on the homepage.",
    fragment3: "ECHO: All pieces fall into place… but where do they lead?"
  };
  whisper(whispers[key] || "ECHO: Keep looking...");
}

function randomWhisper() {
  if (!echo.get('mode')) return;
  const msg = globalWhispers[Math.floor(Math.random() * globalWhispers.length)];
  whisper(msg);
}

// === TRACKING & UNLOCK LOGIC ===
function initFragmentTracking() {
  document.querySelectorAll('[data-echo]').forEach(el => {
    el.addEventListener('click', () => {
      const key = el.dataset.echo;
      if (!key || echo.get(key)) return;
      echo.set(key);
      el.classList.add('echo-found');
      whisperOnFragment(key);
      checkEchoStatus();
    });
  });
}

function checkEchoStatus() {
  if (echo.get('mode')) {
    document.body.classList.add('echo-mode');
    return;
  }
  if (echo.hasAllFragments()) {
    echo.enableMode();
    showEchoPopup();
  }
}

function showEchoPopup() {
  if (document.getElementById('echo-popup')) return;
  const popup = document.createElement('div');
  popup.id = 'echo-popup';
  popup.innerHTML = `
    <div class="popup-inner">
      <p><strong>ECHO</strong>: Memory integrity confirmed.</p>
      <a href="https://echo404.vercel.app/wall" class="echo-wall-link">→ Access the Wall</a>
    </div>`;
  Object.assign(popup.style, {
    position: 'fixed',
    bottom: '7rem',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#000',
    color: '#FF6B00',
    padding: '1rem',
    borderRadius: '10px',
    zIndex: '10000',
    fontFamily: 'monospace',
    fontSize: '1rem'
  });
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 8000);
}

// === TERMINAL SYSTEM ===
function initTerminal() {
  if (document.getElementById('echo-terminal')) return;
  const t = document.createElement('div');
  t.id = 'echo-terminal';
  t.innerHTML = `
    <div id="terminal-window">
      <div id="terminal-output">ECHO: Listening...</div>
      <input id="terminal-input" placeholder="> type to Echo..." autofocus />
    </div>`;
  document.body.appendChild(t);
  document.getElementById('terminal-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleCommand(e.target.value.trim());
  });
}

function handleCommand(input) {
  const out = document.getElementById('terminal-output');
  const cmd = input.toLowerCase();
  if (cmd === 'unlock echo') {
    echo.enableMode();
    out.innerText = 'ECHO: echo mode activated.';
  } else if (cmd === 'access.wall') {
    echo.set('wall');
    window.location.href = 'https://echo404.vercel.app/wall';
  } else if (cmd.startsWith('unlock ')) {
    const frag = cmd.split(' ')[1];
    echo.set(frag);
    out.innerText = `ECHO: ${frag} fragment set.`;
    checkEchoStatus();
  } else if (cmd === 'whisper') {
    randomWhisper();
  } else {
    out.innerText = `ECHO: Unknown command "${cmd}"`;
  }
}

// === TERMINAL HOTKEY ===
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === '`') {
    const term = document.getElementById('echo-terminal');
    if (!term) initTerminal();
    else term.classList.toggle('visible');
  }
});

// === IDLE WHISPER SYSTEM ===
let idleTimer = null;
function startIdleWhispers() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (echo.get('mode')) randomWhisper();
  }, 10000);
}
['mousemove', 'keydown', 'scroll', 'touchstart'].forEach(evt => {
  window.addEventListener(evt, startIdleWhispers);
});

// === INIT ON DOM READY ===
document.addEventListener('DOMContentLoaded', () => {
  initFragmentTracking();
  checkEchoStatus();
  startIdleWhispers();
  setTimeout(() => whisper("ECHO: You found one of the cracks..."), 1500);
});
