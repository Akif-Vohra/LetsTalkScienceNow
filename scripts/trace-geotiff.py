#!/usr/bin/env python3
"""
trace-geotiff.py — turn a colour-highlighted GeoTIFF into a GeoJSON polygon.

A georeferenced raster (e.g. exported from georeference.ai) usually has one region
painted a distinct colour over a base map. This reads the tiff's georeferencing,
colour-keys that region, traces its outline, simplifies it, and writes a GeoJSON
polygon in WGS84 lon/lat — the same pipeline we use for every map feature.

Usage
-----
  python3 scripts/trace-geotiff.py INPUT.tiff OUTPUT.geojson [options]

Colour selection (default = auto-detect a warm/magenta fill):
  --sample X,Y     sample the target colour at pixel (X,Y) — most reliable
  --color R,G,B    use this exact target colour
  --tol N          match tolerance for --sample/--color, RGB distance (default 70)

Shape controls:
  --close N        bridge label text / thin gaps by closing N px (default 3)
  --simplify E     Douglas-Peucker epsilon in px; higher = fewer points (default 1.5)
  --downsample F   process at 1/F resolution for speed on huge rasters (default 1)

Metadata / output:
  --name TEXT      GeoJSON feature "name" property
  --source TEXT    "_source" credit member
  --preview PATH   also write an overlay PNG (cyan outline on the source) to eyeball

Requires: pillow, numpy.  (No GDAL needed — geo tags are read directly.)
"""
import sys, os, json, math, struct, argparse
from collections import deque
import numpy as np
from PIL import Image
Image.MAX_IMAGE_PIXELS = None


# ---- read GeoTIFF georeferencing (tiepoint + pixel scale, or affine) ----------
def read_geotransform(path):
    f = open(path, 'rb'); d = f.read(8)
    en = '<' if d[:2] == b'II' else '>'
    off = struct.unpack(en + 'I', d[4:8])[0]; f.seek(off)
    n = struct.unpack(en + 'H', f.read(2))[0]
    TY = {1:1,2:1,3:2,4:4,5:8,6:1,7:1,8:2,9:4,10:8,11:4,12:8}
    tags = {}
    for _ in range(n):
        e = f.read(12); tag, typ, cnt = struct.unpack(en + 'HHI', e[:8]); tags[tag] = (typ, cnt, e[8:12])
    def vals(tag):
        typ, cnt, vb = tags[tag]; sz = TY.get(typ, 1) * cnt
        if sz <= 4: raw = vb[:sz]
        else:
            o = struct.unpack(en + 'I', vb)[0]; cur = f.tell(); f.seek(o); raw = f.read(sz); f.seek(cur)
        return list(struct.unpack(en + str(cnt) + 'd', raw)) if typ == 12 else raw
    if 33922 in tags and 33550 in tags:              # tiepoint + pixel scale (the common case)
        tp = vals(33922); sc = vals(33550)
        i, j, _, x, y, _ = tp[:6]
        # returns fn(col,row) -> (lon,lat)
        return lambda c, r: (x + (c - i) * sc[0], y - (r - j) * sc[1])
    if 34264 in tags:                                # full 4x4 model transform (affine)
        m = vals(34264)
        return lambda c, r: (m[0]*c + m[1]*r + m[3], m[4]*c + m[5]*r + m[7])
    raise SystemExit("No georeferencing found (need tiepoint+scale or ModelTransformation).")


# ---- colour mask --------------------------------------------------------------
def auto_mask(a):
    """Best-effort: keep saturated warm/red/orange/yellow or magenta/pink pixels
    (typical highlight fills), excluding green land and blue water."""
    r, g, b = a[..., 0] / 255., a[..., 1] / 255., a[..., 2] / 255.
    mx = np.max(a, axis=2) / 255.; mn = np.min(a, axis=2) / 255.
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    # hue in degrees
    rc, gc, bc = (mx - r), (mx - g), (mx - b)
    h = np.zeros_like(mx)
    d = (mx - mn); d = np.where(d == 0, 1e-6, d)
    h = np.where(mx == r, (bc - gc) / d, h)
    h = np.where(mx == g, 2.0 + (rc - bc) / d, h)
    h = np.where(mx == b, 4.0 + (gc - rc) / d, h)
    h = (h / 6.0) % 1.0 * 360
    warm = (h <= 60) | (h >= 285)                    # reds/oranges/yellows + magenta/pink
    return warm & (sat > 0.33) & (mx > 0.25) & (mx < 0.99)

def color_mask(a, target, tol):
    diff = a[..., :3].astype(int) - np.array(target, dtype=int)
    return np.sqrt((diff * diff).sum(axis=2)) <= tol


# ---- morphology / component / holes / trace / simplify ------------------------
def dilate(m, it):
    for _ in range(it):
        d = m.copy()
        d[1:, :] |= m[:-1, :]; d[:-1, :] |= m[1:, :]; d[:, 1:] |= m[:, :-1]; d[:, :-1] |= m[:, 1:]
        d[1:, 1:] |= m[:-1, :-1]; d[:-1, :-1] |= m[1:, 1:]; d[1:, :-1] |= m[:-1, 1:]; d[:-1, 1:] |= m[1:, :-1]
        m = d
    return m
def close(m, k): return ~dilate(~dilate(m, k), k) if k else m   # dilate then erode

