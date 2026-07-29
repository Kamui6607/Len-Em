// ============================================================
// MapPicker — Leaflet-based map component for pinning location
// ============================================================
// Flow:
//   1. User clicks on map → drops a pin
//   2. Reverse geocode (Nominatim) resolves lat/lng → address strings
//   3. Returns { lat, lng, provinceName, districtName, wardName, street }
//
// NOTE: For production, replace Nominatim with Mapbox/Google Maps
// by providing VITE_MAPBOX_TOKEN in .env and using Mapbox API.
// ============================================================

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Loader2, Crosshair } from "lucide-react";
import type { ReverseGeocodeResult } from "../../types/address.types";

// ── Props ──
export interface MapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (result: ReverseGeocodeResult) => void;
  mapboxToken?: string;
}

const DEFAULT_CENTER: [number, number] = [10.8231, 106.6297];
const DEFAULT_ZOOM = 12;

// ── Nominatim reverse geocode ──
async function reverseGeocodeNominatim(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=vi`;
  const res = await fetch(url, {
    headers: { "User-Agent": "YarnShop/1.0 (lenem@example.com)" },
  });
  if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);
  const data = await res.json();
  const addr = data.address || {};

  // Vietnamese address structure in Nominatim:
  //   - Ward: suburb, neighbourhood, village, town, quarter, hamlet
  //   - District: city_district, county, district
  //   - Province: state, city, region
  //   - Street: road, pedestrian, footway, residential
  const wardName = addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.quarter || addr.hamlet || "";
  const districtName = addr.city_district || addr.county || addr.district || "";
  const provinceName = addr.state || addr.city || addr.region || "";
  const street = addr.road || addr.pedestrian || addr.footway || addr.residential || addr.house_number
    ? `${addr.road || addr.pedestrian || addr.footway || addr.residential || ""} ${addr.house_number || ""}`.trim()
    : addr.display_name?.split(",")[0]?.trim() || "";

  // Fallback: parse display_name if Nominatim didn't return structured data
  // display_name format: "Street, Ward, District, Province, Vietnam"
  let fallbackWard = wardName;
  let fallbackDistrict = districtName;
  let fallbackProvince = provinceName;
  if (!wardName || !districtName || !provinceName) {
    const parts = (data.display_name || "").split(",").map((s: string) => s.trim());
    // Last part is "Vietnam", second-to-last is province, third-to-last is district, fourth-to-last is ward
    if (parts.length >= 3) {
      if (!fallbackProvince) fallbackProvince = parts[parts.length - 2] || "";
      if (!fallbackDistrict) fallbackDistrict = parts[parts.length - 3] || "";
      if (!fallbackWard) fallbackWard = parts[parts.length - 4] || "";
    }
  }

  return {
    fullAddress: data.display_name || "",
    street,
    wardName: fallbackWard,
    districtName: fallbackDistrict,
    provinceName: fallbackProvince,
    countryCode: addr.country_code?.toUpperCase() || "VN",
    lat, lng,
  };
}

// ── Mapbox reverse geocode ──
async function reverseGeocodeMapbox(lat: number, lng: number, token: string): Promise<ReverseGeocodeResult> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&types=address,place,locality,neighborhood,district,region&language=vi`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Mapbox error: ${res.status}`);
  const data = await res.json();
  const features = data.features || [];
  const context: Record<string, string> = {};
  for (const feature of features) {
    if (feature.context) {
      for (const ctx of feature.context) {
        const idParts = ctx.id.split(".");
        if (idParts.length >= 2) context[idParts[0]] = ctx.text;
      }
    }
  }
  return {
    fullAddress: features[0]?.place_name || "",
    street: features[0]?.place_name?.split(",")[0]?.trim() || "",
    wardName: context.neighborhood || context.locality || "",
    districtName: context.district || "",
    provinceName: context.region || "",
    countryCode: "VN",
    lat, lng,
  };
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function MapPicker({
  initialLat,
  initialLng,
  onLocationSelect,
  mapboxToken,
}: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const initStartedRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ReverseGeocodeResult | null>(null);

  const doReverseGeocodeRef = useRef<(lat: number, lng: number) => Promise<void>>(async () => {});

  const doReverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      setLoading(true);
      try {
        const result = mapboxToken
          ? await reverseGeocodeMapbox(lat, lng, mapboxToken)
          : await reverseGeocodeNominatim(lat, lng);
        setSelectedResult(result);
        onLocationSelect(result);
      } catch (error) {
        console.error("Reverse geocode failed:", error);
        const fallback: ReverseGeocodeResult = {
          fullAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          street: "", wardName: "", districtName: "", provinceName: "",
          countryCode: "VN", lat, lng,
        };
        setSelectedResult(fallback);
        onLocationSelect(fallback);
      } finally {
        setLoading(false);
      }
    },
    [mapboxToken, onLocationSelect]
  );

  doReverseGeocodeRef.current = doReverseGeocode;

  // Initialize Leaflet map — only once per component lifetime
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || initStartedRef.current) return;

    // Mark that we've started initialization (synchronous, before async import)
    initStartedRef.current = true;

    import("leaflet").then((L) => {
      // Guard 1: Already created our map reference
      if (mapRef.current) return;
      // Guard 2: Container removed from DOM
      if (!container.isConnected) return;
      // Guard 3: Leaflet already initialized this container (StrictMode race)
      if ((container as unknown as Record<string, unknown>)._leaflet_id !== undefined) return;

      // Fix default icon paths
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const center: [number, number] = initialLat && initialLng ? [initialLat, initialLng] : DEFAULT_CENTER;
      const map = L.map(container, { center, zoom: DEFAULT_ZOOM, zoomControl: true, attributionControl: true });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      if (initialLat && initialLng) {
        const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
        markerRef.current = marker;
        doReverseGeocodeRef.current(initialLat, initialLng);
      }

      map.on("click", async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
          markerRef.current = marker;
          marker.on("dragend", async () => {
            const pos = marker.getLatLng();
            await doReverseGeocodeRef.current(pos.lat, pos.lng);
          });
        }
        await doReverseGeocodeRef.current(lat, lng);
      });

      if (markerRef.current) {
        markerRef.current.on("dragend", async () => {
          const pos = markerRef.current!.getLatLng();
          await doReverseGeocodeRef.current(pos.lat, pos.lng);
        });
      }

      mapRef.current = map;
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      // Reset init flag so component can be re-initialized if needed
      initStartedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 15);
          if (markerRef.current) {
            markerRef.current.setLatLng([latitude, longitude]);
          } else {
            const L = await import("leaflet");
            const marker = L.marker([latitude, longitude], { draggable: true }).addTo(mapRef.current);
            markerRef.current = marker;
            marker.on("dragend", async () => {
              const pos = marker.getLatLng();
              await doReverseGeocodeRef.current(pos.lat, pos.lng);
            });
          }
          await doReverseGeocodeRef.current(latitude, longitude);
        }
      },
      (error) => console.error("Geolocation error:", error),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl overflow-hidden border-2 border-border">
        <div ref={mapContainerRef} className="w-full h-[300px] md:h-[400px]" />
        {loading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-[1000]">
            <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-full shadow-lg">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm font-medium">Đang xác định địa chỉ...</span>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleLocateMe}
          className="absolute top-3 right-3 z-[1000] bg-card border border-border rounded-full p-2.5 shadow-md hover:bg-muted transition-colors"
          title="Vị trí của tôi"
        >
          <Crosshair className="w-4 h-4 text-primary" />
        </button>
        <div className="absolute bottom-3 left-3 z-[1000] bg-card/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm border border-border text-xs text-muted-foreground flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          Click vào bản đồ để chọn vị trí
        </div>
      </div>
      {selectedResult && (
        <div className="bg-card rounded-xl border border-border p-4 space-y-1.5">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium">{selectedResult.street || "Đang cập nhật..."}</p>
              <p className="text-xs text-muted-foreground">
                {[selectedResult.wardName, selectedResult.districtName, selectedResult.provinceName].filter(Boolean).join(", ") || "Đang xác định..."}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tọa độ: {selectedResult.lat.toFixed(6)}, {selectedResult.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}