# CLAUDE.md

Onboarding for AI agents working on **Let's Talk Science Now** — read this first.
(This is the project instructions file Claude Code auto-loads each session.)

## What this is

A **Jekyll static site** (companion to the maintainer's Instagram + YouTube science-education reels, `@lets.talk.science.now` / `@LetsTalkScienceNow`). Each short reel becomes a **Story** page: the embedded video + a deeper written explanation + references + notes. Hosted on **GitHub Pages** at the custom domain **letstalksciencenow.com** (see `CNAME`). Repo: `github.com/Akif-Vohra/LetsTalkScienceNow`.

## Run it locally

```bash
bundle install
bundle exec jekyll serve      # http://127.0.0.1:4000
```

- Ruby + Jekyll 4 + `webrick` are already available. Plugins: `jekyll-seo-tag`, `jekyll-feed`, `jekyll-sitemap` (all GitHub-Pages-supported).
- **`_config.yml` changes require a server restart** (Jekyll doesn't hot-reload config). Everything else auto-regenerates.
- GitHub Pages rebuilds automatically on push (~1–2 min). No CI config needed.

## The content model (most important section)

**`_data/reels.yml` is the single source of truth** for all story content — one entry per reel. The pages are thin and data-driven; you rarely write HTML to add content.

Each reel entry:
```yaml
- id: nagaland-ophiolite          # stable slug = URL + folder name
  date: 2026-07-25                 # drives ordering (newest first); see below
  overlay_title: "..."             # the headline shown on cards + story <h1>
  reel_url:                        # Instagram link (optional)
  youtube_url:  / youtube_id:      # YouTube Short — youtube_id powers the embed
  image: /stories/<id>/cover.png   # thumbnail (see Covers below)
  topic: our-planet                # one of _data/topics.yml keys
  series: indian-geology           # optional; one of _data/series.yml keys
  location: "..."                  # optional
  tags: [science, geology]         # from the caption hashtags
  references: [ "..." ]            # optional; cited sources
  caption: |                       # Instagram caption, verbatim
  pinned_comment: |                # optional; renders as "Notes & corrections"
```

**Each story is a folder ("page bundle")** at `_stories/<id>/`:
- `index.md` — a 4-line stub (`layout: story`, `reel: <id>`, `permalink: /stories/<id>/`, `title:`). The `story` layout looks up the reel data by `reel:`.
- `cover.png` (or `cover.svg` placeholder) — the thumbnail. Publishes to `/stories/<id>/cover.<ext>`.

`_stories` is a Jekyll collection (`output: true`). Static files co-located in a collection folder **do** get published — that's why the cover lives next to the stub.

### How to add a new story
1. Append an entry to `_data/reels.yml`.
2. Create `_stories/<id>/index.md` (copy an existing stub; change `reel`, `permalink`, `title`).
3. Add `_stories/<id>/cover.png` (or a placeholder SVG — see below).
4. It now appears automatically on the homepage feed, `/stories/`, and its category/series pages.

### Categories & Series
- Every story/reel carries a `category:` (one of `geology`, `biology`, `space`, `everyday-science`, `computer-science`).
- `/categories/` + `/categories/<slug>/`, `/series/` + `/series/<slug>/` — all data-driven from `_data/categories.yml` / `_data/series.yml` (each: `name`, `summary`, categories also `tint`).
- A category/series page is a tiny file in `categories/` or `series/` (`layout: category`/`series`, front-matter `category:`/`series:`, `permalink:`). **When a series gains its first story, create its page file** or the listing link 404s. (The four category pages already exist.)
- Series with **zero** stories are auto-hidden from listings.

### Ordering
Listings sort by the reel's `date` field, newest first. The sort lives in the **templates**, not the data — `site.data.reels | sort: "date" | reverse` in `stories.html:19`, `index.html` (homepage feed), and the category/series layouts. Change a `date` → reorder.

### Covers
- Real covers: `_stories/<id>/cover.png` (landscape-ish crops read best; cards are 16:10).
- Placeholders: topic-tinted `cover.svg` with the title (generated in past sessions via a throwaway script — hand-author one following any existing `_stories/*/cover.svg` if needed).
- The card only renders `<img>` when `image:` is set; otherwise it shows a gradient fallback. So **set `image:` when you add a cover** (an "auto-detect cover.png" enhancement was discussed but not built).

## The interactive geological map (the *other* content system)

A major feature added after the initial build: an **interactive geology map of the
Indian subcontinent** at **`/geological-map-of-india/`** (page: `map.html`; nav label
"Geological map of India"). ⚠️ It was renamed from `/map/` — that old URL now 404s.

**Logic lives in `assets/js/map.js`** (Leaflet 1.9.4 + a time-slider + a category
filter). It's a *static* asset (no Liquid), so map.html injects data via a
`window.MAP` blob. The Leaflet instance is trapped in an IIFE — a **`window.LTSN =
{ map, pins }`** handle is exposed for console debugging (use it when verifying).
Base map: keyless **Esri World Imagery** tiles; the black border is
`assets/geo/india.geojson`; a toggleable **Rivers** overlay is `rivers.geojson`.

### Pins come from STORY front matter — not a data file
A pin is **any story with `add_on_map: true`**. map.html loops
`site.stories | where_exp: "s", "s.add_on_map"`, so pins work for **both** the
`geo-feature` layout (reference pages, no reel) and the reel-backed `story` layout.
Relevant front-matter fields:
- `add_on_map: true`
- `latlng: [lat, lon]`
- `age_ma:` number in Ma — drives the **time-slider filter** *and* the fact-card age.
- `feature_type:` string from a controlled vocabulary — drives the **category + pin colour** (see `catOf` in map.js).
- `shape:` *(optional)* `/assets/geo/features/<x>.geojson` — an outline drawn + zoomed-to on click. Polygons render filled; lines/rivers render as a thick stroke.
- `map_title:` *(optional)* short label when the page title is long/catchy.
- `gallery:` *(optional)* list of `{src, caption?, credit?}`. If present, clicking the pin opens a photo **popover above the marker** (slider: ‹ › / arrow keys / Esc, click-outside to close). Emitted into `window.MAP` by map.html; handled by `openGallery` in map.js. Pins without it behave normally. GIFs animate (they're `<img>`).
- `age:` / `period_or_era:` *(optional)* string overrides for the fact-card.

To **add a map feature**: a `geo-feature` story = a 2-paragraph note + those fields
(no reel needed). A reel-backed `story` just adds the fields to its existing stub.

### The fact-card & geological time
- **`_includes/feature-box.html`** — the light-blue "fact card" (title · location ·
  feature_type · age) shown on the page **and** in the map's reader panel. Shared by
  both layouts. It **derives** the age string + period/era from `age_ma` using
  **`_data/periods.yml`** (`>=1000 Ma → Ga`, `1–999 → Ma`, `<1 → ka`; Precambrian
  shows the **era**, Phanerozoic the **period**). Override with `age`/`period_or_era`.
- `_data/periods.yml` mirrors the `SEG` array in map.js (the slider bands). If you
  change one, change the other.

### Categories & filter
`CATS` in map.js defines ~13 categories (Mountains, Plateaus, Volcanic, Impact
craters, Cratons & basins, Tectonic structures, Fossils, Rocks & minerals, Rivers,
Lakes, Coasts & islands, Deserts, Mining & energy). `catOf(feature_type)` maps a type string → category by keyword. Chips
filter (multi-select + an "All" chip; from All, a click **isolates** one); pins are
tinted per category.

### Geo data & the tracing pipeline (`assets/geo/`)
**Only `*.geojson` is published**; raw sources (`*.zip`/`*.tiff`/`*.kml`) are
committed for provenance but **excluded from the build** (`_config.yml`). Full
provenance + credits live in **`assets/geo/README.md`** (a Source / Transformation /
Credit table — keep it updated when adding outlines). How outlines get made:
1. **GSI-on-Esri:** `scripts/fetch-shape.sh` pulls a GSI supergroup from the Esri India Living Atlas (Deccan, Aravalli).
2. **Bhukosh shapefile** → `npx mapshaper` reproject(`-proj wgs84`)+simplify → geojson (Rivers).
3. **Raster tracing (the standard workflow):** maintainer georeferences a map on **georeference.ai** → exports a GeoTIFF → **`scripts/trace-geotiff.py`** colour-keys the highlighted region and traces it to a polygon. One command:
   `python3 scripts/trace-geotiff.py IN.tiff features/OUT.geojson --name "…" --preview /tmp/x.png` (flags: `--sample X,Y`, `--color R,G,B`, `--simplify`, `--close`, `--downsample`). Used for Thar, Gondwana, Western Ghats, Himalayan foreland.
4. **Google Earth KML** → geojson (Lonar rim).
5. **Individual rivers:** filtered out of `rivers.geojson` by `rivname` into `features/*-river.geojson`.

### Map gotchas (read before touching it)
- **India-only sources clip trans-boundary features at the border.** GSI/Bhukosh
  stops at India's edge (Ganga/Brahmaputra were cut off). For anything crossing a
  border (rivers, Indus, etc.) use **Natural Earth** (public domain, global) instead.
  Also: global datasets **split one river into several differently-named segments**
  (Brahmaputra = Yarlung + Dihang + Brahmaputra) — grab the whole system, not just
  the headline name, or you leave a gap.
- **New story folders need a Jekyll restart** (new collection dirs aren't hot-detected).
- **Cache-busting:** `map.js` (map.html) and `main.css` (head.html) load with
  `?{{ site.time }}` — the browser/preview pane caches JS/CSS hard and would show
  stale builds otherwise. **Keep it.**
- **Disputed borders are never named** in comments/data; place border-sensitive pins
  on the Indian side and describe features geologically.
- **Attribution/licensing:** each traced geojson carries a `_source` member + a README
  credit. Some are **share-alike** — the Gondwana image is **CC BY-SA 4.0**, so its
  derived outline must stay CC BY-SA + keep attribution. Credit **Akif Vohra** for the
  manual georeference.ai work.
- **BETA:** map.html currently shows a dismissible "Thanks for testing" box + a BETA
  badge (a small friendly test round is live). Remove both when the beta ends.

## Layout & structure

```
_config.yml            site config + `stories` collection
_data/                 reels.yml (content), navigation.yml, topics.yml, series.yml, periods.yml (geo time bands)
_layouts/              default, story, topic, series, geo-feature (map reference pages)
_includes/             head, header, footer, *-card, icon-*.svg, feature-box.html (the map fact-card)
_stories/<id>/         index.md stub + cover.png|svg   (the collection; map pins live here too, via add_on_map)
index.html             homepage      stories.html → /stories/     about.html → /about/
topics/                index.html + <slug>.html per topic
series/                index.html + <slug>.html per series
map.html               the interactive map → /geological-map-of-india/
assets/js/             map.js (map logic), site.js (nav toggle)
assets/geo/            india/rivers geojson, features/*.geojson (outlines), README (provenance), raw sources (excluded)
scripts/               trace-geotiff.py (raster→polygon), fetch-shape.sh (GSI-on-Esri)
assets/css/            main.css (design system), fonts.css (@font-face)
assets/fonts/          self-hosted woff2 (Poppins static, Inter variable)
mascot.png             brand mascot   CNAME → letstalksciencenow.com
design/styleguide.html palette/type reference (excluded from build)
```

## Design system

"**Bright & Curious, warmed**" — friendly, airy, not busy. All tokens in `assets/css/main.css` (tokens → reset → base → layout → components → utilities).
- **Fonts:** Poppins (headings) + Inter (body), **self-hosted** in `assets/fonts/` via `assets/css/fonts.css` — do **not** re-add Google Fonts (removed deliberately for GDPR; see below).
- **Palette:** `--blue #1667c6`, `--red #ef4444` ("Now"), ink `#1c2733`; topic tints — planet `#1e88c9`, nature `#2fa25c`, space `#6c5ce7`, ingenuity `#f0873c`.
- Reusable classes: `.container`, `.btn`(+`-primary`/`-ghost`/`-social`), `.page-head`, `.section`, `.story-card`, `.topic-card`, `.series-card`, `.hero`, `.prose`, `.video-embed`.

## Conventions & gotchas

- **No custom plugins** (GitHub Pages restriction) → no data-driven page *generation*; that's why every story/topic/series needs a physical stub file.
- **`_data/` files never publish** as static assets — images must live under `assets/` or inside `_stories/<id>/`, never `_data/`.
- Captions/notes render with `| escape` inside `white-space: pre-line`, so hashtags/quotes are safe and paragraph breaks are preserved.
- Keep the maintainer's caption/pinned-comment text **verbatim** in `reels.yml`.

## Open items / roadmap

- **Topic imbalance:** many "human body & mind" reels (eye floaters, nasal cycle, McGurk, tears, palm lines, pink elephant, sexual dimorphism) are filed under **Nature**. A 5th topic ("Human Body" / "Mind & Body") was proposed but not yet added.
- **About** is now built (`about.html` — bio + photo). **Newsletter** nav is still a stub and needs an email-provider decision.
- **Germany / GDPR** (maintainer is Berlin-based): fonts already self-hosted ✅. Still open — switch YouTube embeds to `youtube-nocookie.com` (or click-to-load facade), and add an **Impressum** + privacy policy.
- Most reels lack `youtube_id` and a real `cover.png` (placeholders in use) — the maintainer fills these in over time.
- **Map — open items:** (a) the ~37 auto-generated `geo-feature` notes read a bit formulaic (every one is 2 paragraphs opening with a **bold term**) — a de-uniforming prose pass was flagged but not done; (b) for strict **CC BY-SA / IUCN** compliance the traced outlines' credit should ideally show *on the map* (only the Rivers layer has a live attribution today), not just in the repo; (c) more outlines/rivers can be added the same way (Indus etc.).

## Working with the maintainer

**Pause and lay out options before executing.** For open/exploratory questions, present the approaches + trade-offs and ask what they want — don't sprint into building or run a batch of probing commands. Clearly greenlit, well-scoped tasks are fine to just do.

## Working principles

_Verbatim from the [Karpathy-inspired Claude Code guidelines](https://github.com/multica-ai/andrej-karpathy-skills), which this project adopts. (Headings demoted one level to nest here.)_

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
