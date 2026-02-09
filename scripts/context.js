import { EchoCore } from '../echo-core.js';

export const EchoContext = (() => {
  let idleTimer = null;
  let lastMove = Date.now();
  let startedAt = Date.now();

  function pageTag() {
    // You can tune this to your site routes
    const path = location.pathname.toLowerCase();
    if (path.includes('photo')) return 'photo';
    if (path.includes('about')) return 'about';
    if (path.includes('project') || path.includes('portfolio')) return 'work';
    return 'home';
  }

  function bumpVisit() {
    const n = parseInt(EchoCore.get('visits', '0'), 10) || 0;
    EchoCore.set('visits', String(n + 1));
    EchoCore.emit('echo:visit', n + 1);
  }

  function trackTime() {
    // store seconds, low frequency
    setInterval(() => {
      const seconds = Math.floor((Date.now() - startedAt) / 1000);
      EchoCore.set('timeOnPage', String(seconds));
      EchoCore.emit('echo:time', seconds);
    }, 5000);
  }

  function idleWatch({ idleMs = 45000 } = {}) {
    const markActive = () => { lastMove = Date.now(); };

    ['mousemove', 'keydown', 'scroll', 'touchstart'].forEach(evt =>
      window.addEventListener(evt, markActive, { passive: true })
    );

    idleTimer = setInterval(() => {
      const idleFor = Date.now() - lastMove;
      if (idleFor > idleMs) EchoCore.emit('echo:idle', { idleFor });
    }, 5000);
  }

  function init() {
    EchoCore.set('page', pageTag());
    bumpVisit();
    trackTime();
    idleWatch();
  }

  return { init, pageTag };
})();
