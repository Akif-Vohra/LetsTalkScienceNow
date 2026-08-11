# India Through Deep Time — project brainstorm

> ⚠️ **This is a write-up of a separate, future idea** — a possible new feature for the
> site, not part of current work and nothing here is built. Parked in `design/` (which is
> excluded from the build) for whenever we decide to take it on.

*A scrubbable animation of India's journey across a **billion years** — riding the
supercontinents Rodinia and Gondwana, drifting inside Pangea, then breaking free and
racing across the Tethys Ocean into the slow-motion collision that is still raising the
Himalaya today.*

**Status:** brainstorm / decision document. Nothing built yet. Branch: `india-through-deep-time`.
This file is the study copy — read it, poke holes in it, then tick the Decisions section.

> **v2 of this doc (2026-08-09):** scope extended backward from 140 Ma to **~1 Ga** — the
> full supercontinent cycle, not just the drift. Search-verified the deep-time model
> (Merdith et al. 2021, 0–1000 Ma) and the Eastern Ghats↔Antarctica tie. New tradeoffs
> around projection and uncertainty are flagged in §3, §5, §7 — read those before deciding.

---

## 1. Vision

One interactive page — `/india-through-deep-time/` — where you grab a slider and drag
India through **a billion years**. Not just India: **Africa, Madagascar, Antarctica,
Australia, Arabia/Seychelles and the Eurasian margin all move** along their real
reconstructed paths ("everyone moves" — decided). Supercontinents assemble and shatter;
the Tethys Ocean opens and closes. Event cards fire at the great moments (the Grenvillian
welding, Gondwana's birth, the Permian ice, the Deccan Traps, goodbye Madagascar, the
collision) and deep-link into the existing story pages and map pins — the animation
becomes a *table of contents for the whole site*.

Why this is the right ambitious project for this repo:
- It **connects assets we already have across the entire time slider**: the ancient
  **cratons** ("How India formed from five cratons"), the **Eastern Ghats** (welded to
  Antarctica!), the **Aravalli** relict orogen, the **Gondwana coal basins** +
  **Jharia/Raniganj** coalfields, **St. Mary's** columnar basalt (Madagascar rifting),
  the **Deccan Traps**, the **Indus–Tsangpo suture**, **Nagaland ophiolite**, the
  **Himalayan foreland basin** — and the map's geological time-slider that already runs
  to 4 Ga. Deep time is what ties the *old* pins in, not just the young ones.
- It's a **signature ownable format** for the brand (the thing NatGeo has in photography).
- Every scrub-through is **reel material** — screen-record segments for Instagram/YouTube.

## 2. The science: India's billion-year itinerary

Reading oldest → youngest. Deep-past rows (≥180 Ma) are the new extension; the drift rows
were the original v1.

| Age | Event | Existing story to link |
|---|---|---|
| ~1000 Ma | **Rodinia** supercontinent. India's **Eastern Ghats** welded to East Antarctica's **Rayner Complex** (Grenvillian granulite metamorphism) | Eastern Ghats; "How India formed from five cratons" |
| ~800 Ma | **Rodinia breaks up** — Greater India rifts away from East Antarctica | Eastern Ghats |
| ~550–530 Ma | **Gondwana assembles** (Pan-African orogeny). India re-docks against Australia–East Antarctica; Africa/Madagascar/Antarctica/Australia locked into one southern supercontinent | Aravalli (relict orogen); cratons |
| ~320 Ma | Gondwana joins Laurasia → **Pangea**. India sits deep in the supercontinent's southern interior | Gondwana |
| ~300–260 Ma | India near the **South Pole**: Permian glaciation (Talchir tillites) → then coal swamps → the **Gondwana coal measures** | Gondwana (sedimentary basins); Jharia & Raniganj coalfields |
| ~180 Ma | **Gondwana starts breaking up** (East vs West) | Gondwana |
| ~130–120 Ma | India+Madagascar rift away from Antarctica/Australia | Gondwana |
| ~88 Ma | India separates from **Madagascar** (Marion hotspot volcanism) | Western Ghats & Madagascar; St. Mary's Islands |
| ~67–52 Ma | **Fastest large plate ever recorded** — up to ~18–20 cm/yr | (speed-o-meter moment) |
| ~66 Ma | India rides over the **Réunion hotspot → Deccan Traps**; K–Pg extinction context | The Deccan Traps |
| ~63–62 Ma | **Seychelles** rifts off (Carlsberg Ridge opens) | — (possible future pin) |
| ~59–50 Ma | **Collision with Eurasia** begins (timing genuinely debated: 59–34 Ma; mainstream ~55–50) | Indus–Tsangpo Suture; Nagaland ophiolite |
| ~50–35 Ma | Slowdown to ~5 cm/yr; Tethys closes | — |
| ~23–15 Ma | Main Himalayan rise (MCT); foreland basin fills; Siwaliks pile up 16–1 Ma | Himalayan Foreland Basin; Siwalik Hills |
| Today | Still converging ~4 cm/yr; Himalaya rising ~5 mm/yr; earthquakes | Seismic zones layer on the map |

