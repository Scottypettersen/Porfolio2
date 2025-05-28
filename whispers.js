console.log("✅ whispers.js loaded successfully");

// === ECHO MEMORY CORE ===
const echo = {
  get: (key) => localStorage.getItem(`echo.${key}`),
  set: (key, val = true) => localStorage.setItem(`echo.${key}`, val),
  hasAllFragments: () => ['fragment1', 'fragment2', 'fragment3'].every(f => echo.get(f)),
  enableMode: () => {
    echo.set('mode');
    document.body.classList.add('echo-mode');
  }
};

// === WHISPER ON FRAGMENT DISCOVERY ===
function whisperOnFragment(key) {
  const whispers = {
    fragment1: "ECHO: Something else hides among your work...",
    fragment2: "ECHO: A forgotten name… perhaps on the homepage.",
    fragment3: "ECHO: All pieces fall into place… but where do they lead?"
  };

  const w = document.createElement('div');
  w.className = 'echo-whisper';
  w.innerText = whispers[key] || "ECHO: Keep looking...";
  document.body.appendChild(w);
  setTimeout(() => w.remove(), 8000);
}

// === FRAGMENT COLLECTION + MODE CHECK ===
function initFragmentTracking() {
  const nodes = document.querySelectorAll('[data-echo]');
  nodes.forEach(el => {
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

// === ECHO MODE ACTIVATION + WALL POPUP ===
function checkEchoStatus() {
  if (echo.get('mode')) {
    document.body.classList.add('echo-mode');
    return;
  }

  if (echo.hasAllFragments()) {
    echo.set('mode');
    document.body.classList.add('echo-mode');
    showEchoPopup();
  }
}

function showEchoPopup() {
  const popup = document.createElement('div');
  popup.id = 'echo-popup';
  popup.innerHTML = `
    <div class="popup-inner">
      <p><strong>ECHO</strong>: Memory integrity confirmed.</p>
      <a href="https://echo404.vercel.app/wall" class="echo-wall-link">→ Access the Wall</a>
    </div>
  `;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 8000);
}

// === TERMINAL SYSTEM ===
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

// === TERMINAL HOTKEY ===
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === '`') {
    const term = document.getElementById('echo-terminal');
    if (!term) initTerminal();
    else term.classList.toggle('visible');
  }
});

// === IDLE WHISPER ===
setTimeout(() => {
  if (!echo.get('mode')) {
    const w = document.createElement('div');
    w.className = 'echo-whisper';
    w.innerText = 'ECHO: Are you still there...?';
    document.body.appendChild(w);
  }
}, 60000);

// === ON DOM READY ===
document.addEventListener('DOMContentLoaded', () => {
  initFragmentTracking();
  checkEchoStatus();
});
