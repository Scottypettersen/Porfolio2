const pdfData = [
    {
      title: "LIVE LAUGH LOVE POSTER",
      desc: "Typography study and Bauhaus satire using Herbert Bayer’s Universal Typeface.",
      poster: "LLL.pdf",
      caseStudy: "LLL case study.pdf"
    },
    {
      title: "LAWSON PROJECT",
      desc: "Award-winning invitation design for a Transporal event",
      poster: "LAWSON.pdf"
    },
    {
      title: "VHYES PROJECT",
      desc: "Cool ass VHS tape sleeve for a modern film.",
      poster: "VHYES.pdf"
    },
    {
      title: "1984 PROJECT",
      desc: "A typographic study on 80s typography and classic design.",
      poster: "1984.pdf"
    }
  ];
  
  
  const grid = document.querySelector(".pdfs-grid");
  
  pdfData.forEach(item => {
    const card = document.createElement("div");
    card.classList.add("pdf-card");
  
    card.innerHTML = `
      <embed src="${item.poster}#toolbar=0" type="application/pdf" width="100%" height="200px">
      <h3>${item.title}</h3>
      <p class="pdf-desc">${item.desc}</p>
      <div class="pdf-links">
        <a href="${item.poster}" target="_blank" class="btn">View Poster</a>
        ${item.caseStudy ? `<a href="${item.caseStudy}" target="_blank" class="btn">View Case Study</a>` : ""}
        ${item.caseStudy ? `<a href="${item.caseStudy}" download class="btn">Download Case Study</a>` : ""}
      </div>
    `;
  
    grid.appendChild(card);
  });
  