**The arc:** India didn't just drift for 140 Myr — it rode **~1 Gyr of the supercontinent
cycle**, assembling and breaking apart twice before its record-breaking northern sprint.
(Figures to double-check against §9 during content writing; where science is debated —
collision age, Rodinia fits — the cards say so honestly, same policy as the Ramgarh age.)

### The honest floor: **where** vs **when**

The map's slider runs to **4 Ga** because that dates India's *rocks* (Singhbhum craton
~3.5 Ga, Dharwar…). But we only know **where** India *was* back to about **1 Ga** — that's
the limit of continuous plate reconstructions. Before ~1 Ga, positions are unknown/too
speculative. So the animation's honest floor is **~1000 Ma (Rodinia)**: the moment India's
story becomes *locatable*. A nice framing to state on-page — "the rocks go back 3½ billion
years; the map of where they sat goes back one."

Also true and worth a caveat: deep in time **"India" is not one rigid block** — the Dharwar,
Bastar, Bundelkhand, Singhbhum and Aravalli cratons amalgamated progressively, only behaving
as a single "India" plate by roughly Rodinia time. For a schematic that's fine (we rotate
the whole outline on India's plate ID) but the ~1 Ga end should say "cratons still assembling."

## 3. The hard problem: where was everything, when?

Three ways to get plate positions; **the third is a verified winner**:

1. **Hand-authored keyframes** from published maps — weeks of eyeballing, scientifically
   mushy, and "everyone moves × a billion years" is hopeless by hand. ❌
2. **Copy paleo-map images** (Scotese et al.) as backdrops — copyright problems. ❌
3. **Precompute real reconstructions offline** via the free **GPlates Web Service**
   (gws.gplates.org, EarthByte / Univ. of Sydney), store as one static JSON in the repo,
   never call any service at runtime. ✅ **Recommended.**

### What was LIVE-VERIFIED against gws.gplates.org (2026-08-09)

- `GET https://gws.gplates.org/reconstruct/reconstruct_points/?points=77,20&time=66&model=MULLER2019`
  → works, free, no key. Docs: https://gwsdoc.gplates.org
- **The key trick:** `reconstruct_points` with `pid=<plateID>&ignore_valid_time`
  rigid-rotates **all** submitted points — same count, same order, no dropouts — at every
  age. Submit the *same present-day polygon vertices* for every age → per-vertex
  correspondence across frames → runtime is a trivial per-vertex lerp. (The naive
  `reconstruct_feature_collection` endpoint densifies arcs — vertex count varies per age —
  verified unusable.)
- Plate-ID lookup endpoint verified (MULLER2019): India=501, Madagascar=702, Australia=801.
  **⚠ Plate IDs differ per model** — must be re-discovered for the deep-time model.
