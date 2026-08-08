# assets/geo — geospatial data for the `/geological-map-of-india/` page

This directory holds the source files and the derived GeoJSON used to draw the
outlines of geological features on the [`/geological-map-of-india/`](../../map.html)
page. Only the `*.geojson` files are published; the raw sources (`*.zip`, `*.tiff`,
`*.kml`, `*.png`) are committed for provenance but excluded from the built site
(see `_config.yml`). Each published geojson also carries its origin + credit in a
`_source` member.

> ⚠️ Reuse terms differ per source — check the **Credit** field of each row before
> any non-personal reuse. Raster tracing uses [`scripts/trace-geotiff.py`](../../scripts/trace-geotiff.py).

| Geo outline | Geo data — source · transformation · credit |
|-------------|---------------------------------------------|
| **India border**<br>`india.geojson` | **Source:** DataMeet Community Maps `Country/india-composite.geojson`.<br>**Transformation:** simplified with `npx mapshaper -simplify 4% keep-shapes` (10 MB → 161 KB).<br>**Credit:** © DataMeet Community Maps, **CC0**. |
| **Soil types**<br>`soil.geojson` | **Source:** FAO–UNESCO **Soil Map of the World** (India extract) from [`yashveeeeeeer/india-geodata`](https://github.com/yashveeeeeeer/india-geodata/tree/main/data/environment/soil).<br>**Transformation:** `npx mapshaper -filter-fields DOMSOI -simplify 12% keep-shapes` (2.5 MB → 245 KB). The `DOMSOI` code's first letter (FAO major soil group) is bucketed into named Indian soil types in `map.js`; drawn as a toggleable overlay with a legend.<br>**Credit:** **FAO–UNESCO** Soil Map of the World. |
| **Rivers**<br>`rivers.geojson` | **Source:** `Rivers.zip` — a **Bhukosh** (GSI) shapefile in a projected CRS (Lambert Conformal Conic, metres).<br>**Transformation:** `npx mapshaper Rivers/Rivers.shp -proj wgs84 -filter-fields rivname,ba_name -simplify 4% keep-shapes -o rivers.geojson force precision=0.001` → 110 lines, ~196 KB gzipped.<br>**Credit:** © **GSI** (Bhukosh) — visualization / regional-level use. |
| **Individual rivers**<br>`features/*-river.geojson` | **Source:** peninsular rivers (Godavari, Krishna, Kaveri, Narmada, Tapi) filtered from `rivers.geojson` by `rivname`. **Ganga & Brahmaputra** cross into Bangladesh, so they come from **Natural Earth** 10m rivers instead (the GSI layer is India-only and would clip them at the border).<br>**Transformation:** filtered by name into per-river files; drawn as a highlighted course when the pin is clicked.<br>**Credit:** © **GSI** (Bhukosh) for peninsular rivers; **Natural Earth** (public domain) for Ganga & Brahmaputra. |
| **Deccan Traps**<br>`features/deccan-traps.geojson` | **Source:** GSI geology data of India on the Esri India Living Atlas Feature Service — <https://livingatlas.esri.in/server1/rest/services/Geology/Geology/MapServer/0>.<br>**Transformation:** pulled + dissolved with [`scripts/fetch-shape.sh`](../../scripts/fetch-shape.sh).<br>**Credit:** © **GSI**, via Esri India Living Atlas. |
| **Aravalli Range**<br>`features/aravalli-range.geojson` | **Source:** same GSI-on-Esri service (Aravalli + Delhi supergroups).<br>**Transformation:** pulled + both supergroups dissolved into one outline with `fetch-shape.sh`.<br>**Credit:** © **GSI**, via Esri India Living Atlas. |
| **Himalayan Foreland Basin**<br>`features/himalayan-foreland-basin.geojson` | **Source:** georeferenced **Soar.earth** raster `Himalayan_foreland_basin_powered_by_soar.tiff`.<br>**Transformation:** colour-traced with `trace-geotiff.py`. Approximate — georeferencing slightly warped.<br>**Credit:** Soar.earth imagery. |
| **Lonar Crater**<br>`features/lonar-crater.geojson` | **Source:** `Lonar.kml`.<br>**Transformation:** crater-lake rim drawn **manually in Google Earth by Akif Vohra** (repo author), converted to GeoJSON.<br>**Credit:** outline by Akif Vohra. |
| **Thar Desert**<br>`features/thar-desert.geojson` | **Source:** WWF **Thar ecoregion** (IM1304) map (Wikipedia), as the georeferenced raster `Ecoregion_IM1304_powered_by_soar.tiff`.<br>**Transformation:** **manually georeferenced on georeference.ai by Akif Vohra** (repo author), then colour-traced with `trace-geotiff.py`. Approximate.<br>**Credit:** WWF ecoregion; georeferencing by Akif Vohra. |
| **Gondwana region**<br>`features/gondwana.geojson` | **Source:** *Gondwana Kingdom* image, **Wikimedia Commons** — <https://commons.wikimedia.org/wiki/File:Gondwana_Kingdom_edited.jpg>.<br>**Transformation:** **manually traced/georeferenced on georeference.ai by Akif Vohra** (repo author), then colour-vectorised with `trace-geotiff.py`. Approximate.<br>**Credit:** © **BharatWale** (Wikimedia Commons), **CC BY-SA 4.0** — this derived outline is likewise **CC BY-SA 4.0**. (Namesake of the geological term.) |
| **Western Ghats**<br>`features/western-ghats.geojson` | **Source:** *Western Ghats Hotspot* figure in **IUCN** — Molur, Smith, Daniel & Darwall (2010), *The Status and Distribution of Freshwater Biodiversity in the Western Ghats, India* (IUCN & Zoo Outreach Organization), via ResearchGate <https://www.researchgate.net/figure/Map-showing-the-Western-Ghats-Hotspot-and-the-wider-catchment-areas-that-delineate-the_fig3_255716543>.<br>**Transformation:** **manually traced/georeferenced on georeference.ai by Akif Vohra** (repo author), then colour-vectorised with `trace-geotiff.py`. Approximate.<br>**Credit:** © **IUCN** / Molur et al. (2010) — confirm IUCN reuse terms. |

**Archived, not on the map yet:** `Reservoir.zip` (Bhukosh reservoirs — intended
recipe filters `area_ha >= 100` before `-simplify 6% keep-shapes`) and `gondwana.png`
(an earlier raster of the Gond region). Unzip archives locally to re-run a shapefile
transform; the extracted `Rivers/` and `Reservoir/` folders are git-ignored.
