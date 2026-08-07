---
layout: story
reel: how-geodata-works
permalink: /stories/how-geodata-works/
title: "How software actually handles geodata"
---

Dealing with location information is a big part of computer engineering — yet in twelve years as a software engineer, I'd never had to work with large amounts of geospatial data. Building the [interactive geological map of India]({{ '/geological-map-of-india/' | relative_url }}) finally forced me to learn the fundamentals for the first time, so I'm writing them down here in case you'd like to read them too.

It turns out **all geodata is one of two things.**

## Vector — shapes stored as coordinates

A point is one coordinate `[lng, lat]`; a line is a list of them; a polygon is a closed loop. A river is a line, a lake is a polygon, a city is a point. Vectors are exact, scale infinitely without blurring, and carry **attributes** — a polygon can say `{name: "Thar", area: 200000}`. This is what pins and outlines are.

Concretely, a vector feature is just *geometry* plus *properties*. Here's the Thar Desert as a polygon, in GeoJSON:

```json
{
  "type": "Feature",
  "properties": { "name": "Thar Desert", "area_km2": 200000 },
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [[70.1, 27.9], [72.4, 27.2], [71.8, 25.6], [69.9, 26.3], [70.1, 27.9]]
    ]
  }
}
```

That's the whole trick. A **point** is a single `[lng, lat]`; a **line** (a river) is a list of them; a **polygon** (a lake, a desert) is a list that closes back to its first coordinate. The geometry is literally arrays of longitude/latitude pairs, and the map library draws them.

You'll meet vectors as these files:

| Format | What it is | Notes |
|---|---|---|
| **GeoJSON** | Plain JSON: geometry + properties, always WGS84 lat/lng | The web-native format. Human-readable, one file, works directly in Leaflet. What everything on my map ends up as. |
| **Shapefile** (`.shp`) | The old GIS workhorse, from Esri | *Not one file* — a bundle (`.shp` geometry + `.shx` index + `.dbf` attributes + `.prj` CRS). Miss one and it breaks. Binary. Convert to GeoJSON with `mapshaper`. |
| **KML / KMZ** | Google Earth's format (XML) | Draw-and-export friendly. KMZ = a zipped KML (+ images). Carries styling. Convert to GeoJSON. |
| **GPX** | GPS tracks / waypoints | What a fitness watch or handheld GPS spits out. |
| **GeoPackage** (`.gpkg`) / **TopoJSON** | Modern one-file DB / topology-aware JSON | GeoPackage is a whole SQLite database of layers. TopoJSON stores shared borders once — smaller, and no slivers between neighbours. |

**Why so many for the same idea?** History and trade-offs. Shapefile is legacy-but-everywhere, KML is Google/consumer, GeoJSON won the web. They all encode points, lines, and polygons — converting between them is lossless-ish for the geometry; the differences are styling, CRS handling, and how many files it takes.

## Raster — a grid pinned to the Earth

A raster is a grid of pixels, where the grid is pinned to the ground so each pixel covers a real patch of Earth. A satellite image, an elevation map, a scanned geological map. Rasters are great for continuous things (colour, height, temperature) and terrible for "what's the exact boundary" — you have to trace it into vector first (exactly what georeference.ai + the trace script do in the map project).

Think of it as a spreadsheet laid over the land, where each cell holds a value — here, elevation in metres:

```
elevation.tif
 ┌─────────────────────┐
 │ 210  214  220  231  │
 │ 208  212  219  228  │
 │ 205  209  215  224  │
 └─────────────────────┘
 header: top-left cell = [72.000, 25.000], cell size = 0.001°
```

The file does **not** store a coordinate for every cell. It stores one anchor (the top-left corner) plus a cell size, and every other cell's position is computed from that. Ask a raster for the boundary of a forest and it can't answer — it only knows "this cell is green." To get an outline, you trace it into vector first.

You'll meet rasters as these files:

| Format | What it is |
|---|---|
| **GeoTIFF** | A TIFF image + embedded georeferencing (an anchor coordinate + pixel size + CRS). This is what "each pixel knows its lat/lng" really means — the header stores a *transform*, not a tag per pixel. Satellite imagery, elevation (DEM), scanned maps. |
| **Map tiles** (XYZ / WMS) | Not a file — a *service*. The base map is millions of 256×256 PNG tiles named by zoom/x/y; the map fetches only the ones on screen. The satellite layer on my map is exactly this. |
| **NetCDF / HDF** | Scientific multi-dimensional rasters (climate, ocean — a value over lat × lng × time). You meet these in earth-science datasets. |

## The thing that makes coordinates mean a place: CRS

A pair of numbers `[77.2, 28.6]` is meaningless until you know the **Coordinate Reference System**. The one you'll see 95% of the time is **WGS84** (aka EPSG:4326) — plain latitude/longitude on the globe, what GPS uses. GeoJSON is *always* this.

The wrinkle: the Earth is round, screens are flat. A **projection** flattens it, and every projection lies somehow — it distorts area, or shape, or distance. Web maps (Leaflet, Google) use **Web Mercator** (EPSG:3857), which is why Greenland looks enormous. You mostly don't touch this — but when a shape lands in the wrong spot, a mismatched CRS is usually why.

## The one idea to keep

**Vector is "here are the exact edges, as coordinates." Raster is "here's a picture pinned to the globe."** Every file format above is just one of those two — differing in age, who invented it, and how much extra (styling, CRS, multiple layers) it bundles along. Once that clicked, the whole ecosystem stopped feeling like alphabet soup.
