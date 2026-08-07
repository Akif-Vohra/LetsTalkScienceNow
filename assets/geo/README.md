# assets/geo — geospatial data for the `/map/` page

This directory holds the source files and the derived GeoJSON used to draw the
outlines of geological features on the [`/map/`](../../map.html) page. Only the
`*.geojson` files are published; the raw sources (`*.zip`, `*.tiff`, `*.kml`,
`*.png`) are committed for provenance but excluded from the built site (see
`_config.yml`). Each published geojson carries its origin in a `_source` member.

> ⚠️ **Licensing:** GSI / Bhukosh data is for visualization and regional-level
> analysis — confirm the reuse terms per layer. Credit is shown on the map as a
> layer attribution and stored in each file's `_source`.

One row per outline drawn on the map — where the data came from, how it was
transformed, and the file that ships.

| Geo outline | Geo data — source · transformation · notes |
|-------------|--------------------------------------------|
| **India border** | `india.geojson`. **DataMeet** Community Maps `Country/india-composite.geojson` (CC-0), simplified with `npx mapshaper -simplify 4% keep-shapes` (10 MB → 161 KB). The black country outline the map fits to. |
| **Rivers** | `rivers.geojson`, from `Rivers.zip` — a **Bhukosh** (GSI) shapefile in a projected CRS (Lambert Conformal Conic, metres). `npx mapshaper Rivers/Rivers.shp -proj wgs84 -filter-fields rivname,ba_name -simplify 4% keep-shapes -o rivers.geojson force precision=0.001` → 110 lines, ~727 KB (~196 KB gzipped). Toggled from the layer control. |
| **Deccan Traps** | `features/deccan-traps.geojson`. Adapted from **GSI** (Geological Survey of India) geology data of India, found on **Esri** — the Living Atlas Feature Service, <https://livingatlas.esri.in/server1/rest/services/Geology/Geology/MapServer/0>. Pulled and dissolved with [`scripts/fetch-shape.sh`](../../scripts/fetch-shape.sh). |
| **Aravalli Range** | `features/aravalli-range.geojson`. Same **GSI**-data-on-**Esri** source; the Aravalli + Delhi supergroups dissolved together into one outline. |
| **Himalayan Foreland Basin** | `features/himalayan-foreland-basin.geojson`. Traced (roughly) from a georeferenced **Soar.earth** raster, `Himalayan_foreland_basin_powered_by_soar.tiff`. Approximate — the raster's georeferencing is slightly warped. |
| **Lonar Crater** | `features/lonar-crater.geojson`. Mapped **manually** — the crater-lake rim traced in Google Earth (`Lonar.kml`) and converted to GeoJSON. |
| **Thar Desert** | `features/thar-desert.geojson`. The WWF **Thar ecoregion** (IM1304), traced **manually via georeference.ai** referencing a Wikipedia ecoregion map, from the georeferenced raster `Ecoregion_IM1304_powered_by_soar.tiff`. Approximate. |

**Archived, not on the map yet:** `Reservoir.zip` (Bhukosh reservoirs — the
intended recipe filters `area_ha >= 100` before `-simplify 6% keep-shapes`) and
`gondwana.png` (raster of the historical Gondwana region). To re-run a shapefile
transform, unzip the archive locally — the extracted `Rivers/` and `Reservoir/`
folders are git-ignored.
