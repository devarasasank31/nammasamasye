'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Loader2, Crosshair } from 'lucide-react';

interface Props {
  lat: number;
  lng: number;
  label?: string;
  height?: number;
}

const pinIcon = L.divIcon({
  className: '',
  html: `<div style="transform:translate(-50%,-100%);position:relative">
    <svg width="26" height="36" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 39C15 39 28 24.5 28 14A13 13 0 1 0 2 14c0 10.5 13 25 13 25z" fill="#e94560" stroke="#fff" stroke-width="2.5"/>
      <circle cx="15" cy="14" r="5" fill="#fff"/>
    </svg>
  </div>`,
  iconSize: [26, 36],
  iconAnchor: [13, 36],
});

export default function StaticMap({ lat, lng, label, height = 200 }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!el.current || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      setFailed(true);
      return;
    }

    let map: L.Map;
    try {
      map = L.map(el.current, {
        center: [lat, lng],
        zoom: 17,
        zoomControl: false,
        attributionControl: true,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        keyboard: false,
      });
    } catch {
      setFailed(true);
      return;
    }

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 20,
      crossOrigin: true,
    }).addTo(map);

    L.marker([lat, lng], { icon: pinIcon }).addTo(map);

    // Tiles may load after the map sizes itself
    setTimeout(() => map.invalidateSize(), 250);

    return () => {
      map.remove();
    };
  }, [lat, lng]);

  if (failed) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
        <MapPin size={14} className="text-primary" />
        Reported location
      </div>
      <div
        ref={el}
        style={{ height }}
        className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100"
      >
        <span className="absolute top-2 left-2 z-[500] bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-mono text-gray-600 shadow border border-gray-200 flex items-center gap-1">
          <Crosshair size={10} className="text-primary" />
          {lat.toFixed(6)}, {lng.toFixed(6)}
        </span>
        {label && (
          <span className="absolute bottom-2 left-2 right-14 z-[500] bg-white/92 backdrop-blur px-2 py-1.5 rounded-lg text-[10px] text-gray-700 shadow border border-gray-200 truncate">
            {label}
          </span>
        )}
      </div>
      <p className="text-[10px] text-gray-400">Map data © OpenStreetMap contributors</p>
    </div>
  );
}