- Off-plate sentinel `[999.99,999.99]` exists but the `pid` trick avoids it entirely.

### Model coverage — the new deep-time consideration ⭐

The Mesozoic–Cenozoic drift model **MULLER2019 only spans 0–250 Ma** — it *cannot* reach
Pangea, Gondwana assembly, or Rodinia. For the billion-year story we need a deep-time model:

- **MERDITH2021** — "Extending full-plate tectonic models into deep time" (Merdith et al.
  2021, *Earth-Science Reviews* v.214, doi:10.1016/j.earscirev.2020.103477). **Continuous
  0–1000 Ma.** Search-verified as the standard reference for deep time and available on GWS
  as `MERDITH2021`. ✅ Recommended base for the whole animation.
- Alternatives on GWS reaching deep time: `PALEOMAP` (Scotese, ~0–1100 Ma), `CAO2024`,
  `ZAHIROVIC2022` (0–410).

**Two ways to use them (a real decision — see D3):**
- **(a) Single model, MERDITH2021 throughout (0–1000 Ma).** Simplest, one coordinate frame,
  no seams. Slightly less refined for India's fast Cenozoic sprint than MULLER2019.
- **(b) Splice:** MULLER2019 for 0–250 Ma (best-resolved sprint) + MERDITH2021 for
  250–1000 Ma. More authentic detail where it matters, but risks a **visible jump at the
  250 Ma seam** (the two models can place a plate a few hundred km apart). Mitigation:
  blend across a ~20 Myr window, or just start with (a) and only splice if the sprint looks
  wrong. **Recommend (a) for v1.**

### Attribution string (ship in JSON `_source`, geo README row, and on-page)

> Plate positions reconstructed with the GPlates Web Service (gws.gplates.org, EarthByte
> Group, University of Sydney) using the Merdith et al. 2021 model (doi:10.1016/j.earscirev.2020.103477)
> [and Müller et al. 2019, doi:10.1029/2018TC005462, for 0–250 Ma if spliced]. EarthByte
> data CC BY. Present-day outlines: DataMeet (India, CC0), Natural Earth (public domain).
> Schematic — positions increasingly approximate before ~200 Ma.

## 4. Data pipeline (offline, one-time)

`scripts/build-deep-time.py` — python3 **stdlib only** (urllib + json; no GDAL needed):

