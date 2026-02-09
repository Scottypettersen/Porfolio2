// Print / Save PDF
document.getElementById('printBtn')?.addEventListener('click', () => {
  window.print();
});

// Auto year
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

// Optional whisper
const whisper = document.getElementById('whisper');
if (whisper) {
  requestAnimationFrame(() => {
    whisper.style.opacity = '1';
    whisper.style.transform = 'translateX(-50%) translateY(0)';
  });
  setTimeout(() => {
    whisper.style.opacity = '0';
  }, 2400);
}
