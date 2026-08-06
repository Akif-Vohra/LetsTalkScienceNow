#!/usr/bin/env bash
# Fetch one geology unit's outline from the Geological Survey of India (GSI) 1:2M map
# — served as a public Feature Service by Esri India Living Atlas, NDSAP open data —
# then dissolve the many polygons into one, simplify, and write it to
# assets/geo/features/<id>.geojson (with a GSI credit baked in as a _source member).
#
# Usage:  scripts/fetch-shape.sh <field> <value> <id> [simplify%]
#   field      one of: supergroup | group_ | index_   (see the layer's attributes)
#   value      matched case-insensitively as LIKE '%value%'
#   id         output filename (assets/geo/features/<id>.geojson) — use the map.yml pin's story id
#   simplify%  mapshaper retain %, default 2 (lower = smaller file, coarser outline)
#
# Example:  scripts/fetch-shape.sh supergroup "DECCAN TRAP" deccan-traps 2
set -euo pipefail

FIELD="$1"; VALUE=$(printf '%s' "$2" | tr '[:lower:]' '[:upper:]'); ID="$3"; PCT="${4:-2}"
BASE="https://livingatlas.esri.in/server1/rest/services/Geology/Geology/MapServer/0/query"
SRC="Geology outline sourced from the Geological Survey of India (GSI) 1:2M geology map, via Esri India Living Atlas (livingatlas.esri.in), under India's NDSAP open-data policy."
OUT="assets/geo/features/${ID}.geojson"
mkdir -p assets/geo/features

enc=$(printf '%s' "$VALUE" | sed 's/ /+/g')
raw="$(mktemp).geojson"
curl -s --max-time 90 "$BASE?where=UPPER($FIELD)+LIKE+'%25${enc}%25'&outFields=$FIELD&returnGeometry=true&outSR=4326&f=geojson" -o "$raw"

n=$(python3 -c "import json,sys;print(len(json.load(open('$raw')).get('features',[])))")
[ "$n" -gt 0 ] || { echo "No features matched $FIELD ~ '$VALUE' — check the field/value."; exit 1; }

npx --yes mapshaper "$raw" -dissolve2 -simplify "${PCT}%" keep-shapes -o "$OUT" force >/dev/null 2>&1
# Prepend the GSI credit as a foreign member (JSON has no comments; parsers ignore extra keys).
python3 - "$OUT" "$SRC" <<'PY'
import json, sys
path, src = sys.argv[1], sys.argv[2]
d = json.load(open(path))
d = {"type": d["type"], "_source": src, **{k: v for k, v in d.items() if k != "type"}}
json.dump(d, open(path, "w"))
PY
echo "Wrote $OUT — $(wc -c < "$OUT" | tr -d ' ') bytes, dissolved from $n polygons at ${PCT}% detail."
