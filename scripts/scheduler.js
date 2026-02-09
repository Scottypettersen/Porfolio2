import { EchoCore } from '../echo-core.js';
import { EchoWhispers } from '../whispers.js';
import { EchoContent } from './content.js';

export const EchoScheduler = (() => {
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function whisperFrom(poolName) {
    const pool = EchoContent.pools[poolName] || EchoContent.pools.global;
    EchoWhispers.whisper({ category: 'global' }); // keeps your existing function
    // If you want direct injection, add a new EchoWhispers.enqueue(msg) later.
  }

  function init() {
    const page = EchoCore.get('page', 'home');
    const visits = parseInt(EchoCore.get('visits', '1'), 10) || 1;

    // Page-flavored first whisper (quietly)
    setTimeout(() => {
      const pool = EchoContent.pools[page] || EchoContent.pools.global;
      const msg = pick(pool);
      EchoWhispers.whisper({}); // uses internal pool
      // Next step: modify EchoWhispers to accept msg directly (below)
    }, 8000);

    // Return visitor whisper
    if (visits >= 2) {
      setTimeout(() => {
        const msg = pick(EchoContent.pools.returnVisitor);
        EchoWhispers.whisper({});
      }, 18000);
    }

    // Idle event whisper
    EchoCore.on('echo:idle', () => {
      const msg = pick(EchoContent.pools.idle);
      EchoWhispers.whisper({});
    });

    // Fragment found reaction already exists (EchoWhispers.listenToCore)
  }

  return { init };
})();
