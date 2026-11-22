(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');

  /* ---------- Hero statement: words arrive one by one ---------- */
  const statement = $('.hero-statement');
  if (!reduceMotion.matches) {
    const words = statement.textContent.trim().split(/\s+/);
    statement.textContent = '';
    words.forEach((w, i) => {
      const span = document.createElement('span');
      span.className = 'w';
      span.style.setProperty('--i', i);
      span.textContent = w;
      statement.append(span, i < words.length - 1 ? ' ' : '');
    });
  }
  statement.classList.add('is-split');

  /* ---------- Interface sounds: off until the visitor switches them on ---------- */
  let soundOn = false;
  try { soundOn = localStorage.getItem('sound') === 'on'; } catch (e) { /* storage blocked */ }
  let audio = null;
  function blip(freq = 620, dur = 0.07, vol = 0.05) {
    if (!soundOn) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const t = audio.currentTime;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + dur);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(audio.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    } catch (e) { /* audio unavailable */ }
  }
  const soundBtn = $('.sound-toggle');
  function paintSound() {
    soundBtn.setAttribute('aria-pressed', String(soundOn));
    soundBtn.textContent = soundOn ? 'Sound on' : 'Sound off';
  }
  paintSound();
  soundBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    try { localStorage.setItem('sound', soundOn ? 'on' : 'off'); } catch (e) { /* storage blocked */ }
    paintSound();
    blip(740);
  });
  $$('.btn, .menu-btn').forEach((b) => b.addEventListener('pointerdown', () => blip(480, 0.05, 0.035)));

  /* ---------- Magnetic buttons: drift toward the pointer, spring back ---------- */
  if (fine.matches && !reduceMotion.matches) {
    $$('[data-magnet]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--tx', `${((e.clientX - (r.left + r.width / 2)) * 0.18).toFixed(1)}px`);
        el.style.setProperty('--ty', `${((e.clientY - (r.top + r.height / 2)) * 0.28).toFixed(1)}px`);
      });
      el.addEventListener('pointerleave', () => { el.style.removeProperty('--tx'); el.style.removeProperty('--ty'); });
    });
  }

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
  const counterN = $('.counter-n');
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
    counterN.textContent = String(index + 1);
    if (!reduceMotion.matches) {
      counterN.classList.remove('pop');
      void counterN.offsetWidth; // restart the animation
      counterN.classList.add('pop');
    }
    blip(index % 2 ? 520 : 640);
    live.textContent = `${$('.slide-title', slides[index]).textContent}, ${index + 1} of ${slides.length}`;
  }
  slides.forEach((s, k) => s.setAttribute('aria-hidden', String(k !== 0)));
  $('.ctl-next').addEventListener('click', () => show(index + 1, 'next'));
  $('.ctl-prev').addEventListener('click', () => show(index - 1, 'prev'));
  slider.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1, 'next'); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1, 'prev'); }
  });

  // spotlight follows the pointer
  if (fine.matches) {
    slider.addEventListener('pointermove', (e) => {
      const r = slider.getBoundingClientRect();
      slider.style.setProperty('--sx', `${e.clientX - r.left}px`);
      slider.style.setProperty('--sy', `${e.clientY - r.top}px`);
    });
  }

  // drag with a mouse
  let dragX = null;
  slider.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') dragX = e.clientX; });
  window.addEventListener('pointerup', (e) => {
    if (dragX === null) return;
    const dx = e.clientX - dragX;
    dragX = null;
    if (Math.abs(dx) > 60) show(index + (dx < 0 ? 1 : -1), dx < 0 ? 'next' : 'prev');
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

  /* ---------- Project window: a gentle tilt with a glare that follows the pointer ---------- */
  const projectFrame = $('.project-frame');
  if (projectFrame && fine.matches && !reduceMotion.matches) {
    projectFrame.addEventListener('pointermove', (e) => {
      const r = projectFrame.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      projectFrame.style.setProperty('--ry', `${((x - 0.5) * 4).toFixed(2)}deg`);
      projectFrame.style.setProperty('--rx', `${((0.5 - y) * 3).toFixed(2)}deg`);
      projectFrame.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
      projectFrame.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
    });
    projectFrame.addEventListener('pointerleave', () => { ['--rx', '--ry'].forEach((v) => projectFrame.style.removeProperty(v)); });
  }

  /* ---------- Contact: a highlight glides between rows ---------- */
  const wrap = $('.contact-wrap');
  const glide = $('.row-glide');
  if (wrap && glide) {
    $$('.contact-list li', wrap).forEach((li) => li.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      if (!glide.classList.contains('is-on')) { // first entry: appear in place instead of sliding in from the top
        glide.style.transition = 'opacity 0.25s';
        glide.style.height = `${li.offsetHeight}px`;
        glide.style.transform = `translateY(${li.offsetTop}px)`;
        void glide.offsetWidth;
        glide.style.transition = '';
      } else {
        glide.style.height = `${li.offsetHeight}px`;
        glide.style.transform = `translateY(${li.offsetTop}px)`;
      }
      glide.classList.add('is-on');
    }));
    wrap.addEventListener('pointerleave', () => glide.classList.remove('is-on'));
  }

  /* ---------- Copy email ---------- */
  const toast = $('.toast');
  let toastTimer;
  function say(msg) {
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2000);
  }
  $$('.copy-btn').forEach((btn) => btn.addEventListener('click', async () => {
    const text = btn.dataset.copy;
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
      const t = document.createElement('textarea'); // fallback for pages not served over https
      t.value = text; t.style.cssText = 'position:fixed;opacity:0';
      document.body.append(t); t.select();
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      t.remove();
    }
    if (!ok) return say('Could not copy. Select the address instead.');
    btn.classList.add('is-done');
    say('Email copied');
    blip(880, 0.09);
    setTimeout(() => btn.classList.remove('is-done'), 1800);
  }));

  /* ---------- Footer clock: local time in Botolan ---------- */
  const clock = $('#clock');
  if (clock) {
    const fmt = new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' });
    const paint = () => { clock.textContent = ` · ${fmt.format(new Date())}`; };
    paint();
    setInterval(paint, 20000);
  }

  /* ---------- Moment: the TapKo screenshot develops as the Projects section arrives ---------- */
  const media = $('.project-frame');
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