1. **Present-day source polygons**, simplified hard (this is a schematic):
   - India: largest ring of `assets/geo/india.geojson` → `npx mapshaper -simplify` → ~200 verts
   - Africa, Madagascar, Antarctica, Australia, Arabia, S-Eurasia margin: **Natural Earth
     1:110m land** (public domain — the repo's blessed trans-boundary source), ~60–250 verts
     each; Eurasia clipped to a southern band (Siberia adds nothing)
   - Seychelles: hand-drawn ~10-vertex schematic blob (too small for 110m data)
   - Committed as `assets/geo/deep-time/present_day.geojson` (provenance + age-0 sanity check)
2. **Discover plate IDs** per plate **for the chosen model** via `assign_points_plate_ids`
   (MERDITH2021 IDs may differ from MULLER2019); store them; fail loudly if they change.
3. **Reconstruct** each plate × each age via `reconstruct_points` + `pid` + `ignore_valid_time`;
   assert vertex count & no sentinels.
4. **Emit** `assets/geo/deep-time/plates.json`, coords rounded to 0.1° (≈11 km ≈ 1 px).

**Variable time step (because a billion years is a lot of frames):**
motion is slow inside supercontinents and frantic during the sprint, so step coarser early —
e.g. **25 Myr for 1000→300, 10 Myr for 300→140, 5 Myr for 140→0** ≈ 28 + 16 + 28 = **~60
frames** (vs 29 for the 140 Ma version). The runtime interpolates, so uneven spacing is fine
as long as the JSON stores each frame's actual age.

### JSON schema

```json
{
  "_source": "<attribution>", "model": "MERDITH2021",
  "ages": [1000, 975, "…", 300, 290, "…", 140, 135, "…", 5, 0],
  "plates": [
    { "id": "india", "name": "India", "pid": <MERDITH2021 id>,
      "frames": [ [[lon,lat], "…N pairs…"], "…one frame per age, identical N…" ] }
  ]
}
```

*(Note: `ages` now explicit per-frame, not a single `step_myr`, to allow the variable step.)*

**Size budget:** 8 plates × ~150 avg verts × ~60 frames ≈ **~780 KB raw / ~200–260 KB
gzipped** (GitHub Pages gzips; highly repetitive). Roughly double the 140 Ma version.
Ceiling < 900 KB raw / < 300 KB transfer. Escape hatches: coarser early steps (50 Myr
before 400 Ma), simplify to ~100 avg verts, or drop rarely-watched deep frames.

## 5. Runtime design (vanilla, zero dependencies, zero runtime requests)

Mirrors the house style (`map.js` conventions): IIFE, `window.DEEP_TIME` Liquid blob with
`?{{ site.time | date: '%s' }}` cache-busting on blob + script tag, `window.LTSN_DT` handle,
`fetch` the JSON, one `<path>` per plate, `render(age)` lerps vertices between the two
bracketing frames.

### ⚠ The projection problem deep time introduces

The original flat plan used **equirectangular** over an Indian-Ocean window (lon −25…125,
lat −75…45). That's fine for the *drift* era. **But Gondwana sat over the South Pole**, and
Rodinia/Gondwana neighbours spread right across the southern hemisphere — an equirectangular
map **smears the pole into a stretched line** and can't hold a south-polar supercontinent
sensibly. This is the single biggest new design question. Options:

- **(P1) South-polar azimuthal projection** for the whole animation (`d3-geo`-style azimuthal
  equidistant centred on ~south pole, or hand-rolled — it's ~15 lines of trig, no dependency
  needed). Handles poles natively; India spirals up and over the pole toward the equator as
  it drifts north. **Most honest for the billion-year view. Recommended.**
- **(P2) Keep equirectangular but widen** to the whole southern hemisphere (lat −90…45).
  Simplest code, but polar distortion is ugly exactly when the story is polar (Gondwana).
- **(P3) Two views** — polar for deep time, the Indian-Ocean equirectangular window for the
  drift — crossfade at ~180 Ma. Nicest but the most work.
- **(P4) This is the argument for the 3D globe** (D10). Poles are free on a sphere; the
  deeper we go, the more a globe earns its keep. Deep time may *pull v1 toward a globe* — or
  at least make the globe a stronger v2.

Write `project()` as one swappable function regardless; the choice above only changes its body.

### Rest of runtime

- **Stage:** inline SVG, fixed `viewBox` sized to the chosen projection; static graticule;
  a "Tethys Ocean" label that fades as the ocean closes.
- **Render:** ~1,500 verts/frame ≈ <1 ms JS; 60 fps with huge margin (safe ceiling ~5,000).
- **Controls:** native `<input type="range">` over the frame index (free keyboard a11y),
  `aria-valuetext` "540 million years ago"; play/pause `<button aria-pressed>` driving a rAF
  loop; a **period ribbon reusing the SEG band colours** — and now the ribbon actually spans
  most of the map's slider (Neoproterozoic → today), tightening the visual link between the
  two pages.
- **Slider time mapping (D7 gains weight):** linear over 1000 Myr spends 85% of the track in
  slow supercontinent eras and crams the exciting sprint+collision into the last centimetre.
  Options: (i) linear (honest but dull middle), (ii) **piecewise/"cinematic"** — give the
  eventful windows (1000, 550, 300–260, 180–0) more track, or (iii) reuse the map's
  **log-banded SEG mapping** (consistent with the site, naturally expands recent time). Lean
  (ii) or (iii).
- **`prefers-reduced-motion`:** no autoplay; Play steps discretely through keyframes; scrub
  renders directly.
- **Deep links:** `#66ma`, `#550ma`, `#1000ma` (regex `^#(\d+)ma$`), `hashchange` + debounced
  `history.replaceState` — mirrors the map's `#slug` pattern.
- **Event cards:** `_data/deep_time.yml` (`age_ma, title, blurb, links[]`), injected via the
  blob, `aria-live="polite"`, cross-linking to `/geological-map-of-india/#deccan-traps` etc.

## 6. UX ideas (beyond the core scrub)

- **Chapter stepper** (now spanning the full cycle): Rodinia → Gondwana → Pangea → Breakup →
  The Sprint → Collision → Himalaya (buttons fly the slider to an age + open the card).
- **Speed-o-meter**: live "India: 18 cm/yr 🏃" — near-zero inside supercontinents, screaming
  during the sprint. The contrast *is* the story.
- **Supercontinent name badge** that appears/disappears ("part of RODINIA", "part of GONDWANA",
  "part of PANGEA", "island continent", "colliding").
- **Distance-to-Eurasia countdown** as the Tethys closes.
- **"See it on the map"** buttons per card → existing pins (`#gondwana`, `#deccan-traps`,
  `#eastern-ghats`…), and reciprocal "watch this moment" links from story pages back to the
  animation (`#88ma`, `#1000ma`).
- **Reel export workflow**: screen-record scrubs as shorts — the animation is a content factory.
- Beta-badge it like the map at launch.

## 7. Risks (top ones, with mitigations)

| Risk | Verdict |
|---|---|
| Vertex correspondence breaks | **Solved** — `pid` trick verified live; script asserts per frame |
| Plates vanish at old ages (validity windows) | **Solved** — `ignore_valid_time` |
| **Projection: Gondwana over the South Pole** | **New / biggest** — equirectangular fails at the pole; go south-polar azimuthal (P1) or accept it pushes toward a globe (P4). Decide early — it shapes the whole build |
| **Reconstruction uncertainty grows with age** | Positions solid to ~200 Ma, schematic 200–550 Ma, Rodinia fits (750–1000 Ma) actively debated. Label per-era confidence; the card copy owns it |
| **Position floor ~1 Ga vs rock ages 4 Ga** | Don't fake pre-1 Ga positions. Start at 1000 Ma; state the "where vs when" framing on-page |
| **"India" not rigid before ~1 Ga** (cratons still assembling) | Schematic is fine; the ~1 Ga card says so |
| **Model swap / splice seam** (MULLER2019↔MERDITH2021 at 250 Ma) | Use single MERDITH2021 for v1 (no seam); splice only if the sprint needs it, with a blend window |
| Plate IDs differ per model | Script re-discovers IDs for the chosen model; fails loudly |
| India overlaps Eurasia after ~50 Ma (rigid plates can't shorten) | Cosmetic & honest — Eurasia beneath; collision card explains ~2,000 km shortening |
| Greater India (pre-collision extent ≫ modern outline) | v1: say it in the card; v2: dashed extension |
| File size (~2× the 140 Ma version) | ~200–260 KB gzipped — fine; coarse early steps if needed |
| GWS outage / ToS change | Irrelevant at runtime — data committed |
| CC BY 3.0 vs 4.0 ambiguity | Attribution required either way; confirm before launch |

## 8. Decisions — tick these after studying

- [ ] **D1. Start age / depth:** 140 Ma (drift only) · 180 Ma (breakup) · 250 Ma (Pangea) ·
      **550 Ma (Gondwana — recommended sweet spot: rich story, still decently constrained)** ·
      **1000 Ma (Rodinia — max ambition, the full cycle, but most speculative + polar)**
- [ ] **D2. Pipeline:** GWS precompute (recommended; verified) vs hand keyframes vs GPlates desktop
- [ ] **D3. Rotation model:** **MERDITH2021 single (0–1000, recommended)** vs splice
      MULLER2019+MERDITH2021 vs PALEOMAP
- [ ] **D4. Projection (NEW — gates the build):** south-polar azimuthal (P1, recommended for
      deep time) · widened equirectangular (P2) · two-views crossfade (P3) · **or make this
      the reason to do the globe now (P4)**
- [ ] **D5. Plates list:** India, Africa, Madagascar, Antarctica, Australia, Arabia,
      Eurasia-margin, Seychelles — add Somalia? Iran/Lut blocks? South China?
- [ ] **D6. Time step:** variable (25/10/5 Myr — recommended) vs uniform
- [ ] **D7. Slider mapping:** linear · **cinematic piecewise (recommended)** · log-banded (SEG)
- [ ] **D8. Greater India** dashed extension in v1, or defer?
- [ ] **D9. Chapter stepper in v1**, or free scrub only first?
- [ ] **D10. URL + nav label:** `/india-through-deep-time/`, label "India through deep time"?
- [ ] **D11. 3D globe now or v2?** — the deeper we go, the more the globe earns its place (see D4)

## 9. Reading list (for independent research)

**Data & tools**
- GPlates Web Service docs — https://gwsdoc.gplates.org · models list https://gwsdoc.gplates.org/models/
- **Merdith et al. 2021**, "Extending full-plate tectonic models into deep time," *Earth-Science
  Reviews* 214 (0–1000 Ma model) — doi:10.1016/j.earscirev.2020.103477
- Müller et al. 2019, *Tectonics* (0–250 Ma, refined drift) — doi:10.1029/2018TC005462
- GPlates desktop + tutorials — https://www.gplates.org
- Natural Earth (110m land, public domain) — https://www.naturalearthdata.com

**India's deep past (the new rows)**
- Eastern Ghats ↔ Rayner Complex (Antarctica): Grenvillian + Pan-African welding — e.g.
  "Eastern Ghats Province (India)–Rayner Complex (Antarctica) accretion: Timing the event,"
  *Lithosphere* 2018; and the Indo-Antarctica suture / Rengali–Rauer–Ruker correlation papers
- Rodinia configurations & breakup (~0.8 Ga India–Antarctica rifting) — Li et al. 2008 synthesis
- Gondwana assembly / Pan-African orogeny in India (~550 Ma)
- Permian glaciation + Gondwana coal (Talchir Formation, Damodar/Son–Mahanadi basins)

**India's sprint & collision**
- van Hinsbergen et al. 2011/2012 (Greater India Basin; collision stages)
- Jagoutz et al. 2015, *Nature Geoscience* — double subduction, why India sped
- Cande & Stegman 2011, *Nature* — Réunion plume push
- Hu et al. 2016, *Earth-Science Reviews* — collision-age debate

**Prior art / inspiration**
- Ian Webster's *Ancient Earth* (dinosaurpictures.org/ancient-earth) — Scotese data; the UX
  benchmark, and notably it *does* go to ~750 Ma on a **globe** — evidence for D4/D11
- Christopher Scotese PALEOMAP animations; Eleanor Lutz timeline design language

## 10. Phased roadmap

| Phase | What | Est. |
|---|---|---|
| 0 | This document; decisions D1–D11 | done / you |
| 1 | Decide **D4 projection** first (it gates everything); prototype `project()` with one static plate to sanity-check the stage before any data work | 0.5 session |
| 2 | Pipeline: `build-deep-time.py`, present-day outlines, `plates.json` (chosen depth) committed; age-0 frame matches reality; spot-check 550 & 1000 Ma vs published maps | 1 session |
| 3 | Page v0: stage + slider + play; the full cycle animates; India sprints 67–50 Ma | 1 session |
| 4 | Event cards (deep + drift), chapter stepper, speed-o-meter, supercontinent badge, hash links, two-way cross-links | 1–2 sessions |
| 5 | Polish: projection review, mobile, reduced-motion, per-era uncertainty labels, credits, OG image, Beta badge, nav + homepage card | 1 session |
| 6 | Launch + reels; then v2: 3D globe, Greater India, narration mode | later |
