// scripts/whispers.js

import { EchoCore } from './echo-core.js';

export const EchoWhispers = (() => {
  const queue = [];
  let whispering = false;
  const defaultSelector = 'body';

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

  const fragmentHints = {
    fragment1: "ECHO: Something else hides among your work...",
    fragment2: "ECHO: A forgotten name… perhaps on the homepage.",
    fragment3: "ECHO: All pieces fall into place… but where do they lead?"
  };

  function startGlobalWhispers(interval = 15000) {
    whisper(); // first one immediately
    setInterval(() => {
      whisper();
    }, interval);
  }

  function whisper({ category = 'global', selector = defaultSelector } = {}) {
    let msg;

    if (category.startsWith('fragment') && fragmentHints[category]) {
      msg = fragmentHints[category];
    } else {
      const pool = globalWhispers;
      msg = pool[Math.floor(Math.random() * pool.length)];
    }

    enqueue(msg, selector);
  }

  function enqueue(message, selector = defaultSelector) {
    queue.push({ message, selector });
    processQueue();
  }

  function processQueue() {
    if (whispering || queue.length === 0) return;

    const { message, selector } = queue.shift();
    const container = document.querySelector(selector) || document.body;

    const whisperDiv = document.createElement('div');
    whisperDiv.classList.add('echo-whisper');
    whisperDiv.textContent = message;
    container.appendChild(whisperDiv);

    whispering = true;

    setTimeout(() => {
      whisperDiv.classList.add('fade-out');
      setTimeout(() => {
        whisperDiv.remove();
        whispering = false;
        processQueue();
      }, 1000);
    }, 5000);
  }

  function listenToFragments() {
    EchoCore.on('echo:fragment-found', key => {
      whisper({ category: key });
    });
  }

  return {
    start: startGlobalWhispers,
    whisper,
    listenToCore: listenToFragments
  };console.log('Whispers script loaded');

})();
