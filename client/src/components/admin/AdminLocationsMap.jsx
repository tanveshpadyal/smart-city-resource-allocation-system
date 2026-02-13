import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export const AdminLocationsMap = ({ locations = [] }) => {
  const center = locations.length
    ? [locations[0].location.lat, locations[0].location.lng]
    : [18.5204, 73.8567];

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-neutral-900 mb-4">
        Complaint Locations
      </h3>
      <div className="h-96 w-full overflow-hidden rounded-lg border border-neutral-200">
        <MapContainer
          center={center}
          zoom={12}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MarkerClusterGroup chunkedLoading>
            {locations.map((item) => (
              <Marker
                key={item._id}
                position={[item.location.lat, item.location.lng]}
              >
                <Popup>
                  <div className="space-y-1">
                    <p className="font-semibold text-neutral-900">
                      {item.title}
                    </p>
                    <p className="text-xs text-neutral-700">
                      Category: {item.category}
                    </p>
                    <p className="text-xs text-neutral-700">
                      Status: {item.status}
                    </p>
                    <p className="text-xs text-neutral-700">
                      Area: {item.location.area || "-"}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>
    </div>
  );
};

export default AdminLocationsMap;
