'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Crosshair, Layers, Loader2, X, Check, Navigation } from 'lucide-react';

export interface PickedLocation {
  lat: number;
  lng: number;
  address: string;
}

interface Props {
  onPick: (loc: PickedLocation) => void;
  onCancel: () => void;
  lang?: string;
  initial?: PickedLocation | null;
}

const BLR: [number, number] = [12.9716, 77.5946];

const STREET_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const SATELLITE_TILES =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SATELLITE_LABELS =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/ReferenceLabelsOnBasemap/MapServer/tile/{z}/{y}/{x}';

const OSM_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · Imagery &copy; Esri';

// Custom pin — avoids Leaflet's bundled marker images that bundlers can't resolve.
const pinIcon = L.divIcon({
  className: '',
  html: `<div style="transform:translate(-50%,-100%);position:relative">
    <svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 39C15 39 28 24.5 28 14A13 13 0 1 0 2 14c0 10.5 13 25 13 25z" fill="#e94560" stroke="#fff" stroke-width="2.5"/>
      <circle cx="15" cy="14" r="5" fill="#fff"/>
    </svg>
  </div>`,
  iconSize: [30, 40],
  iconAnchor: [15, 40],
});

interface GeoResult {
  place_id: string;
  lat: number;
  lon: number;
  name: string;
  display_name: string;
}

interface PhotonFeature {
  geometry?: { coordinates?: number[] };
  properties?: {
    name?: string;
    street?: string;
    district?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}
interface PhotonResponse { features?: PhotonFeature[] }
interface NominatimResult {
  place_id?: number | string;
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
}

interface PhotonFeature {
  geometry?: { coordinates?: number[] };
  properties?: {
    name?: string;
    street?: string;
    district?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}
interface PhotonResponse { features?: PhotonFeature[] }
interface NominatimResult {
  place_id?: number | string;
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
}

async function searchPlaces(q: string, lang: string, signal?: AbortSignal): Promise<GeoResult[]> {
  if (q.trim().length < 3) return [];
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=${lang === 'kn' ? 'en' : lang}`;
    const res = await fetch(url, { signal });
    if (res.ok) {
      const data = (await res.json()) as PhotonResponse;
      return (data.features || []).map((f, i) => ({
          place_id: `${i}-${f.geometry?.coordinates?.[0] ?? ''}`,
          lat: f.geometry?.coordinates?.[1] ?? 0,
          lon: f.geometry?.coordinates?.[0] ?? 0,
        name: [f.properties?.name, f.properties?.street].filter(Boolean).join(', ') || f.properties?.name || '',
        display_name: [
          f.properties?.name,
          f.properties?.street,
          f.properties?.district,
          f.properties?.city,
          f.properties?.state,
          f.properties?.country,
        ].filter(Boolean).join(', '),
      })).filter((r: GeoResult) => r.display_name);
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
  }

  // Fallback: Nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { signal, headers: { 'Accept-Language': lang } });
    if (!res.ok) return [];
      const data = (await res.json()) as NominatimResult[];
    return (data || []).map((r) => ({
        place_id: String(r.place_id ?? ''),
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
        name: r.name || r.display_name.split(',')[0] || '',
      display_name: r.display_name,
    }));
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    return [];
  }
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`);
    if (res.ok) {
      const d = await res.json();
      const p = d.features?.[0]?.properties;
      if (p) {
        const parts = [p.name, p.street, p.district, p.city, p.state, p.country].filter(Boolean);
        if (parts.length) return parts.join(', ');
      }
    }
  } catch {}
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
    if (res.ok) {
      const d = await res.json();
      if (d.display_name) return d.display_name;
    }
  } catch {}
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

