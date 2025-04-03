<script>
    const quotes = [
        { text: "Good design is honest.", author: "Dieter Rams" },
        { text: "Design is the silent ambassador of your brand.", author: "Paul Rand" },
        { text: "Design is thinking made visual.", author: "Saul Bass" },
        { text: "A designer knows he has achieved perfection not when there is nothing left to add, but when there is nothing left to take away.", author: "Antoine de Saint-Exupéry" },
        { text: "Less, but better.", author: "Dieter Rams" },
        { text: "Styles come and go. Good design is a language, not a style.", author: "Massimo Vignelli" },
        { text: "Design is intelligence made visible.", author: "Alina Wheeler" }
    ];

    window.addEventListener('DOMContentLoaded', () => {
        const random = quotes[Math.floor(Math.random() * quotes.length)];
        document.getElementById('quote-text').textContent = `"${random.text}"`;
        document.getElementById('quote-author').textContent = `- ${random.author}`;
    });