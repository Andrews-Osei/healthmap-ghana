"""Download Ghana ADM2 district boundaries from geoBoundaries (CC-BY).

The Ghana AI Innovation Challenge platform uses geoBoundaries CGAZ Ghana
admin-level-2 polygons for the choropleth layer.  Run this once:

    python fetch_district_boundaries.py

Result: ./geo/ghana_adm2.geojson (also copied to frontend/public/ for
direct loading by the map component).

Source: https://www.geoboundaries.org/data/geoBoundariesCGAZ-3_0_0/GHA/ADM2/
License: CC-BY 4.0
"""
from __future__ import annotations
import json
import urllib.request
from pathlib import Path
import shutil

URL = ("https://www.geoboundaries.org/api/current/gbOpen/GHA/ADM2/")
HERE = Path(__file__).resolve().parent
GEO_DIR = HERE / "geo"
GEO_DIR.mkdir(parents=True, exist_ok=True)
FRONTEND_PUB = HERE.parent / "frontend" / "public"
FRONTEND_PUB.mkdir(parents=True, exist_ok=True)
OUT = GEO_DIR / "ghana_adm2.geojson"


def main():
    print(f"Fetching geoBoundaries metadata: {URL}")
    with urllib.request.urlopen(URL, timeout=30) as r:
        meta = json.loads(r.read())
    download_url = meta.get("gjDownloadURL") or meta.get("staticDownloadLink")
    if not download_url:
        raise RuntimeError(f"No download URL in geoBoundaries response: {meta}")
    print(f"Downloading: {download_url}")
    with urllib.request.urlopen(download_url, timeout=120) as r:
        data = r.read()
    OUT.write_bytes(data)
    # mirror into the Next.js public folder so it ships as a static asset
    shutil.copy(OUT, FRONTEND_PUB / "ghana_adm2.geojson")
    gj = json.loads(data)
    print(f"  features: {len(gj.get('features', []))}")
    print(f"  saved: {OUT}")
    print(f"  also copied to: {FRONTEND_PUB/'ghana_adm2.geojson'}")


if __name__ == "__main__":
    main()
