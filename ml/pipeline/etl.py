"""ETL — Extract facilities from GeoPackage, transform to flat DataFrame."""
from __future__ import annotations
import sqlite3, struct
import pandas as pd

from .config import GPKG_PATH


def _decode_gpkg_geom(blob: bytes):
    """Pure-Python GeoPackage WKB decoder. Returns (lon, lat) centroid."""
    if blob is None or blob[:2] != b"GP":
        return (None, None)
    flags = blob[3]
    env_ind = (flags >> 1) & 0x07
    env_size = {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}.get(env_ind, 0)
    wkb = blob[8 + env_size:]
    endian = "<" if wkb[0] == 1 else ">"
    wkb_type = struct.unpack(endian + "I", wkb[1:5])[0] & 0xFF

    if wkb_type == 1:  # POINT
        return struct.unpack(endian + "dd", wkb[5:21])

    if wkb_type == 3:  # POLYGON
        n_rings = struct.unpack(endian + "I", wkb[5:9])[0]
        if n_rings == 0:
            return (None, None)
        npts = struct.unpack(endian + "I", wkb[9:13])[0]
        xs, ys = [], []
        for i in range(npts):
            off = 13 + i * 16
            x, y = struct.unpack(endian + "dd", wkb[off:off + 16])
            xs.append(x); ys.append(y)
        return (sum(xs) / len(xs), sum(ys) / len(ys))

    if wkb_type == 6:  # MULTIPOLYGON
        off = 9 + 5
        n_rings = struct.unpack(endian + "I", wkb[off:off + 4])[0]; off += 4
        npts = struct.unpack(endian + "I", wkb[off:off + 4])[0]; off += 4
        xs, ys = [], []
        for _ in range(npts):
            x, y = struct.unpack(endian + "dd", wkb[off:off + 16])
            xs.append(x); ys.append(y); off += 16
        return (sum(xs) / len(xs), sum(ys) / len(ys))

    return (None, None)


def load_facilities(gpkg_path=GPKG_PATH) -> pd.DataFrame:
    """Returns a DataFrame with one row per facility, lat/lon columns added."""
    con = sqlite3.connect(str(gpkg_path))
    df = pd.read_sql("SELECT * FROM health_facilities", con)
    con.close()
    xy = df["geom"].apply(_decode_gpkg_geom)
    df["lon"] = xy.apply(lambda t: t[0])
    df["lat"] = xy.apply(lambda t: t[1])
    df = df.drop(columns=["geom"]).dropna(subset=["lon", "lat"])
    df["amenity"] = df["amenity"].fillna("unknown")
    df["healthcare"] = df["healthcare"].fillna("unknown")
    return df.reset_index(drop=True)


if __name__ == "__main__":
    df = load_facilities()
    print(f"Loaded {len(df):,} facilities, {df.adm1_name.nunique()} regions, "
          f"{df.adm2_name.nunique()} districts")
