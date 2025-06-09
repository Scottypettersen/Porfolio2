// scripts/terminal.js
import { EchoCore } from './echo-core.js';
import { EchoWhispers } from './whispers.js';

export const Terminal = (() => {
  const commands = new Map();
  let terminalVisible = false;

  function registerCommand(name, callback) {
    commands.set(name.toLowerCase(), callback);
  }

  function toggle() {
    let term = document.getElementById('echo-terminal');
    if (term) {
      terminalVisible = !terminalVisible;
      term.classList.toggle('visible');
      return;
    }

    term = document.createElement('div');
    term.id = 'echo-terminal';
    term.innerHTML = `
      <div id="terminal-window">
        <div id="terminal-output">ECHO: Listening...</div>
        <input id="terminal-input" placeholder="> type to Echo..." autofocus />
      </div>`;
    document.body.appendChild(term);

    const input = document.getElementById('terminal-input');
    const output = document.getElementById('terminal-output');

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = input.value.trim().toLowerCase();
        input.value = '';
        handleCommand(val, output);
      }
    });
  }

  function handleCommand(input, outputEl) {
    if (commands.has(input)) {
      commands.get(input)(outputEl);
    } else {
      outputEl.textContent = `ECHO: Unknown command "${input}"`;
    }
  }

  function init() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === '`') toggle();
    });

    registerCommand('unlock echo', () => EchoCore.enableMode());
    registerCommand('whisper', () => EchoWhispers.whisper());
    registerCommand('access.wall', () => {
      EchoCore.set('wall');
      window.location.href = 'https://echo404.vercel.app/wall';
    });
    registerCommand('status', (out) => {
      out.textContent = EchoCore.isEnabled()
        ? 'ECHO: Echo mode is active.'
        : 'ECHO: Echo mode is not yet unlocked.';
    });
  }

  return {
    init,
    registerCommand,
    toggle
  };
})();
