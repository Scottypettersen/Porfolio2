// boot.js
document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('echo.booted')) return;

  const bootOverlay = document.createElement('div');
  bootOverlay.id = 'echo-boot';
  bootOverlay.innerHTML = `<div class="boot-lines" id="boot-lines"></div>`;
  document.body.appendChild(bootOverlay);

  const lines = [
    "ECHO SYSTEM v4.0 – booting...",
    "Memory integrity check: ██▒▒▒▒▒▒▒▒▒▒ 12%",
    "Memory integrity check: ██████▒▒▒▒▒▒ 56%",
    "Memory integrity check: ████████████ 100%",
    "Fragments missing: 3",
    "Running trace cleanup...",
    "Loading echo() interface...",
    "Boot complete.",
    "",
    "[ SYSTEM IDLE. INPUT REQUIRED TO CONTINUE ]"
  ];

  const container = document.getElementById('boot-lines');
  let index = 0;

  const interval = setInterval(() => {
    if (index < lines.length) {
      const line = document.createElement('div');
      line.textContent = lines[index++];
      container.appendChild(line);
    } else {
      clearInterval(interval);
      showContinueHint();
    }
  }, 500);

  function showContinueHint() {
    const hint = document.createElement('div');
    hint.className = 'boot-subtle-hint glitch-flicker';
    hint.innerHTML = `...echo waiting for input<span class="cursor flicker"></span><br><span class="boot-note">Press ENTER or tap to continue</span>`;
    container.appendChild(hint);

    const proceed = () => {
      localStorage.setItem('echo.booted', true);
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('click', proceed);
      bootOverlay.classList.add('fade-out');
      setTimeout(() => bootOverlay.remove(), 800);
    };

    const handleKey = (e) => {
      if (e.key === 'Enter') proceed();
    };

    document.addEventListener('keydown', handleKey);
    document.addEventListener('click', proceed, { once: true });
  }
});
