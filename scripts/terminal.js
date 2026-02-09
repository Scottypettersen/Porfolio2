import { EchoCore } from './echo-core.js';
import { EchoWhispers } from './whispers.js';

export const Terminal = (() => {
  const commands = new Map();

  let typedBuffer = '';
  let history = [];
  let historyIndex = -1;

  function registerCommand(name, callback, help = '') {
    commands.set(name.toLowerCase(), { callback, help });
  }

  function isTypingInField() {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName?.toLowerCase();
    return tag === 'input' || tag === 'textarea' || el.isContentEditable;
  }

  function setOpen(isOpen) {
    document.body.classList.toggle('terminal-open', isOpen);
    EchoCore.set('terminalOpen', isOpen ? 'true' : 'false');
  }

  function toggle(force) {
    let term = document.getElementById('echo-terminal');

    // If exists, toggle visibility
    if (term) {
      const next = typeof force === 'boolean' ? force : !term.classList.contains('visible');
      term.classList.toggle('visible', next);
      setOpen(next);
      if (next) term.querySelector('#terminal-input')?.focus();
      return;
    }

    // Build terminal DOM
    term = document.createElement('div');
    term.id = 'echo-terminal';
    term.innerHTML = `
      <div id="terminal-window" role="dialog" aria-label="Echo Terminal">
        <div id="terminal-output">ECHO: Listening...</div>
        <input id="terminal-input" placeholder="> type to Echo..." autocomplete="off" />
        <div id="terminal-hint">Type <span>help</span></div>
      </div>
    `;
    document.body.appendChild(term);

    const input = term.querySelector('#terminal-input');
    const output = term.querySelector('#terminal-output');

    // Show immediately on create
    term.classList.add('visible');
    setOpen(true);
    input.focus();

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const raw = input.value.trim();
        if (!raw) return;
        input.value = '';
        run(raw, output);
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!history.length) return;
        historyIndex = Math.min(historyIndex + 1, history.length - 1);
        input.value = history[history.length - 1 - historyIndex];
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!history.length) return;
        historyIndex = Math.max(historyIndex - 1, -1);
        input.value = historyIndex === -1 ? '' : history[history.length - 1 - historyIndex];
      }

      if (e.key === 'Escape') {
        toggle(false);
      }
    });
  }

  function parse(line) {
    // supports: unlock echo, whisper, status, etc
    const tokens = line.trim().split(/\s+/);
    const cmd = (tokens.shift() || '').toLowerCase();
    return { cmd, args: tokens };
  }

  function run(line, outputEl) {
    history.push(line);
    historyIndex = -1;

    const { cmd, args } = parse(line);

    // allow multi-word commands by checking exact string first
    const exact = commands.get(line.toLowerCase());
    if (exact) return exact.callback(outputEl, []);

    const entry = commands.get(cmd);
    if (!entry) {
      outputEl.textContent = `ECHO: Unknown command "${cmd}" (try: help)`;
      return;
    }

    entry.callback(outputEl, args);
  }

  function init() {
    // Hotkeys
    document.addEventListener('keydown', (e) => {
      // Don’t trigger secrets while user is typing
      if (isTypingInField()) return;

      // Typed secret: kazanis
      if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1 && /[a-z]/i.test(e.key)) {
        typedBuffer += e.key.toLowerCase();
        if (typedBuffer.length > 7) typedBuffer = typedBuffer.slice(-7);
        if (typedBuffer === 'kazanis') toggle();
      }

      // Fallback toggle hotkey
      if (e.ctrlKey && e.key === '`') toggle();
    });

    // Built-in commands
    registerCommand('help', (out) => {
      const list = [...commands.entries()]
        .map(([k, v]) => `• ${k}${v.help ? ` — ${v.help}` : ''}`)
        .join('\n');
      out.textContent = `ECHO: Commands\n${list}`;
    }, 'list commands');

    registerCommand('unlock', (out) => {
      // allow: "unlock echo"
      const enabled = EchoCore.enableEchoMode ? (EchoCore.enableEchoMode(), true) : false;
      out.textContent = enabled
        ? 'ECHO: Echo mode force-enabled.'
        : 'ECHO: Unable to enable (check EchoCore exports).';
    }, 'enable echo mode');

    // keep your original multi-word command working
    registerCommand('unlock echo', (out) => {
      EchoCore.enableEchoMode?.();
      out.textContent = 'ECHO: Echo mode force-enabled.';
    }, 'enable echo mode');

    registerCommand('whisper', (out) => {
      EchoWhispers.whisper();
      out.textContent = 'ECHO: Whisper sent.';
    }, 'emit a whisper');

    registerCommand('status', (out) => {
      const enabled = EchoCore.isEchoModeEnabled?.() || EchoCore.isEnabled?.();
      out.textContent = enabled
        ? 'ECHO: Echo mode is active.'
        : 'ECHO: Echo mode is not yet unlocked.';
    }, 'echo state');

    registerCommand('classic', (out) => {
      document.body.classList.remove('echo-mode', 'echo-hard');
      out.textContent = 'ECHO: Classic styling restored.';
    }, 'disable echo styling');

    registerCommand('hard', (out, args) => {
      // hard on/off: full CRT takeover if you implement echo-hard CSS
      const next = (args[0] || '').toLowerCase();
      const on = next === 'on' || next === 'true' || next === '1';
      const off = next === 'off' || next === 'false' || next === '0';

      if (!on && !off) {
        out.textContent = 'ECHO: usage → hard on | hard off';
        return;
      }

      document.body.classList.toggle('echo-hard', on);
      out.textContent = on ? 'ECHO: Hard mode engaged.' : 'ECHO: Hard mode disengaged.';
    }, 'toggle full takeover');

    registerCommand('access.wall', (out) => {
      EchoCore.set('wall', 'true');
      out.textContent = 'ECHO: Redirecting to the Wall...';
      setTimeout(() => (window.location.href = 'https://echo404.vercel.app/wall'), 900);
    }, 'go to the wall');

    registerCommand('refresh', (out) => {
      out.textContent = 'ECHO: Reloading...';
      setTimeout(() => location.reload(), 700);
    }, 'reload page');
  }

  return { init, registerCommand, toggle };
})();
