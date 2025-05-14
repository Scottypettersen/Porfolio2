// background.js
;(function(){
  const body = document.body;
  const root = document.documentElement;

  // 1) Your images
  const images = [
    'backgrounds/portfolio.jpg',
    'backgrounds/portfolio2.jpeg',
    'backgrounds/portfolio3.jpeg',
    'backgrounds/portfolio4.jpeg',
    'backgrounds/portfolio5.jpeg'
  ];

  // 2) Your quotes
  const quotes = [
    { text: "Good design is honest.", author: "Dieter Rams" },
    { text: "Design is the silent ambassador of your brand.", author: "Paul Rand" },
    { text: "Design is thinking made visual.", author: "Saul Bass" },
    { text: "A designer knows he has achieved perfection not when there is nothing left to add, but when there is nothing left to take away.", author: "Antoine de Saint-Exupéry" },
    { text: "Less, but better.", author: "Dieter Rams" },
    { text: "Styles come and go. Good design is a language, not a style.", author: "Massimo Vignelli" },
    { text: "Design is intelligence made visible.", author: "Alina Wheeler" }
  ];

  // grab your DOM nodes
  const quoteTextEl   = document.getElementById('quote-text');
  const quoteAuthorEl = document.getElementById('quote-author');

  // helper: pick & render a random quote
  function updateQuote() {
    const { text, author } = quotes[Math.floor(Math.random() * quotes.length)];
    quoteTextEl.textContent   = `"${text}"`;
    quoteAuthorEl.textContent = `– ${author}`;
  }

  // pick a random start index
  let idx = Math.floor(Math.random() * images.length);

  // set the initial bg1 and initial quote
  root.style.setProperty('--bg1', `url('${images[idx]}')`);
  updateQuote();

  // preload everything
  images.forEach(src => new Image().src = src);

  // crossfade routine (5s fade)
  function crossfadeTo(nextIdx) {
    root.style.setProperty('--bg2', `url('${images[nextIdx]}')`);
    body.classList.add('fade');
    
    // swap in 5s, then clear fade class
    setTimeout(() => {
      root.style.setProperty('--bg1', `url('${images[nextIdx]}')`);
      body.classList.remove('fade');
    }, 5000);

    // also update quote at the same moment we trigger fade
    updateQuote();
  }

  // only run on index.html (where you have class="home")
  if (!body.classList.contains('home')) return;

  // every 8s advance BG + quote
  setInterval(() => {
    idx = (idx + 1) % images.length;
    crossfadeTo(idx);
  }, 8000);

})();
