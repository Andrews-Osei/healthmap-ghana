"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Tooltip,
         useMap, LayersControl } from "react-leaflet";
import type { GeoJsonObject, Feature } from "geojson";
import L, { type LatLngBoundsExpression, type Layer, type PathOptions }
  from "leaflet";
import "leaflet/dist/leaflet.css";
import { useDashboard } from "@/store/dashboard";
import { cviColor } from "@/lib/utils";

const GHANA_CENTER: [number, number] = [7.95, -1.0];
const GHANA_BOUNDS: LatLngBoundsExpression =
  [[4.6, -3.4], [11.3, 1.3]];

/** Fly the map to selected district when it changes. */
function FlyToSelected() {
  const map = useMap();
  const sel = useDashboard(s => s.selected);
  useEffect(() => {
    if (sel) map.flyTo([sel.lat_centroid, sel.lon_centroid], 9,
                       { duration: 0.8 });
  }, [sel, map]);
  return null;
}

const facilityColor: Record<string, string> = {
  hospital:    "#22d3ee",
  clinic:      "#67e8f9",
  health_post: "#10b981",
  doctors:     "#7ce3c9",
  pharmacy:    "#f59e0b",
  dentist:     "#a78bfa",
  CHPs:        "#34d399",
};

export default function ChoroplethMap() {
  const { districts, facilities, filters, select } = useDashboard();
  const [boundaries, setBoundaries] = useState<GeoJsonObject | null>(null);
  const [boundariesError, setBoundariesError] = useState<string | null>(null);
  const layerRef = useRef<L.GeoJSON>(null);

  // Fetch district polygons (auto-fetched into /public)
  useEffect(() => {
    fetch("/ghana_adm2.geojson")
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(setBoundaries)
      .catch(e => setBoundariesError(String(e)));
  }, []);

  // Map district name -> District record for coloring
  const districtIndex = useMemo(() => {
    const idx = new Map<string, typeof districts[number]>();
    for (const d of districts) {
      idx.set(d.district.toLowerCase(), d);
      idx.set(d.district.replace(/[^a-z0-9]/gi, "").toLowerCase(), d);
    }
    return idx;
  }, [districts]);

  const lookupDistrict = (feature: Feature) => {
    const props = feature.properties ?? {};
    const candidates = [
      props.shapeName, props.NAME_2, props.name, props.adm2_name, props.ADM2_EN,
    ].filter(Boolean) as string[];
    for (const c of candidates) {
      const a = districtIndex.get(String(c).toLowerCase());
      if (a) return a;
      const b = districtIndex.get(String(c).replace(/[^a-z0-9]/gi, "").toLowerCase());
      if (b) return b;
    }
    return null;
  };

  const styleFn = (feature?: Feature): PathOptions => {
    const d = feature ? lookupDistrict(feature) : null;
    if (!d) return { color: "#1f2a44", weight: 0.6,
                     fillColor: "#0e1a2c", fillOpacity: 0.4 };
    const passes = (filters.region === "All" || d.region === filters.region)
                && (filters.riskTier === "All" || d.risk_tier === filters.riskTier)
                && (filters.urbanRural === "All"
                    || (filters.urbanRural === "Urban" ? d.is_urban : !d.is_urban));
    return {
      color: "#0c1525", weight: 0.6,
      fillColor: cviColor(d.CVI_0_100),
      fillOpacity: passes ? 0.78 : 0.18,
    };
  };

  const onEachFeature = (feature: Feature, layer: Layer) => {
    const d = lookupDistrict(feature);
    if (!d) return;
    layer.on({
      click:     () => select(d),
      mouseover: (e: L.LeafletMouseEvent) => {
        (e.target as L.Path).setStyle({ weight: 2, color: "#22d3ee" });
        e.target.bringToFront();
      },
      mouseout:  (e: L.LeafletMouseEvent) => {
        layerRef.current?.resetStyle(e.target);
      },
    });
    layer.bindTooltip(
      `<div style="min-width:160px">
         <div style="font-weight:600">${d.district}</div>
         <div style="opacity:.7;font-size:12px">${d.region}</div>
         <div style="margin-top:4px">CVI <b>${d.CVI_0_100.toFixed(1)}</b>
              · ${d.risk_tier}</div>
         <div style="opacity:.7;font-size:12px">${d.total_facilities} facilities
              · ${d.facilities_per_100k.toFixed(1)} / 100k</div>
       </div>`,
      { sticky: true, direction: "top" });
  };

  // Filtered facility layer
  const filteredFacilities = useMemo(() => {
    return facilities.filter(f =>
         (filters.region   === "All" || f.region   === filters.region)
      && (filters.amenity  === "All" || f.amenity  === filters.amenity));
  }, [facilities, filters]);

  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden
                    border border-white/10">
      <MapContainer center={GHANA_CENTER} zoom={7} maxBounds={GHANA_BOUNDS}
                    minZoom={6} className="h-full w-full"
                    scrollWheelZoom={true}>
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Carto dark">
            <TileLayer
              attribution='&copy; OpenStreetMap &copy; Carto'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"/>
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="OpenStreetMap">
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
          </LayersControl.BaseLayer>

          <LayersControl.Overlay checked name="District vulnerability">
            {boundaries && (
              <GeoJSON ref={layerRef} data={boundaries}
                       style={styleFn as L.StyleFunction}
                       onEachFeature={onEachFeature}/>
            )}
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="Facility markers">
            <>
              {filteredFacilities.map(f => (
                <CircleMarker
                  key={f.id} center={[f.lat, f.lon]} radius={3}
                  pathOptions={{
                    color: "#04101e", weight: 0.6,
                    fillColor: facilityColor[f.amenity] ?? "#94a3b8",
                    fillOpacity: 0.9,
                  }}>
                  <Tooltip direction="top" opacity={0.95}>
                    <div className="text-xs">
                      <div className="font-semibold">
                        {f.name ?? "Unnamed facility"}
                      </div>
                      <div className="opacity-70">
                        {f.amenity} · {f.district} · {f.region}
                      </div>
                    </div>
                  </Tooltip>
                </CircleMarker>
              ))}
            </>
          </LayersControl.Overlay>
        </LayersControl>

        <FlyToSelected/>
      </MapContainer>

      {!boundaries && !boundariesError && (
        <div className="absolute inset-0 grid place-items-center
                        bg-ink-950/70 backdrop-blur-sm">
          <div className="glass p-5 text-center">
            <div className="skeleton w-40 h-3 rounded mb-2"/>
            <div className="text-sm text-slate-400">
              Loading Ghana district boundaries…
            </div>
          </div>
        </div>
      )}
      {boundariesError && (
        <div className="absolute top-3 left-3 right-3 glass p-3 text-xs
                        text-amber-300">
          Couldn't load <code>/ghana_adm2.geojson</code>. Run{" "}
          <code>python data/fetch_district_boundaries.py</code> from the repo root.
        </div>
      )}

      <Legend/>
    </div>
  );
}

function Legend() {
  return (
    <div className="absolute bottom-3 left-3 glass p-3 text-xs">
      <div className="font-semibold mb-2">Vulnerability Index</div>
      <div className="flex items-center gap-1">
        {[10, 30, 50, 70, 90].map(v => (
          <div key={v} className="w-7 h-3" style={{ background: cviColor(v) }}/>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 mt-1
                      w-[150px]">
        <span>0</span><span>50</span><span>100</span>
      </div>
    </div>
  );
}
