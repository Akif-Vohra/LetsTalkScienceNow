# LetsTalkScienceNow

The site behind [@lets.talk.science.now](https://www.instagram.com/lets.talk.science.now) — short visual science stories, with deeper articles and references for anyone who wants to keep digging. Built with Jekyll, hosted on GitHub Pages at [letstalksciencenow.com](https://letstalksciencenow.com).

## Running it locally

You need Ruby and Bundler. Then:

```
bundle install        # once
bundle exec jekyll serve
```

Open <http://localhost:4000>. Jekyll rebuilds on save; refresh the page to see changes.

## How content works

A reel becomes a story page. The pipeline is data-driven — you rarely touch layouts.

1. Add an entry to `_data/reels.yml` (the caption, links, topic, sources — captured verbatim). This alone lists it on the site.
2. Drop a cover image at `_stories/<id>/cover.png`.
3. Write the article at `_stories/<id>/index.md` with `layout: story`.

The `id` is the slug — it ties the reel, the story folder, and the map pin together, and becomes the URL `/stories/<id>/`.

## The map

`/map/` is a split view: the map on the left, a story reader on the right that loads a story when you click a pin (fetched on demand, not all at once).

**Add a pin** — four lines in `_data/map.yml`:

```yaml
- title: "Deccan Traps"
  latlng: [18.5, 74.5]   # [lat, lon], approximate — tweak freely
  story: deccan-traps    # a reel id, OR a reference-feature slug
  age_ma: 66             # age in millions of years — places it on the time slider
```

If `story` points at a reel id, the reader shows that story. For places that deserve a pin but don't have a reel yet, write a short sourced note under `_stories/<slug>/index.md` with `layout: geo-feature` — these get a pin and a reader page, but stay out of the reel listings.

## Project layout

```
_data/         reels, map pins, topics, series, nav — the content lives here
_stories/      one folder per story (index.md + cover.png)
_layouts/      story, geo-feature, topic, series, default
assets/        css, images, the map's GeoJSON
index.html     home            map.html   the interactive map
stories.html   all stories     topics/    per-topic pages
```

## Community ideas / roadmap

Suggestions from Instagram followers (@lets.talk.science.now) for where the app could go next:

**Content & coverage**
- Cover the **major rivers** — when each one started appearing — possibly as a separate map on the origin of India's rivers and water bodies.
- Include **neighbouring countries**: Pakistan, Bangladesh, Nepal, Bhutan, and possibly Myanmar.
- **Go beyond India** eventually — geological maps of whole continents (Africa, Europe, …).

**Interactivity**
- A **trivia section** for each location.
- A **quiz with 3D topography** (via Mapbox / Cesium).
- Show India's landmass **drifting into position over time** — its relative position paired with the year of formation — to make the whole process easier to grasp.
