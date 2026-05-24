"use client";
import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Compass, Navigation } from "lucide-react";

type Facility = {
  id: string; name: string; amenity: string;
  district?: string | null; region?: string | null;
  lat: number; lon: number; distance_km?: number | null;
  navigation_url?: string;
};

const GHANA_CENTER: [number, number] = [7.95, -1.0];

const TYPE_LABEL: Record<string, string> = {
  hospital: "Hospital", clinic: "Clinic", health_post: "Health post",
  doctors: "Doctor", pharmacy: "Pharmacy", dentist: "Dental clinic",
  CHPs: "CHPS compound",
};
const typeLabel = (a?: string) =>
  (a && TYPE_LABEL[a]) || (a ? a[0].toUpperCase() + a.slice(1) : "Facility");

const youIcon = L.divIcon({
  className: "pm-wrap",
  html: '<div class="pm-you"><span class="pm-ring"></span>' +
        '<span class="pm-ring pm-ring2"></span><span class="pm-core"></span></div>',
  iconSize: [24, 24], iconAnchor: [12, 12],
});
const nearestIcon = L.divIcon({
  className: "pm-wrap",
  html: '<div class="pm-hosp pm-hosp-near">✚</div>',
  iconSize: [30, 30], iconAnchor: [15, 30],
});
const facilityIcon = L.divIcon({
  className: "pm-wrap",
  html: '<div class="pm-hosp">✚</div>',
  iconSize: [24, 24], iconAnchor: [12, 24],
});

function directionsUrl(uLat?: number, uLon?: number, f?: Facility): string {
  if (!f) return "#";
  if (uLat != null && uLon != null) {
    return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${uLat},${uLon};${f.lat},${f.lon}`;
  }
  return f.navigation_url ??
    `https://www.openstreetmap.org/?mlat=${f.lat}&mlon=${f.lon}#map=15/${f.lat}/${f.lon}`;
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) { map.setView(points[0], 14); return; }
    map.fitBounds(L.latLngBounds(points), { padding: [50, 50], maxZoom: 15 });
  }, [points, map]);
  return null;
}

export default function PatientMap({
  userLat, userLon, facilities, locationLabel,
}: {
  userLat?: number; userLon?: number; facilities: Facility[];
  locationLabel?: string;
}) {
  const nearest = facilities?.[0];
  const hasUser = userLat != null && userLon != null;

  const points = useMemo(() => {
    const p: [number, number][] = [];
    if (hasUser) p.push([userLat as number, userLon as number]);
    (facilities ?? []).slice(0, 3).forEach(f => p.push([f.lat, f.lon]));
    return p;
  }, [hasUser, userLat, userLon, facilities]);

  if (!facilities?.length) return null;

  return (
    <div className="relative h-[380px] rounded-xl overflow-hidden border border-white/10">
      <style>{`
        .pm-wrap { background: transparent !important; border: none !important; }
        @keyframes pmPulse { 0%{transform:scale(.5);opacity:.8} 70%{transform:scale(2.6);opacity:0} 100%{opacity:0} }
        .pm-you { position:relative; width:24px; height:24px; }
        .pm-you .pm-ring { position:absolute; inset:0; border-radius:9999px;
          background:rgba(56,189,248,.5); animation:pmPulse 1.6s ease-out infinite; }
        .pm-you .pm-ring2 { animation-delay:.8s; }
        .pm-you .pm-core { position:absolute; left:50%; top:50%; width:13px; height:13px;
          margin:-6.5px 0 0 -6.5px; border-radius:9999px; background:#38bdf8;
          border:2px solid #04101e; box-shadow:0 0 10px 2px rgba(56,189,248,.9); }
        .pm-hosp { display:grid; place-items:center; width:24px; height:24px;
          border-radius:9999px 9999px 9999px 2px; transform:rotate(45deg);
          background:#10b981; color:#04101e; font-weight:900; font-size:13px;
          border:2px solid #04101e; box-shadow:0 2px 6px rgba(0,0,0,.4); }
        .pm-hosp-near { width:30px; height:30px; font-size:16px; background:#22d3ee;
          box-shadow:0 0 12px 3px rgba(34,211,238,.8); }
        .leaflet-tooltip.pm-label { background:#0b1220; color:#e2f2ff;
          border:1px solid rgba(34,211,238,.45); border-radius:6px; font-weight:700;
          padding:2px 7px; box-shadow:0 2px 8px rgba(0,0,0,.45); }
        .leaflet-tooltip.pm-label::before { border-top-color:#0b1220; }
      `}</style>

      <MapContainer
        center={hasUser ? [userLat as number, userLon as number] : GHANA_CENTER}
        zoom={hasUser ? 13 : 7}
        className="h-full w-full"
        scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; OpenStreetMap &copy; Carto'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"/>

        {hasUser && (
          <Marker position={[userLat as number, userLon as number]} icon={youIcon}>
            <Tooltip permanent direction="bottom" offset={[0, 8]} className="pm-label">
              {locationLabel ?? "You are here"}
            </Tooltip>
          </Marker>
        )}

        {facilities.map((f, i) => (
          <Marker key={f.id} position={[f.lat, f.lon]}
                  icon={i === 0 ? nearestIcon : facilityIcon}>
            {i === 0 && (
              <Tooltip permanent direction="top" offset={[0, -30]} className="pm-label">
                {f.name}
              </Tooltip>
            )}
            <Popup>
              <div style={{ minWidth: 170 }}>
                <div style={{ fontWeight: 700 }}>{f.name}</div>
                <div style={{ opacity: .75, fontSize: 12, marginTop: 2 }}>
                  {typeLabel(f.amenity)}{f.district ? ` · ${f.district}` : ""}
                  {f.region ? ` · ${f.region}` : ""}
                </div>
                {f.distance_km != null && (
                  <div style={{ fontSize: 12, marginTop: 2, fontWeight: 600 }}>
                    {f.distance_km} km away
                  </div>
                )}
                {i === 0 && (
                  <div style={{ fontSize: 11, color: "#22d3ee", marginTop: 2 }}>
                    ★ Nearest suitable facility
                  </div>
                )}
                <a href={directionsUrl(userLat, userLon, f)}
                   target="_blank" rel="noreferrer"
                   style={{ color: "#0ea5b7", fontSize: 12, display: "inline-block",
                            marginTop: 5, fontWeight: 600 }}>
                  Get directions →
                </a>
              </div>
            </Popup>
          </Marker>
        ))}

        {hasUser && nearest && (
          <Polyline
            positions={[[userLat as number, userLon as number],
                        [nearest.lat, nearest.lon]]}
            pathOptions={{ color: "#22d3ee", weight: 2, dashArray: "6 6", opacity: 0.9 }}/>
        )}

        <FitBounds points={points}/>
      </MapContainer>

      {/* Directions CTA to the nearest facility */}
      {nearest && (
        <a href={directionsUrl(userLat, userLon, nearest)}
           target="_blank" rel="noreferrer"
           className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000]
                      btn-primary text-sm shadow-glow whitespace-nowrap">
          <Navigation className="w-4 h-4"/> Directions to {nearest.name}
        </a>
      )}

      {/* Hint when no location shared */}
      {!hasUser && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]
                        glass px-3 py-1.5 text-[11px] text-slate-300
                        flex items-center gap-1.5 whitespace-nowrap">
          <Compass className="w-3.5 h-3.5 text-cyan-300"/>
          Tap “Use my GPS” above to see your exact position
        </div>
      )}
    </div>
  );
}
