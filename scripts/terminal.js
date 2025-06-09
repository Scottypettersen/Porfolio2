// scripts/terminal.js

import { EchoCore } from './echo-core.js';
import { EchoWhispers } from './whispers.js';

// Singleton Terminal module
export const Terminal = (() => {
  const commands = new Map();
  let terminalVisible = false;

  /**
   * Register a command
   * @param {string} name - The command keyword
   * @param {function} callback - The function to run
   */
  function registerCommand(name, callback) {
    commands.set(name.toLowerCase(), callback);
  }

  /**
   * Show or toggle terminal UI
   */
  function toggle() {
    const term = document.getElementById('echo-terminal');
    if (term) {
      terminalVisible = !terminalVisible;
      term.classList.toggle('visible');
      return;
    }

    // Build terminal DOM
    const t = document.createElement('div');
    t.id = 'echo-terminal';
    t.innerHTML = `
      <div id="terminal-window">
        <div id="terminal-output">ECHO: Listening...</div>
        <input id="terminal-input" placeholder="> type to Echo..." autofocus />
      </div>
    `;
    document.body.appendChild(t);

    const input = document.getElementById('terminal-input');
    const output = document.getElementById('terminal-output');

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const val = input.value.trim().toLowerCase();
        input.value = '';
        handleCommand(val, output);
      }
    });
  }

  /**
   * Handle command input
   */
  function handleCommand(input, outputEl) {
    if (commands.has(input)) {
      commands.get(input)(outputEl);
    } else {
      outputEl.textContent = `ECHO: Unknown command "${input}"`;
    }
  }

  /**
   * Init terminal: sets up hotkey and default commands
   */
  function init() {
    document.addEventListener('keydown', e => {
      if (e.ctrlKey && e.key === '`') {
        toggle();
      }
    });

    // Register built-in commands
    registerCommand('unlock echo', () => {
      EchoCore.enableMode();
    });

    registerCommand('whisper', () => {
      EchoWhispers.whisper();
    });

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
