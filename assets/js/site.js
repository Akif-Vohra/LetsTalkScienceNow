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