def largest_component(m):
    seen = np.zeros_like(m); best = []
    ys, xs = np.where(m)
    for sy, sx in zip(ys, xs):
        if seen[sy, sx]: continue
        q = deque([(sy, sx)]); seen[sy, sx] = 1; comp = []
        while q:
            y, x = q.popleft(); comp.append((y, x))
            for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
                ny, nx = y+dy, x+dx
                if 0 <= ny < m.shape[0] and 0 <= nx < m.shape[1] and m[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = 1; q.append((ny, nx))
        if len(comp) > len(best): best = comp
    out = np.zeros_like(m)
    for y, x in best: out[y, x] = 1
    return out, len(best)

def fill_holes(m):
    H, W = m.shape; bg = np.zeros_like(m); q = deque()
    for x in range(W):
        for y in (0, H-1):
            if not m[y, x] and not bg[y, x]: bg[y, x] = 1; q.append((y, x))
    for y in range(H):
        for x in (0, W-1):
            if not m[y, x] and not bg[y, x]: bg[y, x] = 1; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
            ny, nx = y+dy, x+dx
            if 0 <= ny < H and 0 <= nx < W and not m[ny, nx] and not bg[ny, nx]: bg[ny, nx] = 1; q.append((ny, nx))
    return (~bg.astype(bool)) | m.astype(bool)

def trace(m):
    nb = [(-1,0),(-1,1),(0,1),(1,1),(1,0),(1,-1),(0,-1),(-1,-1)]
    H, W = m.shape
    ys, xs = np.where(m); start = (ys.min(), xs[ys == ys.min()].min())
    cont = [start]; cur = start; prev = 7; n = 0
    while True:
        found = False
        for k in range(8):
            di = (prev + 1 + k) % 8; dy, dx = nb[di]; ny, nx = cur[0]+dy, cur[1]+dx
            if 0 <= ny < H and 0 <= nx < W and m[ny, nx]:
                cur = (ny, nx); prev = (di + 4) % 8; found = True; break
        if not found: break
        if cur == start and len(cont) > 2: break
        cont.append(cur); n += 1
        if n > 400000: break
    return cont

def dp(pts, eps):
    if len(pts) < 3: return pts
    def dist(p, a, b):
        (x, y), (x1, y1), (x2, y2) = p, a, b; dx, dy = x2-x1, y2-y1
        if dx == dy == 0: return math.hypot(x-x1, y-y1)
        t = max(0, min(1, ((x-x1)*dx + (y-y1)*dy) / (dx*dx + dy*dy)))
        return math.hypot(x-(x1+t*dx), y-(y1+t*dy))
    dmax, idx = 0, 0
    for i in range(1, len(pts)-1):
        dd = dist(pts[i], pts[0], pts[-1])
        if dd > dmax: dmax, idx = dd, i
    if dmax > eps: return dp(pts[:idx+1], eps)[:-1] + dp(pts[idx:], eps)
    return [pts[0], pts[-1]]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('input'); ap.add_argument('output')
    ap.add_argument('--sample'); ap.add_argument('--color'); ap.add_argument('--tol', type=float, default=70)
    ap.add_argument('--close', type=int, default=3); ap.add_argument('--simplify', type=float, default=1.5)
    ap.add_argument('--downsample', type=int, default=1)
    ap.add_argument('--name', default=''); ap.add_argument('--source', default='')
    ap.add_argument('--preview')
    o = ap.parse_args()

    im = Image.open(o.input).convert('RGB')
    W0, H0 = im.size
    f = max(1, o.downsample)
    a = np.asarray(im.resize((W0 // f, H0 // f)) if f > 1 else im).astype(int)

    if o.color:
        target = [int(v) for v in o.color.split(',')]; mask = color_mask(a, target, o.tol)
    elif o.sample:
        sx, sy = [int(v) // f for v in o.sample.split(',')]; target = a[sy, sx][:3].tolist()
        mask = color_mask(a, target, o.tol); print("sampled colour:", target)
    else:
        mask = auto_mask(a)
    if mask.sum() == 0: raise SystemExit("Empty mask — pass --sample X,Y or --color R,G,B.")

    m = close(mask, o.close)
    m, npx = largest_component(m)
    m = fill_holes(m)
    cont = trace(m.astype(bool))
    simp = dp(cont, o.simplify)

    xform = read_geotransform(o.input)
    ring = []
    for (y, x) in simp:
        lon, lat = xform((x + 0.5) * f, (y + 0.5) * f)
        ring.append([round(lon, 4), round(lat, 4)])
    if ring[0] != ring[-1]: ring.append(ring[0])

    gj = {"type": "FeatureCollection",
          "features": [{"type": "Feature",
                        "properties": {"name": o.name} if o.name else {},
                        "geometry": {"type": "Polygon", "coordinates": [ring]}}]}
    if o.source: gj["_source"] = o.source
    open(o.output, 'w').write(json.dumps(gj))

    lons = [c[0] for c in ring]; lats = [c[1] for c in ring]
    print(f"region {npx}px -> {len(ring)} verts, {os.path.getsize(o.output)} bytes")
    print(f"lon {min(lons)}..{max(lons)}  lat {min(lats)}..{max(lats)}")

    if o.preview:
        from PIL import ImageDraw
        pv = im.copy(); dr = ImageDraw.Draw(pv)
        dr.line([(c[0], c[1]) for c in [xform_inv(xform, W0, H0, ln, lt) for ln, lt in ring]],
                fill=(0, 255, 255), width=max(2, W0 // 500))
        pv.save(o.preview); print("preview:", o.preview)


def xform_inv(xform, W, H, lon, lat):
    """Invert lon/lat back to pixel for the preview (assumes tiepoint+scale)."""
    # sample two points to recover linear coeffs
    x0, y0 = xform(0, 0); x1, y1 = xform(1, 1)
    sx = x1 - x0; sy = y1 - y0
    col = (lon - x0) / sx if sx else 0
    row = (lat - y0) / sy if sy else 0
    return (col, row)


if __name__ == '__main__':
    main()
