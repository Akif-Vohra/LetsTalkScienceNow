// Mobile navigation toggle
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('site-menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', function () {
    var open = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Close the menu after tapping a link
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
})();

// Fact-card share menu: WhatsApp or copy link. Delegated so it also works for the
// fact card injected into the map reader. Shares the current page URL — the map's
// deep-link (#slug) in the reader, or the story page's own URL when standalone.
(function () {
  var menu = null, owner = null;
  function close() {
    if (menu) { menu.remove(); menu = null; }
    if (owner) { owner.setAttribute('aria-expanded', 'false'); owner = null; }
  }
  function open(btn) {
    var card = btn.closest('.factcard');
    if (!card) return;
    var t = card.querySelector('.factcard__title');
    var url = location.href;
    var title = t ? t.textContent.trim() : document.title;

    menu = document.createElement('div');
    menu.className = 'factcard__share-menu';

    var wa = document.createElement('a');
    wa.className = 'factcard__share-item';
    wa.href = 'https://wa.me/?text=' + encodeURIComponent(title + ' — ' + url);
    wa.target = '_blank';
    wa.rel = 'noopener';
    wa.textContent = 'Share on WhatsApp';

    var cp = document.createElement('button');
    cp.type = 'button';
    cp.className = 'factcard__share-item';
    cp.textContent = 'Copy link';
    cp.addEventListener('click', function () {
      var done = function () { cp.textContent = 'Link copied ✓'; setTimeout(close, 900); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { window.prompt('Copy this link:', url); });
      else window.prompt('Copy this link:', url);
    });

    menu.appendChild(wa);
    menu.appendChild(cp);
    card.appendChild(menu);
    owner = btn;
    btn.setAttribute('aria-expanded', 'true');
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.factcard__share');
    if (btn) { e.preventDefault(); if (owner === btn) close(); else { close(); open(btn); } return; }
    if (menu && !e.target.closest('.factcard__share-menu')) close();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
})();

// Hero cover slider (auto-rotate + arrows + dots)
(function () {
  var slider = document.querySelector('[data-slider]');
  if (!slider) return;
  var track = slider.querySelector('.hero__track');
  var slides = Array.prototype.slice.call(slider.querySelectorAll('.hero__slide'));
  if (slides.length < 2) return;
  var dotsWrap = slider.querySelector('.hero__dots');
  var i = 0, timer;

  var dots = slides.map(function (_, idx) {
    var b = document.createElement('button');
    b.className = 'hero__dot';
    b.type = 'button';
    b.setAttribute('aria-label', 'Go to story ' + (idx + 1));
    b.addEventListener('click', function () { go(idx); restart(); });
    dotsWrap.appendChild(b);
    return b;
  });

  function render() {
    track.style.transform = 'translateX(' + (-i * 100) + '%)';
    dots.forEach(function (d, idx) { d.classList.toggle('is-active', idx === i); });
  }
  function go(n) { i = (n + slides.length) % slides.length; render(); }
  function restart() { clearInterval(timer); timer = setInterval(function () { go(i + 1); }, 5000); }

  slider.querySelector('.hero__slide-btn--prev').addEventListener('click', function () { go(i - 1); restart(); });
  slider.querySelector('.hero__slide-btn--next').addEventListener('click', function () { go(i + 1); restart(); });
  slider.addEventListener('mouseenter', function () { clearInterval(timer); });
  slider.addEventListener('mouseleave', restart);

  render();
  restart();
})();
