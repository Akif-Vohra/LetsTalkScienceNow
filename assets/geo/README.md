# assets/geo — geospatial data for the `/map/` page

How the geometry that the interactive map draws was sourced and transformed.
The **raw source archives** (`*.zip`) are committed here for provenance but are
excluded from the built site (see `_config.yml`); only the derived `*.geojson`
files are published and fetched by [`assets/js/map.js`](../js/map.js).

## Files

| File | Published? | What it is |
|------|-----------|------------|
| `india.geojson` | yes | India outline — from DataMeet Community Maps (see below) |
| `rivers.geojson` | yes | 110 major rivers — derived from `Rivers.zip` |
| `Rivers.zip` | no (archived) | Raw Bhukosh "Rivers" shapefile set |
| `Reservoir.zip` | no (archived) | Raw Bhukosh "Reservoir" shapefile set — **not yet used on the map** |
| `features/*.geojson` | yes | Per-pin geology outlines (e.g. Deccan Traps) — see `scripts/fetch-shape.sh` |

The unzipped `Rivers/` and `Reservoir/` working folders are git-ignored; unzip
the archives locally if you need to re-run the transforms.

## Source: Bhukosh (Geological Survey of India)

`Rivers.zip` and `Reservoir.zip` were downloaded manually from the GSI **Bhukosh**
portal <https://bhukosh.gsi.gov.in>. Each is an Esri **shapefile** set
(`.shp/.shx/.dbf/.prj/.cpg/...`).

Both arrive in a **projected** CRS — Lambert Conformal Conic, units = **metres**
(`Central_Meridian 80, Standard_Parallels 12.47/35.17, Lat_of_Origin 24`,
false easting/northing 4,000,000). Leaflet needs **WGS84 lat/lon** (EPSG:4326),
so every transform below starts by reprojecting.

> ⚠️ **Licensing:** confirm the reuse terms shown on Bhukosh for each layer.
> Credit is carried in each geojson's `_source` member and shown on the map as
> a layer attribution ("Rivers © GSI (Bhukosh)").

## Transform — Rivers (the one currently shipped)

Run from this directory, with the archive unzipped to `Rivers/`:

```bash
npx mapshaper Rivers/Rivers.shp \
  -proj wgs84 \
  -filter-fields rivname,ba_name \
  -simplify 4% keep-shapes \
  -o rivers.geojson force precision=0.001
```

Specs / why each step:

| Step | Value | Reason |
|------|-------|--------|
| `-proj wgs84` | EPSG:4326 | LCC metres → lat/lon for Leaflet |
| `-filter-fields` | `rivname, ba_name` | drop 7 unused attribute columns (origin, codes, lengths) to shrink the file |
| `-simplify` | `4%` Douglas–Peucker, `keep-shapes` | retain 4% of vertices; `keep-shapes` guarantees no river line is dropped entirely |
| `precision` | `0.001°` (~110 m) | round coordinates — plenty at country scale, big size win |

Result: **110 line features, ~727 KB (~196 KB gzipped)**. The GSI/Bhukosh
credit is then prepended as a `_source` member (JSON has no comments; parsers
ignore the extra key).

## Transform — Reservoir (documented, not yet on the map)

The reservoir layer was evaluated but **left off** for now: 5,554 polygons,
median size ~48 ha (≈0.5 km²), so most are invisible dots at map scale and the
full set is ~800 KB gzipped even simplified. If added later, the intended recipe
filters to reservoirs large enough to read at map scale:

```bash
npx mapshaper Reservoir/Reservoir.shp \
  -proj wgs84 \
  -filter-fields wbname,setname,area_ha,state \
  -filter 'area_ha >= 100' \
  -simplify 6% keep-shapes \
  -o reservoirs.geojson force precision=0.001
```

(`area_ha >= 100` keeps ~1,727 of 5,554 — the significant reservoirs/dams like
Bhakra, Hirakud, Nagarjuna Sagar — and drops micro-ponds. Tune the threshold to
taste.)

## Other geometry (not from Bhukosh)

- **`india.geojson`** — DataMeet Community Maps `Country/india-composite.geojson`
  (CC-0), simplified `npx mapshaper -simplify 4% keep-shapes` (10 MB → 161 KB).
- **`features/*.geojson`** — GSI 1:2M geology units pulled via the Esri India
  Living Atlas Feature Service; see [`scripts/fetch-shape.sh`](../../scripts/fetch-shape.sh).
