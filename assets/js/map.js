/* Interactive geology map + time-window slider.
   Pin/geojson data comes from map.html as window.MAP (keeps this file Liquid-free
   and cacheable). */
(function () {
  var pins = window.MAP.pins;

  var map = L.map('map', { zoomSnap: 0.5 }).setView([21, 82], 4);

  // Satellite base only; the border comes from our own india.geojson (added below).
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics', maxZoom: 19
  }).addTo(map);

  // Feature categories: colour the pins and drive the filter chips. Every feature_type
  // maps to one of these by keyword (see catOf).
  var CATS = [
    { key: 'mountains', label: 'Mountains',        color: '#9c6b3f' },
    { key: 'plateaus',  label: 'Plateaus',         color: '#b07d2b' },
    { key: 'volcanic',  label: 'Volcanic',         color: '#d94a3d' },
    { key: 'impact',    label: 'Impact craters',   color: '#5d6d7e' },
    { key: 'structure', label: 'Cratons & basins', color: '#8155b0' },
    { key: 'rivers',    label: 'Rivers',           color: '#2b7fd4' },
    { key: 'lakes',     label: 'Lakes',            color: '#12a5b3' },
    { key: 'coasts',    label: 'Coasts & islands', color: '#22a06b' },
    { key: 'deserts',   label: 'Deserts',          color: '#e6a417' },
    { key: 'economic',  label: 'Mining & energy',  color: '#c2455e' }
  ];
  var CAT = {};
  CATS.forEach(function (c) { CAT[c.key] = c; });
  function catOf(t) {
    t = t || '';
    if (/mountain|escarpment|fold|horst|pass|hills/i.test(t))                                 return 'mountains';
    if (/plateau/i.test(t))                                                                   return 'plateaus';
    if (/impact|crater/i.test(t))                                                             return 'impact';
    if (/basalt|volcano|columnar/i.test(t))                                                   return 'volcanic';
    if (/craton|suture|ophiolite|rift|foreland|sedimentary basin|gondwana|fossil/i.test(t))   return 'structure';
    if (/river|delta|floodplain|badlands|waterfall|gorge/i.test(t))                           return 'rivers';
    if (/lake/i.test(t))                                                                      return 'lakes';
    if (/lagoon|salt marsh|coral|island arc/i.test(t))                                        return 'coasts';
    if (/desert/i.test(t))                                                                    return 'deserts';
    if (/coalfield|diamond|copper|iron-ore|oilfield|gold field/i.test(t))                     return 'economic';
    return 'structure';                                                                       // fallback bucket
  }
  // A dot when zoomed out, a teardrop when zoomed in — both tinted by category.
  function dotSvg(c)  { return '<svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="7" r="5" fill="' + c + '" stroke="#fff" stroke-width="2"/></svg>'; }
  function dropSvg(c) { return '<svg width="20" height="28" viewBox="0 0 24 34" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.4 0 0 5.4 0 12c0 8.4 12 22 12 22s12-13.6 12-22C24 5.4 18.6 0 12 0z" fill="' + c + '" stroke="#fff" stroke-width="1.5"/><circle cx="12" cy="12" r="4" fill="#fff"/></svg>'; }
  var iconCache = {};                                    // one shared icon instance per (dot|drop, colour)
  function iconFor(p) {
    var drop = map.getZoom() >= PIN_ZOOM;
    var color = (CAT[p.cat] || {}).color || '#1667c6';
    var key = (drop ? 'd' : 'o') + color;
    if (!iconCache[key]) {
      iconCache[key] = drop
        ? L.divIcon({ className: 'pin pin--drop', html: dropSvg(color), iconSize: [20, 28], iconAnchor: [10, 28] })
        : L.divIcon({ className: 'pin pin--dot',  html: dotSvg(color),  iconSize: [14, 14], iconAnchor: [7, 7] });
    }
    return iconCache[key];
  }
  // Rivers overlay (GSI/Bhukosh), toggled from the layer control.
  var rivers = L.geoJSON(null, {
    interactive: false, attribution: 'Rivers &copy; GSI (Bhukosh)',
    style: { color: '#3d8bd6', weight: 1, opacity: 0.7 }
  });
  fetch(window.MAP.rivers).then(function (r) { return r.json(); }).then(function (geo) { rivers.addData(geo); });
  L.control.layers(null, { 'Rivers': rivers }, { collapsed: false }).addTo(map);

  var reader = document.getElementById('reader');
  var activeShape = null, activeShapePin = null;        // only the last-clicked outline is shown
  function showShape(p) {
    if (activeShape) { map.removeLayer(activeShape); activeShape = null; activeShapePin = null; }
    if (!p.shape) return;                               // point features have no outline
    fetch(p.shape)
      .then(function (r) { return r.json(); })
      .then(function (geo) {
        activeShape = L.geoJSON(geo, {
          interactive: false,
          style: { color: '#1667c6', weight: 2, opacity: 0.9, fillColor: '#1667c6', fillOpacity: 0.15 }
        }).addTo(map);
        activeShapePin = p;
        map.fitBounds(activeShape.getBounds(), { padding: [40, 40], maxZoom: 14 });  // frame it; cap lets tiny ones (Lonar) zoom in
      })
      .catch(function () {});
  }
  function loadStory(p) {                               // fetch the story page, inject just its <article class="story">
    reader.innerHTML = '<div class="reader__empty">Loading “' + p.title + '”…</div>';
    fetch(p.url)
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var art = new DOMParser().parseFromString(html, 'text/html').querySelector('.story');
        reader.innerHTML = art ? art.outerHTML : '<div class="reader__empty">Couldn’t load this story.</div>';
        reader.scrollTop = 0;
        if (window.innerWidth <= 768) reader.scrollIntoView({ behavior: 'smooth', block: 'start' });  // mobile: the reader is below the map/controls
      })
      .catch(function () { reader.innerHTML = '<div class="reader__empty">Couldn’t load this story.</div>'; });
  }

  var LABEL_ZOOM = 6, FOCUS_ZOOM = 7, PIN_ZOOM = 6;    // <PIN_ZOOM: dots; >=PIN_ZOOM: teardrops (+ labels)
  function refreshIcons() {                             // swap dot <-> teardrop as you cross PIN_ZOOM
    pins.forEach(function (p) {
      if (!p.marker) return;
      var ic = iconFor(p);
      if (p.marker.options.icon !== ic) p.marker.setIcon(ic);
    });
    if (activePin) markActive(activePin);              // setIcon rebuilt the element — re-apply the highlight
  }
  var activePin = null;                                 // the pin we're currently reading
  function markActive(p) {                              // colour it, if its marker is on the map
    if (p.marker._icon) p.marker._icon.classList.add('pin--active');
  }
  function focusPin(p) {
    if (activePin && activePin.marker._icon) activePin.marker._icon.classList.remove('pin--active');
    activePin = p;
    markActive(p);
    loadStory(p);
    showShape(p);                                       // shape pins get framed by the outline's fitBounds
    if (!p.shape) map.setView(p.latlng, Math.max(map.getZoom(), FOCUS_ZOOM));  // point pins: center + zoom in
  }
  pins.forEach(function (p) {
    p.cat = catOf(p.type);
    p.marker = L.marker(p.latlng, { icon: iconFor(p) }).on('click', function () { focusPin(p); });
    p.marker.bindTooltip(p.title, { permanent: true, direction: 'right', className: 'pin-label', offset: [6, -12] });
  });
  function toggleLabels() { map.getContainer().classList.toggle('show-labels', map.getZoom() >= LABEL_ZOOM); }
  map.on('zoomend', toggleLabels);
  map.on('zoomend', refreshIcons);
  toggleLabels();

  // Category filter. "All" (default) shows everything; from All a click isolates one
  // category; further clicks add/remove; emptying it snaps back to All.
  var activeCats = {};
  (function buildChips() {
    var bar = document.getElementById('typefilter');
    if (!bar) return;
    var present = CATS.filter(function (c) { return pins.some(function (p) { return p.cat === c.key; }); });
    var chips = {};
    present.forEach(function (c) { activeCats[c.key] = true; });

    function isAll()  { return present.every(function (c) { return activeCats[c.key]; }); }
    function isNone() { return present.every(function (c) { return !activeCats[c.key]; }); }
    function showAll() { present.forEach(function (c) { activeCats[c.key] = true; }); }
    function sync() {
      present.forEach(function (c) { chips[c.key].classList.toggle('is-on', activeCats[c.key]); });
      chips.all.classList.toggle('is-on', isAll());
      update();
    }

    var all = document.createElement('button');
    all.className = 'typechip typechip--all is-on';
    all.textContent = 'All';
    all.addEventListener('click', function () { showAll(); sync(); });
    bar.appendChild(all);
    chips.all = all;

    present.forEach(function (c) {
      var chip = document.createElement('button');
      chip.className = 'typechip is-on';
      chip.style.setProperty('--cat', c.color);
      chip.textContent = c.label;
      chip.addEventListener('click', function () {
        if (isAll()) present.forEach(function (x) { activeCats[x.key] = (x.key === c.key); });  // isolate
        else { activeCats[c.key] = !activeCats[c.key]; if (isNone()) showAll(); }               // add/remove
        sync();
      });
      bar.appendChild(chip);
      chips[c.key] = chip;
    });
  })();

  // India outline — sourced from DataMeet Community Maps (github.com/datameet/maps).
  fetch(window.MAP.geojson)
    .then(function (r) { return r.json(); })
    .then(function (geo) {
      var india = L.geoJSON(geo, {
        interactive: false,
        style: { color: '#000000', weight: 1.5, opacity: 0.9, fill: false }
      }).addTo(map);
      map.invalidateSize();                                       // container is a flex half; re-measure
      map.fitBounds(india.getBounds(), { padding: [20, 20] });   // frame the country
      map.setZoom(map.getZoom() + 0.5);                           // nudge a bit closer
    });

  // --- Time slider -------------------------------------------------------
  // Features span ~3000 Ma (Archean cratons) to ~4000 yr (Meghalayan). A pure log axis
  // crushes the deep past to a sliver, so every SEGMENT gets a FIXED share `w` of the bar
  // (they sum to 1) and ages map log-uniformly WITHIN that share. t in [0,1]: 0 = oldest.
  // The two Precambrian eons stay whole; the Phanerozoic is split into its 12 periods
  // (ICS colours), which is where the recognisable time labels live.
  var AGE_MIN = 0.001;                                 // Ma (0.001 Ma = 1,000 yr ≈ "present")
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
  (function () {                                        // the 12 periods split the leftover width evenly
    var fixed = 0, n = 0;
    SEG.forEach(function (s) { if (s.w) fixed += s.w; else n++; });
    var per = (1 - fixed) / n, c = 0;
    SEG.forEach(function (s) { if (!s.w) s.w = per; s.start = c; c += s.w; });
  })();

  function tToAge(t) {                                  // 0..1 -> age
    for (var i = 0; i < SEG.length; i++) {
      var e = SEG[i];
      if (t <= e.start + e.w || i === SEG.length - 1) {
        var local = (t - e.start) / e.w;
        return e.from * Math.pow(e.to / e.from, Math.max(0, Math.min(1, local)));
      }
    }
  }
  function ageToT(a) {                                  // age -> 0..1
    for (var i = 0; i < SEG.length; i++) {
      var e = SEG[i];
      if (a >= e.to || i === SEG.length - 1) {
        var local = Math.log(a / e.from) / Math.log(e.to / e.from);   // 0 at old edge, 1 at young edge
        return e.start + Math.max(0, Math.min(1, local)) * e.w;
      }
    }
  }
  function segOf(a) {                                   // age -> its segment
    for (var i = 0; i < SEG.length; i++) if (a >= SEG[i].to) return SEG[i];
    return SEG[SEG.length - 1];
  }
  function fmtAge(a) {
    if (a <= AGE_MIN * 1.2) return 'Present';
    if (a < 1) return Math.round(a * 1e6).toLocaleString() + ' yr ago';   // sub-Ma -> years
    if (a < 1000) return Math.round(a) + ' Ma';
    return (a / 1000).toFixed(1) + ' Ga';
  }

  // Build the coloured bands + rotated names once.
  var bands = document.getElementById('eon-bands');
  var names = document.getElementById('eon-names');
  SEG.forEach(function (s) {
    var seg = document.createElement('span');
    seg.style.left = (s.start * 100) + '%'; seg.style.width = (s.w * 100) + '%';
    seg.style.background = s.color;
    seg.title = 'Select ' + s.name;
    seg.addEventListener('click', function () { pickSeg(s); });
    bands.appendChild(seg);
    s.el = seg;
    var lab = document.createElement('span');
    lab.style.left = (s.start * 100) + '%';
    lab.style.cursor = 'pointer';
    lab.textContent = s.name;
    lab.addEventListener('click', function () { pickSeg(s); });
    names.appendChild(lab);
  });
  // Numeric boundary ticks, spaced so they don't collide.
  var ticks = document.getElementById('eon-ticks');
  [4000, 2500, 541, 66, AGE_MIN].forEach(function (v) {
    var s = document.createElement('span');
    s.style.left = (ageToT(v) * 100) + '%';
    s.textContent = v <= AGE_MIN * 1.2 ? 'Today' : (v >= 1000 ? (v / 1000) + ' Ga' : v + ' Ma');
    ticks.appendChild(s);
  });

  var startH = document.getElementById('time-start');   // older edge (small t)
  var endH   = document.getElementById('time-end');      // younger edge (large t)
  var win    = document.getElementById('time-window');
  var ageEl = document.getElementById('t-age'), eonEl = document.getElementById('t-eon');
  function segLabel(s) { return s.eon === 'Phanerozoic' ? s.name + ' Period' : s.name + ' Eon'; }

  var MAXV = 10000, EPS = 0.002;                          // EPS: ignore hair-width boundary touches
  function pickSeg(s) {                                   // click a band -> window = that band's full span
    startH.value = Math.round(s.start * MAXV);
    endH.value   = Math.round((s.start + s.w) * MAXV);
    update();
  }

  function update() {
    var tA = Math.min(startH.value, endH.value) / MAXV;  // older edge
    var tB = Math.max(startH.value, endH.value) / MAXV;  // younger edge
    var ageOld   = tA <= 0 ? AGE_MAX : tToAge(tA);        // full-left  => include the oldest
    var ageYoung = tB >= 1 ? 0       : tToAge(tB);        // full-right => include the present (age 0)

    win.style.left  = (tA * 100) + '%';
    win.style.width = ((tB - tA) * 100) + '%';
    var inWin = SEG.filter(function (s) {                 // bands the window really covers (not just grazes)
      return (s.start + EPS) < tB && (s.start + s.w - EPS) > tA;
    });
    SEG.forEach(function (s) { s.el.classList.toggle('in-window', inWin.indexOf(s) > -1); });

    if (tA <= 0 && tB >= 1) {
      ageEl.textContent = 'All time';
      eonEl.textContent = 'Archean Eon → present';
    } else {
      ageEl.textContent = fmtAge(ageOld) + ' – ' + fmtAge(ageYoung);
      var so = inWin[0] || segOf(ageOld), sy = inWin[inWin.length - 1] || so;
      eonEl.textContent = so === sy ? segLabel(so) : (segLabel(so) + ' → ' + segLabel(sy));
    }
    var loA = ageYoung <= 0 ? -1 : ageYoung * (1 - 1e-4); // pad a hair so a feature sitting exactly
    var hiA = ageOld * (1 + 1e-4);                        // on a boundary (e.g. Deccan at 66 Ma) counts
    pins.forEach(function (p) {                           // show features inside the time window AND an active category
      if (p.age >= loA && p.age <= hiA && activeCats[p.cat]) p.marker.addTo(map);
      else map.removeLayer(p.marker);
    });
    if (activeShapePin && !map.hasLayer(activeShapePin.marker) && activeShape) {
      map.removeLayer(activeShape); activeShape = null; activeShapePin = null;  // its pin left the window
    }
  }
  startH.addEventListener('input', update);
  endH.addEventListener('input', update);
  update();

  window.LTSN = { map: map, pins: pins };   // console handles for debugging
})();
