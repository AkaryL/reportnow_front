import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Vehicle, Geofence } from '../../lib/types';
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM, VEHICLE_STATUS_CONFIG } from '../../lib/constants';

interface MapViewProps {
  vehicles: Vehicle[];
  geofences?: Geofence[];
  onVehicleClick?: (vehicle: Vehicle) => void;
  className?: string;
  showGeofences?: boolean;
  center?: [number, number];
  zoom?: number;
}

export function MapView({
  vehicles,
  geofences = [],
  onVehicleClick,
  className = '',
  showGeofences = true,
  center = MAP_DEFAULT_CENTER,
  zoom = MAP_DEFAULT_ZOOM,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<Map<string, maplibregl.Marker>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);
  const initialFitDone = useRef(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: center,
      zoom: zoom,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      markers.current.forEach((marker) => marker.remove());
      markers.current.clear();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update vehicle markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove markers that no longer exist
    const currentVehicleIds = new Set(vehicles.map((v) => v.id));
    markers.current.forEach((marker, id) => {
      if (!currentVehicleIds.has(id)) {
        marker.remove();
        markers.current.delete(id);
      }
    });

    // Add or update markers
    vehicles.forEach((vehicle) => {
      const existingMarker = markers.current.get(vehicle.id);

      if (existingMarker) {
        // Update position
        existingMarker.setLngLat([vehicle.lng, vehicle.lat]);
      } else {
        // Create new marker with car icon
        const el = document.createElement('div');
        el.className = 'vehicle-marker';
        el.style.width = '40px';
        el.style.height = '40px';
        el.style.cursor = 'pointer';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.position = 'relative';

        // Car icon SVG from lucide-react (Car icon)
        el.innerHTML = `
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="${VEHICLE_STATUS_CONFIG[vehicle.status].markerColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
            <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/>
            <circle cx="6.5" cy="16.5" r="2.5" fill="${VEHICLE_STATUS_CONFIG[vehicle.status].markerColor}"/>
            <circle cx="16.5" cy="16.5" r="2.5" fill="${VEHICLE_STATUS_CONFIG[vehicle.status].markerColor}"/>
          </svg>
        `;

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([vehicle.lng, vehicle.lat])
          .addTo(map.current!);

        // Add popup
        const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="font-weight: 600; margin: 0 0 8px 0; font-size: 14px;">${vehicle.plate}</h3>
            <div style="font-size: 12px; color: #666;">
              <div style="margin: 4px 0;"><strong>Conductor:</strong> ${vehicle.driver}</div>
              <div style="margin: 4px 0;"><strong>Velocidad:</strong> ${vehicle.speed} km/h</div>
              <div style="margin: 4px 0;"><strong>Combustible:</strong> ${Math.round(vehicle.fuel)}%</div>
              <div style="margin: 4px 0;"><strong>Estado:</strong> ${VEHICLE_STATUS_CONFIG[vehicle.status].label}</div>
            </div>
          </div>
        `);

        marker.setPopup(popup);

        if (onVehicleClick) {
          el.addEventListener('click', () => {
            onVehicleClick(vehicle);
          });
        }

        markers.current.set(vehicle.id, marker);
      }
    });
  }, [vehicles, mapLoaded, onVehicleClick]);

  // Add geofences
  useEffect(() => {
    if (!map.current || !mapLoaded || !showGeofences) return;

    // Remove existing geofence layers
    if (map.current.getLayer('geofences-fill')) {
      map.current.removeLayer('geofences-fill');
    }
    if (map.current.getLayer('geofences-line')) {
      map.current.removeLayer('geofences-line');
    }
    if (map.current.getSource('geofences')) {
      map.current.removeSource('geofences');
    }

    if (geofences.length === 0) return;

    // Add geofences source
    map.current.addSource('geofences', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: geofences.map((gf) => ({
          type: 'Feature',
          properties: {
            id: gf.id,
            name: gf.name,
            policy: gf.policy,
            color: gf.color,
          },
          geometry: gf.geom as any,
        })),
      },
    });

    // Add fill layer
    map.current.addLayer({
      id: 'geofences-fill',
      type: 'fill',
      source: 'geofences',
      paint: {
        'fill-color': ['get', 'color'],
        'fill-opacity': 0.2,
      },
    });

    // Add outline layer
    map.current.addLayer({
      id: 'geofences-line',
      type: 'line',
      source: 'geofences',
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 2,
      },
    });

    // Add popup on click
    map.current.on('click', 'geofences-fill', (e) => {
      if (!e.features || e.features.length === 0) return;

      const feature = e.features[0];
      const props = feature.properties;

      new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`
          <div style="padding: 8px;">
            <h3 style="font-weight: 600; margin: 0 0 8px 0; font-size: 14px;">${props.name}</h3>
            <div style="font-size: 12px; color: #666;">
              <div style="margin: 4px 0;"><strong>Política:</strong> ${props.policy}</div>
            </div>
          </div>
        `)
        .addTo(map.current!);
    });

    // Change cursor on hover
    map.current.on('mouseenter', 'geofences-fill', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });

    map.current.on('mouseleave', 'geofences-fill', () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
    });
  }, [geofences, mapLoaded, showGeofences]);

  // Center on all vehicles only once on initial load
  useEffect(() => {
    if (!map.current || !mapLoaded || vehicles.length === 0 || initialFitDone.current) return;

    const bounds = new maplibregl.LngLatBounds();
    vehicles.forEach((vehicle) => {
      bounds.extend([vehicle.lng, vehicle.lat]);
    });

    map.current.fitBounds(bounds, {
      padding: 50,
      maxZoom: 14,
      duration: 1000, // Smooth animation
    });

    initialFitDone.current = true;
  }, [vehicles.length, mapLoaded]);

  return (
    <div
      ref={mapContainer}
      className={`w-full h-full rounded-lg ${className}`}
      style={{ minHeight: '400px' }}
    />
  );
}
