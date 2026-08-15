/* Prehistoric-animals map. Creature data comes from prehistoric-animals-of-india.html as
   window.PREHIST (keeps this file Liquid-free). Pins are placed by where the fossils were
   found; the time slider filters by the age the species LIVED. */
(function () {
  var creatures = window.PREHIST.creatures;

  var map = L.map('map', { zoomSnap: 0.5 }).setView([21, 82], 4);
  map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');

  var satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics', maxZoom: 19
  }).addTo(map);
  var reliefColour = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Topographic &copy; Esri, USGS, NOAA', maxZoom: 19
  });
  var hillshade = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Hillshade &copy; Esri', maxNativeZoom: 16, maxZoom: 19, className: 'hillshade-blend'
  });
  var terrain = L.layerGroup([reliefColour, hillshade]);
  L.control.layers({ 'Satellite': satellite, 'Terrain relief': terrain }, {}, { collapsed: false }).addTo(map);

  // Animal groups drive the filter chips + pin colour.
  var GROUPS = [
    { key: 'Dinosaurs',                color: '#b5603a' },
    { key: 'Other reptiles',           color: '#5d6d7e' },
    { key: 'Mammals',                  color: '#9c6b3f' },
    { key: 'Synapsids & amphibians',   color: '#7f9a33' },
    { key: 'Sea life',                 color: '#2b7fd4' },
    { key: 'Human ancestors',          color: '#c2455e' }
  ];
  var GC = {}; GROUPS.forEach(function (g) { GC[g.key] = g; });
  function colorOf(p) { return (GC[p.group] || {}).color || '#1667c6'; }

  function badgeSvg(color, size) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">'
      + '<circle class="badge" cx="12" cy="12" r="11" fill="#fff" stroke="rgba(0,0,0,.2)" stroke-width="1"/>'
      + '<circle cx="12" cy="12" r="5.6" fill="' + color + '"/></svg>';
  }
  var iconCache = {};
  function pinSize() { var z = map.getZoom(); return z < 5.5 ? 15 : (z < 7 ? 21 : 28); }
  function iconFor(p) {
    var size = pinSize(), key = p.group + size;
    if (!iconCache[key]) {
      iconCache[key] = L.divIcon({ className: 'pin pin--badge', html: badgeSvg(colorOf(p), size),
                                   iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
    }
    return iconCache[key];
  }

  var reader = document.getElementById('reader');
  function loadStory(p) {
    reader.innerHTML = '<div class="reader__empty">Loading “' + p.title + '”…</div>';
    fetch(p.url)
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var art = new DOMParser().parseFromString(html, 'text/html').querySelector('.story');
        reader.innerHTML = art ? art.outerHTML : '<div class="reader__empty">Couldn’t load this species.</div>';
        reader.scrollTop = 0;
        if (window.innerWidth <= 768) reader.scrollIntoView({ behavior: 'smooth', block: 'start' });
      })
      .catch(function () { reader.innerHTML = '<div class="reader__empty">Couldn’t load this species.</div>'; });
  }

  var LABEL_ZOOM = 7.5, FOCUS_ZOOM = 7, activePin = null;
  function markActive(p) { if (p.marker._icon) p.marker._icon.classList.add('pin--active'); }
  function slugOf(url) { return (url || '').replace(/\/+$/, '').split('/').pop(); }

  // Photo popover: creatures that carry a `gallery` open a little slider anchored above the pin.
  var galItems = [], galIdx = 0, galPopup = null;
  function galRender() {
    var el = galPopup && galPopup.getElement();
    if (!el) return;
    var item = galItems[galIdx];
    var img = el.querySelector('.pin-gallery__img');
    var cap = el.querySelector('.pin-gallery__cap');
    var count = el.querySelector('.pin-gallery__count');
    if (img) img.src = item.src;
    if (cap) cap.innerHTML = [item.caption, item.credit].filter(Boolean).join(' &middot; ');
    if (count) count.textContent = (galIdx + 1) + ' / ' + galItems.length;
  }
  function galStep(d) {
    if (galItems.length < 2) return;
    galIdx = (galIdx + d + galItems.length) % galItems.length;
    galRender();
  }
  function openGallery(p) {
    galItems = p.gallery; galIdx = 0;
    var multi = galItems.length > 1;
    var html = '<div class="pin-gallery">' +
      '<div class="pin-gallery__frame"><img class="pin-gallery__img" alt=""></div>' +
      (multi ? '<button class="pin-gallery__nav pin-gallery__prev" type="button" aria-label="Previous photo">‹</button>' +
               '<button class="pin-gallery__nav pin-gallery__next" type="button" aria-label="Next photo">›</button>' : '') +
      '<div class="pin-gallery__bar"><span class="pin-gallery__count"></span><span class="pin-gallery__cap"></span></div>' +
    '</div>';
    galPopup = L.popup({ className: 'pin-gallery-popup', maxWidth: 400, minWidth: 400, autoPanPadding: [30, 70], offset: [0, -22] })
      .setLatLng(p.latlng).setContent(html).openOn(map);
    galRender();
    var el = galPopup.getElement();
    var prev = el.querySelector('.pin-gallery__prev'), next = el.querySelector('.pin-gallery__next');
    if (prev) prev.addEventListener('click', function (e) { e.stopPropagation(); galStep(-1); });
    if (next) next.addEventListener('click', function (e) { e.stopPropagation(); galStep(1); });
  }
  document.addEventListener('keydown', function (e) {   // arrows page the open gallery; Esc closes it
    if (!galPopup || !galPopup.isOpen()) return;
    if (e.key === 'ArrowLeft') galStep(-1);
    else if (e.key === 'ArrowRight') galStep(1);
    else if (e.key === 'Escape') map.closePopup(galPopup);
  });

  function focusPin(p) {
    if (activePin && activePin.marker._icon) activePin.marker._icon.classList.remove('pin--active');
    activePin = p;
    markActive(p);
    reader.style.setProperty('--feat', colorOf(p));            // theme the reader by animal group
    loadStory(p);
    map.setView(p.latlng, Math.max(map.getZoom(), FOCUS_ZOOM));
    if (p.gallery && p.gallery.length) openGallery(p);          // photo creatures get a slider above the pin
    else map.closePopup();                                      // no photos → clear any stale gallery
    if (p.slug) history.replaceState(null, '', '#' + p.slug);
  }
  creatures.forEach(function (p) {
    p.slug = slugOf(p.url);
    p.marker = L.marker(p.latlng, { icon: iconFor(p) }).on('click', function () { focusPin(p); });
    p.marker.bindTooltip(p.title, { permanent: true, direction: 'right', className: 'pin-label', offset: [14, 0] });
    p.marker.on('mouseover', function () {
      var el = p.marker.getTooltip() && p.marker.getTooltip().getElement();
      if (el) el.classList.add('pin-label--hover');
    });
    p.marker.on('mouseout', function () {
      var el = p.marker.getTooltip() && p.marker.getTooltip().getElement();
      if (el) el.classList.remove('pin-label--hover');
    });
  });
  function refreshIcons() {
    creatures.forEach(function (p) {
      if (!p.marker) return;
      var ic = iconFor(p);
      if (p.marker.options.icon !== ic) p.marker.setIcon(ic);
    });
    if (activePin) markActive(activePin);
  }
  function toggleLabels() { map.getContainer().classList.toggle('show-labels', map.getZoom() >= LABEL_ZOOM); }
  map.on('zoomend', toggleLabels);
  map.on('zoomend', refreshIcons);
  toggleLabels();

  // Group filter chips (only groups that have pins get a chip).
  var activeGroups = {};
  (function buildChips() {
    var bar = document.getElementById('typefilter');
    if (!bar) return;
    var present = GROUPS.filter(function (g) { return creatures.some(function (p) { return p.group === g.key; }); });
    var chips = {};
    present.forEach(function (g) { activeGroups[g.key] = true; });
    function isAll()  { return present.every(function (g) { return activeGroups[g.key]; }); }
    function isNone() { return present.every(function (g) { return !activeGroups[g.key]; }); }
    function showAll() { present.forEach(function (g) { activeGroups[g.key] = true; }); }
    function sync() {
      present.forEach(function (g) { chips[g.key].classList.toggle('is-on', activeGroups[g.key]); });
      chips.all.classList.toggle('is-on', isAll());
      update();
    }
    var all = document.createElement('button');
    all.className = 'typechip typechip--all is-on';
    all.textContent = 'All';
    all.addEventListener('click', function () { showAll(); sync(); });
    bar.appendChild(all);
    chips.all = all;
    present.forEach(function (g) {
      var chip = document.createElement('button');
      chip.className = 'typechip is-on';
      chip.style.setProperty('--cat', g.color);
      chip.textContent = g.key;
      chip.addEventListener('click', function () {
        if (isAll()) present.forEach(function (x) { activeGroups[x.key] = (x.key === g.key); });
        else { activeGroups[g.key] = !activeGroups[g.key]; if (isNone()) showAll(); }
        sync();
      });
      bar.appendChild(chip);
      chips[g.key] = chip;
    });
  })();

  // Search by name.
  (function buildSearch() {
    var box = document.getElementById('pin-search');
    var list = document.getElementById('pin-results');
    if (!box || !list) return;
    var shown = [], active = -1;
    function close() { list.hidden = true; list.innerHTML = ''; shown = []; active = -1; }
    function render() {
      var q = box.value.trim().toLowerCase();
      if (!q) { close(); return; }
      shown = creatures.filter(function (p) { return p.title.toLowerCase().indexOf(q) > -1; }).slice(0, 8);
      list.innerHTML = shown.length
        ? shown.map(function (p, i) { return '<li data-i="' + i + '">' + p.title + '<span class="ps-type">' + (p.clade || p.group || '') + '</span></li>'; }).join('')
        : '<li class="ps-empty">No matches</li>';
      list.hidden = false; active = -1;
    }
    function pick(p) { if (!map.hasLayer(p.marker)) p.marker.addTo(map); focusPin(p); box.value = ''; close(); }
    function highlight() { for (var i = 0; i < list.children.length; i++) list.children[i].classList.toggle('is-active', i === active); }
    box.addEventListener('input', render);
    box.addEventListener('keydown', function (e) {
      if (list.hidden || !shown.length) return;
      if (e.key === 'ArrowDown')    { active = Math.min(active + 1, shown.length - 1); e.preventDefault(); highlight(); }
      else if (e.key === 'ArrowUp') { active = Math.max(active - 1, 0);                 e.preventDefault(); highlight(); }
      else if (e.key === 'Enter')   { pick(shown[active > -1 ? active : 0]);            e.preventDefault(); }
      else if (e.key === 'Escape')  { close(); }
    });
    list.addEventListener('click', function (e) {
      var li = e.target.closest('li[data-i]');
      if (li) pick(shown[+li.getAttribute('data-i')]);
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.pinsearch')) close(); });
  })();

  // India outline.
  fetch(window.PREHIST.geojson)
    .then(function (r) { return r.json(); })
    .then(function (geo) {
      var india = L.geoJSON(geo, { interactive: false, style: { color: '#000000', weight: 1.5, opacity: 0.9, fill: false } }).addTo(map);
      map.invalidateSize();
      map.fitBounds(india.getBounds(), { padding: [20, 20] });
      map.setZoom(map.getZoom() + 0.5);
    });

  // --- Time slider (same geological-time model as the geology map) ----------
  var AGE_MIN = 0.001;
  var SEG = [
    { name: 'Archean',       eon: 'Archean',     from: 4000,  to: 2500,    color: '#8E4A9C', w: 0.15 },
    { name: 'Proterozoic',   eon: 'Proterozoic', from: 2500,  to: 541,     color: '#C15B2E', w: 0.20 },
    { name: 'Cambrian',      eon: 'Phanerozoic', from: 541,   to: 485.4,   color: '#7FA056' },
    { name: 'Ordovician',    eon: 'Phanerozoic', from: 485.4, to: 443.8,   color: '#009270' },
    { name: 'Silurian',      eon: 'Phanerozoic', from: 443.8, to: 419.2,   color: '#B3E1B6' },
    { name: 'Devonian',      eon: 'Phanerozoic', from: 419.2, to: 358.9,   color: '#CB8C37' },
    { name: 'Carboniferous', eon: 'Phanerozoic', from: 358.9, to: 298.9,   color: '#67A599' },
    { name: 'Permian',       eon: 'Phanerozoic', from: 298.9, to: 251.9,   color: '#F04028' },
    { name: 'Triassic',      eon: 'Phanerozoic', from: 251.9, to: 201.4,   color: '#812B92' },
    { name: 'Jurassic',      eon: 'Phanerozoic', from: 201.4, to: 145.0,   color: '#34B2C9' },
    { name: 'Cretaceous',    eon: 'Phanerozoic', from: 145.0, to: 66.0,    color: '#7FC64E' },
    { name: 'Paleogene',     eon: 'Phanerozoic', from: 66.0,  to: 23.03,   color: '#FD9A52' },
    { name: 'Neogene',       eon: 'Phanerozoic', from: 23.03, to: 2.58,    color: '#FFE619' },
    { name: 'Quaternary',    eon: 'Phanerozoic', from: 2.58,  to: AGE_MIN, color: '#F9F97F' }
  ];
  var AGE_MAX = SEG[0].from;
  (function () {
    var fixed = 0, n = 0;
    SEG.forEach(function (s) { if (s.w) fixed += s.w; else n++; });
    var per = (1 - fixed) / n, c = 0;
    SEG.forEach(function (s) { if (!s.w) s.w = per; s.start = c; c += s.w; });
  })();
  function tToAge(t) {
    for (var i = 0; i < SEG.length; i++) {
      var e = SEG[i];
      if (t <= e.start + e.w || i === SEG.length - 1) {
        var local = (t - e.start) / e.w;
        return e.from * Math.pow(e.to / e.from, Math.max(0, Math.min(1, local)));
      }
    }
  }
  function ageToT(a) {
    for (var i = 0; i < SEG.length; i++) {
      var e = SEG[i];
      if (a >= e.to || i === SEG.length - 1) {
        var local = Math.log(a / e.from) / Math.log(e.to / e.from);
        return e.start + Math.max(0, Math.min(1, local)) * e.w;
      }
    }
  }
  function segOf(a) { for (var i = 0; i < SEG.length; i++) if (a >= SEG[i].to) return SEG[i]; return SEG[SEG.length - 1]; }
  function fmtAge(a) {
    if (a <= AGE_MIN * 1.2) return 'Present';
    if (a < 1) return Math.round(a * 1e6).toLocaleString() + ' yr ago';
    if (a < 1000) return Math.round(a) + ' Ma';
    return (a / 1000).toFixed(1) + ' Ga';
  }
  var bands = document.getElementById('eon-bands');
  var SEG_ABBR = { Cambrian: 'Cm', Ordovician: 'O', Silurian: 'S', Devonian: 'D', Carboniferous: 'C',
                   Permian: 'P', Triassic: 'Tr', Jurassic: 'J', Cretaceous: 'K', Paleogene: 'Pg', Neogene: 'N', Quaternary: 'Q' };
  function inkFor(hex) {
    var c = hex.replace('#', '');
    var L = (0.299 * parseInt(c.substr(0, 2), 16) + 0.587 * parseInt(c.substr(2, 2), 16) + 0.114 * parseInt(c.substr(4, 2), 16)) / 255;
    return L > 0.6 ? '#1c2733' : '#ffffff';
  }
  SEG.forEach(function (s) {
    var seg = document.createElement('span');
    seg.style.left = (s.start * 100) + '%'; seg.style.width = (s.w * 100) + '%';
    seg.style.background = s.color;
    seg.title = 'Select ' + s.name;
    seg.addEventListener('click', function () { pickSeg(s); });
    var lab = document.createElement('span');
    lab.className = 'seg-lab';
    lab.style.color = inkFor(s.color);
    lab.textContent = s.eon === 'Phanerozoic' ? (SEG_ABBR[s.name] || s.name) : s.name;
    seg.appendChild(lab);
    bands.appendChild(seg);
    s.el = seg;
  });
  var ticks = document.getElementById('eon-ticks');
  [4000, 2500, 541, 66, AGE_MIN].forEach(function (v) {
    var s = document.createElement('span');
    s.style.left = (ageToT(v) * 100) + '%';
    s.textContent = v <= AGE_MIN * 1.2 ? 'Today' : (v >= 1000 ? (v / 1000) + ' Ga' : v + ' Ma');
    ticks.appendChild(s);
  });
  var startH = document.getElementById('time-start');
  var endH   = document.getElementById('time-end');
  var win    = document.getElementById('time-window');
  var ageEl = document.getElementById('t-age'), eonEl = document.getElementById('t-eon');
  function segLabel(s) { return s.eon === 'Phanerozoic' ? s.name + ' Period' : s.name + ' Eon'; }
  var MAXV = 10000, EPS = 0.002;
  function pickSeg(s) { startH.value = Math.round(s.start * MAXV); endH.value = Math.round((s.start + s.w) * MAXV); update(); }
  function update() {
    var tA = Math.min(startH.value, endH.value) / MAXV;
    var tB = Math.max(startH.value, endH.value) / MAXV;
    var ageOld   = tA <= 0 ? AGE_MAX : tToAge(tA);
    var ageYoung = tB >= 1 ? 0       : tToAge(tB);
    win.style.left  = (tA * 100) + '%';
    win.style.width = ((tB - tA) * 100) + '%';
    var inWin = SEG.filter(function (s) { return (s.start + EPS) < tB && (s.start + s.w - EPS) > tA; });
    SEG.forEach(function (s) { s.el.classList.toggle('in-window', inWin.indexOf(s) > -1); });
    if (tA <= 0 && tB >= 1) {
      ageEl.textContent = 'All time';
      eonEl.textContent = 'Archean Eon → present';
    } else {
      ageEl.textContent = fmtAge(ageOld) + ' – ' + fmtAge(ageYoung);
      var so = inWin[0] || segOf(ageOld), sy = inWin[inWin.length - 1] || so;
      eonEl.textContent = so === sy ? segLabel(so) : (segLabel(so) + ' → ' + segLabel(sy));
    }
    var loA = ageYoung <= 0 ? -1 : ageYoung * (1 - 1e-4);
    var hiA = ageOld * (1 + 1e-4);
    creatures.forEach(function (p) {
      if (p.age >= loA && p.age <= hiA && activeGroups[p.group]) p.marker.addTo(map);
      else map.removeLayer(p.marker);
    });
  }
  startH.addEventListener('input', update);
  endH.addEventListener('input', update);
  update();

  // Deep-link: open the species named in the URL hash.
  function openFromHash() {
    var slug = decodeURIComponent((location.hash || '').replace(/^#/, ''));
    if (!slug || (activePin && activePin.slug === slug)) return;
    var p = creatures.filter(function (x) { return x.slug === slug; })[0];
    if (!p) return;
    if (!map.hasLayer(p.marker)) p.marker.addTo(map);
    focusPin(p);
  }
  openFromHash();
  window.addEventListener('hashchange', openFromHash);

  window.LTSN_PREHIST = { map: map, creatures: creatures };
})();
