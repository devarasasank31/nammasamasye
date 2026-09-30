'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  title: string;
  category: string;
  priority: string;
  citizens: number;
  createdAt: string;
}

export interface MapHotspot {
  id: string;
  lat: number;
  lng: number;
  label: string;
  count: number;
  p1: number;
}

const PRIORITY_FILL: Record<string, string> = {
  P1: '#ef4444',
  P2: '#f97316',
  P3: '#f59e0b',
  P4: '#38bdf8',
};

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default function AdminIssueMap({ points, hotspots }: { points: MapPoint[]; hotspots: MapHotspot[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: true, attributionControl: false, zoomControl: true }).setView([12.9716, 77.5946], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '',
    }).addTo(map);
    const layer = L.layerGroup().addTo(map);
    layerRef.current = layer;
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();

    hotspots.forEach(h => {
      L.circle([h.lat, h.lng], {
        radius: 350 + h.count * 70,
        color: h.p1 > 0 ? '#dc2626' : '#f97316',
        weight: 2,
        dashArray: '5 5',
        fillOpacity: 0.1,
      })
        .bindPopup(
          `<b>${esc(h.label)}</b><br/>${h.count} report(s)${h.p1 ? `, ${h.p1} P1` : ''}<br/>Recurring hotspot`
        )
        .addTo(layer);
    });

    points.forEach(p => {
      L.circleMarker([p.lat, p.lng], {
        radius: p.citizens > 1 ? 8 : 5,
        color: '#ffffff',
        weight: 1,
        fillColor: PRIORITY_FILL[p.priority] || '#64748b',
        fillOpacity: 0.92,
      })
        .bindPopup(
          `<b>${esc(p.title)}</b><br/>${esc(p.category)} &middot; ${esc(p.priority)}<br/>${p.citizens} citizen(s) &middot; ${esc(p.createdAt.slice(0, 10))}`
        )
        .addTo(layer);
    });
  }, [points, hotspots]);

  return (
    <div
      ref={containerRef}
      data-testid="admin-map"
      className="w-full rounded-xl border border-gray-200"
      style={{ height: 440 }}
    />
  );
}
