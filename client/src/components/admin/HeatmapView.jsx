import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import requestService from "../../services/requestService";

const PUNE_CENTER = [18.5204, 73.8567];

const HeatLayer = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || points.length === 0) return undefined;

    const layer = L.heatLayer(points, {
      radius: 24,
      blur: 18,
      maxZoom: 17,
      minOpacity: 0.3,
      gradient: {
        0.2: "#60a5fa",
        0.45: "#34d399",
        0.65: "#fbbf24",
        1.0: "#f43f5e",
      },
    }).addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [map, points]);

  return null;
};

const HeatmapSkeleton = () => (
  <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#020617]">
    <div className="h-4 w-44 rounded bg-slate-200 dark:bg-slate-800" />
    <div className="mt-4 h-96 rounded bg-slate-100 dark:bg-slate-900" />
  </div>
);

const HeatmapView = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await requestService.getAdminLocations();
        const rows = response?.data || response || [];
        setLocations(rows);
      } catch (err) {
        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "Failed to load heatmap locations",
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const validRows = useMemo(
    () =>
      locations.filter(
        (item) =>
          typeof item?.location?.lat === "number" &&
          typeof item?.location?.lng === "number" &&
          !Number.isNaN(item.location.lat) &&
          !Number.isNaN(item.location.lng),
      ),
    [locations],
  );

  const heatPoints = useMemo(
    () =>
      validRows.map((item) => {
        const statusWeight =
          item.status === "RESOLVED"
            ? 0.4
            : item.status === "IN_PROGRESS"
              ? 0.8
              : 0.6;
        return [item.location.lat, item.location.lng, statusWeight];
      }),
    [validRows],
  );

  const center = validRows.length
    ? [validRows[0].location.lat, validRows[0].location.lng]
    : PUNE_CENTER;

  if (loading) return <HeatmapSkeleton />;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md shadow-slate-200/70 dark:border-slate-800 dark:bg-[#020617] dark:shadow-black/40">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200">
        Complaint Density Heatmap (Pune)
      </h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Low to high concentration of complaint locations.
      </p>

      {error ? (
        <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
          {error}
        </p>
      ) : (
        <div className="relative mt-4 h-96 w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full w-full">
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <HeatLayer points={heatPoints} />

            {validRows.map((item) => (
              <CircleMarker
                key={item._id || `${item.location.lat}-${item.location.lng}-${item.category}`}
                center={[item.location.lat, item.location.lng]}
                radius={6}
                pathOptions={{
                  color: "#6366f1",
                  fillColor: "#6366f1",
                  fillOpacity: 0.35,
                }}
              >
                <Popup>
                  <div className="space-y-1 text-xs">
                    <p>
                      <strong>Area:</strong> {item.location.area || "-"}
                    </p>
                    <p>
                      <strong>Category:</strong> {item.category || "-"}
                    </p>
                    <p>
                      <strong>Status:</strong> {item.status || "-"}
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          <div className="pointer-events-none absolute bottom-3 right-3 rounded-lg bg-white/90 p-2 text-[11px] text-slate-700 shadow-sm backdrop-blur dark:bg-[#020617cc] dark:text-slate-300">
            <p className="mb-1 font-semibold">Density</p>
            <div className="h-2 w-28 rounded bg-gradient-to-r from-blue-400 via-emerald-400 via-50% to-rose-500" />
            <div className="mt-1 flex justify-between">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeatmapView;
