// Shared animation + interaction helpers for СО «Евразия» site.
// Imported dynamically from each page's DC logic (componentDidMount).

function animateCount(el) {
  if (el.__counted) return;
  el.__counted = true;
  const target = parseFloat(el.getAttribute('data-count'));
  if (isNaN(target)) return;
  const suffix = el.getAttribute('data-count-suffix') || '';
  const dur = 1300;
  const start = performance.now();
  function tick(now) {
    const p = Math.min(1, (now - start) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * e) + suffix;
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = target + suffix;
  }
  requestAnimationFrame(tick);
}

export function initAnimations(root) {
  root = root || document;
  const reveal = (el) => {
    el.style.opacity = '1';
    el.style.transform = 'none';
    if (el.hasAttribute && el.hasAttribute('data-count')) animateCount(el);
    if (el.querySelectorAll) el.querySelectorAll('[data-count]').forEach(animateCount);
  };
  const items = [...root.querySelectorAll('[data-reveal]:not([data-reveal-init])')];
  let io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  }
  const vh = window.innerHeight || document.documentElement.clientHeight;
  items.forEach((el) => {
    el.setAttribute('data-reveal-init', '1');
    const r = el.getBoundingClientRect();
    if (r.top < vh * 0.96 && r.bottom > 0) { reveal(el); return; } // already in view → show now
    el.style.opacity = '0';
    el.style.transform = 'translateY(28px)';
    el.style.transition = 'opacity .7s cubic-bezier(.22,.61,.36,1), transform .7s cubic-bezier(.22,.61,.36,1)';
    el.style.transitionDelay = ((parseInt(el.getAttribute('data-reveal')) || 0) * 0.08) + 's';
    if (io) io.observe(el); else reveal(el);
  });
  const revealAll = () => root.querySelectorAll('[data-reveal-init]').forEach(reveal);
  window.addEventListener('scroll', revealAll, { once: true, passive: true });
  setTimeout(revealAll, 2600); // safety net
}

export function initCarousels(root) {
  root = root || document;
  root.querySelectorAll('[data-carousel]:not([data-carousel-init])').forEach((wrap) => {
    wrap.setAttribute('data-carousel-init', '1');
    const track = wrap.querySelector('[data-carousel-track]');
    if (!track) return;
    const prev = wrap.querySelector('[data-carousel-prev]');
    const next = wrap.querySelector('[data-carousel-next]');
    const dotsWrap = wrap.querySelector('[data-carousel-dots]');
    const slides = [...track.querySelectorAll('[data-carousel-slide]')];
    const step = () => {
      const first = slides[0];
      const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || 0) || 0;
      return first ? first.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
    };
    if (prev) prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    if (next) next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));

    let dots = [];
    if (dotsWrap) {
      slides.forEach((s, i) => {
        const d = document.createElement('button');
        d.type = 'button';
        d.setAttribute('aria-label', 'Слайд ' + (i + 1));
        d.style.cssText = 'width:8px;height:8px;border-radius:50%;border:none;padding:0;cursor:pointer;background:rgba(27,29,33,0.2);transition:background .25s,width .25s';
        d.addEventListener('click', () => track.scrollTo({ left: s.offsetLeft - track.offsetLeft, behavior: 'smooth' }));
        dotsWrap.appendChild(d);
        dots.push(d);
      });
    }
    const sync = () => {
      const center = track.scrollLeft + track.clientWidth / 2;
      let active = 0, best = Infinity;
      slides.forEach((s, i) => {
        const c = s.offsetLeft - track.offsetLeft + s.clientWidth / 2;
        const dist = Math.abs(c - center);
        if (dist < best) { best = dist; active = i; }
      });
      dots.forEach((d, i) => {
        const on = i === active;
        d.style.background = on ? '#A9761B' : 'rgba(27,29,33,0.2)';
        d.style.width = on ? '22px' : '8px';
        d.style.borderRadius = on ? '4px' : '50%';
      });
    };
    track.addEventListener('scroll', () => { window.requestAnimationFrame(sync); }, { passive: true });
    sync();

    let timer = setInterval(() => {
      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 6) track.scrollTo({ left: 0, behavior: 'smooth' });
      else track.scrollBy({ left: step(), behavior: 'smooth' });
    }, 4500);
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    ['pointerdown', 'mouseenter', 'touchstart', 'wheel'].forEach((ev) => wrap.addEventListener(ev, stop, { passive: true }));
  });
}

export function triggerCountersInView(root) {
  root = root || document;
  const vh = window.innerHeight || document.documentElement.clientHeight;
  root.querySelectorAll('[data-count]').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < vh && r.bottom > 0) animateCount(el);
  });
}

export function initSite(root) {
  initAnimations(root);
  initCarousels(root);
  triggerCountersInView(root);
}