export default function LocationPicker({ onPick, onCancel, lang = 'en', initial }: Props) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const streetLayer = useRef<L.TileLayer | null>(null);
  const satLayer = useRef<L.TileLayer | null>(null);
  const satLabelLayer = useRef<L.TileLayer | null>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [satellite, setSatellite] = useState(false);
  const [picked, setPicked] = useState<PickedLocation | null>(initial ?? null);
  const [resolving, setResolving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapError, setMapError] = useState('');

  const acRef = useRef<AbortController | null>(null);

  const placePin = useCallback(function placePinImpl(lat: number, lng: number, resolve: boolean) {
    const map = mapRef.current;
    if (!map) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(map);
      markerRef.current.on('dragend', () => {
        const p = markerRef.current!.getLatLng();
        placePinImpl(p.lat, p.lng, true);
      });
    }

    if (!map.getBounds().contains([lat, lng])) {
      map.setView([lat, lng], Math.max(map.getZoom(), 17));
    }

    setPicked({ lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });

    if (resolve) {
      setResolving(true);
      reverseGeocode(lat, lng).then(addr => {
        setPicked({ lat, lng, address: addr });
        setResolving(false);
      });
    }
  }, []);

  // Initialise map once
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;

    let map: L.Map | null = null;
    try {
      map = L.map(mapEl.current, {
        center: initial ? [initial.lat, initial.lng] : BLR,
        zoom: initial ? 17 : 12,
        zoomControl: false,
        maxZoom: 20,
      });
    } catch {
      map = null;
    }

    if (!map) {
      setMapError('Could not load the map. Check your connection.');
      return;
    }
    mapRef.current = map;

    streetLayer.current = L.tileLayer(STREET_TILES, {
      attribution: OSM_ATTR,
      maxZoom: 20,
      crossOrigin: true,
    }).addTo(map);

    satLayer.current = L.tileLayer(SATELLITE_TILES, { maxZoom: 20, crossOrigin: true });
    satLabelLayer.current = L.tileLayer(SATELLITE_LABELS, { maxZoom: 18, crossOrigin: true });

    L.control.zoom({ position: 'topright' }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      placePin(e.latlng.lat, e.latlng.lng, true);
    });

    if (initial) placePin(initial.lat, initial.lng, false);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 3) {
      const clear = async () => {
        await Promise.resolve();
        setResults([]);
        setShowResults(false);
        setSearching(false);
      };
      void clear();
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      acRef.current?.abort();
      const ac = new AbortController();
      acRef.current = ac;
      try {
        const r = await searchPlaces(query, lang, ac.signal);
        setResults(r);
        setShowResults(true);
      } catch {
        // aborted
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query, lang]);

  const chooseResult = (r: GeoResult) => {
    const map = mapRef.current;
    if (map) map.setView([r.lat, r.lon], 17);
    placePin(r.lat, r.lon, false);
    setPicked({ lat: r.lat, lng: r.lon, address: r.display_name });
    setShowResults(false);
    setQuery(r.display_name);
  };

  const toggleLayers = () => {
    const map = mapRef.current;
    if (!map) return;
    const next = !satellite;
    setSatellite(next);
    if (next) {
      map.removeLayer(streetLayer.current!);
      satLayer.current!.addTo(map);
      satLabelLayer.current!.addTo(map);
    } else {
      map.removeLayer(satLayer.current!);
      map.removeLayer(satLabelLayer.current!);
      streetLayer.current!.addTo(map);
    }
    // keep the pin above tiles
    if (markerRef.current) markerRef.current.setZIndexOffset(1000);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setMapError('Location is not available on this device.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocating(false);
        setMapError('');
        const { latitude, longitude } = pos.coords;
        mapRef.current?.setView([latitude, longitude], 18);
        placePin(latitude, longitude, true);
      },
      () => {
        setLocating(false);
        setMapError('Could not get your location. Drop a pin on the map instead.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  };

  const label = {
    en: { search: 'Search place, road or signal…', use: 'Use this location', loc: 'My location', skip: 'Skip', sat: 'Satellite', map: 'Map', drop: 'Tap the map to drop a pin' },
    kn: { search: 'ಸ್ಥಳ, ರಸ್ತೆ ಅಥವಾ ಸಿಗ್ನಲ್ ಹುಡುಕಿ…', use: 'ಈ ಸ್ಥಳವನ್ನು ಬಳಸಿ', loc: 'ನನ್ನ ಸ್ಥಳ', skip: 'ಬಿಟ್ಟುಬಿಡಿ', sat: 'ಉಪಗ್ರಹ', map: 'ನಕ್ಷೆ', drop: 'ಪಿನ್ ಇಡಲು ನಕ್ಷೆ ಮೇಲೆ ಟ್ಯಾಪ್ ಮಾಡಿ' },
    hi: { search: 'जगह, सड़क या सिग्नल खोजें…', use: 'यह स्थान उपयोग करें', loc: 'मेरी लोकेशन', skip: 'छोड़ें', sat: 'सैटेलाइट', map: 'मैप', drop: 'पिन रखने के लिए मैप पर टैप करें' },
    te: { search: 'ప్రదేశం, రోడ్డు లేదా సిగ్నల్ వెతకండి…', use: 'ఈ ప్రదేశాన్ని ఉపయోగించండి', loc: 'నా స్థానం', skip: 'వదిలివేయి', sat: 'ఉపగ్రహ', map: 'మ్యాప్', drop: 'పిన్ పెట్టడానికి మ్యాప్‌పై నొక్కండి' },
  }[lang] || null;
  const L10N = label || { search: 'Search place, road or signal…', use: 'Use this location', loc: 'My location', skip: 'Skip', sat: 'Satellite', map: 'Map', drop: 'Tap the map to drop a pin' };

  return (
    <div className="bg-white border border-primary/30 rounded-2xl overflow-hidden shadow-lg space-y-0">
      {/* Search bar */}
      <div className="p-3 pb-2 relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && results[0]) chooseResult(results[0]);
                if (e.key === 'Escape') setShowResults(false);
              }}
              placeholder={L10N.search}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            />
            {searching && (
              <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin" />
            )}
            {!searching && query && (
              <button onClick={() => { setQuery(''); setResults([]); setShowResults(false); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={useMyLocation}
            disabled={locating}
            title={L10N.loc}
            className="px-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition disabled:opacity-50 flex items-center gap-1.5 text-xs font-medium"
          >
            {locating ? <Loader2 size={14} className="animate-spin" /> : <Crosshair size={14} />}
          </button>
        </div>

        {/* Autocomplete results */}
        {showResults && results.length > 0 && (
          <div className="absolute left-3 right-3 top-[62px] z-[1000] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
            {results.map(r => (
              <button
                key={r.place_id}
                onClick={() => chooseResult(r)}
                className="w-full text-left px-3 py-2.5 hover:bg-primary/5 border-b border-gray-100 last:border-0 flex items-start gap-2"
              >
                <MapPin size={14} className="text-primary flex-shrink-0 mt-0.5" />
                <span className="text-xs text-gray-700 leading-snug">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
        {showResults && query.trim().length >= 3 && results.length === 0 && !searching && (
          <div className="absolute left-3 right-3 top-[62px] z-[1000] bg-white border border-gray-200 rounded-xl shadow-xl p-3 text-xs text-gray-500">
            No place found. Keep typing — you can save what you entered as text.
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative">
        <div ref={mapEl} className="h-[260px] w-full bg-gray-100" />
        {mapError && (
          <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center text-center p-4 gap-2">
            <p className="text-sm text-gray-600">{mapError}</p>
          </div>
        )}
        <button
          onClick={toggleLayers}
          className="absolute bottom-3 right-3 z-[500] px-3 py-2 rounded-xl bg-white shadow border border-gray-200 text-xs font-medium flex items-center gap-1.5 hover:bg-gray-50 transition"
        >
          <Layers size={13} className="text-primary" />
          {satellite ? L10N.map : L10N.sat}
        </button>
        <div className="absolute bottom-3 left-3 z-[500] bg-white/90 backdrop-blur px-2.5 py-1.5 rounded-lg text-[10px] text-gray-500 shadow border border-gray-100">
          {L10N.drop}
        </div>
      </div>

      {/* Picked address */}
      <div className="p-3 pt-2.5 space-y-2.5 border-t border-gray-100">
        {picked ? (
          <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
            <Navigation size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-gray-800 leading-snug break-words">
                {resolving ? 'Finding address…' : picked.address}
              </p>
              <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                {picked.lat.toFixed(6)}, {picked.lng.toFixed(6)}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center">Search a place or tap the map to set the location.</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
          >
            {L10N.skip}
          </button>
          <button
            onClick={() => picked && onPick(picked)}
            disabled={!picked || resolving}
            className="flex-1 gradient-bg text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Check size={16} /> {L10N.use}
          </button>
        </div>
      </div>
    </div>
  );
}
