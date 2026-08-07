/* ============================================================
   SentinelGuard — showcase site
   main.js — all behaviour. No dependencies, no build step.
   Blocks: config · reveal · nav · architecture · shots · feedback · grid
   ============================================================ */

/* ---------- CONFIG — the only thing you normally edit ---------- */
var SG_CONFIG = {
  // Preferred: a form endpoint that accepts a JSON POST (Formspree,
  // Getform, Basin…). Works on GitHub Pages — no server of your own.
  feedbackEndpoint: '',            // e.g. 'https://formspree.io/f/xxxxxxx'

  // Fallback used when feedbackEndpoint is empty: opens the visitor's
  // mail client with the note pre-filled.
  feedbackEmail: ''                // e.g. 'team@sentinelguard.dev'
};

(function () {
  'use strict';
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- 1. SCROLL REVEAL ----------
     Elements marked [data-reveal] fade+rise once. Fails open: if the
     observer never reports, everything is shown, so content is never
     stranded invisible. */
  (function reveal() {
    if (!('IntersectionObserver' in window)) return;
    var fired = false;
    var show = function (el) { el.classList.add('in'); };
    var io = new IntersectionObserver(function (entries) {
      fired = true;
      entries.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    document.documentElement.setAttribute('data-reveal-on', '');
    $$('[data-reveal]').forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) show(el);
      else io.observe(el);
    });
    setTimeout(function () {
      if (fired) return;
      io.disconnect();
      $$('[data-reveal]').forEach(show);
    }, 900);
  })();

  /* ---------- 2. NAV DRAWER (phone) ---------- */
  (function nav() {
    var btn = $('#navMenuBtn'), drawer = $('#navDrawer');
    if (!btn || !drawer) return;
    var setOpen = function (open) {
      drawer.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    };
    btn.addEventListener('click', function () {
      setOpen(btn.getAttribute('aria-expanded') !== 'true');
    });
    $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    document.addEventListener('click', function (e) {
      if (!drawer.contains(e.target) && !btn.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  })();

  /* ---------- 3. ARCHITECTURE PANEL ---------- */
  (function architecture() {
    var btn = $('#archToggle'), panel = $('#archPanel');
    if (!btn || !panel) return;
    var label = $('.arch-toggle-label', btn), caret = $('.caret', btn);
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      panel.classList.toggle('is-open', open);
      label.textContent = open ? 'HIDE' : 'SHOW MORE';
      caret.textContent = open ? '−' : '+';
    });
  })();

  /* ---------- 4. SCREENSHOT RAIL ----------
     Arrows step by exactly one card + gutter, so the snap points line up. */
  (function shots() {
    var row = $('#shots');
    if (!row) return;
    var step = function () {
      var card = row.firstElementChild;
      return card ? card.getBoundingClientRect().width + 24 : row.clientWidth * 0.8;
    };
    var go = function (dir) { row.scrollBy({ left: dir * step(), behavior: 'smooth' }); };
    var prev = $('#shotsPrev'), next = $('#shotsNext');
    if (prev) prev.addEventListener('click', function () { go(-1); });
    if (next) next.addEventListener('click', function () { go(1); });
  })();

  /* ---------- 5. FEEDBACK ---------- */
  (function feedback() {
    var toggle = $('#fbToggle'), panel = $('#fbPanel'), close = $('#fbClose');
    var form = $('#fbForm'), thanks = $('#fbThanks'), error = $('#fbError');
    var submit = $('#fbSubmit'), hint = $('#fbHint');
    var message = $('#fbMessage'), email = $('#fbEmail');
    if (!toggle || !panel) return;

    var rating = '';
    hint.textContent = SG_CONFIG.feedbackEndpoint
      ? 'Goes straight to the team. No account needed.'
      : 'Opens your mail app with the note ready to send.';

    var setOpen = function (open) {
      panel.classList.toggle('is-open', open);
      panel.setAttribute('aria-hidden', String(!open));
      toggle.setAttribute('aria-expanded', String(open));
      if (open) message.focus();
    };
    toggle.addEventListener('click', function () { setOpen(!panel.classList.contains('is-open')); });
    close.addEventListener('click', function () { setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });

    $$('.fb-rating').forEach(function (b) {
      b.addEventListener('click', function () {
        var on = b.getAttribute('aria-pressed') === 'true';
        $$('.fb-rating').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', String(!on));
        rating = on ? '' : b.dataset.rating;
        error.classList.remove('is-on');
      });
    });

    var fail = function (msg) { error.textContent = msg; error.classList.add('is-on'); };
    var succeed = function () { form.style.display = 'none'; thanks.classList.add('is-on'); };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = message.value.trim();
      if (!text && !rating) { fail('Add a rating or a note before sending.'); return; }
      error.classList.remove('is-on');

      var payload = { impression: rating, message: text, email: email.value.trim(), page: 'SentinelGuard showcase' };

      if (!SG_CONFIG.feedbackEndpoint) {
        if (!SG_CONFIG.feedbackEmail) { fail('No delivery address configured yet.'); return; }
        var body = (rating ? 'Impression: ' + rating + '\n\n' : '') + text +
                   (payload.email ? '\n\nFrom: ' + payload.email : '');
        window.location.href = 'mailto:' + SG_CONFIG.feedbackEmail +
          '?subject=' + encodeURIComponent('SentinelGuard site feedback') +
          '&body=' + encodeURIComponent(body);
        succeed();
        return;
      }

      submit.disabled = true;
      submit.textContent = 'SENDING…';
      fetch(SG_CONFIG.feedbackEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) {
        if (!r.ok) throw new Error('bad status');
        succeed();
      }).catch(function () {
        submit.disabled = false;
        submit.textContent = 'SEND FEEDBACK';
        fail("Couldn't send just now — please try again or email us.");
      });
    });
  })();

  /* ---------- 6. GRID OVERLAY (design aid) ---------- */
  (function gridOverlay() {
    var btn = $('#gridToggle'), overlay = $('#gridOverlay');
    if (!btn || !overlay) return;
    btn.addEventListener('click', function () {
      var on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(on));
      overlay.classList.toggle('is-on', on);
    });
  })();
})();
