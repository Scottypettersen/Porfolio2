// scripts/terminal.js

import { EchoCore } from './echo-core.js';
import { EchoWhispers } from './whispers.js';

// Singleton Terminal module
export const Terminal = (() => {
  const commands = new Map();
  let terminalVisible = false;
  let typedBuffer = '';

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
    let term = document.getElementById('echo-terminal');
    if (term) {
      terminalVisible = !terminalVisible;
      term.classList.toggle('visible');
      return;
    }

    // Build terminal DOM
    term = document.createElement('div');
    term.id = 'echo-terminal';
    term.innerHTML = `
      <div id="terminal-window">
        <div id="terminal-output">ECHO: Listening...</div>
        <input id="terminal-input" placeholder="> type to Echo..." autofocus />
      </div>
    `;
    document.body.appendChild(term);

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
      // Echo activation via "kazanis"
      if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
        typedBuffer += e.key.toLowerCase();
        if (typedBuffer.length > 7) typedBuffer = typedBuffer.slice(-7);
        if (typedBuffer === 'kazanis') toggle();
      }

      // Fallback toggle hotkey
      if (e.ctrlKey && e.key === '`') toggle();
    });

    // Register built-in commands
    registerCommand('unlock echo', (out) => {
      EchoCore.enableMode();
      out.textContent = 'ECHO: Echo mode force-enabled.';
    });

    registerCommand('whisper', (out) => {
      EchoWhispers.whisper();
      out.textContent = 'ECHO: Whisper sent.';
    });

    registerCommand('access.wall', (out) => {
      EchoCore.set('wall');
      out.textContent = 'ECHO: Redirecting to the Wall...';
      setTimeout(() => {
        window.location.href = 'https://echo404.vercel.app/wall';
      }, 1500);
    });

    registerCommand('status', (out) => {
      out.textContent = EchoCore.isEnabled()
        ? 'ECHO: Echo mode is active.'
        : 'ECHO: Echo mode is not yet unlocked.';
    });

    registerCommand('classic', (out) => {
      document.body.classList.remove('echo-mode');
      out.textContent = 'ECHO: Classic styling restored.';
    });

    registerCommand('refresh', (out) => {
      out.textContent = 'ECHO: Reloading...';
      setTimeout(() => location.reload(), 1000);
    });
  }

  return {
    init,
    registerCommand,
    toggle
  };
})();
