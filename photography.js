/* =========================================================
   photography.js (FULL REWRITE / final polish)
   Works with your rewritten photography.html + photography.css

   Highlights
   - Responsive Cloudinary delivery (srcset + sizes + f_auto/q_auto/dpr_auto)
   - Album stack renderer (one-open-at-a-time)
   - Toolbar: Collapse all / Open first
   - A11y: aria-controls/expanded, focus restore, focus trap, esc to close
   - Lightbox: scroll lock, overlay click to close, swipe, keyboard nav, H to hide UI
   - Deep link: #album=slug&photo=index (replaceState while browsing)
   ========================================================= */

(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", init);

  // -----------------------------
  // CONFIG
  // -----------------------------
  const CLOUD_NAME = "dyllpyvcu";
  const CLOUD_FOLDER = ""; // optional folder prefix in Cloudinary

  const ALBUMS = [
    {
      slug: "first-two-weeks",
      title: "First two weeks of van life",
      subtitle: "A roll of light, road, and the new routine.",
      year: "2026",
      location: "Southwest",
      previewCount: 6,
      photos: [
        { id: "photo1_o6jddw", caption: "" },
        { id: "photo2_k0hkrx", caption: "" },
        { id: "photo3_bfr2ct", caption: "" },
        { id: "photo4_wbwtot", caption: "" },
        { id: "photo5_szavdr", caption: "" },
        { id: "photo6_pq7oqh", caption: "" },
        { id: "photo7_svwbhb", caption: "" },
        { id: "photo8_bkffed", caption: "" },
        { id: "photo9_kgdonk", caption: "" },
        { id: "photo10_agl4zz", caption: "" },
        { id: "photo11_ltkcj8", caption: "" },
        { id: "photo12_fluwte", caption: "" },
        { id: "photo13_xt9vrb", caption: "" },
        { id: "photo14_xiaevv", caption: "" },
        { id: "photo15_xnxw7u", caption: "" },
        { id: "photo16_vdn05x", caption: "" },
        { id: "photo17_ioczzt", caption: "" },
        { id: "photo18_s6slfx", caption: "" },
        { id: "photo19_hcupvt", caption: "" },
        { id: "photo20_knoawt", caption: "" },
        { id: "photo21_na7dyr", caption: "" },
        { id: "photo22_e6wlcz", caption: "" },
        { id: "photo23_xt1g3b", caption: "" },
      ],
    },
    {
      slug: "desert-forms",
      title: "Desert forms",
      subtitle: "Shapes, silence, and distance.",
      year: "—",
      location: "—",
      previewCount: 6,
      photos: [],
      comingSoon: true,
    },
  ];

  // -----------------------------
  // DOM REFS (filled in init)
  // -----------------------------
  let stack,
    toolbar,
    toolbarHint,
    lightbox,
    modalContent,
    imgEl,
    captionEl,
    closeBtn,
    prevBtn,
    nextBtn,
    hudAlbum,
    hudCount;

  // -----------------------------
  // LIGHTBOX STATE
  // -----------------------------
  const LB = {
    open: false,
    albumIndex: 0,
    photoIndex: 0,
    lastFocus: null,
    // handlers (attached only while open)
    onKeydown: null,
    onOverlayClick: null,
    onTouchStart: null,
    onTouchEnd: null,
    startX: 0,
    startY: 0,
  };

  // -----------------------------
  // INIT
  // -----------------------------
  function init() {
    stack = document.getElementById("dkAlbumStack");
    if (!stack) return;

    toolbar = document.querySelector(".photo-toolbar");
    toolbarHint = document.getElementById("dkToolbarHint");

    lightbox = document.getElementById("dkLightbox");
    modalContent = document.getElementById("dkModalContent");
    imgEl = document.getElementById("dkLightboxImg");
    captionEl = document.getElementById("dkLightboxCaption");
    closeBtn = document.getElementById("dkCloseLightbox");
    prevBtn = document.getElementById("dkPrevBtn");
    nextBtn = document.getElementById("dkNextBtn");
    hudAlbum = document.getElementById("dkHudAlbum");
    hudCount = document.getElementById("dkHudCount");

    if (
      !lightbox ||
      !modalContent ||
      !imgEl ||
      !captionEl ||
      !closeBtn ||
      !prevBtn ||
      !nextBtn ||
      !hudAlbum ||
      !hudCount
    ) {
      console.warn("Photography page: missing required lightbox elements.");
      return;
    }

    renderAlbums();
    wireStackEvents();
    wireToolbar();
    wireHashChange();

    // Start state: deep-link wins; else open first album (not lightbox)
    const applied = applyHash();
    if (!applied) openOnly(0, { scroll: false });

    // Minor UX polish
    if (toolbarHint) toolbarHint.textContent = "Tip: use ← → in the viewer";
  }

  // -----------------------------
  // CLOUDINARY
  // -----------------------------
  function cldPublicId(id) {
    return CLOUD_FOLDER ? `${CLOUD_FOLDER}/${id}` : id;
  }

  // Keep transforms minimal; CSS handles crop via object-fit.
  function cldUrl(id, width, extra = "") {
    const t = `f_auto,q_auto,dpr_auto,w_${width}${extra ? "," + extra : ""}`;
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${t}/${cldPublicId(id)}`;
  }

  function responsiveAttrs(id, kind) {
    // widths tuned for your layout + breakpoints
    const widths =
      kind === "tile"
        ? [240, 320, 420, 520, 680]
        : kind === "grid"
        ? [420, 680, 900, 1100, 1400]
        : [900, 1400, 2000, 2800]; // lightbox

    const src = cldUrl(id, widths[Math.min(2, widths.length - 1)]);
    const srcset = widths.map((w) => `${cldUrl(id, w)} ${w}w`).join(", ");

    const sizes =
      kind === "tile"
        ? "(min-width: 880px) 260px, (min-width: 520px) 220px, 48vw"
        : kind === "grid"
        ? "(min-width: 940px) 340px, (min-width: 600px) 44vw, 92vw"
        : "100vw";

    return { src, srcset, sizes };
  }

  // -----------------------------
  // RENDERING
  // -----------------------------
  function renderAlbums() {
    stack.innerHTML = ALBUMS.map((album, i) => renderAlbum(album, i)).join("");
  }

  function renderAlbum(album, albumIndex) {
    const total = album.photos.length;
    const previewCount = Math.min(album.previewCount ?? 6, total);
    const preview = album.photos.slice(0, previewCount);

    const meta = buildMeta(album, total);
    const bodyId = `dkAlbumBody-${albumIndex}`;

    const actions = `
      <div class="album-actions">
        <button class="btn toggle-album" type="button"
          data-action="toggle-album"
          data-album="${albumIndex}"
          aria-controls="${bodyId}"
          aria-expanded="false"
          ${album.comingSoon ? "disabled" : ""}>
          View album
        </button>
        ${
          total
            ? `<button class="btn secondary start-here" type="button"
                 data-action="start-here"
                 data-album="${albumIndex}">
                 Start here
               </button>`
            : ""
        }
      </div>
    `;

    const previewStrip = total
      ? `
        <div class="preview-strip" aria-label="Album preview">
          ${preview
            .map((p, idx) => {
              const a = responsiveAttrs(p.id, "tile");
              const isMore = idx === preview.length - 1 && total > previewCount;
              return `
                <button class="preview-tile ${isMore ? "more" : ""}"
                  type="button"
                  data-action="preview"
                  data-album="${albumIndex}"
                  data-photo-index="${idx}"
                  aria-label="Open preview ${idx + 1}">
                  <img
                    src="${a.src}"
                    srcset="${a.srcset}"
                    sizes="${a.sizes}"
                    alt="Preview ${idx + 1}"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              `;
            })
            .join("")}
        </div>
      `
      : `
        <div class="preview-strip" aria-label="Album preview">
          <div style="grid-column:1/-1; padding:0.65rem 0; opacity:0.75;">
            Coming soon.
          </div>
        </div>
      `;

    const body = total
      ? `
        <div class="album-body" id="${bodyId}" hidden>
          <div class="photo-grid">
            ${album.photos
              .map((p, idx) => {
                const a = responsiveAttrs(p.id, "grid");
                const alt = esc(p.caption || `Photo ${idx + 1}`);
                return `
                  <button class="photo-card" type="button"
                    data-action="photo"
                    data-album="${albumIndex}"
                    data-index="${idx}"
                    aria-label="Open photo ${idx + 1}">
                    <img
                      src="${a.src}"
                      srcset="${a.srcset}"
                      sizes="${a.sizes}"
                      alt="${alt}"
                      loading="lazy"
                      decoding="async"
                    />
                    ${p.caption ? `<span class="photo-caption">${esc(p.caption)}</span>` : ""}
                  </button>
                `;
              })
              .join("")}
          </div>
        </div>
      `
      : "";

    return `
      <article class="album" data-album-index="${albumIndex}">
        <div class="album-head">
          <div class="album-title-row">
            <h3 class="album-title">${esc(album.title)}</h3>
            ${meta}
          </div>
          ${album.subtitle ? `<p class="album-desc">${esc(album.subtitle)}</p>` : ""}
          ${actions}
        </div>
        ${previewStrip}
        ${body}
      </article>
    `;
  }

  function buildMeta(album, total) {
    const bits = [
      album.year && album.year !== "—" ? album.year : null,
      album.location && album.location !== "—" ? album.location : null,
      total ? `${total} frames` : null,
    ].filter(Boolean);

    if (!bits.length) return `<div class="album-meta" aria-hidden="true"></div>`;

    return `
      <div class="album-meta" aria-label="Album details">
        ${bits
          .map((b, i) => {
            const dot = i ? `<span class="dot" aria-hidden="true"></span>` : "";
            return `${dot}<span>${esc(b)}</span>`;
          })
          .join("")}
      </div>
    `;
  }

  // -----------------------------
  // STACK INTERACTIONS
  // -----------------------------
  function wireStackEvents() {
    stack.addEventListener("click", (e) => {
      const el = e.target.closest("[data-action]");
      if (!el) return;

      const action = el.dataset.action;
      const albumIndex = toInt(el.dataset.album, 0);

      if (action === "toggle-album") {
        toggleAlbum(albumIndex);
        return;
      }

      if (action === "start-here") {
        openOnly(albumIndex);
        openLightbox(albumIndex, 0, el);
        return;
      }

      if (action === "preview") {
        const photoIndex = toInt(el.dataset.photoIndex, 0);
        openOnly(albumIndex);
        openLightbox(albumIndex, photoIndex, el);
        return;
      }

      if (action === "photo") {
        const photoIndex = toInt(el.dataset.index, 0);
        openLightbox(albumIndex, photoIndex, el);
        return;
      }
    });
  }

  function toggleAlbum(index) {
    const albumEl = stack.querySelector(`.album[data-album-index="${index}"]`);
    if (!albumEl) return;

    const isOpen = albumEl.classList.contains("is-open");
    if (isOpen) closeAll();
    else openOnly(index);
  }

  function setAlbumOpen(albumEl, open) {
    const btn = albumEl.querySelector('[data-action="toggle-album"]');
    const body = albumEl.querySelector(".album-body");

    albumEl.classList.toggle("is-open", open);

    if (btn) {
      btn.textContent = open ? "Collapse" : "View album";
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    }
    if (body) body.hidden = !open;
  }

  function closeAll() {
    stack.querySelectorAll(".album").forEach((a) => setAlbumOpen(a, false));
  }

  function openOnly(index, { scroll = true } = {}) {
    stack.querySelectorAll(".album").forEach((a) => {
      const idx = toInt(a.dataset.albumIndex, 0);
      setAlbumOpen(a, idx === index);
    });

    if (scroll) {
      stack
        .querySelector(`.album[data-album-index="${index}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // -----------------------------
  // TOOLBAR
  // -----------------------------
  function wireToolbar() {
    if (!toolbar) return;

    toolbar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;

      const action = btn.dataset.action;
      if (action === "collapse-all") closeAll();
      if (action === "expand-first") openOnly(0);
    });
  }

  // -----------------------------
  // LIGHTBOX
  // -----------------------------
  function openLightbox(albumIndex, photoIndex, openerEl) {
    const album = ALBUMS[albumIndex];
    if (!album || !album.photos || album.photos.length === 0) return;

    LB.open = true;
    LB.albumIndex = albumIndex;
    LB.photoIndex = clampIndex(photoIndex, album.photos.length);
    LB.lastFocus = openerEl || document.activeElement;

    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    modalContent.classList.remove("ui-hidden");

    setScrollLock(true);
    attachLightboxHandlers();

    // Focus modal for keyboard users (trap will keep it inside)
    modalContent.focus({ preventScroll: true });

    // Load image
    showLightboxPhoto(LB.photoIndex, { updateHash: true });
  }

  function closeLightbox({ clearHash = false } = {}) {
    LB.open = false;

    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    modalContent.classList.remove("ui-hidden");

    setScrollLock(false);
    detachLightboxHandlers();

    // Clear stage
    imgEl.removeAttribute("src");
    imgEl.removeAttribute("srcset");
    imgEl.removeAttribute("sizes");
    imgEl.alt = "";
    captionEl.textContent = "";
    hudAlbum.textContent = "";
    hudCount.textContent = "";

    if (clearHash) clearHashState();

    // Restore focus
    if (LB.lastFocus && typeof LB.lastFocus.focus === "function") {
      LB.lastFocus.focus({ preventScroll: true });
    }
    LB.lastFocus = null;
  }

  function nextPhoto() {
    if (!LB.open) return;
    showLightboxPhoto(LB.photoIndex + 1, { updateHash: true });
  }

  function prevPhoto() {
    if (!LB.open) return;
    showLightboxPhoto(LB.photoIndex - 1, { updateHash: true });
  }

  async function showLightboxPhoto(nextIndex, { updateHash } = {}) {
    const album = ALBUMS[LB.albumIndex];
    const len = album.photos.length;

    LB.photoIndex = clampIndex(nextIndex, len);
    const p = album.photos[LB.photoIndex];

    // Lightbox image uses a larger width; no object-fit crop, so no extra transforms.
    const a = responsiveAttrs(p.id, "lightbox");
    imgEl.src = cldUrl(p.id, 2800);
    imgEl.alt = p.caption || `${album.title} — ${LB.photoIndex + 1}`;
    captionEl.textContent = p.caption || "";

    // HUD
    hudAlbum.textContent = album.title;
    hudCount.textContent = `${LB.photoIndex + 1} / ${len}`;

    // Preload neighbors for snappy nav
    preloadNeighbor(+1);
    preloadNeighbor(-1);

    // Attempt decode (best effort)
    if (imgEl.decode) {
      try {
        await imgEl.decode();
      } catch (_) {}
    }

    // Hash update for shareability
    if (updateHash) setHashState(album.slug, LB.photoIndex);
  }

  function preloadNeighbor(delta) {
    const album = ALBUMS[LB.albumIndex];
    if (!album?.photos?.length) return;

    const len = album.photos.length;
    const i = clampIndex(LB.photoIndex + delta, len);
    const id = album.photos[i].id;

    const im = new Image();
    im.decoding = "async";
    im.src = cldUrl(id, 2400);
  }

  // -----------------------------
  // LIGHTBOX HANDLERS (attach only while open)
  // -----------------------------
  function attachLightboxHandlers() {
    if (LB.onKeydown) return;

    LB.onKeydown = (e) => {
      if (!LB.open) return;

      // Trap tab
      if (e.key === "Tab") trapFocus(e);

      if (e.key === "Escape") {
        closeLightbox({ clearHash: true });
        return;
      }

      if (e.key === "ArrowRight") nextPhoto();
      if (e.key === "ArrowLeft") prevPhoto();

      if (e.key.toLowerCase() === "h") {
        modalContent.classList.toggle("ui-hidden");
      }
    };

    LB.onOverlayClick = (e) => {
      if (e.target === lightbox) closeLightbox({ clearHash: true });
    };

    LB.onTouchStart = (e) => {
      if (!LB.open || !e.touches || !e.touches[0]) return;
      LB.startX = e.touches[0].clientX;
      LB.startY = e.touches[0].clientY;
    };

    LB.onTouchEnd = (e) => {
      if (!LB.open || !e.changedTouches || !e.changedTouches[0]) return;

      const dx = e.changedTouches[0].clientX - LB.startX;
      const dy = e.changedTouches[0].clientY - LB.startY;

      if (Math.abs(dy) > Math.abs(dx)) return; // vertical scroll intention
      if (dx < -40) nextPhoto();
      if (dx > 40) prevPhoto();
    };

    document.addEventListener("keydown", LB.onKeydown);
    lightbox.addEventListener("click", LB.onOverlayClick);

    lightbox.addEventListener("touchstart", LB.onTouchStart, { passive: true });
    lightbox.addEventListener("touchend", LB.onTouchEnd, { passive: true });

    closeBtn.addEventListener("click", () => closeLightbox({ clearHash: true }));
    nextBtn.addEventListener("click", nextPhoto);
    prevBtn.addEventListener("click", prevPhoto);
  }

  function detachLightboxHandlers() {
    if (!LB.onKeydown) return;

    document.removeEventListener("keydown", LB.onKeydown);
    lightbox.removeEventListener("click", LB.onOverlayClick);

    lightbox.removeEventListener("touchstart", LB.onTouchStart);
    lightbox.removeEventListener("touchend", LB.onTouchEnd);

    nextBtn.removeEventListener("click", nextPhoto);
    prevBtn.removeEventListener("click", prevPhoto);

    LB.onKeydown = null;
    LB.onOverlayClick = null;
    LB.onTouchStart = null;
    LB.onTouchEnd = null;
  }

  // -----------------------------
  // FOCUS TRAP
  // -----------------------------
  function trapFocus(e) {
    const focusables = Array.from(
      modalContent.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.disabled && el.offsetParent !== null);

    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // -----------------------------
  // HASH (deep linking)
  // Format: #album=slug&photo=index
  // -----------------------------
  function wireHashChange() {
    window.addEventListener("hashchange", () => {
      const parsed = parseHash();

      // If hash cleared while open, close without nuking history again
      if (!parsed && LB.open) {
        closeLightbox({ clearHash: false });
        return;
      }
      if (!parsed) return;

      const { albumIndex, photoIndex } = parsed;

      openOnly(albumIndex, { scroll: false });

      if (LB.open) {
        LB.albumIndex = albumIndex;
        showLightboxPhoto(photoIndex, { updateHash: false });
      } else {
        openLightbox(albumIndex, photoIndex, null);
      }
    });
  }

  function applyHash() {
    const parsed = parseHash();
    if (!parsed) return false;

    openOnly(parsed.albumIndex, { scroll: true });
    requestAnimationFrame(() => openLightbox(parsed.albumIndex, parsed.photoIndex, null));
    return true;
  }

  function parseHash() {
    const raw = (location.hash || "").replace(/^#/, "").trim();
    if (!raw) return null;

    const params = new URLSearchParams(raw);
    const slug = params.get("album");
    if (!slug) return null;

    const albumIndex = findAlbumIndexBySlug(slug);
    if (albumIndex < 0) return null;

    const photoIndex = toInt(params.get("photo"), 0);
    return { albumIndex, photoIndex };
  }

  function setHashState(slug, photoIndex) {
    const params = new URLSearchParams();
    params.set("album", slug);
    params.set("photo", String(photoIndex));
    history.replaceState(null, "", `#${params.toString()}`);
  }

  function clearHashState() {
    history.replaceState(null, "", location.pathname + location.search);
  }

  // -----------------------------
  // UTIL
  // -----------------------------
  function setScrollLock(on) {
    document.documentElement.classList.toggle("dk-scrolllock", !!on);
  }

  function clampIndex(i, len) {
    if (!len) return 0;
    const n = Number(i);
    const x = Number.isFinite(n) ? n : 0;
    return ((x % len) + len) % len;
  }

  function toInt(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function esc(str) {
    return String(str || "").replace(/[&"<>]/g, (m) => {
      if (m === "&") return "&amp;";
      if (m === '"') return "&quot;";
      if (m === "<") return "&lt;";
      return "&gt;";
    });
  }
})();
