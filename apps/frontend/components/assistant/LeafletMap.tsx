"use client";

import * as React from "react";

type Pin = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  marriottOwned: boolean;
  selected?: boolean;
};

type Props = {
  center: { lat: number; lng: number };
  pins: Pin[];
  onPinClick?: (id: string) => void;
};

export function LeafletMap({ center, pins, onPinClick }: Props) {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const instanceRef = React.useRef<import("leaflet").Map | null>(null);
  const markersRef = React.useRef<import("leaflet").Marker[]>([]);

  // Initialise map once
  React.useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;

      // Leaflet default icon fix (webpack strips the default asset)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      if (cancelled || !mapRef.current || instanceRef.current) return;

      const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false }).setView(
        [center.lat, center.lng],
        11
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      // Leaflet attribution (small)
      L.control.attribution({ prefix: false, position: "bottomright" }).addTo(map);
      map.attributionControl?.setPrefix(
        '<a href="https://leafletjs.com" target="_blank">Leaflet</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
      );

      instanceRef.current = map;
    })();

    return () => {
      cancelled = true;
      instanceRef.current?.remove();
      instanceRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-centre when center changes
  React.useEffect(() => {
    const map = instanceRef.current;
    if (!map) return;
    map.setView([center.lat, center.lng], 11, { animate: true });
  }, [center.lat, center.lng]);

  // Rebuild price-pin markers when pins change
  React.useEffect(() => {
    const map = instanceRef.current;
    if (!map) return;

    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;

      // Remove old markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      pins.forEach(pin => {
        const isSelected = pin.selected;
        const bg = pin.marriottOwned ? "#059669" : "#2563eb";
        const border = isSelected ? "#fff" : "transparent";
        const scale = isSelected ? "1.15" : "1";

        const icon = L.divIcon({
          className: "",
          iconAnchor: [30, 16],
          html: `<div style="
            display:inline-flex;align-items:center;justify-content:center;
            background:${bg};color:#fff;border-radius:999px;
            padding:4px 10px;font-size:12px;font-weight:700;
            box-shadow:0 2px 8px rgba(0,0,0,0.28);
            border:2px solid ${border};
            transform:scale(${scale});
            white-space:nowrap;cursor:pointer;
          ">${pin.label}</div>`,
        });

        const marker = L.marker([pin.lat, pin.lng], { icon }).addTo(map);
        marker.on("click", () => onPinClick?.(pin.id));
        markersRef.current.push(marker);
      });
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins]);

  return (
    <>
      {/* Leaflet CSS injected via <link> to avoid SSR issues */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
        crossOrigin=""
      />
      <div ref={mapRef} style={{ width: "100%", height: "100%", minHeight: 300 }} />
    </>
  );
}
