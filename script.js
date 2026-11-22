(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Header: shrink and show a rule once the page scrolls ---------- */
  const header = $('.site-header');
  const hero = $('#home');
  const root = document.documentElement;
  let frame = false;
  function onScroll() {
    frame = false;
    const y = window.scrollY;
    const heroH = hero.offsetHeight;
    header.classList.toggle('is-scrolled', y > 8);
    // the header is clear and white-on-dark while it sits over the hero
    header.classList.toggle('on-hero', y < heroH - header.offsetHeight);
    // reading progress along the header
    header.style.setProperty('--sp', (y / Math.max(1, root.scrollHeight - window.innerHeight)).toFixed(4));
    // hero parallax, only while the hero is on screen and only if motion is welcome
    if (!reduceMotion.matches && (y <= heroH || hero.style.getPropertyValue('--hp') !== '1.0000')) hero.style.setProperty('--hp', Math.min(1, y / heroH).toFixed(4));
  }
  const queueScroll = () => { if (!frame) { frame = true; requestAnimationFrame(onScroll); } };
  onScroll();
  window.addEventListener('scroll', queueScroll, { passive: true });
  window.addEventListener('resize', queueScroll);

  /* ---------- Active section in the nav, with a sliding orange underline ---------- */
  const navLinks = $$('.nav a[data-section]');
  const menuLinks = $$('.menu-nav a[data-section]');
  const indicator = $('.nav-indicator');
  const sectionIds = ['home', 'projects', 'skills', 'contact'];
  let current = 'home';

  function moveIndicator() {
    const link = navLinks.find((a) => a.dataset.section === current);
    if (!link || !indicator) return;
    indicator.style.width = `${link.offsetWidth}px`;
    indicator.style.transform = `translateX(${link.offsetLeft}px)`;
  }

  function setCurrent(id) {
    current = id;
    [...navLinks, ...menuLinks].forEach((a) => {
      if (a.dataset.section === id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    moveIndicator();
  }

  function pickSection() {
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (atBottom) return setCurrent('contact');
    const line = window.innerHeight * 0.35;
    let id = 'home';
    for (const s of sectionIds) {
      const el = document.getElementById(s);
      if (el && el.getBoundingClientRect().top <= line) id = s;
    }
    setCurrent(id);
  }
  pickSection();
  window.addEventListener('scroll', pickSection, { passive: true });
  window.addEventListener('resize', () => { moveIndicator(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveIndicator);

  /* ---------- Smooth in-page links (offset is handled by scroll-padding-top in CSS) ---------- */
  function goTo(hash) {
    const target = document.querySelector(hash);
    if (!target) return;
    target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', hash);
  }
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const hash = a.getAttribute('href');
      if (hash.length < 2) return;
      e.preventDefault();
      if (a.hasAttribute('data-menu-link')) closeMenu(false);
      goTo(hash);
    });
  });

  /* ---------- Mobile menu (focus is trapped while open) ---------- */
  const menu = $('#menu');
  const openBtn = $('.menu-btn');
  const closeBtn = $('.menu-close');
  let lastFocus = null;

  function openMenu() {
    lastFocus = document.activeElement;
    menu.removeAttribute('inert');
    menu.setAttribute('aria-hidden', 'false');
    menu.classList.add('is-open');
    openBtn.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('menu-open');
    closeBtn.focus();
  }
  function closeMenu(restoreFocus = true) {
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    menu.setAttribute('inert', '');
    openBtn.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('menu-open');
    if (restoreFocus && lastFocus) lastFocus.focus();
  }
  openBtn.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', () => closeMenu());
  document.addEventListener('keydown', (e) => {
    if (!menu.classList.contains('is-open')) return;
    if (e.key === 'Escape') return closeMenu();
    if (e.key !== 'Tab') return;
    const f = $$('a[href], button', menu);
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  window.matchMedia('(min-width: 768px)').addEventListener('change', (e) => {
    if (e.matches && menu.classList.contains('is-open')) closeMenu(false);
  });

  /* ---------- Skills slider ---------- */
  const slider = $('.slider');
  const slides = $$('.slide', slider);
  const segments = $$('.progress span', slider);
  const counter = $('.counter');
  const live = $('#skills-live');
  let index = 0;

  function show(n, dir) {
    index = (n + slides.length) % slides.length;
    slider.dataset.dir = dir;
    slides.forEach((s, k) => {
      const on = k === index;
      s.classList.toggle('is-active', on);
      s.setAttribute('aria-hidden', String(!on));
    });
    segments.forEach((s, k) => s.classList.toggle('is-on', k <= index));
    counter.textContent = `${index + 1}/${slides.length}`;
    live.textContent = `${$('.slide-title', slides[index]).textContent}, ${index + 1} of ${slides.length}`;
  }
  slides.forEach((s, k) => s.setAttribute('aria-hidden', String(k !== 0)));
  $('.ctl-next').addEventListener('click', () => show(index + 1, 'next'));
  $('.ctl-prev').addEventListener('click', () => show(index - 1, 'prev'));
  slider.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1, 'next'); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1, 'prev'); }
  });

  // swipe on touch screens
  let startX = 0;
  let startY = 0;
  slider.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; }, { passive: true });
  slider.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(index + (dx < 0 ? 1 : -1), dx < 0 ? 'next' : 'prev');
  }, { passive: true });

  /* ---------- Scroll reveals: headings rise out of a mask, rows and captions glide up ---------- */
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    $$('.section-head').forEach((el) => { el.classList.add('rv', 'rv-head'); io.observe(el); });
    $$('.project-caption, .skills .slider, .skills-controls, .contact-list li').forEach((el, i) => {
      el.classList.add('rv', 'rv-up');
      if (el.matches('.contact-list li')) el.style.transitionDelay = `${(i % 5) * 80}ms`;
      io.observe(el);
    });
  }

  /* ---------- Moment: the TapKo screenshot develops as the Projects section arrives ---------- */
  const media = $('.project-media');
  if (media && !reduceMotion.matches) {
    let queued = false;
    const develop = () => {
      queued = false;
      const p = Math.min(1, Math.max(0, (window.innerHeight - media.getBoundingClientRect().top) / (window.innerHeight * 0.55)));
      media.style.setProperty('--p', (1 - (1 - p) ** 3).toFixed(3));
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(develop); } };
    develop();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
  }
})();
