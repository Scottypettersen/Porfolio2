// === CONSOLE WHISPER ===
console.log('%cECHO: Some memories are not meant to be indexed.', 'color:#FF6B00; font-style:italic; font-family:monospace');

// === ECHO MEMORY CORE ===
const echo = {
  get: (key) => localStorage.getItem(`echo.${key}`),
  set: (key, val = true) => localStorage.setItem(`echo.${key}`, val),
  hasAllFragments: () => ['fragment1', 'fragment2', 'fragment3'].every(k => echo.get(k)),
  enableMode: () => {
    echo.set('mode');
    document.body.classList.add('echo-mode');

    // Show optional homepage portal if present
    const portal = document.getElementById('echo-portal');
    if (portal) portal.style.display = 'block';
  }
};

// === WHISPER SYSTEM ===
function whisper(msg) {
  const w = document.createElement('div');
  w.className = 'echo-whisper';
  w.innerText = msg;
  document.body.appendChild(w);
  setTimeout(() => w.remove(), 8000);
}

function whisperOnFragment(key) {
  const messages = {
    fragment1: "ECHO: Something else hides among your work...",
    fragment2: "ECHO: A forgotten name… perhaps on the homepage.",
    fragment3: "ECHO: All pieces fall into place… but where do they lead?"
  };
  whisper(messages[key] || "ECHO: Keep looking...");
}

// === POPUP FOR FINAL REDIRECT ===
function showEchoPopup() {
  const popup = document.createElement('div');
  popup.id = 'echo-popup';
  popup.innerHTML = `
    <div class="popup-inner">
      <p><strong>ECHO</strong>: Memory integrity confirmed.</p>
      <p>A signal has been established.</p>
      <a href="https://echo404.vercel.app" class="echo-wall-link">→ Connect to Echo404</a>
    </div>
  `;
  document.body.appendChild(popup);
}

// === TRACK FRAGMENT INTERACTIONS ===
function initFragmentTracking() {
  document.querySelectorAll('[data-echo]').forEach(el => {
    el.addEventListener('click', () => {
      const key = el.dataset.echo;
      if (!echo.get(key)) {
        echo.set(key);
        el.classList.add('echo-found');
        whisperOnFragment(key);
        checkEchoStatus();
      }
    });
  });
}

// === CHECK FOR MODE OR UNLOCK EVENT ===
function checkEchoStatus() {
  if (echo.get('mode')) {
    document.body.classList.add('echo-mode');
    const portal = document.getElementById('echo-portal');
    if (portal) portal.style.display = 'block';
    return;
  }

  if (echo.hasAllFragments()) {
    echo.enableMode();
    showEchoPopup();
  }
}

// === TERMINAL ===
function initTerminal() {
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
  } else {
    out.innerText = `ECHO: Unknown command "${cmd}"`;
  }
}

// === TERMINAL TOGGLE SHORTCUT ===
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === '`') {
    const term = document.getElementById('echo-terminal');
    if (!term) initTerminal();
    else term.classList.toggle('visible');
  }
});

// === IDLE WHISPER IF NOTHING TRIGGERS ===
setTimeout(() => {
  if (!echo.get('mode')) whisper('ECHO: Are you still there...?');
}, 60000);

// === DOM READY INIT ===
document.addEventListener('DOMContentLoaded', () => {
  initFragmentTracking();
  checkEchoStatus();
});
