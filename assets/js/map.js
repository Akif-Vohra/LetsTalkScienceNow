/* Interactive geology map + time-window slider.
   Pin/geojson data comes from map.html as window.MAP (keeps this file Liquid-free
   and cacheable). */
(function () {
  var pins = window.MAP.pins;

  var map = L.map('map', { zoomSnap: 0.5 }).setView([21, 82], 4);
  // Keep the Leaflet credit but drop the default Ukrainian-flag prefix.
  map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');

  // Base layers: satellite (default) + a grayscale hillshade for terrain relief. The
  // border comes from our own india.geojson (added below). Both are free Esri basemaps.
  var satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics', maxZoom: 19
  }).addTo(map);
  // "Terrain relief" = a colour topo base with a hillshade multiplied over it → colour + 3-D relief.
  // Tune the look in map.html via the .hillshade-blend CSS (blend mode / contrast).
  var reliefColour = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Topographic &copy; Esri, USGS, NOAA', maxZoom: 19
  });
  var hillshade = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Hillshade &copy; Esri', maxNativeZoom: 16, maxZoom: 19, className: 'hillshade-blend'
  });
  var terrain = L.layerGroup([reliefColour, hillshade]);

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
    if (/glacier/i.test(t))                                                                   return 'mountains';
    if (/cave|karst|laterite/i.test(t))                                                       return 'plateaus';
    if (/craton|suture|ophiolite|rift|foreland|sedimentary basin|gondwana|fossil/i.test(t))   return 'structure';
    if (/river|delta|floodplain|badlands|waterfall|gorge/i.test(t))                           return 'rivers';
    if (/lake/i.test(t))                                                                      return 'lakes';
    if (/lagoon|salt marsh|coral|island arc/i.test(t))                                        return 'coasts';
    if (/desert/i.test(t))                                                                    return 'deserts';
    if (/coalfield|diamond|copper|iron-ore|oilfield|gold field|mine|zinc|lead|barytes/i.test(t)) return 'economic';
    return 'structure';                                                                       // fallback bucket
  }
  // Each category gets a small glyph (drawn in a 24×24 box). Filled shapes take the
  // category colour; open shapes (fill:none) are stroked in it — see badgeSvg's <g>.
  var GLYPH = {
    mountains: '<path d="M4 17.5 L9 8 L12.5 13 L16 7 L20 17.5 Z"/>',
    plateaus:  '<path d="M5 17.5 L7.5 9 L16.5 9 L19 17.5 Z"/>',
    volcanic:  '<path d="M5.5 18 L9.5 9 L14.5 9 L18.5 18 Z"/><circle cx="12" cy="6.4" r="1.4"/>',
    impact:    '<circle cx="12" cy="12" r="6.6" fill="none" stroke-width="2"/><circle cx="12" cy="12" r="2.3"/>',
    structure: '<rect x="5" y="8.7" width="14" height="2.2" rx="1.1"/><rect x="5" y="12.9" width="14" height="2.2" rx="1.1"/><rect x="6.6" y="17.1" width="10.8" height="2.2" rx="1.1"/>',
    rivers:    '<path d="M4.5 9 C7 9 7 15 9.5 15 S12 9 14.5 9 17 15 19.5 15" fill="none" stroke-width="2.1"/>',
    lakes:     '<path d="M12 5.4 C9 9.6 7.4 11.6 7.4 13.9 a4.6 4.6 0 0 0 9.2 0 C16.6 11.6 15 9.6 12 5.4 Z"/>',
    coasts:    '<path d="M8 13.2 a4 3.2 0 0 1 8 0 Z"/><path d="M4.5 16.8 q3.6 2.3 7 0 t7 0" fill="none" stroke-width="1.8"/>',
    deserts:   '<path d="M4 16.6 C6.6 11.4 9.6 11.4 12 16.6 C14 12.6 15.8 12.6 20 16.6 Z"/>',
    economic:  '<path d="M12 6 L17.6 11 L12 18.5 L6.4 11 Z"/>'
  };
  function badgeSvg(cat, size) {
    var c = (CAT[cat] || {}).color || '#1667c6';
    var g = GLYPH[cat] || GLYPH.structure;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">'
      + '<circle class="badge" cx="12" cy="12" r="11" fill="#fff" stroke="rgba(0,0,0,.2)" stroke-width="1"/>'
      + '<g fill="' + c + '" stroke="' + c + '" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">' + g + '</g>'
      + '</svg>';
  }
  function chipGlyph(c) {                                // same glyph, coloured, for the filter chips (no white badge)
    var g = GLYPH[c.key]; if (!g) return '';
    return '<svg class="tc-ico" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g fill="' + c.color
      + '" stroke="' + c.color + '" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">' + g + '</g></svg>';
  }
  var iconCache = {};                                    // one shared icon instance per (category, size)
  function pinSize() {                                   // grow the badges as you zoom in
    var z = map.getZoom();
    return z < 5.5 ? 15 : (z < 7 ? 21 : 28);             // all-India (small) -> region -> local
  }
  function iconFor(p) {
    var size = pinSize();
    var key = p.cat + size;
    if (!iconCache[key]) {
      iconCache[key] = L.divIcon({ className: 'pin pin--badge', html: badgeSvg(p.cat, size),
                                   iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
    }
    return iconCache[key];
  }
  // Rivers overlay (GSI/Bhukosh), toggled from the layer control.
  var rivers = L.geoJSON(null, {
    interactive: false, attribution: 'Rivers &copy; GSI (Bhukosh)',
    style: { color: '#3d8bd6', weight: 1, opacity: 0.7 }
  });
  fetch(window.MAP.rivers).then(function (r) { return r.json(); }).then(function (geo) { rivers.addData(geo); });

  // Soil overlay (FAO–UNESCO Soil Map). The FAO 'DOMSOI' code's first letter is the major
  // soil group; we bucket those into the soil types Indian geography actually names.
  var SOILS = [
    { key: 'alluvial', label: 'Alluvial (Fluvisols)',            color: '#8ca84e' },
    { key: 'black',    label: 'Black cotton (Vertisols)',        color: '#4a4a4a' },
    { key: 'red',      label: 'Red (Acrisols / Nitosols)',       color: '#c0492f' },
    { key: 'laterite', label: 'Laterite (Ferralsols)',           color: '#7a3b2e' },
    { key: 'brown',    label: 'Brown / forest (Cambisols, Luvisols)', color: '#b5813f' },
    { key: 'desert',   label: 'Sandy desert (Arenosols)',        color: '#e3c766' },
    { key: 'arid',     label: 'Arid (Xerosols / Yermosols)',     color: '#d9c9a3' },
    { key: 'mountain', label: 'Mountain / stony (Lithosols)',    color: '#9aa0a6' },
    { key: 'saline',   label: 'Saline / alkaline (Solonchaks)',  color: '#cbb8d6' },
    { key: 'wetland',  label: 'Wetland & other soils',           color: '#6f93a6' },
    { key: 'glacier',  label: 'Glacier / ice',                   color: '#e6eef2' },
    { key: 'water',    label: 'Water',                           color: '#4a90c2' }
  ];
  var SOILC = {}; SOILS.forEach(function (s) { SOILC[s.key] = s; });
  var SOIL_LETTER = { J:'alluvial', V:'black', A:'red', N:'red', F:'laterite', B:'brown', L:'brown',
                      Q:'desert', X:'arid', Y:'arid', I:'mountain', U:'mountain', Z:'saline', S:'saline' };
  function soilClass(code) {
    if (!code) return 'wetland';
    var two = code.slice(0, 2);
    if (two === 'GL') return 'glacier';
    if (two === 'WR') return 'water';
    return SOIL_LETTER[code.charAt(0)] || 'wetland';   // everything else -> catch-all bucket
  }
  var soil = L.geoJSON(null, {
    interactive: false, attribution: 'Soil: FAO–UNESCO Soil Map of the World',
    style: function (f) {
      var c = SOILC[soilClass((f.properties || {}).DOMSOI)];
      return { color: '#ffffff', weight: 0.3, opacity: 0.5, fillColor: c.color, fillOpacity: 0.55 };
    }
  });
  var soilLoaded = false;
  function loadSoil() {                                  // fetch only on first toggle-on (it's ~250 KB)
    if (soilLoaded) return; soilLoaded = true;
    fetch(window.MAP.soil).then(function (r) { return r.json(); })
      .then(function (geo) { soil.addData(geo); soil.bringToBack(); });   // keep it under the outline + pins
  }
  var soilLegend = L.control({ position: 'bottomleft' });
  soilLegend.onAdd = function () {
    var div = L.DomUtil.create('div', 'map-legend');
    div.innerHTML = '<h4>Soil types</h4>' + SOILS.map(function (s) {
      return '<span class="sl-row"><i style="background:' + s.color + '"></i>' + s.label + '</span>';
    }).join('');
    return div;
  };

  // Seismic-zone overlay (BIS Zones II–V). Same toggle+legend pattern as soil.
  var SEIS = [
    { key: 'V',   label: 'Zone V — Very severe', color: '#d64536' },
    { key: 'IV',  label: 'Zone IV — Severe',     color: '#ef8a3a' },
    { key: 'III', label: 'Zone III — Moderate',  color: '#e8c33c' },
    { key: 'II',  label: 'Zone II — Low',        color: '#66a55b' }
  ];
  var SEISC = {}; SEIS.forEach(function (s) { SEISC[s.key] = s; });
  var seismic = L.geoJSON(null, {
    interactive: false, attribution: 'Seismic zones: BIS / data.gov.in',
    style: function (f) {
      var c = SEISC[(f.properties || {}).zone] || { color: '#888' };
      return { color: '#ffffff', weight: 0.4, opacity: 0.5, fillColor: c.color, fillOpacity: 0.5 };
    }
  });
  var seisLoaded = false;
  function loadSeismic() {
    if (seisLoaded) return; seisLoaded = true;
    fetch(window.MAP.seismic).then(function (r) { return r.json(); })
      .then(function (geo) { seismic.addData(geo); seismic.bringToBack(); });
  }
  var seisLegend = L.control({ position: 'bottomleft' });
  seisLegend.onAdd = function () {
    var div = L.DomUtil.create('div', 'map-legend');
    div.innerHTML = '<h4>Seismic zones</h4>' + SEIS.map(function (s) {
      return '<span class="sl-row"><i style="background:' + s.color + '"></i>' + s.label + '</span>';
    }).join('');
    return div;
  };

  // Active faults & thrusts (GEM Global Active Faults DB), coloured by slip type.
  var FAULTS = [
    { key: 'thrust', label: 'Thrust / reverse fault',  color: '#d64536' },
    { key: 'strike', label: 'Strike-slip fault',       color: '#8155b0' },
    { key: 'normal', label: 'Normal fault',            color: '#2b7fd4' },
    { key: 'fold',   label: 'Fold (anticline/syncline)', color: '#9c6b3f' }
  ];
  var FAULTC = {}; FAULTS.forEach(function (f) { FAULTC[f.key] = f; });
  function faultClass(t) {
    t = t || '';
    if (/Thrust|Reverse/.test(t))              return 'thrust';
    if (/Anticline|Syncline/.test(t))          return 'fold';
    if (/Dextral|Sinistral|Transform/.test(t)) return 'strike';
    if (/Normal/.test(t))                      return 'normal';
    return 'other';
  }
  var faults = L.geoJSON(null, {
    interactive: false, attribution: 'Active faults data: GEM Global Active Faults Database (CC BY-SA)',
    style: function (f) {
      var k = faultClass((f.properties || {}).slip_type);
      var c = FAULTC[k] || { color: '#888' };
      return { color: c.color, weight: k === 'thrust' ? 2.2 : 1.6, opacity: 0.9,
               dashArray: k === 'fold' ? '4,3' : null };
    }
  });
  var faultsLoaded = false;
  function loadFaults() {
    if (faultsLoaded) return; faultsLoaded = true;
    fetch(window.MAP.faults).then(function (r) { return r.json(); })
      .then(function (geo) { faults.addData(geo); faults.bringToFront(); });   // lines sit above the fill overlays
  }
  var faultsLegend = L.control({ position: 'bottomleft' });
  faultsLegend.onAdd = function () {
    var div = L.DomUtil.create('div', 'map-legend');
    div.innerHTML = '<h4>Active faults and thrusts</h4>' + FAULTS.map(function (f) {
      return '<span class="sl-row"><i class="ln" style="background:' + f.color + '"></i>' + f.label + '</span>';
    }).join('');
    return div;
  };

  // Rainfall overlay — a pre-coloured image (WorldClim annual precipitation, clipped to India).
  // The PNG carries its own transparency; Leaflet loads it only when the layer is toggled on.
  var rainfall = L.imageOverlay(window.MAP.rainfall, [[6, 66], [38, 98]], {
    interactive: false, opacity: 1, attribution: 'Rainfall: WorldClim 2.1 (CC BY 4.0)'
  });
  var RAINBANDS = [
    { label: '&gt; 4,000 mm — very wet', color: 'rgb(47,127,184)' },
    { label: '2,000–4,000 mm',          color: 'rgb(52,166,160)' },
    { label: '1,000–2,000 mm',          color: 'rgb(108,191,107)' },
    { label: '500–1,000 mm',            color: 'rgb(188,217,119)' },
    { label: '250–500 mm',              color: 'rgb(232,210,122)' },
    { label: '&lt; 250 mm — arid',      color: 'rgb(239,199,155)' }
  ];
  var rainLegend = L.control({ position: 'bottomleft' });
  rainLegend.onAdd = function () {
    var div = L.DomUtil.create('div', 'map-legend');
    div.innerHTML = '<h4>Annual rainfall</h4>' + RAINBANDS.map(function (b) {
      return '<span class="sl-row"><i style="background:' + b.color + '"></i>' + b.label + '</span>';
    }).join('');
    return div;
  };

  // Agro-ecological regions (ICAR–NBSS&LUP, 20 zones). These are really a physiographic
  // partition of India (Himalayas, Deccan, Ghats, plains…); soft fills just separate
  // neighbours and the full region name shows on hover — the names are messy/typo'd, so
  // we don't bucket them into false categories.
  var AGRO_PAL = ['#8ec6c5','#d9a86c','#a8c686','#c98b8b','#7fa8d0','#cbb26a','#9a8fbf','#87b6a3',
                  '#d0a3b0','#b7c47f','#7bb0b7','#caa27a','#9ab0d4','#b59ac0'];
  function agroName(s) {                                  // ALL-CAPS, typo'd source → readable
    s = (s || '').replace(/\s+/g, ' ').trim().toLowerCase()
         .replace(/e[gc]o[- ]?region/g, 'eco-region')
         .replace(/sub\s*a?humid/g, 'sub-humid')
         .replace(/\bplatu\b/g, 'plateau');
    return s.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }
  var agroeco = L.geoJSON(null, {
    attribution: 'Agro-ecological regions: ICAR–NBSS&LUP / data.gov.in',
    style: function (f) {
      var i = ((f.properties || {}).ae_regcode || 1) - 1;
      return { color: '#ffffff', weight: 0.6, opacity: 0.7,
               fillColor: AGRO_PAL[i % AGRO_PAL.length], fillOpacity: 0.5 };
    },
    onEachFeature: function (f, layer) {
      layer.bindTooltip(agroName((f.properties || {}).physio_reg), { sticky: true, direction: 'top' });
    }
  });
  var agroLoaded = false;
  function loadAgro() {
    if (agroLoaded) return; agroLoaded = true;
    fetch(window.MAP.agroeco).then(function (r) { return r.json(); })
      .then(function (geo) { agroeco.addData(geo); agroeco.bringToBack(); });
  }
  var agroLegend = L.control({ position: 'bottomleft' });
  agroLegend.onAdd = function () {
    var div = L.DomUtil.create('div', 'map-legend');
    div.innerHTML = '<h4>Agro-ecological regions</h4>' +
      '<p style="font-size:.72rem;color:#333;margin:.1rem 0 0;line-height:1.35;">' +
      "India's 20 physiographic–ecological zones (ICAR–NBSS&amp;LUP). Hover a zone for its name.</p>";
    return div;
  };

  L.control.layers({ 'Satellite': satellite, 'Terrain relief': terrain }, { 'Rivers': rivers, 'Soil types': soil, 'Seismic zones': seismic, 'Active faults and thrusts': faults, 'Agro-ecological regions': agroeco, 'Annual rainfall': rainfall }, { collapsed: false }).addTo(map);
  map.on('overlayadd', function (e) {
    if (e.layer === soil)     { loadSoil();    soilLegend.addTo(map); }
    if (e.layer === seismic)  { loadSeismic(); seisLegend.addTo(map); }
    if (e.layer === faults)   { loadFaults();  faultsLegend.addTo(map); }
    if (e.layer === agroeco)  { loadAgro();    agroLegend.addTo(map); }
    if (e.layer === rainfall) { rainfall.bringToBack(); rainLegend.addTo(map); }
  });
  map.on('overlayremove', function (e) {
    if (e.layer === soil)     map.removeControl(soilLegend);
    if (e.layer === seismic)  map.removeControl(seisLegend);
    if (e.layer === faults)   map.removeControl(faultsLegend);
    if (e.layer === agroeco)  map.removeControl(agroLegend);
    if (e.layer === rainfall) map.removeControl(rainLegend);
  });

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
          style: function (feat) {                        // rivers (lines) draw thicker, no fill; regions (polygons) get a filled outline
            var line = feat.geometry.type.indexOf('LineString') > -1;
            return { color: '#1667c6', weight: line ? 3.5 : 2, opacity: 0.9,
                     fillColor: '#1667c6', fillOpacity: line ? 0 : 0.15 };
          }
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
  // Photo popover: pins that carry a `gallery` open a little slider anchored above them.
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

  function slugOf(url) { return (url || '').replace(/\/+$/, '').split('/').pop(); }  // /stories/gondwana/ -> gondwana
  function focusPin(p) {
    if (activePin && activePin.marker._icon) activePin.marker._icon.classList.remove('pin--active');
    activePin = p;
    markActive(p);
    loadStory(p);
    showShape(p);                                       // shape pins get framed by the outline's fitBounds
    if (!p.shape) map.setView(p.latlng, Math.max(map.getZoom(), FOCUS_ZOOM));  // point pins: center + zoom in
    if (p.gallery && p.gallery.length) openGallery(p);  // photo pins get a slider above the pin
    else map.closePopup();                              // no photos → make sure no stale gallery lingers
    if (p.slug) history.replaceState(null, '', '#' + p.slug);   // deep-link: reflect the open feature in the URL
  }
  pins.forEach(function (p) {
    p.cat = catOf(p.type);
    p.slug = slugOf(p.url);
    p.marker = L.marker(p.latlng, { icon: iconFor(p) }).on('click', function () { focusPin(p); });
    p.marker.bindTooltip(p.title, { permanent: true, direction: 'right', className: 'pin-label', offset: [14, 0] });
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
      chip.innerHTML = chipGlyph(c);
      chip.appendChild(document.createTextNode(c.label));
      chip.addEventListener('click', function () {
        if (isAll()) present.forEach(function (x) { activeCats[x.key] = (x.key === c.key); });  // isolate
        else { activeCats[c.key] = !activeCats[c.key]; if (isNone()) showAll(); }               // add/remove
        sync();
      });
      bar.appendChild(chip);
      chips[c.key] = chip;
    });
  })();

  // Search by name: type to filter pins, arrow/enter or click to focus one. A match
  // is revealed even if a category/time filter had hidden its marker.
  (function buildSearch() {
    var box = document.getElementById('pin-search');
    var list = document.getElementById('pin-results');
    if (!box || !list) return;
    var shown = [], active = -1;
    function close() { list.hidden = true; list.innerHTML = ''; shown = []; active = -1; }
    function render() {
      var q = box.value.trim().toLowerCase();
      if (!q) { close(); return; }
      shown = pins.filter(function (p) { return p.title.toLowerCase().indexOf(q) > -1; }).slice(0, 8);
      list.innerHTML = shown.length
        ? shown.map(function (p, i) { return '<li data-i="' + i + '">' + p.title + '<span class="ps-type">' + (p.type || '') + '</span></li>'; }).join('')
        : '<li class="ps-empty">No matches</li>';
      list.hidden = false; active = -1;
    }
    function pick(p) {
      if (!map.hasLayer(p.marker)) p.marker.addTo(map);   // reveal even if a filter hid it
      focusPin(p);
      box.value = ''; close();
    }
    function highlight() {
      for (var i = 0; i < list.children.length; i++) list.children[i].classList.toggle('is-active', i === active);
    }
    box.addEventListener('input', render);
    box.addEventListener('keydown', function (e) {
      if (list.hidden || !shown.length) return;
      if (e.key === 'ArrowDown')      { active = Math.min(active + 1, shown.length - 1); e.preventDefault(); highlight(); }
      else if (e.key === 'ArrowUp')   { active = Math.max(active - 1, 0);                 e.preventDefault(); highlight(); }
      else if (e.key === 'Enter')     { pick(shown[active > -1 ? active : 0]);            e.preventDefault(); }
      else if (e.key === 'Escape')    { close(); }
    });
    list.addEventListener('click', function (e) {
      var li = e.target.closest('li[data-i]');
      if (li) pick(shown[+li.getAttribute('data-i')]);
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.pinsearch')) close(); });
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

  // Deep-link: open the feature named in the URL hash (#slug), revealing it even if a filter hid it.
  function openFromHash() {
    var slug = decodeURIComponent((location.hash || '').replace(/^#/, ''));
    if (!slug || (activePin && activePin.slug === slug)) return;
    var p = pins.filter(function (x) { return x.slug === slug; })[0];
    if (!p) return;
    if (!map.hasLayer(p.marker)) p.marker.addTo(map);
    focusPin(p);
  }
  openFromHash();                                       // honour a hash present on first load
  window.addEventListener('hashchange', openFromHash);  // and back/forward or a pasted link

  window.LTSN = { map: map, pins: pins };   // console handles for debugging
})();
