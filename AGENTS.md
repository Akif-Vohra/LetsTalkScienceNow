# AGENTS.md

Onboarding for AI agents working on **Let's Talk Science Now** — read this first.

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
4. It now appears automatically on the homepage feed, `/stories/`, and its topic/series pages.

### Topics & Series
- `/topics/` + `/topics/<slug>/`, `/series/` + `/series/<slug>/` — all data-driven from `_data/topics.yml` / `_data/series.yml` (each: `name`, `summary`, topics also `tint`).
- A topic/series page is a tiny file in `topics/` or `series/` (`layout: topic`/`series`, front-matter `topic:`/`series:`, `permalink:`). **When a series/topic gains its first story, create its page file** or the listing link 404s.
- Series with **zero** stories are auto-hidden from listings.

### Ordering
Listings sort by the reel's `date` field, newest first. The sort lives in the **templates**, not the data — `site.data.reels | sort: "date" | reverse` in `stories.html:19`, `index.html` (homepage feed), and the topic/series layouts. Change a `date` → reorder.

### Covers
- Real covers: `_stories/<id>/cover.png` (landscape-ish crops read best; cards are 16:10).
- Placeholders: topic-tinted `cover.svg` with the title (generated in past sessions via a throwaway script — hand-author one following any existing `_stories/*/cover.svg` if needed).
- The card only renders `<img>` when `image:` is set; otherwise it shows a gradient fallback. So **set `image:` when you add a cover** (an "auto-detect cover.png" enhancement was discussed but not built).

## Layout & structure

```
_config.yml            site config + `stories` collection
_data/                 reels.yml (content), navigation.yml, topics.yml, series.yml
_layouts/              default, story, topic, series
_includes/             head, header, footer, story-card, topic-card, series-card, icon-*.svg
_stories/<id>/         index.md stub + cover.png|svg   (the collection)
index.html             homepage      stories.html → /stories/
topics/                index.html + <slug>.html per topic
series/                index.html + <slug>.html per series
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
- **About** and **Newsletter** nav pages are still stubs (`#`/unbuilt). Newsletter needs an email provider decision.
- **Germany / GDPR** (maintainer is Berlin-based): fonts already self-hosted ✅. Still open — switch YouTube embeds to `youtube-nocookie.com` (or click-to-load facade), and add an **Impressum** + privacy policy.
- Most reels lack `youtube_id` and a real `cover.png` (placeholders in use) — the maintainer fills these in over time.

## Working with the maintainer

**Pause and lay out options before executing.** For open/exploratory questions, present the approaches + trade-offs and ask what they want — don't sprint into building or run a batch of probing commands. Clearly greenlit, well-scoped tasks are fine to just do.
