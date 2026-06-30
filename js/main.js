/* Rocketlane — Create Video page (option 2)
 * Hero = scroll-scrubbed video, driven by a frame sequence (assets/frames.json)
 * painted to <canvas>, wired to GSAP ScrollTrigger.
 * Source clip is native 16:9 (1920x1080), shown as a centered "porthole" card.
 */
gsap.registerPlugin(ScrollTrigger);

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- helpers ---------- */
// centered cover-fill: fills the canvas, cropping equally if needed.
function coverDraw(ctx, img, cw, ch) {
  const ir = img.width / img.height;
  const cr = cw / ch;
  let dw, dh, dx, dy;
  if (ir > cr) { dh = ch; dw = ch * ir; dx = (cw - dw) / 2; dy = 0; }
  else { dw = cw; dh = cw / ir; dx = 0; dy = (ch - dh) / 2; }
  ctx.drawImage(img, dx, dy, dw, dh);
}

function fitCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const r = canvas.getBoundingClientRect();
  canvas.width = Math.round(r.width * dpr);
  canvas.height = Math.round(r.height * dpr);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return ctx;
}

const HERO_AR = 1920 / 1080; // native frame aspect ratio (16:9 ≈ 1.778)

// Size the hero "porthole" card to the frame's own aspect ratio so the full
// 16:9 frame shows with no internal bars and balanced space on every side.
function layoutHeroCanvas(canvas) {
  const sticky = canvas.closest('.hero__sticky');
  const cs = getComputedStyle(sticky);
  const availW = sticky.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const availH = sticky.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const naturalW = availH * HERO_AR; // width that shows the full frame at this height
  let w, h;
  if (availW >= naturalW) {
    // wide enough: fill the height, full frame
    h = availH;
    w = naturalW;
  } else {
    // narrow screen: fit the width, full frame
    w = availW;
    h = availW / HERO_AR;
  }
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return ctx;
}

/* ---------- 1. load manifest + preload frames ---------- */
async function loadFrames() {
  const res = await fetch('assets/frames.json');
  const manifest = await res.json();
  const sources = manifest.frames;
  const images = new Array(sources.length);
  let loaded = 0;

  const fill = document.getElementById('hero-loader-fill');
  const pct = document.getElementById('hero-loader-pct');

  await Promise.all(sources.map((src, i) => new Promise((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => {
      images[i] = img;
      loaded++;
      const p = Math.round((loaded / sources.length) * 100);
      if (fill) fill.style.width = p + '%';
      if (pct) pct.textContent = 'Loading ' + p + '%';
      resolve();
    };
    img.src = src;
  })));

  return { manifest, images };
}

/* ---------- 2. hero scrubber ---------- */
function initHero({ images }) {
  const canvas = document.getElementById('hero-canvas');
  let ctx = layoutHeroCanvas(canvas);
  const last = images.length - 1;
  const state = { frame: 0 };

  function render() {
    const idx = Math.max(0, Math.min(last, Math.round(state.frame)));
    const img = images[idx];
    if (!img) return;
    ctx.fillStyle = '#03040a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    coverDraw(ctx, img, canvas.width, canvas.height);
  }
  render();

  // scrub frames across the tall hero section
  gsap.to(state, {
    frame: last,
    ease: 'none',
    onUpdate: render,
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom bottom',
      scrub: prefersReduced ? false : 0.4,
    },
  });

  // scroll hint fades out quickly
  gsap.to('#hero-hint', {
    opacity: 0,
    scrollTrigger: { trigger: '#hero', start: 'top top', end: '12% top', scrub: true },
  });

  window.addEventListener('resize', () => {
    ctx = layoutHeroCanvas(canvas);
    render();
    ScrollTrigger.refresh();
  });

  return images;
}

/* ---------- 3. CTA banner uses a hero frame as a still backdrop ---------- */
function initCta(images) {
  const canvas = document.getElementById('cta-canvas');
  if (!canvas || !images.length) return;
  const img = images[Math.floor(images.length * 0.5)];
  function draw() {
    const ctx = fitCanvas(canvas);
    coverDraw(ctx, img, canvas.width, canvas.height);
  }
  draw();
  window.addEventListener('resize', draw);

  if (!prefersReduced) {
    gsap.fromTo(canvas, { yPercent: -8 }, {
      yPercent: 8, ease: 'none',
      scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }
}

/* ---------- 4. video library cards ---------- */
function buildCards(images) {
  const grid = document.getElementById('grid');
  if (!grid) return;
  const cards = [
    { badge: 'Featured', headline: 'Create your brand story', title: 'Video title', dur: '04:20', frame: 0.10 },
    { badge: 'Event', headline: 'Event Exploration Made Simple', title: 'Video title', dur: '02:45', frame: 0.30 },
    { badge: 'Design', headline: 'Design hora da bolha', title: 'Video title', dur: '06:12', frame: 0.55 },
    { badge: 'AI', headline: 'Contemporary Art in the Age of AI', title: 'Video title', dur: '03:58', frame: 0.72 },
    { badge: 'Mindset', headline: 'Consumer-First Mindset: Know Your Customer', title: 'Video title', dur: '05:30', frame: 0.42 },
    { badge: 'Sales', headline: 'Once You Get a Lead, How Do You Close?', title: 'Video title', dur: '07:04', frame: 0.88 },
  ];
  const grad = [
    'linear-gradient(135deg,#1f3a5f,#0f62fe)',
    'linear-gradient(135deg,#3a2f5f,#7a4ddb)',
    'linear-gradient(135deg,#0f3d3a,#16a34a)',
    'linear-gradient(135deg,#5f2f3a,#db4d6b)',
    'linear-gradient(135deg,#5f4a2f,#dba24d)',
    'linear-gradient(135deg,#2f4a5f,#4d9bdb)',
  ];

  grid.innerHTML = cards.map((c, i) => {
    const img = images[Math.floor((images.length - 1) * c.frame)];
    const bg = img ? `url('${img.src}')` : grad[i % grad.length];
    return `
    <article class="card">
      <div class="card__media">
        <div class="card__bg" style="background-image:${bg}"></div>
        <span class="card__badge">${c.badge}</span>
        <div class="card__play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
        <h4 class="card__headline">${c.headline}</h4>
      </div>
      <div class="card__foot">
        <div class="card__foot-left">
          <div class="card__avatars"><span></span><span></span><span></span></div>
          <span class="card__title">${c.title}</span>
        </div>
        <span class="card__dur">${c.dur}</span>
      </div>
    </article>`;
  }).join('');

  // reveal on scroll
  if (!prefersReduced) {
    gsap.from('.card', {
      y: 40, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out',
      scrollTrigger: { trigger: '.grid', start: 'top 80%' },
    });
    gsap.from('.statement__text', {
      y: 30, opacity: 0, duration: 0.7, ease: 'power2.out',
      scrollTrigger: { trigger: '.statement', start: 'top 75%' },
    });
  }
}

/* ---------- nav scroll state ---------- */
function initNav() {
  const nav = document.getElementById('nav');
  ScrollTrigger.create({
    start: 'top -60',
    onUpdate: (self) => nav.classList.toggle('is-scrolled', self.scroll() > 60),
  });
}

/* ---------- boot ---------- */
(async function () {
  initNav();
  const { manifest, images } = await loadFrames();
  document.getElementById('hero-loader')?.classList.add('is-done');
  initHero({ images });
  initCta(images);
  buildCards(images);
  ScrollTrigger.refresh();
})();
