/* Rashmi College of Physiotherapy: site interactions (no dependencies) */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cfg = window.RCP || {};

  /* ---------- Mobile drawer ---------- */
  var drawer = $('#drawer');
  var opener = $('[data-drawer-open]');
  function openDrawer() {
    document.body.classList.add('drawer-open');
    drawer.setAttribute('aria-hidden', 'false');
    if (opener) opener.setAttribute('aria-expanded', 'true');
    var first = drawer.querySelector('button, a');
    if (first) first.focus();
  }
  function closeDrawer() {
    document.body.classList.remove('drawer-open');
    drawer.setAttribute('aria-hidden', 'true');
    if (opener) { opener.setAttribute('aria-expanded', 'false'); opener.focus(); }
  }
  if (drawer) {
    $$('[data-drawer-open]').forEach(function (b) { b.addEventListener('click', openDrawer); });
    $$('[data-drawer-close]').forEach(function (b) { b.addEventListener('click', closeDrawer); });
    $$('.drawer-menu > li > button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        var sub = document.getElementById(btn.getAttribute('aria-controls'));
        if (sub) sub.classList.toggle('is-open', !open);
      });
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 1060 && document.body.classList.contains('drawer-open')) closeDrawer(); });
  }

  /* ---------- Desktop dropdowns: click/keyboard support (hover handled in CSS) ---------- */
  var menuItems = $$('.menu > li.has-sub');
  function closeAllMenus(except) {
    menuItems.forEach(function (li) {
      if (li !== except) { li.classList.remove('is-open'); li.querySelector('button').setAttribute('aria-expanded', 'false'); }
    });
  }
  menuItems.forEach(function (li) {
    var btn = li.querySelector('button');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !li.classList.contains('is-open');
      closeAllMenus(li);
      li.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      if (open) { var a = li.querySelector('.submenu a'); if (a && e.detail === 0) a.focus(); }
    });
    li.addEventListener('mouseleave', function () { li.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); });
    li.addEventListener('keydown', function (e) {
      var links = $$('.submenu a', li);
      var i = links.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); li.classList.add('is-open'); (links[i + 1] || links[0]).focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); (links[i - 1] || links[links.length - 1]).focus(); }
    });
  });
  document.addEventListener('click', function () { closeAllMenus(); });

  /* ---------- Global Escape ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (document.body.classList.contains('drawer-open')) closeDrawer();
    var openLi = $('.menu > li.is-open');
    if (openLi) { closeAllMenus(); openLi.querySelector('button').focus(); }
    closeSearch(); closeLightbox();
  });

  /* ---------- Sticky nav shadow & back-to-top ---------- */
  var mainnav = $('.mainnav');
  var toTop = $('[data-to-top]');
  var ticking = false;
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (mainnav) mainnav.classList.toggle('is-stuck', mainnav.getBoundingClientRect().top <= 0 && y > 120);
    if (toTop) toTop.classList.toggle('is-visible', y > 600);
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });

  /* ---------- Hero slider ---------- */
  var hero = $('[data-slider]');
  if (hero) {
    var slides = $$('.slide', hero);
    var dotsWrap = $('.hero-dots', hero);
    var current = 0, timer = null, DELAY = 6500;
    var dots = slides.map(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Show slide ' + (i + 1));
      b.addEventListener('click', function () { go(i); restart(); });
      dotsWrap.appendChild(b);
      return b;
    });
    function go(i) {
      slides[current].classList.remove('is-active');
      slides[current].setAttribute('aria-hidden', 'true');
      current = (i + slides.length) % slides.length;
      slides[current].classList.add('is-active');
      slides[current].setAttribute('aria-hidden', 'false');
      dots.forEach(function (d, k) { d.setAttribute('aria-current', k === current ? 'true' : 'false'); });
    }
    function restart() { if (reduceMotion) return; clearInterval(timer); timer = setInterval(function () { go(current + 1); }, DELAY); }
    var prev = $('[data-prev]', hero), next = $('[data-next]', hero);
    if (prev) prev.addEventListener('click', function () { go(current - 1); restart(); });
    if (next) next.addEventListener('click', function () { go(current + 1); restart(); });
    hero.addEventListener('mouseenter', function () { clearInterval(timer); });
    hero.addEventListener('mouseleave', restart);
    hero.addEventListener('focusin', function () { clearInterval(timer); });
    var sx = null;
    hero.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) { go(current + (dx < 0 ? 1 : -1)); restart(); }
      sx = null;
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden) clearInterval(timer); else restart(); });
    slides.forEach(function (s, i) { if (i) s.setAttribute('aria-hidden', 'true'); });
    go(0); restart();
  }

  /* ---------- Reveal on scroll & counters ---------- */
  var reveals = $$('.reveal');
  var counters = $$('[data-count]');
  function countUp(el) {
    var end = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) { el.textContent = end + suffix; return; }
    var t0 = null, dur = 1400;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        if (en.target.hasAttribute('data-count')) countUp(en.target); else en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
    counters.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
    counters.forEach(function (el) { el.textContent = el.getAttribute('data-count') + (el.getAttribute('data-suffix') || ''); });
  }

  /* ---------- Tabs ---------- */
  $$('[data-tabs]').forEach(function (wrap) {
    var tabs = $$('[role="tab"]', wrap);
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); select(tabs[(i + 1) % tabs.length], true); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); select(tabs[(i - 1 + tabs.length) % tabs.length], true); }
      });
    });
    var hash = location.hash && tabs.filter(function (t) { return '#' + t.getAttribute('aria-controls') === location.hash; })[0];
    select(hash || tabs[0]);
  });

  /* ---------- Gallery filter & lightbox ---------- */
  var lb = null, lbItems = [], lbIndex = 0;
  function buildLightbox() {
    lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Image viewer');
    lb.innerHTML = '<img alt=""><p></p>' +
      '<button class="lb-close" type="button" aria-label="Close"><svg class="ic"><use href="#i-x"/></svg></button>' +
      '<button class="lb-prev" type="button" aria-label="Previous image"><svg class="ic"><use href="#i-chevron-left"/></svg></button>' +
      '<button class="lb-next" type="button" aria-label="Next image"><svg class="ic"><use href="#i-chevron-right"/></svg></button>';
    document.body.appendChild(lb);
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
    $('.lb-close', lb).addEventListener('click', closeLightbox);
    $('.lb-prev', lb).addEventListener('click', function () { showLb(lbIndex - 1); });
    $('.lb-next', lb).addEventListener('click', function () { showLb(lbIndex + 1); });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') showLb(lbIndex - 1);
      if (e.key === 'ArrowRight') showLb(lbIndex + 1);
    });
  }
  function showLb(i) {
    lbIndex = (i + lbItems.length) % lbItems.length;
    var item = lbItems[lbIndex];
    var im = $('img', lb);
    im.src = item.getAttribute('data-full');
    im.alt = item.getAttribute('data-caption') || '';
    $('p', lb).textContent = item.getAttribute('data-caption') || '';
  }
  var lastFocus = null;
  function openLightbox(items, i) {
    if (!lb) buildLightbox();
    lbItems = items; lastFocus = document.activeElement;
    showLb(i);
    lb.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    $('.lb-close', lb).focus();
  }
  function closeLightbox() {
    if (!lb || !lb.classList.contains('is-open')) return;
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  $$('[data-gallery]').forEach(function (g) {
    var buttons = $$('[data-full]', g);
    buttons.forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        var visible = buttons.filter(function (x) { var f = x.closest('figure'); return !f || !f.classList.contains('is-hidden'); });
        openLightbox(visible, visible.indexOf(b));
      });
    });
  });
  $$('[data-filter-group]').forEach(function (bar) {
    var target = document.getElementById(bar.getAttribute('data-filter-group'));
    $$('button', bar).forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('button', bar).forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        var f = btn.getAttribute('data-filter');
        $$('figure', target).forEach(function (fig) {
          fig.classList.toggle('is-hidden', f !== 'all' && fig.getAttribute('data-cat') !== f);
        });
      });
    });
  });

  /* ---------- Forms ---------- */
  $$('form[data-form]').forEach(function (form) {
    var status = $('.form-status', form);
    function say(msg, ok) { if (!status) return; status.textContent = msg; status.className = 'form-status ' + (ok ? 'ok' : 'err'); }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var data = new FormData(form);
      var subject = (form.getAttribute('data-form') || 'Website enquiry') + ' | ' + (data.get('name') || '');
      if (cfg.formEndpoint) {
        data.append('_subject', subject);
        var btn = $('[type="submit"]', form); if (btn) btn.disabled = true;
        fetch(cfg.formEndpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
          .then(function (r) { if (!r.ok) throw new Error(r.status); form.reset(); say('Thank you! We have received your message and will get back to you shortly.', true); })
          .catch(function () { say('Sorry, the form could not be sent. Please call ' + cfg.phone + ' or email ' + cfg.email + '.', false); })
          .then(function () { if (btn) btn.disabled = false; });
        return;
      }
      var lines = [];
      data.forEach(function (v, k) { if (String(v).trim()) lines.push(k.replace(/[_-]/g, ' ').replace(/^\w/, function (c) { return c.toUpperCase(); }) + ': ' + v); });
      var href = 'mailto:' + cfg.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n') + '\n\n(Sent from the ' + cfg.name + ' website)');
      window.location.href = href;
      say('Your email app has opened with this message ready to send. If it did not open, call us on ' + cfg.phone + ' or write to ' + cfg.email + '.', true);
    });
  });

  /* ---------- Site search ---------- */
  var overlay = $('[data-search]');
  var input = $('[data-search-input]');
  var results = $('[data-search-results]');
  var index = null;
  function loadIndex() {
    if (index) return Promise.resolve(index);
    return fetch('assets/search-index.json').then(function (r) { return r.json(); }).then(function (j) { index = j; return j; });
  }
  function escHtml(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function snippet(text, terms) {
    var lower = text.toLowerCase(), pos = -1;
    terms.some(function (t) { pos = lower.indexOf(t); return pos > -1; });
    var start = Math.max(0, pos - 60);
    var s = (start ? '…' : '') + text.substr(start, 170) + '…';
    s = escHtml(s);
    terms.forEach(function (t) { if (t.length > 1) s = s.replace(new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>'); });
    return s;
  }
  function runSearch() {
    var q = input.value.trim().toLowerCase();
    if (q.length < 2) { results.innerHTML = '<li class="search-empty">Type at least two letters to search all pages.</li>'; return; }
    var terms = q.split(/\s+/);
    loadIndex().then(function (idx) {
      var hits = idx.map(function (p) {
        var t = p.t.toLowerCase(), x = p.x.toLowerCase(), d = p.d.toLowerCase(), score = 0;
        for (var i = 0; i < terms.length; i++) {
          var term = terms[i], s = 0;
          if (t.indexOf(term) > -1) s += 10;
          if (d.indexOf(term) > -1) s += 4;
          var c = x.split(term).length - 1; s += Math.min(c, 8);
          if (!s) return null;
          score += s;
        }
        return { p: p, score: score };
      }).filter(Boolean).sort(function (a, b) { return b.score - a.score; }).slice(0, 12);
      results.innerHTML = hits.length ? hits.map(function (h) {
        return '<li><a href="' + h.p.u + '"><b>' + escHtml(h.p.t) + '</b><small>' + snippet(h.p.x, terms) + '</small></a></li>';
      }).join('') : '<li class="search-empty">No pages match “' + escHtml(q) + '”. Try “admission”, “eligibility” or “internship”.</li>';
    }).catch(function () { results.innerHTML = '<li class="search-empty">Search works when the site is served from a web server.</li>'; });
  }
  var searchReturn = null;
  function openSearch() {
    if (!overlay) return;
    if (document.body.classList.contains('drawer-open')) { document.body.classList.remove('drawer-open'); drawer.setAttribute('aria-hidden', 'true'); }
    searchReturn = document.activeElement;
    overlay.classList.add('is-open');
    input.value = ''; runSearch();
    setTimeout(function () { input.focus(); }, 30);
  }
  function closeSearch() {
    if (!overlay || !overlay.classList.contains('is-open')) return;
    overlay.classList.remove('is-open');
    if (searchReturn) searchReturn.focus();
  }
  if (overlay) {
    $$('[data-search-open]').forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); openSearch(); }); });
    $$('[data-search-close]').forEach(function (b) { b.addEventListener('click', closeSearch); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeSearch(); });
    input.addEventListener('input', runSearch);
    document.addEventListener('keydown', function (e) {
      if ((e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); openSearch(); }
    });
  }

  /* ---------- Misc ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
