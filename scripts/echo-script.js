// scripts/echo-script.js

import { EchoCore } from './echo-core.js';
import { EchoWhispers } from './whispers.js';
import { Terminal } from './terminal.js';
import { runBootSequence } from './boot-sequence.js';

// === INIT FUNCTION ===
function initEchoSystem() {
  // 1. Start CRT-style boot sequence
  runBootSequence();

  // 2. Enable terminal (hotkey + command input)
  Terminal.init();

  // 3. Restore Echo mode if all fragments are found
  if (EchoCore.hasAllFragments()) {
    EchoCore.enableEchoMode();
  }

  // 4. Track and register clicks on [data-echo] fragments
  EchoCore.initFragmentTracking();

  // 5. Listen to EchoCore events and respond with whispers
  EchoWhispers.listenToCore();

  // 6. Show a test whisper on load (for dev/debug)
  // EchoWhispers.whisper(); // comment this out in production
}


// === DOM READY HOOK ===
document.addEventListener('DOMContentLoaded', initEchoSystem);
